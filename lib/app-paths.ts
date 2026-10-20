/** URLs of app pages, so links to projects and tasks are built in one place. */

export const PROJECTS_PATH = "/app/projects";

export function projectPath(projectId: string): string {
  return `${PROJECTS_PATH}/${projectId}`;
}

/** The shareable task detail URL (the board and list cards link here). */
export function taskPath(task: { id: string; projectId: string }): string {
  return `${projectPath(task.projectId)}/tasks/${task.id}`;
}

export const TIMELINE_PATH = "/app/timeline";
export const SETTINGS_PATH = "/app/settings";
export const BILLING_PATH = `${SETTINGS_PATH}/billing`;
export const PROFILE_PATH = `${SETTINGS_PATH}/profile`;
export const WORKSPACE_PATH = `${SETTINGS_PATH}/workspace`;
export const MEMBERS_PATH = `${SETTINGS_PATH}/members`;
export const INTEGRATIONS_PATH = `${SETTINGS_PATH}/integrations`;
export const AUTOMATIONS_PATH = `${SETTINGS_PATH}/automations`;
