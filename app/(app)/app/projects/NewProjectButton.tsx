"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ProjectDialog from "./ProjectDialog";

/** Opens the new-project dialog. `compact` is the sidebar's small text button. */
export default function NewProjectButton({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors",
            "hover:bg-tint/60 hover:text-ink focus-visible:ring-[3px] focus-visible:ring-brand/20 focus-visible:outline-none",
          )}
        >
          <Plus className="size-4" aria-hidden="true" /> New project
        </button>
      ) : (
        <Button onClick={() => setOpen(true)}>
          <Plus aria-hidden="true" /> New project
        </Button>
      )}
      <ProjectDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
