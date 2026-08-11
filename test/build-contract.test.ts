import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("package contract", () => {
  it("declares no runtime dependency channels and maps declarations to each module format", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as Record<
      string,
      unknown
    >;

    expect(packageJson.dependencies ?? {}).toEqual({});
    expect(packageJson.optionalDependencies ?? {}).toEqual({});
    expect(packageJson.peerDependencies ?? {}).toEqual({});
    expect(packageJson.bundledDependencies ?? []).toEqual([]);
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

  it("builds through prepack and verifies the packed artifact directly", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.prepack).toBe("npm run build");
    expect(packageJson.scripts?.["test:package"]).toBe(
      "node scripts/verify-package.mjs",
    );
  });

  it("marks the private package as unlicensed", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as Record<
      string,
      unknown
    >;

    expect(packageJson.license).toBe("UNLICENSED");
  });
});

describe("TypeScript compiler contract", () => {
  it("checks strict source types without emitting files", () => {
    const tsconfig = JSON.parse(readFileSync("tsconfig.json", "utf8")) as {
      compilerOptions?: Record<string, unknown>;
    };

    expect(tsconfig.compilerOptions?.strict).toBe(true);
    expect(tsconfig.compilerOptions?.noEmit).toBe(true);
  });
});
