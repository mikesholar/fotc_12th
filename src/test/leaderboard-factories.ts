type Json = Record<string, unknown>;

export const getMockRawWorkout = (overrides?: Json): Json => ({
  id: 132104,
  key: "workout_132104",
  name: "Workout 1",
  showDetails: true,
  ...overrides,
});

export const getMockRawWorkoutScore = (overrides?: Json): Json => ({
  workoutId: 132104,
  points: "",
  rank: "",
  res: "-",
  ...overrides,
});

export const getMockRawLeaderboardIndividual = (overrides?: Json): Json => ({
  name: "Jamie Fox",
  firstName: "Jamie",
  lastName: "Fox",
  affiliate: "12TH STATE CROSSFIT",
  place: "",
  totalPoints: "0",
  ptcpID: "1500001",
  wd: false,
  team: false,
  teammates: null,
  workoutScores: { workout_132104: getMockRawWorkoutScore() },
  ...overrides,
});

export const getMockRawLeaderboardTeam = (overrides?: Json): Json => ({
  ...getMockRawLeaderboardIndividual(),
  name: "Hold the Line",
  firstName: "Jordan",
  lastName: "Reese",
  ptcpID: "1600001",
  team: true,
  teammates: [{ athleteName: "Jordan Reese" }, { athleteName: "Morgan Cade" }],
  ...overrides,
});

export const getMockRawDivisionTab = (overrides?: Json): Json => ({
  scoringGroup: {
    divisionId: 147119,
    caption: "Team Novice Co-Ed",
    team: true,
  },
  workouts: [getMockRawWorkout()],
  athletes: [getMockRawLeaderboardTeam()],
  ...overrides,
});

export const getMockRawIndividualTab = (overrides?: Json): Json =>
  getMockRawDivisionTab({
    scoringGroup: { divisionId: 147091, caption: "Novice Male", team: false },
    athletes: [getMockRawLeaderboardIndividual()],
    ...overrides,
  });
