import "server-only";
import { randomBytes, randomUUID } from "node:crypto";
import type { z } from "zod";
import type {
  forgotPasswordRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  resetPasswordRequestSchema,
} from "@/lib/schemas/auth";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { toPublicUser, type AppSession } from "@/server/auth/session";
import type { Container } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import type { Membership, UserRecord, Workspace } from "@/server/domain/types";

const DAY_MS = 24 * 60 * 60 * 1000;
export const TRIAL_DAYS = 14;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/** Hashed once, lazily, so logins for unknown emails take as long as wrong passwords. */
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= hashPassword("not-a-real-password"));

const invalidCredentials = () => new DomainError("INVALID_CREDENTIALS", "Invalid email or password.");
const invalidResetToken = () =>
  new DomainError("INVALID_TOKEN", "This reset link is invalid, expired or already used. Request a new one.");

/** Registration, login and password reset. Returns sessions; route handlers set the cookie. */
export function authService(container: Container) {
  const now = () => container.clock.now();

  async function sessionFor(user: UserRecord, membership: Membership): Promise<AppSession> {
    const workspace = await container.workspaces.findById(membership.workspaceId);
    if (!workspace) throw new DomainError("INTERNAL_ERROR", "The workspace for this account is missing.");
    return { user: toPublicUser(user), workspace, role: membership.role };
  }

  return {
    async register(input: z.output<typeof registerRequestSchema>): Promise<AppSession> {
      if (await container.users.findByEmail(input.email)) {
        throw new DomainError("EMAIL_TAKEN", "An account with this email already exists. Log in instead.", {
          email: ["An account with this email already exists."],
        });
      }
      const createdAt = now();
      const user = await container.users.create({
        id: `usr_${randomUUID()}`,
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        createdAt: createdAt.toISOString(),
      });
      const workspace: Workspace = await container.workspaces.create({
        id: `ws_${randomUUID()}`,
        name: input.workspaceName,
        plan: input.plan,
        billingPeriod: "monthly",
        trialEndsAt: input.plan === "free" ? null : new Date(createdAt.getTime() + TRIAL_DAYS * DAY_MS).toISOString(),
        createdAt: createdAt.toISOString(),
      });
      const membership = await container.memberships.create({ userId: user.id, workspaceId: workspace.id, role: "owner" });
      return { user: toPublicUser(user), workspace, role: membership.role };
    },

    async login({ email, password }: z.output<typeof loginRequestSchema>): Promise<AppSession> {
      const user = await container.users.findByEmail(email);
      if (!user) {
        await verifyPassword(password, await getDummyHash());
        throw invalidCredentials();
      }
      if (!(await verifyPassword(password, user.passwordHash))) throw invalidCredentials();
      // Each user has one workspace for now; the model allows several, so pick the first.
      const [membership] = await container.memberships.listByUser(user.id);
      if (!membership) throw invalidCredentials();
      return sessionFor(user, membership);
    },

    /** Creates a single-use reset token valid for an hour. Returns the reset page path, or null for unknown emails. */
    async forgotPassword({ email }: z.output<typeof forgotPasswordRequestSchema>): Promise<string | null> {
      const user = await container.users.findByEmail(email);
      if (!user) return null;
      const token = randomBytes(32).toString("base64url");
      await container.passwordResets.create({
        token,
        userId: user.id,
        expiresAt: new Date(now().getTime() + RESET_TOKEN_TTL_MS).toISOString(),
        usedAt: null,
      });
      return `/reset-password?token=${token}`;
    },

    async resetPassword({ token, password }: z.output<typeof resetPasswordRequestSchema>): Promise<void> {
      const reset = await container.passwordResets.findByToken(token);
      if (!reset || reset.usedAt || new Date(reset.expiresAt) <= now()) throw invalidResetToken();
      const user = await container.users.update(reset.userId, { passwordHash: await hashPassword(password) });
      if (!user) throw invalidResetToken();
      await container.passwordResets.update(token, { usedAt: now().toISOString() });
    },
  };
}
