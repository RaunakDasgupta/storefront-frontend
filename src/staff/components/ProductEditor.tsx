import { useEffect, useRef, useState, type FormEvent } from "react";
import { useCatalog } from "../../shared/hooks/useCatalog";
import type { Product } from "../../shared/lib/data";
import { parseProductForm, toForm, type FormErrors, type ProductForm } from "../../shared/lib/productform";
import { Field } from "../../shared/ui";

/** Edit one product in a modal dialog. Esc, the backdrop and Cancel all close it without saving. */
export function ProductEditor({ product, onClose }: { product: Product; onClose: () => void }) {
  const { update } = useCatalog();
  const ref = useRef<HTMLDialogElement>(null);
  const [f, setF] = useState<ProductForm>(() => toForm(product));
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => { ref.current?.showModal(); }, []);

  // close through our own state instead of waiting for the dialog's "close" event
  const close = () => { ref.current?.close(); onClose(); };

  const bind = (k: keyof ProductForm) => ({ id: `pe-${k}`, value: f[k], error: errors[k], onChange: (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value }) });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const { value, errors: found } = parseProductForm(f);
    setErrors(found);
    const firstBad = Object.keys(found)[0];
    if (!value) return document.getElementById(`pe-${firstBad}`)?.focus();
    update(product.id, value);
    close();
  }

  return (
    <dialog
      ref={ref}
      className="editor"
      aria-labelledby="pe-title"
      onCancel={(e) => { e.preventDefault(); close(); }}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) close(); }}
    >
      <form onSubmit={onSubmit} noValidate>
        <header className="editor-head">
          <div>
            <h2 id="pe-title">Edit product</h2>
            <p className="muted">{product.sku}, the SKU, can't be changed.</p>
          </div>
          <button type="button" className="editor-x" aria-label="Close" onClick={close}>×</button>
        </header>

        <div className="editor-body">
          <Field label="Name" autoComplete="off" {...bind("name")} />
          <div className="row2">
            <Field label="Size" autoComplete="off" placeholder="1 kg, Carton of 12..." {...bind("size")} />
            <Field label="Category" autoComplete="off" {...bind("category")} />
          </div>
          <div className="field">
            <label htmlFor="pe-channel">Type</label>
            <select id="pe-channel" value={f.channel} onChange={(e) => setF({ ...f, channel: e.target.value })}>
              <option value="retail">Retail</option>
              <option value="bulk">Bulk</option>
            </select>
          </div>
          <div className="row3">
            <Field label="Price (₹)" inputMode="decimal" {...bind("price")} />
            <Field label="Compare-at (₹)" inputMode="decimal" placeholder="Optional" {...bind("was")} />
            <Field label="Stock" inputMode="numeric" {...bind("stock")} />
          </div>
          <div className="field">
            <label htmlFor="pe-blurb">Description</label>
            <textarea id="pe-blurb" rows={3} value={f.blurb} onChange={(e) => setF({ ...f, blurb: e.target.value })} aria-invalid={errors.blurb ? true : undefined} />
            {errors.blurb && <p className="field-error">{errors.blurb}</p>}
          </div>
          <Field label="Logo or photo link" autoComplete="off" placeholder="https://... (blank uses the default photo)" {...bind("image")} />
        </div>

        <footer className="editor-foot">
          <button type="button" className="btn secondary inline" onClick={close}>Cancel</button>
          <button type="submit" className="btn primary inline">Save changes</button>
        </footer>
      </form>
    </dialog>
  );
}
