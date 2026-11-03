import { HttpError } from "./http-error";

export function requiredText(
  value: unknown,
  field: string,
  { min = 1, max = 500 }: { min?: number; max?: number } = {},
): string {
  if (typeof value !== "string") {
    throw new HttpError(400, `${field} is required.`);
  }

  const trimmed = value.trim();

  if (trimmed.length < min) {
    throw new HttpError(400, `${field} must be at least ${min} characters.`);
  }

  if (trimmed.length > max) {
    throw new HttpError(400, `${field} must be ${max} characters or fewer.`);
  }

  return trimmed;
}

export function httpUrl(value: unknown, field: string): string {
  const url = requiredText(value, field, { max: 2048 });

  if (!/^https?:\/\//i.test(url)) {
    throw new HttpError(400, `${field} must start with http:// or https://.`);
  }

  return url;
}

/** Express 5 types route params as `string | string[]`; this normalises them. */
export function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export function wholeNumber(
  value: unknown,
  field: string,
  { min = 1, max = 99 }: { min?: number; max?: number } = {},
): number {
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new HttpError(400, `${field} must be a whole number between ${min} and ${max}.`);
  }

  return parsed;
}
