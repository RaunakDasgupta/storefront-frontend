import { useState, type FormEvent } from "react";
import type { SkuRow } from "../../shared/lib/csv";
import { messageOf } from "../../shared/store/errors";
import { Field } from "../../shared/ui";
import { initialValues, sourceLabel, validateConnection, type Connector, type Errors, type Values } from "../lib/connectors";
import { useAppDispatch, useAppSelector } from "../store/typedHooks";
import { connectSource } from "../store/importer";

/** Connection settings for one database or cloud source. Remounted per source, so nothing typed carries over. Nothing is stored; the settings are only sent to the import API when you connect. */
export function ConnectorForm({ connector, onRows }: { connector: Connector; onRows: (label: string, rows: SkuRow[]) => void }) {
  const [serviceId, setServiceId] = useState(connector.services[0].id);
  const service = connector.services.find((s) => s.id === serviceId) ?? connector.services[0];
  const [values, setValues] = useState<Values>(() => initialValues(service));
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const dispatch = useAppDispatch();
  const demo = useAppSelector((s) => s.meta.sources.importer === "mock");

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
    setFailure("");
    setBusy(true);
    try {
      onRows(sourceLabel(connector, service, values), await dispatch(connectSource(connector.id, service.id, values)));
    } catch (err) {
      setFailure(messageOf(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={onSubmit} noValidate>
      {demo ? (
        <p className="notice text-[13px]" role="note">
          Demo connection. A browser cannot open a database connection, so nothing is contacted: <strong>Connect and preview</strong> checks the form and loads sample products
          so you can try the import. Credentials stay in this form and are never saved or sent.
        </p>
      ) : (
        <p className="notice text-[13px]" role="note">
          These settings are sent to your import service, which connects to the source for you. They are not saved in this browser.
        </p>
      )}

      {connector.services.length > 1 && (
        <div className="mb-4">
          <label htmlFor="cx-service">Service</label>
          <select id="cx-service" value={serviceId} onChange={(e) => pickService(e.target.value)} disabled={busy}>
            {connector.services.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 max-sm:grid-cols-1">
        {service.fields.map((f) => f.kind === "select" ? (
          <div className="mb-4" key={f.key}>
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

      {failure && <p className="error mb-0" role="alert">{failure}</p>}
      <div className="flex flex-wrap items-center gap-2.5 max-sm:[&_.btn]:flex-1">
        <button type="submit" className="btn btn-primary btn-inline" disabled={busy}>{busy ? "Connecting…" : "Connect and preview"}</button>
      </div>
    </form>
  );
}
