import { useEffect, useRef } from "react";
import { DLG, DLG_FOOT } from "../ui";

/** Asks before deleting something. Esc, the backdrop and Cancel keep it. */
export function ConfirmDelete({ title, text, confirmLabel, onCancel, onConfirm }: { title: string; text: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);

  // close through our own state instead of waiting for the dialog's "close" event, so it can always be reopened
  const close = () => { ref.current?.close(); onCancel(); };

  return (
    <dialog
      ref={ref}
      className={`${DLG} w-[min(440px,calc(100vw-32px))]`}
      aria-labelledby="del-title"
      aria-describedby="del-text"
      onCancel={(e) => { e.preventDefault(); close(); }}
      onClose={onCancel}
      onClick={(e) => { if (e.target === ref.current) close(); }}
    >
      <div className="px-[22px] pt-[18px] pb-[18px]">
        <h2 id="del-title" className="mb-2 text-xl">{title}</h2>
        <p id="del-text" className="text-muted">{text}</p>
      </div>
      <footer className={DLG_FOOT}>
        <button type="button" className="btn btn-secondary btn-inline" autoFocus onClick={close}>Cancel</button>
        <button type="button" className="btn btn-danger btn-inline" onClick={onConfirm}>{confirmLabel}</button>
      </footer>
    </dialog>
  );
}
