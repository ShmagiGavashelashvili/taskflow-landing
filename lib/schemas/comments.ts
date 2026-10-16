import { z } from "zod";
import { commentSchema, userSchema } from "./entities";

/** Request and response shapes for `/api/tasks/:id/comments` and `/api/comments/:id`. */

/** Who wrote a comment or created a task: enough to show a name and avatar. */
export const personSchema = userSchema.pick({ id: true, name: true });
export type Person = z.infer<typeof personSchema>;

/** A comment as the thread shows it: the comment plus its author. */
export const commentViewSchema = commentSchema.extend({ author: personSchema });
export type CommentView = z.infer<typeof commentViewSchema>;

const body = z.string().trim().min(1, "Write something first.").max(2000, "Keep it under 2000 characters.");

/** Create or edit a comment; only its author can edit or delete it. */
export const commentRequestSchema = z.object({ body });
export type CommentRequest = z.input<typeof commentRequestSchema>;
