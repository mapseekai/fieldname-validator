import {
  asciiLowercase,
  maxCodePoints,
  maxUtf8Bytes,
  reservedNames,
  utf8ByteLength,
} from "../src/internal/rules.js";
import { describe, expect, it } from "vitest";

describe("rule helpers", () => {
  it("counts UTF-8 bytes rather than UTF-16 code units", () => {
    expect(utf8ByteLength("é")).toBe(2);
    expect(utf8ByteLength("𐐷")).toBe(4);
    expect(utf8ByteLength("\ud800")).toBe(3);
  });

  it("reports the exact UTF-8 byte length after exceeding the configured maximum", () => {
    expect(
      maxUtf8Bytes(63, {
        description: "test",
        assumptions: [],
        sources: [],
      }).evaluate("\ud800".repeat(1_000_000)),
    ).toMatchObject({
      code: "MAX_LENGTH_EXCEEDED",
      details: { actual: 3_000_000, max: 63, unit: "utf8-bytes" },
    });
  });

  it("folds only ASCII letters for keyword lookup", () => {
    expect(asciiLowercase("SeLeCt")).toBe("select");
    expect(asciiLowercase("É")).toBe("É");
  });

  it("reports the exact code-point length after exceeding the configured maximum", () => {
    expect(
      maxCodePoints(10, {
        description: "test",
        assumptions: [],
        sources: [],
      }).evaluate("a".repeat(1_000_000)),
    ).toMatchObject({
      code: "MAX_LENGTH_EXCEEDED",
      details: { actual: 1_000_000, max: 10, unit: "code-points" },
    });
  });

  it("reports reserved system columns with a canonical column detail", () => {
    expect(
      reservedNames(new Set(["xmin"]), {
        description: "test",
        assumptions: [],
        sources: [],
      }).evaluate("XMIN"),
    ).toEqual({
      code: "RESERVED_SYSTEM_COLUMN",
      message: "Field name is a reserved system column.",
      details: { column: "xmin" },
    });
  });
});
