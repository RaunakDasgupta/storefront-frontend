import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Field } from "../shared/ui";
import { AuthLayout } from "./AuthLayout";
import { useCustomer } from "./auth";

type Values = { first: string; last: string; email: string; password: string };
type Errors = Partial<Record<keyof Values, string>>;

function validate(v: Values): Errors {
  const errors: Errors = {};
  if (!v.first.trim()) errors.first = "Enter your first name.";
  if (!v.last.trim()) errors.last = "Enter your last name.";
  if (!/^\S+@\S+\.\S+$/.test(v.email.trim())) errors.email = "Enter a valid email address.";
  if (v.password.length < 8) errors.password = "Use at least 8 characters.";
  return errors;
}

export function Signup() {
  const { signUp } = useCustomer();
  const navigate = useNavigate();
  const [v, setV] = useState<Values>({ first: "", last: "", email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const bind = (k: keyof Values) => ({ id: k, value: v[k], error: errors[k], onChange: (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value }) });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validate(v);
    setErrors(found);
    setFormError("");
    const firstBad = Object.keys(found)[0];
    if (firstBad) return document.getElementById(firstBad)?.focus();

    setBusy(true);
    try {
      await signUp(`${v.first.trim()} ${v.last.trim()}`, v.email.trim(), v.password);
      navigate("/", { replace: true });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout title="Create account" subtitle="Save your details for faster checkout." foot={<>Already have an account? <Link to="/login" className="link">Log in</Link></>}>
      <form onSubmit={onSubmit} noValidate>
        <div className="row2">
          <Field label="First name" autoComplete="given-name" {...bind("first")} />
          <Field label="Last name" autoComplete="family-name" {...bind("last")} />
        </div>
        <Field label="Email" type="email" autoComplete="email" {...bind("email")} />
        <Field label="Password" type="password" autoComplete="new-password" {...bind("password")} />
        <p className="error" role="alert" hidden={!formError}>{formError}</p>
        <button type="submit" className="btn primary" disabled={busy}>Create account</button>
      </form>
    </AuthLayout>
  );
}
