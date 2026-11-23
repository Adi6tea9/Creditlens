export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_ROWS = 100_000;

/** Spec 6.4 — a cheap header-aware line count is enough for the demo guard. */
export async function exceedsUploadLimits(file: File): Promise<boolean> {
  if (file.size > MAX_FILE_BYTES) return true;
  const text = await file.text();
  const lines = text.split(/\r\n|\r|\n/).filter((line) => line.trim() !== '');
  return Math.max(0, lines.length - 1) > MAX_ROWS;
}
