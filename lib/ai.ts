import type { MovementRow, OrderRecommendation } from "./types";
import { PRODUCTS } from "./products";

export async function askInventoryAI(input:{
  question:string;
  reportDate:string|null;
  movement:MovementRow[];
  orderMode:string;
  orderFor:string;
  recommendations:OrderRecommendation[];
}) {
  const recommendationByProduct = new Map(input.recommendations.map(row => [row.productId, row]));
  const products = input.movement.map(m=>{
    const recommendation = recommendationByProduct.get(m.productId);
    return {
      name: PRODUCTS.find(p=>p.id===m.productId)?.name || m.productId,
      current: recommendation?.current ?? 0,
      movement: m.movement,
      avg3: m.avg3,
      avg7: m.avg7,
      avg14: m.avg14,
      daysRemaining: m.daysRemaining,
      trend: m.trend,
      velocity: recommendation?.velocity ?? "Insufficient",
      recommended: recommendation?.recommended ?? 0,
      discrepancy: m.discrepancy,
      possibleStockout: m.potentialStockout
    };
  });

  const totalRecommended = input.recommendations.reduce((s,r)=>s+r.recommended,0);

  const res = await fetch("/api/ai",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      question:input.question,
      date:input.reportDate,
      products,
      order:{
        mode:input.orderMode,
        orderFor:input.orderFor,
        totalRecommended
      }
    })
  });

  const data = await res.json();
  if(!res.ok) throw new Error(data.error || "AI request failed");
  return data.answer as string;
}
