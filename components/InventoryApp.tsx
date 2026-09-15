"use client";

import { useEffect, useMemo, useState } from "react";
import { PRODUCTS } from "@/lib/products";
import {
  emptyMap,
  finalStock,
  movementRows,
  recommend,
  recommendedOrderDate,
  sorted,
  totals
} from "@/lib/engine";
import { loadRecords, saveRecords, exportRecords, loadLocalOrders, saveLocalOrders } from "@/lib/storage";
import { parseQuickEntry } from "@/lib/quickEntry";
import {
  getAuthUser,
  loadCloudOrders,
  loadCloudRecords,
  loadForecastAccuracy,
  loadForecastSummary,
  reconcileForecastAccuracy,
  saveApprovedOrder,
  saveCloudDailyRecord,
  saveCloudOperation,
  signOut
} from "@/lib/cloud";
import { supabase } from "@/lib/supabase";
import AuthPanel from "./AuthPanel";
import type {
  CloudOrder,
  DailyRecord,
  ForecastAccuracyRow,
  ForecastSummary,
  OperationType,
  QuantityMap
} from "@/lib/types";
import { exportCurrentInventoryCsv, exportDailyMovementCsv, exportOrderCsv, downloadOrderIcs, exportInventoryXlsx, exportInventoryPdf } from "@/lib/reports";
import { openGoogleCalendarDraft } from "@/lib/calendar";
import { downloadFullBackup } from "@/lib/backup";
import { askInventoryAI } from "@/lib/ai";

type Tab = "count" | "operations" | "movement" | "orders" | "intelligence" | "assistant" | "quick" | "history";

function nowDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}
function productName(id: string) {
  return PRODUCTS.find(p => p.id === id)?.name ?? id;
}
function operationLabel(type: OperationType) {
  return {
    receiving: "Warehouse Receiving",
    waste: "Waste",
    adjustment: "Adjustment"
  }[type];
}

