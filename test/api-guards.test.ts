import { getFieldNameRules, validateFieldName } from "../src/index.js";
import { describe, expect, it } from "vitest";

describe("API argument guards", () => {
  it("throws TypeError for a non-string name", () => {
    expect(() => validateFieldName(null as unknown as string, "postgresql")).toThrow(TypeError);
  });

  it("throws RangeError for an unsupported format", () => {
    expect(() => getFieldNameRules("geojson" as never)).toThrow(RangeError);
  });
});
