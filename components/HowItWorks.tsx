import { steps } from "@/data";
import Reveal from "./ui/Reveal";
import Section, { SectionHeading } from "./ui/Section";

export default function HowItWorks() {
  return (
    <Section id="how-it-works" labelledBy="how-title" className="bg-white/60">
      <SectionHeading
        id="how-title"
        eyebrow="How it works"
        title="Up and running in three steps"
        description="No training, no migration headaches. Most teams are fully set up before their first coffee gets cold."
      />
      <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
        <div
          aria-hidden="true"
          className="absolute top-7 right-[16.66%] left-[16.66%] hidden h-0.5 bg-gradient-to-r from-brand/40 via-teal/40 to-brand/40 md:block"
        />
        <div
          aria-hidden="true"
          className="absolute top-7 bottom-7 left-7 w-0.5 bg-gradient-to-b from-brand/40 to-teal/40 md:hidden"
        />
        {steps.map(({ id, title, description, icon: Icon }, index) => (
          <li key={id} className="relative">
            <Reveal delay={index * 0.1} className="flex gap-5 md:flex-col md:items-center md:text-center">
              <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal text-xl font-extrabold text-white shadow-[0_10px_20px_-8px_rgb(27_77_219/0.7)] ring-8 ring-bg">
                <span className="sr-only">Step </span>
                {index + 1}
              </span>
              <div className="md:mt-6">
                <h3 className="flex items-center gap-2 text-xl font-bold md:justify-center">
                  <Icon className="h-5 w-5 text-teal" aria-hidden="true" />
                  {title}
                </h3>
                <p className="mt-2 leading-relaxed text-muted md:mx-auto md:max-w-xs">{description}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
