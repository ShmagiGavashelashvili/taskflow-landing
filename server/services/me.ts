import "server-only";
import type { z } from "zod";
import type { changePasswordRequestSchema, updateProfileRequestSchema } from "@/lib/schemas/auth";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { toPublicUser, type AppSession } from "@/server/auth/session";
import type { Container } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import type { User, UserRecord } from "@/server/domain/types";

/** The signed-in user's own account: profile and password. */
export function meService(container: Container) {
  async function load(session: AppSession): Promise<UserRecord> {
    const user = await container.users.findById(session.user.id);
    if (!user) throw new DomainError("UNAUTHENTICATED", "Please log in to continue.");
    return user;
  }

  return {
    async getProfile(session: AppSession): Promise<User> {
      return toPublicUser(await load(session));
    },

    async updateProfile(session: AppSession, patch: z.output<typeof updateProfileRequestSchema>): Promise<User> {
      const user = await container.users.update(session.user.id, { name: patch.name });
      if (!user) throw new DomainError("UNAUTHENTICATED", "Please log in to continue.");
      return toPublicUser(user);
    },

    async changePassword(session: AppSession, input: z.output<typeof changePasswordRequestSchema>): Promise<void> {
      const user = await load(session);
      if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
        throw new DomainError("VALIDATION_ERROR", "Your current password is incorrect.", {
          currentPassword: ["Your current password is incorrect."],
        });
      }
      await container.users.update(user.id, { passwordHash: await hashPassword(input.newPassword) });
    },
  };
}
