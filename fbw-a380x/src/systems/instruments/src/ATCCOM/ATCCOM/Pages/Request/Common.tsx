export const isInList = (list: string[], id: string): boolean => list.findIndex((value) => value === id) !== -1;

export const atLeastOnElementInList = (reference: string[], list: string[]): boolean => {
  for (let i = 0; i < reference.length; ++i) {
    if (isInList(list, reference[i])) return true;
  }
  return false;
};
