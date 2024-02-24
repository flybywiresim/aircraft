/**
 * Computes time delta out of absolute env time and previous
 * time debounced on time shift.
 */
export const debouncedTimeDelta = (absTimeSeconds: number, prevTimeSeconds: number): number => {
  const diff = Math.max(absTimeSeconds - prevTimeSeconds, 0);
  // 60s detects forward time-shift
  return diff < 60 ? diff : 0;
};
