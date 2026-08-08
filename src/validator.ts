import { resolveProfile } from "./internal/registry.js";
import type {
  FieldNameFormat,
  FieldNameIssue,
  FieldNameRules,
  FieldNameValidationResult,
} from "./types.js";

export function validateFieldName(
  name: string,
  format: FieldNameFormat,
): FieldNameValidationResult {
  if (typeof name !== "string") {
    throw new TypeError("Field name must be a string.");
  }

  const profile = resolveProfile(format);
  const errors = profile.rules
    .map((rule) => rule.evaluate(name))
    .filter((issue): issue is FieldNameIssue => issue !== undefined);

  return {
    valid: errors.length === 0,
    format,
    errors,
  };
}

export function isValidFieldName(name: string, format: FieldNameFormat): boolean {
  return validateFieldName(name, format).valid;
}

export function getFieldNameRules(format: FieldNameFormat): FieldNameRules {
  const profile = resolveProfile(format);

  return {
    format,
    rules: profile.rules.map((rule) => rule.info),
  };
}
