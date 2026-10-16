import { z } from "zod";
import { billingPeriodSchema, invoiceSchema, planIdSchema } from "./entities";

/** Request and response shapes for `/api/billing/*` (owner only). */

export const planLimitsSchema = z.object({
  maxMembers: z.number().int().positive().nullable(),
  maxActiveProjects: z.number().int().positive().nullable(),
  features: z.object({ timeline: z.boolean(), reports: z.boolean(), integrations: z.boolean(), automations: z.boolean() }),
});

/** A plan as offered in the app. Prices come from the landing page's plan data. */
export const planOfferSchema = z.object({
  id: planIdSchema,
  name: z.string(),
  tagline: z.string(),
  /** Whole US dollars per member per month, billed monthly. */
  monthly: z.number().nonnegative(),
  /** Whole US dollars per member per month, billed yearly. */
  yearly: z.number().nonnegative(),
  limits: planLimitsSchema,
});
export type PlanOffer = z.infer<typeof planOfferSchema>;

export const subscriptionSchema = z.object({
  /** The stored plan (the trial plan during a trial). */
  plan: planIdSchema,
  /** The plan whose limits apply now: an expired trial reads as Free. */
  effectivePlan: planIdSchema,
  billingPeriod: billingPeriodSchema,
  trial: z.object({
    endsAt: z.iso.datetime().nullable(),
    /** Whole days left (rounded up); `null` without a trial, `0` once it has ended. */
    daysLeft: z.number().int().nonnegative().nullable(),
    expired: z.boolean(),
  }),
  limits: planLimitsSchema,
  usage: z.object({
    members: z.number().int().nonnegative(),
    pendingInvites: z.number().int().nonnegative(),
    activeProjects: z.number().int().nonnegative(),
  }),
});
export type Subscription = z.infer<typeof subscriptionSchema>;

export const billingResponseSchema = z.object({
  subscription: subscriptionSchema,
  plans: z.array(planOfferSchema),
});
export type BillingResponse = z.infer<typeof billingResponseSchema>;

/** The only card the mock checkout accepts. */
export const TEST_CARD_NUMBER = "4242 4242 4242 4242";

export const paymentSchema = z.object({
  cardNumber: z
    .string()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^\d{16}$/, "Enter the 16-digit card number.")),
  expiry: z.string().trim().regex(/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/, "Use MM/YY."),
  cvc: z.string().trim().regex(/^\d{3,4}$/, "Enter the 3 or 4 digit code."),
});
export type PaymentDetails = z.input<typeof paymentSchema>;

/** Paid plans need `payment` (mock checkout); switching to Free doesn't. */
export const changePlanRequestSchema = z.object({
  plan: planIdSchema,
  billingPeriod: billingPeriodSchema,
  payment: paymentSchema.optional(),
});
export type ChangePlanRequest = z.input<typeof changePlanRequestSchema>;

export const changePlanResponseSchema = z.object({
  subscription: subscriptionSchema,
  /** The mock charge for a paid plan; `null` when switching to Free. */
  invoice: invoiceSchema.nullable(),
});
export type ChangePlanResponse = z.infer<typeof changePlanResponseSchema>;

export const invoicesResponseSchema = z.object({ invoices: z.array(invoiceSchema) });
export type InvoicesResponse = z.infer<typeof invoicesResponseSchema>;
