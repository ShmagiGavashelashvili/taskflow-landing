"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LocalTime from "@/components/ui/LocalTime";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateTask } from "@/hooks/useUpdateTask";
import { projectPath } from "@/lib/app-paths";
import { ApiError } from "@/lib/api/client";
import { tasksApi, taskQueries } from "@/lib/api/tasks";
import type { Person } from "@/lib/schemas/comments";
import { TASK_PRIORITIES, TASK_STATUSES, type TaskPriority, type TaskStatus } from "@/lib/schemas/entities";
import type { TaskDetail } from "@/lib/schemas/tasks";
import { isOverdue, PRIORITY_LABELS, STATUS_LABELS } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type { Assignee } from "../../types";
import CommentThread from "./CommentThread";
import { TASK_DESCRIPTION_MAX, TASK_TITLE_MAX, UNASSIGNED } from "@/lib/schemas/tasks";

interface TaskDetailViewProps {
  taskId: string;
  project: { id: string; name: string };
  members: readonly Assignee[];
  currentUser: Person;
  /** `YYYY-MM-DD` from the server clock, so overdue highlighting matches the board. */
  today: string;
}


/**
 * A task's own page: every field edits in place and saves optimistically, plus delete (with
 * confirmation), who created it and when it last changed, and the comment thread.
 */
export default function TaskDetailView({ taskId, project, members, currentUser, today }: TaskDetailViewProps) {
  const { data: task, error } = useQuery(taskQueries.detail(taskId));

  if (!task) {
    const gone = error instanceof ApiError && error.status === 404;
    return (
      <div role="alert" className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        <p className="font-semibold text-ink">{gone ? "This task was deleted." : "Couldn't load this task."}</p>
        <Link href={projectPath(project.id)} className={buttonVariants({ className: "mt-5" })}>
          Back to {project.name}
        </Link>
      </div>
    );
  }

  return (
    <article className="mx-auto grid max-w-5xl gap-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={projectPath(project.id)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> {project.name}
        </Link>
        <DeleteTaskButton task={task} projectId={project.id} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="grid content-start gap-6">
          <TaskFields task={task} />
          <CommentThread taskId={task.id} currentUser={currentUser} />
        </div>
        <TaskSidebar task={task} members={members} today={today} />
      </div>
    </article>
  );
}

/** Title and description, edited in place and saved when the field loses focus. */
function TaskFields({ task }: { task: TaskDetail }) {
  const update = useUpdateTask(task.id);

  return (
    <div className="grid gap-3">
      <InlineField
        label="Title"
        value={task.title}
        maxLength={TASK_TITLE_MAX}
        required
        onSave={(title) => update.mutate({ title })}
        render={(props) => (
          <input
            {...props}
            className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 -mx-2 text-2xl font-extrabold tracking-tight text-ink outline-none hover:border-line focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/20"
          />
        )}
      />
      <InlineField
        label="Description"
        value={task.description}
        maxLength={TASK_DESCRIPTION_MAX}
        onSave={(description) => update.mutate({ description })}
        render={(props) => (
          <textarea
            {...props}
            rows={5}
            placeholder="Add a description…"
            className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink shadow-xs outline-none focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/20"
          />
        )}
      />
    </div>
  );
}

interface InlineFieldProps {
  label: string;
  value: string;
  maxLength: number;
  required?: boolean;
  onSave: (value: string) => void;
  render: (props: {
    id: string;
    value: string;
    maxLength: number;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
    onChange: (event: { target: { value: string } }) => void;
    onBlur: () => void;
    onKeyDown: (event: { key: string; currentTarget: HTMLElement; preventDefault: () => void; shiftKey?: boolean }) => void;
  }) => ReactNode;
}

/**
 * A text field that saves on blur (or Enter in single-line fields) when its value changed.
 * While it isn't being edited, it follows the server value (e.g. after a refetch).
 */
