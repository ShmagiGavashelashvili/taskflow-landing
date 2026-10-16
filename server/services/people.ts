import "server-only";
import type { Person } from "@/lib/schemas/comments";
import type { Container } from "@/server/container";
import type { UserRecord } from "@/server/domain/types";

/** The name shown for someone whose account no longer exists. */
const FORMER_MEMBER = "Former member";

/** Joins users onto records that point at them (memberships, comments, tasks). */
export async function loadPeople(container: Container, userIds: Iterable<string>) {
  const ids = [...new Set(userIds)];
  const users = new Map<string, UserRecord>((await container.users.findByIds(ids)).map((user) => [user.id, user]));

  return {
    /** The user with this id, if they still exist. */
    get: (userId: string): UserRecord | undefined => users.get(userId),
    /** Id and name, or "Former member" when the user is gone. */
    person: (userId: string): Person => ({ id: userId, name: users.get(userId)?.name ?? FORMER_MEMBER }),
  };
}

/** Each membership with its user, in membership order. Memberships whose user is gone are left out. */
export async function withUsers<M extends { userId: string }>(
  container: Container,
  memberships: M[],
): Promise<Array<M & { user: UserRecord }>> {
  const people = await loadPeople(container, memberships.map((membership) => membership.userId));
  return memberships.flatMap((membership) => {
    const user = people.get(membership.userId);
    return user ? [{ ...membership, user }] : [];
  });
}
