"use client";

import { AlarmClock, KanbanSquare, List, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TASK_PRIORITIES } from "@/lib/schemas/entities";
import { UNASSIGNED, type TaskFilters } from "@/lib/schemas/tasks";
import { PRIORITY_LABELS } from "@/lib/tasks";
import { cn } from "@/lib/utils";
import type { Assignee } from "./types";
import { FILTER_ALL, SEARCH_DELAY_MS } from "@/constants/ui";

export type ProjectViewMode = "board" | "list";

interface TaskToolbarProps {
  view: ProjectViewMode;
  onViewChange: (view: ProjectViewMode) => void;
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  members: readonly Assignee[];
}


/** Board/list toggle, filters (assignee, priority, overdue) and title search. */
export default function TaskToolbar({ view, onViewChange, filters, onFiltersChange, members }: TaskToolbarProps) {
  const [search, setSearch] = useState(filters.search ?? "");

  // Search as the user types, without a request per keystroke.
  useEffect(() => {
    if (search === (filters.search ?? "")) return;
    const timer = setTimeout(() => onFiltersChange({ ...filters, search }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search, filters, onFiltersChange]);

  const filtering = Boolean(filters.assigneeId || filters.priority || filters.overdue || filters.search);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Tabs value={view} onValueChange={(value) => onViewChange(value as ProjectViewMode)}>
        <TabsList aria-label="View">
          <TabsTrigger value="board">
            <KanbanSquare aria-hidden="true" /> Board
          </TabsTrigger>
          <TabsTrigger value="list">
            <List aria-hidden="true" /> List
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tasks"
          aria-label="Search tasks by title"
          maxLength={100}
          className="h-9 w-52 rounded-md border border-line bg-surface pr-3 pl-8 text-sm text-ink shadow-xs outline-none focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/20"
        />
      </div>

      <Select
        value={filters.assigneeId ?? FILTER_ALL}
        onValueChange={(value) => onFiltersChange({ ...filters, assigneeId: value === FILTER_ALL ? undefined : value })}
      >
        <SelectTrigger aria-label="Filter by assignee" className="bg-surface">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_ALL}>Anyone</SelectItem>
          <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.priority ?? FILTER_ALL}
        onValueChange={(value) =>
          onFiltersChange({ ...filters, priority: value === FILTER_ALL ? undefined : (value as TaskFilters["priority"]) })
        }
      >
        <SelectTrigger aria-label="Filter by priority" className="bg-surface">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_ALL}>Any priority</SelectItem>
          {TASK_PRIORITIES.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {PRIORITY_LABELS[priority]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        aria-pressed={Boolean(filters.overdue)}
        onClick={() => onFiltersChange({ ...filters, overdue: !filters.overdue || undefined })}
        className={cn("bg-surface", filters.overdue && "border-destructive/40 bg-destructive/5 text-destructive hover:text-destructive")}
      >
        <AlarmClock aria-hidden="true" /> Overdue
      </Button>

      {filtering && (
        <Button
          variant="ghost"
          onClick={() => {
            setSearch("");
            onFiltersChange({});
          }}
        >
          <X aria-hidden="true" /> Clear filters
        </Button>
      )}
    </div>
  );
}
