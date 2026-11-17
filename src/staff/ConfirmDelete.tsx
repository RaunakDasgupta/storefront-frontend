import { useEffect, useRef } from "react";

/** Asks before deleting something. Esc, the backdrop and Cancel keep it. */
export function ConfirmDelete({ title, text, confirmLabel, onCancel, onConfirm }: { title: string; text: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
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
        <h2 id="del-title">{title}</h2>
        <p id="del-text" className="muted">{text}</p>
      </div>
      <footer className="editor-foot">
        <button type="button" className="btn secondary inline" autoFocus onClick={() => ref.current?.close()}>Cancel</button>
        <button type="button" className="btn danger inline" onClick={onConfirm}>{confirmLabel}</button>
      </footer>
    </dialog>
  );
}
