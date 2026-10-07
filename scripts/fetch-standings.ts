import { readFileSync, writeFileSync } from "node:fs";
import { buildStandings, readLeaderboardConfig } from "../src/standings/build-standings.ts";

const SCHEDULE_FILE = "public/data/schedule.json";
const STANDINGS_FILE = "public/data/standings.json";
const API = "https://competitioncorner.net/api2/v1/leaderboard";

const fail = (errors: readonly string[]): never => {
  console.error(`Could not build standings:\n  ${errors.join("\n  ")}`);
  process.exit(1);
};

const getJson = async (url: string): Promise<unknown> => {
  const response = await fetch(url);
  if (!response.ok) fail([`${url} returned ${response.status}`]);
  return response.json();
};

const config = readLeaderboardConfig(JSON.parse(readFileSync(SCHEDULE_FILE, "utf-8")));
if (!config.ok) fail(config.errors);
const { eventId, include } = config.ok ? config.value : { eventId: 0, include: [] };

const divisions = await getJson(`${API}/${eventId}`);
const tabKeys =
  typeof divisions === "object" && divisions !== null ? Object.keys(divisions) : [];
if (tabKeys.length === 0) fail([`Event ${eventId} has no divisions on Competition Corner`]);

const tabs = await Promise.all(tabKeys.map((key) => getJson(`${API}/${eventId}/tab/${key}`)));

const standings = buildStandings({ tabs, include, fetchedAt: new Date().toISOString() });
if (!standings.ok) fail(standings.errors);
if (standings.ok) {
  writeFileSync(STANDINGS_FILE, `${JSON.stringify(standings.value, null, 2)}\n`);
  console.log(
    `Wrote ${STANDINGS_FILE}: ${standings.value.teams.length} teams, ` +
      `${standings.value.individuals.length} individuals from ${tabs.length} divisions.`,
  );
}
