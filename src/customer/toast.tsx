import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../shared/ui";

type Toast = { message: string; actionLabel?: string; to?: string };
type Ctx = { show: (t: Toast) => void };
const ToastCtx = createContext<Ctx | null>(null);

const SHOW_MS = 7000;

/** A small popup at the bottom centre of the page, with an optional button. It fades out on its own. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(Toast & { id: number }) | null>(null);
  const show = useCallback((t: Toast) => setToast({ ...t, id: Date.now() }), []);
  const dismiss = () => setToast(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), SHOW_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="toast-wrap" aria-live="polite">
        {toast && (
          <div className="toast" role="status" key={toast.id}>
            <span className="toast-icon"><Icon name="check" /></span>
            <span className="toast-msg">{toast.message}</span>
            {toast.to && <Link to={toast.to} className="toast-btn" onClick={dismiss}>{toast.actionLabel ?? "View"}</Link>}
            <button className="toast-x" aria-label="Dismiss" onClick={dismiss}>×</button>
          </div>
        )}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
