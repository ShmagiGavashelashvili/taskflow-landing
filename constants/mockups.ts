import { ChartColumn, GanttChart, LayoutGrid, MessagesSquare, SquareKanban } from "lucide-react";
import type {
  BoardColumn,
  Kpi,
  Person,
  SidebarItem,
  TimelineRow,
  VelocityPoint,
} from "@/types";

const AK: Person = { initials: "AK", tone: 0 };
const JR: Person = { initials: "JR", tone: 1 };
const MS: Person = { initials: "MS", tone: 2 };
const LP: Person = { initials: "LP", tone: 3 };

export const BOARD_TEAM: Person[] = [AK, JR, MS, LP];

export const BOARD_COLUMNS: BoardColumn[] = [
  {
    name: "To do",
    dot: "bg-slate-400",
    cards: [
      { title: "Draft Q4 launch plan", tag: "Planning", tagTone: "blue", due: "Oct 14", people: [AK, MS] },
      { title: "Review pricing page copy", tag: "Marketing", tagTone: "amber", due: "Oct 16", people: [LP] },
      { title: "Prepare partner webinar", tag: "Marketing", tagTone: "amber", due: "Oct 21", people: [JR] },
    ],
  },
  {
    name: "In progress",
    dot: "bg-blue-500",
    cards: [
      { title: "Redesign onboarding flow", tag: "Design", tagTone: "violet", due: "Oct 11", people: [MS, LP], progress: 65 },
      { title: "API rate limit docs", tag: "Engineering", tagTone: "teal", due: "Oct 12", people: [JR], progress: 40 },
      { title: "Customer interview synthesis", tag: "Research", tagTone: "rose", due: "Oct 13", people: [AK], progress: 80 },
    ],
  },
  {
    name: "Done",
    dot: "bg-emerald-500",
    cards: [
      { title: "Set up product analytics", tag: "Engineering", tagTone: "teal", due: "Oct 4", people: [JR], done: true },
      { title: "Kickoff with design partners", tag: "Planning", tagTone: "blue", due: "Oct 2", people: [AK, LP], done: true },
    ],
  },
];

export const BOARD_SIDEBAR: SidebarItem[] = [
  { icon: LayoutGrid },
  { icon: SquareKanban, active: true },
  { icon: GanttChart },
  { icon: MessagesSquare },
  { icon: ChartColumn },
];

export const TIMELINE_DAYS = 14;
export const TIMELINE_DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S", "M", "T", "W", "T", "F", "S", "S"];

export const TIMELINE_ROWS: TimelineRow[] = [
  { name: "Research", tone: "rose", start: 1, end: 5, progress: 100 },
  { name: "Wireframes", tone: "blue", start: 3, end: 8, progress: 85 },
  { name: "Visual design", tone: "violet", start: 5, end: 11, progress: 55 },
  { name: "Build", tone: "teal", start: 7, end: 14, progress: 30 },
  { name: "Content", tone: "amber", start: 8, end: 13, progress: 20 },
  { name: "Launch", tone: "slate", start: 12, end: 15, progress: 0 },
];

export const VELOCITY: VelocityPoint[] = [
  { week: "W1", value: 42 },
  { week: "W2", value: 55 },
  { week: "W3", value: 48 },
  { week: "W4", value: 66 },
  { week: "W5", value: 72 },
  { week: "W6", value: 84 },
];

export const KPIS: Kpi[] = [
  { label: "Tasks completed", value: "128", delta: "+18%" },
  { label: "On-time rate", value: "94%", delta: "+6%" },
  { label: "Avg. cycle time", value: "3.2d", delta: "-0.8d" },
];

/** SVG polyline points on a 100 × 80 viewBox. */
export const BURNDOWN_IDEAL = "0,10 100,70";
export const BURNDOWN_ACTUAL = "0,10 20,22 40,38 60,44 80,58 100,66";
