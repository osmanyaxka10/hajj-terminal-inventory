import { PRODUCTS } from "./products";
import type { DailyRecord, MovementRow, OrderRecommendation, QuantityMap } from "./types";

export function n(v: unknown): number {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? Math.max(0, x) : 0;
}

export function finalStock(r: DailyRecord, productId: string): number {
  return Math.max(
    0,
    n(r.physical[productId]) +
      n(r.receiving[productId]) +
      n(r.transferIn[productId]) -
      n(r.transferOut[productId]) -
      n(r.waste[productId]) -
      n(r.returns[productId]) +
      Number(r.adjustments[productId] ?? 0)
  );
}

export function sorted(records: DailyRecord[]) {
  return [...records].sort((a, b) =>
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
  );
}

export function rawMovement(
  previous: DailyRecord,
  current: DailyRecord,
  productId: string
): { movement: number | null; discrepancy: boolean; potentialStockout: boolean } {
  const prevFinal = finalStock(previous, productId);
  const currentPhysical = n(current.physical[productId]);
  const value = prevFinal - currentPhysical;
  if (value < 0) {
    return { movement: null, discrepancy: true, potentialStockout: false };
  }
  return {
    movement: value,
    discrepancy: false,
    potentialStockout: currentPhysical === 0 && prevFinal > 0
  };
}

type MovementPoint = {
  date: string;
  value: number;
  potentialStockout: boolean;
};

export function movementSeries(
  records: DailyRecord[],
  productId: string
): MovementPoint[] {
  const a = sorted(records);
  const out: MovementPoint[] = [];
  for (let i = 1; i < a.length; i++) {
    const m = rawMovement(a[i - 1], a[i], productId);
    if (m.movement !== null) {
      // Demand occurred after the previous physical count, so attribute it to that business day.
      out.push({
        date: a[i - 1].date,
        value: m.movement,
        potentialStockout: m.potentialStockout
      });
    }
  }
  return out;
}

export function movementHistory(records: DailyRecord[], productId: string): number[] {
  return movementSeries(records, productId).map(x => x.value);
}

export function avg(values: number[], days: number): number {
  const v = values.slice(-days);
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
}

export function weeklyVelocity(records: DailyRecord[], productId: string) {
  const values = movementHistory(records, productId);
  const latest = values.slice(-7);
  const previous = values.slice(-35, -7);
  const weeklyMovement = latest.reduce((sum, value) => sum + value, 0);
  const previousWeeklyAverage = previous.length
    ? previous.reduce((sum, value) => sum + value, 0) / (previous.length / 7)
    : 0;
  let velocity: "Fast" | "Normal" | "Slow" | "No movement" | "Insufficient" = "Insufficient";
  if (latest.length >= 3) {
    if (weeklyMovement === 0) velocity = "No movement";
    else if (!previous.length) velocity = "Normal";
    else if (weeklyMovement > previousWeeklyAverage * 1.2) velocity = "Fast";
    else if (weeklyMovement < previousWeeklyAverage * 0.8) velocity = "Slow";
    else velocity = "Normal";
  }
  return { weeklyMovement, previousWeeklyAverage, velocity };
}

