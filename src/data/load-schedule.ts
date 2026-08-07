import type { Result, Schedule } from "../types/schedule";
import { validateSchedule } from "./validate-schedule";

const SCHEDULE_PATH = "data/schedule.json";

const scheduleUrl = (): string => `${import.meta.env.BASE_URL}${SCHEDULE_PATH}`;

export const loadSchedule = async (): Promise<Result<Schedule>> => {
  let response: Response;
  try {
    response = await fetch(scheduleUrl());
  } catch {
    return {
      ok: false,
      errors: [`Could not load ${SCHEDULE_PATH} — check your connection and refresh.`],
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      errors: [`Could not load ${SCHEDULE_PATH} — the server returned ${response.status}.`],
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return {
      ok: false,
      errors: [`${SCHEDULE_PATH} is not valid JSON — check for a stray comma or bracket.`],
    };
  }

  return validateSchedule(payload);
};
