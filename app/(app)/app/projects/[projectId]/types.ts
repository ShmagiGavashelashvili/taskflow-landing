import type { Person } from "@/lib/schemas/comments";

/**
 * Someone a task can be assigned to, as the project views need them: names, avatars and
 * filters. What `taskService.assignees` returns. Not the members-settings `Member` (which has a role).
 */
export type Assignee = Person;
