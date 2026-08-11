import { getFieldNameRules, validateFieldName } from "../src/index.js";
import type { InternalRule } from "../src/internal/types.js";
import type { FieldNameIssue } from "../src/index.js";
import { describe, expectTypeOf, it } from "vitest";

describe("public TypeScript contract", () => {
  it("preserves literal formats and narrows invalid results", () => {
    const result = validateFieldName("name", "postgis");
    expectTypeOf(result.format).toEqualTypeOf<"postgis">();

    if (!result.valid) {
      expectTypeOf(result.errors).toMatchTypeOf<
        readonly [FieldNameIssue, ...FieldNameIssue[]]
      >();
    }

    const rules = getFieldNameRules("sqlite");
    expectTypeOf(rules.format).toEqualTypeOf<"sqlite">();
  });

  it("correlates issue codes with their detail payloads", () => {
    const issue = validateFieldName("", "postgresql").errors[0];

    if (issue?.code === "EMPTY_NAME") {
      const emptyDetails: typeof issue.details = {};
      void emptyDetails;

      // @ts-expect-error EMPTY_NAME details reject extra properties.
      const unexpectedDetails: typeof issue.details = { unexpected: 1 };
      void unexpectedDetails;
    }

    const lengthIssue = validateFieldName("a".repeat(64), "postgresql").errors[0];
    if (lengthIssue?.code === "MAX_LENGTH_EXCEEDED") {
      expectTypeOf(lengthIssue.details.unit).toEqualTypeOf<
        "utf8-bytes" | "code-points"
      >();
      // @ts-expect-error MAX_LENGTH_EXCEEDED details have no keyword.
      lengthIssue.details.keyword;
    }
  });

  it("requires an internal rule code that binds metadata to its result", () => {
    // @ts-expect-error A bare InternalRule must not allow mismatched issue codes.
    const mismatchedRule: InternalRule = {
      info: {
        code: "EMPTY_NAME",
        description: "Must not be empty.",
        assumptions: [],
        sources: [],
      },
      evaluate: () => ({
        code: "RESERVED_KEYWORD",
        message: "Field name is a reserved keyword.",
        details: { keyword: "select" },
      }),
    };

    const mismatchedEmptyNameRule: InternalRule<"EMPTY_NAME"> = {
      info: {
        code: "EMPTY_NAME",
        description: "Must not be empty.",
        assumptions: [],
        sources: [],
      },
      evaluate: () => ({
        // @ts-expect-error EMPTY_NAME rules must return EMPTY_NAME issues.
        code: "RESERVED_KEYWORD",
        message: "Field name is a reserved keyword.",
        // @ts-expect-error EMPTY_NAME details reject keyword payloads.
        details: { keyword: "select" },
      }),
    };

    void mismatchedRule;
    void mismatchedEmptyNameRule;
  });
});
