import type { DailyRecord } from "./types";
import { emptyMap } from "./engine";

function rec(date:string, physical:Record<string,number>):DailyRecord {
  return {
    id:crypto.randomUUID(), date, time:"05:00", reportedBy:"Demo",
    physical:{...emptyMap(),...physical}, receiving:emptyMap(), transferIn:emptyMap(), transferOut:emptyMap(),
    waste:emptyMap(), returns:emptyMap(), adjustments:emptyMap(), createdAt:new Date().toISOString()
  };
}

// Synthetic offline demo data only. Real operational data lives in Supabase, not in source control.
export function seedRecords():DailyRecord[] {
  return [
    rec("2026-01-01",{fajita:60,tuna:20,halloumi:16,turkey:18,ranch:14,caesar:14,three_cheese:12,lemon:8,date:8,croissant_yellow:10,croissant_white:10,croissant_chocolate:8,croissant_plain:8}),
    rec("2026-01-02",{fajita:34,tuna:13,halloumi:11,turkey:12,ranch:10,caesar:9,three_cheese:9,lemon:6,date:5,croissant_yellow:7,croissant_white:7,croissant_chocolate:6,croissant_plain:6}),
    rec("2026-01-03",{fajita:10,tuna:7,halloumi:8,turkey:5,ranch:7,caesar:5,three_cheese:6,lemon:4,date:3,croissant_yellow:5,croissant_white:5,croissant_chocolate:4,croissant_plain:4})
  ];
}
