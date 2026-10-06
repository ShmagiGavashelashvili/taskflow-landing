import { plans } from "@/data";
import PricingPlans from "./PricingPlans";
import Reveal from "./ui/Reveal";
import Section, { SectionHeading } from "./ui/Section";

const YEARLY_SAVINGS = 20;

export default function Pricing() {
  return (
    <Section id="pricing" labelledBy="pricing-title" className="bg-white/60">
      <SectionHeading
        id="pricing-title"
        eyebrow="Pricing"
        title="Simple pricing that scales with your team"
        description="Start free, upgrade when you're ready. Every paid plan includes a 14-day trial."
      />
      <Reveal>
        <PricingPlans plans={plans} yearlySavings={YEARLY_SAVINGS} />
      </Reveal>
    </Section>
  );
}
