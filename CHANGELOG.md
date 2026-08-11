# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

## [0.3.0] - 2026-08-11

### Added

- Add `RESERVED_SYSTEM_COLUMN` errors for PostgreSQL system column names, with the canonical lowercase column in `details.column`.
- Add `details.indexUnit: "utf16-code-units"` to invalid-character issues so `details.index` is explicitly usable with JavaScript string indexing and `slice`.
- Add regression contracts for exact public payloads and guards, profile aliases and defensive copies, pinned keyword counts and SHA-256 digests, and package manifest dependency channels.
- Add a lockfile engine compatibility gate and CI coverage for Node.js 18.18.0, 20.9.0, and 22.x.

### Changed

- Model validation results as a `valid`-discriminated union with an empty error tuple for valid results and a non-empty error tuple for invalid results.
- Accept all valid non-ASCII Unicode scalars in PostgreSQL bare identifiers while continuing to reject unpaired UTF-16 surrogates.
- Verify the real npm tarball, its ESM/CommonJS runtime exports, and strict `.mts`/`.cts` consumers during the package acceptance check.
- Pin `typescript-eslint` to the newest 8.x release whose resolved non-optional dependency graph supports the declared Node.js range.
- Document the source-only `skipLibCheck` exception for an upstream Vite/Rollup declaration conflict; packed `.mts`/`.cts` consumers remain strictly checked without it.
- Keep the package intentionally marked `UNLICENSED` until the owner selects a license.

### Fixed

- Correct PostgreSQL rule metadata to describe the same non-ASCII Unicode scalar grammar enforced at runtime.
- Reject `bundleDependencies: true` and malformed non-array bundling declarations instead of treating them as empty.
- Reject malformed ordinary dependency channels unless they are absent or empty plain objects.
- Return before case-folding reserved-keyword and system-name candidates longer than the fixed lookup keys.
- Make `EMPTY_NAME.details` reject extra properties in local and packed consumer type checks.
- Run the missing-`dist` package lifecycle test in an isolated temporary project instead of deleting the repository build output.
- Reject non-string field names and formats with explicit, stable errors at public API boundaries.

## [0.2.0] - 2026-08-09

### Added

- Add Simplified Chinese README covering scope, API, error codes, supported profiles, and authoritative rule sources.
- Include the Simplified Chinese README and this changelog in the npm package files.
- Add package type-resolution verification for external ESM and CommonJS TypeScript consumers.

### Fixed

- Specify separate `.d.ts` (ESM) and `.d.cts` (CommonJS) declaration files for conditional exports, avoiding TS1479 for CommonJS TypeScript consumers under Node16 module resolution.

## [0.1.0]

### Added

- Provide the `validateFieldName`, `isValidFieldName`, and `getFieldNameRules` APIs.
- Support single-field-name validation for PostgreSQL/PostGIS, Shapefile/DBF, and GeoPackage/SQLite.
- Provide an extensible Profile + Rule structure with zero-runtime-dependency ESM/CommonJS builds.
