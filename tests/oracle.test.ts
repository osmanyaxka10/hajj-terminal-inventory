import { describe, expect, it } from "vitest";
import { parseOracleRows } from "../lib/oracle";

describe("Oracle read-only import", () => {
  it("maps Oracle MC names and keeps transfer quantities read only", () => {
    const rows = parseOracleRows([{
      "Item Number": "MC-101",
      "Item Description": "Chicken Fajita Sandwich Small",
      "Transfer Order Number": "TO-9001",
      "Expected Quantity": "68",
      "Received Quantity": "65",
      "UOM": "PCS",
      "Status": "Received"
    }]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ productId:"fajita_small", expected:68, received:65, transferOrder:"TO-9001", uom:"PCS" });
  });

  it("flags unknown Oracle items instead of assigning the wrong product", () => {
    const rows = parseOracleRows([{ "MC Name":"Unknown Product", "Quantity":10 }]);
    expect(rows[0].productId).toBeNull();
  });
});
