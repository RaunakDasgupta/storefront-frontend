import { useEffect, useRef } from "react";
import type { Product } from "../shared/data";

/** Asks before deleting a product. Esc, the backdrop and Cancel keep it. */
export function ConfirmDelete({ product, onCancel, onConfirm }: { product: Product; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);

  return (
    <dialog
      ref={ref}
      className="editor confirm"
      aria-labelledby="del-title"
      aria-describedby="del-text"
      onClose={onCancel}
      onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
    >
      <div className="editor-body confirm-body">
        <h2 id="del-title">Delete {product.name}?</h2>
        <p id="del-text" className="muted">
          {product.sku}{product.size ? ` · ${product.size}` : ""} will be removed from the {product.channel} storefront.
          Orders that already include it keep their items. You can undo this right after.
        </p>
      </div>
      <footer className="editor-foot">
        <button type="button" className="btn secondary inline" autoFocus onClick={() => ref.current?.close()}>Cancel</button>
        <button type="button" className="btn danger inline" onClick={onConfirm}>Delete product</button>
      </footer>
    </dialog>
  );
}
