import { describe, expect, it } from "vitest";
import { POST } from "../app/api/ai/route";

describe("built-in Hajj Stock Assistant", () => {
  it("answers current availability without an API key", async () => {
    const response = await POST(new Request("http://localhost/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "What stock is available?",
        date: "2026-09-16",
        products: [
          { name: "Chicken Fajita Sandwich Small", current: 72, movement: 11, avg7: 11, daysRemaining: 6.5, trend: "Normal", velocity: "Normal", recommended: 0, discrepancy: false, possibleStockout: false },
          { name: "English Dates Cake", current: 46, movement: 3, avg7: 3, daysRemaining: 15.3, trend: "Normal", velocity: "Normal", recommended: 0, discrepancy: false, possibleStockout: false }
        ],
        order: { mode: "tomorrow", orderFor: "2026-09-17", totalRecommended: 0 }
      })
    }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.mode).toBe("built-in");
    expect(body.answer).toContain("118 pieces");
    expect(body.answer).toContain("Chicken Fajita Sandwich Small: 72");
  });
});
