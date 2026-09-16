export type ExpiryBatch = {
  id: string;
  product_code: string;
  quantity_remaining: number;
  received_date: string;
  expiry_date: string;
  created_at?: string;
};

export type BatchUse = { id: string; quantity: number };

export function sortBatchesFefo<T extends ExpiryBatch>(batches: T[]): T[] {
  return [...batches].sort((a, b) =>
    a.expiry_date.localeCompare(b.expiry_date) ||
    a.received_date.localeCompare(b.received_date) ||
    (a.created_at || "").localeCompare(b.created_at || "") ||
    a.id.localeCompare(b.id)
  );
}

export function buildFefoUsePlan(batches: ExpiryBatch[], requested: number): BatchUse[] {
  let remaining = Math.max(0, Math.floor(requested));
  const plan: BatchUse[] = [];
  for (const batch of sortBatchesFefo(batches).filter(batch => batch.quantity_remaining > 0)) {
    if (!remaining) break;
    const quantity = Math.min(batch.quantity_remaining, remaining);
    plan.push({ id: batch.id, quantity });
    remaining -= quantity;
  }
  return plan;
}

export function expiryState(days: number): { className: string; label: string } {
  if (days < 0) return { className: "expired", label: "Expired — remove from sale" };
  if (days === 0) return { className: "urgent", label: "Expires today" };
  if (days === 1) return { className: "urgent", label: "1 day left" };
  if (days <= 3) return { className: "soon", label: `${days} days left` };
  if (days <= 5) return { className: "watch", label: `${days} days left` };
  return { className: "safe", label: `${days} days left` };
}
