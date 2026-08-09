# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

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
