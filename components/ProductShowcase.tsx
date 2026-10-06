import { showcaseTabs } from "@/data";
import BoardMockup from "./mockups/BoardMockup";
import ReportsMockup from "./mockups/ReportsMockup";
import TimelineMockup from "./mockups/TimelineMockup";
import ShowcaseTabs from "./ShowcaseTabs";
import Reveal from "./ui/Reveal";
import Section, { SectionHeading } from "./ui/Section";

export default function ProductShowcase() {
  return (
    <Section id="showcase" labelledBy="showcase-title">
      <SectionHeading
        id="showcase-title"
        eyebrow="Product"
        title="One workspace, every way to see your work"
        description="Switch between views without switching tools. It's all the same live data."
      />
      <Reveal>
        <ShowcaseTabs
          tabs={showcaseTabs}
          panels={{
            board: <BoardMockup />,
            timeline: <TimelineMockup />,
            reports: <ReportsMockup />,
          }}
        />
      </Reveal>
    </Section>
  );
}
