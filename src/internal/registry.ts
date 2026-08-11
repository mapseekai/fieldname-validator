import type { FieldNameFormat } from "../types.js";
import type { InternalProfile } from "./types.js";
import { geopackageSqliteProfile } from "./profiles/geopackage-sqlite.js";
import { postgresqlProfile } from "./profiles/postgresql.js";
import { shapefileDbfProfile } from "./profiles/shapefile-dbf.js";

const profilesByFormat = Object.freeze({
  postgresql: postgresqlProfile,
  postgis: postgresqlProfile,
  shapefile: shapefileDbfProfile,
  dbf: shapefileDbfProfile,
  geopackage: geopackageSqliteProfile,
  sqlite: geopackageSqliteProfile,
}) satisfies Readonly<Record<FieldNameFormat, InternalProfile>>;

export function resolveProfile<F extends FieldNameFormat>(
  format: F,
): InternalProfile {
  if (typeof format !== "string") {
    throw new RangeError("Field name format must be a supported string value.");
  }

  if (!Object.prototype.hasOwnProperty.call(profilesByFormat, format)) {
    throw new RangeError(`Unsupported field name format: ${format}`);
  }

  return profilesByFormat[format];
}