export default function InventoryApp() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [orders, setOrders] = useState<CloudOrder[]>([]);
  const [forecastRows, setForecastRows] = useState<ForecastAccuracyRow[]>([]);
  const [forecastSummary, setForecastSummary] = useState<ForecastSummary>({overallAccuracy:null,bestProduct:null,worstProduct:null,mostUnderForecast:null,mostOverForecast:null,reconciledRows:0});
  const [tab, setTab] = useState<Tab>("count");

  const [date, setDate] = useState(nowDate());
  const [time, setTime] = useState(nowTime());
  const [reportedBy, setReportedBy] = useState("Vignesh");
  const [physical, setPhysical] = useState<QuantityMap>(emptyMap());
  const [receiving, setReceiving] = useState<QuantityMap>(emptyMap());

  const [quick, setQuick] = useState("");
  const [mode, setMode] = useState<"tomorrow" | "weekly" | "weekend" | "emergency">("tomorrow");
  const [approved, setApproved] = useState<QuantityMap>(emptyMap());

  const [opType, setOpType] = useState<OperationType>("receiving");
  const [opDate, setOpDate] = useState(nowDate());
  const [opTime, setOpTime] = useState(nowTime());
  const [opLabel, setOpLabel] = useState("");
  const [opReason, setOpReason] = useState("");
  const [opQty, setOpQty] = useState<QuantityMap>(emptyMap());

  const [aiQuestion,setAiQuestion]=useState("");
  const [aiAnswer,setAiAnswer]=useState("");
  const [aiBusy,setAiBusy]=useState(false);

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(true);
  const [status, setStatus] = useState("Checking cloud connection…");

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      if (session?.user) refreshCloud();
    });
    bootstrap();
    return () => sub.data.subscription.unsubscribe();
  }, []);

  async function bootstrap() {
    const user = await getAuthUser();
    if (user) {
      setUserEmail(user.email ?? "Signed in");
      await refreshCloud();
    } else {
      const local = loadRecords();
      setRecords(local);
      setOrders(loadLocalOrders());
      setSyncing(false);
      setStatus("Local fallback • sign in to sync");
    }
  }

  async function refreshCloud() {
    setSyncing(true);
    setStatus("Syncing exact stock ledger…");
    try {
      const cloud = await loadCloudRecords();
      if (cloud.length) {
        await reconcileForecastAccuracy(cloud);
      }
      const [cloudOrders, fRows, fSummary] = await Promise.all([
        loadCloudOrders(),
        loadForecastAccuracy(),
        loadForecastSummary()
      ]);
      setForecastRows(fRows);
      setForecastSummary(fSummary);
      if (cloud.length) {
        setRecords(cloud);
        saveRecords(cloud);
        setStatus(`Cloud synced • ${cloud.length} counts • exact event ledger active`);
      } else {
        // A signed-in account with no cloud counts starts clean. Never mix the
        // bundled/local demonstration history into a new operational ledger.
        setRecords([]);
        saveRecords([]);
        setStatus("Cloud connected • ready for today's first physical count");
      }
      setOrders(cloudOrders);
    } catch (e) {
      console.error(e);
      setRecords(loadRecords());
      setStatus("Cloud error • using local backup");
    } finally {
      setSyncing(false);
    }
  }

  const ordered = useMemo(() => sorted(records), [records]);
  const latest = ordered.at(-1) ?? null;
  const movement = useMemo(() => movementRows(records), [records]);
  const recs = useMemo(() => recommend(records, mode), [records, mode]);
  const orderFor = useMemo(() => recommendedOrderDate(records, mode), [records, mode]);
  const sum = totals(latest);

  useEffect(() => {
    setApproved(Object.fromEntries(recs.map(r => [r.productId, r.recommended])));
  }, [recs]);

  function setQ(
    setter: React.Dispatch<React.SetStateAction<QuantityMap>>,
    id: string,
    v: number
  ) {
    setter(prev => ({ ...prev, [id]: Number.isFinite(v) ? v : 0 }));
  }

  function loadLatest() {
    if (!latest) return;
    setPhysical(
      Object.fromEntries(PRODUCTS.map(p => [p.id, finalStock(latest, p.id)]))
    );
  }

  async function saveDay() {
    if (!PRODUCTS.some(p => Number(physical[p.id] || 0) > 0)) {
      alert("Enter the physical stock count before saving. An all-zero report is blocked to prevent accidental stockout data.");
      return;
    }
    const temp: DailyRecord = {
      id: crypto.randomUUID(),
      date,
      time,
      reportedBy: reportedBy || "Vignesh",
      physical: { ...physical },
      receiving: { ...receiving },
      transferIn: emptyMap(),
      transferOut: emptyMap(),
      waste: emptyMap(),
      returns: emptyMap(),
      adjustments: emptyMap(),
      createdAt: new Date().toISOString()
    };

    if (userEmail) {
      setSyncing(true);
      setStatus("Saving daily count to cloud…");
      try {
        await saveCloudDailyRecord({
          date,
          time,
          reportedBy: reportedBy || "Vignesh",
          physical,
          receiving
        });
        await refreshCloud();
        setPhysical(emptyMap());
        setReceiving(emptyMap());
        alert("Daily count saved to Supabase.");
      } catch (e: any) {
        setStatus("Cloud save failed • nothing was silently overwritten");
        alert(e?.message || "Cloud save failed");
        setSyncing(false);
      }
    } else {
      const next = [...records, temp];
      setRecords(next);
      saveRecords(next);
      setPhysical(emptyMap());
      setReceiving(emptyMap());
      alert("Saved locally. Sign in later to use cloud.");
    }
  }

  async function saveOperation() {
    const entered = PRODUCTS.filter(p => Number(opQty[p.id] || 0) !== 0);
    if (!entered.length) {
      alert("Enter at least one quantity.");
      return;
    }
    if (opType === "waste" && latest) {
      const over = entered.find(p => Math.abs(Number(opQty[p.id])) > finalStock(latest, p.id));
      if (over) {
        alert(`${over.name} quantity is higher than current stock (${finalStock(latest, over.id)}). Enter a stock adjustment first if the physical stock is different.`);
        return;
      }
    }
    if (!userEmail) {
      if (!latest) {
        alert("Save the first daily physical count before recording an operation.");
        return;
      }
      if (`${opDate}T${opTime}` < `${latest.date}T${latest.time}`) {
        alert("This operation is earlier than the latest physical count. Change the date/time or enter a correction.");
        return;
      }
      const next = records.map(r => {
        if (r.id !== latest.id) return r;
        const updated: DailyRecord = { ...r };
        const field = opType;
        if (field === "adjustment") {
          updated.adjustments = { ...r.adjustments };
          entered.forEach(p => {
            updated.adjustments[p.id] = Number(updated.adjustments[p.id] || 0) + Number(opQty[p.id] || 0);
          });
        } else {
          const key = field as "receiving" | "waste";
          updated[key] = { ...r[key] };
          entered.forEach(p => {
            updated[key][p.id] = Number(updated[key][p.id] || 0) + Math.abs(Number(opQty[p.id] || 0));
          });
        }
        return updated;
      });
      setRecords(next);
      saveRecords(next);
      setOpQty(emptyMap());
      setOpLabel("");
      setOpReason("");
      alert(`${operationLabel(opType)} saved locally.`);
      return;
    }
    setSyncing(true);
    try {
      await saveCloudOperation({
        type: opType,
        date: opDate,
        time: opTime,
        quantities: opQty,
        label: opLabel,
        reason: opReason
      });
      setOpQty(emptyMap());
      setOpLabel("");
      setOpReason("");
      await refreshCloud();
      alert(`${operationLabel(opType)} saved.`);
    } catch (e: any) {
      alert(e?.message || "Operation save failed");
      setSyncing(false);
    }
  }

  async function approveOrder() {
    if (!userEmail) {
      const localOrder: CloudOrder = {
        id: crypto.randomUUID(),
        orderFor,
        orderType: mode,
        status: "approved-local",
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        totalApproved: orderTotal
      };
      const next = [localOrder, ...orders].slice(0, 20);
      setOrders(next);
      saveLocalOrders(next);
      alert("Order approved and saved on this device. Export the order CSV to share it.");
      return;
    }
    setSyncing(true);
    try {
      await saveApprovedOrder({
        orderFor,
        orderType: mode,
        recommendations: recs,
        approved,
        notes:
          mode === "weekend"
            ? "Weekend coverage = Thursday + Friday"
            : undefined
      });
      await refreshCloud();
      alert("Order approved and saved. Manager overrides were recorded.");
    } catch (e: any) {
      alert(e?.message || "Order approval failed");
      setSyncing(false);
    }
  }

  function applyQuick() {
    setPhysical(prev => ({ ...prev, ...parseQuickEntry(quick) }));
    setTab("count");
  }

  function removeLocal(id: string) {
    if (userEmail) {
      alert(
        "Cloud records are audit-protected. Use an adjustment instead of silently deleting stock history."
      );
      return;
    }
    if (!confirm("Delete this local record?")) return;
    const next = records.filter(r => r.id !== id);
    setRecords(next);
    saveRecords(next);
  }

  async function logout() {
    await signOut();
    setUserEmail(null);
    setRecords(loadRecords());
    setOrders([]);
    setStatus("Signed out • local fallback");
  }

  const totalAll = sum.Sandwiches + sum.Cakes + sum.Croissants;
  const orderTotal = Object.values(approved).reduce((s, x) => s + Math.max(0, Number(x || 0)), 0);

  return (
    <>
      <header className="top">
        <div className="top-inner">
          <div>
            <div className="eyebrow">Joffrey&apos;s • Hajj Terminal</div>
            <h1>Inventory & Movement Intelligence</h1>
          </div>
          <span className={`badge ${userEmail ? "ok" : "warn"}`}>
            {syncing ? "Syncing…" : userEmail ? "Supabase connected" : "Local"}
          </span>
        </div>
      </header>

      <main className="shell">
        {!userEmail && !syncing && <AuthPanel onSignedIn={refreshCloud} />}
        <div className="notice">
          <strong>{status}</strong>
          {!userEmail && !syncing && (
            <> • The full inventory workflow works on this device. Sign in for audit history and cross-device sync.</>
          )}
          {userEmail && (
            <>
              {" "}• {userEmail}
              <button
                className="btn"
                style={{ marginLeft: 8, padding: "5px 8px" }}
                onClick={logout}
              >
                Sign out
              </button>
            </>
          )}
        </div>

        <section className="metrics">
          <div className="metric"><span>Sandwiches</span><strong>{sum.Sandwiches}</strong></div>
          <div className="metric"><span>Cakes</span><strong>{sum.Cakes}</strong></div>
          <div className="metric"><span>Croissants</span><strong>{sum.Croissants}</strong></div>
          <div className="metric accent"><span>Grand total</span><strong>{totalAll}</strong></div>
        </section>

        <nav className="tabs">
          {(
            ["count", "operations", "movement", "orders", "intelligence", "assistant", "quick", "history"] as Tab[]
          ).map(x => (
            <button
              key={x}
              className={tab === x ? "active" : ""}
              onClick={() => setTab(x)}
            >
              {x === "quick" ? "Quick Entry" : x[0].toUpperCase() + x.slice(1)}
            </button>
          ))}
        </nav>

        {tab === "count" && (
          <section className="card">
            <div className="section-head">
              <div>
                <h2>Daily count & immediate receiving</h2>
                <p className="muted">
                  Physical stock first. Any delivery after the count is recorded separately.
                </p>
              </div>
              <div className="actions" style={{ marginTop: 0 }}>
                <button className="btn" onClick={loadLatest}>Load latest</button>
                <button className="btn" onClick={refreshCloud}>Refresh cloud</button>
              </div>
            </div>

            <div className="grid3">
              <label className="stack">
                Date
                <input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </label>
              <label className="stack">
                Time
                <input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </label>
              <label className="stack">
                Reported by
                <input value={reportedBy} onChange={e => setReportedBy(e.target.value)} />
              </label>
            </div>

            <div className="notice">
              <strong>Each row:</strong> physical count → immediate receiving/top-up.
            </div>

            {(["Sandwiches", "Cakes", "Croissants"] as const).map(cat => (
              <div className="category" key={cat}>
                <h3>{cat}</h3>
                <div className="grid2">
                  {PRODUCTS.filter(p => p.category === cat).map(p => (
                    <div className="product-row" key={p.id}>
                      <div className="name">{p.name}</div>
                      <input
                        aria-label={`${p.name} physical`}
                        type="number"
                        min="0"
                        value={physical[p.id] || 0}
                        onChange={e => setQ(setPhysical, p.id, Number(e.target.value))}
                      />
                      <input
                        aria-label={`${p.name} receiving`}
                        type="number"
                        min="0"
                        value={receiving[p.id] || 0}
                        onChange={e => setQ(setReceiving, p.id, Number(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="actions">
              <button className="btn primary" disabled={syncing} onClick={saveDay}>
                Save day
              </button>
              <button
                className="btn"
                onClick={() => {
                  setPhysical(emptyMap());
                  setReceiving(emptyMap());
                }}
              >
                Clear
              </button>
            </div>
          </section>
        )}

        {tab === "operations" && (
          <section className="card">
            <div className="section-head">
              <div>
                <h2>Inventory operations</h2>
                <p className="muted">
                  Receiving from Bakery Warehouse, waste and corrections are written to the exact event ledger.
                </p>
              </div>
            </div>

            <div className="grid3">
              <label className="stack">
                Operation
                <select value={opType} onChange={e => setOpType(e.target.value as OperationType)}>
                  <option value="receiving">Receive from Bakery Warehouse</option>
                  <option value="waste">Waste</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </label>
              <label className="stack">
                Date
                <input type="date" value={opDate} onChange={e => setOpDate(e.target.value)} />
              </label>
              <label className="stack">
                Time
                <input type="time" value={opTime} onChange={e => setOpTime(e.target.value)} />
              </label>
            </div>

            <div className="grid2" style={{ marginTop: 10 }}>
              <label className="stack">
                {opType === "receiving" ? "Source" : "Label"}
                <input value={opType === "receiving" ? "Bakery Warehouse" : opLabel} disabled={opType === "receiving"} onChange={e => setOpLabel(e.target.value)} />
              </label>
              <label className="stack">
                Reason / notes
                <input value={opReason} onChange={e => setOpReason(e.target.value)} />
              </label>
            </div>

            <div className="notice">
              {opType === "adjustment"
                ? "Adjustment may be positive or negative. Example: +2 count correction or -3 missing stock."
                : "Enter the quantity for each affected item. Leave other items at 0."}
            </div>

            {(["Sandwiches", "Cakes", "Croissants"] as const).map(cat => (
              <div className="category" key={cat}>
                <h3>{cat}</h3>
                <div className="grid2">
                  {PRODUCTS.filter(p => p.category === cat).map(p => (
                    <div className="product-row operation-row" key={p.id}>
                      <div className="name">{p.name}</div>
                      <input
                        style={{ gridColumn: "span 2" }}
                        type="number"
                        min={opType === "adjustment" ? undefined : 0}
                        value={opQty[p.id] || 0}
                        onChange={e => setQ(setOpQty, p.id, Number(e.target.value))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="actions">
              <button className="btn primary" disabled={syncing} onClick={saveOperation}>
                Save {operationLabel(opType)}
              </button>
              <button className="btn" onClick={() => setOpQty(emptyMap())}>Clear quantities</button>
            </div>
          </section>
        )}

        {tab === "movement" && (
          <section className="card">
            <div className="section-head">
              <div>
                <h2>Exact daily movement</h2>
                <p className="muted">
                  Previous count + all ledger events until the next count − current physical stock.
                </p>
              </div>
            </div>

            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Prev final</th>
                    <th>Current physical</th>
                    <th>Movement</th>
                    <th>3-day</th>
                    <th>7-day</th>
                    <th>14-day</th>
                    <th>This week</th>
                    <th>Previous weekly avg</th>
                    <th>Days left</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {movement.map(r => (
                    <tr key={r.productId}>
                      <td>{productName(r.productId)}</td>
                      <td>{r.previousFinal ?? "—"}</td>
                      <td>{r.currentPhysical}</td>
                      <td>
                        {r.discrepancy
                          ? "⚠ discrepancy"
                          : r.potentialStockout
                          ? `${r.movement ?? 0}+ ⚠`
                          : r.movement ?? "—"}
                      </td>
                      <td>{r.avg3.toFixed(1)}</td>
                      <td>{r.avg7.toFixed(1)}</td>
                      <td>{r.avg14.toFixed(1)}</td>
                      <td><strong>{r.weeklyMovement.toFixed(0)}</strong></td>
                      <td>{r.previousWeeklyAverage.toFixed(1)}</td>
                      <td>{r.daysRemaining?.toFixed(1) ?? "—"}</td>
                      <td>
                        <span
                          className={`badge ${
                            r.potentialStockout
                              ? "warn"
                              : r.trend === "Fast"
                              ? "fast"
                              : r.trend === "Slow"
                              ? "slow"
                              : "ok"
                          }`}
                        >
                          {r.potentialStockout ? "Possible stockout" : r.trend}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "orders" && (
          <section className="card">
            <div className="section-head">
              <div>
                <h2>Order intelligence & approval</h2>
                <p className="muted">
                  Weekend is forecast separately for Thursday and Friday, not one day × 2.
                </p>
              </div>
              <div className="notice" style={{ margin: 0 }}>
                Order for: <strong>{orderFor}</strong>
              </div>
            </div>

            <div className="actions">
              <button
                className={`btn ${mode === "weekly" ? "primary" : ""}`}
                onClick={() => setMode("weekly")}
              >
                Next 7 days
              </button>
              <button
                className={`btn ${mode === "tomorrow" ? "primary" : ""}`}
                onClick={() => setMode("tomorrow")}
              >
                Tomorrow
              </button>
              <button
                className={`btn ${mode === "weekend" ? "primary" : ""}`}
                onClick={() => setMode("weekend")}
              >
                Thu + Fri Weekend
              </button>
              <button
                className={`btn ${mode === "emergency" ? "primary" : ""}`}
                onClick={() => setMode("emergency")}
              >
                Emergency
              </button>
            </div>

            <div className="notice good">
              <strong>Approved order total:</strong> {orderTotal} pcs. You can override each
              recommendation before approval; both numbers are saved for learning.
            </div>

            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Current</th>
                    <th>Forecast</th>
                    <th>Weekly movement</th>
                    <th>Speed</th>
                    <th>Safety</th>
                    <th>Target</th>
                    <th>Recommend</th>
                    <th>Approve</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {recs.map(r => (
                    <tr key={r.productId} title={r.explanation}>
                      <td>{productName(r.productId)}</td>
                      <td>{r.current}</td>
                      <td>{r.forecast.toFixed(1)}</td>
                      <td>{r.weeklyMovement.toFixed(0)}</td>
                      <td><span className={`badge ${r.velocity === "Fast" ? "fast" : r.velocity === "Slow" || r.velocity === "No movement" ? "slow" : "ok"}`}>{r.velocity}</span></td>
                      <td>{r.safety}</td>
                      <td>{r.target}</td>
                      <td><strong>{r.recommended}</strong></td>
                      <td>
                        <input
                          style={{ width: 72, padding: 6 }}
                          type="number"
                          min="0"
                          value={approved[r.productId] ?? r.recommended}
                          onChange={e =>
                            setApproved(prev => ({
                              ...prev,
                              [r.productId]: Math.max(0, Number(e.target.value) || 0)
                            }))
                          }
                        />
                      </td>
                      <td>{r.confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="actions">
              <button className="btn primary" disabled={syncing} onClick={approveOrder}>
                Approve & save order
              </button>
              <button
                className="btn"
                onClick={() =>
                  setApproved(Object.fromEntries(recs.map(r => [r.productId, r.recommended])))
                }
              >
                Reset to recommendation
              </button>
              <button className="btn" onClick={()=>exportOrderCsv(orderFor,mode,recs,approved)}>
                Export order CSV
              </button>
              <button className="btn" onClick={()=>downloadOrderIcs(orderFor,mode,orderTotal)}>
                Calendar reminder (.ics)
              </button>
              <button className="btn" onClick={()=>openGoogleCalendarDraft({orderFor,mode,total:orderTotal})}>
                Open Google Calendar draft
              </button>
            </div>
          </section>
        )}

        {tab === "intelligence" && (
          <>
            <section className="card">
              <div className="section-head">
                <div>
                  <h2>Forecast accuracy</h2>
                  <p className="muted">
                    Compares predicted movement with actual movement after the next physical count.
                    Zero-stock days are marked as censored demand and estimated lost sales are shown separately.
                  </p>
                </div>
                <button className="btn" onClick={refreshCloud}>Reconcile now</button>
              </div>

              <section className="metrics">
                <div className="metric">
                  <span>Overall accuracy</span>
                  <strong>{forecastSummary.overallAccuracy===null ? "—" : `${forecastSummary.overallAccuracy.toFixed(1)}%`}</strong>
                </div>
                <div className="metric">
                  <span>Best predicted</span>
                  <strong style={{fontSize:18}}>{forecastSummary.bestProduct || "—"}</strong>
                </div>
                <div className="metric">
                  <span>Needs improvement</span>
                  <strong style={{fontSize:18}}>{forecastSummary.worstProduct || "—"}</strong>
                </div>
                <div className="metric accent">
                  <span>Reconciled forecasts</span>
                  <strong>{forecastSummary.reconciledRows}</strong>
                </div>
              </section>

              <div className="notice" style={{marginTop:12}}>
                <strong>Learning signals:</strong>{" "}
                {forecastSummary.mostUnderForecast ? `Most under-forecast: ${forecastSummary.mostUnderForecast}. ` : ""}
                {forecastSummary.mostOverForecast ? `Most over-forecast: ${forecastSummary.mostOverForecast}.` : ""}
                {!forecastSummary.reconciledRows ? "Approve orders and enter the next physical counts to begin learning." : ""}
              </div>

              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product</th>
                      <th>Predicted</th>
                      <th>Actual</th>
                      <th>Error</th>
                      <th>Accuracy</th>
                      <th>Lost sales est.</th>
                      <th>Stockout</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecastRows.slice(0,60).map((r,i)=>(
                      <tr key={`${r.productId}-${r.forecastDate}-${i}`}>
                        <td>{r.forecastDate}</td>
                        <td>{r.productName}</td>
                        <td>{r.predicted.toFixed(1)}</td>
                        <td>{r.actual===null ? "Pending" : r.actual.toFixed(1)}</td>
                        <td>{r.error===null ? "—" : r.error.toFixed(1)}</td>
                        <td>{r.percentageError===null ? "—" : `${Math.max(0,100-r.percentageError).toFixed(1)}%`}</td>
                        <td>{r.estimatedLostSales===null ? "—" : r.estimatedLostSales.toFixed(1)}</td>
                        <td>{r.stockout ? "⚠ Yes" : "No"}</td>
                        <td>{r.confidence || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="card">
              <h2>Reports</h2>
              <p className="muted">Export operational data for managers, analysis or Drive backup.</p>
              <div className="actions">
                <button className="btn" onClick={()=>exportCurrentInventoryCsv(records)}>Current inventory CSV</button>
                <button className="btn" onClick={()=>exportDailyMovementCsv(records)}>Daily movement CSV</button>
                <button className="btn" onClick={()=>exportOrderCsv(orderFor,mode,recs,approved)}>Current order CSV</button>
                <button className="btn" onClick={()=>exportInventoryXlsx(records)}>Excel report (.xlsx)</button>
                <button className="btn" onClick={()=>exportInventoryPdf(records)}>PDF report</button>
                <button className="btn" onClick={()=>downloadFullBackup({records,orders,forecastRows})}>Full JSON backup</button>
              </div>
            </section>
          </>
        )}

        {tab === "assistant" && (
          <section className="card">
            <div className="section-head">
              <div>
                <h2>Inventory AI Assistant</h2>
                <p className="muted">
                  Read-only AI. It receives only the current inventory analysis shown by this app.
                  It cannot silently receive stock, transfer items, approve orders or edit the database.
                </p>
              </div>
              <span className="badge ok">Read only</span>
            </div>

            <div className="notice">
              Try: <strong>"What should I order tomorrow?"</strong>,{" "}
              <strong>"Which sandwiches may finish first?"</strong>, or{" "}
              <strong>"Explain today's discrepancies."</strong>
            </div>

            <textarea
              rows={5}
              style={{width:"100%"}}
              value={aiQuestion}
              onChange={e=>setAiQuestion(e.target.value)}
              placeholder="Ask about Hajj Terminal stock, movement or orders..."
            />

            <div className="actions">
              <button
                className="btn primary"
                disabled={aiBusy || !aiQuestion.trim()}
                onClick={async()=>{
                  setAiBusy(true);setAiAnswer("");
                  try{
                    const answer=await askInventoryAI({
                      question:aiQuestion,
                      reportDate:latest?.date||null,
                      movement,
                      orderMode:mode,
                      orderFor,
                      recommendations:recs
                    });
                    setAiAnswer(answer);
                  }catch(e:any){
                    setAiAnswer(e?.message||"AI request failed.");
                  }finally{
                    setAiBusy(false);
                  }
                }}
              >
                {aiBusy ? "Thinking…" : "Ask Inventory AI"}
              </button>
            </div>

            {aiAnswer && <div className="notice good" style={{whiteSpace:"pre-wrap"}}>{aiAnswer}</div>}
            <p className="muted">
              AI requires an OpenAI API key on the server. The inventory app itself continues to work without AI.
            </p>
          </section>
        )}

        {tab === "quick" && (
          <section className="card">
            <h2>Quick entry</h2>
            <p className="muted">
              Paste a Vignesh-style report. Caesar/Caeser and Plain/Butter aliases are understood.
            </p>
            <textarea
              rows={14}
              style={{ width: "100%", marginTop: 12 }}
              value={quick}
              onChange={e => setQuick(e.target.value)}
              placeholder={
                "Fajita 80\nTuna 4\nHalloumi 22\nTurkey 9\nRanch 13\nCaesar 13\n3 Cheese 20"
              }
            />
            <div className="actions">
              <button className="btn primary" onClick={applyQuick}>
                Parse into daily count
              </button>
            </div>
          </section>
        )}

        {tab === "history" && (
          <>
            <section className="card">
              <div className="section-head">
                <div>
                  <h2>Daily count history</h2>
                  <p className="muted">
                    Cloud stock history is audit-protected. Use adjustments instead of deleting.
                  </p>
                </div>
                <button className="btn" onClick={() => exportRecords(records)}>
                  Export JSON
                </button>
              </div>
              {[...ordered].reverse().map(r => (
                <div className="history-item" key={r.id}>
                  <div>
                    <strong>{r.date} • {r.time}</strong>
                    <small>Reported by {r.reportedBy}</small>
                  </div>
                  <button className="btn danger" onClick={() => removeLocal(r.id)}>
                    Delete
                  </button>
                </div>
              ))}
            </section>

            <section className="card">
              <h2>Approved order history</h2>
              <p className="muted">
                Manager overrides remain stored beside the system recommendation.
              </p>
              {orders.length ? (
                orders.map(o => (
                  <div className="history-item" key={o.id}>
                    <div>
                      <strong>
                        {o.orderFor} • {o.orderType === "weekend" ? "Thu + Fri Weekend" : o.orderType}
                      </strong>
                      <small>
                        {o.status} • Approved total {o.totalApproved} pcs
                      </small>
                    </div>
                    <span className="badge ok">{o.status}</span>
                  </div>
                ))
              ) : (
                <div className="notice">No approved cloud orders yet.</div>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
