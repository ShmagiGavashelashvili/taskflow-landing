import { SITE_NAME } from "@/constants/site";

/** A page `<title>`: the parts, most specific first, then the site name (`pageTitle("Billing", "Settings")`). */
export function pageTitle(...parts: string[]): string {
  return [...parts, SITE_NAME].join(" · ");
}
