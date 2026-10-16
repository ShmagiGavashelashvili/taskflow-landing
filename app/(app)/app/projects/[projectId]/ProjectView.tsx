"use client";

import { useState } from "react";
import type { Project } from "@/lib/schemas/entities";
import type { TaskFilters } from "@/lib/schemas/tasks";
import Board from "./Board";
import ProjectHeader from "./ProjectHeader";
import TaskList from "./TaskList";
import TaskToolbar, { type ProjectViewMode } from "./TaskToolbar";
import type { Assignee } from "./types";

interface ProjectViewProps {
  project: Project;
  members: Assignee[];
  canDelete: boolean;
  /** Today (`YYYY-MM-DD`, server clock) for overdue highlighting, so server and client agree. */
  today: string;
}

/** A project's page: header, toolbar and the board or list. Task data comes from the seeded query cache. */
export default function ProjectView({ project, members, canDelete, today }: ProjectViewProps) {
  const [view, setView] = useState<ProjectViewMode>("board");
  const [filters, setFilters] = useState<TaskFilters>({});
  const props = { projectId: project.id, filters, members, today };

  return (
    <div className="grid gap-6">
      <ProjectHeader project={project} canDelete={canDelete} />
      <TaskToolbar view={view} onViewChange={setView} filters={filters} onFiltersChange={setFilters} members={members} />
      {view === "board" ? <Board {...props} /> : <TaskList {...props} />}
    </div>
  );
}
