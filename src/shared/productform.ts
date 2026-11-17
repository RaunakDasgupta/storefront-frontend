// Validation for the staff "edit product" form. No React here so the tests can run under `node --test`.
import type { Channel, Product } from "./data";

export type ProductForm = { name: string; size: string; category: string; channel: string; price: string; was: string; stock: string; blurb: string; image: string };
export type ProductEdit = Pick<Product, "name" | "size" | "category" | "channel" | "price" | "was" | "stock" | "blurb" | "image">;
export type FormErrors = Partial<Record<keyof ProductForm, string>>;

/** An http(s) link, or a file bundled under /products/. Nothing else (no javascript:, data: or other schemes). */
export function isSafeImage(v: unknown): boolean {
  if (typeof v !== "string") return false;
  if (/^\/products\/[\w.-]+$/.test(v)) return true;
  try { return /^https?:$/.test(new URL(v).protocol); } catch { return false; }
}

export const toForm = (p: Product): ProductForm => ({
  name: p.name, size: p.size ?? "", category: p.category, channel: p.channel,
  price: String(p.price), was: p.was === undefined ? "" : String(p.was), stock: String(p.stock), blurb: p.blurb, image: p.image ?? "",
});

const num = (raw: string) => Number(raw.replace(/[₹,\s]/g, ""));

/** Checks the form. A blank logo/photo field means "use the default photo". */
export function parseProductForm(f: ProductForm): { value?: ProductEdit; errors: FormErrors } {
  const errors: FormErrors = {};
  const name = f.name.trim(), category = f.category.trim(), size = f.size.trim(), blurb = f.blurb.trim(), image = f.image.trim();

  if (!name) errors.name = "Enter a name.";
  else if (name.length > 120) errors.name = "Use 120 characters or fewer.";
  if (!category) errors.category = "Enter a category.";
  else if (category.length > 60) errors.category = "Use 60 characters or fewer.";
  if (size.length > 60) errors.size = "Use 60 characters or fewer.";
  if (blurb.length > 500) errors.blurb = "Use 500 characters or fewer.";
  if (f.channel !== "retail" && f.channel !== "bulk") errors.channel = "Choose retail or bulk.";

  const price = num(f.price);
  if (f.price.trim() === "" || !Number.isFinite(price) || price < 0) errors.price = "Enter a price, like 249.";
  const stock = num(f.stock);
  if (f.stock.trim() === "" || !Number.isInteger(stock) || stock < 0) errors.stock = "Enter a whole number, like 25.";

  let was: number | undefined;
  if (f.was.trim() !== "") {
    was = num(f.was);
    if (!Number.isFinite(was) || was < 0) errors.was = "Enter a price, like 299.";
    else if (!errors.price && was <= price) errors.was = "Must be higher than the price.";
  }
  if (image && !isSafeImage(image)) errors.image = "Use a full https link or a /products/ file.";

  if (Object.keys(errors).length) return { errors };
  return { errors, value: { name, size: size || undefined, category, channel: f.channel as Channel, price, was, stock, blurb, image: image || undefined } };
}
