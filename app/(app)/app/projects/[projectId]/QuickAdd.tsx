"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { tasksApi, taskQueries } from "@/lib/api/tasks";
import type { TaskStatus } from "@/lib/schemas/entities";
import { STATUS_LABELS } from "@/lib/tasks";

/** "Add task" at the foot of a column: type a title, Enter to add (and keep going), Escape to close. */
export default function QuickAdd({ projectId, status }: { projectId: string; status: TaskStatus }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const create = useMutation({
    mutationFn: (value: string) => tasksApi.create(projectId, { title: value, status }),
    onSuccess: () => {
      setTitle("");
      return queryClient.invalidateQueries({ queryKey: taskQueries.project(projectId) });
    },
    onError: (error) => toast.error(`Couldn't add the task. ${error.message}`),
    onSettled: () => inputRef.current?.focus(),
  });

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = title.trim();
    if (value && !create.isPending) create.mutate(value);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground hover:bg-surface hover:text-ink focus-visible:ring-[3px] focus-visible:ring-brand/20 focus-visible:outline-none"
      >
        <Plus className="size-4" aria-hidden="true" />
        Add task<span className="sr-only"> to {STATUS_LABELS[status]}</span>
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-2 grid gap-2">
      <input
        ref={inputRef}
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            setTitle("");
          }
        }}
        maxLength={200}
        placeholder="Task title"
        aria-label={`New task in ${STATUS_LABELS[status]}`}
        disabled={create.isPending}
        className="h-9 rounded-lg border border-line bg-surface px-3 text-sm text-ink outline-none focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/20"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!title.trim() || create.isPending}>
          {create.isPending ? "Adding…" : "Add"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
