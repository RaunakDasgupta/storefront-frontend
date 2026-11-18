import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../../shared/ui";
import { DEMO_ADMIN, useAdmin } from "../hooks/useAdmin";
import { useAppSelector } from "../store/typedHooks";

export function AdminLogin() {
  const { user, signIn } = useAdmin();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; field?: "identity" | "password" } | null>(null);
  const [busy, setBusy] = useState(false);
  const mockAuth = useAppSelector((s) => s.meta.sources.adminAuth === "mock");

  if (user) return <Navigate to={from ?? "/admin"} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!identity.trim()) return setError({ message: "Enter your work email or employee ID.", field: "identity" });
    if (!password) return setError({ message: "Enter your password.", field: "password" });
    setError(null);
    setBusy(true);
    try {
      await signIn(identity, password);
      navigate(from ?? "/admin", { replace: true });
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login">
      <Logo to="/admin/login" label="Everyday Market" />
      <section className="card">
        <h1>Admin log in</h1>
        <p className="sub">Use your work account to open the admin portal.</p>
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

        {/* sample credentials only show in `npm run dev`, and only while sign-in is the built-in mock, never in a production build */}
        {import.meta.env.DEV && mockAuth && (
          <aside className="demo" aria-label="Demo account">
            <strong>Demo admin account</strong>
            <dl><dt>Email or ID</dt><dd>{DEMO_ADMIN.email} or {DEMO_ADMIN.employeeId}</dd><dt>Password</dt><dd>{DEMO_ADMIN.password}</dd></dl>
            <button type="button" className="linkbtn" onClick={() => { setIdentity(DEMO_ADMIN.email); setPassword(DEMO_ADMIN.password); setError(null); }}>
              Fill in these details
            </button>
          </aside>
        )}
      </section>
    </main>
  );
}
