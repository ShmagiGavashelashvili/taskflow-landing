import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { faqs } from "@/data";
import FaqAccordion from "./FaqAccordion";

const renderFaq = () => render(<FaqAccordion items={faqs} />);
const question = (text: string) => screen.getByRole("button", { name: text });

describe("FaqAccordion", () => {
  it("renders a button per question, all collapsed initially", () => {
    renderFaq();
    expect(screen.getAllByRole("button")).toHaveLength(faqs.length);
    for (const button of screen.getAllByRole("button")) expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("wires each button to its region", () => {
    renderFaq();
    for (const faq of faqs) {
      const button = question(faq.question);
      const panel = document.getElementById(button.getAttribute("aria-controls") as string) as HTMLElement;
      expect(panel).toHaveAttribute("role", "region");
      expect(panel).toHaveAttribute("aria-labelledby", button.id);
      expect(panel).toHaveTextContent(faq.answer);
    }
  });

  it("hides collapsed answers visually", () => {
    renderFaq();
    const panel = document.getElementById(question(faqs[0].question).getAttribute("aria-controls") as string)!;
    expect(panel.firstElementChild).toHaveClass("invisible");
    expect(panel).toHaveClass("grid-rows-[0fr]");
  });

  it("opens an item when its question is clicked", async () => {
    const user = userEvent.setup();
    renderFaq();
    await user.click(question(faqs[0].question));
    expect(question(faqs[0].question)).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById(question(faqs[0].question).getAttribute("aria-controls") as string)!;
    expect(panel).toHaveClass("grid-rows-[1fr]");
    expect(panel.firstElementChild).toHaveClass("visible");
  });

  it("keeps only one item open at a time", async () => {
    const user = userEvent.setup();
    renderFaq();
    await user.click(question(faqs[0].question));
    await user.click(question(faqs[2].question));
    expect(question(faqs[0].question)).toHaveAttribute("aria-expanded", "false");
    expect(question(faqs[2].question)).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("button").filter((b) => b.getAttribute("aria-expanded") === "true")).toHaveLength(1);
  });

  it("closes the open item when it is clicked again", async () => {
    const user = userEvent.setup();
    renderFaq();
    await user.click(question(faqs[1].question));
    await user.click(question(faqs[1].question));
    expect(question(faqs[1].question)).toHaveAttribute("aria-expanded", "false");
  });

  it("toggles with the keyboard", async () => {
    const user = userEvent.setup();
    renderFaq();
    question(faqs[0].question).focus();
    await user.keyboard("{Enter}");
    expect(question(faqs[0].question)).toHaveAttribute("aria-expanded", "true");
    await user.keyboard(" ");
    expect(question(faqs[0].question)).toHaveAttribute("aria-expanded", "false");
  });

  it("renders an empty list without crashing", () => {
    render(<FaqAccordion items={[]} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
