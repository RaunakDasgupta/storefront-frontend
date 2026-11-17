import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../shared/ui";
import { DEMO_STAFF, useStaff } from "./auth";

export function StaffLogin() {
  const { user, signIn } = useStaff();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; field?: "identity" | "password" } | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from ?? "/staff"} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!identity.trim()) return setError({ message: "Enter your work email or employee ID.", field: "identity" });
    if (!password) return setError({ message: "Enter your password.", field: "password" });
    setError(null);
    setBusy(true);
    try {
      await signIn(identity, password);
      navigate(from ?? "/staff", { replace: true });
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <Logo to="/staff/login" label="Everyday Market Staff" />
      <section className="card">
        <h1>Log in</h1>
        <p className="sub">Use your work account to open the staff portal.</p>
        <form onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="identity">Work email or employee ID</label>
            <input id="identity" autoComplete="username" value={identity} onChange={(e) => setIdentity(e.target.value)} aria-invalid={error?.field === "identity" || undefined} autoFocus />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={error?.field === "password" || undefined} />
          </div>
          <p className="error" role="alert" hidden={!error}>{error?.message}</p>
          <button type="submit" className="btn primary" disabled={busy}>Log in</button>
          <div className="divider"><span>or</span></div>
          <button type="button" className="btn secondary" onClick={() => setError({ message: "Single sign-on isn't set up yet." })}>Continue with company SSO</button>
        </form>

        {/* sample credentials only show in `npm run dev`, never in a production build */}
        {import.meta.env.DEV && (
          <aside className="demo" aria-label="Demo account">
            <strong>Demo staff account</strong>
            <dl><dt>Email or ID</dt><dd>{DEMO_STAFF.email} or {DEMO_STAFF.employeeId}</dd><dt>Password</dt><dd>{DEMO_STAFF.password}</dd></dl>
            <button type="button" className="linkbtn" onClick={() => { setIdentity(DEMO_STAFF.email); setPassword(DEMO_STAFF.password); setError(null); }}>
              Fill in these details
            </button>
          </aside>
        )}
      </section>
    </main>
  );
}
