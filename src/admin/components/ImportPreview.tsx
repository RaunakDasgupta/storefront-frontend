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
    <div className="preview">
      <p className="preview-head">
        <strong>{label}</strong>
        <span className="badge fulfilled">{rows.length} ready</span>
        {issues.length > 0 && <span className="badge pending">{issues.length} to fix</span>}
      </p>

      {rows.length > 0 && (
        <div className="tablewrap">
          <table>
            <thead><tr><th>Logo</th><th>SKU</th><th>Name</th><th className="hide-sm">Category</th><th className="num">Price</th><th className="num hide-sm">Stock</th><th>Change</th></tr></thead>
            <tbody>
              {rows.slice(0, PREVIEW_ROWS).map((r) => (
                <tr key={r.sku}>
                  <td>
                    {r.image
                      ? <img className="pimg thumb" src={r.image} alt="" width={32} height={32} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/products/placeholder.svg"; }} />
                      : <span className="muted">None</span>}
                  </td>
                  <td>{r.sku}</td><td>{r.name}{r.size && <span className="muted"> · {r.size}</span>}</td><td className="hide-sm">{r.category}</td>
                  <td className="num">{money(r.price)}</td><td className="num hide-sm">{r.stock}</td>
                  <td><span className={exists(r.sku) ? "badge paid" : "badge fulfilled"}>{exists(r.sku) ? "Update" : "New"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > PREVIEW_ROWS && <p className="muted more">and {rows.length - PREVIEW_ROWS} more rows</p>}

      {issues.length > 0 && (
        <ul className="issues">
          {issues.slice(0, ISSUE_ROWS).map((i) => <li key={`${i.line}-${i.message}`}><strong>Row {i.line}</strong> {i.message}</li>)}
          {issues.length > ISSUE_ROWS && <li className="muted">and {issues.length - ISSUE_ROWS} more</li>}
        </ul>
      )}

      <div className="import-actions">
        <button className="btn primary inline" disabled={rows.length === 0} onClick={onImport}>Import {rows.length} {rows.length === 1 ? "SKU" : "SKUs"}</button>
        <button className="btn secondary inline" onClick={onCancel}>Cancel</button>
        {issues.length > 0 && rows.length > 0 && <span className="muted">Rows with problems are skipped.</span>}
      </div>
    </div>
  );
}
