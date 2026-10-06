import type { LucideIcon } from "lucide-react";
import type { AvatarTone } from "./ui";

export interface NavLink {
  label: string;
  href: string;
}

export interface Company {
  id: string;
  name: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface Step {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export type ShowcaseTabId = "board" | "timeline" | "reports";

export interface ShowcaseTab {
  id: ShowcaseTabId;
  label: string;
  title: string;
  description: string;
  highlights: string[];
}

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  /** Price per user per month when billed monthly. */
  monthly: number;
  /** Price per user per month when billed yearly. */
  yearly: number;
  features: string[];
  cta: string;
  highlighted: boolean;
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  initials: string;
  tone: AvatarTone;
}

export interface Stat {
  id: string;
  value: number;
  decimals: number;
  suffix: string;
  label: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}

export type BrandIconName = "x" | "github" | "linkedin";

export interface SocialLink {
  label: string;
  href: string;
  icon: BrandIconName;
}
