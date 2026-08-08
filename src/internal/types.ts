import type { FieldNameIssue, FieldNameRuleInfo, FieldNameFormat } from "../types.js";

export interface InternalRule {
  readonly info: FieldNameRuleInfo;
  evaluate(name: string): FieldNameIssue | undefined;
}

export interface InternalProfile {
  readonly id: "postgresql" | "shapefile-dbf" | "geopackage-sqlite";
  readonly aliases: readonly FieldNameFormat[];
  readonly rules: readonly InternalRule[];
}
