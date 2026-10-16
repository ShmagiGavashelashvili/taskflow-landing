import "server-only";
import type { User } from "@/lib/schemas/entities";

export type * from "@/lib/schemas/entities";

/** A user as stored: the public shape plus the password hash, which never leaves the server. */
export interface UserRecord extends User {
  passwordHash: string;
}

export interface PasswordReset {
  token: string;
  userId: string;
  expiresAt: string;
  usedAt: string | null;
}
