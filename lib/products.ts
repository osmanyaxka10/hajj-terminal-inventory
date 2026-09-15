import type { Category, Product } from "./types";

export const CATEGORIES: Category[] = [
  "Sandwiches", "Cakes", "Cheesecakes", "Croissants",
  "Donuts & Brownies", "Cookies", "Muffins", "Puddings", "Ice Cream"
];

export const PRODUCTS: Product[] = [
  {id:"fajita",name:"Chicken Fajita Wrap",category:"Sandwiches",shelfLifeDays:5,safetyStock:18,targetDays:1.5,active:true},
  {id:"tuna",name:"Tuna Spicy Cheese Ciabatta",category:"Sandwiches",shelfLifeDays:5,safetyStock:6,targetDays:1.5,active:true},
  {id:"halloumi",name:"Halloumi Pesto Baguette",category:"Sandwiches",shelfLifeDays:5,safetyStock:6,targetDays:1.5,active:true},
  {id:"turkey",name:"Turkey & Cheese Baguette",category:"Sandwiches",shelfLifeDays:5,safetyStock:6,targetDays:1.5,active:true},
  {id:"ranch",name:"Chicken Ranch Club",category:"Sandwiches",shelfLifeDays:5,safetyStock:5,targetDays:1.5,active:true},
  {id:"caesar",name:"Chicken Caesar Club",category:"Sandwiches",shelfLifeDays:5,safetyStock:5,targetDays:1.5,active:true},
  {id:"three_cheese",name:"3 Cheese Club",category:"Sandwiches",shelfLifeDays:5,safetyStock:5,targetDays:1.5,active:true},
  {id:"dynamite",name:"Dynamite Grill Chicken",category:"Sandwiches",shelfLifeDays:5,safetyStock:5,targetDays:1.5,active:true},
  {id:"fajita_small",name:"Chicken Fajita Sandwich Small",category:"Sandwiches",shelfLifeDays:7,safetyStock:4,targetDays:1.5,active:true},
  {id:"turkey_small",name:"Turkey Cheese Sandwich Small",category:"Sandwiches",shelfLifeDays:7,safetyStock:4,targetDays:1.5,active:true},
  {id:"tuna_small",name:"Tuna Sandwich Small",category:"Sandwiches",shelfLifeDays:7,safetyStock:4,targetDays:1.5,active:true},
  {id:"halloumi_small",name:"Halloumi Sandwich Small",category:"Sandwiches",shelfLifeDays:7,safetyStock:4,targetDays:1.5,active:true},
  {id:"lemon",name:"Lemon English Cake",category:"Cakes",shelfLifeDays:14,safetyStock:4,targetDays:2,active:true},
  {id:"date",name:"Date English Cake",category:"Cakes",shelfLifeDays:14,safetyStock:4,targetDays:2,active:true},
  {id:"sacher",name:"Sacher Cake",category:"Cakes",shelfLifeDays:14,safetyStock:3,targetDays:2,active:true},
  {id:"date_cheesecake",name:"Date Cheesecake",category:"Cheesecakes",shelfLifeDays:14,safetyStock:2,targetDays:2,active:true},
  {id:"blueberry_cheesecake",name:"Blueberry Cheesecake",category:"Cheesecakes",shelfLifeDays:90,safetyStock:2,targetDays:2,active:true},
  {id:"lemon_cheesecake",name:"Lemon Cheesecake",category:"Cheesecakes",shelfLifeDays:90,safetyStock:2,targetDays:2,active:true},
  {id:"lotus_cheesecake",name:"Lotus Cheesecake",category:"Cheesecakes",shelfLifeDays:90,safetyStock:2,targetDays:2,active:true},
  {id:"tiramisu_cheesecake",name:"Tiramisu Cheesecake",category:"Cheesecakes",shelfLifeDays:90,safetyStock:2,targetDays:2,active:true},
  {id:"croissant_yellow",name:"Croissant Yellow Cheese",category:"Croissants",shelfLifeDays:4,safetyStock:3,targetDays:1.5,active:true},
  {id:"croissant_white",name:"Croissant White Cheese",category:"Croissants",shelfLifeDays:4,safetyStock:3,targetDays:1.5,active:true},
  {id:"croissant_chocolate",name:"Croissant Chocolate",category:"Croissants",shelfLifeDays:4,safetyStock:3,targetDays:1.5,active:true},
  {id:"croissant_plain",name:"Croissant Plain",category:"Croissants",shelfLifeDays:4,safetyStock:3,targetDays:1.5,active:true},
  {id:"croissant_small_butter",name:"Small Butter Croissant",category:"Croissants",shelfLifeDays:4,safetyStock:3,targetDays:1.5,active:true},
  {id:"croissant_small_white",name:"Small White Cheese Croissant",category:"Croissants",shelfLifeDays:4,safetyStock:3,targetDays:1.5,active:true},
  {id:"croissant_small_yellow",name:"Small Yellow Cheese Croissant",category:"Croissants",shelfLifeDays:4,safetyStock:3,targetDays:1.5,active:true},
  {id:"croissant_small_chocolate",name:"Small Chocolate Croissant",category:"Croissants",shelfLifeDays:4,safetyStock:3,targetDays:1.5,active:true},
  {id:"cinnamon_donut",name:"Cinnamon Donut",category:"Donuts & Brownies",shelfLifeDays:30,safetyStock:2,targetDays:2,active:true},
  {id:"cookies_donut",name:"Cookies Donut",category:"Donuts & Brownies",shelfLifeDays:30,safetyStock:2,targetDays:2,active:true},
  {id:"nutty_donut",name:"Nutty Donut",category:"Donuts & Brownies",shelfLifeDays:30,safetyStock:2,targetDays:2,active:true},
  {id:"frosted_brownie",name:"Frosted Brownie",category:"Donuts & Brownies",shelfLifeDays:30,safetyStock:2,targetDays:2,active:true},
  {id:"cookies_chocolate",name:"Cookies Chocolate",category:"Cookies",shelfLifeDays:30,safetyStock:2,targetDays:2,active:true},
  {id:"cookies_vanilla",name:"Cookies Vanilla",category:"Cookies",shelfLifeDays:30,safetyStock:2,targetDays:2,active:true},
  {id:"muffin_chocolate",name:"Chocolate Muffin",category:"Muffins",shelfLifeDays:60,safetyStock:2,targetDays:2,active:true},
  {id:"muffin_blueberry",name:"Blueberry Muffin",category:"Muffins",shelfLifeDays:60,safetyStock:2,targetDays:2,active:true},
  {id:"muffin_carrot",name:"Carrot Muffin",category:"Muffins",shelfLifeDays:60,safetyStock:2,targetDays:2,active:true},
  {id:"lotus_pudding",name:"Lotus Pudding",category:"Puddings",shelfLifeDays:30,safetyStock:2,targetDays:2,active:true},
  {id:"cookies_pudding",name:"Cookies Pudding",category:"Puddings",shelfLifeDays:30,safetyStock:2,targetDays:2,active:true},
  {id:"chocolate_pudding",name:"Chocolate Pudding",category:"Puddings",shelfLifeDays:30,safetyStock:2,targetDays:2,active:true},
  {id:"kunafa_pudding",name:"Kunafa Pudding",category:"Puddings",shelfLifeDays:30,safetyStock:2,targetDays:2,active:true},
  {id:"ice_cream_vanilla",name:"Vanilla Ice Cream",category:"Ice Cream",shelfLifeDays:180,safetyStock:2,targetDays:3,active:true},
  {id:"ice_cream_strawberry",name:"Strawberry Ice Cream",category:"Ice Cream",shelfLifeDays:180,safetyStock:2,targetDays:3,active:true}
];

export const ALIASES: Record<string,string> = {
  "fajita":"fajita","chicken fajita":"fajita","chicken fajita wrap":"fajita",
  "tuna":"tuna","halloumi":"halloumi",
  "turkey":"turkey","turkey cheese":"turkey","turkey & cheese":"turkey",
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
