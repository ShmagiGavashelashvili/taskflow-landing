import { Quote } from "lucide-react";
import { stats, testimonials } from "@/data";
import Avatar from "./ui/Avatar";
import CountUp from "./ui/CountUp";
import Reveal from "./ui/Reveal";
import Section, { SectionHeading } from "./ui/Section";

export default function Testimonials() {
  return (
    <Section id="testimonials" labelledBy="testimonials-title">
      <SectionHeading
        id="testimonials-title"
        eyebrow="Loved by teams"
        title="Teams that switched don't look back"
      />
      <Reveal>
        <dl className="mx-auto mb-14 grid max-w-3xl grid-cols-1 gap-8 text-center sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.id} className="flex flex-col">
              <dt className="order-2 mt-1 text-sm font-semibold text-muted">{stat.label}</dt>
              <dd className="bg-gradient-to-r from-brand to-teal bg-clip-text text-5xl font-extrabold tracking-tight text-transparent tabular-nums">
                <CountUp value={stat.value} decimals={stat.decimals} suffix={stat.suffix} />
              </dd>
            </div>
          ))}
        </dl>
      </Reveal>
      <ul className="grid gap-6 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <li key={testimonial.id}>
            <Reveal delay={index * 0.08} className="h-full">
              <figure className="flex h-full flex-col rounded-2xl border border-line bg-white p-7 shadow-card">
                <Quote className="h-7 w-7 text-brand/30" aria-hidden="true" />
                <blockquote className="mt-4 flex-1 leading-relaxed text-ink">
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <Avatar initials={testimonial.initials} tone={testimonial.tone} size="xl" />
                  <div>
                    <p className="font-bold">{testimonial.name}</p>
                    <p className="text-sm text-muted">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
