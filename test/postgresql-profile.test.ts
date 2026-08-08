import { getFieldNameRules, validateFieldName } from "../src/index.js";
import { describe, expect, it } from "vitest";

const codes = (name: string, format: "postgresql" | "postgis") =>
  validateFieldName(name, format).errors.map((issue) => issue.code);

describe("PostgreSQL 18 bare identifiers", () => {
  it.each([
    ["parcel_id", []],
    ["MixedCase", []],
    ["éclair", []],
    ["ſelect", []],
    ["parcel$part", []],
    ["", ["EMPTY_NAME"]],
    ["1parcel", ["INVALID_START_CHARACTER"]],
    ["parcel-name", ["INVALID_CHARACTER"]],
    ["select", ["RESERVED_KEYWORD"]],
    ["a".repeat(64), ["MAX_LENGTH_EXCEEDED"]],
    ["é".repeat(32), ["MAX_LENGTH_EXCEEDED"]],
  ])("validates %j", (name, expected) => {
    expect(codes(name, "postgresql")).toEqual(expected);
  });

  it("reports reserved keywords with canonical lowercase details", () => {
    expect(validateFieldName("SELECT", "postgresql").errors).toContainEqual(
      expect.objectContaining({
        code: "RESERVED_KEYWORD",
        details: { keyword: "select" },
      }),
    );
  });

  it("uses equivalent rules for postgis while preserving the requested alias", () => {
    expect(validateFieldName("select", "postgis")).toMatchObject({
      format: "postgis",
      valid: false,
    });
  });

  it("publishes PostgreSQL 18 source metadata and lowercase-folding assumptions", () => {
    const rules = getFieldNameRules("postgresql");
    expect(
      rules.rules
        .flatMap((rule) => rule.sources)
        .some((source) => source.version === "PostgreSQL 18"),
    ).toBe(true);
    expect(rules.rules.flatMap((rule) => rule.assumptions)).toContain(
      "Unquoted identifiers fold to lowercase.",
    );
  });
});
