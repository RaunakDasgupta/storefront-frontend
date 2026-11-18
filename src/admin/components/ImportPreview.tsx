import { useCatalog } from "../../shared/hooks/useCatalog";
import type { CsvIssue, SkuRow } from "../../shared/lib/csv";
import { money } from "../../shared/lib/data";

const PREVIEW_ROWS = 6;
const ISSUE_ROWS = 6;

/** What an import will change, before anything does: each row is new or an update, and problem rows are listed. Shared by the CSV and database sources. */
export function ImportPreview({ label, rows, issues, onImport, onCancel }: { label: string; rows: SkuRow[]; issues: CsvIssue[]; onImport: () => void; onCancel: () => void }) {
  const { products } = useCatalog();
  const exists = (sku: string) => products.some((p) => p.sku.toLowerCase() === sku.toLowerCase());

  return (
    <div className="flex flex-col gap-3">
      <p className="flex flex-wrap items-center gap-2">
        <strong>{label}</strong>
        <span className="badge tone-fulfilled">{rows.length} ready</span>
        {issues.length > 0 && <span className="badge tone-pending">{issues.length} to fix</span>}
      </p>

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-[10px] border border-line">
          <table className="tbl">
            <thead><tr><th>Logo</th><th>SKU</th><th>Name</th><th className="max-sm:hidden">Category</th><th className="text-right">Price</th><th className="text-right max-sm:hidden">Stock</th><th>Change</th></tr></thead>
            <tbody>
              {rows.slice(0, PREVIEW_ROWS).map((r) => (
                <tr key={r.sku}>
                  <td>
                    {r.image
                      ? <img className="block size-8 shrink-0 rounded-md bg-soft object-cover" src={r.image} alt="" width={32} height={32} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/products/placeholder.svg"; }} />
                      : <span className="text-muted">None</span>}
                  </td>
                  <td>{r.sku}</td><td>{r.name}{r.size && <span className="text-muted"> · {r.size}</span>}</td><td className="max-sm:hidden">{r.category}</td>
                  <td className="text-right">{money(r.price)}</td><td className="text-right max-sm:hidden">{r.stock}</td>
                  <td><span className={exists(r.sku) ? "badge tone-paid" : "badge tone-fulfilled"}>{exists(r.sku) ? "Update" : "New"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > PREVIEW_ROWS && <p className="-mt-1 text-muted">and {rows.length - PREVIEW_ROWS} more rows</p>}

      {issues.length > 0 && (
        <ul className="flex list-disc flex-col gap-1 rounded-lg bg-danger-tint py-3 pr-4 pl-8 text-danger">
          {issues.slice(0, ISSUE_ROWS).map((i) => <li key={`${i.line}-${i.message}`}><strong>Row {i.line}</strong> {i.message}</li>)}
          {issues.length > ISSUE_ROWS && <li className="text-muted">and {issues.length - ISSUE_ROWS} more</li>}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2.5 max-sm:[&_.btn]:flex-1">
        <button className="btn btn-primary btn-inline" disabled={rows.length === 0} onClick={onImport}>Import {rows.length} {rows.length === 1 ? "SKU" : "SKUs"}</button>
        <button className="btn btn-secondary btn-inline" onClick={onCancel}>Cancel</button>
        {issues.length > 0 && rows.length > 0 && <span className="text-muted">Rows with problems are skipped.</span>}
      </div>
    </div>
  );
}
