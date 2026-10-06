import { features } from "@/data";
import Reveal from "./ui/Reveal";
import Section, { SectionHeading } from "./ui/Section";

export default function Features() {
  return (
    <Section id="features" labelledBy="features-title">
      <SectionHeading
        id="features-title"
        eyebrow="Features"
        title="Everything your team needs, nothing it doesn't"
        description="Six tools that work together out of the box, so you can stop juggling tabs and start shipping."
      />
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ id, title, description, icon: Icon }, index) => (
          <li key={id}>
            <Reveal delay={(index % 3) * 0.07} className="h-full">
              <div className="group h-full rounded-2xl border border-line bg-white p-6 shadow-card transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-float motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-teal text-white shadow-[0_8px_16px_-6px_rgb(27_77_219/0.6)]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{description}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
