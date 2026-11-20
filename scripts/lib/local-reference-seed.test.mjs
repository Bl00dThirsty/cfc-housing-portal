import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { localSeedCommand, resolveLocalProjectId } from "./local-reference-seed.mjs";

describe("local reference seed command", () => {
  it("reads the container namespace from the project Supabase config", () => {
    const projectId = resolveLocalProjectId('[db]\nport = 54322\n\nproject_id = "cfc-housing-portal"\n');
    assert.equal(projectId, "cfc-housing-portal");
    assert.deepEqual(localSeedCommand(projectId), {
      program: "docker",
      args: ["exec", "-i", "supabase_db_cfc-housing-portal", "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"],
    });
  });

  it("rejects missing or unsafe project ids", () => {
    assert.throws(() => resolveLocalProjectId("port = 54322"), /project_id/);
    assert.throws(() => localSeedCommand("../production"), /invalid/);
  });
});
