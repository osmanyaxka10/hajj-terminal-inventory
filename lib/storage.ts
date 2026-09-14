"use client";
import type { DailyRecord } from "./types";
import { seedRecords } from "./seed";

const KEY="hajj-terminal-inventory-v2";

export function loadRecords():DailyRecord[]{
  if(typeof window==="undefined") return [];
  const raw=localStorage.getItem(KEY);
  if(raw){try{return JSON.parse(raw) as DailyRecord[]}catch{}}
  const seed=seedRecords(); localStorage.setItem(KEY,JSON.stringify(seed)); return seed;
}
export function saveRecords(records:DailyRecord[]){
  localStorage.setItem(KEY,JSON.stringify(records));
}
export function exportRecords(records:DailyRecord[]){
  const blob=new Blob([JSON.stringify({version:2,records},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob); const a=document.createElement("a");
  a.href=url;a.download=`hajj-terminal-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
}