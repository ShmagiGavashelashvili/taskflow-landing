import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NEXT_PARAM, safeNextPath } from "@/lib/auth/paths";
import { isDemoMode } from "@/server/config";
import { DEMO_ACCOUNT } from "@/server/seed";
import { AuthCard, FormSkeleton } from "../AuthCard";
import LoginForm from "./LoginForm";
import { pageTitle } from "@/lib/page-title";

export const metadata: Metadata = { title: pageTitle("Log in") };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard
      title="Welcome back"
      description="Log in to your TaskFlow workspace."
      footer={
        <>
          New to TaskFlow?{" "}
          <Link href="/register" className="font-semibold text-brand hover:text-brand-strong">
            Start a free trial
          </Link>
        </>
      }
    >
      <Suspense fallback={<FormSkeleton />}>
        <LoginFormWithParams searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function LoginFormWithParams({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;
  return <LoginForm next={safeNextPath(params[NEXT_PARAM])} demoAccount={isDemoMode() ? { ...DEMO_ACCOUNT } : null} />;
}
