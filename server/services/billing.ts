import "server-only";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { PLAN_OFFERS, periodTotal, planOffer } from "@/lib/billing";
import { effectivePlan, isTrialExpired, memberSlotsUsed, PLAN_LIMITS, type WorkspaceUsage } from "@/lib/plans";
import {
  TEST_CARD_NUMBER,
  type BillingResponse,
  type ChangePlanResponse,
  type changePlanRequestSchema,
  type Subscription,
} from "@/lib/schemas/billing";
import { trialDaysLeft } from "@/lib/trial";
import type { AppSession } from "@/server/auth/session";
import type { Container } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import { workspaceCapacity } from "@/server/domain/capacity";
import type { BillingPeriod, Invoice, PlanId, Workspace } from "@/server/domain/types";
import { requireOwner } from "@/server/domain/access";

type ChangePlanInput = z.output<typeof changePlanRequestSchema>;

const MONTH_LABEL = { month: "short", year: "numeric", timeZone: "UTC" } as const;

/** "Oct 2026" for a month, "Oct 2026 – Sep 2027" for a year starting at `from`. */
function periodLabel(from: Date, period: BillingPeriod): string {
  const start = from.toLocaleString("en-US", MONTH_LABEL);
  if (period === "monthly") return start;
  const end = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 11, 1));
  return `${start} – ${end.toLocaleString("en-US", MONTH_LABEL)}`;
}

/** Why `usage` doesn't fit `target`'s limits, or `null` when it does. */
function overLimitReason(target: PlanId, usage: WorkspaceUsage): string | null {
  const { maxMembers, maxActiveProjects } = PLAN_LIMITS[target];
  const name = planOffer(target).name;
  const problems: string[] = [];
  const people = memberSlotsUsed(usage);
  if (maxMembers !== null && people > maxMembers) {
    const detail = usage.pendingInvites > 0 ? `${people} members including pending invites` : `${people} members`;
    problems.push(`you have ${detail} and ${name} allows ${maxMembers}`);
  }
  if (maxActiveProjects !== null && usage.activeProjects > maxActiveProjects) {
    problems.push(`you have ${usage.activeProjects} active projects and ${name} allows ${maxActiveProjects}`);
  }
  if (problems.length === 0) return null;
  return `You can't switch to ${name} yet: ${problems.join(", and ")}. Remove members or revoke invites, or archive projects, then try again. Nothing is deleted for you.`;
}

/** The mock payment processor: only the test card goes through. */
function chargeCard(payment: ChangePlanInput["payment"]): void {
  if (!payment) {
    throw new DomainError("VALIDATION_ERROR", "Enter payment details to switch to a paid plan.", {
      payment: ["Payment details are required for paid plans."],
    });
  }
  if (payment.cardNumber !== TEST_CARD_NUMBER.replace(/\s/g, "")) {
    throw new DomainError("VALIDATION_ERROR", "Your card was declined.", {
      "payment.cardNumber": [`Card declined. This demo only accepts the test card ${TEST_CARD_NUMBER}.`],
    });
  }
}

/** Mock billing for the signed-in owner's workspace: subscription, plan changes, invoices. */
export function billingService(container: Container) {
  async function subscription(workspace: Workspace): Promise<Subscription> {
    const now = container.clock.now();
    const capacity = workspaceCapacity(container, workspace);
    return {
      plan: workspace.plan,
      effectivePlan: effectivePlan(workspace, now),
      billingPeriod: workspace.billingPeriod,
      trial: {
        endsAt: workspace.trialEndsAt,
        daysLeft: trialDaysLeft(workspace.trialEndsAt, now),
        expired: isTrialExpired(workspace, now),
      },
      limits: capacity.limits,
      usage: await capacity.usage(),
    };
  }

  return {
    async get(session: AppSession): Promise<BillingResponse> {
      requireOwner(session, "manage billing");
      return { subscription: await subscription(session.workspace), plans: PLAN_OFFERS };
    },

    /**
     * Switches plan and period. A paid plan charges the test card for one period and ends any
     * trial; Free needs no payment. Moving to a plan whose limits the workspace exceeds is
     * refused with CONFLICT, so nothing is ever deleted.
     */
    async changePlan(session: AppSession, request: ChangePlanInput): Promise<ChangePlanResponse> {
      requireOwner(session, "manage billing");
      const { workspace } = session;
      const now = container.clock.now();
      const { plan, billingPeriod } = request;

      const unchanged =
        workspace.trialEndsAt === null &&
        workspace.plan === plan &&
        (plan === "free" || workspace.billingPeriod === billingPeriod);
      if (unchanged) {
        const label = plan === "free" ? planOffer(plan).name : `${planOffer(plan).name} (${billingPeriod})`;
        throw new DomainError("CONFLICT", `You're already on ${label}.`);
      }

      const current = await workspaceCapacity(container, workspace).usage();
      const reason = overLimitReason(plan, current);
      if (reason) throw new DomainError("CONFLICT", reason);

      const amount = periodTotal(plan, billingPeriod, current.members);
      if (amount > 0) chargeCard(request.payment);

      const updated = await container.workspaces.update(workspace.id, { plan, billingPeriod, trialEndsAt: null });
      if (!updated) throw new DomainError("UNAUTHENTICATED", "Please log in to continue.");

      const invoice =
        amount > 0
          ? await container.invoices.create({
              id: `inv_${randomUUID()}`,
              workspaceId: workspace.id,
              amount,
              period: periodLabel(now, billingPeriod),
              status: "paid",
              issuedAt: now.toISOString(),
            })
          : null;
      return { subscription: await subscription(updated), invoice };
    },

    async invoices(session: AppSession): Promise<Invoice[]> {
      requireOwner(session, "manage billing");
      return container.invoices.listByWorkspace(session.workspace.id);
    },
  };
}
