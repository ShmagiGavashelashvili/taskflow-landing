"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/client";
import { describeFailure } from "@/lib/forms";
import { cn } from "@/lib/utils";

export interface ToggleItem<Id extends string> {
  id: Id;
  name: string;
  description: string;
  on: boolean;
}

interface FeatureToggleListProps<Id extends string> {
  /** "Integrations" or "Automations", used in the upgrade prompt and list label. */
  feature: string;
  items: ToggleItem<Id>[];
  /** Whether the effective plan includes the feature. */
  available: boolean;
  isOwner: boolean;
  /** Words for the on/off state, e.g. Connected / Not connected. */
  onLabel: string;
  offLabel: string;
  save: (id: Id, on: boolean) => Promise<unknown>;
}

/** A list of catalogue items with on/off switches, or an upgrade prompt when the plan lacks the feature. */
export default function FeatureToggleList<Id extends string>({
  feature,
  items: initialItems,
  available: initialAvailable,
  isOwner,
  onLabel,
  offLabel,
  save,
}: FeatureToggleListProps<Id>) {
  const [items, setItems] = useState(initialItems);
  const [available, setAvailable] = useState(initialAvailable);
  const [pending, setPending] = useState<Id | null>(null);

  async function toggle(item: ToggleItem<Id>) {
    const next = !item.on;
    setPending(item.id);
    setItems((current) => current.map((i) => (i.id === item.id ? { ...i, on: next } : i)));
    try {
      await save(item.id, next);
      toast.success(`${item.name} ${next ? onLabel.toLowerCase() : offLabel.toLowerCase()}`);
    } catch (error) {
      setItems((current) => current.map((i) => (i.id === item.id ? { ...i, on: item.on } : i)));
      if (error instanceof ApiError && error.code === "PLAN_LIMIT_REACHED") setAvailable(false);
      else toast.error(describeFailure(error).message ?? `Couldn't update ${item.name}.`);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-5">
      {!available && (
        <div className="flex flex-col gap-4 rounded-xl border border-brand/25 bg-tint p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden="true" />
            <p className="text-sm text-ink">
              {feature} are available on Pro and Business.{" "}
              <span className="text-muted-foreground">
                {isOwner ? "Upgrade to turn them on." : "Ask your workspace owner to upgrade."}
              </span>
            </p>
          </div>
          {isOwner && (
            <Button asChild className="shrink-0">
              <Link href="/app/settings/billing">Upgrade plan</Link>
            </Button>
          )}
        </div>
      )}
      <ul aria-label={feature} className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{item.name}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">{item.on ? onLabel : offLabel}</span>
              <button
                type="button"
                role="switch"
                aria-checked={item.on}
                aria-label={item.name}
                disabled={!available || pending === item.id}
                onClick={() => toggle(item)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
                  item.on ? "bg-brand" : "bg-line",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn("absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform", item.on && "translate-x-5")}
                />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
