import type { Metadata } from "next";
import { Suspense } from "react";
import { getAppSession } from "@/server/auth/app-session";
import { getContainer } from "@/server/container";
import { inviteService } from "@/server/services/invites";
import { workspaceService } from "@/server/services/workspace";
import MembersPanel from "./MembersPanel";

export const metadata: Metadata = { title: "Members · Settings · TaskFlow" };

export default function MembersPage() {
  return (
    <Suspense fallback={<div className="h-72 rounded-2xl bg-tint" aria-hidden="true" />}>
      <Members />
    </Suspense>
  );
}

async function Members() {
  const session = await getAppSession();
  const container = getContainer();
  const isOwner = session.role === "owner";
  const [{ members, memberLimit }, invites] = await Promise.all([
    workspaceService(container).listMembers(session),
    isOwner ? inviteService(container).list(session) : Promise.resolve([]),
  ]);
  return (
    <MembersPanel isOwner={isOwner} currentUserId={session.user.id} members={members} invites={invites} memberLimit={memberLimit} />
  );
}
