// shortcut: hard-coded mock data; replace with calls to the real catalog/orders API.
// Seed product photos live in public/products/<id>.jpg (see README for credits).
export type Product = {
  id: string;
  sku: string;
  name: string;
  price: number;
  was?: number;
  category: string;
  blurb: string;
  stock: number;
  /** Logo/photo URL from a CSV import. Seed products leave it out and use public/products/<id>.jpg. */
  image?: string;
};

export const seedProducts: Product[] = [
  { id: "everyday-tote", sku: "TOT-001", name: "Everyday Tote", price: 3499, category: "Bags", blurb: "Heavy canvas tote with a reinforced base and an inner zip pocket.", stock: 42 },
  { id: "ceramic-mug", sku: "MUG-001", name: "Ceramic Mug", price: 1499, category: "Home", blurb: "Hand-glazed 12 oz mug that is dishwasher and microwave safe.", stock: 8 },
  { id: "canvas-cap", sku: "CAP-001", name: "Canvas Cap", price: 1999, category: "Apparel", blurb: "Six-panel cap in washed canvas with an adjustable brass buckle.", stock: 61 },
  { id: "linen-shirt", sku: "SHT-001", name: "Linen Shirt", price: 4999, was: 6499, category: "Apparel", blurb: "Relaxed-fit shirt in breathable European linen.", stock: 5 },
  { id: "desk-lamp", sku: "LMP-001", name: "Desk Lamp", price: 4499, was: 5999, category: "Home", blurb: "Dimmable LED lamp with a weighted base and a warm glow.", stock: 17 },
  { id: "notebook-set", sku: "NTB-001", name: "Notebook Set", price: 799, category: "Stationery", blurb: "Three dot-grid notebooks with lay-flat binding and 120 gsm paper.", stock: 120 },
  { id: "water-bottle", sku: "BTL-001", name: "Water Bottle", price: 1299, category: "Home", blurb: "Insulated steel bottle that keeps drinks cold for 24 hours.", stock: 0 },
  { id: "wool-beanie", sku: "BNE-001", name: "Wool Beanie", price: 1499, category: "Apparel", blurb: "Soft merino beanie with a double-knit cuff.", stock: 33 },
];

export const money = (n: number) => n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** Photo for a product: its imported URL, otherwise the bundled file (small = 200px thumbnail). */
export const imageSrc = (p: Product, small = false) => p.image ?? (small ? `/products/thumbs/${p.id}.jpg` : `/products/${p.id}.jpg`);

export type Order = { id: string; customer: string; total: number; status: "Paid" | "Fulfilled" | "Pending"; date: string };

/** "Today" for the sample data; the dashboard shows the 7 days ending here. */
export const TODAY = "2026-11-17";

export const orders: Order[] = [
  { id: "#1052", customer: "Ava Patel", total: 9499, status: "Pending", date: "2026-11-17" },
  { id: "#1051", customer: "Liam Chen", total: 3499, status: "Paid", date: "2026-11-17" },
  { id: "#1050", customer: "Sofia Rossi", total: 12999, status: "Fulfilled", date: "2026-11-16" },
  { id: "#1049", customer: "Noah Williams", total: 1299, status: "Fulfilled", date: "2026-11-16" },
  { id: "#1048", customer: "Mia Johnson", total: 5999, status: "Paid", date: "2026-11-15" },
  { id: "#1047", customer: "Ethan Brown", total: 1999, status: "Fulfilled", date: "2026-11-15" },
  { id: "#1046", customer: "Isha Rao", total: 4499, status: "Fulfilled", date: "2026-11-14" },
  { id: "#1045", customer: "Arjun Mehta", total: 7998, status: "Paid", date: "2026-11-14" },
  { id: "#1044", customer: "Kavya Nair", total: 2798, status: "Fulfilled", date: "2026-11-13" },
  { id: "#1043", customer: "Rohan Das", total: 4999, status: "Fulfilled", date: "2026-11-13" },
  { id: "#1042", customer: "Neha Gupta", total: 3499, status: "Paid", date: "2026-11-12" },
  { id: "#1041", customer: "Vikram Singh", total: 1598, status: "Fulfilled", date: "2026-11-12" },
  { id: "#1040", customer: "Ananya Iyer", total: 5498, status: "Fulfilled", date: "2026-11-11" },
  { id: "#1039", customer: "Dev Patel", total: 799, status: "Fulfilled", date: "2026-11-11" },
];

export const fmtDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

/** Revenue counts paid and fulfilled orders; pending ones are not revenue yet. */
export const revenueOf = (list: Order[]) => list.filter((o) => o.status !== "Pending").reduce((s, o) => s + o.total, 0);

/** Revenue per day for the 7 days ending TODAY. Its total equals revenueOf(orders) while every order falls in that window. */
export function salesByDay(list: Order[] = orders) {
  const end = new Date(`${TODAY}T00:00:00`);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (6 - i));
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return { iso, day: d.toLocaleDateString("en-IN", { weekday: "short" }), total: revenueOf(list.filter((o) => o.date === iso)) };
  });
}

/** Units sold per SKU, all time (sample data). */
export const unitsSold: Record<string, number> = {
  "TOT-001": 212, "MUG-001": 148, "CAP-001": 131, "SHT-001": 96,
  "LMP-001": 74, "NTB-001": 188, "BTL-001": 120, "BNE-001": 83,
};
