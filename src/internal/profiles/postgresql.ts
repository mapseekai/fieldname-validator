import { isPostgresql18ReservedKeyword } from "../keywords/postgresql-18.js";
import {
  initialCharacter,
  maxUtf8Bytes,
  nonEmpty,
  subsequentCharacters,
} from "../rules.js";
import type { InternalProfile, InternalRule } from "../types.js";

const POSTGRESQL_LEXICAL_SOURCE = {
  title: "PostgreSQL 18: Lexical Structure",
  url: "https://www.postgresql.org/docs/18/sql-syntax-lexical.html",
  version: "PostgreSQL 18",
} as const;

const POSTGRESQL_KEYWORDS_SOURCE = {
  title: "PostgreSQL 18: SQL Key Words",
  url: "https://www.postgresql.org/docs/18/sql-keywords-appendix.html",
  version: "PostgreSQL 18",
} as const;

const LOWERCASE_FOLDING_ASSUMPTION = "Unquoted identifiers fold to lowercase.";
const unicodeLetter = /^\p{L}$/u;

function isAllowedInitialCharacter(character: string): boolean {
  return character === "_" || unicodeLetter.test(character);
}

function isAllowedSubsequentCharacter(character: string): boolean {
  return (
    isAllowedInitialCharacter(character) ||
    /^[0-9]$/.test(character) ||
    character === "$"
  );
}

const reservedKeywordRule: InternalRule = {
  info: {
    code: "RESERVED_KEYWORD",
    description: "Must not be a PostgreSQL 18 reserved key word.",
    assumptions: [LOWERCASE_FOLDING_ASSUMPTION],
    sources: [POSTGRESQL_LEXICAL_SOURCE, POSTGRESQL_KEYWORDS_SOURCE],
  },
  evaluate(name) {
    if (name === "" || !isPostgresql18ReservedKeyword(name)) {
      return undefined;
    }

    return {
      code: "RESERVED_KEYWORD",
      message: "Field name is a reserved keyword.",
      details: { keyword: name },
    };
  },
};

export const postgresqlProfile: InternalProfile = Object.freeze({
  id: "postgresql",
  aliases: Object.freeze(["postgresql", "postgis"] as const),
  rules: Object.freeze([
    nonEmpty({
      description: "Must not be empty.",
      assumptions: [LOWERCASE_FOLDING_ASSUMPTION],
      sources: [POSTGRESQL_LEXICAL_SOURCE],
    }),
    maxUtf8Bytes(63, {
      description: "Must be at most 63 UTF-8 bytes.",
      assumptions: [
        "Default NAMEDATALEN=64 and UTF-8 database encoding.",
        LOWERCASE_FOLDING_ASSUMPTION,
      ],
      sources: [POSTGRESQL_LEXICAL_SOURCE],
    }),
    initialCharacter(isAllowedInitialCharacter, {
      description: "Must begin with a Unicode letter or underscore.",
      assumptions: [LOWERCASE_FOLDING_ASSUMPTION],
      sources: [POSTGRESQL_LEXICAL_SOURCE],
    }),
    subsequentCharacters(isAllowedSubsequentCharacter, {
      description:
        "Characters after the first must be Unicode letters, ASCII digits, underscores, or dollar signs.",
      assumptions: [LOWERCASE_FOLDING_ASSUMPTION],
      sources: [POSTGRESQL_LEXICAL_SOURCE],
    }),
    reservedKeywordRule,
  ]),
});
