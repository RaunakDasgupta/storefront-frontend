import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../../shared/ui";
import { useAppDispatch, useAppSelector } from "../store/typedHooks";
import { toastDismissed, toastShown, type ToastInput } from "../store/toastSlice";

const SHOW_MS = 7000;

export function useToast() {
  const dispatch = useAppDispatch();
  return useMemo(() => ({ show: (t: ToastInput) => { dispatch(toastShown(t)); } }), [dispatch]);
}

/** A small popup at the bottom centre of the page, with an optional button. It fades out on its own. */
export function ToastHost() {
  const dispatch = useAppDispatch();
  const toast = useAppSelector((s) => s.toast.current);
  const dismiss = () => dispatch(toastDismissed());

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => dispatch(toastDismissed()), SHOW_MS);
    return () => clearTimeout(timer);
  }, [toast, dispatch]);

  return (
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
  );
}
