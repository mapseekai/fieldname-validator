import { getFieldNameRules, validateFieldName } from "../src/index.js";
import { describe, expect, it } from "vitest";

describe("ArcGIS-compatible Shapefile/DBF names", () => {
  it.each([
    ["Name_123", true, []],
    ["abcdefghij", true, []],
    ["", false, ["EMPTY_NAME"]],
    ["abcdefghijk", false, ["MAX_LENGTH_EXCEEDED"]],
    ["1name", false, ["INVALID_START_CHARACTER"]],
    ["_name", false, ["INVALID_START_CHARACTER"]],
    ["name-dash", false, ["INVALID_CHARACTER"]],
  ])("validates %j", (name, valid, expectedCodes) => {
    const result = validateFieldName(name, "shapefile");
    expect(result.valid).toBe(valid);
    expect(result.errors.map((issue) => issue.code)).toEqual(expectedCodes);
  });

  it("uses the same profile for dbf and exposes its Esri scope", () => {
    expect(validateFieldName("abcdefghijk", "dbf").format).toBe("dbf");
    expect(
      getFieldNameRules("dbf")
        .rules.flatMap((rule) => rule.sources)
        .some((source) => source.url.includes("support.esri.com")),
    ).toBe(true);
  });
});
