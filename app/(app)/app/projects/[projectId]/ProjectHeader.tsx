"use client";

import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BAR_TONE_CLASSES } from "@/constants/tones";
import { BILLING_PATH, PROJECTS_PATH } from "@/lib/app-paths";
import { ApiError } from "@/lib/api/client";
import { projectsApi } from "@/lib/api/projects";
import type { Project } from "@/lib/schemas/entities";
import { cn } from "@/lib/utils";
import ProjectDialog from "../ProjectDialog";

interface ProjectHeaderProps {
  project: Project;
  canDelete: boolean;
}

/** Project name, description and actions: edit, archive or unarchive, and delete (owners). */
export default function ProjectHeader({ project, canDelete }: ProjectHeaderProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function setArchived(archived: boolean) {
    setBusy(true);
    try {
      await projectsApi.update(project.id, { archived });
      toast.success(archived ? `Archived ${project.name}` : `Restored ${project.name}`);
      router.refresh();
    } catch (error) {
      const upgrade = error instanceof ApiError && error.code === "PLAN_LIMIT_REACHED";
      toast.error(error instanceof Error ? error.message : "Something went wrong.", {
        action: upgrade ? { label: "See plans", onClick: () => router.push(BILLING_PATH) } : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  async function deleteProject() {
    setBusy(true);
    try {
      await projectsApi.delete(project.id);
      toast.success(`Deleted ${project.name}`);
      router.push(PROJECTS_PATH);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className={cn("size-3 shrink-0 rounded-full", BAR_TONE_CLASSES[project.color])} />
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-ink">{project.name}</h1>
          {project.archived && (
            <span className="rounded-full bg-tint px-2 py-0.5 text-xs font-semibold text-muted-foreground">Archived</span>
          )}
        </div>
        {project.description && <p className="mt-1 max-w-2xl text-muted-foreground">{project.description}</p>}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Project actions" disabled={busy}>
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <Pencil aria-hidden="true" /> Edit project
          </DropdownMenuItem>
          {project.archived ? (
            <DropdownMenuItem onSelect={() => setArchived(false)}>
              <ArchiveRestore aria-hidden="true" /> Unarchive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setArchived(true)}>
              <Archive aria-hidden="true" /> Archive
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmingDelete(true)}>
                <Trash2 aria-hidden="true" /> Delete project
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectDialog project={project} open={editing} onOpenChange={setEditing} />

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {project.name}?</DialogTitle>
            <DialogDescription>
              This deletes the project with all its tasks and comments. It can&apos;t be undone. Archive it instead to
              keep its history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteProject} disabled={busy}>
              {busy ? "Deleting…" : "Delete project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
