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
  { id: "sponge-scrubbers", sku: "SPG-001", name: "Sponge scrubbers", size: "6 pack", price: 89, category: "Kitchen essentials", blurb: "Soft-side, scrub-side sponges for dishes and counters.", stock: 90, channel: "retail" },
  { id: "kitchen-canisters", sku: "CAN-001", name: "Kitchen canisters", size: "Set of 3", price: 599, category: "Kitchen essentials", blurb: "Airtight canisters for tea, coffee and sugar.", stock: 14, channel: "retail" },
  { id: "storage-jar", sku: "JAR-001", name: "Glass storage jar", size: "1.2 L", price: 249, category: "Kitchen essentials", blurb: "Clear jar with a tight lid for pasta, grains and snacks.", stock: 40, channel: "retail" },
  { id: "baby-wipes", sku: "WIP-001", name: "Baby wipes", size: "72 wipes", price: 129, category: "Baby care", blurb: "Gentle, fragrance-free wipes for sensitive skin.", stock: 75, channel: "retail" },
  { id: "feeding-bottle", sku: "BOT-001", name: "Feeding bottle", size: "250 ml", price: 299, category: "Baby care", blurb: "Anti-colic feeding bottle with a soft silicone teat.", stock: 9, channel: "retail" },
  { id: "dog-treats", sku: "DTR-001", name: "Dog treats", size: "200 g", price: 199, category: "Pet care", blurb: "Crunchy bone-shaped treats for training and rewards.", stock: 55, channel: "retail" },
  { id: "cheese-treats", sku: "DTR-002", name: "Cheese dog treats", size: "150 g", price: 179, category: "Pet care", blurb: "Baked cheese and bacon bones in a resealable bag.", stock: 7, channel: "retail" },
  { id: "pet-bowl", sku: "PBW-001", name: "Pet food bowl", size: "Steel, 700 ml", price: 249, category: "Pet care", blurb: "Non-slip steel bowl with a paw-print finish.", stock: 28, channel: "retail" },
  { id: "choco-cookies", sku: "CKS-001", name: "Choco chip cookies", size: "200 g", price: 119, category: "Snacks & drinks", blurb: "Crisp-edged cookies with dark chocolate chips.", stock: 100, channel: "retail" },
  { id: "crackers", sku: "CRK-001", name: "Salted crackers", size: "150 g", price: 79, category: "Snacks & drinks", blurb: "Light, crunchy crackers with a pinch of salt.", stock: 130, channel: "retail" },
  { id: "coffee-beans", sku: "COF-001", name: "Coffee beans", size: "250 g", price: 399, category: "Snacks & drinks", blurb: "Medium-roast whole beans for filter and French press.", stock: 32, channel: "retail" },
  { id: "detergent-carton", sku: "BLK-DET-12", name: "Detergent", size: "Carton of 12 x 1 kg", price: 2699, category: "Home care", blurb: "Twelve 1 kg packs for shops and offices.", stock: 30, channel: "bulk", image: "/products/detergent.jpg" },
  { id: "shampoo-carton", sku: "BLK-SHM-24", name: "Shampoo", size: "Carton of 24 x 500 ml", price: 4299, category: "Personal care", blurb: "Twenty-four 500 ml bottles per carton.", stock: 18, channel: "bulk", image: "/products/shampoo.jpg" },
  { id: "tissue-carton", sku: "BLK-TIS-36", name: "Tissue box", size: "Carton of 36 boxes", price: 4899, category: "Paper essentials", blurb: "Thirty-six boxes of 200 sheets.", stock: 22, channel: "bulk", image: "/products/tissue-box.jpg" },
  { id: "toilet-paper-carton", sku: "BLK-TPR-48", name: "Toilet paper", size: "Carton of 48 rolls", price: 5999, category: "Paper essentials", blurb: "Forty-eight rolls per carton.", stock: 14, channel: "bulk", image: "/products/toilet-paper.jpg" },
  { id: "sponge-carton", sku: "BLK-SPG-24", name: "Sponge scrubbers", size: "Carton of 24 x 6 pack", price: 1799, category: "Kitchen essentials", blurb: "Twenty-four 6-packs of dish sponges.", stock: 26, channel: "bulk", image: "/products/sponge-scrubbers.jpg" },
  { id: "wipes-carton", sku: "BLK-WIP-24", name: "Baby wipes", size: "Carton of 24 x 72 wipes", price: 2799, category: "Baby care", blurb: "Twenty-four packs of 72 gentle wipes.", stock: 16, channel: "bulk", image: "/products/baby-wipes.jpg" },
  { id: "dog-treats-carton", sku: "BLK-DTR-20", name: "Dog treats", size: "Carton of 20 x 200 g", price: 3499, category: "Pet care", blurb: "Twenty bags of crunchy bone treats.", stock: 12, channel: "bulk", image: "/products/dog-treats.jpg" },
  { id: "cookies-carton", sku: "BLK-CKS-36", name: "Choco chip cookies", size: "Carton of 36 x 200 g", price: 3999, category: "Snacks & drinks", blurb: "Thirty-six packs of choco chip cookies.", stock: 20, channel: "bulk", image: "/products/choco-cookies.jpg" },
  { id: "coffee-carton", sku: "BLK-COF-12", name: "Coffee beans", size: "Carton of 12 x 250 g", price: 4299, category: "Snacks & drinks", blurb: "Twelve 250 g bags of medium-roast beans.", stock: 8, channel: "bulk", image: "/products/coffee-beans.jpg" },
];

export const money = (n: number) => n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** Photo for a product: its imported URL, otherwise the bundled file (small = 200px thumbnail). */
export const imageSrc = (p: Product, small = false) => {
  if (!p.image) return small ? `/products/thumbs/${p.id}.jpg` : `/products/${p.id}.jpg`;
  return small && p.image.startsWith("/products/") ? p.image.replace("/products/", "/products/thumbs/") : p.image;
};

export const fmtDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
