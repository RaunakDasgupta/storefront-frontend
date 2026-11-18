import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCatalog } from "../../shared/hooks/useCatalog";
import type { Product } from "../../shared/lib/data";
import type { NewProduct } from "../../shared/lib/productform";
import { emptyForm, parseNewProduct, parseProductForm, toForm, type FormErrors, type ProductForm } from "../../shared/lib/productform";
import { messageOf } from "../../shared/store/errors";
import { Field } from "../../shared/ui";
import { DLG, DLG_FOOT } from "../ui";

/** Add a product (no `product`) or edit one, in a modal dialog. Esc, the backdrop and Cancel all close it without saving. */
export function ProductEditor({ product, onClose }: { product?: Product; onClose: () => void }) {
  const { add, update } = useCatalog();
  const creating = !product;
  const ref = useRef<HTMLDialogElement>(null);
  const [f, setF] = useState<ProductForm>(() => (product ? toForm(product) : emptyForm()));
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { ref.current?.showModal(); }, []);

  // close through our own state instead of waiting for the dialog's "close" event
  const close = () => { ref.current?.close(); onClose(); };

  const bind = (k: keyof ProductForm) => ({ id: `pe-${k}`, value: f[k], error: errors[k], onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value }) });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const { value, errors: found } = creating ? parseNewProduct(f) : parseProductForm(f);
    setErrors(found);
    const firstBad = Object.keys(found)[0];
    if (!value) return document.getElementById(`pe-${firstBad}`)?.focus();
    setSaveError("");
    setBusy(true);
    try {
      if (creating) await add(value as NewProduct);
      else await update(product.id, value);
      close();
    } catch (err) {
      setSaveError(messageOf(err));
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      className={`${DLG} w-[min(580px,calc(100vw-32px))]`}
      aria-labelledby="pe-title"
      onCancel={(e) => { e.preventDefault(); close(); }}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) close(); }}
    >
      <form className="flex max-h-[calc(100vh-32px)] flex-col" onSubmit={onSubmit} noValidate>
        <header className="flex items-start justify-between gap-3 border-b border-line px-[22px] pt-5 pb-3.5">
          <div>
            <h2 id="pe-title" className="text-xl">{creating ? "Add product" : "Edit product"}</h2>
            <p className="mt-0.5 text-[13px] text-muted">{creating ? "The SKU can't be changed once the product is added." : `${product.sku}, the SKU, can't be changed.`}</p>
          </div>
          <button type="button" className="dlg-x" aria-label="Close" onClick={close}>×</button>
        </header>

        <div className="overflow-y-auto px-[22px] pt-[18px] pb-1">
          {creating && <Field label="SKU" autoComplete="off" placeholder="DET-002" {...bind("sku")} autoFocus />}
          <Field label="Name" autoComplete="off" {...bind("name")} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Size" autoComplete="off" placeholder="1 kg, Carton of 12..." {...bind("size")} />
            <Field label="Category" autoComplete="off" {...bind("category")} />
          </div>
          <div className="mb-4">
            <label htmlFor="pe-channel">Type</label>
            <select id="pe-channel" value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}>
              <option value="retail">Retail</option>
              <option value="bulk">Bulk</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-2">
            <Field label="Price (₹)" inputMode="decimal" {...bind("price")} />
            <Field label="Compare-at (₹)" inputMode="decimal" placeholder="Optional" {...bind("was")} />
            <Field label="Stock" inputMode="numeric" {...bind("stock")} />
          </div>
          <div className="mb-4">
            <label htmlFor="pe-blurb">Description</label>
            <textarea id="pe-blurb" rows={3} value={f.blurb} onChange={(e) => setF({ ...f, blurb: e.target.value })} aria-invalid={errors.blurb ? true : undefined} />
            {errors.blurb && <p className="mt-1.5 text-[13px] text-danger">{errors.blurb}</p>}
          </div>
          <Field label="Logo or photo link" autoComplete="off" placeholder="https://... (blank uses the default photo)" {...bind("image")} />
        </div>

        <footer className={DLG_FOOT}>
          {saveError && <p className="error m-0 flex-[1_1_100%]" role="alert">{saveError}</p>}
          <button type="button" className="btn btn-secondary btn-inline" onClick={close} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-inline" disabled={busy}>{busy ? "Saving…" : creating ? "Add product" : "Save changes"}</button>
        </footer>
      </form>
    </dialog>
  );
}
