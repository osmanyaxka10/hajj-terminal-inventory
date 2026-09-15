import { PRODUCTS } from "./products";
import { finalStock, movementRows, sorted } from "./engine";
import type { DailyRecord, OrderRecommendation, QuantityMap } from "./types";

function download(name:string, text:string, type="text/csv;charset=utf-8"){
  const blob=new Blob([text],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=name;a.click();
  URL.revokeObjectURL(url);
}

function csvCell(v:unknown){
  const s=String(v ?? "");
  return `"${s.replace(/"/g,'""')}"`;
}

export function exportDailyMovementCsv(records:DailyRecord[]){
  const arr=sorted(records);
  const latest=arr.at(-1);
  if(!latest) return;
  const rows=movementRows(records);
  const lines=[
    ["Product","Current Physical","Movement","3 Day Avg","7 Day Avg","14 Day Avg","Days Remaining","Trend","Discrepancy","Potential Stockout"],
    ...rows.map(r=>[
      PRODUCTS.find(p=>p.id===r.productId)?.name || r.productId,
      r.currentPhysical,
      r.movement ?? "",
      r.avg3.toFixed(2),
      r.avg7.toFixed(2),
      r.avg14.toFixed(2),
      r.daysRemaining?.toFixed(2) ?? "",
      r.trend,
      r.discrepancy ? "Yes":"No",
      r.potentialStockout ? "Yes":"No"
    ])
  ];
  download(`hajj-daily-movement-${latest.date}.csv`, lines.map(r=>r.map(csvCell).join(",")).join("\n"));
}

export function exportCurrentInventoryCsv(records:DailyRecord[]){
  const latest=sorted(records).at(-1);
  if(!latest) return;
  const lines=[
    ["Product","Category","Physical","Receiving","Transfer In","Transfer Out","Waste","Adjustment","Final Stock"],
    ...PRODUCTS.map(p=>[
      p.name,p.category,
      latest.physical[p.id]||0,
      latest.receiving[p.id]||0,
      latest.transferIn[p.id]||0,
      latest.transferOut[p.id]||0,
      latest.waste[p.id]||0,
      latest.adjustments[p.id]||0,
      finalStock(latest,p.id)
    ])
  ];
  download(`hajj-inventory-${latest.date}.csv`, lines.map(r=>r.map(csvCell).join(",")).join("\n"));
}

export function exportOrderCsv(
  date:string,
  mode:string,
  recommendations:OrderRecommendation[],
  approved:QuantityMap
){
  const lines=[
    ["Product","Current","Forecast","Safety","Target","Recommended","Approved","Confidence","Explanation"],
    ...recommendations.map(r=>[
      PRODUCTS.find(p=>p.id===r.productId)?.name || r.productId,
      r.current,r.forecast.toFixed(2),r.weeklyMovement,r.velocity,r.safety,r.target,r.recommended,approved[r.productId]||0,r.confidence,r.explanation
    ])
  ];
  download(`hajj-${mode}-order-${date}.csv`, lines.map(r=>r.map(csvCell).join(",")).join("\n"));
}

export function downloadOrderIcs(
  orderFor:string,
  mode:string,
  total:number
){
  const start=`${orderFor.replaceAll("-","")}T090000`;
  const end=`${orderFor.replaceAll("-","")}T093000`;
  const title=mode==="weekend"?"Review Hajj Terminal Thu + Fri weekend order":"Review Hajj Terminal inventory order";
  const desc=`Approved/order-planning reminder. Total planned quantity: ${total} pcs. Open Hajj Terminal Inventory to review item-level quantities.`;
  const ics=[
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hajj Terminal Inventory//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@hajj-terminal-inventory`,
    `DTSTART;TZID=Asia/Riyadh:${start}`,
    `DTEND;TZID=Asia/Riyadh:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc.replace(/\n/g,"\\n")}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Inventory order reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
  download(`hajj-order-reminder-${orderFor}.ics`,ics,"text/calendar;charset=utf-8");
}

export async function exportInventoryXlsx(records: DailyRecord[]) {
  const XLSX = await import("xlsx");
  const latest = sorted(records).at(-1);
  if (!latest) return;

  const rows = PRODUCTS.map(p=>({
    Product:p.name,
    Category:p.category,
    Physical:latest.physical[p.id]||0,
    Receiving:latest.receiving[p.id]||0,
    "Transfer In":latest.transferIn[p.id]||0,
    "Transfer Out":latest.transferOut[p.id]||0,
    Waste:latest.waste[p.id]||0,
    Adjustment:latest.adjustments[p.id]||0,
    "Final Stock":finalStock(latest,p.id)
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb,ws,"Current Inventory");

  const moves = movementRows(records).map(r=>({
    Product:PRODUCTS.find(p=>p.id===r.productId)?.name||r.productId,
    Movement:r.movement,
    "3 Day Avg":Number(r.avg3.toFixed(2)),
    "7 Day Avg":Number(r.avg7.toFixed(2)),
    "14 Day Avg":Number(r.avg14.toFixed(2)),
    "Days Remaining":r.daysRemaining===null?null:Number(r.daysRemaining.toFixed(2)),
    Trend:r.trend,
    Discrepancy:r.discrepancy?"Yes":"No",
    "Possible Stockout":r.potentialStockout?"Yes":"No"
  }));
  XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(moves),"Movement");

  XLSX.writeFile(wb,`hajj-terminal-report-${latest.date}.xlsx`);
}

export async function exportInventoryPdf(records: DailyRecord[]) {
  const { jsPDF } = await import("jspdf");
  const latest = sorted(records).at(-1);
  if (!latest) return;

  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("Hajj Terminal Inventory Report",14,18);
  doc.setFontSize(10);
  doc.text(`Date: ${latest.date} ${latest.time}`,14,26);

  let y=36;
  for(const p of PRODUCTS){
    const current=finalStock(latest,p.id);
    doc.text(`${p.name}: ${current}`,14,y);
    y+=6;
    if(y>275){doc.addPage();y=18}
  }

  doc.save(`hajj-terminal-report-${latest.date}.pdf`);
}
