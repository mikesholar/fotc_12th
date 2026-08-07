const EASTERN = "America/New_York";

export type EventTime = {
  readonly et: string;
  readonly local?: string;
};

export type DayLabel = {
  readonly weekday: string;
  readonly date: string;
};

const timeIn = (iso: string, timeZone: string): string =>
  new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));

const offsetIn = (iso: string, timeZone: string): string | undefined =>
  new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
    .formatToParts(new Date(iso))
    .find((part) => part.type === "timeZoneName")?.value;

export const formatEventTime = (iso: string, viewerTimeZone: string): EventTime => {
  const et = `${timeIn(iso, EASTERN)} ET`;
  const sharesEasternClock =
    offsetIn(iso, viewerTimeZone) === offsetIn(iso, EASTERN);

  return sharesEasternClock ? { et } : { et, local: timeIn(iso, viewerTimeZone) };
};

export const formatDayLabel = (iso: string, viewerTimeZone: string): DayLabel => {
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: viewerTimeZone,
  }).formatToParts(new Date(iso));

  const valueOf = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    weekday: valueOf("weekday"),
    date: `${valueOf("month")} ${valueOf("day")}`,
  };
};

export const resolveViewerTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;
