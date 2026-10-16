import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AccountLinks } from "@/components/Navbar";
import Home from "./page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
// The real slot reads the session cookie in an async server component, which jsdom can't render.
vi.mock("./NavbarAccount", () => ({ default: () => <AccountLinks signedIn={false} /> }));

describe("Home page", () => {
  it("has a skip link that targets the main landmark", () => {
    const { container } = render(<Home />);
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
    expect(container.querySelector("main")).toHaveAttribute("id", "main");
  });

  it("renders the navbar and footer outside of main", () => {
    render(<Home />);
    const main = screen.getByRole("main");
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(main).not.toContainElement(screen.getByRole("banner"));
    expect(main).not.toContainElement(screen.getByRole("contentinfo"));
  });

  it("renders every section in the planned order", () => {
    const { container } = render(<Home />);
    const ids = [...container.querySelectorAll("main > section")].map((s) => s.getAttribute("id") ?? s.getAttribute("aria-labelledby"));
    expect(ids).toEqual([
      "top",
      "logos-title",
      "features",
      "how-it-works",
      "showcase",
      "pricing",
      "testimonials",
      "faq",
      "cta-title",
    ]);
  });

  it("has exactly one h1", () => {
    render(<Home />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("has every in-page nav target present", () => {
    const { container } = render(<Home />);
    for (const href of ["#features", "#how-it-works", "#pricing", "#faq", "#get-started", "#top"]) {
      expect(container.querySelector(href)).not.toBeNull();
    }
  });
});