function InlineField({ label, value, maxLength, required = false, onSave, render }: InlineFieldProps) {
  const id = `task-${label.toLowerCase()}`;
  const [draft, setDraft] = useState(value);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(value);
  if (!editing && value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  function commit() {
    setEditing(false);
    const next = required ? draft.trim() : draft;
    if (required && !next) {
      setError(`The ${label.toLowerCase()} can't be empty.`);
      setDraft(value);
      return;
    }
    setError(null);
    if (next !== value) onSave(next);
    setDraft(next);
  }

  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {render({
        id,
        value: draft,
        maxLength,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? `${id}-error` : undefined,
        onChange: (event) => {
          setEditing(true);
          setDraft(event.target.value);
        },
        onBlur: commit,
        onKeyDown: (event) => {
          if (event.key === "Escape") {
            setDraft(value);
            setEditing(false);
            setError(null);
          } else if (event.key === "Enter" && required) {
            event.preventDefault();
            (event.currentTarget as HTMLElement).blur();
          }
        },
      })}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Status, assignee, priority, due date and the created/updated metadata. */
function TaskSidebar({ task, members, today }: { task: TaskDetail; members: readonly Assignee[]; today: string }) {
  const update = useUpdateTask(task.id);
  const overdue = isOverdue(task, today);
  // Someone removed from the workspace can still be the creator; assignees are always members.
  const assignee = members.find((member) => member.id === task.assigneeId);

  return (
    <aside className="grid content-start gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <SidebarRow label="Status" htmlFor="task-status">
        <Select value={task.status} onValueChange={(status) => update.mutate({ status: status as TaskStatus })}>
          <SelectTrigger id="task-status" className="w-full bg-surface">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarRow>

      <SidebarRow label="Assignee" htmlFor="task-assignee">
        <Select
          value={assignee ? assignee.id : UNASSIGNED}
          onValueChange={(value) => update.mutate({ assigneeId: value === UNASSIGNED ? null : value })}
        >
          <SelectTrigger id="task-assignee" className="w-full bg-surface">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarRow>

      <SidebarRow label="Priority" htmlFor="task-priority">
        <Select value={task.priority} onValueChange={(priority) => update.mutate({ priority: priority as TaskPriority })}>
          <SelectTrigger id="task-priority" className="w-full bg-surface">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TASK_PRIORITIES.map((priority) => (
              <SelectItem key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SidebarRow>

      <SidebarRow label="Due date" htmlFor="task-due">
        <div className="flex items-center gap-2">
          <input
            id="task-due"
            type="date"
            value={task.dueDate ?? ""}
            aria-describedby={overdue ? "task-due-overdue" : undefined}
            onChange={(event) => update.mutate({ dueDate: event.target.value || null })}
            className={cn(
              "h-9 min-w-0 flex-1 rounded-md border border-line bg-surface px-3 text-sm shadow-xs outline-none focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/20",
              overdue ? "font-semibold text-destructive" : "text-ink",
            )}
          />
          {task.dueDate && (
            <button
              type="button"
              onClick={() => update.mutate({ dueDate: null })}
              className="text-xs font-semibold text-muted-foreground hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>
        {overdue && (
          <p id="task-due-overdue" className="mt-1 text-xs font-semibold text-destructive">
            Overdue
          </p>
        )}
      </SidebarRow>

      <dl className="grid gap-1.5 border-t border-line pt-4 text-xs text-muted-foreground">
        <div>
          <dt className="inline">Created by </dt>
          <dd className="inline font-semibold text-ink">{task.creator.name}</dd>
          <dd className="inline">
            {" "}
            on <LocalTime iso={task.createdAt} />
          </dd>
        </div>
        <div>
          <dt className="inline">Updated </dt>
          <dd className="inline">
            <LocalTime iso={task.updatedAt} />
          </dd>
        </div>
      </dl>
    </aside>
  );
}

function SidebarRow({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}

function DeleteTaskButton({ task, projectId }: { task: TaskDetail; projectId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function deleteTask() {
    setBusy(true);
    try {
      await tasksApi.delete(task.id);
      // Drop the detail first so the refetch below doesn't ask for a task that's gone.
      queryClient.removeQueries({ queryKey: taskQueries.detail(task.id).queryKey });
      void queryClient.invalidateQueries({ queryKey: taskQueries.all() });
      toast.success(`Deleted “${task.title}”`);
      router.push(projectPath(projectId));
    } catch (error) {
      toast.error(`Couldn't delete the task. ${error instanceof Error ? error.message : ""}`.trim());
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
        <Trash2 aria-hidden="true" /> Delete
      </Button>
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this task?</DialogTitle>
            <DialogDescription>
              “{task.title}” and its comments will be deleted. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteTask} disabled={busy}>
              {busy ? "Deleting…" : "Delete task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
