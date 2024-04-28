export function arrayFlat(arr: any[], depth = 1): any[] {
  return depth > 0
    ? arr.reduce((acc, cur) => {
        if (Array.isArray(cur)) {
          acc.push(...arrayFlat(cur, depth - 1));
        } else {
          acc.push(cur);
        }
        return acc;
      }, [])
    : arr.slice();
}
