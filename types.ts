import type { LucideIcon } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

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
  tone: number;
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

export type Billing = "monthly" | "yearly";

export interface BillingOption {
  value: Billing;
  label: string;
}

export interface SocialLink {
  label: string;
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export type ButtonVariant = "primary" | "secondary" | "light";
export type ButtonSize = "md" | "lg";

export type AvatarSize = "sm" | "md" | "lg" | "xl";

export type Tone = "blue" | "teal" | "amber" | "violet" | "rose" | "slate";

export interface Person {
  initials: string;
  tone: number;
}

export interface BoardCard {
  title: string;
  tag: string;
  tagTone: Tone;
  due: string;
  people: Person[];
  progress?: number;
  done?: boolean;
}

export interface BoardColumn {
  name: string;
  dot: string;
  cards: BoardCard[];
}

export interface SidebarItem {
  icon: LucideIcon;
  active?: boolean;
}

export interface TimelineRow {
  name: string;
  tone: Tone;
  /** 1-based start column and exclusive end column on the 14-day grid. */
  start: number;
  end: number;
  progress: number;
}

export interface VelocityPoint {
  week: string;
  value: number;
}

export interface Kpi {
  label: string;
  value: string;
  delta: string;
}
