import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PLAN_OFFERS } from "@/lib/billing";
import type { Subscription } from "@/lib/schemas/billing";
import type { Invoice } from "@/lib/schemas/entities";
import { errorResponse, jsonResponse, sentRequest, stubFetch } from "@/tests/fetch";
import BillingPanel from "./BillingPanel";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }) }));

const proTrial: Subscription = {
  plan: "pro",
  effectivePlan: "pro",
  billingPeriod: "monthly",
  trial: { endsAt: "2026-10-30T12:00:00.000Z", daysLeft: 9, expired: false },
  limits: PLAN_OFFERS[1].limits,
  usage: { members: 2, pendingInvites: 0, activeProjects: 4 },
};

const invoice = (id: string, amount: number, period: string): Invoice => ({
  id,
  workspaceId: "ws_1",
  amount,
  period,
  status: "paid",
  issuedAt: "2026-10-16T12:00:00.000Z",
});

function renderPanel(invoices: Invoice[] = []) {
  return render(<BillingPanel subscription={proTrial} plans={PLAN_OFFERS} invoices={invoices} />);
}

describe("BillingPanel", () => {
  it("shows the current plan with trial days left and landing-page prices for the chosen period", async () => {
    const user = userEvent.setup();
    renderPanel();

    expect(screen.getByText(/Pro trial: 9 days left/)).toBeInTheDocument();
    const business = screen.getByRole("group", { name: "Business" });
    expect(within(business).getByText("$30")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: /Yearly/ }));

    expect(within(business).getByText("$24")).toBeInTheDocument();
  });

  it("upgrades through the mock checkout with the test card pre-filled", async () => {
    const fetchMock = stubFetch(() =>
      jsonResponse({
        subscription: { ...proTrial, plan: "business", effectivePlan: "business", billingPeriod: "yearly", trial: { endsAt: null, daysLeft: null, expired: false } },
        invoice: invoice("inv_new", 576, "Oct 2026 – Sep 2027"),
      }),
    );
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole("radio", { name: /Yearly/ }));
    await user.click(within(screen.getByRole("group", { name: "Business" })).getByRole("button", { name: "Upgrade to Business" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("Card number")).toHaveValue("4242 4242 4242 4242");
    // $24 x 2 members x 12 months.
    expect(within(dialog).getByText("$576")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Pay $576" }));

    expect(sentRequest(fetchMock)).toEqual({
      path: "/api/billing/plan",
      method: "POST",
      body: { plan: "business", billingPeriod: "yearly", payment: { cardNumber: "4242 4242 4242 4242", expiry: "12/34", cvc: "123" } },
    });
    expect(await screen.findByText(/You're on Business, billed yearly/)).toBeInTheDocument();
    expect(within(screen.getByRole("table", { name: "Invoices" })).getByText("Oct 2026 – Sep 2027")).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("explains a blocked downgrade", async () => {
    stubFetch(() => errorResponse(409, "CONFLICT", "You can't switch to Free yet: you have 4 active projects and Free allows 3."));
    const user = userEvent.setup();
    renderPanel();

    await user.click(within(screen.getByRole("group", { name: "Free" })).getByRole("button", { name: "Switch to Free" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Switch to Free" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("4 active projects and Free allows 3");
  });
});
