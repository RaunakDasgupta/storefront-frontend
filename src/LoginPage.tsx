import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { DEMO, homeFor, useAuth, type Role } from "./auth";
import { AuthShell } from "./AuthShell";

const ROLES: Role[] = ["customer", "employee"];

const COPY: Record<Role, { label: string; subtitle: string; identityLabel: string; identityType: string; identityError: string }> = {
  customer: {
    label: "Customer",
    subtitle: "Log in to see your orders and saved details.",
    identityLabel: "Email",
    identityType: "email",
    identityError: "Enter a valid email address.",
  },
  employee: {
    label: "Employee",
    subtitle: "Log in to the staff portal with your work account.",
    identityLabel: "Work email or employee ID",
    identityType: "text",
    identityError: "Enter your work email or employee ID.",
  },
};

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [role, setRole] = useState<Role>("customer");
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; field?: "identity" | "password" } | null>(null);
  const [busy, setBusy] = useState(false);
  const tabRefs = useRef<Record<Role, HTMLButtonElement | null>>({ customer: null, employee: null });
  const identityRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const c = COPY[role];

  function pick(next: Role) {
    setRole(next);
    setError(null);
  }

  function onTabKey(e: KeyboardEvent) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next = ROLES[(ROLES.indexOf(role) + 1) % ROLES.length];
    pick(next);
    tabRefs.current[next]?.focus();
  }

  function fail(message: string, field?: "identity" | "password") {
    setError({ message, field });
    (field === "password" ? passwordRef : field === "identity" ? identityRef : null)?.current?.focus();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const id = identity.trim();
    if (!id || (role === "customer" && !identityRef.current?.checkValidity())) return fail(c.identityError, "identity");
    if (!password) return fail("Enter your password.", "password");

    setError(null);
    setBusy(true);
    try {
      await signIn(role, id, password);
      navigate(from ?? homeFor(role), { replace: true });
    } catch (err) {
      fail(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Log in"
      subtitle={c.subtitle}
      staff={role === "employee"}
      // staff accounts are provisioned, not self-served
      foot={role === "customer" ? <>New to Storefront? <Link to="/signup" className="link">Create account</Link></> : undefined}
    >
      <div className="tabs" role="tablist" aria-label="Account type">
        {ROLES.map((r) => (
          <button
            key={r}
            ref={(el) => { tabRefs.current[r] = el; }}
            type="button"
            role="tab"
            id={`tab-${r}`}
            aria-selected={r === role}
            aria-controls="panel"
            tabIndex={r === role ? 0 : -1}
            onClick={() => pick(r)}
            onKeyDown={onTabKey}
          >
            {COPY[r].label}
          </button>
        ))}
      </div>

      <form id="panel" role="tabpanel" aria-labelledby={`tab-${role}`} onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="identity">{c.identityLabel}</label>
          <input
            id="identity"
            ref={identityRef}
            type={c.identityType}
            autoComplete="username"
            value={identity}
            onChange={(e) => setIdentity(e.target.value)}
            aria-invalid={error?.field === "identity" || undefined}
          />
        </div>

        <div className="field">
          <div className="label-row">
            <label htmlFor="password">Password</label>
            <a href="#" className="link">Forgot password?</a>
          </div>
          <input
            id="password"
            ref={passwordRef}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error?.field === "password" || undefined}
          />
        </div>

        <p className="error" role="alert" hidden={!error}>{error?.message}</p>

        <button type="submit" className="btn primary" disabled={busy}>Log in</button>

        {role === "employee" && (
          <>
            <div className="divider"><span>or</span></div>
            <button type="button" className="btn secondary" onClick={() => fail("Single sign-on isn't set up yet.")}>
              Continue with company SSO
            </button>
          </>
        )}
      </form>

      {/* sample credentials only show in `npm run dev`, never in a production build */}
      {import.meta.env.DEV && (
        <aside className="demo" aria-label="Demo account">
          <strong>Demo {role} account</strong>
          <dl>
            <dt>{role === "employee" ? "Email or ID" : "Email"}</dt>
            <dd>{DEMO[role].email}{DEMO[role].employeeId && ` or ${DEMO[role].employeeId}`}</dd>
            <dt>Password</dt>
            <dd>{DEMO[role].password}</dd>
          </dl>
          <button type="button" className="linkbtn" onClick={() => { setIdentity(DEMO[role].email); setPassword(DEMO[role].password); setError(null); }}>
            Fill in these details
          </button>
        </aside>
      )}
    </AuthShell>
  );
}
