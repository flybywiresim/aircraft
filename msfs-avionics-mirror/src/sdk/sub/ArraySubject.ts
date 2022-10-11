import { AbstractSubscribableArray } from './AbstractSubscribableArray';
import { SubscribableArrayEventType } from './SubscribableArray';

/**
 * An array-like class to observe changes in a list of objects.
 * @class ArraySubject
 * @template T
 */
export class ArraySubject<T> extends AbstractSubscribableArray<T> {
  private array: T[];

  // eslint-disable-next-line jsdoc/require-returns
  /** The length of this array. */
  public get length(): number {
    return this.array.length;
  }

  /**
   * Constructs an observable array.
   * @param arr The initial array elements.
   */
  private constructor(arr: T[]) {
    super();

    this.array = arr;
  }

  /**
   * Creates and returns a new observable array.
   * @static
   * @template AT The type of the array items.
   * @param arr The initial array elements.
   * @returns A new instance of SubjectArray.
   */
  public static create<AT>(arr: AT[] = []): ArraySubject<AT> {
    return new ArraySubject<AT>(arr);
  }

  /**
   * Inserts a new item at the end or the specified index.
   * @param item The item to insert.
   * @param index The optional index to insert the item to. Will add the item at then end if index not given.
   */
  public insert(item: T, index = -1): void {
    if (index === -1 || index > this.array.length - 1) {
      this.array.push(item);
    } else {
      this.array.splice(index, 0, item);
    }

    this.notify(index, SubscribableArrayEventType.Added, item);
  }

  /**
   * Inserts items of an array beginning at the specified index.
   * @param [index] The index to begin inserting the array items.
   * @param arr The array to insert.
   */
  public insertRange(index = 0, arr: readonly T[]): void {
    this.array.splice(index, 0, ...arr);
    this.notify(index, SubscribableArrayEventType.Added, arr);
  }

  /**
   * Removes the item at the specified index.
   * @param index The index of the item to remove.
   */
  public removeAt(index: number): void {
    const removedItem = this.array.splice(index, 1);
    this.notify(index, SubscribableArrayEventType.Removed, removedItem[0]);
  }

  /**
   * Removes the given item from the array.
   * @param item The item to remove.
   * @returns Returns a boolean indicating if the item was found and removed.
   */
  public removeItem(item: T): boolean {
    const index = this.array.indexOf(item);
    if (index > -1) {
      this.removeAt(index);
      return true;
    } else {
      return false;
    }
  }

  /**
   * Replaces all items in the array with the new array.
   * @param arr The array.
   */
  public set(arr: readonly T[]): void {
    this.clear();
    this.insertRange(0, arr);
  }

  /**
   * Clears all data in the array.
   */
  public clear(): void {
    this.array.length = 0;
    this.notify(0, SubscribableArrayEventType.Cleared);
  }

  /**
   * Gets the array.
   * @returns The array.
   */
  public getArray(): readonly T[] {
    return this.array;
  }
}