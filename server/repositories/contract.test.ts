import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createMemoryContainer, createPostgresContainer, type Container } from "@/server/container";
import type { Project, Task } from "@/server/domain/types";
import { SEED_IDS } from "@/server/seed";

/**
 * Behaviour every repository adapter must share. Memory always runs; Postgres runs when
 * `TEST_DATABASE_URL` points at a scratch database. Each test works in its own project, so
 * nothing needs resetting between tests or adapters.
 */
const adapters: { name: string; create: () => Container; skip?: boolean }[] = [
  { name: "memory", create: () => createMemoryContainer() },
  {
    name: "postgres",
    create: () => createPostgresContainer(process.env.TEST_DATABASE_URL!),
    skip: !process.env.TEST_DATABASE_URL,
  },
];

const OWNER = SEED_IDS.users.demo;
const MEMBER = SEED_IDS.users.priya;

describe.each(adapters)("task repository ($name)", ({ create, skip }) => {
  const container = skip ? (undefined as never) : create();

  async function scratchProject(): Promise<Project> {
    return container.projects.create({
      id: `prj_${randomUUID()}`,
      workspaceId: SEED_IDS.workspace,
      name: "Contract",
      description: "",
      color: "blue",
      archived: false,
      createdAt: "2026-10-01T00:00:00.000Z",
    });
  }

  const task = (project: Project, title: string, extra: Partial<Task> = {}): Task => ({
    id: `tsk_${randomUUID()}`,
    projectId: project.id,
    title,
    description: "",
    status: "todo",
    priority: "medium",
    assigneeId: null,
    dueDate: null,
    position: 0,
    createdBy: OWNER,
    createdAt: "2026-10-01T00:00:00.000Z",
    updatedAt: "2026-10-01T00:00:00.000Z",
    completedAt: null,
    ...extra,
  });

  async function seeded(rows: (project: Project) => Task[]) {
    const project = await scratchProject();
    for (const row of rows(project)) await container.tasks.create(row);
    return project;
  }

  const titles = async (project: Project, query: Partial<Parameters<Container["tasks"]["list"]>[0]> = {}) =>
    (await container.tasks.list({ projectIds: [project.id], ...query })).map((t) => t.title);

  it.skipIf(skip)("lists in board order: status column, then position", async () => {
    const project = await seeded((p) => [
      task(p, "done 0", { status: "done", position: 0 }),
      task(p, "todo 1", { position: 1 }),
      task(p, "review 0", { status: "in_review", position: 0 }),
      task(p, "todo 0", { position: 0 }),
    ]);
    expect(await titles(project)).toEqual(["todo 0", "todo 1", "review 0", "done 0"]);
  });

  it.skipIf(skip)("filters by status, priority and assignee, where null means unassigned", async () => {
    const project = await seeded((p) => [
      task(p, "a", { priority: "high", assigneeId: MEMBER, position: 0 }),
      task(p, "b", { status: "done", position: 0 }),
      task(p, "c", { position: 1 }),
    ]);
    expect(await titles(project, { status: "done" })).toEqual(["b"]);
    expect(await titles(project, { priority: "high" })).toEqual(["a"]);
    expect(await titles(project, { assigneeId: MEMBER })).toEqual(["a"]);
    expect(await titles(project, { assigneeId: null })).toEqual(["c", "b"]);
  });

  it.skipIf(skip)("searches titles case-insensitively as a substring", async () => {
    const project = await seeded((p) => [task(p, "Fix Login bug", { position: 0 }), task(p, "Write docs", { position: 1 })]);
    expect(await titles(project, { search: "login" })).toEqual(["Fix Login bug"]);
    expect(await titles(project, { search: "ITE D" })).toEqual(["Write docs"]);
  });

  it.skipIf(skip)("treats search characters literally", async () => {
    const project = await seeded((p) => [task(p, "100% done", { position: 0 }), task(p, "a_b", { position: 1 }), task(p, "axb", { position: 2 })]);
    expect(await titles(project, { search: "%" })).toEqual(["100% done"]);
    expect(await titles(project, { search: "a_b" })).toEqual(["a_b"]);
  });

  it.skipIf(skip)("bounds due dates inclusively and drops undated tasks when a bound is set", async () => {
    const project = await seeded((p) => [
      task(p, "early", { dueDate: "2026-10-10", position: 0 }),
      task(p, "mid", { dueDate: "2026-10-15", position: 1 }),
      task(p, "late", { dueDate: "2026-10-20", position: 2 }),
      task(p, "undated", { position: 3 }),
    ]);
    expect(await titles(project, { dueFrom: "2026-10-15" })).toEqual(["mid", "late"]);
    expect(await titles(project, { dueTo: "2026-10-15" })).toEqual(["early", "mid"]);
    expect(await titles(project, { dueFrom: "2026-10-10", dueTo: "2026-10-20" })).toEqual(["early", "mid", "late"]);
    expect(await titles(project)).toHaveLength(4);
  });

  it.skipIf(skip)("excludes done tasks on request", async () => {
    const project = await seeded((p) => [task(p, "open", { position: 0 }), task(p, "closed", { status: "done", position: 0 })]);
    expect(await titles(project, { excludeDone: true })).toEqual(["open"]);
  });

  it.skipIf(skip)("scopes to the requested projects", async () => {
    const [one, two] = [await seeded((p) => [task(p, "one")]), await seeded((p) => [task(p, "two")])];
    expect(await titles(one)).toEqual(["one"]);
    expect((await container.tasks.list({ projectIds: [one.id, two.id] })).map((t) => t.title).sort()).toEqual(["one", "two"]);
    expect(await container.tasks.list({ projectIds: [] })).toEqual([]);
  });

  it.skipIf(skip)("applies several patches at once", async () => {
    const project = await seeded((p) => [task(p, "a", { position: 0 }), task(p, "b", { position: 1 })]);
    const [a, b] = await container.tasks.list({ projectIds: [project.id] });
    await container.tasks.updateMany([
      { id: a.id, patch: { position: 1 } },
      { id: b.id, patch: { position: 0, title: "b2" } },
    ]);
    expect(await titles(project)).toEqual(["b2", "a"]);
  });

  it.skipIf(skip)("reports what delete and deleteByProject removed", async () => {
    const project = await seeded((p) => [task(p, "a", { position: 0 }), task(p, "b", { position: 1 })]);
    const [a] = await container.tasks.list({ projectIds: [project.id] });
    expect(await container.tasks.delete(a.id)).toBe(true);
    expect(await container.tasks.delete(a.id)).toBe(false);
    expect(await container.tasks.deleteByProject(project.id)).toBe(1);
  });
});
