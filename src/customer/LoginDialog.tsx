import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { DEMO_CUSTOMER, useCustomer, type User } from "./auth";

/** A login popup for checkout: log in without leaving the cart, then carry on. Esc, the backdrop and × close it. */
export function LoginDialog({ from, onLoggedIn, onClose }: { from: string; onLoggedIn: (user: User) => void; onClose: () => void }) {
  const { signIn } = useCustomer();
  const ref = useRef<HTMLDialogElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; field: "email" | "password" | "form" } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { ref.current?.showModal(); }, []);

  // close through our own state instead of waiting for the dialog's "close" event, so it can always be reopened
  const close = () => { ref.current?.close(); onClose(); };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !emailRef.current?.checkValidity()) return setError({ message: "Enter a valid email address.", field: "email" });
    if (!password) return setError({ message: "Enter your password.", field: "password" });
    setError(null);
    setBusy(true);
    try {
      const user = await signIn(email, password);
      onLoggedIn(user);
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : "Something went wrong.", field: "form" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      className="dlg"
      aria-labelledby="ld-title"
      onCancel={(e) => { e.preventDefault(); close(); }}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) close(); }}
    >
      <form onSubmit={onSubmit} noValidate>
        <header className="dlg-head">
          <div>
            <h2 id="ld-title">Log in to place your order</h2>
            <p className="muted">Your cart is saved. Log in and we'll place the order for you.</p>
          </div>
          <button type="button" className="dlg-x" aria-label="Close" onClick={close}>×</button>
        </header>

        <div className="dlg-body">
          <div className="field">
            <label htmlFor="ld-email">Email</label>
            <input id="ld-email" ref={emailRef} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={error?.field === "email" || undefined} autoFocus />
          </div>
          <div className="field">
            <label htmlFor="ld-password">Password</label>
            <input id="ld-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={error?.field === "password" || undefined} />
          </div>
          <p className="error" role="alert" hidden={!error}>{error?.message}</p>
          <button type="submit" className="btn primary" disabled={busy}>Log in and place order</button>

          {/* sample credentials only show in `npm run dev`, never in a production build */}
          {import.meta.env.DEV && (
            <p className="dlg-demo">
              Demo: <code>{DEMO_CUSTOMER.email}</code> / <code>{DEMO_CUSTOMER.password}</code>{" "}
              <button type="button" className="linkbtn" onClick={() => { setEmail(DEMO_CUSTOMER.email); setPassword(DEMO_CUSTOMER.password); setError(null); }}>Fill in</button>
            </p>
          )}
        </div>

        <footer className="dlg-foot">
          New here? <Link to="/signup" state={{ from }} className="link" onClick={() => ref.current?.close()}>Create an account</Link>
        </footer>
      </form>
    </dialog>
  );
}
