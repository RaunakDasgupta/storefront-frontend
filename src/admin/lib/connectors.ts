// Data sources the Import page can pull SKUs from, and the connection settings each one asks for. A browser cannot open a
// database connection, so the settings go to the import API (see shared/api); without one, the mock returns sample rows.

export type FieldDef = {
  key: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  /** "port" must be a number from 1 to 65535; "secret" is shown as dots and never kept. */
  kind?: "text" | "port" | "secret" | "select";
  options?: string[];
  optional?: boolean;
};
/** One thing to read from: for example AWS S3 or AWS RDS. */
export type Service = { id: string; label: string; fields: FieldDef[] };
export type Connector = { id: string; label: string; badge: string; description: string; services: Service[] };
export type Values = Record<string, string>;
export type Errors = Record<string, string>;

const table: FieldDef = { key: "table", label: "Table", placeholder: "products", defaultValue: "products" };
const user: FieldDef = { key: "user", label: "User", placeholder: "store_reader" };
const password: FieldDef = { key: "password", label: "Password", kind: "secret" };
const database: FieldDef = { key: "database", label: "Database", placeholder: "storefront" };
const port = (n: string): FieldDef => ({ key: "port", label: "Port", kind: "port", defaultValue: n });
const awsRegions = ["ap-south-1", "us-east-1", "us-west-2", "eu-west-1"];

export const CONNECTORS: Connector[] = [
  {
    id: "postgres", label: "PostgreSQL", badge: "PG", description: "Read products from a table",
    services: [{ id: "postgres", label: "PostgreSQL", fields: [
      { key: "host", label: "Host", placeholder: "db.example.com" }, port("5432"), database, user, password, table,
      { key: "ssl", label: "Encryption", kind: "select", options: ["Require SSL", "Prefer SSL", "No SSL"], defaultValue: "Require SSL" },
    ] }],
  },
  {
    id: "sqlite", label: "SQLite", badge: "SQ", description: "Read products from a database file",
    services: [{ id: "sqlite", label: "SQLite", fields: [{ key: "file", label: "Database file", placeholder: "/data/store.sqlite" }, table] }],
  },
  {
    id: "aws", label: "Amazon Web Services", badge: "AWS", description: "S3 bucket or RDS database",
    services: [
      { id: "s3", label: "S3 bucket (CSV file)", fields: [
        { key: "bucket", label: "Bucket", placeholder: "my-store-exports" }, { key: "key", label: "Object key", placeholder: "skus/latest.csv" },
        { key: "region", label: "Region", kind: "select", options: awsRegions, defaultValue: "ap-south-1" },
        { key: "accessKeyId", label: "Access key ID", placeholder: "AKIA…" }, { key: "secretKey", label: "Secret access key", kind: "secret" },
      ] },
      { id: "rds", label: "RDS (PostgreSQL)", fields: [
        { key: "host", label: "Endpoint", placeholder: "mydb.abc123.ap-south-1.rds.amazonaws.com" }, port("5432"),
        { key: "region", label: "Region", kind: "select", options: awsRegions, defaultValue: "ap-south-1" }, database, user, password, table,
      ] },
    ],
  },
  {
    id: "gcp", label: "Google Cloud", badge: "GCP", description: "Cloud Storage, Cloud SQL or BigQuery",
    services: [
      { id: "gcs", label: "Cloud Storage (CSV file)", fields: [
        { key: "project", label: "Project ID", placeholder: "my-store-project" }, { key: "bucket", label: "Bucket", placeholder: "my-store-exports" },
        { key: "object", label: "Object", placeholder: "skus/latest.csv" }, { key: "serviceKey", label: "Service account key (JSON)", kind: "secret" },
      ] },
      { id: "cloudsql", label: "Cloud SQL (PostgreSQL)", fields: [
        { key: "instance", label: "Instance connection name", placeholder: "project:region:instance" }, database, user, password, table,
      ] },
      { id: "bigquery", label: "BigQuery", fields: [
        { key: "project", label: "Project ID", placeholder: "my-store-project" }, { key: "dataset", label: "Dataset", placeholder: "storefront" },
        { key: "table", label: "Table", placeholder: "products", defaultValue: "products" }, { key: "serviceKey", label: "Service account key (JSON)", kind: "secret" },
      ] },
    ],
  },
];

export const initialValues = (s: Service): Values => Object.fromEntries(s.fields.map((f) => [f.key, f.defaultValue ?? ""]));

/** What is missing or wrong in the form, by field. Empty when it can be used. */
export function validateConnection(s: Service, v: Values): Errors {
  const errors: Errors = {};
  for (const f of s.fields) {
    const value = (v[f.key] ?? "").trim();
    if (!value && !f.optional) errors[f.key] = `Enter the ${f.label.toLowerCase()}.`;
    else if (f.kind === "port" && !(/^\d+$/.test(value) && +value >= 1 && +value <= 65535)) errors[f.key] = "Enter a port from 1 to 65535.";
  }
  return errors;
}

/** How a source is named in the preview, for example "PostgreSQL · products". */
export function sourceLabel(c: Connector, s: Service, v: Values): string {
  const where = v.table || v.object || v.key || "the source";
  return `${c.id === "aws" || c.id === "gcp" ? `${c.label} ${s.label}` : c.label} · ${where}`;
}
