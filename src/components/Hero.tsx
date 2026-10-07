import type { Schedule } from "../types/schedule";

export const Hero = ({ schedule }: { readonly schedule: Schedule }) => (
  <section className="hero tex" id="top">
    <div className="wrap">
      <p className="eyebrow">
        Coastal Qualifier <span className="dot">·</span> 2027 Season{" "}
        <span className="dot">·</span> {schedule.gym.location}
      </p>
      <h1>
        12th State @ <em>FOTC</em>
      </h1>
    </div>
  </section>
);
