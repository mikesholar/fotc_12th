import type { QuickLink } from "../types/schedule";

export const QuickLinks = ({ links }: { readonly links: readonly QuickLink[] }) => {
  if (links.length === 0) return null;

  return (
    <nav className="quicklinks" aria-label="Competition links">
      <div className="wrap quicklinks__inner">
        <span className="quicklinks__label" aria-hidden="true">
          Fittest of the Coast
        </span>
        <ul>
          {links.map((link) => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.label}
                <span aria-hidden="true"> ↗</span>
              </a>
              {link.note && <span className="quicklinks__note">{link.note}</span>}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};
