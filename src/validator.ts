import { resolveProfile } from "./internal/registry.js";
import type {
  FieldNameFormat,
  FieldNameIssue,
  FieldNameRules,
  FieldNameValidationResult,
} from "./types.js";

export function validateFieldName<F extends FieldNameFormat>(
  name: string,
  format: F,
): FieldNameValidationResult<F>;
export function validateFieldName<F extends FieldNameFormat>(
  name: string,
  format: F,
): FieldNameValidationResult<F> {
  if (typeof name !== "string") {
    throw new TypeError("Field name must be a string.");
  }

  const profile = resolveProfile(format);
  const errors = profile.rules
    .map((rule) => rule.evaluate(name))
    .filter((issue): issue is FieldNameIssue => issue !== undefined);

  const [firstError, ...remainingErrors] = errors;
  if (firstError === undefined) {
    return { valid: true, format, errors: [] };
  }

  return {
    valid: false,
    format,
    errors: [firstError, ...remainingErrors],
  };
}

export function isValidFieldName(name: string, format: FieldNameFormat): boolean {
  return validateFieldName(name, format).valid;
}

export function getFieldNameRules<F extends FieldNameFormat>(
  format: F,
): FieldNameRules<F> {
  const profile = resolveProfile(format);

  return {
    format,
    rules: profile.rules.map((rule) => ({
      ...rule.info,
      assumptions: [...rule.info.assumptions],
      sources: rule.info.sources.map((source) => ({ ...source })),
    })),
  };
}
