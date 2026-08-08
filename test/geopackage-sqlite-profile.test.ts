import { getFieldNameRules, validateFieldName } from "../src/index.js";
import { describe, expect, it } from "vitest";

describe("SQLite 3.53.4 bare identifiers", () => {
  it.each([
    ["_local", true, []],
    ["école", true, []],
    ["ſelect", true, []],
    ["dollar$inside", true, []],
    ["a".repeat(256), true, []],
    ["", false, ["EMPTY_NAME"]],
    ["123name", false, ["INVALID_START_CHARACTER"]],
    ["name-dash", false, ["INVALID_CHARACTER"]],
    ["SELECT", false, ["RESERVED_KEYWORD"]],
  ])("validates %j", (name, valid, expectedCodes) => {
    const result = validateFieldName(name, "sqlite");
    expect(result.valid).toBe(valid);
    expect(result.errors.map((issue) => issue.code)).toEqual(expectedCodes);
  });

  it.each([
    ["\ud800", "INVALID_START_CHARACTER"],
    ["name\udfff", "INVALID_CHARACTER"],
  ])("rejects an unpaired surrogate in %j", (name, expectedCode) => {
    expect(
      validateFieldName(name, "sqlite").errors.map((issue) => issue.code),
    ).toContain(expectedCode);
  });

  it("reports reserved keywords with canonical lowercase details", () => {
    expect(validateFieldName("SELECT", "sqlite").errors).toContainEqual(
      expect.objectContaining({
        code: "RESERVED_KEYWORD",
        details: { keyword: "select" },
      }),
    );
  });

  it("preserves geopackage as the caller alias and does not expose lowercase style as an error", () => {
    expect(validateFieldName("MixedCase", "geopackage")).toMatchObject({
      format: "geopackage",
      valid: true,
    });
  });

  it("includes SQLite 3.53.4 and GeoPackage 1.4.0 source metadata", () => {
    const sources = getFieldNameRules("geopackage").rules.flatMap((rule) => rule.sources);
    expect(sources.some((source) => source.version === "SQLite 3.53.4")).toBe(true);
    expect(sources.some((source) => source.version === "OGC GeoPackage 1.4.0")).toBe(true);
  });
});
