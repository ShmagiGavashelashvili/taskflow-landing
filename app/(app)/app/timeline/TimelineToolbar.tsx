"use client";

import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProjectRef } from "@/lib/schemas/dashboard";
import { addDays } from "@/lib/weeks";
import { TIMELINE_PATH } from "@/lib/app-paths";
import { FILTER_ALL } from "@/constants/ui";


/** The timeline URL for a week and project; the current week and "all projects" are left out. */
function timelineHref(week: string, thisWeek: string, projectId: string | null): string {
  const params = new URLSearchParams();
  if (week !== thisWeek) params.set("week", week);
  if (projectId) params.set("project", projectId);
  const query = params.toString();
  return query ? `${TIMELINE_PATH}?${query}` : TIMELINE_PATH;
}

interface TimelineToolbarProps {
  /** Every active project, for the filter. */
  projects: readonly ProjectRef[];
  projectId: string | null;
  /** Monday of the week shown (`YYYY-MM-DD`). */
  week: string;
  /** Monday of the current week. */
  thisWeek: string;
}

/** Week navigation and the project filter. Both live in the URL so the view can be shared. */
export default function TimelineToolbar({ projects, projectId, week, thisWeek }: TimelineToolbarProps) {
  const router = useRouter();
  const range = `${format(parseISO(week), "MMM d")} – ${format(parseISO(addDays(week, 6)), "MMM d, yyyy")}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="icon" className="bg-surface">
          <Link href={timelineHref(addDays(week, -7), thisWeek, projectId)} aria-label="Previous week">
            <ChevronLeft aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon" className="bg-surface">
          <Link href={timelineHref(addDays(week, 7), thisWeek, projectId)} aria-label="Next week">
            <ChevronRight aria-hidden="true" />
          </Link>
        </Button>
        <h2 className="ml-1 text-base font-bold text-ink">{range}</h2>
        {week !== thisWeek && (
          <Button asChild variant="ghost" size="sm">
            <Link href={timelineHref(thisWeek, thisWeek, projectId)}>This week</Link>
          </Button>
        )}
      </div>

      <Select
        value={projectId ?? FILTER_ALL}
        onValueChange={(value) => router.push(timelineHref(week, thisWeek, value === FILTER_ALL ? null : value))}
      >
        <SelectTrigger aria-label="Filter by project" className="w-48 bg-surface">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_ALL}>All projects</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
