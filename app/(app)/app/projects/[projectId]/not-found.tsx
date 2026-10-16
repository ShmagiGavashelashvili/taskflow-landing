import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PROJECTS_PATH } from "@/lib/app-paths";

export default function ProjectNotFound() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
      <h1 className="text-lg font-bold text-ink">Project not found</h1>
      <p className="mt-1.5 text-muted-foreground">It may have been deleted, or it belongs to another workspace.</p>
      <Link href={PROJECTS_PATH} className={buttonVariants({ className: "mt-5" })}>
        All projects
      </Link>
    </div>
  );
}
