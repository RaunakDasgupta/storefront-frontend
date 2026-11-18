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
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4 max-sm:bottom-4" aria-live="polite">
      {toast && (
        <div className="pointer-events-auto flex max-w-[520px] animate-toast-in items-center gap-3 rounded-[14px] bg-ink py-2.5 pr-2.5 pl-3.5 text-surface shadow-[0_12px_32px_rgba(0,0,0,.35)] max-sm:flex-wrap max-sm:gap-y-2" role="status" key={toast.id}>
          <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-brand text-white"><Icon name="check" className="size-4 stroke-[3]" /></span>
          <span className="text-sm font-[550]">{toast.message}</span>
          {toast.to && <Link to={toast.to} className="shrink-0 rounded-lg bg-surface px-3.5 py-1.5 text-[13px] font-bold whitespace-nowrap text-ink no-underline hover:bg-brand-tint" onClick={dismiss}>{toast.actionLabel ?? "View"}</Link>}
          <button className="size-7 shrink-0 rounded-full border-0 bg-transparent text-xl leading-none text-surface/70 hover:bg-surface/10 hover:text-surface" aria-label="Dismiss" onClick={dismiss}>×</button>
        </div>
      )}
    </div>
  );
}
