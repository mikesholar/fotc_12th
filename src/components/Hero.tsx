import { phaseRange } from "../domain/phase-range";
import type { Schedule } from "../types/schedule";

export const Hero = ({ schedule }: { readonly schedule: Schedule }) => {
  const athleteCount =
    schedule.teams.reduce((sum, team) => sum + team.athletes.length, 0) +
    schedule.individuals.length;

  const stats = [
    { value: String(schedule.teams.length), label: "Teams" },
    { value: String(schedule.individuals.length), label: "Individuals" },
    { value: String(athleteCount), label: "Entries" },
    { value: phaseRange(schedule.events, "qualifier"), label: "Qualifier" },
    { value: phaseRange(schedule.events, "championship"), label: "Championship" },
  ].filter((stat): stat is { value: string; label: string } => Boolean(stat.value));

  return (
    <section className="hero tex" id="top">
      <div className="wrap">
        <p className="eyebrow">
          Coastal Qualifier <span className="dot">·</span> 2027 Season{" "}
          <span className="dot">·</span> {schedule.gym.location}
        </p>
        <h1>
          Road to <em>Charleston</em>
        </h1>
        <p className="hero__lede">
          Every drop, every deadline, every heat — one page tracking {schedule.gym.name} through
          the online qualifier and on to the Championship floor.
        </p>
        <div className="cta">
          <a className="btn btn--coral" href="#schedule-board">
            See the schedule →
          </a>
          <a className="btn btn--ghost" href="#teams">
            Meet the teams
          </a>
        </div>
        <div className="stats">
          {stats.map((stat) => (
            <div className="stat" key={stat.label}>
              <b>{stat.value}</b>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
