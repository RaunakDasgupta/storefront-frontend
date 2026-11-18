// Data sources the Import page can pull SKUs from. This is a front-end demo: a browser cannot open a database
// connection, so "connecting" only checks the form and then loads sample rows to try the import flow with.
// shortcut: no real connection, so a production app would send these settings to a server-side import service.
import { seedProducts } from "../../shared/lib/data.ts";
import type { SkuRow } from "../../shared/lib/csv.ts";

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

/** Sample products standing in for what a real source would return: four new SKUs and one change to an existing product. */
function sampleRows(from: string): SkuRow[] {
  const blurb = `Imported from ${from}.`;
  const existing = seedProducts[0];
  return [
    { sku: "DB-101", name: "Dishwash liquid", size: "500 ml", price: 129, category: "Home care", blurb, stock: 80, channel: "retail" },
    { sku: "DB-102", name: "Body lotion", size: "250 ml", price: 219, category: "Personal care", blurb, stock: 36, channel: "retail" },
    { sku: "DB-103", name: "Paper napkins", size: "Pack of 100", price: 79, category: "Paper essentials", blurb, stock: 120, channel: "retail" },
    { sku: "DB-201", name: "Dishwash liquid", size: "Carton of 12", price: 1399, category: "Home care", blurb, stock: 20, channel: "bulk" },
    { sku: existing.sku, name: existing.name, size: existing.size, price: existing.price - 10, category: existing.category, blurb: existing.blurb, stock: existing.stock, channel: existing.channel },
  ];
}

/** "Connects" after a short wait, like a real source would, and returns the sample rows. */
export async function fetchRows(c: Connector, s: Service, v: Values, delayMs = 1200): Promise<{ label: string; rows: SkuRow[] }> {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  const where = v.table || v.object || v.key || "the source";
  const label = `${c.id === "aws" || c.id === "gcp" ? `${c.label} ${s.label}` : c.label} · ${where}`;
  return { label, rows: sampleRows(label) };
}
