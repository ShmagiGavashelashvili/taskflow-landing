import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/constants/site";
import robots from "./robots";
import sitemap from "./sitemap";

describe("robots", () => {
  it("allows all crawlers and links the sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: `${SITE_URL}/sitemap.xml`,
    });
  });
});

describe("sitemap", () => {
  it("lists the home page", () => {
    expect(sitemap()).toEqual([{ url: SITE_URL, changeFrequency: "monthly", priority: 1 }]);
  });
});
