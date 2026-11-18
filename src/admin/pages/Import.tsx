import { useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../../shared/hooks/useCatalog";
import { MAX_ROWS, parseSkuCsv, skuTemplate, type CsvIssue, type SkuRow } from "../../shared/lib/csv";
import { ConnectorForm } from "../components/ConnectorForm";
import { ImportPreview } from "../components/ImportPreview";
import { CONNECTORS } from "../lib/connectors";

const MAX_BYTES = 1_000_000;
const SOURCES = [{ id: "csv", label: "CSV file", badge: "CSV", description: "Upload a file from your computer" }, ...CONNECTORS];
type Preview = { label: string; rows: SkuRow[]; issues: CsvIssue[] };

/** Pick where the SKUs come from (a CSV file, a database or a cloud service), review what will change, then import it into the catalog. */
export function ImportPage() {
  const { importRows } = useCatalog();
  const [source, setSource] = useState("csv");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [problem, setProblem] = useState("");
  const [done, setDone] = useState<{ added: number; updated: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const connector = CONNECTORS.find((c) => c.id === source);

  function pick(id: string) {
    setSource(id);
    setPreview(null);
    setProblem("");
    setDone(null);
  }

  async function load(file: File | undefined) {
    if (!file) return;
    setDone(null);
    setProblem("");
    setPreview(null);
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") return setProblem("Choose a .csv file.");
    if (file.size > MAX_BYTES) return setProblem("That file is larger than 1 MB. Split it and upload each part.");
    const result = parseSkuCsv(await file.text());
    if (result.fatal) return setProblem(`${file.name}: ${result.fatal}`);
    setPreview({ label: file.name, rows: result.rows, issues: result.issues });
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void load(e.dataTransfer.files[0]);
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Import SKUs</h1>
          <p className="muted">Add or update products from a CSV file, a database or a cloud service.</p>
        </div>
        <a className="btn secondary inline" download="sku-template.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(skuTemplate(window.location.origin))}`}>
          Download CSV template
        </a>
      </div>

      <div className="sources" role="radiogroup" aria-label="Data source">
        {SOURCES.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={source === s.id} className="source" onClick={() => pick(s.id)}>
            <span className="source-badge" aria-hidden="true">{s.badge}</span>
            <strong>{s.label}</strong>
            <span className="muted">{s.description}</span>
          </button>
        ))}
      </div>

      <section className="cardbox import">
        <div className="import-body">
          {connector ? (
            <ConnectorForm key={connector.id} connector={connector} onRows={(label, rows) => { setDone(null); setPreview({ label, rows, issues: [] }); }} />
          ) : (
            <>
              <label className={dragging ? "dropzone drag" : "dropzone"} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
                <input type="file" accept=".csv,text/csv" onChange={(e) => { void load(e.target.files?.[0]); e.target.value = ""; }} />
                <strong>Drop a CSV here or choose a file</strong>
                <span className="muted">Up to {MAX_ROWS.toLocaleString("en-IN")} rows, 1 MB.</span>
              </label>

              <details className="format">
                <summary>CSV format</summary>
                <p className="muted">
                  One SKU per row, with a header row. Required columns: <code>sku</code>, <code>name</code>, <code>price</code>. Optional:
                  {" "}<code>size</code>, <code>category</code>, <code>channel</code> (<code>retail</code> or <code>bulk</code>), <code>compare_at_price</code>, <code>stock</code>, <code>description</code> and <code>logo_url</code> (a full https link to the product logo or photo).
                  A SKU that already exists is updated, a new SKU is added, and nothing is deleted.
                </p>
              </details>
            </>
          )}

          {problem && <p className="error" role="alert">{problem}</p>}

          {done && (
            <p className="notice" role="status">
              Imported {done.added} new and {done.updated} updated {done.added + done.updated === 1 ? "SKU" : "SKUs"}. They are live in the store.{" "}
              <Link to="/admin/products" className="link">View products</Link>
            </p>
          )}

          {preview && <ImportPreview {...preview} onImport={() => { setDone(importRows(preview.rows)); setPreview(null); }} onCancel={() => setPreview(null)} />}
        </div>
      </section>
    </>
  );
}
