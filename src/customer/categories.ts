import { useCatalog } from "../shared/catalog";
import type { Product } from "../shared/data";

export type CategoryInfo = { name: string; count: number; cover: Product; products: Product[]; to: string };

/** Retail categories in catalog order, each with its products, a cover photo and the link to its full list. */
export function useCategories(): CategoryInfo[] {
  const { products } = useCatalog();
  const retail = products.filter((p) => p.channel === "retail");
  return [...new Set(retail.map((p) => p.category))].map((name) => {
    const list = retail.filter((p) => p.category === name);
    return { name, count: list.length, cover: list[0], products: list, to: `/?category=${encodeURIComponent(name)}` };
  });
}
