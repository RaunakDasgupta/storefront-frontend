import { useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../../shared/hooks/useCatalog";
import { MAX_ROWS, skuTemplate, type CsvIssue, type SkuRow } from "../../shared/lib/csv";
import { messageOf } from "../../shared/store/errors";
import { useAppSelector } from "../store/typedHooks";
import { ConnectorForm } from "./ConnectorForm";
import { ImportPreview } from "./ImportPreview";
import { CONNECTORS } from "../lib/connectors";
import { CARD } from "../ui";

const SOURCES = [{ id: "csv", label: "CSV file", badge: "CSV", description: "Upload a file from your computer" }, ...CONNECTORS];
type Preview = { label: string; rows: SkuRow[]; issues: CsvIssue[] };

/** The Import tab of Product management: pick where the SKUs come from (a CSV file, a database or a cloud service), review what will change, then import it into the catalog. */
export function ImportPanel() {
  const { importRows, validateFile } = useCatalog();
  // with a server, Excel files work too (the server reads them)
  const server = useAppSelector((s) => s.meta.sources.products === "api");
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
    try {
      const result = await validateFile(file);
      if (result.fatal) return setProblem(`${file.name}: ${result.fatal}`);
      setPreview({ label: file.name, rows: result.rows, issues: result.issues });
    } catch (e) {
      setProblem(messageOf(e));
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void load(e.dataTransfer.files[0]);
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-muted">Add or update products from a CSV file, a database or a cloud service.</p>
        <a className="btn btn-secondary btn-inline px-[18px] py-[9px]" download="sku-template.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(skuTemplate())}`}>
          Download CSV template
        </a>
      </div>

      <div className="mb-4 grid grid-cols-5 gap-3 max-[1100px]:grid-cols-3 max-sm:grid-cols-2" role="radiogroup" aria-label="Data source">
        {SOURCES.map((s) => (
          <button key={s.id} type="button" role="radio" aria-checked={source === s.id} className="group flex flex-col items-start gap-1 rounded-xl border border-line bg-surface p-3.5 text-left text-ink transition duration-150 hover:border-edge aria-checked:border-brand aria-checked:bg-brand-tint aria-checked:shadow-[0_0_0_1px_var(--color-brand)]" onClick={() => pick(s.id)}>
            <span className="mb-1.5 inline-grid h-7 min-w-9 place-items-center rounded-lg bg-ink px-2 text-[11.5px] font-bold tracking-[0.02em] text-surface group-aria-checked:bg-brand" aria-hidden="true">{s.badge}</span>
            <strong>{s.label}</strong>
            <span className="text-[12.5px] leading-[1.35] text-muted">{s.description}</span>
          </button>
        ))}
      </div>

      <section className={`${CARD} mb-5`}>
        <div className="flex flex-col gap-3.5 p-5">
          {connector ? (
            <ConnectorForm key={connector.id} connector={connector} onRows={(label, rows) => { setDone(null); setPreview({ label, rows, issues: [] }); }} />
          ) : (
            <>
              <label className={`relative mb-0 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed bg-brand-tint px-4 py-9 text-center transition-colors hover:border-brand focus-within:border-brand focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus ${dragging ? "border-brand" : "border-brand-line"}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
                <input className="absolute inset-0 size-full cursor-pointer opacity-0" type="file" accept={server ? ".csv,.xlsx,text/csv" : ".csv,text/csv"} onChange={(e) => { void load(e.target.files?.[0]); e.target.value = ""; }} />
                <strong>{server ? "Drop a CSV or Excel file here or choose a file" : "Drop a CSV here or choose a file"}</strong>
                <span className="text-muted">Up to {MAX_ROWS.toLocaleString("en-IN")} rows, {server ? "5" : "1"} MB.</span>
              </label>

              <details>
                <summary className="p-0 font-[550]">Sheet format</summary>
                <div className="mt-2 flex flex-col gap-2 text-muted">
                  <p>
                    One row per SKU, with a header row (capitals, spaces and dashes in the names do not matter; columns that are not listed are ignored).
                    Required: <code>SKU</code> and <code>Current Sales Price</code>. The name and size come from the SKU when there is no <code>Name</code> column:
                    {" "}<code>10014-Bru Gold Coffee 100g</code> becomes <em>Bru Gold Coffee</em>, <em>100g</em>.
                  </p>
                  <p>
                    Optional: <code>PID</code>, <code>Country</code>, <code>Business Group</code>, <code>Category</code>, <code>Brand</code>, <code>SubBrand</code>, <code>Segment</code>, <code>Form</code>,
                    and the stock columns <code>system_id</code>, <code>location_id</code>, <code>quantity</code>, <code>uom</code> and <code>status</code> (AVAILABLE, BLOCKED, DAMAGED, HOLD or QUARANTINE;
                    only AVAILABLE stock can be sold). The same SKU on several rows adds stock locations. Also accepted: <code>Name</code>, <code>Size</code>, <code>Channel</code> (<code>retail</code> or <code>bulk</code>),
                    {" "}<code>Compare At Price</code>, <code>Description</code> and <code>Logo URL</code>.
                  </p>
                  <p>A SKU that already exists is updated, a new SKU is added, and nothing is deleted. Download the template for an example.</p>
                </div>
              </details>
            </>
          )}

          {problem && <p className="error mb-0" role="alert">{problem}</p>}

          {done && (
            <p className="notice" role="status">
              Imported {done.added} new and {done.updated} updated {done.added + done.updated === 1 ? "SKU" : "SKUs"}. They are live in the store.{" "}
              <Link to="/admin/products" className="link">View products</Link>
            </p>
          )}

          {preview && <ImportPreview {...preview} onImport={() => { setProblem(""); importRows(preview.rows).then(setDone, (e) => setProblem(messageOf(e))); setPreview(null); }} onCancel={() => setPreview(null)} />}
        </div>
      </section>
    </>
  );
}
