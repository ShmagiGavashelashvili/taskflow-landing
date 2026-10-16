import "server-only";
import type { AutomationId, IntegrationId } from "./types";

export interface IntegrationDefinition {
  id: IntegrationId;
  name: string;
  description: string;
}

export interface AutomationDefinition {
  id: AutomationId;
  name: string;
  /** Plain-language rule, e.g. "When a task moves to Done, notify the assignee". */
  description: string;
}

/** Integrations offered in the app. Connecting one only records state; nothing is called. */
export const INTEGRATIONS: Record<IntegrationId, IntegrationDefinition> = {
  slack: { id: "slack", name: "Slack", description: "Post task updates to a Slack channel." },
  github: { id: "github", name: "GitHub", description: "Link pull requests and issues to tasks." },
  gitlab: { id: "gitlab", name: "GitLab", description: "Link merge requests to tasks." },
  "google-drive": { id: "google-drive", name: "Google Drive", description: "Attach Drive files to tasks." },
  figma: { id: "figma", name: "Figma", description: "Embed Figma frames in task descriptions." },
  zapier: { id: "zapier", name: "Zapier", description: "Connect TaskFlow to 5,000+ apps." },
};

/** Preset automation rules. Enabling one only records state; nothing runs. */
export const AUTOMATIONS: Record<AutomationId, AutomationDefinition> = {
  "notify-assignee-on-done": {
    id: "notify-assignee-on-done",
    name: "Notify on completion",
    description: "When a task moves to Done, notify the assignee.",
  },
  "assign-creator-on-create": {
    id: "assign-creator-on-create",
    name: "Auto-assign new tasks",
    description: "When a task is created without an assignee, assign it to its creator.",
  },
  "move-to-review-on-comment": {
    id: "move-to-review-on-comment",
    name: "Review on comment",
    description: "When someone comments on a task in progress, move it to In review.",
  },
  "flag-overdue-as-urgent": {
    id: "flag-overdue-as-urgent",
    name: "Escalate overdue tasks",
    description: "When a task becomes overdue, set its priority to Urgent.",
  },
};
