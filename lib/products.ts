import type { Category, Product } from "./types";

export const CATEGORIES: Category[] = ["Sandwiches", "Cakes", "Croissants"];

export const PRODUCTS: Product[] = [
  {id:"fajita",name:"Chicken Fajita Wrap",category:"Sandwiches",shelfLifeDays:5,safetyStock:18,targetDays:1.5,active:true},
  {id:"tuna",name:"Tuna Spicy Cheese Ciabatta",category:"Sandwiches",shelfLifeDays:5,safetyStock:6,targetDays:1.5,active:true},
  {id:"halloumi",name:"Halloumi Pesto Baguette",category:"Sandwiches",shelfLifeDays:5,safetyStock:6,targetDays:1.5,active:true},
  {id:"turkey",name:"Turkey & Cheese Baguette",category:"Sandwiches",shelfLifeDays:5,safetyStock:6,targetDays:1.5,active:true},
  {id:"ranch",name:"Chicken Ranch Club",category:"Sandwiches",shelfLifeDays:5,safetyStock:5,targetDays:1.5,active:true},
  {id:"caesar",name:"Chicken Caesar Club",category:"Sandwiches",shelfLifeDays:5,safetyStock:5,targetDays:1.5,active:true},
  {id:"three_cheese",name:"3 Cheese Club",category:"Sandwiches",shelfLifeDays:5,safetyStock:5,targetDays:1.5,active:true},
  {id:"lemon",name:"Lemon English Cake",category:"Cakes",shelfLifeDays:14,safetyStock:4,targetDays:2,active:true},
  {id:"date",name:"Date English Cake",category:"Cakes",shelfLifeDays:14,safetyStock:4,targetDays:2,active:true},
  {id:"croissant_yellow",name:"Croissant Yellow Cheese",category:"Croissants",shelfLifeDays:4,safetyStock:3,targetDays:1.5,active:true},
  {id:"croissant_white",name:"Croissant White Cheese",category:"Croissants",shelfLifeDays:4,safetyStock:3,targetDays:1.5,active:true},
  {id:"croissant_chocolate",name:"Croissant Chocolate",category:"Croissants",shelfLifeDays:4,safetyStock:3,targetDays:1.5,active:true},
  {id:"croissant_plain",name:"Croissant Plain",category:"Croissants",shelfLifeDays:4,safetyStock:3,targetDays:1.5,active:true}
];

export const ALIASES: Record<string,string> = {
  "fajita":"fajita","chicken fajita":"fajita","chicken fajita wrap":"fajita",
  "tuna":"tuna","tuna spicy":"tuna","tuna spicy cheese ciabatta":"tuna",
  "halloumi":"halloumi","halloumi pesto":"halloumi","halloumi pesto baguette":"halloumi",
  "turkey":"turkey","turkey cheese":"turkey","turkey & cheese":"turkey","turkey & cheese baguette":"turkey",
  "ranch":"ranch","chicken ranch":"ranch","chicken ranch club":"ranch",
  "caesar":"caesar","caeser":"caesar","chicken caesar":"caesar","chicken ceasr club":"caesar",
  "3 cheese":"three_cheese","three cheese":"three_cheese","3 cheese club":"three_cheese",
  "lemon":"lemon","lemon english cake":"lemon",
  "date":"date","dates":"date","date english cake":"date",
  "yellow":"croissant_yellow","croissant yellow":"croissant_yellow",
  "white":"croissant_white","croissant white":"croissant_white",
  "chocolate":"croissant_chocolate","croissant chocolate":"croissant_chocolate",
  "plain":"croissant_plain","butter":"croissant_plain","croissant plain":"croissant_plain","butter croissant":"croissant_plain",
  ...Object.fromEntries(PRODUCTS.map(product => [product.name.toLowerCase(), product.id]))
};
