import { supabase } from "./supabase";
import { emptyMap } from "./engine";
import { PRODUCTS } from "./products";
import type {
  CloudOrder,
  DailyRecord,
  OperationType,
  OrderRecommendation,
  QuantityMap
} from "./types";

type ProductRow = { id: string; code: string };
type CountItem = { product_id: string; quantity: number };
type CountRow = {
  id: string;
  counted_at: string;
  reported_by: string | null;
  notes: string | null;
  hajj_inventory_count_items: CountItem[] | null;
};
type LedgerRow = {
  product_id: string;
  quantity_delta: number;
  event_type: OperationType;
  occurred_at: string;
  label: string | null;
};
type OrderRow = {
  id: string;
  order_for: string;
  order_type: "tomorrow" | "weekend" | "emergency";
  status: string;
  approved_at: string | null;
  created_at: string;
  hajj_order_items: { approved_qty: number | null }[] | null;
};

function localParts(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` };
}

function toIsoLocal(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export async function getAuthUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function sendMagicLink(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

async function getReferenceIds() {
  const [{ data: loc, error: le }, { data: products, error: pe }] = await Promise.all([
    supabase.from("hajj_locations").select("id").eq("name", "Hajj Terminal").single(),
    supabase.from("hajj_products").select("id,code").eq("active", true)
  ]);
  if (le) throw le;
  if (pe) throw pe;
  const byCode = new Map((products as ProductRow[] || []).map(p => [p.code, p.id]));
  return { locationId: loc.id as string, productIdByCode: byCode };
}

export async function loadCloudRecords(): Promise<DailyRecord[]> {
  const { locationId } = await getReferenceIds();

  const [{ data: products, error: pe }, { data: counts, error: ce }, { data: ledger, error: le }] =
    await Promise.all([
      supabase.from("hajj_products").select("id,code").eq("active", true),
      supabase
        .from("hajj_inventory_counts")
        .select("id,counted_at,reported_by,notes,hajj_inventory_count_items(product_id,quantity)")
        .eq("location_id", locationId)
        .order("counted_at", { ascending: true }),
      supabase
        .from("hajj_event_ledger")
        .select("product_id,quantity_delta,event_type,occurred_at,label")
        .eq("location_id", locationId)
        .order("occurred_at", { ascending: true })
    ]);

  if (pe) throw pe;
  if (ce) throw ce;
  if (le) throw le;

  const idToCode = new Map((products as ProductRow[] || []).map(p => [p.id, p.code]));
  const crows = (counts as CountRow[] || []).sort((a, b) =>
    a.counted_at.localeCompare(b.counted_at)
  );

  const records: DailyRecord[] = crows.map(c => {
    const { date, time } = localParts(c.counted_at);
    const physical = emptyMap();
    for (const item of c.hajj_inventory_count_items || []) {
      const code = idToCode.get(item.product_id);
      if (code) physical[code] = Number(item.quantity || 0);
    }
    return {
      id: c.id,
      date,
      time,
      reportedBy: c.reported_by || "Vignesh",
      physical,
      receiving: emptyMap(),
      transferIn: emptyMap(),
      transferOut: emptyMap(),
      waste: emptyMap(),
      returns: emptyMap(),
      adjustments: emptyMap(),
      notes: c.notes || undefined,
      createdAt: c.counted_at
    };
  });

  const timestamps = crows.map(c => new Date(c.counted_at).getTime());

  for (const ev of (ledger as LedgerRow[] || [])) {
    const t = new Date(ev.occurred_at).getTime();
    let idx = -1;
    for (let i = 0; i < timestamps.length; i++) {
      if (timestamps[i] <= t) idx = i;
      else break;
    }
    if (idx < 0 || !records[idx]) continue;

    const code = idToCode.get(ev.product_id);
    if (!code) continue;
    const delta = Number(ev.quantity_delta || 0);

    if (ev.event_type === "receiving") {
      records[idx].receiving[code] += Math.max(0, delta);
    } else if (ev.event_type === "transfer_in") {
      records[idx].transferIn[code] += Math.max(0, delta);
    } else if (ev.event_type === "transfer_out") {
      records[idx].transferOut[code] += Math.abs(Math.min(0, delta));
    } else if (ev.event_type === "waste") {
      records[idx].waste[code] += Math.abs(Math.min(0, delta));
    } else if (ev.event_type === "adjustment") {
      records[idx].adjustments[code] += delta;
    }
  }

  return records;
}

export async function saveCloudDailyRecord(input: {
  date: string;
  time: string;
  reportedBy: string;
  physical: QuantityMap;
  receiving: QuantityMap;
  notes?: string;
}) {
  const { locationId, productIdByCode } = await getReferenceIds();
  const countedAt = toIsoLocal(input.date, input.time);

  const { data: count, error: countError } = await supabase
    .from("hajj_inventory_counts")
    .insert({
      location_id: locationId,
      counted_at: countedAt,
      reported_by: input.reportedBy,
      status: "submitted",
      notes: input.notes || null
    })
    .select("id")
    .single();

  if (countError) throw countError;

  const countItems = PRODUCTS.map(p => ({
    count_id: count.id,
    product_id: productIdByCode.get(p.id)!,
    quantity: Number(input.physical[p.id] || 0)
  }));

  const { error: itemError } = await supabase
    .from("hajj_inventory_count_items")
    .insert(countItems);
  if (itemError) throw itemError;

  const receivingRows = PRODUCTS.filter(p => Number(input.receiving[p.id] || 0) > 0).map(
    p => ({
      product_id: productIdByCode.get(p.id)!,
      quantity: Number(input.receiving[p.id] || 0)
    })
  );

  if (receivingRows.length) {
    const recvAt = new Date(new Date(countedAt).getTime() + 60_000).toISOString();
    const { data: recv, error: recvError } = await supabase
      .from("hajj_receivings")
      .insert({
        location_id: locationId,
        received_at: recvAt,
        status: "received",
        reference: "Daily top-up"
      })
      .select("id")
      .single();
    if (recvError) throw recvError;

    const { error: recvItemError } = await supabase
      .from("hajj_receiving_items")
      .insert(receivingRows.map(x => ({ ...x, receiving_id: recv.id })));
    if (recvItemError) throw recvItemError;
  }

  await supabase.from("hajj_audit_logs").insert({
    entity_type: "daily_inventory",
    entity_id: count.id,
    action: "create",
    new_value: {
      date: input.date,
      time: input.time,
      reportedBy: input.reportedBy,
      physical: input.physical,
      receiving: input.receiving
    },
    reason: "Daily Hajj Terminal stock report"
  });

  return count.id as string;
}

export async function saveCloudOperation(input: {
  type: OperationType;
  date: string;
  time: string;
  quantities: QuantityMap;
  label?: string;
  reason?: string;
}) {
  const { locationId, productIdByCode } = await getReferenceIds();
  const occurredAt = toIsoLocal(input.date, input.time);
  const nonZero = PRODUCTS.filter(p => Number(input.quantities[p.id] || 0) !== 0);

  if (!nonZero.length) throw new Error("Enter at least one quantity.");

  if (input.type === "receiving") {
    const { data: parent, error } = await supabase
      .from("hajj_receivings")
      .insert({
        location_id: locationId,
        received_at: occurredAt,
        supplier: input.label || null,
        reference: "Operations entry",
        status: "received",
        notes: input.reason || null
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: itemError } = await supabase.from("hajj_receiving_items").insert(
      nonZero.map(p => ({
        receiving_id: parent.id,
        product_id: productIdByCode.get(p.id)!,
        quantity: Math.abs(Number(input.quantities[p.id] || 0))
      }))
    );
    if (itemError) throw itemError;
  }

  if (input.type === "transfer_in" || input.type === "transfer_out") {
    const isIn = input.type === "transfer_in";
    const { data: parent, error } = await supabase
      .from("hajj_transfers")
      .insert({
        source_location_id: isIn ? null : locationId,
        destination_location_id: isIn ? locationId : null,
        source_label: isIn ? input.label || "Bakery / branch" : "Hajj Terminal",
        destination_label: isIn ? "Hajj Terminal" : input.label || "Branch",
        transferred_at: occurredAt,
        notes: input.reason || null
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: itemError } = await supabase.from("hajj_transfer_items").insert(
      nonZero.map(p => ({
        transfer_id: parent.id,
        product_id: productIdByCode.get(p.id)!,
        quantity: Math.abs(Number(input.quantities[p.id] || 0))
      }))
    );
    if (itemError) throw itemError;
  }

  if (input.type === "waste") {
    const { data: parent, error } = await supabase
      .from("hajj_waste")
      .insert({
        location_id: locationId,
        occurred_at: occurredAt,
        reason: input.reason || input.label || "Waste",
        notes: input.label || null
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: itemError } = await supabase.from("hajj_waste_items").insert(
      nonZero.map(p => ({
        waste_id: parent.id,
        product_id: productIdByCode.get(p.id)!,
        quantity: Math.abs(Number(input.quantities[p.id] || 0))
      }))
    );
    if (itemError) throw itemError;
  }

  if (input.type === "adjustment") {
    const { error } = await supabase.from("hajj_stock_adjustments").insert(
      nonZero.map(p => ({
        location_id: locationId,
        product_id: productIdByCode.get(p.id)!,
        quantity_delta: Number(input.quantities[p.id] || 0),
        reason: input.reason || input.label || "Manual stock correction",
        occurred_at: occurredAt
      }))
    );
    if (error) throw error;
  }

  await supabase.from("hajj_audit_logs").insert({
    entity_type: "inventory_operation",
    action: "create",
    new_value: {
      type: input.type,
      date: input.date,
      time: input.time,
      label: input.label,
      reason: input.reason,
      quantities: input.quantities
    },
    reason: input.reason || `${input.type} entry`
  });
}

export async function saveApprovedOrder(input: {
  orderFor: string;
  orderType: "tomorrow" | "weekend" | "emergency";
  recommendations: OrderRecommendation[];
  approved: QuantityMap;
  notes?: string;
}) {
  const { locationId, productIdByCode } = await getReferenceIds();

  const { data: order, error } = await supabase
    .from("hajj_orders")
    .insert({
      location_id: locationId,
      order_for: input.orderFor,
      order_type: input.orderType,
      status: "approved",
      approved_at: new Date().toISOString(),
      explanation: "Approved from Hajj Terminal order intelligence",
      notes: input.notes || null
    })
    .select("id")
    .single();

  if (error) throw error;

  const rows = input.recommendations.map(r => ({
    order_id: order.id,
    product_id: productIdByCode.get(r.productId)!,
    recommended_qty: r.recommended,
    approved_qty: Math.max(0, Number(input.approved[r.productId] || 0)),
    forecast_qty: r.forecast,
    confidence: r.confidence
  }));

  const { error: itemError } = await supabase.from("hajj_order_items").insert(rows);
  if (itemError) throw itemError;

  await recordForecastSnapshot({
    orderFor: input.orderFor,
    recommendations: input.recommendations,
    approved: input.approved
  });

  await supabase.from("hajj_audit_logs").insert({
    entity_type: "order",
    entity_id: order.id,
    action: "approve",
    new_value: {
      orderFor: input.orderFor,
      orderType: input.orderType,
      approved: input.approved
    },
    reason: "Manager approved order"
  });

  return order.id as string;
}

export async function loadCloudOrders(): Promise<CloudOrder[]> {
  const { locationId } = await getReferenceIds();
  const { data, error } = await supabase
    .from("hajj_orders")
    .select("id,order_for,order_type,status,approved_at,created_at,hajj_order_items(approved_qty)")
    .eq("location_id", locationId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data as OrderRow[] || []).map(o => ({
    id: o.id,
    orderFor: o.order_for,
    orderType: o.order_type,
    status: o.status,
    approvedAt: o.approved_at,
    createdAt: o.created_at,
    totalApproved: (o.hajj_order_items || []).reduce(
      (s, x) => s + Number(x.approved_qty || 0),
      0
    )
  }));
}

export async function recordForecastSnapshot(input: {
  orderFor: string;
  recommendations: import("./types").OrderRecommendation[];
  approved: import("./types").QuantityMap;
}) {
  const { locationId, productIdByCode } = await getReferenceIds();

  for (const r of input.recommendations) {
    const productId = productIdByCode.get(r.productId);
    if (!productId) continue;

    const breakdown = r.forecastBreakdown?.length
      ? r.forecastBreakdown
      : [{ date: input.orderFor, value: r.forecast }];

    for (const part of breakdown) {
      const isOrderDate = part.date === input.orderFor;
      const payload = {
        location_id: locationId,
        product_id: productId,
        forecast_date: part.date,
        predicted_movement: part.value,
        recommended_order_qty: isOrderDate ? r.recommended : 0,
        approved_order_qty: isOrderDate
          ? Math.max(0, Number(input.approved[r.productId] || 0))
          : 0,
        confidence: r.confidence,
        notes: r.explanation
      };

      const { error } = await supabase
        .from("hajj_forecast_accuracy")
        .upsert(payload, { onConflict: "user_id,location_id,product_id,forecast_date" });

      if (error) throw error;
    }
  }
}

export async function loadForecastAccuracy(): Promise<import("./types").ForecastAccuracyRow[]> {
  const { locationId } = await getReferenceIds();
  const [{ data: products, error: pe }, { data: rows, error: fe }] = await Promise.all([
    supabase.from("hajj_products").select("id,code,name"),
    supabase
      .from("hajj_forecast_accuracy")
      .select("product_id,forecast_date,predicted_movement,actual_movement,forecast_error,absolute_error,percentage_error,stockout_occurred,overstock_occurred,estimated_lost_sales,confidence,reconciled_at")
      .eq("location_id", locationId)
      .order("forecast_date", { ascending: false })
      .limit(365)
  ]);
  if (pe) throw pe;
  if (fe) throw fe;

  const nameById = new Map((products || []).map((p:any)=>[p.id,p.name]));
  const codeById = new Map((products || []).map((p:any)=>[p.id,p.code]));

  return (rows || []).map((r:any)=>({
    productId: codeById.get(r.product_id) || r.product_id,
    productName: nameById.get(r.product_id) || "Unknown",
    forecastDate: r.forecast_date,
    predicted: Number(r.predicted_movement || 0),
    actual: r.actual_movement === null ? null : Number(r.actual_movement),
    error: r.forecast_error === null ? null : Number(r.forecast_error),
    absoluteError: r.absolute_error === null ? null : Number(r.absolute_error),
    percentageError: r.percentage_error === null ? null : Number(r.percentage_error),
    stockout: Boolean(r.stockout_occurred),
    overstock: Boolean(r.overstock_occurred),
    estimatedLostSales: r.estimated_lost_sales === null ? null : Number(r.estimated_lost_sales),
    confidence: r.confidence,
    reconciledAt: r.reconciled_at
  }));
}

function movementMapForReconciliation(records: import("./types").DailyRecord[]) {
  const { movementSeries } = require("./engine") as typeof import("./engine");
  const out = new Map<string, { actual:number; stockout:boolean }>();
  for (const p of PRODUCTS) {
    for (const m of movementSeries(records, p.id)) {
      out.set(`${p.id}|${m.date}`, { actual:m.value, stockout:m.potentialStockout });
    }
  }
  return out;
}

export async function reconcileForecastAccuracy(records: import("./types").DailyRecord[]) {
  if (!records.length) return;
  const { locationId, productIdByCode } = await getReferenceIds();
  const movementMap = movementMapForReconciliation(records);

  const { data: rows, error } = await supabase
    .from("hajj_forecast_accuracy")
    .select("id,product_id,forecast_date,predicted_movement")
    .eq("location_id", locationId)
    .is("reconciled_at", null);

  if (error) throw error;
  if (!rows?.length) return;

  const codeByProductId = new Map([...productIdByCode.entries()].map(([code,id])=>[id,code]));

  for (const row of rows) {
    const code = codeByProductId.get(row.product_id);
    if (!code) continue;
    const observed = movementMap.get(`${code}|${row.forecast_date}`);
    if (!observed) continue;

    const predicted = Number(row.predicted_movement || 0);
    const actual = Number(observed.actual || 0);
    const errorValue = actual - predicted;
    const absError = Math.abs(errorValue);
    const pct = actual > 0 ? (absError / actual) * 100 : (predicted > 0 ? 100 : 0);

    // Stockout days are censored demand. Estimate only the likely missed part, never claim certainty.
    const estimatedLostSales = observed.stockout ? Math.max(0, predicted - actual) : 0;
    const effectiveActual = actual + estimatedLostSales;

    const recentProduct = PRODUCTS.find(p=>p.id===code);
    const overstock = Boolean(
      recentProduct &&
      predicted > 0 &&
      actual < predicted * 0.55
    );

    const { error: updateError } = await supabase
      .from("hajj_forecast_accuracy")
      .update({
        actual_movement: actual,
        forecast_error: actual - predicted,
        absolute_error: Math.abs(actual - predicted),
        percentage_error: effectiveActual > 0 ? (Math.abs(effectiveActual - predicted) / effectiveActual) * 100 : 0,
        stockout_occurred: observed.stockout,
        overstock_occurred: overstock,
        estimated_lost_sales: estimatedLostSales,
        reconciled_at: new Date().toISOString()
      })
      .eq("id", row.id);

    if (updateError) throw updateError;
  }
}

export async function loadForecastSummary(): Promise<import("./types").ForecastSummary> {
  const rows = await loadForecastAccuracy();
  const reconciled = rows.filter(r=>r.actual !== null && r.percentageError !== null);

  if (!reconciled.length) {
    return {
      overallAccuracy: null,
      bestProduct: null,
      worstProduct: null,
      mostUnderForecast: null,
      mostOverForecast: null,
      reconciledRows: 0
    };
  }

  const accuracyByProduct = new Map<string,{name:string, errors:number[], signed:number[]}>();
  for (const r of reconciled) {
    if (!accuracyByProduct.has(r.productId)) {
      accuracyByProduct.set(r.productId,{name:r.productName,errors:[],signed:[]});
    }
    const x = accuracyByProduct.get(r.productId)!;
    x.errors.push(Number(r.percentageError || 0));
    x.signed.push(Number(r.error || 0));
  }

  const scored = [...accuracyByProduct.values()].map(x=>{
    const mae = x.errors.reduce((a,b)=>a+b,0)/x.errors.length;
    const signed = x.signed.reduce((a,b)=>a+b,0)/x.signed.length;
    return {name:x.name, accuracy:Math.max(0,100-mae), signed};
  });

  const overallMae = reconciled.reduce((s,r)=>s+Number(r.percentageError||0),0)/reconciled.length;
  const best = [...scored].sort((a,b)=>b.accuracy-a.accuracy)[0];
  const worst = [...scored].sort((a,b)=>a.accuracy-b.accuracy)[0];
  const under = [...scored].sort((a,b)=>b.signed-a.signed)[0];
  const over = [...scored].sort((a,b)=>a.signed-b.signed)[0];

  return {
    overallAccuracy: Math.max(0, 100-overallMae),
    bestProduct: best?.name || null,
    worstProduct: worst?.name || null,
    mostUnderForecast: under?.signed > 0 ? under.name : null,
    mostOverForecast: over?.signed < 0 ? over.name : null,
    reconciledRows: reconciled.length
  };
}
