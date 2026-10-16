import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import type { Member, PendingInvite } from "@/lib/schemas/workspace";
import { errorResponse, jsonResponse, sentRequest, stubFetch } from "@/tests/fetch";
import MembersPanel from "./MembersPanel";

const member = (id: string, name: string, role: Member["role"] = "member"): Member => ({
  id,
  name,
  email: `${id}@example.com`,
  role,
  createdAt: "2026-10-01T12:00:00.000Z",
});

const pending = (id: string, email: string): PendingInvite => ({
  id,
  email,
  invitedBy: "owner",
  expiresAt: "2026-10-23T12:00:00.000Z",
  inviteUrl: `/invite/token-${id}`,
});

function renderPanel(props: Partial<ComponentProps<typeof MembersPanel>> = {}) {
  return render(
    <MembersPanel
      isOwner
      currentUserId="owner"
      members={[member("owner", "Sam Rivera", "owner"), member("jo", "Jo Park")]}
      invites={[]}
      memberLimit={5}
      {...props}
    />,
  );
}

describe("MembersPanel", () => {
  it("invites by email and shows a copyable link plus the pending invite", async () => {
    const created = pending("inv_1", "kim@example.com");
    const fetchMock = stubFetch(() => jsonResponse({ invite: created }, 201));
    const user = userEvent.setup();
    renderPanel();

    await user.type(screen.getByLabelText("Email address"), "Kim@example.com");
    await user.click(screen.getByRole("button", { name: "Send invite" }));

    expect(sentRequest(fetchMock)).toEqual({ path: "/api/workspace/invites", method: "POST", body: { email: "kim@example.com" } });
    const link = await screen.findByLabelText("Invite link");
    expect(link).toHaveValue(`${window.location.origin}/invite/token-inv_1`);
    await user.click(screen.getByRole("button", { name: "Copy link" }));
    expect(await navigator.clipboard.readText()).toBe(`${window.location.origin}/invite/token-inv_1`);
    expect(within(screen.getByRole("list", { name: "Pending invites" })).getByText("kim@example.com")).toBeInTheDocument();
  });

  it("shows an upgrade prompt instead of the invite form when the plan's member limit is reached", () => {
    renderPanel({
      members: [member("owner", "Sam Rivera", "owner"), member("a", "A"), member("b", "B")],
      invites: [pending("inv_1", "c@example.com"), pending("inv_2", "d@example.com")],
      memberLimit: 5,
    });

    expect(screen.getByText(/reached your plan's limit of 5 members/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Upgrade/ })).toHaveAttribute("href", "/app/settings/billing");
    expect(screen.queryByLabelText("Email address")).not.toBeInTheDocument();
  });

  it("shows the upgrade prompt when the server reports the limit", async () => {
    stubFetch(() =>
      errorResponse(403, "PLAN_LIMIT_REACHED", "Your plan allows up to 5 members, including pending invites. Upgrade to Pro for unlimited members."),
    );
    const user = userEvent.setup();
    renderPanel();

    await user.type(screen.getByLabelText("Email address"), "kim@example.com");
    await user.click(screen.getByRole("button", { name: "Send invite" }));

    expect(await screen.findByText(/Your plan allows up to 5 members/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Upgrade/ })).toHaveAttribute("href", "/app/settings/billing");
  });

  it("is read-only for members", () => {
    renderPanel({ isOwner: false, currentUserId: "jo" });

    expect(screen.getByText("Jo Park")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email address")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
  });
});
