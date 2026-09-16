import { ALIASES, PRODUCTS } from "./products";

export type OracleImportRow = {
  itemNumber: string;
  itemName: string;
  productId: string | null;
  uom: string;
  expected: number;
  received: number;
  transactionDate: string;
  transferOrder: string;
  status: string;
};

function text(value: unknown) {
  return String(value ?? "").trim();
}

function number(value: unknown) {
  const parsed = Number(String(value ?? "0").replace(/,/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function normalized(value: unknown) {
  return text(value).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function valueFrom(row: Record<string, unknown>, aliases: string[]) {
  const entries = Object.entries(row);
  for (const alias of aliases) {
    const found = entries.find(([key]) => normalized(key) === normalized(alias));
    if (found) return found[1];
  }
  return "";
}

export function matchOracleProduct(itemName: string, itemNumber = "") {
  const key = normalized(itemName);
  const code = normalized(itemNumber);
  if (ALIASES[key]) return ALIASES[key];
  if (PRODUCTS.some(product => product.id === code)) return code;
  const exact = PRODUCTS.find(product => normalized(product.name) === key);
  return exact?.id ?? null;
}

export function parseOracleRows(input: Record<string, unknown>[]): OracleImportRow[] {
  return input.map(row => {
    const itemNumber = text(valueFrom(row, ["Item Number", "Item", "Item Code", "MC Code"]));
    const itemName = text(valueFrom(row, ["Item Description", "Item Name", "Description", "MC Name"]));
    const expected = number(valueFrom(row, ["Expected Quantity", "Ordered Quantity", "Transfer Quantity", "Quantity", "Requested Quantity"]));
    const receivedValue = valueFrom(row, ["Received Quantity", "Receipt Quantity", "Quantity Received", "Delivered Quantity"]);
    const received = text(receivedValue) ? number(receivedValue) : expected;
    return {
      itemNumber,
      itemName,
      productId: matchOracleProduct(itemName, itemNumber),
      uom: text(valueFrom(row, ["UOM", "Unit of Measure", "Primary UOM"])),
      expected,
      received,
      transactionDate: text(valueFrom(row, ["Transaction Date", "Receipt Date", "Date", "Creation Date"])),
      transferOrder: text(valueFrom(row, ["Transfer Order", "Transfer Order Number", "Document Number", "Order Number"])),
      status: text(valueFrom(row, ["Status", "Receipt Status", "Line Status"]))
    };
  }).filter(row => row.itemName || row.itemNumber);
}
