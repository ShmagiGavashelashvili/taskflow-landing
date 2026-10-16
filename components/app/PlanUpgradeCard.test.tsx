import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PlanUpgradeCard from "./PlanUpgradeCard";

describe("PlanUpgradeCard", () => {
  it("explains the locked feature and links to billing", () => {
    render(<PlanUpgradeCard title="Timeline is a Pro feature" message="Timeline is available on Pro and Business." />);

    expect(screen.getByRole("heading", { name: "Timeline is a Pro feature" })).toBeInTheDocument();
    expect(screen.getByText("Timeline is available on Pro and Business.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upgrade plan" })).toHaveAttribute("href", "/app/settings/billing");
  });
});
