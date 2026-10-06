import { ChartColumn, GanttChart, LayoutGrid, MessagesSquare, SquareKanban } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Person, Tone } from "@/types";

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
