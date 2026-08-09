import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("package contract", () => {
  it("declares no runtime dependencies and maps declarations to each module format", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as Record<
      string,
      unknown
    >;

    expect(packageJson.dependencies ?? {}).toEqual({});
    expect(packageJson.exports).toEqual({
      ".": {
        import: {
          types: "./dist/index.d.ts",
          default: "./dist/index.js",
        },
        require: {
          types: "./dist/index.d.cts",
          default: "./dist/index.cjs",
        },
      },
    });
  });

  it("includes both language readmes and the changelog in the published package", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as Record<
      string,
      unknown
    >;

    expect(packageJson.files).toEqual([
      "dist",
      "README.md",
      "README.zh-CN.md",
      "CHANGELOG.md",
    ]);
  });
});
