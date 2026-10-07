import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const indexHtml = (): string => readFileSync("index.html", "utf-8");

describe("The page shell", () => {
  it("reports page views privately to the gym's GoatCounter dashboard", () => {
    expect(indexHtml()).toMatch(
      /<script\s+data-goatcounter="https:\/\/roadtocharleston\.goatcounter\.com\/count"\s+async\s+src="\/\/gc\.zgo\.at\/count\.js"><\/script>/,
    );
  });
});
