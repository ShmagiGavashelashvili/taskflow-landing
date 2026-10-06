import { describe, expect, it } from "vitest";
import {
  companies,
  faqs,
  features,
  footerColumns,
  navLinks,
  plans,
  showcaseTabs,
  socialLinks,
  stats,
  steps,
  testimonials,
} from "./data";

const unique = (ids: string[]) => new Set(ids).size === ids.length;

describe("content data", () => {
  it("has unique ids in every list", () => {
    expect(unique(companies.map((c) => c.id))).toBe(true);
    expect(unique(features.map((f) => f.id))).toBe(true);
    expect(unique(steps.map((s) => s.id))).toBe(true);
    expect(unique(plans.map((p) => p.id))).toBe(true);
    expect(unique(testimonials.map((t) => t.id))).toBe(true);
    expect(unique(faqs.map((f) => f.id))).toBe(true);
    expect(unique(showcaseTabs.map((t) => t.id))).toBe(true);
    expect(unique(stats.map((s) => s.id))).toBe(true);
  });

  it("matches the planned section sizes", () => {
    expect(features).toHaveLength(6);
    expect(steps).toHaveLength(3);
    expect(plans).toHaveLength(3);
    expect(testimonials).toHaveLength(3);
    expect(showcaseTabs.map((t) => t.id)).toEqual(["board", "timeline", "reports"]);
    expect(faqs.length).toBeGreaterThanOrEqual(5);
    expect(faqs.length).toBeLessThanOrEqual(6);
    expect(companies.length).toBeGreaterThanOrEqual(5);
    expect(companies.length).toBeLessThanOrEqual(6);
  });

  it("highlights exactly one plan, the middle one", () => {
    const highlighted = plans.filter((p) => p.highlighted);
    expect(highlighted).toHaveLength(1);
    expect(plans[1]).toBe(highlighted[0]);
  });

  it("makes yearly prices exactly 20% cheaper for paid plans", () => {
    for (const plan of plans.filter((p) => p.monthly > 0)) {
      expect(plan.yearly).toBeCloseTo(plan.monthly * 0.8, 5);
    }
  });

  it("keeps the free plan free in both billing modes", () => {
    expect(plans[0]).toMatchObject({ monthly: 0, yearly: 0 });
  });

  it("points every nav link at an in-page anchor", () => {
    for (const link of navLinks) expect(link.href).toMatch(/^#[a-z-]+$/);
  });

  it("has footer columns and social links with labels", () => {
    expect(footerColumns.map((c) => c.title)).toEqual(["Product", "Company", "Resources", "Legal"]);
    for (const social of socialLinks) expect(social.label).toBeTruthy();
    expect(socialLinks.map((s) => s.icon)).toEqual(["x", "github", "linkedin"]);
  });

  it("has valid stat values", () => {
    for (const stat of stats) {
      expect(stat.value).toBeGreaterThan(0);
      expect(stat.decimals).toBeGreaterThanOrEqual(0);
    }
  });
});
