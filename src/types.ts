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
  | "RESERVED_KEYWORD"
  | "RESERVED_SYSTEM_COLUMN";

export interface EmptyNameIssue {
  readonly code: "EMPTY_NAME";
  readonly message: string;
  readonly details: Readonly<Record<PropertyKey, never>>;
}

export interface MaxLengthExceededIssue {
  readonly code: "MAX_LENGTH_EXCEEDED";
  readonly message: string;
  readonly details: Readonly<{
    max: number;
    actual: number;
    unit: "utf8-bytes" | "code-points";
  }>;
}

export interface InvalidStartCharacterIssue {
  readonly code: "INVALID_START_CHARACTER";
  readonly message: string;
  readonly details: Readonly<{
    character: string;
    index: number;
    indexUnit: "utf16-code-units";
  }>;
}

export interface InvalidCharacterIssue {
  readonly code: "INVALID_CHARACTER";
  readonly message: string;
  readonly details: Readonly<{
    character: string;
    index: number;
    indexUnit: "utf16-code-units";
  }>;
}

export interface ReservedKeywordIssue {
  readonly code: "RESERVED_KEYWORD";
  readonly message: string;
  readonly details: Readonly<{ keyword: string }>;
}

export interface ReservedSystemColumnIssue {
  readonly code: "RESERVED_SYSTEM_COLUMN";
  readonly message: string;
  readonly details: Readonly<{ column: string }>;
}

export interface RuleSource {
  readonly title: string;
  readonly url: string;
  readonly version: string;
}

export type FieldNameIssue =
  | EmptyNameIssue
  | MaxLengthExceededIssue
  | InvalidStartCharacterIssue
  | InvalidCharacterIssue
  | ReservedKeywordIssue
  | ReservedSystemColumnIssue;

export type IssueForCode<C extends FieldNameIssueCode> = Extract<
  FieldNameIssue,
  { readonly code: C }
>;

export interface ValidFieldNameValidationResult<F extends FieldNameFormat> {
  readonly valid: true;
  readonly format: F;
  readonly errors: readonly [];
}

export interface InvalidFieldNameValidationResult<F extends FieldNameFormat> {
  readonly valid: false;
  readonly format: F;
  readonly errors: readonly [FieldNameIssue, ...FieldNameIssue[]];
}

export type FieldNameValidationResult<F extends FieldNameFormat = FieldNameFormat> =
  | ValidFieldNameValidationResult<F>
  | InvalidFieldNameValidationResult<F>;

export interface FieldNameRuleInfo<C extends FieldNameIssueCode = FieldNameIssueCode> {
  readonly code: C;
  readonly description: string;
  readonly assumptions: readonly string[];
  readonly sources: readonly RuleSource[];
}

export interface FieldNameRules<F extends FieldNameFormat = FieldNameFormat> {
  readonly format: F;
  readonly rules: readonly FieldNameRuleInfo[];
}
