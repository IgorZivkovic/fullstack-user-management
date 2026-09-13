export function parsePositiveIntegerQueryParam(value: string | null): number | undefined {
  if (value === null || !/^\d+$/.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return parsed > 0 ? parsed : undefined;
}
