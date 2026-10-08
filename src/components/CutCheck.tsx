import { cutLineCleared } from "../domain/standings";
import type { Standing } from "../types/schedule";

export const CutCheck = ({ standing }: { readonly standing?: Standing }) => {
  const line = cutLineCleared(standing);
  if (line === undefined) return null;
  const description = `Above the cut: ${line.label} (top ${line.place})`;
  return (
    <span className="cut-check" role="img" aria-label={description} title={description}>
      ✓
    </span>
  );
};
