import assert from "node:assert/strict";
import { test } from "node:test";
import { CONNECTORS, fetchRows, initialValues, validateConnection } from "./connectors.ts";

const postgres = CONNECTORS.find((c) => c.id === "postgres")!;
const service = postgres.services[0];

test("the connection form asks for every field and checks the port", () => {
  const empty = validateConnection(service, initialValues(service));
  assert.deepEqual(Object.keys(empty).sort(), ["database", "host", "password", "user"]);
  const filled = { ...initialValues(service), host: "db.example.com", database: "shop", user: "reader", password: "pw" };
  assert.deepEqual(validateConnection(service, filled), {});
  assert.ok(validateConnection(service, { ...filled, port: "99999" }).port);
  assert.ok(validateConnection(service, { ...filled, port: "54x2" }).port);
});

test("every connector has at least one service with a field for each required setting", () => {
  assert.deepEqual(CONNECTORS.map((c) => c.id), ["postgres", "sqlite", "aws", "gcp"]);
  for (const c of CONNECTORS) for (const s of c.services) assert.ok(s.fields.length > 0, `${c.id}/${s.id}`);
});

test("connecting returns sample rows labelled with the source", async () => {
  const aws = CONNECTORS.find((c) => c.id === "aws")!;
  const { label, rows } = await fetchRows(aws, aws.services[0], { key: "skus/latest.csv" }, 0);
  assert.match(label, /Amazon Web Services S3 bucket/);
  assert.equal(rows.length, 5);
  assert.ok(rows.every((r) => r.price > 0 && r.sku));
});
