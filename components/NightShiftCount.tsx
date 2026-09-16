"use client";

import { useEffect, useMemo, useState } from "react";
import AuthPanel from "./AuthPanel";
import { CATEGORIES, PRODUCTS } from "@/lib/products";
import { emptyMap, finalStock, hasCountForDate, sorted } from "@/lib/engine";
import { getAuthUser, loadCloudRecords, saveCloudDailyRecord } from "@/lib/cloud";
import { supabase } from "@/lib/supabase";
import type { DailyRecord, QuantityMap } from "@/lib/types";

function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
function localTime() { return new Date().toTimeString().slice(0,5); }

export default function NightShiftCount() {
  const [records,setRecords]=useState<DailyRecord[]>([]);
  const [email,setEmail]=useState<string|null>(null);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [confirming,setConfirming]=useState(false);
  const [saved,setSaved]=useState(false);
  const [date,setDate]=useState(localDate());
  const [time,setTime]=useState(localTime());
  const [reportedBy,setReportedBy]=useState("Vignesh");
  const [physical,setPhysical]=useState<QuantityMap>(emptyMap());

  async function refresh() {
    setLoading(true);
    try {
      const user=await getAuthUser();
      setEmail(user?.email??null);
      setRecords(user ? await loadCloudRecords() : []);
    } finally { setLoading(false); }
  }

  useEffect(()=>{
    refresh();
    const sub=supabase.auth.onAuthStateChange((_event,session)=>{
      setEmail(session?.user?.email??null);
      if(session?.user) refresh();
    });
    return ()=>sub.data.subscription.unsubscribe();
  },[]);

  const latest=sorted(records).at(-1)??null;
  const duplicate=hasCountForDate(records,date);
  const total=PRODUCTS.reduce((sum,product)=>sum+Number(physical[product.id]||0),0);
  const categoryTotals=Object.fromEntries(CATEGORIES.map(category=>[
    category,
    PRODUCTS.filter(product=>product.category===category).reduce((sum,product)=>sum+Number(physical[product.id]||0),0)
  ]));
  const changes=useMemo(()=>PRODUCTS.map(product=>{
    const previous=latest?finalStock(latest,product.id):0;
    const current=Number(physical[product.id]||0);
    return {product,previous,current,difference:current-previous};
  }).filter(row=>row.difference!==0).sort((a,b)=>Math.abs(b.difference)-Math.abs(a.difference)),[latest,physical]);

  async function submit() {
    if(duplicate||saving) return;
    setSaving(true);
    try {
      await saveCloudDailyRecord({date,time,reportedBy:reportedBy.trim()||"Night shift",physical,receiving:emptyMap()});
      setSaved(true);
      setConfirming(false);
      await refresh();
    } catch(error:any) {
      alert(error?.message||"Count could not be saved.");
    } finally { setSaving(false); }
  }

  if(loading) return <main className="count-mode"><div className="count-mode-card">Loading Hajj Terminal count…</div></main>;
  if(!email) return <main className="count-mode"><div className="count-mode-header"><span>Joffrey&apos;s • Hajj Terminal</span><h1>Night-shift count</h1></div><AuthPanel onSignedIn={refresh}/></main>;

  if(saved) return <main className="count-mode"><div className="count-success"><div className="success-check">✓</div><h1>Count submitted</h1><p>{date} at {time}</p><strong>{total} total pieces</strong><p>The bakery manager can now see this count.</p><a className="btn primary" href="/count">Done</a></div></main>;

  return <main className="count-mode">
    <div className="count-mode-header"><span>Joffrey&apos;s • Hajj Terminal</span><h1>Night-shift stock count</h1><p>Count every Hajj item physically available.</p></div>
    {!confirming ? <>
      <section className="count-mode-card count-meta">
        <label>Employee name<input value={reportedBy} onChange={event=>setReportedBy(event.target.value)} /></label>
        <label>Date<input type="date" value={date} onChange={event=>setDate(event.target.value)} /></label>
        <label>Time<input type="time" value={time} onChange={event=>setTime(event.target.value)} /></label>
      </section>
      {duplicate && <div className="count-blocked"><strong>A count is already saved for {date}.</strong><span>Do not submit another count. Ask Osman to make a correction or adjustment.</span></div>}
      {CATEGORIES.map(category=><section className="count-mode-card count-category" key={category}><h2>{category}</h2>
        {PRODUCTS.filter(product=>product.category===category).map(product=><label className="night-item" key={product.id}><span>{product.name}</span><input inputMode="numeric" type="number" min="0" value={physical[product.id]||0} onChange={event=>setPhysical(current=>({...current,[product.id]:Math.max(0,Number(event.target.value)||0)}))}/></label>)}
      </section>)}
      <div className="count-submit-bar"><div><span>Total pieces</span><strong>{total}</strong></div><button className="btn primary" disabled={duplicate||total===0||!reportedBy.trim()} onClick={()=>setConfirming(true)}>Review count</button></div>
    </> : <section className="count-mode-card count-review">
      <span className="review-label">Final confirmation</span><h1>Review before submitting</h1><p>This count cannot be silently deleted after submission.</p>
      <div className="review-total"><span>Grand total</span><strong>{total}</strong></div>
      <div className="review-categories">{CATEGORIES.map(category=><div key={category}><span>{category}</span><strong>{categoryTotals[category]}</strong></div>)}</div>
      <h2>Changes from latest stock</h2>
      <div className="review-changes">{changes.map(row=><div key={row.product.id}><span>{row.product.name}</span><small>{row.previous} → {row.current}</small><strong className={row.difference<0?"value-bad":"value-warn"}>{row.difference>0?"+":""}{row.difference}</strong></div>)}</div>
      <label className="confirm-check"><input type="checkbox" required id="physical-confirm"/> I confirm these are the physical quantities at Hajj Terminal.</label>
      <div className="actions"><button className="btn" onClick={()=>setConfirming(false)}>Back and correct</button><button className="btn primary" disabled={saving} onClick={()=>{const box=document.getElementById("physical-confirm") as HTMLInputElement|null;if(!box?.checked){alert("Confirm the physical count first.");return;}submit();}}>{saving?"Submitting…":"Confirm and submit"}</button></div>
    </section>}
  </main>;
}
