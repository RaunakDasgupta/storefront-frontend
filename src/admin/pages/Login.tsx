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
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8">
      <Logo to="/admin/login" label="Everyday Market" />
      <section className="w-full max-w-[380px]">
        <h1 className="mb-1 text-[26px] leading-[1.15] font-[750]">Admin log in</h1>
        <p className="mb-6 text-muted">Use your work account to open the admin portal.</p>
        <form onSubmit={onSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="identity">Work email or employee ID</label>
            <input id="identity" autoComplete="username" value={identity} onChange={(e) => setIdentity(e.target.value)} aria-invalid={error?.field === "identity" || undefined} autoFocus />
          </div>
          <div className="mb-4">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={error?.field === "password" || undefined} />
          </div>
          <p className="error" role="alert" hidden={!error}>{error?.message}</p>
          <button type="submit" className="btn btn-primary" disabled={busy}>Log in</button>
          <div className="my-4 flex items-center gap-3 text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line"><span>or</span></div>
          <button type="button" className="btn btn-secondary" onClick={() => setError({ message: "Single sign-on isn't set up yet." })}>Continue with company SSO</button>
        </form>

        {/* sample credentials only show in `npm run dev`, and only while sign-in is the built-in mock, never in a production build */}
        {import.meta.env.DEV && mockAuth && (
          <aside className="mt-5 rounded-[10px] border border-dashed border-edge-soft bg-hover px-4 py-3.5 text-[13px]" aria-label="Demo account">
            <strong>Demo admin account</strong>
            <dl className="my-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 [&_dd]:m-0 [&_dd]:font-mono [&_dd]:[overflow-wrap:anywhere] [&_dt]:text-muted"><dt>Email or ID</dt><dd>{DEMO_ADMIN.email} or {DEMO_ADMIN.employeeId}</dd><dt>Password</dt><dd>{DEMO_ADMIN.password}</dd></dl>
            <button type="button" className="linkbtn" onClick={() => { setIdentity(DEMO_ADMIN.email); setPassword(DEMO_ADMIN.password); setError(null); }}>
              Fill in these details
            </button>
          </aside>
        )}
      </section>
    </main>
  );
}
