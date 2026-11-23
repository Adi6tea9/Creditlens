export function toPercent(fraction: number, digits = 0): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatFixed(value: number, digits = 1): string {
  return value.toFixed(digits);
}

export function formatOrDash<T>(value: T | null | undefined, format: (value: T) => string): string {
  return value === null || value === undefined ? '—' : format(value);
}
