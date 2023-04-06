import { SubscribableArray, SubscribableArrayEventType } from './Subscribable';
/**
 * An array-like class to observe changes in a list of objects.
 * @class ArraySubject
 * @template T
 */
export declare class ArraySubject<T> implements SubscribableArray<T> {
    private _subs;
    private _array;
    private notifyPaused;
    /**
     * Gets the length of the array.
     * @readonly
     * @type {number}
     */
    get length(): number;
    /**
     * Constructs an observable array.
     * @param arr The initial array elements.
     */
    private constructor();
    /**
     * Creates and returns a new observable array.
     * @static
     * @template AT The type of the array items.
     * @param arr The initial array elements.
     * @returns A new instance of SubjectArray.
     */
    static create<AT>(arr?: AT[]): ArraySubject<AT>;
    /**
     * Inserts a new item at the end or the specified index.
     * @param item The item to insert.
     * @param index The optional index to insert the item to. Will add the item at then end if index not given.
     */
    insert(item: T, index?: number): void;
    /**
     * Inserts items of an array beginning at the specified index.
     * @param [index] The index to begin inserting the array items.
     * @param arr The array to insert.
     */
    insertRange(index: number | undefined, arr: readonly T[]): void;
    /**
     * Removes the item at the specified index.
     * @param index The index of the item to remove.
     */
    removeAt(index: number): void;
    /**
     * Removes the given item from the array.
     * @param item The item to remove.
     * @returns Returns a boolean indicating if the item was found and removed.
     */
    removeItem(item: T): boolean;
    /**
     * Replaces all items in the array with the new array.
     * @param arr The array.
     */
    set(arr: readonly T[]): void;
    /**
     * Clears all data in the array.
     */
    clear(): void;
    /**
     * Subscribes to the subject with a callback function. The function will be called whenever this Subject's array
     * changes.
     * @param fn A callback function.
     * @param initialNotify Whether to immediately notify the callback function after it is subscribed. False by default.
     */
    sub(fn: (index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void, initialNotify?: boolean): void;
    /**
     * Unsubscribes a callback function from this Subject.
     * @param fn The callback function to unsubscribe.
     */
    unsub(fn: (index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void): void;
    /**
     * Gets the array.
     * @returns The array.
     */
    getArray(): readonly T[];
    /**
     * Gets an item from the array.
     * @param index Thex index of the item to get.
     * @returns An item.
     * @throws
     */
    get(index: number): T;
    /**
     * Tries to get the value from the array.
     * @param index The index of the item to get.
     * @returns The value or undefined if not found.
     */
    tryGet(index: number): T | undefined;
    /**
     * Notifies the subscribers of a change in the array.
     * @param index The index that was changed.
     * @param type The type of subject event.
     * @param modifiedItem The item modified by the operation.
     * @private
     */
    private notifySubs;
}
//# sourceMappingURL=ArraySubject.d.ts.map