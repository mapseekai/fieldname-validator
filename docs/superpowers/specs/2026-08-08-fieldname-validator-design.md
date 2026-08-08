# fieldname-validator v1 Design

**Date:** 2026-08-08  
**Status:** Approved for planning  
**Language:** TypeScript

## 1. Purpose

`fieldname-validator` is a small, dependency-free runtime library that evaluates **one field name at a time** against the naming requirements of a supported storage format or database.

The library answers only whether a name is valid for the selected format and, if not, why. It does not inspect other fields, values, types, schema definitions, data records, or relationships between names.

## 2. v1 Scope

### Supported formats

| Public format identifier | Canonical internal profile | Scope |
| --- | --- | --- |
| `postgresql`, `postgis` | PostgreSQL | Bare PostgreSQL identifiers; PostGIS uses PostgreSQL identifier rules. |
| `shapefile`, `dbf` | Shapefile/DBF interoperability | ArcGIS-compatible Shapefile/DBF field-name subset. |
| `geopackage`, `sqlite` | GeoPackage/SQLite | Bare SQLite identifiers used by GeoPackage/SQLite. |

The aliases in each row resolve to the same immutable internal profile. The original alias is preserved in the validation result.

### Explicitly excluded from v1

- GeoJSON, GeoParquet, and FlatGeobuf are not exposed as supported formats or no-op profiles.
- Quoted/delimited SQL identifier syntax, including parsing `"quoted names"`.
- Duplicate-name and cross-field collision checks.
- Type, value, schema, metadata, encoding, or data-record validation.
- Automatic renaming, truncation, normalization, escaping, or suggestions.
- Runtime registration of formats, Profiles, or Rules.
- Non-normative style guidance, warnings, or ecosystem conventions that are not v1 requirements.

## 3. Design Principles

1. **Narrow scope:** validate a single name only.
2. **Evidence first:** every enforced rule has a stable, authoritative source reference.
3. **No invented restrictions:** if the selected profile has no documented requirement, v1 does not add one.
4. **Stable public contract:** callers use only the three documented APIs and stable issue codes.
5. **Static and portable:** no runtime network access, no runtime dependencies, and no Node-only runtime APIs.
6. **Data before framework:** use an internal readonly profile registry and small pure rules; do not build a plugin system, inheritance hierarchy, or generic rule DSL.

## 4. Public API

The package exports exactly these functions:

```ts
validateFieldName(name: string, format: FieldNameFormat): FieldNameValidationResult
isValidFieldName(name: string, format: FieldNameFormat): boolean
getFieldNameRules(format: FieldNameFormat): FieldNameRules
```

`FieldNameFormat` is the six-value union listed in the Supported formats table. It is deliberately closed in v1.

### Validation result

`validateFieldName` returns:

- `valid`: `true` only when `errors` is empty.
- `format`: the public format identifier passed by the caller.
- `errors`: a readonly array of field-name issues in deterministic order.

Each issue exposes a stable `code`, user-readable `message`, and structured details appropriate to the rule, such as the maximum length and unit, offending character, or matched keyword. An invalid field name is always represented in this result; it is not an exception.

`isValidFieldName` is a boolean convenience API that follows the same validation path as `validateFieldName`. It must not have a separate implementation of the rule logic.

### Rule information

`getFieldNameRules` returns a readonly, presentation-safe description of the rules actually used by the resolved profile. A rule description includes its stable code, explanation, assumptions, and source URL. It does not expose internal functions, mutable configuration, or any extension mechanism.

### Programmer errors

- A non-string `name` raises `TypeError` at runtime.
- An unsupported `format` raises `RangeError` at runtime.
- These errors describe incorrect API use, not an invalid field name; all string name failures are represented by `FieldNameValidationResult`.

## 5. Internal Architecture

The runtime flow is:

```text
public format alias -> immutable Profile -> ordered pure Rules -> validation result
```

### Profile

A private Profile is static data describing one canonical target. It contains:

- canonical identifier, supported aliases, and display label;
- exact target assumptions, such as bare SQL identifier input and PostgreSQL default build/UTF-8 assumptions;
- source references and source-version notes;
- case behavior information;
- an ordered readonly list of internal Rules.

Profiles are implementation details. They are not exported and cannot be supplied or extended by callers.

### Rule

A private Rule has one responsibility and is implemented as a pure check. It carries:

- stable issue code;
- human-readable explanation;
- authoritative source reference;
- rule-specific parameters where needed;
- a check that returns no issue or one issue for a supplied field name.

Small reusable rule factories handle common cases, including empty name, encoded-byte maximum, allowed-character grammar, starting-character grammar, and reserved keyword membership. A profile may use a narrowly scoped format-specific pure predicate when a reusable factory would obscure the source rule.

This is intentionally a hybrid of declarative profile metadata and pure rule functions. A fully declarative DSL would be harder to keep accurate for SQL grammar and encoded-byte semantics; class-based strategies would add ceremony without serving any v1 requirement.

## 6. Validation Semantics

Rules run in a stable profile-defined order:

1. empty name;
2. length;
3. first character;
4. allowed subsequent characters;
5. reserved keyword.

The validator collects all independent failures. If the name is empty, content-dependent rules do not run, so callers receive one useful failure rather than cascading noise. For a non-empty name, a length, character, and keyword failure may all be returned when independently applicable.

There are no warnings in v1. A documented `SHOULD`, portability suggestion, or application convention is not converted into an invalid result.

