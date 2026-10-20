import { z } from "zod";

/** `GET /api/meta`: public facts about the running environment. */
export const metaResponseSchema = z.object({
  /** Drives the "data may reset" badge and the login credential hint. */
  demoMode: z.boolean(),
  dataSource: z.enum(["memory", "postgres"]),
  /** Credentials of the seeded demo owner; only in demo mode. */
  demoAccount: z.object({ email: z.email(), password: z.string() }).nullable(),
});
export type MetaResponse = z.infer<typeof metaResponseSchema>;
