import "server-only";
import { MAX_TIMELINE_DAYS, type TimelineQuery, type TimelineResponse } from "@/lib/schemas/timeline";
import { isoDate } from "@/lib/tasks";
import { addDays, daysBetween, weekStart } from "@/lib/weeks";
import type { AppSession } from "@/server/auth/session";
import type { Container } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import { requireFeature } from "@/server/domain/plan-guards";
import { projectService } from "./projects";

function invalidRange(message: string): DomainError {
  return new DomainError("VALIDATION_ERROR", "Please check the highlighted fields.", { to: [message] });
}

/** Tasks with due dates in a date range, grouped by project in the UI. Pro and Business only. */
export function timelineService(container: Container) {
  return {
    async list(session: AppSession, query: TimelineQuery = {}): Promise<TimelineResponse> {
      const now = container.clock.now();
      requireFeature(session.workspace, now, "timeline");

      const from = query.from ?? weekStart(isoDate(now));
      const to = query.to ?? addDays(from, 6);
      if (to < from) throw invalidRange("The end date must be on or after the start date.");
      if (daysBetween(from, to) + 1 > MAX_TIMELINE_DAYS) throw invalidRange(`Pick a range of ${MAX_TIMELINE_DAYS} days or less.`);

      const projects = query.projectId
        ? [await projectService(container).get(session, query.projectId)]
        : await container.projects.list({ workspaceId: session.workspace.id, archived: false });
      const order = new Map(projects.map((project, index) => [project.id, index]));
      const tasks = await container.tasks.list({ projectIds: [...order.keys()], dueFrom: from, dueTo: to });

      return {
        from,
        to,
        projects: projects.map(({ id, name, color }) => ({ id, name, color })),
        // Stable sort, so tasks on the same day in the same project keep board order.
        tasks: tasks.sort(
          (a, b) => a.dueDate!.localeCompare(b.dueDate!) || order.get(a.projectId)! - order.get(b.projectId)!,
        ),
      };
    },
  };
}
