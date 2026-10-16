import "server-only";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import type { commentRequestSchema, CommentView } from "@/lib/schemas/comments";
import type { AppSession } from "@/server/auth/session";
import type { Container } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import type { Comment } from "@/server/domain/types";
import { loadPeople } from "./people";
import { taskService } from "./tasks";

type CommentInput = z.output<typeof commentRequestSchema>;

/** Comments on tasks in the signed-in user's workspace. Anyone can comment; only authors edit or delete. */
export function commentService(container: Container) {
  const tasks = taskService(container);

  async function withAuthors(comments: Comment[]): Promise<CommentView[]> {
    const people = await loadPeople(container, comments.map((comment) => comment.authorId));
    return comments.map((comment) => ({ ...comment, author: people.person(comment.authorId) }));
  }

  /** The comment, if its task is in the session's workspace and the session user wrote it. */
  async function loadOwn(session: AppSession, commentId: string, action: string): Promise<Comment> {
    const comment = await container.comments.findById(commentId);
    const task = comment && (await tasks.find(session, comment.taskId));
    if (!comment || !task) {
      throw new DomainError("NOT_FOUND", "That comment doesn't exist or was deleted.");
    }
    if (comment.authorId !== session.user.id) {
      throw new DomainError("FORBIDDEN", `Only the author can ${action} a comment.`);
    }
    return comment;
  }

  return {
    async list(session: AppSession, taskId: string): Promise<CommentView[]> {
      const task = await tasks.get(session, taskId);
      return withAuthors(await container.comments.listByTask(task.id));
    },

    async create(session: AppSession, taskId: string, input: CommentInput): Promise<CommentView> {
      const task = await tasks.get(session, taskId);
      const comment = await container.comments.create({
        id: `cmt_${randomUUID()}`,
        taskId: task.id,
        authorId: session.user.id,
        body: input.body,
        createdAt: container.clock.now().toISOString(),
        editedAt: null,
      });
      return (await withAuthors([comment]))[0];
    },

    async update(session: AppSession, commentId: string, input: CommentInput): Promise<CommentView> {
      const comment = await loadOwn(session, commentId, "edit");
      const updated = await container.comments.update(comment.id, {
        body: input.body,
        editedAt: container.clock.now().toISOString(),
      });
      if (!updated) throw new DomainError("NOT_FOUND", "That comment doesn't exist or was deleted.");
      return (await withAuthors([updated]))[0];
    },

    async delete(session: AppSession, commentId: string): Promise<void> {
      const comment = await loadOwn(session, commentId, "delete");
      await container.comments.delete(comment.id);
    },
  };
}
