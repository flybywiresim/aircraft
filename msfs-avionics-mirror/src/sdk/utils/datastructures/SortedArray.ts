/**
 * A sorted array.
 */
export class SortedArray<T> {
  private static readonly DEFAULT_EQUALITY_FUNC = (a: any, b: any): boolean => a === b;

  private readonly _array: T[] = [];
  // eslint-disable-next-line jsdoc/require-returns
  /** A read-only version of the array object backing this sorted array. */
  public get array(): readonly T[] {
    return this._array;
  }

  /**
   * The number of elements in this array.
   * @returns The number of elements in the array.
   */
  public get length(): number {
    return this._array.length;
  }

  /**
   * Constructor.
   * @param comparatorFunc A function which defines the relative sorting priority of two elements. The function should
   * return 0 if its arguments are to be sorted identically, a negative number if the first argument is to be sorted
   * before the second argument, and a positive number if the first argument is to be sorted after the second argument.
   * @param equalityFunc A function which checks if two elements are equal. Defaults to the strict equality comparison
   * (`===`) if not defined.
   */
  constructor(
    private readonly comparatorFunc: (a: T, b: T) => number,
    private readonly equalityFunc: (a: T, b: T) => boolean = SortedArray.DEFAULT_EQUALITY_FUNC
  ) {
  }

  /**
   * Finds the index of the first or last element in this array whose sorting priority is equal to a query element. If
   * no such element in this array exists, `-(index + 1)` is returned, where `index` is the index at which the query
   * element would be found if it were contained in the array.
   * @param element The query element.
   * @param first Whether to find the first index.
   * @returns The index of the first or last element in this array with the same sorting priority as the query, or
   * `-(index + 1)` if no such element exists, where `index` is the index at which the query element would be found if
   * it were contained in the array.
   */
  private findIndex(element: T, first = true): number {
    let min = 0;
    let max = this._array.length;
    let index = Math.floor((min + max) / 2);

    while (min < max) {
      const compare = this.comparatorFunc(element, this._array[index]);
      if (compare < 0) {
        max = index;
      } else if (compare > 0) {
        min = index + 1;
      } else {
        const delta = first ? -1 : 1;
        while (index + delta >= 0 && index + delta < this._array.length && this.comparatorFunc(element, this._array[index + delta]) === 0) {
          index += delta;
        }
        return index;
      }
      index = Math.floor((min + max) / 2);
    }
    return -(index + 1);
  }

  /**
   * Finds the index of the first element in this array which equals a query element, starting at a specified index.
   * The search proceeds toward the end of the array, ending at the first index containing an element whose sorting
   * priority does not equal the query, or the end of the array, whichever comes first. If no such element in this
   * array exists, -1 is returned instead.
   * @param element The query element.
   * @param startIndex The index at which to start the search.
   * @returns The index of the first element in this array which equals the query element, or -1 if no such element
   * exists.
   */
  private searchEquals(element: T, startIndex: number): number {
    let index = startIndex;
    while (index >= 0 && index < this._array.length && this.comparatorFunc(element, this._array[index]) === 0) {
      if (this.equalityFunc(element, this._array[index])) {
        return index;
      }
      index++;
    }
    return -1;
  }

  /**
   * Gets the element at a specified index, if it exists.
   * @param index An index.
   * @returns The element at the specified index, or undefined if the index is out of bounds.
   */
  public get(index: number): T | undefined {
    return this._array[index];
  }

  /**
   * Gets the first element in this array, if it exists.
   * @returns The first element in this array, or undefined if this array is empty.
   */
  public first(): T | undefined {
    return this._array[0];
  }

  /**
   * Gets the last element in this array, if it exists.
   * @returns The last element in this array, or undefined if this array is empty.
   */
  public last(): T | undefined {
    return this._array[this._array.length - 1];
  }

  /**
   * Checks whether this array contains an element. Returns true if and only if there is at least one element in this
   * array which is equal to the specified element according to this array's equality function.
   * @param element The element to check.
   * @returns Whether this array contains the element.
   */
  public has(element: T): boolean {
    return this.searchEquals(element, this.findIndex(element)) >= 0;
  }

