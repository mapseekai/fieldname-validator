import type {
  FieldNameIssue,
  FieldNameIssueCode,
  FieldNameRuleInfo,
} from "../types.js";
import type { InternalRule } from "./types.js";

type RuleMetadata = Omit<FieldNameRuleInfo, "code">;
type CharacterPredicate = (character: string) => boolean;

const textEncoder = new TextEncoder();

export function utf8ByteLength(value: string): number {
  return textEncoder.encode(value).byteLength;
}

export function asciiLowercase(value: string): string {
  return value.replace(/[A-Z]/g, (character) => character.toLowerCase());
}

function ruleInfo(code: FieldNameIssueCode, metadata: RuleMetadata): FieldNameRuleInfo {
  return { code, ...metadata };
}

function maxLength(
  max: number,
  unit: "utf8-bytes" | "code-points",
  measure: (name: string) => number,
  metadata: RuleMetadata,
): InternalRule {
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

export function nonEmpty(metadata: RuleMetadata): InternalRule {
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

export function maxUtf8Bytes(max: number, metadata: RuleMetadata): InternalRule {
  return maxLength(max, "utf8-bytes", utf8ByteLength, metadata);
}

export function maxCodePoints(max: number, metadata: RuleMetadata): InternalRule {
  return maxLength(max, "code-points", (name) => Array.from(name).length, metadata);
}

export function initialCharacter(
  isAllowed: CharacterPredicate,
  metadata: RuleMetadata,
): InternalRule {
  return {
    info: ruleInfo("INVALID_START_CHARACTER", metadata),
    evaluate(name) {
      if (name === "") {
        return undefined;
      }

      const character = Array.from(name)[0]!;
      if (isAllowed(character)) {
        return undefined;
      }

      return {
        code: "INVALID_START_CHARACTER",
        message: "Field name has an invalid starting character.",
        details: { character, index: 0 },
      };
    },
  };
}

export function subsequentCharacters(
  isAllowed: CharacterPredicate,
  metadata: RuleMetadata,
): InternalRule {
  return {
    info: ruleInfo("INVALID_CHARACTER", metadata),
    evaluate(name) {
      if (name === "") {
        return undefined;
      }

      const characters = Array.from(name);
      for (let index = 1; index < characters.length; index += 1) {
        const character = characters[index]!;
        if (!isAllowed(character)) {
          return {
            code: "INVALID_CHARACTER",
            message: "Field name contains an invalid character.",
            details: { character, index },
          };
        }
      }

      return undefined;
    },
  };
}

export function reservedKeywords(
  keywords: ReadonlySet<string>,
  metadata: RuleMetadata,
): InternalRule {
  const canonicalKeywords = new Set(Array.from(keywords, asciiLowercase));

  return {
    info: ruleInfo("RESERVED_KEYWORD", metadata),
    evaluate(name) {
      if (name === "") {
        return undefined;
      }

      const keyword = asciiLowercase(name);
      if (!canonicalKeywords.has(keyword)) {
        return undefined;
      }

      return {
        code: "RESERVED_KEYWORD",
        message: "Field name is a reserved keyword.",
        details: { keyword },
      };
    },
  };
}
