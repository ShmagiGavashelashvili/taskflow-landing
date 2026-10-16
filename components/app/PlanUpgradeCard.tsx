import { Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BILLING_PATH } from "@/lib/app-paths";

interface PlanUpgradeCardProps {
  title: string;
  /** Usually the server's `PLAN_LIMIT_REACHED` message. */
  message: string;
}

/** Stands in for a feature the workspace's plan doesn't include (timeline, reports). */
export default function PlanUpgradeCard({ title, message }: PlanUpgradeCardProps) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-2xl border border-brand/25 bg-tint px-6 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-surface text-brand shadow-xs">
        <Sparkles className="size-5" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-bold text-ink">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <Button asChild className="mt-1">
        <Link href={BILLING_PATH}>Upgrade plan</Link>
      </Button>
    </section>
  );
}
