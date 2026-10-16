import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { planIdSchema } from "@/lib/schemas/entities";
import { AuthCard, FormSkeleton } from "../AuthCard";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = { title: "Start your free trial · TaskFlow" };

export default function RegisterPage({ searchParams }: PageProps<"/register">) {
  return (
    <AuthCard
      title="Start your free trial"
      description="Create your workspace in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand hover:text-brand-strong">
            Log in
          </Link>
        </>
      }
    >
      <Suspense fallback={<FormSkeleton fields={4} />}>
        <RegisterFormWithParams searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function RegisterFormWithParams({ searchParams }: Pick<PageProps<"/register">, "searchParams">) {
  const { email, plan } = await searchParams;
  const parsedPlan = planIdSchema.safeParse(plan);
  return (
    <RegisterForm initialEmail={typeof email === "string" ? email : ""} initialPlan={parsedPlan.success ? parsedPlan.data : null} />
  );
}
