import { useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import { MAX_ROWS, parseSkuCsv, skuTemplate, type ParseResult } from "../../shared/csv";
import { money } from "../../shared/data";

const PREVIEW_ROWS = 6;
const ISSUE_ROWS = 6;
const MAX_BYTES = 1_000_000;

/** Pick a SKU CSV, review what will change, then import it into the catalog. */
export function ImportPage() {
  const { products, importRows } = useCatalog();
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ParseResult | null>(null);
  const [problem, setProblem] = useState("");
  const [done, setDone] = useState<{ added: number; updated: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  async function load(file: File | undefined) {
    if (!file) return;
    setDone(null);
    setProblem("");
    setResult(null);
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") return setProblem("Choose a .csv file.");
    if (file.size > MAX_BYTES) return setProblem("That file is larger than 1 MB. Split it and upload each part.");
    setFileName(file.name);
    setResult(parseSkuCsv(await file.text()));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void load(e.dataTransfer.files[0]);
  }

  function clear() {
    setResult(null);
    setFileName("");
    setProblem("");
  }

  const exists = (sku: string) => products.some((p) => p.sku.toLowerCase() === sku.toLowerCase());
  const rows = result?.rows ?? [];
  const issues = result?.issues ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Import SKUs</h1>
          <p className="muted">Add or update products from a CSV file, including their logo links.</p>
        </div>
        <a className="btn secondary inline" download="sku-template.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(skuTemplate(window.location.origin))}`}>
          Download template
        </a>
      </div>

      <section className="cardbox import">
        <div className="import-body">
          <label className={dragging ? "dropzone drag" : "dropzone"} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
            <input type="file" accept=".csv,text/csv" onChange={(e) => { void load(e.target.files?.[0]); e.target.value = ""; }} />
            <strong>Drop a CSV here or choose a file</strong>
            <span className="muted">Up to {MAX_ROWS.toLocaleString("en-IN")} rows, 1 MB.</span>
          </label>

          <details className="format">
            <summary>CSV format</summary>
            <p className="muted">
              One SKU per row, with a header row. Required columns: <code>sku</code>, <code>name</code>, <code>price</code>. Optional:
              {" "}<code>category</code>, <code>compare_at_price</code>, <code>stock</code>, <code>description</code> and <code>logo_url</code> (a full https link to the product logo or photo).
              A SKU that already exists is updated, a new SKU is added, and nothing is deleted.
            </p>
          </details>

          {problem && <p className="error" role="alert">{problem}</p>}
          {result?.fatal && <p className="error" role="alert">{fileName}: {result.fatal}</p>}

          {done && (
            <p className="notice" role="status">
              Imported {done.added} new and {done.updated} updated {done.added + done.updated === 1 ? "SKU" : "SKUs"}. They are live in the store.{" "}
              <Link to="/staff/products" className="link">View products</Link>
            </p>
          )}

          {result && !result.fatal && (
            <div className="preview">
              <p className="preview-head">
                <strong>{fileName}</strong>
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
                          <td>{r.sku}</td><td>{r.name}</td><td className="hide-sm">{r.category}</td>
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
                <button className="btn primary inline" disabled={rows.length === 0} onClick={() => { setDone(importRows(rows)); clear(); }}>
                  Import {rows.length} {rows.length === 1 ? "SKU" : "SKUs"}
                </button>
                <button className="btn secondary inline" onClick={clear}>Cancel</button>
                {issues.length > 0 && rows.length > 0 && <span className="muted">Rows with problems are skipped.</span>}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
