import { ALIASES } from "./products";
import type { QuantityMap } from "./types";

function normalize(s:string){return s.toLowerCase().replace(/[–—]/g,"-").replace(/\s+/g," ").trim()}

export function parseQuickEntry(text:string):QuantityMap{
  const out:QuantityMap={};
  for(const raw of text.split(/\n|,/)){
    const line=normalize(raw);
    if(!line) continue;
    const m=line.match(/^(.+?)\s*(?:[:=+-]|\s)\s*(\d+)\s*$/);
    if(!m) continue;
    const name=normalize(m[1]), qty=Number(m[2]);
    let id=ALIASES[name];
    if(!id){
      const key=Object.keys(ALIASES).sort((a,b)=>b.length-a.length).find(a=>name.includes(a));
      if(key) id=ALIASES[key];
    }
    if(id) out[id]=qty;
  }
  return out;
}