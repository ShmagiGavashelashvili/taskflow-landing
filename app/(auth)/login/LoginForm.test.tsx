import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { errorResponse, jsonResponse, sentRequest, stubFetch } from "@/tests/fetch";
import LoginForm from "./LoginForm";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const SESSION = {
  user: { id: "usr_demo", name: "Alex Morgan", email: "demo@taskflow.app", createdAt: "2026-06-01T00:00:00.000Z" },
  workspace: {
    id: "ws_acme",
    name: "Acme Studio",
    plan: "pro",
    billingPeriod: "monthly",
    trialEndsAt: null,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
  role: "owner",
};

beforeEach(() => {
  router.replace.mockReset();
  router.refresh.mockReset();
});

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Log in" }));
  return user;
}

describe("LoginForm", () => {
  it("logs in and goes to the app", async () => {
    const fetchMock = stubFetch(() => jsonResponse(SESSION));
    render(<LoginForm next={null} demoAccount={null} />);

    await fillAndSubmit("demo@taskflow.app", "demo1234");

    expect(sentRequest(fetchMock)).toEqual({
      path: "/api/auth/login",
      method: "POST",
      body: { email: "demo@taskflow.app", password: "demo1234" },
    });
    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith("/app"));
  });

  it("returns to the page the visitor originally wanted", async () => {
    stubFetch(() => jsonResponse(SESSION));
    render(<LoginForm next="/app/settings/profile" demoAccount={null} />);

    await fillAndSubmit("demo@taskflow.app", "demo1234");

    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith("/app/settings/profile"));
  });

  it("shows the server's generic error and stays on the page", async () => {
    stubFetch(() => errorResponse(401, "INVALID_CREDENTIALS", "Invalid email or password."));
    render(<LoginForm next={null} demoAccount={null} />);

    await fillAndSubmit("demo@taskflow.app", "wrong-password");

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password.");
    expect(router.replace).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
  });

  it("validates before sending anything", async () => {
    const fetchMock = stubFetch(() => jsonResponse(SESSION));
    render(<LoginForm next={null} demoAccount={null} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("Please enter your email address.");
    expect(screen.getByLabelText("Password")).toHaveAccessibleDescription("Please enter your password.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("offers the demo credentials in demo mode and fills them in", async () => {
    stubFetch(() => jsonResponse(SESSION));
    render(<LoginForm next={null} demoAccount={{ email: "demo@taskflow.app", password: "demo1234" }} />);

    expect(screen.getByText("demo@taskflow.app")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Use demo account" }));

    expect(screen.getByLabelText("Email")).toHaveValue("demo@taskflow.app");
    expect(screen.getByLabelText("Password")).toHaveValue("demo1234");
  });
});
