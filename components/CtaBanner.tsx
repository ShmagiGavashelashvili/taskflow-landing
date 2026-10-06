import { ArrowRight } from "lucide-react";
import { buttonClass } from "@/lib/ui";
import Reveal from "./ui/Reveal";
import { SignupLink } from "./ui/Signup";

export default function CtaBanner() {
  return (
    <section aria-labelledby="cta-title" className="px-5 py-20 sm:px-8 sm:py-28">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand via-[#1740b8] to-teal px-6 py-16 text-center text-white shadow-float sm:px-12 sm:py-20">
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-white/10 blur-2xl"
          />
          <h2 id="cta-title" className="relative text-3xl font-extrabold tracking-tight text-balance sm:text-5xl">
            Ready to get your team in flow?
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/85">
            Join 2,000+ teams already shipping faster with TaskFlow. Free for 14 days, no card needed.
          </p>
          <div className="relative mt-9">
            <SignupLink className={buttonClass("light", "lg")}>
              Start Free Trial
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </SignupLink>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
