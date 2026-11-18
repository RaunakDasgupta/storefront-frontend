// The catalog as the components use it: Redux state read through selectors, changes sent as actions.
import { useMemo } from "react";
import type { SkuRow } from "../lib/csv";
import type { ProductEdit } from "../lib/productform";
import type { Product } from "../lib/data";
import { useSharedDispatch, useSharedSelector } from "../store/typedHooks";
import { catalogReset, importSkus, productRestored, productUpdated, removeProduct, selectCategories, selectCustomized, selectProducts } from "../store/catalogSlice";

export function useCatalog() {
  const dispatch = useSharedDispatch();
  const products = useSharedSelector(selectProducts);
  const categories = useSharedSelector(selectCategories);
  /** True once admins have changed the catalog. */
  const customized = useSharedSelector(selectCustomized);

  return useMemo(() => ({
    products,
    categories,
    customized,
    byId: (id: string) => products.find((p) => p.id === id),
    update: (id: string, edit: ProductEdit) => { dispatch(productUpdated({ id, edit })); },
    /** Returns the product with its position, so the delete can be undone. */
    remove: (id: string) => dispatch(removeProduct(id)),
    restore: (product: Product, index: number) => { dispatch(productRestored({ product, index })); },
    /** Adds new SKUs and updates existing ones (matched by SKU). CSV imports never delete. */
    importRows: (rows: SkuRow[]) => dispatch(importSkus(rows)),
    reset: () => { dispatch(catalogReset()); },
  }), [dispatch, products, categories, customized]);
}
