import { asciiLowercase, utf8ByteLength } from "../src/internal/rules.js";
import { describe, expect, it } from "vitest";

describe("rule helpers", () => {
  it("counts UTF-8 bytes rather than UTF-16 code units", () => {
    expect(utf8ByteLength("é")).toBe(2);
    expect(utf8ByteLength("𐐷")).toBe(4);
  });

  it("folds only ASCII letters for keyword lookup", () => {
    expect(asciiLowercase("SeLeCt")).toBe("select");
    expect(asciiLowercase("É")).toBe("É");
  });
});
