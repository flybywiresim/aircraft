import { SortedArray } from './datastructures/SortedArray';
import { SubscribableArray, SubscribableArrayEventType } from './Subscribable';

/**
 * A subscribable which provides a sorted version of a source SubscribableArray.
 */
export class SortedMappedSubscribableArray<T> implements SubscribableArray<T> {
  private readonly subs: ((index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void)[] = [];

  private sorted = new SortedArray<T>(this.comparatorFunc, this.equalityFunc);

  private sourceHandler = this.onSourceChanged.bind(this);

  /** @inheritdoc */
  public get length(): number {
    return this.sorted.length;
  }

  /**
   * Constructor.
   * @param source The source array subject for this subscribable.
   * @param comparatorFunc A function which defines the relative sorting priority of two elements. The function should
   * return 0 if its arguments are to be sorted identically, a negative number if the first argument is to be sorted
   * before the second argument, and a positive number if the first argument is to be sorted after the second argument.
   * @param equalityFunc A function which checks if two elements are equal. Defaults to the strict equality comparison
   * (`===`) if not defined.
   */
  private constructor(
    private readonly source: SubscribableArray<T>,
    private readonly comparatorFunc: (a: T, b: T) => number,
    private readonly equalityFunc?: (a: T, b: T) => boolean
  ) {
    source.sub(this.sourceHandler, true);
  }

  /**
   * Responds to changes in this subscribable's source array.
   * @param index The index of the change.
   * @param type The type of change.
   * @param item The item(s) involved in the change, if any.
   */
  private onSourceChanged(index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined): void {
    switch (type) {
      case SubscribableArrayEventType.Cleared:
        if (this.sorted.length !== 0) {
          this.sorted.clear();
          this.notifySubs(0, SubscribableArrayEventType.Cleared);
        }
        break;
      case SubscribableArrayEventType.Added:
        if (item) {
          this.insert(item);
        }
        break;
      case SubscribableArrayEventType.Removed:
        if (item) {
          this.remove(item);
        }
        break;
    }
  }

  /**
   * Inserts elements into this array.
   * @param elements An element or array of elements to insert.
   */
  private insert(elements: T | readonly T[]): void {
    if (this.sorted.length === 0) {
      // since we know all elements will be added to one contiguous index range, we can do a small optimization here
      // with notifications
      elements instanceof Array ? this.sorted.insertAll(elements) : this.sorted.insert(elements);
      this.notifySubs(0, SubscribableArrayEventType.Added, elements instanceof Array ? this.sorted.array : elements);
    } else {
      const sorted = elements instanceof Array ? Array.from(elements).sort(this.comparatorFunc) : [elements];

      const len = sorted.length;
      for (let i = 0; i < len; i++) {
        const toInsert = sorted[i];
        this.notifySubs(this.sorted.insert(toInsert), SubscribableArrayEventType.Added, toInsert);
      }
    }
  }

  /**
   * Removes elements from this array.
   * @param elements An element or array of elements to remove.
   */
  private remove(elements: T | readonly T[]): void {
    const sorted = elements instanceof Array ? Array.from(elements).sort(this.comparatorFunc) : [elements];

    const len = sorted.length;
    for (let i = 0; i < len; i++) {
      const toRemove = sorted[i];
      const removedIndex = this.sorted.remove(toRemove);
      if (removedIndex >= 0) {
        this.notifySubs(removedIndex, SubscribableArrayEventType.Removed, toRemove);
      }
    }
  }

  /**
   * Notifies subscribers of a change in this array.
   * @param index The index that was changed.
   * @param type The type of subject event.
   * @param modifiedItem The item modified by the operation.
   * @private
   */
  private notifySubs(index: number, type: SubscribableArrayEventType, modifiedItem?: T | readonly T[]): void {
    const len = this.subs.length;
    for (let i = 0; i < len; i++) {
      try {
        this.subs[i](index, type, modifiedItem, this.sorted.array);
      } catch (error) {
        console.error(`SortedMappedSubscribableArray: Error in subscriber handler ${error}`);
        if (error instanceof Error) {
          console.error(error.stack);
        }
      }
    }
  }

  /** @inheritdoc */
  public getArray(): readonly T[] {
    return this.sorted.array;
  }

  /** @inheritdoc */
  public get(index: number): T {
    if (index < 0 || index >= this.sorted.length) {
      throw new RangeError(`SortedMappedSubscribableArray: index ${index} out of range`);
    }

    return this.sorted.get(index) as T;
  }

  /** @inheritdoc */
  public tryGet(index: number): T | undefined {
    return this.sorted.get(index);
  }

  /** @inheritdoc */
  public sub(fn: (index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void, initialNotify?: boolean): void {
    this.subs.push(fn);
    initialNotify && fn(0, SubscribableArrayEventType.Added, this.sorted.array, this.sorted.array);
  }

  /** @inheritdoc */
  public unsub(fn: (index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void): void {
    const index = this.subs.indexOf(fn);
    if (index >= 0) {
      this.subs.splice(index, 1);
    }
  }

  /**
   * Destroys this subscribable. After destruction, this subscribable will no longer update in response to changes
   * made to its source.
   */
  public destroy(): void {
    this.source.unsub(this.sourceHandler);
  }

  /**
   * Creates a new SortedMappedSubscribableArray.
   * @param source The source array subject for the new mapped sorted array.
   * @param comparatorFunc A function which defines the relative sorting priority of two elements. The function should
   * return 0 if its arguments are to be sorted identically, a negative number if the first argument is to be sorted
   * before the second argument, and a positive number if the first argument is to be sorted after the second argument.
   * @param equalityFunc A function which checks if two elements are equal. Defaults to the strict equality comparison
   * (`===`) if not defined.
   * @returns A new SortedMappedSubscribableArray.
   */
  public static create<CT>(
    source: SubscribableArray<CT>,
    comparatorFunc: (a: CT, b: CT) => number,
    equalityFunc?: (a: CT, b: CT) => boolean
  ): SortedMappedSubscribableArray<CT> {
    return new SortedMappedSubscribableArray(source, comparatorFunc, equalityFunc);
  }
}