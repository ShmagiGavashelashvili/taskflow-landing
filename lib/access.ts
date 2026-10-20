import { BILLING_PATH } from "@/lib/app-paths";
import type { Role } from "@/lib/schemas/entities";

/**
 * App pages only workspace owners may open. The nav hides them from members, the page shows a
 * notice, and the matching API (see `requireOwner` in server/domain/access.ts) answers 403.
 */
const OWNER_ONLY_PATHS: readonly string[] = [BILLING_PATH];

export const isOwner = (role: Role): boolean => role === "owner";

/** Whether `role` may open the app page at `path`. */
export const canOpen = (role: Role, path: string): boolean => isOwner(role) || !OWNER_ONLY_PATHS.includes(path);
