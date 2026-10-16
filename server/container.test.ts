import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { verifyPassword } from "@/server/auth/password";
import { createMemoryContainer } from "@/server/container";
import { setupTestContainer } from "@/tests/api";
import { DEMO_ACCOUNT, SEED_IDS } from "./seed";

// Pinned to a Wednesday so "this week" is unambiguous.
const NOW = new Date("2026-10-14T10:00:00.000Z");
const TODAY = "2026-10-14";
const container = setupTestContainer({ now: NOW });

describe("container", () => {
  it("gives each test a fresh seed (part 1: change the data)", async () => {
    await container.current.workspaces.update(SEED_IDS.workspace, { name: "Renamed" });
    expect((await container.current.workspaces.findById(SEED_IDS.workspace))?.name).toBe("Renamed");
  });

  it("gives each test a fresh seed (part 2: the change is gone)", async () => {
    expect((await container.current.workspaces.findById(SEED_IDS.workspace))?.name).toBe("Acme Studio");
  });

  it("returns copies, so callers can't change stored data by accident", async () => {
    const user = await container.current.users.findById(SEED_IDS.users.demo);
    user!.name = "Mutated";
    expect((await container.current.users.findById(SEED_IDS.users.demo))?.name).toBe("Alex Morgan");
  });

  it("survives a restart when persisting to a file (dev mode)", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "taskflow-"));
    const persistPath = path.join(dir, ".data", "db.json");
    try {
      const first = createMemoryContainer({ persistPath });
      await first.workspaces.update(SEED_IDS.workspace, { name: "Saved" });

      const restarted = createMemoryContainer({ persistPath });
      expect((await restarted.workspaces.findById(SEED_IDS.workspace))?.name).toBe("Saved");

      fs.writeFileSync(persistPath, "{ corrupt");
      const recovered = createMemoryContainer({ persistPath });
      expect((await recovered.workspaces.findById(SEED_IDS.workspace))?.name).toBe("Acme Studio");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("pins the clock when asked", () => {
    expect(container.current.clock.now().toISOString()).toBe(NOW.toISOString());
  });
});

describe("seed", () => {
  it("has Acme Studio on a paid Pro plan", async () => {
    expect(await container.current.workspaces.findById(SEED_IDS.workspace)).toMatchObject({
      name: "Acme Studio",
      plan: "pro",
      trialEndsAt: null,
    });
  });

  it("has five members with the demo account as the only owner", async () => {
    const members = await container.current.memberships.listByWorkspace(SEED_IDS.workspace);
    expect(members).toHaveLength(5);
    expect(members.filter((m) => m.role === "owner").map((m) => m.userId)).toEqual([SEED_IDS.users.demo]);

    const demo = await container.current.users.findByEmail("DEMO@taskflow.app");
    expect(demo?.id).toBe(SEED_IDS.users.demo);
    expect(await verifyPassword(DEMO_ACCOUNT.password, demo!.passwordHash)).toBe(true);
    expect(await verifyPassword("wrong-password", demo!.passwordHash)).toBe(false);
  });

  it("has the three projects", async () => {
    const projects = await container.current.projects.list({ workspaceId: SEED_IDS.workspace });
    expect(projects.map((p) => p.name)).toEqual(["Website Relaunch", "Mobile App v2", "Q4 Marketing"]);
  });

  it("has about forty tasks spread across statuses, priorities and due dates", async () => {
    const tasks = await container.current.tasks.list({ projectIds: Object.values(SEED_IDS.projects) });
    expect(tasks.length).toBeGreaterThanOrEqual(35);
    expect(tasks.length).toBeLessThanOrEqual(45);
    expect(new Set(tasks.map((t) => t.status))).toEqual(new Set(["todo", "in_progress", "in_review", "done"]));
    expect(new Set(tasks.map((t) => t.priority))).toEqual(new Set(["low", "medium", "high", "urgent"]));

    const open = tasks.filter((t) => t.status !== "done");
    expect(open.some((t) => t.dueDate !== null && t.dueDate < TODAY)).toBe(true);
    expect(open.some((t) => t.dueDate !== null && t.dueDate >= TODAY && t.dueDate <= "2026-10-18")).toBe(true);
    expect(open.some((t) => t.dueDate !== null && t.dueDate > "2026-10-25")).toBe(true);
    expect(tasks.some((t) => t.assigneeId === null)).toBe(true);
    expect(tasks.some((t) => t.assigneeId === SEED_IDS.users.demo && t.status !== "done")).toBe(true);
  });

  it("keeps positions contiguous within each column and stamps completedAt only on done tasks", async () => {
    const tasks = await container.current.tasks.list({ projectIds: Object.values(SEED_IDS.projects) });
    for (const projectId of Object.values(SEED_IDS.projects)) {
      for (const status of ["todo", "in_progress", "in_review", "done"]) {
        const column = tasks.filter((t) => t.projectId === projectId && t.status === status);
        expect(column.map((t) => t.position)).toEqual(column.map((_, index) => index));
      }
    }
    expect(tasks.every((t) => (t.status === "done") === (t.completedAt !== null))).toBe(true);
    // Some work was completed this week (since Monday 2026-10-12).
    expect(tasks.some((t) => t.completedAt !== null && t.completedAt >= "2026-10-12")).toBe(true);
  });

  it("has comments on some tasks", async () => {
    const tasks = await container.current.tasks.list({ projectIds: Object.values(SEED_IDS.projects) });
    const counts = await container.current.comments.countByTasks(tasks.map((t) => t.id));
    expect(Object.values(counts).reduce((sum, n) => sum + n, 0)).toBeGreaterThanOrEqual(10);
  });

  it("has two invoices, newest first", async () => {
    const invoices = await container.current.invoices.listByWorkspace(SEED_IDS.workspace);
    expect(invoices.map((i) => i.period)).toEqual(["Sep 2026", "Aug 2026"]);
  });

  it("has a couple of integrations connected and one automation enabled", async () => {
    const integrations = await container.current.integrations.listByWorkspace(SEED_IDS.workspace);
    expect(integrations.filter((i) => i.connected).map((i) => i.integrationId)).toEqual(["slack", "github"]);
    const automations = await container.current.automations.listByWorkspace(SEED_IDS.workspace);
    expect(automations.filter((a) => a.enabled)).toHaveLength(1);
  });
});
