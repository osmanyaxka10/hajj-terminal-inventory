import { describe, expect, it } from "vitest";
import {
  forecastForDate,
  weeklyVelocity,
  movementHistory,
  movementReport,
  dailySalesReport,
  salesPeriodReport,
  hasCountForDate,
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

  it("builds a read-only itemized sales report for a completed day", () => {
    const report = dailySalesReport(seedRecords(), "2026-09-11");
    expect(report.complete).toBe(true);
    expect(report.nextCountDate).toBe("2026-09-12");
    expect(report.rows.find(row => row.productId === "ranch")?.sold).toBe(6);
    expect(report.total).toBeGreaterThan(0);
  });

  it("waits for the next count before confirming daily sales", () => {
    const report = dailySalesReport(seedRecords(), "2026-09-13");
    expect(report.complete).toBe(false);
    expect(report.rows.every(row => row.sold === null)).toBe(true);
  });

  it("aggregates read-only weekly sales from completed days", () => {
    const report = salesPeriodReport(seedRecords(), "weekly", "2026-09-12");
    expect(report.days.length).toBeGreaterThan(0);
    expect(report.expectedDays).toBe(7);
    expect(report.missingDates).toHaveLength(5);
    expect(report.total).toBe(report.categoryTotals.Sandwiches+report.categoryTotals.Cakes+report.categoryTotals.Croissants);
  });

  it("blocks an accidental second count for the same business date", () => {
    const records=seedRecords();
    expect(hasCountForDate(records,"2026-09-13")).toBe(true);
    expect(hasCountForDate(records,"2026-09-14")).toBe(false);
  });

  it("manager-order output retains confidence and explanation", () => {
    const f = recommend(seedRecords(), "tomorrow").find(x => x.productId === "ranch");
    expect(f?.confidence).toBeTruthy();
    expect(f?.explanation).toContain("Current");
  });
});
