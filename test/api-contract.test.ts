import { getFieldNameRules, isValidFieldName, validateFieldName } from "../src/index.js";
import type { FieldNameFormat } from "../src/index.js";
import { describe, expect, it } from "vitest";

describe("public API contract", () => {
  it.each([
    ["parcel_id", "postgresql", true],
    ["select", "postgis", false],
    ["Name_123", "shapefile", true],
    ["SELECT", "sqlite", false],
  ] as const)(
    "returns %s validity for %s",
    (name, format, expectedValidity) => {
      expect(isValidFieldName(name, format)).toBe(expectedValidity);
    },
  );

  it("returns deterministic independent errors", () => {
    const name = `1${"a".repeat(63)}-`;
    expect(
      validateFieldName(name, "postgresql").errors.map((issue) => issue.code),
    ).toEqual([
      "MAX_LENGTH_EXCEEDED",
      "INVALID_START_CHARACTER",
      "INVALID_CHARACTER",
    ]);
  });

  it("returns exact public payloads for every issue code", () => {
    expect(validateFieldName("", "postgresql").errors[0]).toEqual({
      code: "EMPTY_NAME",
      message: "Field name must not be empty.",
      details: {},
    });
    expect(
      validateFieldName("a".repeat(64), "postgresql").errors[0],
    ).toEqual({
      code: "MAX_LENGTH_EXCEEDED",
      message: "Field name exceeds the maximum allowed length.",
      details: { max: 63, actual: 64, unit: "utf8-bytes" },
    });
    expect(validateFieldName("1name", "postgresql").errors[0]).toEqual({
      code: "INVALID_START_CHARACTER",
      message: "Field name has an invalid starting character.",
      details: { character: "1", index: 0, indexUnit: "utf16-code-units" },
    });
    expect(validateFieldName("a😀-", "postgresql").errors[0]).toEqual({
      code: "INVALID_CHARACTER",
      message: "Field name contains an invalid character.",
      details: { character: "-", index: 3, indexUnit: "utf16-code-units" },
    });
    expect(validateFieldName("SELECT", "postgresql").errors[0]).toEqual({
      code: "RESERVED_KEYWORD",
      message: "Field name is a reserved keyword.",
      details: { keyword: "select" },
    });
    expect(validateFieldName("XMIN", "postgresql").errors[0]).toEqual({
      code: "RESERVED_SYSTEM_COLUMN",
      message: "Field name is a reserved system column.",
      details: { column: "xmin" },
    });
  });

  it.each([
    ["postgresql", "postgis", "tableoid", false],
    ["shapefile", "dbf", "abcdefghijk", false],
    ["sqlite", "geopackage", "abcdefghijk", true],
  ] as const)(
    "keeps %s and %s rule DTOs and validation behavior equivalent",
    (firstFormat, secondFormat, name, expectedValidity) => {
      const firstRules = getFieldNameRules(firstFormat);
      const secondRules = getFieldNameRules(secondFormat);
      const firstResult = validateFieldName(name, firstFormat);
      const secondResult = validateFieldName(name, secondFormat);

      expect(firstRules.rules).toEqual(secondRules.rules);
      expect(firstResult.valid).toBe(expectedValidity);
      expect(secondResult.valid).toBe(expectedValidity);
      expect(firstResult.errors).toEqual(secondResult.errors);
    },
  );

  it("returns nested defensive copies from getFieldNameRules", () => {
    const first = getFieldNameRules("postgresql");
    const second = getFieldNameRules("postgresql");

    expect(first).not.toBe(second);
    expect(first.rules).not.toBe(second.rules);
    expect(first.rules).toHaveLength(second.rules.length);

    for (const [index, firstRule] of first.rules.entries()) {
      const secondRule = second.rules[index];
      expect(secondRule).toBeDefined();
      expect(firstRule).not.toBe(secondRule);
      expect(firstRule.assumptions).not.toBe(secondRule?.assumptions);
      expect(firstRule.sources).not.toBe(secondRule?.sources);
      expect(firstRule.sources).toHaveLength(secondRule?.sources.length ?? -1);

      for (const [sourceIndex, firstSource] of firstRule.sources.entries()) {
        expect(firstSource).not.toBe(secondRule?.sources[sourceIndex]);
      }
    }
  });

  it.each(["geojson", "geoparquet", "flatgeobuf"])(
    "rejects the removed %s format through every format-taking API",
    (format) => {
      const unsupportedFormat = format as FieldNameFormat;
      const message = `Unsupported field name format: ${format}`;

      expect(() => validateFieldName("name", unsupportedFormat)).toThrow(
        new RangeError(message),
      );
      expect(() => isValidFieldName("name", unsupportedFormat)).toThrow(
        new RangeError(message),
      );
      expect(() => getFieldNameRules(unsupportedFormat)).toThrow(
        new RangeError(message),
      );
    },
  );
});
