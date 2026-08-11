import { getFieldNameRules, validateFieldName } from "../src/index.js";
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
      // @ts-expect-error EMPTY_NAME details have no arbitrary keys.
      issue.details.nonexistent;
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
});
