import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { steps } from "@/data";
import HowItWorks from "./HowItWorks";

describe("HowItWorks", () => {
  it("renders under the how-it-works anchor with a heading", () => {
    const { container } = render(<HowItWorks />);
    expect(container.querySelector("section")).toHaveAttribute("id", "how-it-works");
    expect(screen.getByRole("heading", { level: 2, name: "Up and running in three steps" })).toBeInTheDocument();
  });

  it("renders three numbered steps in order", () => {
    render(<HowItWorks />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(screen.getByRole("list").tagName).toBe("OL");
    steps.forEach((step, i) => {
      expect(items[i]).toHaveTextContent(`Step ${i + 1}`);
      expect(items[i]).toHaveTextContent(step.title);
      expect(items[i]).toHaveTextContent(step.description);
    });
  });

  it("follows Create a project → Invite your team → Track progress", () => {
    render(<HowItWorks />);
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Create a project",
      "Invite your team",
      "Track progress",
    ]);
  });

  it("draws the connecting line as decorative elements", () => {
    const { container } = render(<HowItWorks />);
    const lines = container.querySelectorAll("ol > div[aria-hidden='true']");
    expect(lines).toHaveLength(2);
  });
});
