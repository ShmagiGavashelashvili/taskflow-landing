import { faqs } from "@/data";
import FaqAccordion from "./FaqAccordion";
import Reveal from "./ui/Reveal";
import Section, { SectionHeading } from "./ui/Section";

export default function FAQ() {
  return (
    <Section id="faq" labelledBy="faq-title" className="bg-white/60">
      <SectionHeading
        id="faq-title"
        eyebrow="FAQ"
        title="Questions, answered"
        description="Can't find what you're looking for? Our team is happy to help."
      />
      <Reveal className="mx-auto max-w-3xl">
        <FaqAccordion items={faqs} />
      </Reveal>
    </Section>
  );
}
