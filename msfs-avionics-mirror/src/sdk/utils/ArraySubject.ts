import { SubscribableArray, SubscribableArrayEventType } from './Subscribable';

/**
 * An array-like class to observe changes in a list of objects.
 * @class ArraySubject
 * @template T
 */
export class ArraySubject<T> implements SubscribableArray<T> {
  private _subs: { (index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]): void }[] = [];

  private _array: T[];

  private notifyPaused = false;


  /**
   * Gets the length of the array.
   * @readonly
   * @type {number}
   */
  public get length(): number {
    return this._array.length;
  }

  /**
   * Constructs an observable array.
   * @param arr The initial array elements.
   */
  private constructor(arr: T[]) {
    this._array = arr;
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
    if (index === -1 || index > this._array.length - 1) {
      this._array.push(item);
    } else {
      this._array.splice(index, 0, item);
    }

    this.notifySubs(index, SubscribableArrayEventType.Added, item);
  }

  /**
   * Inserts items of an array beginning at the specified index.
   * @param [index] The index to begin inserting the array items.
   * @param arr The array to insert.
   */
  public insertRange(index = 0, arr: readonly T[]): void {
    this._array.splice(index, 0, ...arr);
    this.notifySubs(index, SubscribableArrayEventType.Added, arr);
  }

  /**
   * Removes the item at the specified index.
   * @param index The index of the item to remove.
   */
  public removeAt(index: number): void {
    const removedItem = this._array.splice(index, 1);
    this.notifySubs(index, SubscribableArrayEventType.Removed, removedItem[0]);
  }

  /**
   * Removes the given item from the array.
   * @param item The item to remove.
   * @returns Returns a boolean indicating if the item was found and removed.
   */
  public removeItem(item: T): boolean {
    const index = this._array.indexOf(item);
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
    this._array.length = 0;
    this.notifySubs(0, SubscribableArrayEventType.Cleared);
  }

  /**
   * Subscribes to the subject with a callback function. The function will be called whenever this Subject's array
   * changes.
   * @param fn A callback function.
   * @param initialNotify Whether to immediately notify the callback function after it is subscribed. False by default.
   */
  public sub(fn: (index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void, initialNotify?: boolean): void {
    this._subs.push(fn);
    if (initialNotify) {
      fn(0, SubscribableArrayEventType.Added, this._array, this._array);
    }
  }

  /**
   * Unsubscribes a callback function from this Subject.
   * @param fn The callback function to unsubscribe.
   */
  public unsub(fn: (index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void): void {
    const index = this._subs.indexOf(fn);
    if (index >= 0) {
      this._subs.splice(index, 1);
    }
  }

  /**
   * Gets the array.
   * @returns The array.
   */
  public getArray(): readonly T[] {
    return this._array;
  }

  /**
   * Gets an item from the array.
   * @param index Thex index of the item to get.
   * @returns An item.
   * @throws
   */
  public get(index: number): T {
    if (index > this._array.length - 1) {
      throw new Error('Index out of range');
    }
    return this._array[index];
  }

  /**
   * Tries to get the value from the array.
   * @param index The index of the item to get.
   * @returns The value or undefined if not found.
   */
  public tryGet(index: number): T | undefined {
    return this._array[index];
  }

  /**
   * Notifies the subscribers of a change in the array.
   * @param index The index that was changed.
   * @param type The type of subject event.
   * @param modifiedItem The item modified by the operation.
   * @private
   */
  private notifySubs(index: number, type: SubscribableArrayEventType, modifiedItem?: T | readonly T[]): void {
    if (!this.notifyPaused) {
      const subLen = this._subs.length;
      for (let i = 0; i < subLen; i++) {
        try {
          this._subs[i](index, type, modifiedItem, this._array);
        } catch (error) {
          console.error(`Error in ArraySubject handler: ${error}`);
          if (error instanceof Error) {
            console.error(error.stack);
          }
        }
      }
    }
  }
}
