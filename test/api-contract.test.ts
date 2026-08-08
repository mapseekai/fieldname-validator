import { getFieldNameRules, isValidFieldName, validateFieldName } from "../src/index.js";
import { describe, expect, it } from "vitest";

describe("public API contract", () => {
  it("keeps isValidFieldName consistent with validateFieldName", () => {
    for (const [name, format] of [
      ["parcel_id", "postgresql"],
      ["select", "postgis"],
      ["Name_123", "shapefile"],
      ["SELECT", "sqlite"],
    ] as const) {
      expect(isValidFieldName(name, format)).toBe(
        validateFieldName(name, format).valid,
      );
    }
  });

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

  it("uses stable messages and structured issue details", () => {
    expect(validateFieldName("", "postgresql").errors[0]).toEqual({
      code: "EMPTY_NAME",
      message: "Field name must not be empty.",
      details: {},
    });
    expect(
      validateFieldName("a".repeat(64), "postgresql").errors[0],
    ).toMatchObject({
      code: "MAX_LENGTH_EXCEEDED",
      details: { actual: 64, max: 63, unit: "utf8-bytes" },
    });
  });

  it("returns defensive copies from getFieldNameRules", () => {
    const first = getFieldNameRules("postgresql");
    const mutableRules = first.rules as unknown as Array<{
      description: string;
    }>;
    mutableRules[0]!.description = "mutated";
    const firstLengthRule = first.rules.find(
      (rule) => rule.code === "MAX_LENGTH_EXCEEDED",
    )!;
    (firstLengthRule.assumptions as unknown as string[])[0] =
      "mutated assumption";
    (
      firstLengthRule.sources as unknown as Array<{ title: string }>
    )[0]!.title = "mutated source";

    const second = getFieldNameRules("postgresql");
    const secondLengthRule = second.rules.find(
      (rule) => rule.code === "MAX_LENGTH_EXCEEDED",
    )!;
    expect(second.rules[0]!.description).not.toBe("mutated");
    expect(secondLengthRule.assumptions[0]).not.toBe("mutated assumption");
    expect(secondLengthRule.sources[0]!.title).not.toBe("mutated source");
  });

  it("rejects formats removed from v1", () => {
    expect(() => validateFieldName("name", "geojson" as never)).toThrow(
      RangeError,
    );
    expect(() => validateFieldName("name", "geoparquet" as never)).toThrow(
      RangeError,
    );
    expect(() => validateFieldName("name", "flatgeobuf" as never)).toThrow(
      RangeError,
    );
  });
});
