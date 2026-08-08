import { SQLITE_3_53_4_KEYWORDS } from "../keywords/sqlite-3.53.4.js";
import {
  initialCharacter,
  nonEmpty,
  reservedKeywords,
  subsequentCharacters,
} from "../rules.js";
import type { InternalProfile } from "../types.js";

const SQLITE_TOKENIZER_SOURCE = {
  title: "SQLite Tokenizer Requirements",
  url: "https://www.sqlite.org/draft/tokenreq.html",
  version: "SQLite 3.53.4",
} as const;

const SQLITE_KEYWORDS_SOURCE = {
  title: "SQLite Keywords",
  url: "https://www.sqlite.org/lang_keywords.html",
  version: "SQLite 3.53.4",
} as const;

const GEOPACKAGE_SOURCE = {
  title: "OGC GeoPackage 1.4.0 Encoding Standard",
  url: "https://www.geopackage.org/spec140/",
  version: "OGC GeoPackage 1.4.0",
} as const;

const GEOPACKAGE_STYLE_ASSUMPTION =
  "GeoPackage lowercase snake-case guidance is not an error rule.";

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

export const geopackageSqliteProfile: InternalProfile = Object.freeze({
  id: "geopackage-sqlite",
  aliases: Object.freeze(["geopackage", "sqlite"] as const),
  rules: Object.freeze([
    nonEmpty({
      description: "Must not be empty.",
      assumptions: [GEOPACKAGE_STYLE_ASSUMPTION],
      sources: [SQLITE_TOKENIZER_SOURCE, GEOPACKAGE_SOURCE],
    }),
    initialCharacter(isAllowedInitialCharacter, {
      description:
        "Must begin with an underscore, ASCII letter, or valid non-ASCII Unicode scalar.",
      assumptions: [GEOPACKAGE_STYLE_ASSUMPTION],
      sources: [SQLITE_TOKENIZER_SOURCE, GEOPACKAGE_SOURCE],
    }),
    subsequentCharacters(isAllowedSubsequentCharacter, {
      description:
        "Characters after the first must be underscores, ASCII letters or digits, dollar signs, or valid non-ASCII Unicode scalars.",
      assumptions: [GEOPACKAGE_STYLE_ASSUMPTION],
      sources: [SQLITE_TOKENIZER_SOURCE, GEOPACKAGE_SOURCE],
    }),
    reservedKeywords(SQLITE_3_53_4_KEYWORDS, {
      description: "Must not be a SQLite 3.53.4 keyword.",
      assumptions: [GEOPACKAGE_STYLE_ASSUMPTION],
      sources: [SQLITE_KEYWORDS_SOURCE, GEOPACKAGE_SOURCE],
    }),
  ]),
});
