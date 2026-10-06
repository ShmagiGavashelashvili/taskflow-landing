import BoardMockup from "./mockups/BoardMockup";
import Float from "./ui/Float";
import Reveal from "./ui/Reveal";
import { SignupField } from "./ui/Signup";

export default function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(27_77_219/0.16),transparent)]" />
        <div className="absolute top-20 -right-32 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(closest-side,rgb(15_168_156/0.16),transparent)]" />
      </div>

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold text-muted shadow-card">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              New: Automations 2.0 is here
            </p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1
              id="hero-title"
              className="text-4xl leading-[1.1] font-extrabold tracking-tight text-balance sm:text-6xl"
            >
              Your Team&rsquo;s Work,{" "}
              <span className="bg-gradient-to-r from-brand to-teal bg-clip-text text-transparent">
                Finally in One Place
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-pretty text-muted sm:text-xl">
              TaskFlow brings tasks, timelines and team chat together, so small teams ship faster without the
              tool sprawl.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <SignupField className="mx-auto mt-9 max-w-lg">
              <p className="mt-3 text-sm text-muted">No credit card required · 14-day free trial</p>
            </SignupField>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="relative mx-auto mt-14 max-w-5xl sm:mt-20">
          <div
            aria-hidden="true"
            className="absolute -inset-x-6 -top-6 -bottom-6 -z-10 rounded-[2rem] bg-gradient-to-b from-brand/10 to-teal/10 blur-2xl"
          />
          <Float>
            <BoardMockup />
          </Float>
        </Reveal>
      </div>
    </section>
  );
}
