import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("package contract", () => {
  it("declares no runtime dependencies and exposes dual module entry points", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as Record<string, unknown>;
    expect(packageJson.dependencies ?? {}).toEqual({});
    expect(packageJson.exports).toMatchObject({
      ".": { import: "./dist/index.js", require: "./dist/index.cjs" },
    });
  });
});
