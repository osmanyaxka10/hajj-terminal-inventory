import { describe, expect, it } from "vitest";
import { buildFefoUsePlan, expiryState, sortBatchesFefo, type ExpiryBatch } from "../lib/expiry";

const batch = (id:string, expiry_date:string, received_date:string, quantity_remaining=5): ExpiryBatch => ({ id, product_code:"fajita_small", expiry_date, received_date, quantity_remaining });

describe("expiry FIFO/FEFO", () => {
  it("uses earliest expiry first", () => {
    const rows = [batch("new", "2026-09-22", "2026-09-16"), batch("first", "2026-09-20", "2026-09-15")];
    expect(sortBatchesFefo(rows).map(row => row.id)).toEqual(["first", "new"]);
  });
  it("uses FIFO when expiry dates are equal", () => {
    const rows = [batch("new", "2026-09-22", "2026-09-16"), batch("old", "2026-09-22", "2026-09-15")];
    expect(sortBatchesFefo(rows).map(row => row.id)).toEqual(["old", "new"]);
  });
  it("splits usage across batches in FEFO order", () => {
    const rows = [batch("later", "2026-09-22", "2026-09-16", 8), batch("first", "2026-09-20", "2026-09-15", 3)];
    expect(buildFefoUsePlan(rows, 6)).toEqual([{id:"first",quantity:3},{id:"later",quantity:3}]);
  });
  it("marks expired stock unsafe", () => {
    expect(expiryState(-1)).toEqual({className:"expired",label:"Expired — remove from sale"});
  });
});
