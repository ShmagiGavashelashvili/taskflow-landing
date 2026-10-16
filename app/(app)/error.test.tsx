import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AppShellError from "./error";

describe("app shell error boundary", () => {
  it("explains the failure and retries on request", async () => {
    const retry = vi.fn();
    render(<AppShellError error={new Error("UNAVAILABLE")} retry={retry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));

    expect(retry).toHaveBeenCalledOnce();
  });

  it("offers a way out to the landing page", () => {
    render(<AppShellError error={new Error("UNAVAILABLE")} retry={vi.fn()} />);

    expect(screen.getByRole("link", { name: "Back to the home page" })).toHaveAttribute("href", "/");
  });
});
