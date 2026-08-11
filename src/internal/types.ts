import type {
  FieldNameFormat,
  FieldNameIssueCode,
  FieldNameRuleInfo,
  IssueForCode,
} from "../types.js";

export type RuleMetadata = Omit<FieldNameRuleInfo, "code">;

export interface InternalRule<C extends FieldNameIssueCode> {
  readonly info: FieldNameRuleInfo<C>;
  evaluate(name: string): IssueForCode<C> | undefined;
}

export type InternalRuleForAnyCode = {
  [C in FieldNameIssueCode]: InternalRule<C>;
}[FieldNameIssueCode];

export interface InternalProfile {
  readonly id: "postgresql" | "shapefile-dbf" | "geopackage-sqlite";
  readonly aliases: readonly FieldNameFormat[];
  readonly rules: readonly InternalRuleForAnyCode[];
}
