import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ProductShowcase from "./ProductShowcase";

describe("ProductShowcase", () => {
  it("renders the section heading and the three tabs", () => {
    const { container } = render(<ProductShowcase />);
    expect(container.querySelector("section")).toHaveAttribute("id", "showcase");
    expect(screen.getByRole("heading", { level: 2, name: /One workspace, every way/ })).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(3);
  });

  it("starts on the real board mockup", () => {
    const { container } = render(<ProductShowcase />);
    expect(container.querySelector('[role="tabpanel"]')).toHaveTextContent("Website Relaunch");
    expect(container.querySelector('[role="tabpanel"]')).toHaveTextContent("In progress");
  });

  it("switches to the real timeline mockup", async () => {
    const user = userEvent.setup();
    const { container } = render(<ProductShowcase />);
    await user.click(screen.getByRole("tab", { name: "Timeline" }));
    await screen.findByText("Website Relaunch · Timeline", undefined, { timeout: 3000 });
    expect(container.querySelector('[role="tabpanel"]')).toHaveTextContent("Visual design");
  });

  it("switches to the real reports mockup", async () => {
    const user = userEvent.setup();
    render(<ProductShowcase />);
    await user.click(screen.getByRole("tab", { name: "Reports" }));
    await screen.findByText("Team performance · Last 6 weeks", undefined, { timeout: 3000 });
  });
});
