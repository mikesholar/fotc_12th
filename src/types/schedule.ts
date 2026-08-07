export const EVENT_KINDS = ["release", "due", "comp", "milestone"] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export const PHASES = ["qualifier", "championship"] as const;
export type Phase = (typeof PHASES)[number];

export type Team = {
  readonly id: string;
  readonly name: string;
  readonly division?: string;
  readonly color: string;
  readonly athletes: readonly string[];
  readonly note?: string;
};

export type Individual = {
  readonly id: string;
  readonly name: string;
  readonly division?: string;
  readonly color: string;
  readonly note?: string;
};

export type ScheduleEvent = {
  readonly id: string;
  readonly kind: EventKind;
  readonly title: string;
  readonly start: string;
  readonly end?: string;
  readonly phase: Phase;
  readonly week?: number;
  readonly entrants: "all" | readonly string[];
  readonly location?: string;
  readonly notes?: string;
  readonly link?: string;
};

export type Gym = {
  readonly name: string;
  readonly location: string;
};

export type Schedule = {
  readonly gym: Gym;
  readonly teams: readonly Team[];
  readonly individuals: readonly Individual[];
  readonly events: readonly ScheduleEvent[];
};

export type Valid<T> = { readonly ok: true; readonly value: T };
export type Invalid = { readonly ok: false; readonly errors: readonly string[] };
export type Result<T> = Valid<T> | Invalid;
