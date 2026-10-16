/** URLs of app pages, so links to projects and tasks are built in one place. */

export const PROJECTS_PATH = "/app/projects";

export function projectPath(projectId: string): string {
  return `${PROJECTS_PATH}/${projectId}`;
}

/** The shareable task detail URL (the board and list cards link here). */
export function taskPath(task: { id: string; projectId: string }): string {
  return `${projectPath(task.projectId)}/tasks/${task.id}`;
}

export const BILLING_PATH = "/app/settings/billing";
