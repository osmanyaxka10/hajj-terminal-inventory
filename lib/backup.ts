import type { DailyRecord, CloudOrder, ForecastAccuracyRow } from "./types";

export function downloadFullBackup(input:{
  records:DailyRecord[];
  orders:CloudOrder[];
  forecastRows:ForecastAccuracyRow[];
}) {
  const payload={
    version:6,
    exportedAt:new Date().toISOString(),
    system:"Hajj Terminal Inventory",
    records:input.records,
    orders:input.orders,
    forecastAccuracy:input.forecastRows
  };
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download=`hajj-terminal-full-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}