import { NextResponse } from "next/server";

type ProductSnapshot = {
  name: string;
  current: number;
  movement: number | null;
  avg7: number;
  daysRemaining: number | null;
  trend: string;
  velocity: string;
  recommended: number;
  discrepancy: boolean;
  possibleStockout: boolean;
};

type RequestBody = {
  question: string;
  date: string | null;
  products: ProductSnapshot[];
  order?: { mode: string; orderFor: string; totalRecommended: number } | null;
};

function builtInAnswer(body: RequestBody) {
  const products = body.products || [];
  const question = String(body.question || "").toLowerCase();
  const total = products.reduce((sum, product) => sum + product.current, 0);
  const out = products.filter(product => product.current <= 0);
  const low = products.filter(product => product.current > 0 && product.current <= 5);
  const order = products.filter(product => product.recommended > 0).sort((a, b) => b.recommended - a.recommended);
  const fastest = [...products].filter(product => product.movement !== null).sort((a, b) => (b.movement || 0) - (a.movement || 0));
  const atRisk = [...products].filter(product => product.daysRemaining !== null).sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));

  if (/available|stock|have|current/.test(question)) {
    return `Hajj Terminal available stock on ${body.date || "the latest report"}: ${total} pieces.\n\n${products.map(product => `• ${product.name}: ${product.current}`).join("\n")}`;
  }
  if (/order|tomorrow|weekly|weekend/.test(question)) {
    if (!order.length) return `No order is recommended yet. Current available stock is ${total} pieces. More daily counts will improve the forecast.`;
    return `${body.order?.mode || "Current"} order recommendation for ${body.order?.orderFor || "the selected date"}:\n\n${order.map(product => `• ${product.name}: order ${product.recommended} (available ${product.current})`).join("\n")}\n\nTotal recommended: ${order.reduce((sum, product) => sum + product.recommended, 0)} pieces.`;
  }
  if (/finish|risk|low|out|urgent/.test(question)) {
    return [
      out.length ? `Out of stock:\n${out.map(product => `• ${product.name}`).join("\n")}` : "No item is out of stock.",
      low.length ? `Low stock (1–5):\n${low.map(product => `• ${product.name}: ${product.current}`).join("\n")}` : "No item is in the 1–5 low-stock range.",
      atRisk.length ? `Lowest estimated cover:\n${atRisk.slice(0, 5).map(product => `• ${product.name}: ${product.daysRemaining?.toFixed(1)} days`).join("\n")}` : "More daily counts are needed to estimate days remaining."
    ].join("\n\n");
  }
  if (/movement|fast|slow|sales|sold/.test(question)) {
    if (!fastest.length) return "A second daily count is needed before movement can be calculated.";
    return `Latest calculated movement:\n\n${fastest.map(product => `• ${product.name}: ${product.movement ?? 0} (${product.velocity})`).join("\n")}`;
  }
  return `Hajj Terminal stock summary for ${body.date || "the latest report"}: ${total} pieces available. ${out.length} item(s) are out and ${low.length} item(s) are low.\n\nYou can ask:\n• What stock is available?\n• Which items are low or out?\n• What should I order tomorrow?\n• Which items move fastest?`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody;
    if (!String(body.question || "").trim()) return NextResponse.json({ error: "Question is required." }, { status: 400 });
    return NextResponse.json({ answer: builtInAnswer(body), mode: "built-in" });
  } catch {
    return NextResponse.json({ error: "Could not read the inventory question." }, { status: 400 });
  }
}