function dateWeekday(date: string): number {
  // noon avoids timezone edge cases
  return new Date(`${date}T12:00:00`).getDay();
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function forecastForDate(
  records: DailyRecord[],
  productId: string,
  targetDate: string
): { value: number; confidence: "High" | "Medium" | "Low"; explanation: string } {
  const series = movementSeries(records, productId);
  const values = series.map(x => x.value);
  const a3 = avg(values, 3);
  const a7 = avg(values, 7);
  const a14 = avg(values, 14);

  const weekday = dateWeekday(targetDate);
  const sameWeekday = series.filter(x => dateWeekday(x.date) === weekday).map(x => x.value);
  const sameAvg = sameWeekday.length
    ? sameWeekday.reduce((s, x) => s + x, 0) / sameWeekday.length
    : (a7 || a3 || a14);

  const base7 = a7 || a3 || a14;
  const trend = base7 > 0 ? Math.min(1.35, Math.max(0.75, (a3 || base7) / base7)) : 1;
  const trendComponent = base7 * trend;

  const raw =
    (a3 || base7) * 0.35 +
    (a7 || base7) * 0.25 +
    sameAvg * 0.20 +
    (a14 || base7) * 0.10 +
    trendComponent * 0.10;

  const recentStockout = series.slice(-3).some(x => x.potentialStockout);
  const value = Math.max(0, raw * (recentStockout ? 1.10 : 1));

  const cleanCount = series.length;
  const confidence: "High" | "Medium" | "Low" =
    cleanCount >= 14 && sameWeekday.length >= 2
      ? "High"
      : cleanCount >= 5
      ? "Medium"
      : "Low";

  return {
    value,
    confidence,
    explanation:
      `3-day ${a3.toFixed(1)}, 7-day ${a7.toFixed(1)}, ` +
      `same weekday ${sameAvg.toFixed(1)}, 14-day ${a14.toFixed(1)}` +
      (recentStockout ? "; stockout safety uplift applied" : "")
  };
}

export function movementRows(records: DailyRecord[]): MovementRow[] {
  const a = sorted(records);
  const cur = a.at(-1);
  const prev = a.at(-2);

  return PRODUCTS.map(p => {
    const hist = movementHistory(records, p.id);
    const avg3 = avg(hist, 3);
    const avg7 = avg(hist, 7);
    const avg14 = avg(hist, 14);
    let movement: number | null = null;
    let discrepancy = false;
    let potentialStockout = false;
    let previousFinal: number | null = null;

    if (cur && prev) {
      previousFinal = finalStock(prev, p.id);
      ({ movement, discrepancy, potentialStockout } = rawMovement(prev, cur, p.id));
    }

    let trend: MovementRow["trend"] = "Insufficient";
    if (hist.length >= 2) {
      const baseline = avg7 || avg3;
      const reference = movement ?? avg3;
      if (reference > baseline * 1.25 && reference >= 5) trend = "Fast";
      else if (reference < baseline * 0.70) trend = "Slow";
      else trend = "Normal";
    }

    const current = cur ? finalStock(cur, p.id) : 0;
    const daily = avg7 || avg3 || avg14;
    const weekly = weeklyVelocity(records, p.id);

    return {
      productId: p.id,
      previousFinal,
      currentPhysical: cur ? n(cur.physical[p.id]) : 0,
      movement,
      discrepancy,
      potentialStockout,
      avg3,
      avg7,
      avg14,
      weeklyMovement: weekly.weeklyMovement,
      previousWeeklyAverage: weekly.previousWeeklyAverage,
      trend,
      daysRemaining: daily > 0 ? current / daily : null
    };
  });
}

function nextOrSameWeekday(date: string, weekday: number): string {
  const d = new Date(`${date}T12:00:00`);
  const diff = (weekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function recommendedOrderDate(
  records: DailyRecord[],
  mode: "tomorrow" | "weekly" | "weekend" | "emergency"
): string {
  const latest = sorted(records).at(-1);
  const base = latest?.date || new Date().toISOString().slice(0, 10);
  if (mode === "emergency") return base;
  if (mode === "weekend") return nextOrSameWeekday(base, 4); // Thursday
  return addDays(base, 1);
}

export function recommend(
  records: DailyRecord[],
  mode: "tomorrow" | "weekly" | "weekend" | "emergency"
): OrderRecommendation[] {
  const cur = sorted(records).at(-1);
  if (!cur) return [];

  const baseDate = cur.date;
  const tomorrow = addDays(baseDate, 1);
  const thursday = nextOrSameWeekday(baseDate, 4);
  const friday = addDays(thursday, 1);

  return PRODUCTS.map(p => {
    const current = finalStock(cur, p.id);
    const one = forecastForDate(records, p.id, tomorrow);

    let forecast = one.value;
    let forecastBreakdown = [{ date: tomorrow, value: one.value }];
    let confidence = one.confidence;
    let forecastExplanation = one.explanation;

    if (mode === "weekly") {
      forecastBreakdown = Array.from({ length: 7 }, (_, index) => {
        const date = addDays(baseDate, index + 1);
        return { date, value: forecastForDate(records, p.id, date).value };
      });
      forecast = forecastBreakdown.reduce((sum, day) => sum + day.value, 0);
      forecastExplanation = `Seven-day demand forecast from ${forecastBreakdown[0].date} to ${forecastBreakdown[6].date}.`;
    }

    if (mode === "weekend") {
      const thu = forecastForDate(records, p.id, thursday);
      const fri = forecastForDate(records, p.id, friday);
      forecast = thu.value + fri.value;
      forecastBreakdown = [
        { date: thursday, value: thu.value },
        { date: friday, value: fri.value }
      ];
      confidence =
        thu.confidence === "Low" || fri.confidence === "Low"
          ? "Low"
          : thu.confidence === "Medium" || fri.confidence === "Medium"
          ? "Medium"
          : "High";
      forecastExplanation =
        `Thu ${thu.value.toFixed(1)} + Fri ${fri.value.toFixed(1)}. ` +
        `Thu basis: ${thu.explanation}. Fri basis: ${fri.explanation}.`;
    }

    const recentSeries = movementSeries(records, p.id);
    const recentStockout = recentSeries.slice(-3).some(x => x.potentialStockout);
    let safety = mode === "emergency" ? 0 : p.safetyStock;
    if (recentStockout && mode !== "emergency") safety = Math.ceil(safety * 1.25);

    const target = Math.ceil(forecast + safety);
    let recommended = Math.max(0, target - current);

    if (mode === "emergency") {
      recommended = current < forecast ? Math.max(0, Math.ceil(forecast - current)) : 0;
    }

    const explanation =
      `Current ${current}; forecast ${forecast.toFixed(1)}; safety ${safety}; ` +
      `target ${target}; recommended ${recommended}. ${forecastExplanation}`;

    return {
      productId: p.id,
      current,
      forecast,
      safety,
      target,
      recommended,
      confidence,
      explanation,
      forecastBreakdown: mode === "emergency"
        ? [{ date: baseDate, value: one.value }]
        : forecastBreakdown,
      ...weeklyVelocity(records, p.id)
    };
  });
}

export function totals(record: DailyRecord | null): Record<string, number> {
  const t = { Sandwiches: 0, Cakes: 0, Croissants: 0 };
  if (!record) return t;
  for (const p of PRODUCTS) t[p.category] += finalStock(record, p.id);
  return t;
}

export function emptyMap(): QuantityMap {
  return Object.fromEntries(PRODUCTS.map(p => [p.id, 0]));
}
