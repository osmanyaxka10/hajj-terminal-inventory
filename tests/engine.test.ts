import { describe, expect, it } from "vitest";
import {
  forecastForDate,
  weeklyVelocity,
  movementHistory,
  movementReport,
  recommend,
  recommendedOrderDate
} from "../lib/engine";
import { seedRecords } from "../lib/seed";

describe("movement and forecast engine", () => {
  it("calculates confirmed Ranch movement", () => {
    expect(movementHistory(seedRecords(), "ranch")).toEqual([6, 9]);
  });

  it("does not treat an unexplained 3 Cheese stock increase as negative sales", () => {
    expect(movementHistory(seedRecords(), "three_cheese")).toEqual([9]);
  });

  it("produces a nonnegative weekday forecast", () => {
    const f = forecastForDate(seedRecords(), "ranch", "2026-09-14");
    expect(f.value).toBeGreaterThanOrEqual(0);
  });

  it("weekend forecast covers Thu + Fri separately and order qty never goes negative", () => {
    const recs = recommend(seedRecords(), "weekend");
    expect(recs.every(r => r.recommended >= 0)).toBe(true);
    expect(recs.every(r => r.forecastBreakdown.length === 2)).toBe(true);
    expect(recs[0].forecastBreakdown.map(x => x.date)).toEqual(["2026-09-17", "2026-09-18"]);
    expect(recs[0].forecast).toBeCloseTo(
      recs[0].forecastBreakdown.reduce((sum, x) => sum + x.value, 0)
    );
    expect(recommendedOrderDate(seedRecords(), "weekend")).toBe("2026-09-17");
  });

  it("builds a seven-day order forecast and exposes weekly movement speed", () => {
    const records = seedRecords();
    const recs = recommend(records, "weekly");
    expect(recs[0].forecastBreakdown).toHaveLength(7);
    expect(recs.every(r => r.recommended >= 0)).toBe(true);
    expect(weeklyVelocity(records, "ranch").weeklyMovement).toBe(15);
  });

  it("builds weekly and monthly report series", () => {
    expect(movementReport(seedRecords(),7).daily).toHaveLength(7);
    expect(movementReport(seedRecords(),30).daily).toHaveLength(30);
  });

  it("manager-order output retains confidence and explanation", () => {
    const f = recommend(seedRecords(), "tomorrow").find(x => x.productId === "ranch");
    expect(f?.confidence).toBeTruthy();
    expect(f?.explanation).toContain("Current");
  });
});
