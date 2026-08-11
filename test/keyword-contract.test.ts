import { createHash } from "node:crypto";
import { POSTGRESQL_18_RESERVED_KEYWORDS } from "../src/internal/keywords/postgresql-18.js";
import { SQLITE_3_53_4_KEYWORDS } from "../src/internal/keywords/sqlite-3.53.4.js";
import { validateFieldName } from "../src/index.js";
import type { FieldNameFormat } from "../src/index.js";
import { describe, expect, it } from "vitest";

function sortedKeywordDigest(keywords: ReadonlySet<string>): string {
  const canonicalEntries = [...keywords].sort().join("\n");
  return createHash("sha256").update(canonicalEntries, "utf8").digest("hex");
}

const keywordProfiles = [
  {
    name: "PostgreSQL 18",
    format: "postgresql",
    keywords: POSTGRESQL_18_RESERVED_KEYWORDS,
    count: 101,
    sha256: "3df55095fd57a18dcf86d011bfa70c7e3b5e7cf6b9f500e74e9be7c557fa6025",
  },
  {
    name: "SQLite 3.53.4",
    format: "sqlite",
    keywords: SQLITE_3_53_4_KEYWORDS,
    count: 147,
    sha256: "9ee3645569d34512c90536579d98c79c3a8945802260ef8ad54176ee97828131",
  },
] as const satisfies readonly {
  name: string;
  format: FieldNameFormat;
  keywords: ReadonlySet<string>;
  count: number;
  sha256: string;
}[];

describe("pinned keyword contracts", () => {
  it.each(keywordProfiles)(
    "pins the $name canonical set count and SHA-256 digest",
    ({ keywords, count, sha256 }) => {
      expect(keywords.size).toBe(count);
      expect(sortedKeywordDigest(keywords)).toBe(sha256);
    },
  );

  for (const { name, format, keywords } of keywordProfiles) {
    it(`rejects every production ${name} keyword through the public API`, () => {
      for (const keyword of keywords) {
        expect(validateFieldName(keyword, format).errors).toContainEqual({
          code: "RESERVED_KEYWORD",
          message: "Field name is a reserved keyword.",
          details: { keyword: keyword.toLowerCase() },
        });
      }
    });
  }

  it.each([
    ["SeLeCt", "postgresql", "select"],
    ["sElEcT", "sqlite", "select"],
  ] as const)(
    "rejects mixed-case keyword %s through %s",
    (keyword, format, canonicalKeyword) => {
      expect(validateFieldName(keyword, format).errors).toContainEqual({
        code: "RESERVED_KEYWORD",
        message: "Field name is a reserved keyword.",
        details: { keyword: canonicalKeyword },
      });
    },
  );

  it.each([
    ["parcel_id", "postgresql"],
    ["parcel_id", "sqlite"],
  ] as const)("accepts non-keyword %s through %s", (name, format) => {
    expect(validateFieldName(name, format).valid).toBe(true);
  });
});
