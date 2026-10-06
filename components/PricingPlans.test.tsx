import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { plans } from "@/data";
import PricingPlans from "./PricingPlans";

const renderPlans = () => render(<PricingPlans plans={plans} />);
const card = (name: string) => screen.getByRole("heading", { level: 3, name }).closest("li") as HTMLElement;
const priceOf = (name: string) => card(name).querySelector(".tabular-nums")?.textContent;

describe("PricingPlans", () => {
  it("renders Free, Pro and Business plans with taglines", () => {
    renderPlans();
    for (const plan of plans) {
      expect(screen.getByRole("heading", { level: 3, name: plan.name })).toBeInTheDocument();
      expect(screen.getByText(plan.tagline)).toBeInTheDocument();
    }
  });

  it("shows monthly prices by default", () => {
    renderPlans();
    expect(priceOf("Free")).toBe("$0");
    expect(priceOf("Pro")).toBe("$15");
    expect(priceOf("Business")).toBe("$30");
    expect(within(card("Pro")).getByText("Billed monthly")).toBeInTheDocument();
  });

  it("offers a Monthly/Yearly radio group, Monthly selected, with the savings badge", () => {
    renderPlans();
    expect(screen.getByRole("group", { name: "Billing period" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Monthly" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Yearly" })).not.toBeChecked();
    expect(screen.getByText("Save 20%")).toBeInTheDocument();
  });

  it("updates prices and billing notes when switching to Yearly", async () => {
    const user = userEvent.setup();
    renderPlans();
    await user.click(screen.getByRole("radio", { name: "Yearly" }));
    expect(screen.getByRole("radio", { name: "Yearly" })).toBeChecked();
    await waitFor(() => expect(priceOf("Pro")).toBe("$12"), { timeout: 3000 });
    await waitFor(() => expect(priceOf("Business")).toBe("$24"), { timeout: 3000 });
    expect(priceOf("Free")).toBe("$0");
    expect(within(card("Pro")).getByText("Billed annually")).toBeInTheDocument();
    expect(within(card("Business")).getByText("Billed annually")).toBeInTheDocument();
  });

  it("switches back to Monthly", async () => {
    const user = userEvent.setup();
    renderPlans();
    await user.click(screen.getByRole("radio", { name: "Yearly" }));
    await waitFor(() => expect(priceOf("Pro")).toBe("$12"), { timeout: 3000 });
    await user.click(screen.getByRole("radio", { name: "Monthly" }));
    await waitFor(() => expect(priceOf("Pro")).toBe("$15"), { timeout: 3000 });
    expect(within(card("Pro")).getByText("Billed monthly")).toBeInTheDocument();
  });

  it("changes billing with the keyboard", async () => {
    const user = userEvent.setup();
    renderPlans();
    screen.getByRole("radio", { name: "Monthly" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "Yearly" })).toBeChecked();
  });

  it("describes the free plan as free forever, not per user", () => {
    renderPlans();
    expect(within(card("Free")).getByText("forever")).toBeInTheDocument();
    expect(within(card("Free")).getByText("Free for small teams")).toBeInTheDocument();
    expect(within(card("Pro")).getByText("/user/mo")).toBeInTheDocument();
  });

  it("highlights only the Pro plan as Most Popular", () => {
    renderPlans();
    expect(screen.getAllByText("Most Popular")).toHaveLength(1);
    expect(within(card("Pro")).getByText("Most Popular")).toBeInTheDocument();
  });

  it("lists each plan's features", () => {
    renderPlans();
    for (const plan of plans) {
      for (const feature of plan.features) expect(within(card(plan.name)).getByText(feature)).toBeInTheDocument();
    }
  });

  it("renders a call to action per plan", () => {
    renderPlans();
    expect(within(card("Free")).getByRole("link", { name: "Start for free" })).toBeInTheDocument();
    expect(within(card("Pro")).getByRole("link", { name: "Start Free Trial" })).toBeInTheDocument();
    expect(within(card("Business")).getByRole("link", { name: "Contact sales" })).toBeInTheDocument();
  });

  it("derives the savings percentage from the plan prices", () => {
    render(<PricingPlans plans={plans.map((p) => ({ ...p, yearly: p.monthly * 0.65 }))} />);
    expect(screen.getByText("Save 35%")).toBeInTheDocument();
  });

  it("shows the largest saving when paid plans differ", () => {
    const [free, pro, business] = plans;
    render(<PricingPlans plans={[free, { ...pro, yearly: pro.monthly * 0.9 }, { ...business, yearly: business.monthly * 0.75 }]} />);
    expect(screen.getByText("Save 25%")).toBeInTheDocument();
  });

  it("hides the savings badge when no plan is cheaper yearly", () => {
    render(<PricingPlans plans={[plans[0]]} />);
    expect(screen.queryByText(/^Save/)).not.toBeInTheDocument();
  });
});
