// The catalog as the components use it: Redux state read through selectors, changes sent to the API through thunks.
import { useCallback, useEffect, useMemo } from "react";
import type { SkuRow } from "../lib/csv";
import type { Product } from "../lib/data";
import type { NewProduct, ProductEdit } from "../lib/productform";
import { useSharedDispatch, useSharedSelector } from "../store/typedHooks";
import { addProduct, importSkus, loadCatalog, removeProduct, resetCatalog, restoreProduct, saveProduct, selectCatalogError, selectCatalogStatus, selectCategories, selectProducts } from "../store/catalogSlice";

export function useCatalog() {
  const dispatch = useSharedDispatch();
  const products = useSharedSelector(selectProducts);
  const categories = useSharedSelector(selectCategories);
  const status = useSharedSelector(selectCatalogStatus);
  const error = useSharedSelector(selectCatalogError);
  const sampleProducts = useSharedSelector((s) => s.meta.sources.products === "mock");
  // stable on purpose: effects that load on mount depend on it, and must not run again when the data arrives
  const reload = useCallback(() => { void dispatch(loadCatalog()); }, [dispatch]);

  return useMemo(() => ({
    products,
    categories,
    /** "idle" and "loading" until the first load finishes, then "ready", or "failed" with `error` to show. */
    status,
    error,
    reload,
    /** True when the products are the built-in samples, which can be reset. */
    canReset: sampleProducts,
    byId: (id: string) => products.find((p) => p.id === id),
    // The changes below go to the API first and reject with its message if it refuses.
    add: (input: NewProduct) => dispatch(addProduct(input)),
    update: (id: string, edit: ProductEdit) => dispatch(saveProduct(id, edit)),
    /** Returns the product with its position, so the delete can be undone. */
    remove: (id: string) => dispatch(removeProduct(id)),
    restore: (product: Product, index: number) => dispatch(restoreProduct(product, index)),
    /** Adds new SKUs and updates existing ones (matched by SKU). Imports never delete. */
    importRows: (rows: SkuRow[]) => dispatch(importSkus(rows)),
    reset: () => dispatch(resetCatalog()),
  }), [dispatch, reload, products, categories, status, error, sampleProducts]);
}

/** Loads the catalog once when the component mounts, and gives back its status for a LoadGate. */
export function useLoadCatalog() {
  const catalog = useCatalog();
  const { reload } = catalog;
  useEffect(reload, [reload]);
  return catalog;
}
