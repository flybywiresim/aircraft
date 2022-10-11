import { Subscription } from './Subscription';

/**
 * An item which allows others to subscribe to be notified of changes in its state.
 */
export interface Subscribable<T> {
  /** Flags this object as a Subscribable. */
  readonly isSubscribable: true;

  /**
   * Gets the state of this subscribable.
   * @returns the state of this subscribable.
   */
  get(): T;

  /**
   * Subscribes to changes in this subscribable's state.
   * @param handler A function which is called when this subscribable's state changes.
   * @param initialNotify Whether to immediately invoke the callback function with this subscribable's current state.
   * Defaults to `false`. This argument is ignored if the subscription is initialized as paused.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  sub(handler: (value: T) => void, initialNotify?: boolean, paused?: boolean): Subscription;

  /**
   * Unsubscribes a callback function from this subscribable.
   * @param handler The function to unsubscribe.
   * @deprecated This method has been deprecated in favor of using the {@link Subscription} object returned by `.sub()`
   * to manage subscriptions.
   */
  unsub(handler: (value: T) => void): void;

  /**
   * Maps this subscribable to a new subscribable.
   * @param fn The function to use to map to the new subscribable.
   * @param equalityFunc The function to use to check for equality between mapped values. Defaults to the strict
   * equality comparison (`===`).
   * @returns The mapped subscribable.
   */
  map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc?: ((a: M, b: M) => boolean)): MappedSubscribable<M>;
  /**
   * Maps this subscribable to a new subscribable with a persistent, cached value which is mutated when it changes.
   * @param fn The function to use to map to the new subscribable.
   * @param equalityFunc The function to use to check for equality between mapped values.
   * @param mutateFunc The function to use to change the value of the mapped subscribable.
   * @param initialVal The initial value of the mapped subscribable.
   * @returns The mapped subscribable.
   */
  map<M>(
    fn: (input: T, previousVal?: M) => M,
    equalityFunc: ((a: M, b: M) => boolean),
    mutateFunc: ((oldVal: M, newVal: M) => void),
    initialVal: M
  ): MappedSubscribable<M>;

  /**
   * Subscribes to and pipes this subscribable's state to a mutable subscribable. Whenever an update of this
   * subscribable's state is received through the subscription, it will be used as an input to change the other
   * subscribable's state.
   * @param to The mutable subscribable to which to pipe this subscribable's state.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  pipe(to: MutableSubscribable<any, T>, paused?: boolean): Subscription;
  /**
   * Subscribes to this subscribable's state and pipes a mapped version to a mutable subscribable. Whenever an update
   * of this subscribable's state is received through the subscription, it will be transformed by the specified mapping
   * function, and the transformed state will be used as an input to change the other subscribable's state.
   * @param to The mutable subscribable to which to pipe this subscribable's mapped state.
   * @param map The function to use to transform inputs.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  pipe<M>(to: MutableSubscribable<any, M>, map: (input: T) => M, paused?: boolean): Subscription;
}

/**
 * A subscribable which is mapped from another subscribable.
 */
export interface MappedSubscribable<T> extends Subscribable<T> {
  /**
   * Whether the subscription to the parent subscribable is alive. While alive, this subscribable will update its state
   * based on its parent's state, unless it is paused. Once dead, this subscribable will no longer update its state,
   * and cannot be resumed again.
   */
  readonly isAlive: boolean;

  /**
   * Whether the subscription to the parent subscribable is paused. While paused, this subscribable will not update its
   * state until it is resumed.
   */
  readonly isPaused: boolean;

  /**
   * Pauses the subscription to the parent subscribable. Once paused, this subscribable will not update its state until
   * it is resumed.
   * @throws Error if the subscription to the parent subscribable is not alive.
   */
  pause(): void;

  /**
   * Resumes the subscription to the parent subscribable. Once resumed, this subscribable will immediately begin to
   * update its state based its parent's state.
   * @throws Error if the subscription to the parent subscribable is not alive.
   */
  resume(): void;

  /**
   * Destroys the subscription to the parent subscribable.
   */
  destroy(): void;
}

/**
 * A subscribable which can accept inputs to change its state. The state of the subscribable may be derived from the
 * inputs directly or from transformed versions of the inputs.
 */
export interface MutableSubscribable<T, I = T> extends Subscribable<T> {
  /** Flags this object as a MutableSubscribable. */
  readonly isMutableSubscribable: true;

  /**
   * Sets the state of this subscribable.
   * @param value The input used to change the state.
   */
  set(value: I): void;
}

/**
 * Utility type to retrieve the value type of a {@link Subscribable}.
 */
export type SubscribableType<S> = S extends Subscribable<infer T> ? T : never;

/**
 * Utility class for generating common mapping functions.
 */
export class SubscribableMapFunctions {
  /**
   * Generates a function which maps an input to itself.
   * @returns A function which maps an input to itself.
   */
  public static identity<T>(): (input: T) => T {
    return (input: T): T => input;
  }

  /**
   * Generates a function which maps an input boolean to its negation.
   * @returns A function which maps an input boolean to its negation.
   */
  public static not<T extends boolean>(): (input: T, currentVal?: T) => boolean {
    return (input: T): boolean => !input;
  }

  /**
   * Generates a function which maps an input number to its negation.
   * @returns A function which maps an input number to its negation.
   */
  public static negate<T extends number>(): (input: T, currentVal?: T) => number {
    return (input: T): number => -input;
  }

  /**
   * Generates a function which maps an input number to its absolute value.
   * @returns A function which maps an input number to its absolute value.
   */
  public static abs<T extends number>(): (input: T, currentVal?: T) => number {
    return Math.abs;
  }

  /**
   * Generates a function which maps an input number to a rounded version of itself at a certain precision.
   * @param precision The precision to which to round the input.
   * @returns A function which maps an input number to a rounded version of itself at the specified precision.
   */
  public static withPrecision<T extends number>(precision: number): (input: T, currentVal?: T) => number {
    return (input: T): number => {
      return Math.round(input / precision) * precision;
    };
  }

  /**
   * Generates a function which maps an input number to itself if and only if it differs from the previous mapped value
   * by a certain amount, and to the previous mapped value otherwise.
   * @param threshold The minimum difference between the input and the previous mapped value required to map the input
   * to itself.
   * @returns A function which maps an input number to itself if and only if it differs from the previous mapped value
   * by the specified amount, and to the previous mapped value otherwise.
   */
  public static changedBy<T extends number>(threshold: number): (input: T, currentVal?: T) => number {
    return (input: T, currentVal?: T): number => currentVal === undefined || Math.abs(input - currentVal) >= threshold ? input : currentVal;
  }

  /**
   * Generates a function which maps an input number to itself up to a maximum frequency, and to the previous mapped
   * value otherwise.
   * @param freq The maximum frequency at which to map the input to itself, in Hertz.
   * @param timeFunc A function which gets the current time in milliseconds. Defaults to `Date.now()`.
   * @returns A function which maps an input number to itself up to the specified maximum frequency, and to the
   * previous mapped value otherwise.
   */
  public atFrequency<T>(freq: number, timeFunc: () => number = Date.now): (input: T, currentVal?: T) => T {
    const period = 1000 / freq;
    let t0: number;
    let timeRemaining = 0;

    return (input: T, currentVal?: T): T => {
      let returnValue = currentVal ?? input;

      const currentTime = timeFunc();
      const dt = currentTime - (t0 ??= currentTime);

      timeRemaining -= dt;

      if (timeRemaining <= 0) {
        timeRemaining = period + timeRemaining;
        returnValue = input;
      }

      return returnValue;
    };
  }
}