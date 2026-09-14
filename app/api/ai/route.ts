import OpenAI from "openai";
import { NextResponse } from "next/server";

type ProductSnapshot = {
  name: string;
  current: number;
  movement: number | null;
  avg3: number;
  avg7: number;
  avg14: number;
  daysRemaining: number | null;
  trend: string;
  discrepancy: boolean;
  possibleStockout: boolean;
};

type RequestBody = {
  question: string;
  date: string | null;
  products: ProductSnapshot[];
  order?: {
    mode: string;
    orderFor: string;
    totalRecommended: number;
  } | null;
};

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "AI is not configured. Add OPENAI_API_KEY on the server." },
      { status: 503 }
    );
  }

  const body = (await req.json()) as RequestBody;
  const question = String(body.question || "").trim();

  if (!question) {
    return NextResponse.json({ error: "Question is required." }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const system = `
You are the read-only Hajj Terminal Inventory assistant.
You may analyze ONLY the inventory snapshot supplied by the application.
Never invent receiving, transfers, waste, stock, sales, or supplier events.
Do not claim you changed inventory, approved an order, or wrote to the database.
When stock increased unexpectedly and discrepancy=true, explicitly call it a discrepancy.
A possibleStockout means observed movement may be censored demand and actual demand may have been higher.
Weekend means Thursday + Friday.
Give concise operational answers with quantities and explain the reason.
`;

  const context = JSON.stringify({
    reportDate: body.date,
    products: body.products,
    order: body.order || null
  });

  try {
    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      input: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Inventory context:\n${context}\n\nQuestion:\n${question}`
        }
      ]
    });

    return NextResponse.json({ answer: response.output_text });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { error: error?.message || "AI request failed." },
      { status: 500 }
    );
  }
}