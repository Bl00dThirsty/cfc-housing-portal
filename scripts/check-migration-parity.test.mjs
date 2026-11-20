// scripts/check-migration-parity.test.mjs
import assert from "node:assert/strict";
import test from "node:test";

import {
  findPendingMigrations,
  formatParityReport,
  parseMigrationVersions,
} from "./check-migration-parity.mjs";

test("parses only 14-digit sql migration version prefixes", () => {
  assert.deepEqual(
    parseMigrationVersions([
      "20261119161940_cfc_staff_intake_routing_catalogue.sql",
      "20261119161940_cfc_staff_intake_routing_catalogue.txt",
      "notes.sql",
    ]),
    ["20261119161940"],
  );
});

test("reports pending versions in ascending order", () => {
  const local = ["20261117130000", "20261119141515", "20261119161940"];
  const applied = ["20261117130000", "20261119141515"];
  assert.deepEqual(findPendingMigrations(local, applied), ["20261119161940"]);
});

test("format includes counts and pending versions without secrets", () => {
  const report = formatParityReport(
    ["20261117130000", "20261119161940"],
    ["20261117130000"],
  );
  assert.match(report, /Local migrations: 2/);
  assert.match(report, /Applied migrations: 1/);
  assert.match(report, /Pending: 1/);
  assert.match(report, /20261119161940/);
});
