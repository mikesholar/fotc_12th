import { vi } from "vitest";

export const serveFiles = (files: Record<string, unknown>): void => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async (url: string) => {
      const name = Object.keys(files).find((file) => url.endsWith(file));
      return name === undefined
        ? { ok: false, status: 404, json: async () => undefined }
        : { ok: true, status: 200, json: async () => files[name] };
    }),
  );
};
