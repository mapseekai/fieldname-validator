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
| `postgresql`, `postgis` | [PostgreSQL lexical structure](https://www.postgresql.org/docs/18/sql-syntax-lexical.html) and [SQL key words](https://www.postgresql.org/docs/18/sql-keywords-appendix.html), PostgreSQL 18 | Raw, unquoted bare identifiers; Unicode letters and `_` may start a name, while ASCII digits and `$` are additionally allowed afterward. Unquoted identifiers fold to lowercase. | 63 UTF-8 bytes, assuming default `NAMEDATALEN=64` and UTF-8 database encoding. | Quoted (delimited) identifier syntax. |
| `shapefile`, `dbf` | [Esri ArcGIS field and table name guidance](https://support.esri.com/en-us/knowledge-base/what-characters-should-not-be-used-in-arcgis-for-field--000005588), published 2024-09-11 | ArcGIS-compatible Shapefile/DBF interchange subset: an ASCII letter first, then ASCII letters, digits, or `_`. | 10 code points (characters). | Other historical DBF dialects. |
| `geopackage`, `sqlite` | [SQLite tokenizer requirements](https://www.sqlite.org/draft/tokenreq.html), [SQLite keywords](https://www.sqlite.org/lang_keywords.html), SQLite 3.53.4; [OGC GeoPackage 1.4.0](https://www.geopackage.org/spec140/) | Raw, unquoted SQLite ID tokens: `_`, ASCII letters, or valid non-ASCII Unicode scalars may start a name; ASCII digits and `$` are additionally allowed afterward. GeoPackage lowercase snake-case portability guidance is documented but not enforced as an error. | No maximum length is enforced. | Quoted (delimited) identifier syntax. |

## Non-goals

- Validating a complete schema or interactions among multiple field names.
- Parsing or validating quoted SQL identifiers.
- Extending profiles or rules through a public runtime API.
- Supporting the removed v1 formats: GeoJSON, GeoParquet, or FlatGeobuf.
- Treating this ArcGIS-compatible Shapefile/DBF subset as support for every historical DBF dialect.
