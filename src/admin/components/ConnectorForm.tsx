import { useState, type FormEvent } from "react";
import type { SkuRow } from "../../shared/lib/csv";
import { Field } from "../../shared/ui";
import { fetchRows, initialValues, validateConnection, type Connector, type Errors, type Values } from "../lib/connectors";

/** Connection settings for one database or cloud source. Remounted per source, so nothing typed carries over. Passwords stay here: they are never stored or sent. */
export function ConnectorForm({ connector, onRows }: { connector: Connector; onRows: (label: string, rows: SkuRow[]) => void }) {
  const [serviceId, setServiceId] = useState(connector.services[0].id);
  const service = connector.services.find((s) => s.id === serviceId) ?? connector.services[0];
  const [values, setValues] = useState<Values>(() => initialValues(service));
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  function pickService(id: string) {
    setServiceId(id);
    setValues(initialValues(connector.services.find((s) => s.id === id) ?? connector.services[0]));
    setErrors({});
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const found = validateConnection(service, values);
    setErrors(found);
    const firstBad = Object.keys(found)[0];
    if (firstBad) return document.getElementById(`cx-${firstBad}`)?.focus();
    setBusy(true);
    const { label, rows } = await fetchRows(connector, service, values);
    setBusy(false);
    onRows(label, rows);
  }

  return (
    <form className="connector" onSubmit={onSubmit} noValidate>
      <p className="notice demo-banner" role="note">
        Demo connection. A browser cannot open a database connection, so nothing is contacted: <strong>Connect and preview</strong> checks the form and loads sample products
        so you can try the import. Credentials stay in this form and are never saved or sent.
      </p>

      {connector.services.length > 1 && (
        <div className="field">
          <label htmlFor="cx-service">Service</label>
          <select id="cx-service" value={serviceId} onChange={(e) => pickService(e.target.value)} disabled={busy}>
            {connector.services.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      )}

      <div className="connector-fields">
        {service.fields.map((f) => f.kind === "select" ? (
          <div className="field" key={f.key}>
            <label htmlFor={`cx-${f.key}`}>{f.label}</label>
            <select id={`cx-${f.key}`} value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })} disabled={busy}>
              {f.options?.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        ) : (
          <Field
            key={`${service.id}-${f.key}`} id={`cx-${f.key}`} label={f.label} error={errors[f.key]} value={values[f.key]} placeholder={f.placeholder} disabled={busy}
            type={f.kind === "secret" ? "password" : "text"} inputMode={f.kind === "port" ? "numeric" : undefined} autoComplete="off" spellCheck={false}
            onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
          />
        ))}
      </div>

      <div className="import-actions">
        <button type="submit" className="btn primary inline" disabled={busy}>{busy ? "Connecting…" : "Connect and preview"}</button>
      </div>
    </form>
  );
}
