import {
  ChartColumn,
  FolderPlus,
  GanttChart,
  MessagesSquare,
  Plug,
  SquareKanban,
  TrendingUp,
  UserPlus,
  Zap,
} from "lucide-react";
import type {
  Company,
  FaqItem,
  Feature,
  FooterColumn,
  NavLink,
  Plan,
  ShowcaseTab,
  Stat,
  Step,
  Testimonial,
} from "./types";

export const navLinks: NavLink[] = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const companies: Company[] = [
  { id: "lumora", name: "Lumora" },
  { id: "brightpeak", name: "Brightpeak" },
  { id: "kinetiq", name: "Kinetiq" },
  { id: "orbitly", name: "Orbitly" },
  { id: "fernwood", name: "Fernwood" },
  { id: "quillhouse", name: "Quillhouse" },
];

export const features: Feature[] = [
  {
    id: "boards",
    title: "Task Boards",
    description: "Drag cards across columns and see what everyone is working on at a glance.",
    icon: SquareKanban,
  },
  {
    id: "timeline",
    title: "Timeline View",
    description: "Plan sprints and launches on a clear timeline with dependencies built in.",
    icon: GanttChart,
  },
  {
    id: "chat",
    title: "Team Chat",
    description: "Discuss work right where it happens, with threads attached to every task.",
    icon: MessagesSquare,
  },
  {
    id: "automations",
    title: "Automations",
    description: "Skip the busywork: assign, notify and move tasks with simple if-this-then-that rules.",
    icon: Zap,
  },
  {
    id: "reports",
    title: "Reports",
    description: "Burndown charts and workload views that show how your team is really doing.",
    icon: ChartColumn,
  },
  {
    id: "integrations",
    title: "Integrations",
    description: "Connect Slack, GitHub, Google Drive and 50+ other tools you already use.",
    icon: Plug,
  },
];

export const steps: Step[] = [
  {
    id: "create",
    title: "Create a project",
    description: "Start from a template or a blank board. Your workspace is ready in under a minute.",
    icon: FolderPlus,
  },
  {
    id: "invite",
    title: "Invite your team",
    description: "Add teammates by email, assign tasks and get everyone on the same page.",
    icon: UserPlus,
  },
  {
    id: "track",
    title: "Track progress",
    description: "Watch work move from idea to done with live boards, timelines and reports.",
    icon: TrendingUp,
  },
];

export const showcaseTabs: ShowcaseTab[] = [
  {
    id: "board",
    label: "Board",
    title: "Every task, one glance away",
    description:
      "Kanban boards that keep the whole team aligned. Move work forward with a drag and see status update for everyone instantly.",
    highlights: ["Drag-and-drop columns", "Assignees, tags and due dates", "Progress on every card"],
  },
  {
    id: "timeline",
    label: "Timeline",
    title: "Plan the whole sprint, visually",
    description:
      "Lay out projects across weeks, spot overlaps early and keep launches on schedule without a single spreadsheet.",
    highlights: ["Drag to reschedule", "Dependencies between tasks", "Workload at a glance"],
  },
  {
    id: "reports",
    label: "Reports",
    title: "Know how your team is doing",
    description:
      "Automatic reports show velocity, burndown and completion rates, so you can share progress without building slides.",
    highlights: ["Burndown and velocity charts", "Completion by project", "Shareable with one link"],
  },
];

export const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "For individuals and tiny teams getting started.",
    monthly: 0,
    yearly: 0,
    features: [
      "Up to 5 team members",
      "3 active projects",
      "Task boards",
      "Basic team chat",
      "1 GB file storage",
    ],
    cta: "Start for free",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For growing teams that need to move faster.",
    monthly: 15,
    yearly: 12,
    features: [
      "Unlimited projects",
      "Timeline and reports",
      "50+ integrations",
      "Automations (1,000 runs/mo)",
      "Priority support",
      "100 GB file storage",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    id: "business",
    name: "Business",
    tagline: "For organizations that need control and scale.",
    monthly: 30,
    yearly: 24,
    features: [
      "Everything in Pro",
      "Unlimited automations",
      "SSO and advanced permissions",
      "Audit log and data export",
      "Dedicated success manager",
      "Unlimited file storage",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

export const testimonials: Testimonial[] = [
  {
    id: "maya",
    quote:
      "We moved our whole product team over in a weekend. Standups got shorter because everybody can already see where things stand.",
    name: "Maya Alvarez",
    role: "Head of Product",
    company: "Brightpeak",
    initials: "MA",
    tone: 0,
  },
  {
    id: "daniel",
    quote:
      "The timeline view alone paid for itself. We caught a scheduling conflict three weeks before launch instead of three days.",
    name: "Daniel Okafor",
    role: "Engineering Manager",
    company: "Kinetiq",
    initials: "DO",
    tone: 1,
  },
  {
    id: "sofia",
    quote:
      "I finally stopped chasing people for updates. Reports go out automatically and clients love the clarity.",
    name: "Sofia Lindqvist",
    role: "Studio Director",
    company: "Fernwood",
    initials: "SL",
    tone: 3,
  },
];

export const stats: Stat[] = [
  { id: "delivery", value: 40, decimals: 0, suffix: "%", label: "faster delivery" },
  { id: "projects", value: 10, decimals: 0, suffix: "k+", label: "projects managed" },
  { id: "rating", value: 4.9, decimals: 1, suffix: "/5", label: "average rating" },
];

export const faqs: FaqItem[] = [
  {
    id: "trial",
    question: "How does the free trial work?",
    answer:
      "Every new workspace gets 14 days of Pro, with no credit card required. When the trial ends you can pick a plan or drop to the Free plan and keep your projects.",
  },
  {
    id: "cancel",
    question: "Can I cancel at any time?",
    answer:
      "Yes. There are no contracts. Cancel from your billing settings whenever you like, and you keep access until the end of the period you paid for.",
  },
  {
    id: "security",
    question: "Is my data secure?",
    answer:
      "Your data is encrypted in transit and at rest, backed up daily and hosted in SOC 2 compliant data centers. Business plans add SSO, audit logs and advanced permissions.",
  },
  {
    id: "integrations",
    question: "Which tools does TaskFlow integrate with?",
    answer:
      "Slack, GitHub, GitLab, Google Drive, Figma, Zapier and 50+ more. A public API and webhooks cover anything else.",
  },
  {
    id: "team-size",
    question: "What team size is TaskFlow built for?",
    answer:
      "TaskFlow is designed for teams of 2 to 50 people. The Free plan covers up to 5 members, and Pro and Business scale as you grow.",
  },
  {
    id: "switching",
    question: "Can I import my existing projects?",
    answer:
      "Yes. Import from CSV, Trello, Asana or Jira in a few clicks, and your tasks, assignees and due dates come along.",
  },
];

export const footerColumns: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Integrations", href: "#features" },
      { label: "Changelog", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Help center", href: "#" },
      { label: "Templates", href: "#" },
      { label: "API docs", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
];
