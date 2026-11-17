import { useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { DEMO_CUSTOMER, useCustomer } from "./auth";
import { useAuthDialog } from "./authDialog";

export function Login() {
  const { signIn } = useCustomer();
  const navigate = useNavigate();
  const authDialog = useAuthDialog();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; field?: "email" | "password" } | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!emailRef.current?.checkValidity() || !email.trim()) return setError({ message: "Enter a valid email address.", field: "email" });
    if (!password) return setError({ message: "Enter your password.", field: "password" });
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      navigate(from ?? "/", { replace: true });
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Log in" subtitle="Log in to place and track your orders." foot={<>New to Everyday Market? <button type="button" className="linkbtn" onClick={() => authDialog.open({ mode: "signup", onSuccess: () => navigate(from ?? "/", { replace: true }) })}>Create account</button></>}>
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" ref={emailRef} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={error?.field === "email" || undefined} autoFocus />
        </div>
        <div className="field">
          <div className="label-row">
            <label htmlFor="password">Password</label>
            <a href="#" className="link">Forgot password?</a>
          </div>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={error?.field === "password" || undefined} />
        </div>
        <p className="error" role="alert" hidden={!error}>{error?.message}</p>
        <button type="submit" className="btn primary" disabled={busy}>Log in</button>
      </form>

      {/* sample credentials only show in `npm run dev`, never in a production build */}
      {import.meta.env.DEV && (
        <aside className="demo" aria-label="Demo account">
          <strong>Demo customer account</strong>
          <dl><dt>Email</dt><dd>{DEMO_CUSTOMER.email}</dd><dt>Password</dt><dd>{DEMO_CUSTOMER.password}</dd></dl>
          <button type="button" className="linkbtn" onClick={() => { setEmail(DEMO_CUSTOMER.email); setPassword(DEMO_CUSTOMER.password); setError(null); }}>
            Fill in these details
          </button>
        </aside>
      )}
    </AuthLayout>
  );
}
