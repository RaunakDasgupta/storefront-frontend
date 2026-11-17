import { useCatalog } from "../shared/catalog";
import type { Channel, Product } from "../shared/data";

export type CategoryInfo = { name: string; count: number; cover: Product; products: Product[]; to: string };

/** Categories of one channel in catalog order, each with its products, a cover photo and the link to its full list. */
export function useCategories(channel: Channel = "retail"): CategoryInfo[] {
  const { products } = useCatalog();
  const base = channel === "bulk" ? "/bulk" : "/";
  const inChannel = products.filter((p) => p.channel === channel);
  return [...new Set(inChannel.map((p) => p.category))].map((name) => {
    const list = inChannel.filter((p) => p.category === name);
    return { name, count: list.length, cover: list[0], products: list, to: `${base}?category=${encodeURIComponent(name)}` };
  });
}
