# 更新日志 / Changelog

本项目的重要变更记录在此文件中。

## [Unreleased]

### 新增

- 添加简体中文 README，说明作用范围、API、错误代码、支持的 Profile 与权威规则来源。
- 将简体中文 README 与本更新日志纳入 npm 发布文件。
- 为外部 ESM 和 CommonJS TypeScript 消费者添加包类型解析验证。

### 修复

- 为条件导出分别指定 ESM 的 `.d.ts` 与 CommonJS 的 `.d.cts` 声明文件，避免 Node16 模块解析下 CommonJS TypeScript 消费者出现 TS1479。

## [0.1.0]

### 新增

- 提供 `validateFieldName`、`isValidFieldName` 和 `getFieldNameRules` API。
- 支持 PostgreSQL/PostGIS、Shapefile/DBF 和 GeoPackage/SQLite 的单字段名称校验。
- 提供可扩展的 Profile + Rule 结构与零运行时依赖的 ESM/CommonJS 构建产物。
