"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import Avatar from "@/components/ui/Avatar";
import { Button } from "@/components/ui/button";
import LocalTime from "@/components/ui/LocalTime";
import { isOptimisticComment, useCommentMutations } from "@/hooks/useComments";
import { commentQueries } from "@/lib/api/comments";
import type { CommentView, Person } from "@/lib/schemas/comments";
import { avatarToneOf, initialsOf } from "@/lib/people";
import { COMMENT_MAX_LENGTH } from "@/lib/schemas/comments";

interface CommentThreadProps {
  taskId: string;
  /** The signed-in user: the author of new comments, and the only one who can edit theirs. */
  currentUser: Person;
}

const FIELD_CLASSES =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink shadow-xs outline-none focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/20";

/** A task's comments, oldest first, with a box to add one. Authors can edit and delete their own. */
export default function CommentThread({ taskId, currentUser }: CommentThreadProps) {
  const { data: comments = [], isError, refetch } = useQuery(commentQueries.thread(taskId));
  const { add, edit, remove } = useCommentMutations(taskId, currentUser);
  const [draft, setDraft] = useState("");

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    // Give the text back if it didn't post, unless the user has started another comment.
    add.mutate(body, { onError: () => setDraft((current) => current || body) });
  }

  return (
    <section aria-labelledby="comments-heading" className="grid gap-4">
      <h2 id="comments-heading" className="text-base font-bold text-ink">
        Comments {comments.length > 0 && <span className="font-normal text-muted-foreground">({comments.length})</span>}
      </h2>

      {isError && comments.length === 0 ? (
        <p role="alert" className="text-sm text-muted-foreground">
          Couldn&apos;t load comments.{" "}
          <button type="button" onClick={() => refetch()} className="font-semibold text-brand hover:underline">
            Try again
          </button>
        </p>
      ) : (
        <ol aria-label="Comments" className="grid gap-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              own={comment.authorId === currentUser.id}
              onEdit={(body) => edit.mutate({ id: comment.id, body })}
              onDelete={() => remove.mutate(comment.id)}
            />
          ))}
        </ol>
      )}
      {comments.length === 0 && !isError && <p className="text-sm text-muted-foreground">No comments yet.</p>}

      <form onSubmit={submit} className="grid gap-2">
        <label htmlFor="new-comment" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="new-comment"
          value={draft}
          rows={3}
          maxLength={COMMENT_MAX_LENGTH}
          placeholder="Write a comment…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => submitOnModEnter(event, submit)}
          className={FIELD_CLASSES}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Press ⌘/Ctrl + Enter to send.</p>
          <Button type="submit" size="sm">
            Comment
          </Button>
        </div>
      </form>
    </section>
  );
}

interface CommentItemProps {
  comment: CommentView;
  own: boolean;
  onEdit: (body: string) => void;
  onDelete: () => void;
}

function CommentItem({ comment, own, onEdit, onDelete }: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const pending = isOptimisticComment(comment);

  function save(event?: FormEvent) {
    event?.preventDefault();
    const body = draft.trim();
    if (!body) return;
    if (body !== comment.body) onEdit(body);
    setEditing(false);
  }

  return (
    <li className="flex gap-3" aria-busy={pending || undefined}>
      <Avatar initials={initialsOf(comment.author.name)} tone={avatarToneOf(comment.author.id)} size="lg" className="ring-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-semibold text-ink">{comment.author.name}</span>
          <LocalTime iso={comment.createdAt} className="text-xs text-muted-foreground" />
          {comment.editedAt && <span className="text-xs text-muted-foreground">(edited)</span>}
          {pending && <span className="text-xs text-muted-foreground">Sending…</span>}
        </div>

        {editing ? (
          <form onSubmit={save} className="mt-1.5 grid gap-2">
            <label htmlFor={`edit-${comment.id}`} className="sr-only">
              Edit comment
            </label>
            <textarea
              id={`edit-${comment.id}`}
              value={draft}
              rows={3}
              maxLength={COMMENT_MAX_LENGTH}
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setEditing(false);
                submitOnModEnter(event, save);
              }}
              className={FIELD_CLASSES}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={!draft.trim()}>
                Save
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <p className="mt-0.5 text-[15px] break-words whitespace-pre-wrap text-ink">{comment.body}</p>
        )}

        {own && !pending && !editing && (
          <div className="mt-1 flex items-center gap-3 text-xs">
            {confirmingDelete ? (
              <>
                <span className="text-muted-foreground">Delete this comment?</span>
                <button type="button" onClick={onDelete} className="font-semibold text-destructive hover:underline">
                  Delete
                </button>
                <button type="button" onClick={() => setConfirmingDelete(false)} className="font-semibold text-muted-foreground hover:underline">
                  Keep
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Edit comment"
                  onClick={() => {
                    setDraft(comment.body);
                    setEditing(true);
                  }}
                  className="font-semibold text-muted-foreground hover:text-ink"
                >
                  Edit
                </button>
                <button
                  type="button"
                  aria-label="Delete comment"
                  onClick={() => setConfirmingDelete(true)}
                  className="font-semibold text-muted-foreground hover:text-destructive"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function submitOnModEnter(event: KeyboardEvent<HTMLTextAreaElement>, submit: () => void) {
  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    submit();
  }
}
