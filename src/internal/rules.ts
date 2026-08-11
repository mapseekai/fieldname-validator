import type { FieldNameIssueCode, FieldNameRuleInfo } from "../types.js";
import type { InternalRule, RuleMetadata } from "./types.js";

type CharacterPredicate = (character: string) => boolean;

export function utf8ByteLength(value: string): number {
  let length = 0;

  for (const character of value) {
    const codePoint = character.codePointAt(0)!;
    if (codePoint >= 0xd800 && codePoint <= 0xdfff) {
      length += 3;
    } else if (codePoint <= 0x7f) {
      length += 1;
    } else if (codePoint <= 0x7ff) {
      length += 2;
    } else if (codePoint <= 0xffff) {
      length += 3;
    } else {
      length += 4;
    }

  }

  return length;
}

export function asciiLowercase(value: string): string {
  return value.replace(/[A-Z]/g, (character) => character.toLowerCase());
}

function asciiUppercase(value: string): string {
  return value.replace(/[a-z]/g, (character) =>
    String.fromCharCode(character.charCodeAt(0) - 32),
  );
}

function ruleInfo<C extends FieldNameIssueCode>(
  code: C,
  metadata: RuleMetadata,
): FieldNameRuleInfo<C> {
  return { code, ...metadata };
}

function maxLength(
  max: number,
  unit: "utf8-bytes" | "code-points",
  measure: (name: string) => number,
  metadata: RuleMetadata,
): InternalRule<"MAX_LENGTH_EXCEEDED"> {
  return {
    info: ruleInfo("MAX_LENGTH_EXCEEDED", metadata),
    evaluate(name) {
      if (name === "") {
        return undefined;
      }

      const actual = measure(name);
      if (actual <= max) {
        return undefined;
      }

      return {
        code: "MAX_LENGTH_EXCEEDED",
        message: "Field name exceeds the maximum allowed length.",
        details: { max, actual, unit },
      };
    },
  };
}

export function nonEmpty(metadata: RuleMetadata): InternalRule<"EMPTY_NAME"> {
  return {
    info: ruleInfo("EMPTY_NAME", metadata),
    evaluate(name) {
      if (name !== "") {
        return undefined;
      }

      return {
        code: "EMPTY_NAME",
        message: "Field name must not be empty.",
        details: {},
      };
    },
  };
}

export function maxUtf8Bytes(
  max: number,
  metadata: RuleMetadata,
): InternalRule<"MAX_LENGTH_EXCEEDED"> {
  return maxLength(
    max,
    "utf8-bytes",
    utf8ByteLength,
    metadata,
  );
}

export function maxCodePoints(
  max: number,
  metadata: RuleMetadata,
): InternalRule<"MAX_LENGTH_EXCEEDED"> {
  return maxLength(
    max,
    "code-points",
    (name) => {
      let count = 0;
      for (const _character of name) {
        count += 1;
      }
      return count;
    },
    metadata,
  );
}

export function initialCharacter(
  isAllowed: CharacterPredicate,
  metadata: RuleMetadata,
): InternalRule<"INVALID_START_CHARACTER"> {
  return {
    info: ruleInfo("INVALID_START_CHARACTER", metadata),
    evaluate(name) {
      if (name === "") {
        return undefined;
      }

      const character = name[Symbol.iterator]().next().value!;
      if (isAllowed(character)) {
        return undefined;
      }

      return {
        code: "INVALID_START_CHARACTER",
        message: "Field name has an invalid starting character.",
        details: { character, index: 0, indexUnit: "utf16-code-units" },
      };
    },
  };
}

export function subsequentCharacters(
  isAllowed: CharacterPredicate,
  metadata: RuleMetadata,
): InternalRule<"INVALID_CHARACTER"> {
  return {
    info: ruleInfo("INVALID_CHARACTER", metadata),
    evaluate(name) {
      if (name === "") {
        return undefined;
      }

      let index = 0;
      let isFirstCharacter = true;
      for (const character of name) {
        if (isFirstCharacter) {
          isFirstCharacter = false;
          index += character.length;
          continue;
        }

        if (!isAllowed(character)) {
          return {
            code: "INVALID_CHARACTER",
            message: "Field name contains an invalid character.",
            details: { character, index, indexUnit: "utf16-code-units" },
          };
        }

        index += character.length;
      }

      return undefined;
    },
  };
}

export function reservedKeywords(
  keywords: ReadonlySet<string>,
  metadata: RuleMetadata,
): InternalRule<"RESERVED_KEYWORD"> {
  const canonicalKeywords = new Set(Array.from(keywords, asciiUppercase));

  return {
    info: ruleInfo("RESERVED_KEYWORD", metadata),
    evaluate(name) {
      if (name === "") {
        return undefined;
      }

      if (!canonicalKeywords.has(asciiUppercase(name))) {
        return undefined;
      }

      return {
        code: "RESERVED_KEYWORD",
        message: "Field name is a reserved keyword.",
        details: { keyword: asciiLowercase(name) },
      };
    },
  };
}

export function reservedNames(
  names: ReadonlySet<string>,
  metadata: RuleMetadata,
): InternalRule<"RESERVED_SYSTEM_COLUMN"> {
  const canonicalNames = new Set(Array.from(names, asciiUppercase));

  return {
    info: ruleInfo("RESERVED_SYSTEM_COLUMN", metadata),
    evaluate(name) {
      if (name === "") {
        return undefined;
      }

      if (!canonicalNames.has(asciiUppercase(name))) {
        return undefined;
      }

      return {
        code: "RESERVED_SYSTEM_COLUMN",
        message: "Field name is a reserved system column.",
        details: { column: asciiLowercase(name) },
      };
    },
  };
}
