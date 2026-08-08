import {
  initialCharacter,
  maxCodePoints,
  nonEmpty,
  subsequentCharacters,
} from "../rules.js";
import type { InternalProfile } from "../types.js";

const ESRI_SHAPEFILE_SOURCE = {
  title:
    "Esri: What Characters Should Not Be Used in ArcGIS for Field Names and Table Names?",
  url: "https://support.esri.com/en-us/knowledge-base/what-characters-should-not-be-used-in-arcgis-for-field--000005588",
  version: "Esri guidance, published 2024-09-11",
} as const;

const ARCGIS_COMPATIBILITY_ASSUMPTION =
  "ArcGIS-compatible Shapefile/DBF interchange subset; not every historical DBF dialect.";

function isAsciiLetter(character: string): boolean {
  return /^[A-Za-z]$/.test(character);
}

function isAllowedSubsequentCharacter(character: string): boolean {
  return /^[A-Za-z0-9_]$/.test(character);
}

export const shapefileDbfProfile: InternalProfile = Object.freeze({
  id: "shapefile-dbf",
  aliases: Object.freeze(["shapefile", "dbf"] as const),
  rules: Object.freeze([
    nonEmpty({
      description: "Must not be empty.",
      assumptions: [ARCGIS_COMPATIBILITY_ASSUMPTION],
      sources: [ESRI_SHAPEFILE_SOURCE],
    }),
    maxCodePoints(10, {
      description: "Must be at most 10 characters.",
      assumptions: [ARCGIS_COMPATIBILITY_ASSUMPTION],
      sources: [ESRI_SHAPEFILE_SOURCE],
    }),
    initialCharacter(isAsciiLetter, {
      description: "Must begin with an ASCII letter.",
      assumptions: [ARCGIS_COMPATIBILITY_ASSUMPTION],
      sources: [ESRI_SHAPEFILE_SOURCE],
    }),
    subsequentCharacters(isAllowedSubsequentCharacter, {
      description:
        "Characters after the first must be ASCII letters, digits, or underscores.",
      assumptions: [ARCGIS_COMPATIBILITY_ASSUMPTION],
      sources: [ESRI_SHAPEFILE_SOURCE],
    }),
  ]),
});
