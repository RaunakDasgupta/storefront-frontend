// shortcut: hard-coded mock data; replace with calls to the real catalog/orders API.
export type Product = { id: string; name: string; price: number; category: string; blurb: string; hue: number; stock: number };

export const products: Product[] = [
  { id: "everyday-tote", name: "Everyday Tote", price: 48, category: "Bags", blurb: "Heavy canvas tote with a reinforced base and inner pocket.", hue: 28, stock: 42 },
  { id: "ceramic-mug", name: "Ceramic Mug", price: 22, category: "Home", blurb: "Hand-glazed 12 oz mug that is dishwasher and microwave safe.", hue: 200, stock: 8 },
  { id: "canvas-cap", name: "Canvas Cap", price: 32, category: "Apparel", blurb: "Six-panel cap, washed canvas, adjustable brass buckle.", hue: 140, stock: 61 },
  { id: "linen-shirt", name: "Linen Shirt", price: 89, category: "Apparel", blurb: "Relaxed-fit shirt in breathable European linen.", hue: 50, stock: 5 },
  { id: "desk-lamp", name: "Desk Lamp", price: 74, category: "Home", blurb: "Dimmable LED lamp with a weighted base and a warm glow.", hue: 340, stock: 17 },
  { id: "notebook-set", name: "Notebook Set", price: 18, category: "Stationery", blurb: "Three dot-grid notebooks, lay-flat binding, 120 gsm paper.", hue: 260, stock: 120 },
  { id: "water-bottle", name: "Water Bottle", price: 29, category: "Home", blurb: "Insulated steel bottle that keeps drinks cold for 24 hours.", hue: 170, stock: 0 },
  { id: "wool-beanie", name: "Wool Beanie", price: 26, category: "Apparel", blurb: "Soft merino beanie with a double-knit cuff.", hue: 10, stock: 33 },
];

export const byId = (id: string) => products.find((p) => p.id === id);
export const categories = ["All", ...new Set(products.map((p) => p.category))];
export const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export type Order = { id: string; customer: string; total: number; status: "Paid" | "Fulfilled" | "Pending"; date: string };

export const orders: Order[] = [
  { id: "#1042", customer: "Ava Patel", total: 118, status: "Pending", date: "Nov 16" },
  { id: "#1041", customer: "Liam Chen", total: 48, status: "Paid", date: "Nov 16" },
  { id: "#1040", customer: "Sofia Rossi", total: 163, status: "Fulfilled", date: "Nov 15" },
  { id: "#1039", customer: "Noah Williams", total: 29, status: "Fulfilled", date: "Nov 14" },
  { id: "#1038", customer: "Mia Johnson", total: 74, status: "Paid", date: "Nov 14" },
  { id: "#1037", customer: "Ethan Brown", total: 32, status: "Fulfilled", date: "Nov 12" },
];
