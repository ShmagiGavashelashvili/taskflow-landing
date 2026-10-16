import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "../AuthCard";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset your password · TaskFlow" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we'll send you a link to set a new one."
      footer={
        <Link href="/login" className="font-semibold text-brand hover:text-brand-strong">
          Back to log in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
