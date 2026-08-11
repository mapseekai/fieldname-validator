import { getFieldNameRules, isValidFieldName, validateFieldName } from "../src/index.js";
import type { FieldNameFormat } from "../src/index.js";
import { describe, expect, it } from "vitest";

describe("API argument guards", () => {
  it.each([
    ["validateFieldName", () => validateFieldName(null as unknown as string, "postgresql")],
    ["isValidFieldName", () => isValidFieldName(42 as unknown as string, "postgresql")],
  ])("throws the exact TypeError for a non-string name in %s", (_api, call) => {
    expect(call).toThrow(new TypeError("Field name must be a string."));
  });

  it.each([
    [
      "validateFieldName",
      () => validateFieldName("name", null as unknown as FieldNameFormat),
    ],
    [
      "isValidFieldName",
      () => isValidFieldName("name", 42 as unknown as FieldNameFormat),
    ],
    [
      "getFieldNameRules",
      () => getFieldNameRules({} as unknown as FieldNameFormat),
    ],
  ])("throws the exact RangeError for a non-string format in %s", (_api, call) => {
    expect(call).toThrow(
      new RangeError("Field name format must be a supported string value."),
    );
  });

  it.each([
    [
      "validateFieldName",
      () => validateFieldName("name", "geojson" as FieldNameFormat),
    ],
    [
      "isValidFieldName",
      () => isValidFieldName("name", "geojson" as FieldNameFormat),
    ],
    [
      "getFieldNameRules",
      () => getFieldNameRules("geojson" as FieldNameFormat),
    ],
  ])("throws the exact RangeError for an unsupported string format in %s", (_api, call) => {
    expect(call).toThrow(
      new RangeError("Unsupported field name format: geojson"),
    );
  });
});
