"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BILLING_PATH } from "@/lib/app-paths";
import { ApiError } from "@/lib/api/client";
import { projectsApi } from "@/lib/api/projects";

export default function UnarchiveButton({ projectId, name }: { projectId: string; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function unarchive() {
    setBusy(true);
    try {
      await projectsApi.update(projectId, { archived: false });
      toast.success(`Restored ${name}`);
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

  return (
    <Button variant="outline" size="sm" onClick={unarchive} disabled={busy} aria-label={`Unarchive ${name}`}>
      {busy ? "Restoring…" : "Unarchive"}
    </Button>
  );
}
