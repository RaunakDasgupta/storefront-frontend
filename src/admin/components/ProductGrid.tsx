import { money, type Product } from "../../shared/lib/data";
import { Icon, ProductImage } from "../../shared/ui";
import { OC, PC_BTN } from "../ui";
import { ScrollGrid } from "./ScrollGrid";

function Stock({ stock }: { stock: number }) {
  if (stock === 0) return <span className="badge tone-pending">Out of stock</span>;
  if (stock < 10) return <span className="badge tone-pending">{stock} left</span>;
  return <span className="text-[12.5px] whitespace-nowrap text-muted">{stock} in stock</span>;
}

/** Products as cards in the scrolling 3 x 2 grid: photo, name and size, SKU and category, type, stock and price. The pencil opens the editor and the bin asks to delete. */
export function ProductGrid({ products, onEdit, onDelete }: { products: Product[]; onEdit: (p: Product) => void; onDelete: (p: Product) => void }) {
  return (
    <ScrollGrid count={products.length} rows="tall">
      {products.map((p) => (
        <article key={p.id} className={`${OC} gap-1`}>
          <span className="flex min-w-0 items-center gap-3">
            <ProductImage p={p} small className="size-16 shrink-0 rounded-[10px]" />
            <span className="flex min-w-0 flex-col leading-[1.35]">
              <strong className="truncate text-[15px]">{p.name}</strong>
              {p.size && <span className="truncate text-[12.5px] text-muted">{p.size}</span>}
              <span className="truncate text-[12.5px] text-muted">{p.sku} · {p.category}</span>
            </span>
          </span>
          <span className="mt-auto flex items-baseline justify-between gap-2 text-[12.5px]">
            <span className="inline-flex min-w-0 items-center gap-2"><span className={`badge ${p.channel === "bulk" ? "tone-paid" : ""}`}>{p.channel === "bulk" ? "Bulk" : "Retail"}</span><Stock stock={p.stock} /></span>
            <strong className="text-base">{money(p.price)}</strong>
          </span>
          <span className="flex gap-2">
            <button className={`${PC_BTN} hover:border-brand hover:bg-brand-tint hover:text-brand`} aria-label={`Edit ${p.name} (${p.sku})`} onClick={() => onEdit(p)}><Icon name="edit" className="size-[15px]" /> Edit</button>
            <button className={`${PC_BTN} hover:border-danger hover:bg-danger-tint hover:text-danger`} aria-label={`Delete ${p.name} (${p.sku})`} onClick={() => onDelete(p)}><Icon name="trash" className="size-[15px]" /> Delete</button>
          </span>
        </article>
      ))}
    </ScrollGrid>
  );
}
