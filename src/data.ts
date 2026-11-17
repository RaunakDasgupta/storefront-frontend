// shortcut: hard-coded mock data; replace with calls to the real catalog/orders API.
// Product photos live in public/products/<id>.jpg (see README for credits).
export type Product = { id: string; name: string; price: number; was?: number; category: string; blurb: string; stock: number };

export const products: Product[] = [
  { id: "everyday-tote", name: "Everyday Tote", price: 3499, category: "Bags", blurb: "Heavy canvas tote with a reinforced base and an inner zip pocket.", stock: 42 },
  { id: "ceramic-mug", name: "Ceramic Mug", price: 1499, category: "Home", blurb: "Hand-glazed 12 oz mug that is dishwasher and microwave safe.", stock: 8 },
  { id: "canvas-cap", name: "Canvas Cap", price: 1999, category: "Apparel", blurb: "Six-panel cap in washed canvas with an adjustable brass buckle.", stock: 61 },
  { id: "linen-shirt", name: "Linen Shirt", price: 4999, was: 6499, category: "Apparel", blurb: "Relaxed-fit shirt in breathable European linen.", stock: 5 },
  { id: "desk-lamp", name: "Desk Lamp", price: 4499, was: 5999, category: "Home", blurb: "Dimmable LED lamp with a weighted base and a warm glow.", stock: 17 },
  { id: "notebook-set", name: "Notebook Set", price: 799, category: "Stationery", blurb: "Three dot-grid notebooks with lay-flat binding and 120 gsm paper.", stock: 120 },
  { id: "water-bottle", name: "Water Bottle", price: 1299, category: "Home", blurb: "Insulated steel bottle that keeps drinks cold for 24 hours.", stock: 0 },
  { id: "wool-beanie", name: "Wool Beanie", price: 1499, category: "Apparel", blurb: "Soft merino beanie with a double-knit cuff.", stock: 33 },
];

export const byId = (id: string) => products.find((p) => p.id === id);
export const categories = [...new Set(products.map((p) => p.category))];
export const money = (n: number) => n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export type Order = { id: string; customer: string; total: number; status: "Paid" | "Fulfilled" | "Pending"; date: string };

export const orders: Order[] = [
  { id: "#1042", customer: "Ava Patel", total: 9499, status: "Pending", date: "Nov 16" },
  { id: "#1041", customer: "Liam Chen", total: 3499, status: "Paid", date: "Nov 16" },
  { id: "#1040", customer: "Sofia Rossi", total: 12999, status: "Fulfilled", date: "Nov 15" },
  { id: "#1039", customer: "Noah Williams", total: 1299, status: "Fulfilled", date: "Nov 14" },
  { id: "#1038", customer: "Mia Johnson", total: 5999, status: "Paid", date: "Nov 14" },
  { id: "#1037", customer: "Ethan Brown", total: 1999, status: "Fulfilled", date: "Nov 12" },
];

export const salesByDay = [
  { day: "Mon", total: 34000 }, { day: "Tue", total: 25000 }, { day: "Wed", total: 45000 }, { day: "Thu", total: 38000 },
  { day: "Fri", total: 55000 }, { day: "Sat", total: 66000 }, { day: "Sun", total: 43000 },
];

export const unitsSold: Record<string, number> = {
  "everyday-tote": 212, "ceramic-mug": 148, "canvas-cap": 131, "linen-shirt": 96,
  "desk-lamp": 74, "notebook-set": 188, "water-bottle": 120, "wool-beanie": 83,
};
