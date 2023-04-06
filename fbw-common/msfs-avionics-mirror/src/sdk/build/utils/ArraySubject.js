import { SubscribableArrayEventType } from './Subscribable';
/**
 * An array-like class to observe changes in a list of objects.
 * @class ArraySubject
 * @template T
 */
export class ArraySubject {
    /**
     * Constructs an observable array.
     * @param arr The initial array elements.
     */
    constructor(arr) {
        this._subs = [];
        this.notifyPaused = false;
        this._array = arr;
    }
    /**
     * Gets the length of the array.
     * @readonly
     * @type {number}
     */
    get length() {
        return this._array.length;
    }
    /**
     * Creates and returns a new observable array.
     * @static
     * @template AT The type of the array items.
     * @param arr The initial array elements.
     * @returns A new instance of SubjectArray.
     */
    static create(arr = []) {
        return new ArraySubject(arr);
    }
    /**
     * Inserts a new item at the end or the specified index.
     * @param item The item to insert.
     * @param index The optional index to insert the item to. Will add the item at then end if index not given.
     */
    insert(item, index = -1) {
        if (index === -1 || index > this._array.length - 1) {
            this._array.push(item);
        }
        else {
            this._array.splice(index, 0, item);
        }
        this.notifySubs(index, SubscribableArrayEventType.Added, item);
    }
    /**
     * Inserts items of an array beginning at the specified index.
     * @param [index] The index to begin inserting the array items.
     * @param arr The array to insert.
     */
    insertRange(index = 0, arr) {
        this._array.splice(index, 0, ...arr);
        this.notifySubs(index, SubscribableArrayEventType.Added, arr);
    }
    /**
     * Removes the item at the specified index.
     * @param index The index of the item to remove.
     */
    removeAt(index) {
        const removedItem = this._array.splice(index, 1);
        this.notifySubs(index, SubscribableArrayEventType.Removed, removedItem[0]);
    }
    /**
     * Removes the given item from the array.
     * @param item The item to remove.
     * @returns Returns a boolean indicating if the item was found and removed.
     */
    removeItem(item) {
        const index = this._array.indexOf(item);
        if (index > -1) {
            this.removeAt(index);
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Replaces all items in the array with the new array.
     * @param arr The array.
     */
    set(arr) {
        this.clear();
        this.insertRange(0, arr);
    }
    /**
     * Clears all data in the array.
     */
    clear() {
        this._array.length = 0;
        this.notifySubs(0, SubscribableArrayEventType.Cleared);
    }
    /**
     * Subscribes to the subject with a callback function. The function will be called whenever this Subject's array
     * changes.
     * @param fn A callback function.
     * @param initialNotify Whether to immediately notify the callback function after it is subscribed. False by default.
     */
    sub(fn, initialNotify) {
        this._subs.push(fn);
        if (initialNotify) {
            fn(0, SubscribableArrayEventType.Added, this._array, this._array);
        }
    }
    /**
     * Unsubscribes a callback function from this Subject.
     * @param fn The callback function to unsubscribe.
     */
    unsub(fn) {
        const index = this._subs.indexOf(fn);
        if (index >= 0) {
            this._subs.splice(index, 1);
        }
    }
    /**
     * Gets the array.
     * @returns The array.
     */
    getArray() {
        return this._array;
    }
    /**
     * Gets an item from the array.
     * @param index Thex index of the item to get.
     * @returns An item.
     * @throws
     */
    get(index) {
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
    tryGet(index) {
        return this._array[index];
    }
    /**
     * Notifies the subscribers of a change in the array.
     * @param index The index that was changed.
     * @param type The type of subject event.
     * @param modifiedItem The item modified by the operation.
     * @private
     */
    notifySubs(index, type, modifiedItem) {
        if (!this.notifyPaused) {
            const subLen = this._subs.length;
            for (let i = 0; i < subLen; i++) {
                try {
                    this._subs[i](index, type, modifiedItem, this._array);
                }
                catch (error) {
                    console.error(`Error in ArraySubject handler: ${error}`);
                    if (error instanceof Error) {
                        console.error(error.stack);
                    }
                }
            }
        }
    }
}
