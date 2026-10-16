import Link from "next/link";
import Logo from "@/components/ui/Logo";

/** Centered card layout for login, register, forgot and reset password. Static; no session reads. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg px-4 py-10">
      <Link href="/" className="mx-auto rounded-lg" aria-label="TaskFlow home">
        <Logo />
      </Link>
      <main className="mx-auto mt-10 w-full max-w-md flex-1">{children}</main>
    </div>
  );
}
