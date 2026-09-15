import type { Category, Product } from "./types";

export const CATEGORIES: Category[] = ["Sandwiches", "Cakes", "Croissants"];

export const PRODUCTS: Product[] = [
  {id:"ranch",name:"Chicken Ranch Club Sandwich",category:"Sandwiches",shelfLifeDays:6,safetyStock:5,targetDays:1.5,active:true},
  {id:"caesar",name:"Caesar Chicken Club Sandwich",category:"Sandwiches",shelfLifeDays:6,safetyStock:5,targetDays:1.5,active:true},
  {id:"three_cheese",name:"3 Cheese Club Sandwich",category:"Sandwiches",shelfLifeDays:6,safetyStock:5,targetDays:1.5,active:true},
  {id:"fajita_small",name:"Chicken Fajita Sandwich Small",category:"Sandwiches",shelfLifeDays:6,safetyStock:4,targetDays:1.5,active:true},
  {id:"turkey_small",name:"Turkey Cheese Sandwich Small",category:"Sandwiches",shelfLifeDays:6,safetyStock:4,targetDays:1.5,active:true},
  {id:"tuna_small",name:"Tuna Sandwich Small",category:"Sandwiches",shelfLifeDays:6,safetyStock:4,targetDays:1.5,active:true},
  {id:"halloumi_small",name:"Halloumi Sandwich Small",category:"Sandwiches",shelfLifeDays:6,safetyStock:4,targetDays:1.5,active:true},
  {id:"lemon",name:"English Lemon Cake",category:"Cakes",shelfLifeDays:6,safetyStock:4,targetDays:2,active:true},
  {id:"date",name:"English Dates Cake",category:"Cakes",shelfLifeDays:6,safetyStock:4,targetDays:2,active:true},
  {id:"croissant_small_butter",name:"Croissant Small Butter",category:"Croissants",shelfLifeDays:6,safetyStock:3,targetDays:1.5,active:true},
  {id:"croissant_small_white",name:"Croissant Small White Cheese",category:"Croissants",shelfLifeDays:6,safetyStock:3,targetDays:1.5,active:true},
  {id:"croissant_small_yellow",name:"Croissant Small Yellow Cheese",category:"Croissants",shelfLifeDays:6,safetyStock:3,targetDays:1.5,active:true},
  {id:"croissant_small_chocolate",name:"Croissant Small Chocolate",category:"Croissants",shelfLifeDays:6,safetyStock:3,targetDays:1.5,active:true}
];

export const ALIASES: Record<string,string> = {
  "ranch":"ranch","chicken ranch":"ranch","chicken ranch club":"ranch","chicken ranch club sandwich":"ranch",
  "caesar":"caesar","caeser":"caesar","chicken caesar":"caesar","chicken ceasr club":"caesar","caesar chicken club sandwich":"caesar",
  "3 cheese":"three_cheese","three cheese":"three_cheese","3 cheese club":"three_cheese","3 cheese club sandwich":"three_cheese",
  "fajita small":"fajita_small","chicken fajita sandwich small":"fajita_small",
  "turkey small":"turkey_small","turkey cheese sandwich small":"turkey_small",
  "tuna small":"tuna_small","tuna sandwich small":"tuna_small",
  "halloumi small":"halloumi_small","halloumi sandwich small":"halloumi_small",
  "lemon":"lemon","lemon english cake":"lemon","english lemon cake":"lemon",
  "date":"date","dates":"date","date english cake":"date","english dates cake":"date",
  "small butter croissant":"croissant_small_butter","devon small butter croissant":"croissant_small_butter",
  "small white croissant":"croissant_small_white","small white cheese croissant":"croissant_small_white",
  "small yellow croissant":"croissant_small_yellow","small yellow cheese croissant":"croissant_small_yellow",
  "small chocolate croissant":"croissant_small_chocolate","devon small chocolate croissant":"croissant_small_chocolate",
  ...Object.fromEntries(PRODUCTS.map(product => [product.name.toLowerCase(), product.id]))
};
