# fieldname-validator

Validate one field name at a time; schema-wide and multi-field validation are outside the package scope.

## Supported profiles

| Profiles | Authority | Supported syntax and assumptions | Length limitation | Excluded syntax |
| --- | --- | --- | --- | --- |
| PostgreSQL / PostGIS | [PostgreSQL 18 lexical structure](https://www.postgresql.org/docs/18/sql-syntax-lexical.html) and [SQL key words](https://www.postgresql.org/docs/18/sql-keywords-appendix.html) | Raw, unquoted bare identifiers; Unicode letters and `_` may start a name, while ASCII digits and `$` are additionally allowed afterward; unquoted identifiers fold to lowercase. | 63 UTF-8 bytes, assuming the default PostgreSQL build with `NAMEDATALEN=64`. | Quoted (delimited) identifier syntax. |
| Shapefile / DBF | [Esri ArcGIS field and table name guidance](https://support.esri.com/en-us/knowledge-base/what-characters-should-not-be-used-in-arcgis-for-field--000005588) | ArcGIS-compatible Shapefile/DBF interchange subset: an ASCII letter first, then ASCII letters, digits, or `_`. | 10 characters. | Other historical DBF dialects. |
