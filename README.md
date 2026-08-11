# fieldname-validator

[English](README.md) | [简体中文](README.zh-CN.md) | [Changelog](CHANGELOG.md)

Validate one logical field name at a time against a supported database or geospatial interchange profile. Schema-wide, multi-field, type, value, duplicate-name, normalization, and quoting validation are outside this package's scope.

## Installation

```bash
npm install fieldname-validator
```

## Usage

Validate a field name:

```ts
import { validateFieldName } from "fieldname-validator";

const result = validateFieldName("parcel_id", "postgresql");
// { valid: true, format: "postgresql", errors: [] }
```

Invalid names include stable, structured errors in profile rule order:

```ts
validateFieldName("", "postgresql");
// {
//   valid: false,
//   format: "postgresql",
//   errors: [{
//     code: "EMPTY_NAME",
//     message: "Field name must not be empty.",
//     details: {},
//   }],
// }
```

`FieldNameValidationResult` is a discriminated union. Check `result.valid` to
narrow it: `true` guarantees `errors` is the empty tuple, while `false`
guarantees a non-empty error tuple.

The public issue codes are:

| Issue code | Meaning |
| --- | --- |
| `EMPTY_NAME` | The field name is empty. |
| `MAX_LENGTH_EXCEEDED` | The profile's length limit was exceeded. |
| `INVALID_START_CHARACTER` | The first character is not allowed. |
| `INVALID_CHARACTER` | A later character is not allowed. |
| `RESERVED_KEYWORD` | The name matches a profile keyword. |
| `RESERVED_SYSTEM_COLUMN` | The name matches a reserved PostgreSQL system column. |

For `INVALID_START_CHARACTER` and `INVALID_CHARACTER`, `details.index` is a
zero-based UTF-16 code-unit offset and `details.indexUnit` is
`"utf16-code-units"`. This matches JavaScript string indexing, so
`name.slice(details.index)` starts at the reported character even when earlier
characters include supplementary Unicode scalars such as emoji.

Use `isValidFieldName(name, format)` when only the boolean result is needed. Inspect a selected profile's documented rules and source metadata with `getFieldNameRules`:

```ts
import { getFieldNameRules } from "fieldname-validator";

const sqliteRules = getFieldNameRules("sqlite");
console.log(sqliteRules.format); // "sqlite"
console.log(sqliteRules.rules[0]?.sources);
```

Each `getFieldNameRules` call returns independent copies of the rule information, assumptions, and source records.

## Supported profiles

| Aliases | Authority and pinned version | Supported syntax and assumptions | Length limitation | Excluded syntax |
| --- | --- | --- | --- | --- |
| `postgresql`, `postgis` | [PostgreSQL lexical structure](https://www.postgresql.org/docs/18/sql-syntax-lexical.html), [SQL key words](https://www.postgresql.org/docs/18/sql-keywords-appendix.html), and [system columns](https://www.postgresql.org/docs/18/ddl-system-columns.html), PostgreSQL 18 | Raw, unquoted bare identifiers; `_`, ASCII letters, or any valid non-ASCII Unicode scalar may start a name, while ASCII digits and `$` are additionally allowed afterward. Unquoted identifiers fold to lowercase. PostgreSQL system column names (`tableoid`, `xmin`, `cmin`, `xmax`, `cmax`, and `ctid`) are rejected. | 63 UTF-8 bytes, assuming default `NAMEDATALEN=64` and UTF-8 database encoding. | Quoted (delimited) identifier syntax. |
| `shapefile`, `dbf` | [Esri ArcGIS field and table name guidance](https://support.esri.com/en-us/knowledge-base/what-characters-should-not-be-used-in-arcgis-for-field--000005588), published 2024-09-11 | ArcGIS-compatible Shapefile/DBF interchange subset: an ASCII letter first, then ASCII letters, digits, or `_`. | 10 code points (characters). | Other historical DBF dialects. |
| `geopackage`, `sqlite` | [SQLite tokenizer requirements](https://www.sqlite.org/draft/tokenreq.html), [SQLite keywords](https://www.sqlite.org/lang_keywords.html), SQLite 3.53.4; [OGC GeoPackage 1.4.0](https://www.geopackage.org/spec140/) | Raw, unquoted SQLite ID tokens: `_`, ASCII letters, or valid non-ASCII Unicode scalars may start a name; ASCII digits and `$` are additionally allowed afterward. GeoPackage lowercase snake-case portability guidance is documented but not enforced as an error. | No maximum length is enforced. | Quoted (delimited) identifier syntax. |

## Non-goals

- Validating a complete schema or interactions among multiple field names.
- Parsing or validating quoted SQL identifiers.
- Extending profiles or rules through a public runtime API.
- Supporting the removed v1 formats: GeoJSON, GeoParquet, or FlatGeobuf.
- Treating this ArcGIS-compatible Shapefile/DBF subset as support for every historical DBF dialect.

## License status

The package metadata is intentionally `UNLICENSED` until the owner selects a
license. No rights are granted by an open-source license at this time.
