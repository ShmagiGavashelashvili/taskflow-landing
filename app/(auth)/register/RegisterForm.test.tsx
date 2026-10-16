import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorResponse, jsonResponse, sentRequest, stubFetch } from "@/tests/fetch";
import RegisterForm from "./RegisterForm";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const created = (plan: string) => ({
  user: { id: "usr_1", name: "Sam Rivera", email: "sam@example.com", createdAt: "2026-10-16T12:00:00.000Z" },
  workspace: {
    id: "ws_1",
    name: "Rivera Labs",
    plan,
    billingPeriod: "monthly",
    trialEndsAt: "2026-10-30T12:00:00.000Z",
    createdAt: "2026-10-16T12:00:00.000Z",
  },
  role: "owner",
});

beforeEach(() => router.replace.mockReset());

async function fill(user: ReturnType<typeof userEvent.setup>, values: Partial<Record<string, string>> = {}) {
  const v = { name: "Sam Rivera", email: "sam@example.com", password: "correct horse", workspace: "Rivera Labs", ...values };
  if (v.name) await user.type(screen.getByLabelText("Your name"), v.name);
  if (v.email) await user.type(screen.getByLabelText("Work email"), v.email);
  if (v.password) await user.type(screen.getByLabelText("Password"), v.password);
  if (v.workspace) await user.type(screen.getByLabelText("Workspace name"), v.workspace);
}

describe("RegisterForm", () => {
  it("creates the account on a Pro trial by default and goes to the app", async () => {
    const fetchMock = stubFetch(() => jsonResponse(created("pro"), 201));
    const user = userEvent.setup();
    render(<RegisterForm initialEmail="" initialPlan={null} />);

    expect(screen.getByRole("radio", { name: /Pro/ })).toBeChecked();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(sentRequest(fetchMock)).toEqual({
      path: "/api/auth/register",
      method: "POST",
      body: { name: "Sam Rivera", email: "sam@example.com", password: "correct horse", workspaceName: "Rivera Labs", plan: "pro" },
    });
    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith("/app"));
  });

  it("pre-fills the email and plan from the landing page", async () => {
    const fetchMock = stubFetch(() => jsonResponse(created("business"), 201));
    const user = userEvent.setup();
    render(<RegisterForm initialEmail="sam@example.com" initialPlan="business" />);

    expect(screen.getByLabelText("Work email")).toHaveValue("sam@example.com");
    expect(screen.getByRole("radio", { name: /Business/ })).toBeChecked();

    await fill(user, { email: "" });
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(sentRequest(fetchMock).body).toMatchObject({ email: "sam@example.com", plan: "business" });
  });

  it("shows inline errors for missing and invalid fields without submitting", async () => {
    const fetchMock = stubFetch(() => jsonResponse(created("pro"), 201));
    const user = userEvent.setup();
    render(<RegisterForm initialEmail="" initialPlan={null} />);

    await fill(user, { name: "", email: "sam@", password: "short", workspace: "" });
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByLabelText("Your name")).toHaveAccessibleDescription("Please enter your name.");
    expect(screen.getByLabelText("Work email")).toHaveAccessibleDescription("That doesn't look like a valid email address.");
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("Password must be at least 8 characters.");
    expect(screen.getByLabelText("Workspace name")).toHaveAccessibleDescription("Please name your workspace.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears a field's error once it's edited", async () => {
    stubFetch(() => jsonResponse(created("pro"), 201));
    const user = userEvent.setup();
    render(<RegisterForm initialEmail="" initialPlan={null} />);

    await user.click(screen.getByRole("button", { name: "Create account" }));
    await user.type(screen.getByLabelText("Your name"), "S");

    expect(screen.getByLabelText("Your name")).not.toHaveAccessibleDescription("Please enter your name.");
  });

  it("tells the visitor when the email is already registered, with a way to log in", async () => {
    stubFetch(() =>
      errorResponse(409, "EMAIL_TAKEN", "An account with this email already exists. Log in instead.", {
        email: ["An account with this email already exists."],
      }),
    );
    const user = userEvent.setup();
    render(<RegisterForm initialEmail="" initialPlan={null} />);

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("An account with this email already exists.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in instead" })).toHaveAttribute("href", "/login");
    expect(router.replace).not.toHaveBeenCalled();
  });
});
