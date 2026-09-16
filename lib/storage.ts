"use client";
import type { CloudOrder, DailyRecord } from "./types";

const KEY="hajj-terminal-inventory-v3";
const OLD_KEY="hajj-terminal-inventory-v2";
const ORDER_KEY="hajj-terminal-local-orders-v1";

export function loadRecords():DailyRecord[]{
  if(typeof window==="undefined") return [];
  const raw=localStorage.getItem(KEY);
  if(raw){try{return JSON.parse(raw) as DailyRecord[]}catch{}}
  const old=localStorage.getItem(OLD_KEY);
  if(old){try{
    const records=JSON.parse(old) as DailyRecord[];
    const demoDates=["2026-09-11","2026-09-12","2026-09-13"];
    const isDemo=records.length===3&&records.every((record,index)=>record.date===demoDates[index]&&record.reportedBy==="Vignesh");
    if(!isDemo){localStorage.setItem(KEY,JSON.stringify(records));return records}
  }catch{}}
  localStorage.setItem(KEY,"[]");
  return [];
}
export function saveRecords(records:DailyRecord[]){
  localStorage.setItem(KEY,JSON.stringify(records));
}
export function loadLocalOrders():CloudOrder[]{
  if(typeof window==="undefined") return [];
  try{
    const value=JSON.parse(localStorage.getItem(ORDER_KEY)||"[]");
    return Array.isArray(value)?value:[];
  }catch{return []}
}
export function saveLocalOrders(orders:CloudOrder[]){
  localStorage.setItem(ORDER_KEY,JSON.stringify(orders));
}
export function exportRecords(records:DailyRecord[]){
  const blob=new Blob([JSON.stringify({version:2,records},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=url;a.download=`hajj-terminal-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
}
