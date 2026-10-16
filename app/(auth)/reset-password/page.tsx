import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, FormSkeleton } from "../AuthCard";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = { title: "Set a new password · TaskFlow" };

export default function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  return (
    <AuthCard title="Set a new password" description="Choose a new password for your account.">
      <Suspense fallback={<FormSkeleton fields={1} />}>
        <ResetPasswordFormWithToken searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function ResetPasswordFormWithToken({ searchParams }: Pick<PageProps<"/reset-password">, "searchParams">) {
  const { token } = await searchParams;
  return <ResetPasswordForm token={typeof token === "string" ? token : ""} />;
}
