import { describe, expect, it } from "vitest";
import { insertStatement, updateStatement } from "./database";
import { schemaStatements, TABLES, toEntity } from "./tables";

describe("schemaStatements", () => {
  it("creates every table with its columns and key", () => {
    const sql = schemaStatements().join("\n");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS password_resets (seq bigint generated always as identity, token text not null");
    expect(sql).toContain("PRIMARY KEY (workspace_id, integration_id)");
    expect(sql).toContain("due_date text,");
    expect(sql).toContain("users_email_lower_idx");
  });
});

describe("toEntity", () => {
  it("camel-cases columns and drops seq", () => {
    expect(toEntity({ seq: 1, user_id: "u", workspace_id: "w" })).toEqual({ userId: "u", workspaceId: "w" });
  });
});

describe("insertStatement", () => {
  it("lists columns in order and upserts on the key", () => {
    const { text, params } = insertStatement(
      TABLES.integrations,
      { workspaceId: "w", integrationId: "slack", connected: true, updatedAt: "t" },
      "UPSERT",
    );
    expect(text).toBe(
      "INSERT INTO integrations (workspace_id, integration_id, connected, updated_at) VALUES ($1, $2, $3, $4) ON CONFLICT (workspace_id, integration_id) DO UPDATE SET connected = EXCLUDED.connected, updated_at = EXCLUDED.updated_at RETURNING *",
    );
    expect(params).toEqual(["w", "slack", true, "t"]);
  });

  it("stores missing nullable fields as null", () => {
    const { params } = insertStatement(TABLES.passwordResets, { token: "t", userId: "u", expiresAt: "e" });
    expect(params).toEqual(["t", "u", "e", null]);
  });
});

describe("updateStatement", () => {
  it("sets only defined, known fields", () => {
    const statement = updateStatement(TABLES.tasks, ["tsk_1"], { title: "New", assigneeId: null, dueDate: undefined, bogus: 1 });
    expect(statement).toEqual({
      text: "UPDATE tasks SET title = $1, assignee_id = $2 WHERE id = $3 RETURNING *",
      params: ["New", null, "tsk_1"],
    });
  });

  it("returns null when there is nothing to set", () => {
    expect(updateStatement(TABLES.tasks, ["tsk_1"], { dueDate: undefined })).toBeNull();
  });
});
