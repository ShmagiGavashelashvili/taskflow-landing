"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { commentQueries, commentsApi } from "@/lib/api/comments";
import { taskQueries } from "@/lib/api/tasks";
import type { CommentView, Person } from "@/lib/schemas/comments";

/** Id prefix of comments shown before the server has saved them. */
const OPTIMISTIC_PREFIX = "optimistic-";

export const isOptimisticComment = (comment: Pick<CommentView, "id">) => comment.id.startsWith(OPTIMISTIC_PREFIX);

/**
 * Comment writes on one task's thread. Each is optimistic: the thread changes at once, rolls
 * back with a toast if the server refuses, and every task query (thread, detail, board counts)
 * refetches afterwards.
 */
export function useCommentMutations(taskId: string, currentUser: Person) {
  const queryClient = useQueryClient();
  const { queryKey } = commentQueries.thread(taskId);

  async function optimistically(update: (comments: CommentView[]) => CommentView[]) {
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, (comments = []) => update(comments));
    return { previous };
  }

  const rollback = (context: { previous?: CommentView[] } | undefined) => queryClient.setQueryData(queryKey, context?.previous);
  const refetch = () => queryClient.invalidateQueries({ queryKey: taskQueries.all() });

  const add = useMutation({
    mutationFn: (body: string) => commentsApi.create(taskId, { body }),
    onMutate: (body) => {
      const comment: CommentView = {
        id: `${OPTIMISTIC_PREFIX}${crypto.randomUUID()}`,
        taskId,
        authorId: currentUser.id,
        author: currentUser,
        body: body.trim(),
        createdAt: new Date().toISOString(),
        editedAt: null,
      };
      return optimistically((comments) => [...comments, comment]).then((context) => ({ ...context, id: comment.id }));
    },
    onSuccess: (saved, _body, context) =>
      queryClient.setQueryData(queryKey, (comments = []) => comments.map((c) => (c.id === context.id ? saved : c))),
    onError: (error, _body, context) => {
      rollback(context);
      toast.error(`Couldn't post your comment. ${error.message}`);
    },
    onSettled: refetch,
  });

  const edit = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => commentsApi.update(id, { body }),
    onMutate: ({ id, body }) =>
      optimistically((comments) =>
        comments.map((c) => (c.id === id ? { ...c, body: body.trim(), editedAt: new Date().toISOString() } : c)),
      ),
    onError: (error, _vars, context) => {
      rollback(context);
      toast.error(`Couldn't save your edit. ${error.message}`);
    },
    onSettled: refetch,
  });

  const remove = useMutation({
    mutationFn: (id: string) => commentsApi.delete(id),
    onMutate: (id) => optimistically((comments) => comments.filter((c) => c.id !== id)),
    onError: (error, _id, context) => {
      rollback(context);
      toast.error(`Couldn't delete your comment. ${error.message}`);
    },
    onSettled: refetch,
  });

  return { add, edit, remove };
}
