// shortcut: hard-coded mock data; replace with calls to the real catalog/orders API.
// Seed product photos live in public/products/<id>.jpg (see README for credits).
export type Channel = "retail" | "bulk";

export type Product = {
  id: string;
  sku: string;
  name: string;
  /** Pack size shown under the name, for example "1 kg" or "Carton of 12". */
  size?: string;
  price: number;
  was?: number;
  category: string;
  blurb: string;
  stock: number;
  channel: Channel;
  /** Photo or logo: an http(s) URL from a CSV import, or a /products/... file bundled with the app. Defaults to public/products/<id>.jpg. */
  image?: string;
};

export const seedProducts: Product[] = [
  { id: "detergent", sku: "DET-001", name: "Detergent", size: "1 kg", price: 249, category: "Home care", blurb: "Laundry detergent for everyday washes.", stock: 64, channel: "retail" },
  { id: "shampoo", sku: "SHM-001", name: "Shampoo", size: "500 ml", price: 199, category: "Personal care", blurb: "Gentle moisturising shampoo for daily use.", stock: 48, channel: "retail" },
  { id: "surface-cleaner", sku: "CLN-001", name: "Surface cleaner", size: "1 L", price: 179, category: "Home care", blurb: "Spray cleaner for counters, tiles and tables.", stock: 8, channel: "retail" },
  { id: "tissue-box", sku: "TIS-001", name: "Tissue box", size: "200 sheets", price: 149, category: "Paper essentials", blurb: "Soft two-ply facial tissues.", stock: 120, channel: "retail" },
  { id: "glass-cleaner", sku: "GLS-001", name: "Glass cleaner", size: "500 ml", price: 129, category: "Home care", blurb: "Streak-free cleaner for windows and mirrors.", stock: 35, channel: "retail" },
  { id: "hand-wash", sku: "HND-001", name: "Hand wash", size: "250 ml", price: 99, category: "Personal care", blurb: "Pump-bottle liquid hand wash.", stock: 0, channel: "retail" },
  { id: "toilet-paper", sku: "TPR-001", name: "Toilet paper", size: "12 rolls", price: 349, category: "Paper essentials", blurb: "Soft, strong two-ply toilet rolls.", stock: 52, channel: "retail" },
  { id: "kitchen-towel", sku: "KTW-001", name: "Kitchen towel", size: "2 rolls", price: 159, category: "Paper essentials", blurb: "Absorbent kitchen paper rolls.", stock: 6, channel: "retail" },
  { id: "detergent-carton", sku: "BLK-DET-12", name: "Detergent", size: "Carton of 12 x 1 kg", price: 2699, category: "Home care", blurb: "Twelve 1 kg packs for shops and offices.", stock: 30, channel: "bulk", image: "/products/detergent.jpg" },
  { id: "shampoo-carton", sku: "BLK-SHM-24", name: "Shampoo", size: "Carton of 24 x 500 ml", price: 4299, category: "Personal care", blurb: "Twenty-four 500 ml bottles per carton.", stock: 18, channel: "bulk", image: "/products/shampoo.jpg" },
  { id: "tissue-carton", sku: "BLK-TIS-36", name: "Tissue box", size: "Carton of 36 boxes", price: 4899, category: "Paper essentials", blurb: "Thirty-six boxes of 200 sheets.", stock: 22, channel: "bulk", image: "/products/tissue-box.jpg" },
  { id: "toilet-paper-carton", sku: "BLK-TPR-48", name: "Toilet paper", size: "Carton of 48 rolls", price: 5999, category: "Paper essentials", blurb: "Forty-eight rolls per carton.", stock: 14, channel: "bulk", image: "/products/toilet-paper.jpg" },
];

export const money = (n: number) => n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** Photo for a product: its imported URL, otherwise the bundled file (small = 200px thumbnail). */
export const imageSrc = (p: Product, small = false) => {
  if (!p.image) return small ? `/products/thumbs/${p.id}.jpg` : `/products/${p.id}.jpg`;
  return small && p.image.startsWith("/products/") ? p.image.replace("/products/", "/products/thumbs/") : p.image;
};

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
