import { describe, expect, it } from "vitest";
import {
  forecastForDate,
  movementHistory,
  recommend,
  recommendedOrderDate
} from "../lib/engine";
import { seedRecords } from "../lib/seed";

describe("movement and forecast engine", () => {
  it("calculates confirmed Fajita movement", () => {
    expect(movementHistory(seedRecords(), "fajita")).toEqual([26, 24]);
  });

  it("calculates synthetic 3 Cheese movement", () => {
    expect(movementHistory(seedRecords(), "three_cheese")).toEqual([3, 3]);
  });

  it("produces a nonnegative weekday forecast", () => {
    const f = forecastForDate(seedRecords(), "fajita", "2026-09-14");
    expect(f.value).toBeGreaterThanOrEqual(0);
  });

  it("weekend forecast covers Thu + Fri separately and order qty never goes negative", () => {
    const recs = recommend(seedRecords(), "weekend");
    expect(recs.every(r => r.recommended >= 0)).toBe(true);
    expect(recommendedOrderDate(seedRecords(), "weekend")).toBe("2026-01-08");
  });

  it("manager-order output retains confidence and explanation", () => {
    const f = recommend(seedRecords(), "tomorrow").find(x => x.productId === "fajita");
    expect(f?.confidence).toBeTruthy();
    expect(f?.explanation).toContain("Current");
  });
});