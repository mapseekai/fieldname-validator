export type FieldNameFormat =
  | "postgresql"
  | "postgis"
  | "shapefile"
  | "dbf"
  | "geopackage"
  | "sqlite";

export type FieldNameIssueCode =
  | "EMPTY_NAME"
  | "MAX_LENGTH_EXCEEDED"
  | "INVALID_START_CHARACTER"
  | "INVALID_CHARACTER"
  | "RESERVED_KEYWORD";

export interface RuleSource {
  readonly title: string;
  readonly url: string;
  readonly version: string;
}

export interface FieldNameIssue {
  readonly code: FieldNameIssueCode;
  readonly message: string;
  readonly details: Readonly<Record<string, string | number>>;
}

export interface FieldNameValidationResult {
  readonly valid: boolean;
  readonly format: FieldNameFormat;
  readonly errors: readonly FieldNameIssue[];
}

export interface FieldNameRuleInfo {
  readonly code: FieldNameIssueCode;
  readonly description: string;
  readonly assumptions: readonly string[];
  readonly sources: readonly RuleSource[];
}

export interface FieldNameRules {
  readonly format: FieldNameFormat;
  readonly rules: readonly FieldNameRuleInfo[];
}
