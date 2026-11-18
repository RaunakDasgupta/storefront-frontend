import assert from "node:assert/strict";
import { test } from "node:test";
import { CONNECTORS, initialValues, sourceLabel, validateConnection } from "./connectors.ts";

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

test("a source is named after its service and what it reads", () => {
  const aws = CONNECTORS.find((c) => c.id === "aws")!;
  assert.match(sourceLabel(aws, aws.services[0], { key: "skus/latest.csv" }), /Amazon Web Services S3 bucket.*skus\/latest\.csv/);
  assert.equal(sourceLabel(postgres, service, { table: "products" }), "PostgreSQL · products");
});
