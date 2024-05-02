export function secondsToHHmmString(seconds: number) {
  const minutesTotal = seconds / 60;
  const hours = Math.abs(Math.floor(minutesTotal / 60))
    .toFixed(0)
    .toString()
    .padStart(2, '0');
  const minutes = Math.abs(minutesTotal % 60)
    .toFixed(0)
    .toString()
    .padStart(2, '0');
  return `${hours}:${minutes}`;
}