Length units are explicit per rule. JavaScript `string.length` must never be used as a surrogate for byte length. No rule changes the supplied string through Unicode normalization, case conversion, truncation, or escaping.

## 7. Format Profiles

### PostgreSQL / PostGIS

This profile validates a logical, unquoted PostgreSQL identifier. It assumes the normal default build where `NAMEDATALEN` is 64 and the database encoding is UTF-8.

Enforced requirements:

- non-empty bare identifier;
- at most 63 UTF-8 bytes;
- PostgreSQL's documented initial and subsequent identifier-character grammar;
- PostgreSQL reserved keyword rejection for bare field names.

PostgreSQL folds unquoted identifiers to lowercase. This is returned through rule information as behavior, not as an invalid-name error: uppercase input is not rejected solely for casing. The profile does not accept quotation marks as part of input; quoted identifiers have distinct grammar and semantics and are out of scope.

PostGIS resolves to this same profile because it relies on PostgreSQL identifier semantics for field names.

Sources:

- [PostgreSQL 18 lexical structure](https://www.postgresql.org/docs/18/sql-syntax-lexical.html)
- [PostgreSQL 18 SQL key words](https://www.postgresql.org/docs/18/sql-keywords-appendix.html)

### Shapefile / DBF

This profile intentionally targets the documented ArcGIS-compatible Shapefile/DBF interchange subset, not every historical or vendor-specific DBF dialect.

Enforced requirements:

- non-empty name;
- maximum length of 10 characters;
- begins with a letter;
- contains only alphanumeric characters and underscores.

v1 does not add a reserved-keyword table or a case rule for this profile because the chosen source does not establish a single format-level requirement appropriate to all DBF variants.

Source:

- [Esri field and table naming guidance](https://support.esri.com/en-us/knowledge-base/what-characters-should-not-be-used-in-arcgis-for-field--000005588)

### GeoPackage / SQLite

This profile validates a logical, unquoted SQLite identifier. GeoPackage is a SQLite database, so SQLite's bare identifier-token and keyword rules are enforced.

Enforced requirements:

- non-empty bare identifier;
- SQLite's documented initial and subsequent identifier-token grammar;
- SQLite keyword rejection for a bare field name.

No fixed identifier-length rule is added. GeoPackage's recommendation to start with lowercase and use lowercase letters, digits, and underscores is a portability `SHOULD`, not a v1 invalid-name condition. The profile does not parse SQLite's quoted identifier forms.

Sources:

- [SQLite tokenizer requirements, pinned to SQLite 3.53.4](https://www.sqlite.org/draft/tokenreq.html)
- [SQLite keyword list, pinned to SQLite 3.53.4](https://www.sqlite.org/lang_keywords.html)
- [OGC GeoPackage 1.4.0 encoding standard](https://www.geopackage.org/spec140/)

## 8. Source and Version Policy

All rule sources are embedded as static metadata and are never fetched at runtime. v1 pins the rule baseline to PostgreSQL 18 with its default `NAMEDATALEN=64` build assumption, SQLite 3.53.4, OGC GeoPackage 1.4.0, and the cited Esri naming guidance. Any source or version upgrade is an explicit code and test change.

Keyword data is packaged as static readonly data pinned to PostgreSQL 18 and SQLite 3.53.4. Updating a keyword set requires source review and regression tests.

## 9. Packaging and Compatibility

- Source is TypeScript.
- The published package ships ESM, CommonJS, and type declarations.
- Runtime dependency count is zero.
- Runtime code stays browser-safe and does not import Node built-ins such as `fs`, `path`, or `Buffer`.
- No source lookup or network request occurs during validation.

## 10. Test Strategy

### Rule tests

Test each reusable rule independently, including empty names, grammar boundaries, keyword case comparison, UTF-8 byte boundaries, and non-ASCII cases relevant to PostgreSQL and SQLite.

### Profile conformance tests

Maintain table-driven valid/invalid examples for every supported canonical Profile and public alias. Examples must trace to the listed source or documented target assumption.

### API contract tests

Verify:

- aliases resolve to the same effective rules;
- errors are ordered deterministically;
- `isValidFieldName(name, format)` agrees with `validateFieldName(name, format).valid`;
- `getFieldNameRules(format)` describes the rules that actually execute;
- invalid API arguments raise the documented exception type;
- no removed format is accepted.

### Publication tests

Run TypeScript type checking, ESM import smoke tests, CommonJS import smoke tests, and a package-metadata assertion that runtime dependencies are absent.

## 11. Known Boundaries and Future Evolution

- PostgreSQL byte-length validation is precise only under the documented UTF-8/default-build assumption. Different server encodings or a custom `NAMEDATALEN` require a future explicit profile or option.
- DBF has historical dialect variation. The v1 Shapefile/DBF profile makes its ArcGIS-compatible target explicit rather than claiming universal DBF coverage.
- Quoted SQL identifiers, broader DBF dialects, format registration, auto-sanitization, warnings, and the removed geospatial formats are future scope only if separately specified.

## 12. Acceptance Criteria

1. The package exposes only the three public APIs and the six supported aliases.
2. The package has no runtime dependencies and works in modern Browser and Node.js environments.
3. PostgreSQL/PostGIS, Shapefile/DBF, and GeoPackage/SQLite rules follow the sources and assumptions above.
4. Names are checked independently; no cross-field, schema, type, or value validation is performed.
5. Every invalid result gives stable, concrete reason codes and messages.
6. `getFieldNameRules` is source-backed and matches executed validation behavior.
7. Removed formats are not advertised or accepted by v1.
