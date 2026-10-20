import "server-only";
import { neon } from "@neondatabase/serverless";
import type { MemoryDb } from "@/server/repositories/memory/store";
import { schemaStatements, snake, TABLES, type TableDef } from "./tables";

export type Row = Record<string, unknown>;

/** A statement and its parameters, for `Database.transaction`. */
export interface Statement {
  text: string;
  params: unknown[];
}

/** Arbitrary constant: serialises schema setup across server instances. */
const SCHEMA_LOCK_ID = 7_302_184;

/**
 * Thin wrapper over Neon's HTTP driver. Every call waits for `prepare()` first, so the schema
 * (and the demo seed on an empty database) is in place before the first query of a process.
 */
export class Database {
  private readonly sql;
  private ready: Promise<void> | null = null;

  constructor(
    connectionString: string,
    private readonly createSeed: () => MemoryDb,
  ) {
    this.sql = neon(connectionString);
  }

  async query(text: string, params: unknown[] = []): Promise<Row[]> {
    await this.prepare();
    return (await this.sql.query(text, params as never[])) as Row[];
  }

  /** Runs the statements as one transaction; returns each statement's rows. */
  async transaction(statements: readonly Statement[]): Promise<Row[][]> {
    if (statements.length === 0) return [];
    await this.prepare();
    return (await this.sql.transaction((txn) =>
      statements.map(({ text, params }) => txn.query(text, params as never[])),
    )) as Row[][];
  }

  private prepare(): Promise<void> {
    // A failed attempt is not cached, so the next request retries.
    this.ready ??= this.setUp().catch((error) => {
      this.ready = null;
      throw error;
    });
    return this.ready;
  }

  private async setUp(): Promise<void> {
    await this.sql.transaction((txn) => [
      txn.query("SELECT pg_advisory_xact_lock($1)", [SCHEMA_LOCK_ID]),
      ...schemaStatements().map((statement) => txn.query(statement)),
    ]);
    const [{ count }] = (await this.sql.query("SELECT count(*)::int AS count FROM users")) as [{ count: number }];
    if (count > 0) return;

    // Idempotent, so two instances seeding an empty database at once can't clash.
    const seed = this.createSeed();
    await this.sql.transaction((txn) =>
      (Object.keys(TABLES) as (keyof MemoryDb)[]).flatMap((name) =>
        (seed[name] as Row[]).map((row) => {
          const { text, params } = insertStatement(TABLES[name], row, "DO NOTHING");
          return txn.query(text, params as never[]);
        }),
      ),
    );
  }
}

const placeholders = (count: number, from = 1) => Array.from({ length: count }, (_, i) => `$${i + from}`).join(", ");

/** `INSERT … RETURNING *` for one entity. `conflict` handles an existing row with the same key. */
export function insertStatement(
  table: TableDef,
  row: Row,
  conflict?: "DO NOTHING" | "UPSERT",
): Statement {
  const properties = Object.keys(table.columns);
  const columns = properties.map(snake);
  let text = `INSERT INTO ${table.name} (${columns.join(", ")}) VALUES (${placeholders(columns.length)})`;
  if (conflict) {
    const key = table.key.map(snake).join(", ");
    const updates = properties
      .filter((property) => !table.key.includes(property))
      .map((property) => `${snake(property)} = EXCLUDED.${snake(property)}`);
    text += ` ON CONFLICT (${key}) ${conflict === "UPSERT" && updates.length > 0 ? `DO UPDATE SET ${updates.join(", ")}` : "DO NOTHING"}`;
  }
  return { text: `${text} RETURNING *`, params: properties.map((property) => row[property] ?? null) };
}

/** `UPDATE … RETURNING *` applying the defined fields of `patch` to the row with this key. */
export function updateStatement(table: TableDef, keyValues: readonly unknown[], patch: Row): Statement | null {
  const fields = Object.keys(patch).filter((property) => property in table.columns && patch[property] !== undefined);
  if (fields.length === 0) return null;
  const sets = fields.map((property, index) => `${snake(property)} = $${index + 1}`);
  const where = table.key.map((property, index) => `${snake(property)} = $${fields.length + index + 1}`);
  return {
    text: `UPDATE ${table.name} SET ${sets.join(", ")} WHERE ${where.join(" AND ")} RETURNING *`,
    params: [...fields.map((property) => patch[property]), ...keyValues],
  };
}