  /**
   * Inserts an element into this array. The element will be inserted at the greatest index such that it is located
   * before all the existing elements in the array sorted after it according to this array's sorting function. All
   * existing elements located at indexes greater than or equal to the index at which the element was inserted are
   * shifted to the right.
   * @param element The element to insert.
   * @returns The index at which the element was placed.
   */
  public insert(element: T): number {
    let index = this.findIndex(element, false);
    if (index < 0) {
      index = -index - 1;
    }
    this._array.splice(index, 0, element);
    return index;
  }

  /**
   * Inserts all elements in an Iterable into this array. Each element is inserted according to the same behavior used
   * by the `insert()` method. If an element appears more than once in the iterable, one instance of that element will
   * be inserted into this array for each time the element appears in the iterable.
   * @param elements An iterable of elements to insert.
   * @returns The number of elements inserted.
   */
  public insertAll(elements: Iterable<T>): number {
    const sorted = Array.from(elements).sort(this.comparatorFunc);

    let toInsertIndex = 0;
    let toInsert = sorted[toInsertIndex];
    const len = this._array.length;
    const insertLen = sorted.length;
    for (let i = 0; i < len && toInsertIndex < insertLen; i++) {
      if (this.comparatorFunc(toInsert, this._array[i]) > 0) {
        this._array.splice(i, 0, toInsert);
        toInsert = sorted[++toInsertIndex];
      }
    }

    for (; toInsertIndex < insertLen; toInsertIndex++) {
      this._array.push(sorted[toInsertIndex]);
    }

    return sorted.length;
  }

  /**
   * Removes the first occurrence of an element from this array. This array is searched for the first element which
   * is equal to the specified element according to this array's equality function, the matching element is removed,
   * and all elements after it are shifted to the left.
   * @param element The element to remove.
   * @returns The (former) index of the removed element, or -1 if no element was removed.
   */
  public remove(element: T): number {
    const index = this.searchEquals(element, this.findIndex(element));
    if (index >= 0) {
      this._array.splice(index, 1);
    }
    return index;
  }

  /**
   * Removes all elements in an Iterable from this array. Each element is removed according to the behavior used by the
   * `remove()` method. If an element appears more than once in the iterable, one instance of that element will be
   * removed from this array for each time the element appears in the iterable.
   * @param elements An iterable of elements to remove.
   * @returns The number of elements removed.
   */
  public removeAll(elements: Iterable<T>): number {
    const sorted = Array.from(elements).sort(this.comparatorFunc);

    let numRemoved = 0;
    let toRemoveIndex = 0;
    let toRemove = sorted[toRemoveIndex];
    const len = this._array.length;
    const removeLen = sorted.length;
    for (let i = 0; i < len && toRemoveIndex < removeLen; i++) {
      if (this.equalityFunc(toRemove, this._array[i])) {
        this._array.splice(i--, 1);
        toRemove = sorted[++toRemoveIndex];
        numRemoved++;
      }
    }

    return numRemoved;
  }

  /**
   * Finds the index of the first occurrence of an element in this array. This array is searched for the first element
   * which is equal to the specified element according to this array's equality function, and its index is returned.
   * @param element The element for which to search.
   * @returns The index of the first occurrence of the specified element, or -1 if no such element was found.
   */
  public indexOf(element: T): number {
    return this.searchEquals(element, this.findIndex(element));
  }

  /**
   * Searches this array for the first element whose sorting priority is equal to a query element. If no such element
   * is found, then undefined is returned instead.
   * @param query The query element.
   * @returns The first element in the array with the same sorting priority as the query, or undefined if no such
   * element exists.
   */
  public match(query: T): T | undefined {
    const index = this.matchIndex(query);
    return this._array[index];
  }

  /**
   * Searches this array for the index of the first element whose sorting priority is equal to a query element. If no
   * such element is found, then `-(index + 1)` is returned instead, where `index` is the index at which the query
   * element would be found if it were contained in the array.
   * @param query The query element.
   * @returns The index of the first element in this array with the same sorting priority as the query, or
   * `-(index + 1)` if no such element exists, where `index` is the index at which the query element would be found if
   * it were contained in the array.
   */
  public matchIndex(query: T): number {
    return this.findIndex(query);
  }

  /**
   * Removes all elements from this array.
   */
  public clear(): void {
    this._array.length = 0;
  }

  /**
   * Gets an IterableIterator over all elements in this array.
   * @returns An IterableIterator over all elements in this array.
   */
  public values(): IterableIterator<T> {
    return this._array.values();
  }

  /** @inheritdoc */
  [Symbol.iterator](): IterableIterator<T> {
    return this._array.values();
  }
}