import { AbstractSubscribableSet } from './AbstractSubscribableSet';
import { MutableSubscribable } from './Subscribable';
import { MutableSubscribableSet, SubscribableSetEventType } from './SubscribableSet';

/**
 * A subscribable set whose keys can be freely added and removed.
 */
export class SetSubject<T> extends AbstractSubscribableSet<T> implements MutableSubscribable<ReadonlySet<T>>, MutableSubscribableSet<T> {
  public readonly isMutableSubscribable = true;
  public readonly isMutableSubscribableSet = true;

  private readonly backingSet: Set<T>;

  /**
   * Constructor.
   * @param initialKeys The keys with which to initialize this set. If not defined, this set will be initialized to the
   * empty set.
   */
  private constructor(initialKeys?: Iterable<T>) {
    super();

    this.backingSet = new Set(initialKeys);
  }

  /**
   * Creates and returns a new SetSubject.
   * @param initialKeys The keys initially contained in the new set. If not undefined, the new set will be initialized
   * to the empty set.
   * @returns A new SetSubject instance.
   */
  public static create<T>(initialKeys?: Iterable<T>): SetSubject<T> {
    return new SetSubject(initialKeys);
  }

  /** @inheritdoc */
  public get(): ReadonlySet<T> {
    return this.backingSet;
  }

  /**
   * Sets the keys contained in this set.
   * @param keys The keys to set.
   */
  public set(keys: Iterable<T>): void {
    const toAdd = new Set(keys);

    for (const key of this.backingSet) {
      if (!toAdd.delete(key)) {
        this.delete(key);
      }
    }

    for (const key of toAdd) {
      this.add(key);
    }
  }

  /** @inheritdoc */
  public add(key: T): this {
    const oldSize = this.backingSet.size;

    this.backingSet.add(key);

    if (oldSize !== this.backingSet.size) {
      this.notify(SubscribableSetEventType.Added, key);
    }

    return this;
  }

  /** @inheritdoc */
  public delete(key: T): boolean {
    const wasDeleted = this.backingSet.delete(key);

    if (wasDeleted) {
      this.notify(SubscribableSetEventType.Deleted, key);
    }

    return wasDeleted;
  }

  /**
   * Removes all keys from this set.
   */
  public clear(): void {
    for (const key of this.backingSet) {
      this.backingSet.delete(key);
      this.notify(SubscribableSetEventType.Deleted, key);
    }
  }
}