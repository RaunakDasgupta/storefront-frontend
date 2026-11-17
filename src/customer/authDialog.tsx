import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Field } from "../shared/ui";
import { DEMO_CUSTOMER, useCustomer, type User } from "./auth";

type Mode = "login" | "signup";
type Opts = { mode: Mode; /** What the person is trying to do, for example "place your order". */ reason?: string; onSuccess?: (user: User) => void };
type Ctx = { open: (o: Opts) => void };
const AuthDialogCtx = createContext<Ctx | null>(null);

export function useAuthDialog() {
  const ctx = useContext(AuthDialogCtx);
  if (!ctx) throw new Error("useAuthDialog must be used inside <AuthDialogProvider>");
  return ctx;
}

/** One popup for logging in and creating an account, openable from anywhere (checkout, the account menu, protected pages). */
export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<Opts | null>(null);
  return (
    <AuthDialogCtx.Provider value={{ open: setOpts }}>
      {children}
      {opts && (
        <AuthDialog
          opts={opts}
          onMode={(mode) => setOpts({ ...opts, mode })}
          onClose={() => setOpts(null)}
        />
      )}
    </AuthDialogCtx.Provider>
  );
}

type SignupValues = { first: string; last: string; email: string; password: string };
type SignupErrors = Partial<Record<keyof SignupValues, string>>;

function validateSignup(v: SignupValues): SignupErrors {
  const errors: SignupErrors = {};
  if (!v.first.trim()) errors.first = "Enter your first name.";
  if (!v.last.trim()) errors.last = "Enter your last name.";
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) errors.email = "Enter a valid email address.";
  if (v.password.length < 8) errors.password = "Use at least 8 characters.";
  return errors;
}

function LoginForm({ reason, onDone }: { reason?: string; onDone: (u: User) => void }) {
  const { signIn } = useCustomer();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<{ message: string; field: "email" | "password" | "form" } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !emailRef.current?.checkValidity()) return setError({ message: "Enter a valid email address.", field: "email" });
    if (!password) return setError({ message: "Enter your password.", field: "password" });
    setError(null);
    setBusy(true);
    try {
      onDone(await signIn(email, password));
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : "Something went wrong.", field: "form" });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="dlg-body">
        <div className="field">
          <label htmlFor="ad-email">Email</label>
          <input id="ad-email" ref={emailRef} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={error?.field === "email" || undefined} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="ad-password">Password</label>
          <input id="ad-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={error?.field === "password" || undefined} />
        </div>
        <p className="error" role="alert" hidden={!error}>{error?.message}</p>
        <button type="submit" className="btn primary" disabled={busy}>{reason ? "Log in and place order" : "Log in"}</button>

        {/* sample credentials only show in `npm run dev`, never in a production build */}
        {import.meta.env.DEV && (
          <p className="dlg-demo">
            Demo: <code>{DEMO_CUSTOMER.email}</code> / <code>{DEMO_CUSTOMER.password}</code>{" "}
            <button type="button" className="linkbtn" onClick={() => { setEmail(DEMO_CUSTOMER.email); setPassword(DEMO_CUSTOMER.password); setError(null); }}>Fill in</button>
          </p>
        )}
      </div>
    </form>
  );
}

function SignupForm({ reason, onDone }: { reason?: string; onDone: (u: User) => void }) {
  const { signUp, user } = useCustomer();
  const [v, setV] = useState<SignupValues>({ first: "", last: "", email: "", password: "" });
  const [errors, setErrors] = useState<SignupErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ name: string; email: string } | null>(null);

  // signUp signs the new customer in; hand the user over once the context has it
  useEffect(() => { if (pending && user && user.email === pending.email) onDone(user); }, [pending, user, onDone]);

  const bind = (k: keyof SignupValues) => ({ id: `ad-${k}`, value: v[k], error: errors[k], onChange: (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value }) });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validateSignup(v);
    setErrors(found);
    setFormError("");
    const firstBad = Object.keys(found)[0];
    if (firstBad) return document.getElementById(`ad-${firstBad}`)?.focus();

    setBusy(true);
    try {
      const name = `${v.first.trim()} ${v.last.trim()}`, email = v.email.trim().toLowerCase();
      await signUp(name, email, v.password);
      setPending({ name, email });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="dlg-body">
        <div className="row2">
          <Field label="First name" autoComplete="given-name" {...bind("first")} autoFocus />
          <Field label="Last name" autoComplete="family-name" {...bind("last")} />
        </div>
        <Field label="Email" type="email" autoComplete="email" {...bind("email")} />
        <Field label="Password" type="password" autoComplete="new-password" {...bind("password")} />
        <p className="error" role="alert" hidden={!formError}>{formError}</p>
        <button type="submit" className="btn primary" disabled={busy}>{reason ? "Create account and place order" : "Create account"}</button>
      </div>
    </form>
  );
}

function AuthDialog({ opts, onMode, onClose }: { opts: Opts; onMode: (m: Mode) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);

  // close through our own state instead of waiting for the dialog's "close" event, so it can always be reopened
  const close = () => { ref.current?.close(); onClose(); };
  const done = (u: User) => { close(); opts.onSuccess?.(u); };
  const login = opts.mode === "login";

  return (
    <dialog
      ref={ref}
      className="dlg"
      aria-labelledby="ad-title"
      onCancel={(e) => { e.preventDefault(); close(); }}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) close(); }}
    >
      <header className="dlg-head">
        <div>
          <h2 id="ad-title">{login ? (opts.reason ? `Log in to ${opts.reason}` : "Log in") : "Create your account"}</h2>
          <p className="muted">
            {login
              ? (opts.reason ? "Your cart is saved. Log in and we'll place the order for you." : "Log in to place and track your orders.")
              : (opts.reason ? "Your cart is saved. Create an account and we'll place the order for you." : "Save your details to order faster.")}
          </p>
        </div>
        <button type="button" className="dlg-x" aria-label="Close" onClick={close}>×</button>
      </header>

      {login ? <LoginForm reason={opts.reason} onDone={done} /> : <SignupForm reason={opts.reason} onDone={done} />}

      <footer className="dlg-foot">
        {login
          ? <>New here? <button type="button" className="linkbtn" onClick={() => onMode("signup")}>Create an account</button></>
          : <>Already have an account? <button type="button" className="linkbtn" onClick={() => onMode("login")}>Log in</button></>}
      </footer>
    </dialog>
  );
}

/** Protected pages: signed-out visitors land on the landing page with the log in popup open, then come back here once logged in. */
export function RequireCustomer({ children }: { children: ReactNode }) {
  const { user } = useCustomer();
  const { open } = useAuthDialog();
  const navigate = useNavigate();
  const path = useLocation().pathname;
  // only on arrival: logging out from a protected page must not pop the dialog open again
  useEffect(() => { if (!user) open({ mode: "login", onSuccess: () => navigate(path, { replace: true }) }); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return user ? children : <Navigate to="/" replace />;
}

/** The old /login and /signup pages are popups now: open one over the landing page so old links keep working. */
export function AuthRoute({ mode }: { mode: Mode }) {
  const { open } = useAuthDialog();
  useEffect(() => { open({ mode }); }, [open, mode]);
  return <Navigate to="/" replace />;
}
