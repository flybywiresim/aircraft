import { AbstractSubscribable } from './AbstractSubscribable';
import { MutableSubscribable } from './Subscribable';

/** Extracts the type argument from a Subject. */
export type ExtractSubjectType<P> = P extends Subject<infer T> ? T : never;

/** Generates an indexed type with all the Subjects extracted. */
export type ExtractSubjectTypes<P extends { [key: string]: Subject<any> }> = {
  [Key in keyof P]: ExtractSubjectType<P[Key]>;
};

/**
 * A subscribable subject whose value can be freely manipulated.
 */
export class Subject<T> extends AbstractSubscribable<T> implements MutableSubscribable<T> {
  public readonly isMutableSubscribable = true;

  /**
   * Constructs an observable Subject.
   * @param value The initial value.
   * @param equalityFunc The function to use to check for equality.
   * @param mutateFunc The function to use to mutate the subject's value.
   */
  protected constructor(
    protected value: T,
    protected readonly equalityFunc: (a: T, b: T) => boolean,
    protected readonly mutateFunc?: (oldVal: T, newVal: T) => void
  ) {
    super();
  }

  /**
   * Creates and returns a new Subject.
   * @param v The initial value of the subject.
   * @param equalityFunc The function to use to check for equality between subject values. Defaults to the strict
   * equality comparison (`===`).
   * @param mutateFunc The function to use to change the subject's value. If not defined, new values will replace
   * old values by variable assignment.
   * @returns A Subject instance.
   */
  public static create<IT>(
    v: IT,
    equalityFunc?: (a: IT, b: IT) => boolean,
    mutateFunc?: (oldVal: IT, newVal: IT) => void
  ): Subject<IT> {
    return new Subject(v, equalityFunc ?? Subject.DEFAULT_EQUALITY_FUNC, mutateFunc);
  }

  /** @inheritdoc */
  protected notifySub(sub: (v: T) => void): void {
    sub(this.value);
  }

  /**
   * Sets the value of this subject and notifies subscribers if the value changed.
   * @param value The new value.
   */
  public set(value: T): void {
    if (!this.equalityFunc(value, this.value)) {
      if (this.mutateFunc) {
        this.mutateFunc(this.value, value);
      } else {
        this.value = value;
      }

      this.notify();
    }
  }

  /**
   * Applies a partial set of properties to this subject's value and notifies subscribers if the value changed as a
   * result.
   * @param value The properties to apply.
   */
  public apply(value: Partial<T>): void {
    let changed = false;
    for (const prop in value) {
      changed = value[prop] !== this.value[prop];
      if (changed) {
        break;
      }
    }
    Object.assign(this.value, value);
    changed && this.notify();
  }

  /** @inheritdoc */
  public notify(): void {
    super.notify();
  }

  /**
   * Gets the value of this subject.
   * @returns The value of this subject.
   */
  public get(): T {
    return this.value;
  }
}