import type { DailyRecord } from "./types";
import { emptyMap } from "./engine";

function rec(date:string, physical:Record<string,number>):DailyRecord {
  return {
    id:crypto.randomUUID(),date,time:"05:00",reportedBy:"Vignesh",
    physical:{...emptyMap(),...physical},receiving:emptyMap(),transferIn:emptyMap(),transferOut:emptyMap(),
    waste:emptyMap(),returns:emptyMap(),adjustments:emptyMap(),createdAt:new Date().toISOString()
  };
}

export function seedRecords():DailyRecord[]{
  return [
    rec("2026-09-11",{fajita:150,tuna:25,halloumi:36,turkey:29,ranch:28,caesar:30,three_cheese:27,lemon:12,date:15,croissant_yellow:12,croissant_white:19,croissant_chocolate:8,croissant_plain:11}),
    rec("2026-09-12",{fajita:124,tuna:15,halloumi:30,turkey:20,ranch:22,caesar:21,three_cheese:18,lemon:12,date:10,croissant_yellow:14,croissant_white:11,croissant_chocolate:8,croissant_plain:7}),
    rec("2026-09-13",{fajita:80,tuna:4,halloumi:22,turkey:9,ranch:13,caesar:13,three_cheese:20,lemon:2,date:0,croissant_yellow:6,croissant_white:8,croissant_chocolate:7,croissant_plain:7})
  ];
}