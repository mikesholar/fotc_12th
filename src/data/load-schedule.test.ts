import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSchedule } from "./load-schedule";
import { getMockRawSchedule } from "../test/factories";

const respondWith = (body: unknown, ok = true, status = 200): void => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: async () => body,
    }),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Loading the schedule file", () => {
  it("returns the schedule when the file is valid", async () => {
    respondWith(getMockRawSchedule());

    const result = await loadSchedule();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.gym.name).toBe("12th State CrossFit");
  });

  it("reports validation problems instead of returning a broken schedule", async () => {
    respondWith(getMockRawSchedule({ teams: "not an array" }));

    const result = await loadSchedule();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toContain("teams");
  });

  it("reports a readable error when the file cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const result = await loadSchedule();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toMatch(/could not load/i);
  });

  it("reports a readable error when the file is missing", async () => {
    respondWith(undefined, false, 404);

    const result = await loadSchedule();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toContain("404");
  });

  it("reports a readable error when the file is not valid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token }");
        },
      }),
    );

    const result = await loadSchedule();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toMatch(/not valid json/i);
  });
});
