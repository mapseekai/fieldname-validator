import type { InternalProfile } from "./types.js";
import { geopackageSqliteProfile } from "./profiles/geopackage-sqlite.js";
import { postgresqlProfile } from "./profiles/postgresql.js";
import { shapefileDbfProfile } from "./profiles/shapefile-dbf.js";

const profiles: readonly InternalProfile[] = Object.freeze([
  postgresqlProfile,
  shapefileDbfProfile,
  geopackageSqliteProfile,
]);

export function resolveProfile(format: unknown): InternalProfile {
  if (typeof format !== "string") {
    throw new RangeError("Field name format must be a supported string value.");
  }

  const profile = profiles.find((candidate) =>
    candidate.aliases.some((alias) => alias === format),
  );
  if (profile === undefined) {
    throw new RangeError(`Unsupported field name format: ${format}`);
  }

  return profile;
}
