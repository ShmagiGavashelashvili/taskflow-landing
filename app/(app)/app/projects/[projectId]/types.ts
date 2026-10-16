import type { User } from "@/lib/schemas/entities";

/** A workspace member as the project views need them: assignee names, avatars and filters. */
export type Member = Pick<User, "id" | "name">;
