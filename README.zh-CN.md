# fieldname-validator

[English](README.md) | [简体中文](README.zh-CN.md) | [更新日志](CHANGELOG.md)

一个轻量级、零运行时依赖的 TypeScript 字段名称合法性校验库。它只校验**单个字段名本身**是否符合指定数据库或地理空间数据格式的命名规则；不校验字段重名、字段间冲突、字段类型、字段值、完整 schema、标识符规范化或 SQL 引号语法。

## 安装

```bash
npm install fieldname-validator
```

## 基本用法

使用 `validateFieldName` 获取完整结果：

```ts
import { validateFieldName } from "fieldname-validator";

const result = validateFieldName("parcel_id", "postgresql");
// { valid: true, format: "postgresql", errors: [] }
```

不合法的名称会按 Profile 的规则顺序返回稳定的结构化错误：

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

只需要布尔结果时可使用 `isValidFieldName`：

```ts
import { isValidFieldName } from "fieldname-validator";

isValidFieldName("parcel_id", "shapefile"); // true
isValidFieldName("parcel-id", "shapefile"); // false
```

使用 `getFieldNameRules` 查看某个 Profile 的规则说明、前提假设和权威来源：

```ts
import { getFieldNameRules } from "fieldname-validator";

const rules = getFieldNameRules("sqlite");
console.log(rules.format); // "sqlite"
console.log(rules.rules[0]?.sources);
```

每次调用 `getFieldNameRules` 都会返回独立副本，因此修改返回对象不会影响后续校验。

## API

```ts
validateFieldName(name, format): FieldNameValidationResult
isValidFieldName(name, format): boolean
getFieldNameRules(format): FieldNameRules
```

`format` 支持以下值：

```ts
"postgresql" | "postgis" | "shapefile" | "dbf" | "geopackage" | "sqlite"
```

当 `valid` 为 `false` 时，`errors` 中的 `code` 为以下之一：

| 错误代码 | 含义 |
| --- | --- |
| `EMPTY_NAME` | 字段名为空。 |
| `MAX_LENGTH_EXCEEDED` | 超出 Profile 的长度上限。 |
| `INVALID_START_CHARACTER` | 首字符不符合规则。 |
| `INVALID_CHARACTER` | 后续字符中存在不允许的字符。 |
| `RESERVED_KEYWORD` | 命中 Profile 的保留关键字。 |

## 已支持的 Profile

| 格式值（别名） | 校验规则与前提 | 长度限制 | 不包含的语法 |
| --- | --- | --- | --- |
| `postgresql`、`postgis` | 仅接受未加引号的 PostgreSQL 裸标识符：首字符为 Unicode 字母或 `_`；后续可额外使用 ASCII 数字和 `$`；未加引号标识符按小写折叠；拒绝 PostgreSQL 18 保留关键字。依据 [PostgreSQL Lexical Structure](https://www.postgresql.org/docs/18/sql-syntax-lexical.html) 与 [SQL Key Words](https://www.postgresql.org/docs/18/sql-keywords-appendix.html)。 | 默认 `NAMEDATALEN=64`、UTF-8 数据库编码下最多 63 个 UTF-8 字节。 | 加引号（delimited）标识符。 |
| `shapefile`、`dbf` | ArcGIS 兼容的 Shapefile/DBF 交换子集：首字符为 ASCII 字母；后续仅可为 ASCII 字母、数字或 `_`。依据 [Esri 字段与表名称指导](https://support.esri.com/en-us/knowledge-base/what-characters-should-not-be-used-in-arcgis-for-field--000005588)。 | 最多 10 个 Unicode code point（字符）。 | 其他历史 DBF 方言。 |
| `geopackage`、`sqlite` | 仅接受未加引号的 SQLite `ID` token：`_`、ASCII 字母或有效的非 ASCII Unicode scalar 可作首字符；后续可额外使用 ASCII 数字和 `$`；拒绝 SQLite 3.53.4 关键字。GeoPackage 推荐小写 snake_case，但该建议不会产生错误。依据 [SQLite Tokenizer Requirements](https://www.sqlite.org/draft/tokenreq.html)、[SQLite Keywords](https://www.sqlite.org/lang_keywords.html) 和 [OGC GeoPackage 1.4.0](https://www.geopackage.org/spec140/)。 | 不额外设置最大长度。 | 加引号（delimited）标识符。 |

## 非目标与暂不支持的格式

- 完整 schema 或多字段之间的校验，包括重名和冲突。
- 字段类型、字段值、数据库对象存在性或任何关联关系校验。
- 加引号 SQL 标识符的解析与校验。
- 通过公共运行时 API 动态新增 Profile 或规则。
- GeoJSON、GeoParquet 和 FlatGeobuf 的字段名校验。
- 将 ArcGIS 兼容的 Shapefile/DBF 子集视为所有历史 DBF 方言的支持。

## 模块兼容性

发布包同时提供 ESM 与 CommonJS 入口；TypeScript 声明会随导入方式选择相应的 `.d.ts` 或 `.d.cts` 文件。
