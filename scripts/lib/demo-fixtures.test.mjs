import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDemoBorrowerIdentity,
  buildDemoSavingsLedger,
  DEMO_CITIZENS,
  DEMO_STAFF,
} from "./demo-fixtures.mjs";

test("the fixture set gives every modeled phase enough cases to review populated views", () => {
  const supportedPhases = [
    "kyc_savings",
    "risk_bet",
    "committees",
    "notary_mortgage",
    "disbursements",
  ];
  const counts = new Map();
  for (const citizen of DEMO_CITIZENS) {
    counts.set(citizen.phase, (counts.get(citizen.phase) ?? 0) + 1);
  }

  for (const phase of supportedPhases) {
    assert.equal(counts.get(phase) ?? 0, 20, `${phase} should have twenty dossiers`);
  }

  assert.equal(DEMO_CITIZENS.length, 100, "the stable local/staging dataset should contain 100 dossiers");
});

test("every configured staff role has a local or staging account fixture", () => {
  const expectedRoles = [
    "ADMIN",
    "GUICHET",
    "GESTIONNAIRE",
    "RISQUES_BET",
    "NOTAIRE",
    "COMITE",
    "DIASPORA",
    "PMO",
    "ANALYSTE",
    "RECOUVREMENT",
    "ARCHIVISTE",
    "AUDIT",
  ];
  const roles = new Set(DEMO_STAFF.map(({ role }) => role));
  for (const role of expectedRoles) {
    assert.ok(roles.has(role), `${role} should have a staff login fixture`);
  }
});

test("fixture dossier codes are unique and shared borrowers keep one profile identity", () => {
  const dossierCodes = DEMO_CITIZENS.map(({ ducCode }) => ducCode);
  assert.equal(new Set(dossierCodes).size, dossierCodes.length);

  const requestsByEmail = new Map();
  for (const citizen of DEMO_CITIZENS) {
    const email = citizen.email.toLowerCase();
    const requests = requestsByEmail.get(email) ?? [];
    requests.push(citizen);
    requestsByEmail.set(email, requests);
  }

  assert.ok([...requestsByEmail.values()].some((requests) => requests.length > 1),
    "at least one borrower should have multiple open requests");
  for (const requests of requestsByEmail.values()) {
    assert.equal(new Set(requests.map(({ name }) => name)).size, 1,
      "a shared login must keep one consistent profile name");
  }

  const multiPhaseBorrower = [...requestsByEmail.values()].find((requests) =>
    requests.some(({ phase }) => phase === "kyc_savings")
      && requests.some(({ phase }) => phase === "risk_bet"),
  );
  assert.ok(multiPhaseBorrower, "a borrower should have requests at different active workflow stages");
});

test("demo borrower identity is deterministic and unique per seeded account", () => {
  const identities = DEMO_CITIZENS.map(({ email }) => buildDemoBorrowerIdentity(email));
  const uniqueEmails = new Set(DEMO_CITIZENS.map(({ email }) => email.toLowerCase()));
  const identityByEmail = new Map();
  DEMO_CITIZENS.forEach(({ email }, index) => identityByEmail.set(email.toLowerCase(), identities[index]));
  const uniqueIdentities = [...identityByEmail.values()];

  assert.deepEqual(buildDemoBorrowerIdentity("EMPRUNTEUR@CFC.CM"), buildDemoBorrowerIdentity("emprunteur@cfc.cm"));
  assert.equal(new Set(uniqueIdentities.map(({ cni }) => cni)).size, uniqueEmails.size);
  assert.equal(new Set(uniqueIdentities.map(({ phone }) => phone)).size, uniqueEmails.size);
  for (const identity of uniqueIdentities) {
    assert.match(identity.cni, /^CFC[A-F0-9]{9}$/);
    assert.match(identity.phone, /^\+237699\d{6}$/);
    assert.match(identity.birthDate, /^\d{4}-06-15$/);
  }
});

test("savings ledger fixtures are deterministic and reconcile to the account balance", () => {
  const input = {
    ducCode: "CFC-DEV-TEST-0001",
    monthlySavings: 125000.25,
    totalAmount: 375001,
    months: 3,
    asOf: "2026-11-19",
  };
  const entries = buildDemoSavingsLedger(input);
  const replay = buildDemoSavingsLedger(input);

  assert.equal(entries.length, 3);
  assert.deepEqual(replay, entries);
  assert.equal(entries.reduce((total, entry) => total + entry.amount, 0), 375001);
  assert.deepEqual(entries.map(({ balanceAfter }) => balanceAfter), [125000.34, 250000.67, 375001]);
  assert.equal(new Set(entries.map(({ reference }) => reference)).size, entries.length);
  assert.deepEqual(entries.map(({ transactionDate }) => transactionDate), [
    "2026-08-21",
    "2026-09-20",
    "2026-10-20",
  ]);
});

test("zero savings months produce an empty ledger", () => {
  assert.deepEqual(buildDemoSavingsLedger({
    ducCode: "CFC-DEV-TEST-0002",
    monthlySavings: 125000,
    months: 0,
    asOf: "2026-11-19",
  }), []);
});
