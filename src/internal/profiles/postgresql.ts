import { POSTGRESQL_18_RESERVED_KEYWORDS } from "../keywords/postgresql-18.js";
import {
  initialCharacter,
  maxUtf8Bytes,
  nonEmpty,
  reservedKeywords,
  reservedNames,
  subsequentCharacters,
} from "../rules.js";
import type { InternalProfile } from "../types.js";

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

const POSTGRESQL_SYSTEM_COLUMNS_SOURCE = {
  title: "PostgreSQL 18: System Columns",
  url: "https://www.postgresql.org/docs/18/ddl-system-columns.html",
  version: "PostgreSQL 18",
} as const;

const LOWERCASE_FOLDING_ASSUMPTION = "Unquoted identifiers fold to lowercase.";
const POSTGRESQL_SYSTEM_COLUMNS = new Set([
  "tableoid",
  "xmin",
  "cmin",
  "xmax",
  "cmax",
  "ctid",
]);

function isUnpairedSurrogate(character: string): boolean {
  if (character.length !== 1) {
    return false;
  }

  const codeUnit = character.charCodeAt(0);
  return codeUnit >= 0xd800 && codeUnit <= 0xdfff;
}

function isAsciiLetter(character: string): boolean {
  return /^[A-Za-z]$/.test(character);
}

function isValidNonAsciiUnicodeScalar(character: string): boolean {
  if (isUnpairedSurrogate(character)) {
    return false;
  }

  const codePoint = character.codePointAt(0);
  return codePoint !== undefined && codePoint > 0x7f;
}

function isAllowedInitialCharacter(character: string): boolean {
  return (
    character === "_" ||
    isAsciiLetter(character) ||
    isValidNonAsciiUnicodeScalar(character)
  );
}

function isAllowedSubsequentCharacter(character: string): boolean {
  return (
    isAllowedInitialCharacter(character) ||
    /^[0-9]$/.test(character) ||
    character === "$"
  );
}

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
      description:
        "Must begin with an underscore, ASCII letter, or valid non-ASCII Unicode scalar.",
      assumptions: [LOWERCASE_FOLDING_ASSUMPTION],
      sources: [POSTGRESQL_LEXICAL_SOURCE],
    }),
    subsequentCharacters(isAllowedSubsequentCharacter, {
      description:
        "Characters after the first must be underscores, ASCII letters or digits, dollar signs, or valid non-ASCII Unicode scalars.",
      assumptions: [LOWERCASE_FOLDING_ASSUMPTION],
      sources: [POSTGRESQL_LEXICAL_SOURCE],
    }),
    reservedKeywords(POSTGRESQL_18_RESERVED_KEYWORDS, {
      description: "Must not be a PostgreSQL 18 reserved key word.",
      assumptions: [LOWERCASE_FOLDING_ASSUMPTION],
      sources: [POSTGRESQL_LEXICAL_SOURCE, POSTGRESQL_KEYWORDS_SOURCE],
    }),
    reservedNames(POSTGRESQL_SYSTEM_COLUMNS, {
      description: "Must not conflict with a PostgreSQL system column name.",
      assumptions: [LOWERCASE_FOLDING_ASSUMPTION],
      sources: [POSTGRESQL_SYSTEM_COLUMNS_SOURCE],
    }),
  ]),
});
