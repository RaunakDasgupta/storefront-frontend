import { money, type Product } from "../shared/data";
import { Icon, ProductImage } from "../shared/ui";
import { ScrollGrid } from "./ScrollGrid";

function Stock({ stock }: { stock: number }) {
  if (stock === 0) return <span className="badge pending">Out of stock</span>;
  if (stock < 10) return <span className="badge pending">{stock} left</span>;
  return <span className="muted">{stock} in stock</span>;
}

/** Products as cards in the scrolling 3 x 2 grid: photo, name and size, SKU and category, type, stock and price. The pencil opens the editor and the bin asks to delete. */
export function ProductGrid({ products, onEdit, onDelete }: { products: Product[]; onEdit: (p: Product) => void; onDelete: (p: Product) => void }) {
  return (
    <ScrollGrid count={products.length} rows="tall">
      {products.map((p) => (
        <article key={p.id} className="oc pc">
          <span className="pc-main">
            <ProductImage p={p} small className="pc-img" />
            <span className="pc-text">
              <strong>{p.name}</strong>
              {p.size && <span className="muted">{p.size}</span>}
              <span className="muted pc-sku">{p.sku} · {p.category}</span>
            </span>
          </span>
          <span className="oc-foot">
            <span className="pc-meta"><span className={p.channel === "bulk" ? "badge paid" : "badge"}>{p.channel === "bulk" ? "Bulk" : "Retail"}</span><Stock stock={p.stock} /></span>
            <strong>{money(p.price)}</strong>
          </span>
          <span className="pc-actions">
            <button className="pc-btn" aria-label={`Edit ${p.name} (${p.sku})`} onClick={() => onEdit(p)}><Icon name="edit" /> Edit</button>
            <button className="pc-btn pc-del" aria-label={`Delete ${p.name} (${p.sku})`} onClick={() => onDelete(p)}><Icon name="trash" /> Delete</button>
          </span>
        </article>
      ))}
    </ScrollGrid>
  );
}
