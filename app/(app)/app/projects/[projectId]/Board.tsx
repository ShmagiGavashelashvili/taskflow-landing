"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDndContext,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type Over,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useMoveTask } from "@/hooks/useMoveTask";
import { taskQueries } from "@/lib/api/tasks";
import { TASK_STATUSES, type TaskStatus } from "@/lib/schemas/entities";
import type { BoardTask, MoveTaskRequest, TaskFilters } from "@/lib/schemas/tasks";
import { STATUS_LABELS } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import QuickAdd from "./QuickAdd";
import TaskCard from "./TaskCard";
import { TasksLoadError } from "./TaskMeta";
import type { Member } from "./types";

interface BoardProps {
  projectId: string;
  filters: TaskFilters;
  members: readonly Member[];
  /** `YYYY-MM-DD`, for overdue highlighting. */
  today: string;
}

type DropData = { type: "column"; status: TaskStatus } | { type: "task"; status: TaskStatus; position: number };

const columnId = (status: TaskStatus) => `column:${status}`;

/**
 * The Kanban board: four columns of sortable cards. Cards move by pointer or keyboard (focus a
 * card's handle, Space to pick up, arrows to move, Space to drop, Escape to cancel), with
 * screen-reader announcements. Moves are optimistic (see useMoveTask).
 */
export default function Board({ projectId, filters, members, today }: BoardProps) {
  const { data: tasks = [], isError, isPlaceholderData, refetch } = useQuery({ ...taskQueries.list(projectId, filters), placeholderData: keepPreviousData });
  const move = useMoveTask();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columns = useMemo(() => {
    const byStatus = Object.fromEntries(TASK_STATUSES.map((status) => [status, [] as BoardTask[]])) as Record<TaskStatus, BoardTask[]>;
    for (const task of tasks) byStatus[task.status].push(task);
    return byStatus;
  }, [tasks]);
  const membersById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members]);

  const announcements = useMemo(() => createAnnouncements(tasks), [tasks]);

  if (isError && tasks.length === 0 && !isPlaceholderData) return <TasksLoadError onRetry={() => void refetch()} />;

  const activeTask = activeId ? tasks.find((task) => task.id === activeId) : undefined;

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const task = tasks.find((t) => t.id === active.id);
    const to = task && over && dropTarget(tasks, task, over);
    if (!task || !to) return;
    move.mutate({ task, to });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "To move this task, press Space or Enter. Use the arrow keys to move between positions and columns, Space or Enter to drop, or Escape to cancel.",
        },
      }}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={onDragEnd}
    >
      <div className="grid auto-cols-[minmax(16rem,1fr)] grid-flow-col gap-4 overflow-x-auto pb-4">
        {TASK_STATUSES.map((status) => (
          <Column key={status} projectId={projectId} status={status} tasks={columns[status]}>
            {columns[status].map((task, index) => (
              <SortableCard
                key={task.id}
                task={task}
                index={index}
                assignee={task.assigneeId ? membersById.get(task.assigneeId) : undefined}
                today={today}
              />
            ))}
          </Column>
        ))}
      </div>
      <DragOverlay>
        {activeTask && (
          <div data-card-status={activeTask.status} data-card-index={columns[activeTask.status].indexOf(activeTask)}>
            <TaskCard
              task={activeTask}
              assignee={activeTask.assigneeId ? membersById.get(activeTask.assigneeId) : undefined}
              today={today}
              overlay
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  projectId,
  status,
  tasks,
  children,
}: {
  projectId: string;
  status: TaskStatus;
  tasks: BoardTask[];
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: columnId(status), data: { type: "column", status } satisfies DropData });
  const { over, active } = useDndContext();
  const highlighted = Boolean(active && (over?.data.current as DropData | undefined)?.status === status);
  const headingId = `board-column-${status}`;

  return (
    <section
      ref={setNodeRef}
      data-board-column={status}
      aria-labelledby={headingId}
      className={cn(
        "flex min-h-40 flex-col rounded-2xl border border-transparent bg-tint/50 p-2 transition-colors",
        highlighted && "border-brand/30 bg-tint",
      )}
    >
      <header className="flex items-center justify-between px-2 pt-1 pb-2.5">
        <h2 id={headingId} className="text-sm font-bold text-ink">
          {STATUS_LABELS[status]}
        </h2>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {tasks.length}
          <span className="sr-only"> {tasks.length === 1 ? "task" : "tasks"}</span>
        </span>
      </header>
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <ul className="grid gap-2">{children}</ul>
      </SortableContext>
      <QuickAdd projectId={projectId} status={status} />
    </section>
  );
}

function SortableCard({
  task,
  index,
  assignee,
  today,
}: {
  task: BoardTask;
  index: number;
  assignee: Member | undefined;
  today: string;
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", status: task.status, position: task.position } satisfies DropData,
  });

  return (
    <li
      ref={setNodeRef}
      data-card-status={task.status}
      data-card-index={index}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      // The whole card drags with a pointer; only the handle starts a keyboard drag.
      {...listeners}
    >
      <TaskCard
        task={task}
        assignee={assignee}
        today={today}
        dragging={isDragging}
        handle={{ ...attributes, ref: setActivatorNodeRef }}
      />
    </li>
  );
}

/**
 * Where a drop lands, in server terms. Over a card: take its position (in its own column that
 * reorders like `arrayMove`; in another column it goes above the card). Over a column: last.
 * `null` when nothing would change.
 */
function dropTarget(tasks: readonly BoardTask[], task: BoardTask, over: Over): MoveTaskRequest | null {
  const data = over.data.current as DropData | undefined;
  if (!data || over.id === task.id) return null;
  let position: number;
  if (data.type === "task") {
    position = data.position;
  } else {
    const others = tasks.filter((t) => t.status === data.status && t.id !== task.id);
    position = others.length === 0 ? 0 : Math.max(...others.map((t) => t.position)) + 1;
  }
  if (data.status === task.status && position === task.position) return null;
  return { status: data.status, position };
}

function createAnnouncements(tasks: readonly BoardTask[]): Announcements {
  const title = (id: UniqueIdentifier) => tasks.find((task) => task.id === id)?.title ?? "Task";
  const place = (over: Over | null) => {
    const data = over?.data.current as DropData | undefined;
    if (!data) return null;
    const count = tasks.filter((task) => task.status === data.status).length;
    return data.type === "task"
      ? `${STATUS_LABELS[data.status]}, position ${data.position + 1} of ${count}`
      : `the end of ${STATUS_LABELS[data.status]}`;
  };

  return {
    onDragStart: ({ active }) => {
      const task = tasks.find((t) => t.id === active.id);
      return task ? `Picked up “${task.title}” in ${STATUS_LABELS[task.status]}.` : undefined;
    },
    onDragOver: ({ active, over }) => {
      const where = place(over);
      return where ? `“${title(active.id)}” is over ${where}.` : `“${title(active.id)}” is no longer over a column.`;
    },
    onDragEnd: ({ active, over }) => {
      const data = over?.data.current as DropData | undefined;
      return data
        ? `“${title(active.id)}” was dropped into ${STATUS_LABELS[data.status]}.`
        : `“${title(active.id)}” was dropped back where it was.`;
    },
    onDragCancel: ({ active }) => `Moving “${title(active.id)}” was cancelled. It's back where it was.`,
  };
}
