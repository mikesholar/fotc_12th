import { useState } from "react";

const LINKS = [
  { href: "#schedule-board", label: "Schedule" },
  { href: "#teams", label: "Our Teams" },
  { href: "https://fittestofthecoast.com", label: "FOTC ↗", external: true },
];

export const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="hdr">
        <div className="wrap hdr__inner">
          <a className="brand" href="#top">
            <span className="brand__mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="#0A0C0D" strokeWidth="2.4" strokeLinecap="round">
                <path d="M2 9c2.6-2.6 5.2-2.6 7.8 0s5.2 2.6 7.8 0 4.4-1.6 4.4-1.6" />
                <path d="M2 15c2.6-2.6 5.2-2.6 7.8 0s5.2 2.6 7.8 0 4.4-1.6 4.4-1.6" />
              </svg>
            </span>
            <span className="brand__txt">
              <strong>12th State</strong>
              <span>× Fittest of the Coast</span>
            </span>
          </a>

          <nav className="nav" aria-label="Main">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <a className="btn btn--coral hdr__cta" href="#schedule-board">
            Full Schedule →
          </a>

          <button
            type="button"
            className="burger"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            <span />
          </button>
        </div>
      </header>

      {open && (
        <nav className="mnav" aria-label="Mobile">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </>
  );
};
