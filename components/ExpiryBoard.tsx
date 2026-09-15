"use client";
import { useEffect,useMemo,useState } from "react";
import { PRODUCTS } from "@/lib/products";
import { supabase } from "@/lib/supabase";
type Batch={id:string;product_code:string;quantity_remaining:number;received_date:string;expiry_date:string;notes:string|null};
function isoToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
function daysLeft(date:string){const a=new Date(`${isoToday()}T12:00:00`);const b=new Date(`${date}T12:00:00`);return Math.round((b.getTime()-a.getTime())/86400000)}
function state(days:number){if(days<0)return ["expired","Expired"];if(days===0)return ["urgent","Expires today"];if(days<=3)return ["soon",`${days} days left`];if(days<=7)return ["watch",`${days} days left`];return ["safe",`${days} days left`]}
export default function ExpiryBoard(){
 const [rows,setRows]=useState<Batch[]>([]),[product,setProduct]=useState(PRODUCTS[0].id),[qty,setQty]=useState(0),[expiry,setExpiry]=useState(""),[note,setNote]=useState(""),[error,setError]=useState("");
 async function load(){const {data,error}=await supabase.from("hajj_batches").select("id,product_code,quantity_remaining,received_date,expiry_date,notes").gt("quantity_remaining",0).order("expiry_date");if(error)setError(error.message);else setRows((data||[]) as Batch[])}
 useEffect(()=>{load()},[]);
 async function save(){if(qty<=0||!expiry){setError("Enter quantity and expiry date.");return}const {error}=await supabase.from("hajj_batches").insert({product_code:product,quantity_received:qty,quantity_remaining:qty,received_date:isoToday(),expiry_date:expiry,notes:note||null});if(error)setError(error.message);else{setQty(0);setExpiry("");setNote("");setError("");await load()}}
 async function updateQty(id:string,value:number){const quantity=Math.max(0,value);const {error}=await supabase.from("hajj_batches").update({quantity_remaining:quantity,updated_at:new Date().toISOString()}).eq("id",id);if(error)setError(error.message);else await load()}
 const total=useMemo(()=>rows.reduce((s,r)=>s+r.quantity_remaining,0),[rows]);
 return <section className="card"><div className="section-head"><div><h2>Available stock & expiry</h2><p className="muted">Record each expiry batch separately. Use the earliest expiry first (FEFO).</p></div><div className="notice good">Batch stock: <strong>{total}</strong></div></div>
  <div className="grid3"><label className="stack">Product<select value={product} onChange={e=>setProduct(e.target.value)}>{PRODUCTS.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="stack">Available quantity<input type="number" min="1" value={qty||""} onChange={e=>setQty(Number(e.target.value))}/></label><label className="stack">Expiry date<input type="date" min={isoToday()} value={expiry} onChange={e=>setExpiry(e.target.value)}/></label></div>
  <label className="stack" style={{marginTop:10}}>Notes<input value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional batch or delivery note"/></label><div className="actions"><button className="btn primary" onClick={save}>Add expiry batch</button></div>{error&&<div className="notice warn">{error}</div>}
  <div className="expiry-list">{rows.map(r=>{const days=daysLeft(r.expiry_date);const [cls,label]=state(days);return <div className={`expiry-row ${cls}`} key={r.id}><div><strong>{PRODUCTS.find(p=>p.id===r.product_code)?.name||r.product_code}</strong><small>Expires {r.expiry_date} · {label}</small></div><label>Available<input type="number" min="0" value={r.quantity_remaining} onChange={e=>updateQty(r.id,Number(e.target.value))}/></label></div>})}{!rows.length&&<div className="notice">No expiry batches yet. Add today&apos;s available stock above.</div>}</div>
 </section>
}
