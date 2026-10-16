import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getContainer } from "@/server/container";
import { DomainError } from "@/server/domain/errors";
import { inviteService } from "@/server/services/invites";
import { AuthCard, FormSkeleton } from "../../AuthCard";
import AcceptInviteForm from "./AcceptInviteForm";

export const metadata: Metadata = { title: "Join a workspace · TaskFlow", robots: { index: false } };

/** Public invite acceptance. Not behind proxy.ts, so it works logged in or out. */
export default function InvitePage({ params }: PageProps<"/invite/[token]">) {
  return (
    <Suspense
      fallback={
        <AuthCard title="Join your team">
          <FormSkeleton fields={2} />
        </AuthCard>
      }
    >
      <Invite params={params} />
    </Suspense>
  );
}

async function Invite({ params }: Pick<PageProps<"/invite/[token]">, "params">) {
  const { token } = await params;
  // Params alone still allow a prerender with them filled in; expiry checks read the clock.
  await connection();
  let preview;
  try {
    preview = await inviteService(getContainer()).preview(token);
  } catch (error) {
    if (!(error instanceof DomainError) || error.code !== "INVALID_TOKEN") throw error;
    return (
      <AuthCard
        title="This invite can't be used"
        description={error.message}
        footer={
          <>
            Already a member?{" "}
            <Link href="/login" className="font-semibold text-brand hover:text-brand-strong">
              Log in
            </Link>
          </>
        }
      >
        <Link href="/" className="text-sm font-semibold text-brand hover:text-brand-strong">
          Go to the TaskFlow homepage
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={`Join ${preview.workspaceName}`}
      description={`${preview.invitedByName} invited ${preview.email} to collaborate on TaskFlow.`}
    >
      <AcceptInviteForm token={token} email={preview.email} workspaceName={preview.workspaceName} accountExists={preview.accountExists} />
    </AuthCard>
  );
}
