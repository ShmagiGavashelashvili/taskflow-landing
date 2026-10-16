import "server-only";
import { TASK_STATUSES, type TaskStatus } from "@/lib/schemas/entities";
import type { DashboardReportsResponse, DashboardResponse } from "@/lib/schemas/dashboard";
import { isoDate, isOverdue } from "@/lib/tasks";
import { weekStart } from "@/lib/weeks";
import type { AppSession } from "@/server/auth/session";
import type { Container } from "@/server/container";
import { requireFeature } from "@/server/domain/plan-guards";
import type { Task } from "@/server/domain/types";
import { toProjectRef } from "./projects";
import { taskService } from "./tasks";

/** Soonest due first; tasks without a due date go last. */
function byDueDate(a: Task, b: Task): number {
  if (a.dueDate === b.dueDate) return 0;
  if (a.dueDate === null) return 1;
  if (b.dueDate === null) return -1;
  return a.dueDate < b.dueDate ? -1 : 1;
}

/** Aggregates over the tasks in the workspace's active projects. */
export function dashboardService(container: Container) {
  async function activeProjects(session: AppSession) {
    const projects = await container.projects.list({ workspaceId: session.workspace.id, archived: false });
    const tasks = await container.tasks.list({ projectIds: projects.map((project) => project.id) });
    return { projects, tasks };
  }

  return {
    async overview(session: AppSession): Promise<DashboardResponse> {
      const { projects, tasks } = await activeProjects(session);
      const now = container.clock.now();
      const today = isoDate(now);
      const weekStartedAt = `${weekStart(today)}T00:00:00.000Z`;

      const byStatus = Object.fromEntries(TASK_STATUSES.map((status) => [status, 0])) as Record<TaskStatus, number>;
      for (const task of tasks) byStatus[task.status] += 1;
      const open = tasks.filter((task) => task.status !== "done");

      return {
        stats: {
          open: open.length,
          completedThisWeek: tasks.filter((task) => task.completedAt !== null && task.completedAt >= weekStartedAt).length,
          overdue: open.filter((task) => isOverdue(task, today)).length,
          byStatus,
        },
        myTasks: open.filter((task) => task.assigneeId === session.user.id).sort(byDueDate),
        projects: projects.map(toProjectRef),
      };
    },

    /** Workload per member and progress per project. Pro and Business only. */
    async reports(session: AppSession): Promise<DashboardReportsResponse> {
      const now = container.clock.now();
      requireFeature(session.workspace, now, "reports");
      const today = isoDate(now);
      const [{ projects, tasks }, members] = await Promise.all([
        activeProjects(session),
        taskService(container).assignees(session),
      ]);

      const open = tasks.filter((task) => task.status !== "done");
      const workloadOf = (assigneeId: string | null) => {
        const assigned = open.filter((task) => task.assigneeId === assigneeId);
        return { open: assigned.length, overdue: assigned.filter((task) => isOverdue(task, today)).length };
      };

      return {
        workload: [
          ...members.map((member) => ({ member, ...workloadOf(member.id) })),
          { member: null, ...workloadOf(null) },
        ],
        projects: projects.map((project) => {
          const own = tasks.filter((task) => task.projectId === project.id);
          const done = own.filter((task) => task.status === "done").length;
          return {
            project: toProjectRef(project),
            total: own.length,
            done,
            percent: own.length === 0 ? 0 : Math.round((done / own.length) * 100),
          };
        }),
      };
    },
  };
}
