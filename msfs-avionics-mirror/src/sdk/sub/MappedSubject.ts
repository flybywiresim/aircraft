import { AbstractSubscribable } from './AbstractSubscribable';
import { CombinedSubject, CombinedSubscribableInputs } from './CombinedSubject';
import { MappedSubscribable, MutableSubscribable } from './Subscribable';
import { Subscription } from './Subscription';

/**
 * A subscribable subject that is a mapped stream from one or more input subscribables.
 */
export class MappedSubject<I extends any[], T> implements MappedSubscribable<T> {
  public readonly isSubscribable = true;

  private readonly input: CombinedSubject<I>;
  private readonly mapped: MappedSubscribable<T>;

  /** @inheritdoc */
  public get isAlive(): boolean {
    return this.input.isAlive;
  }

  /** @inheritdoc */
  public get isPaused(): boolean {
    return this.input.isPaused;
  }

  /**
   * Creates a new MappedSubject.
   * @param mapFunc The function which maps this subject's inputs to a value.
   * @param equalityFunc The function which this subject uses to check for equality between values.
   * @param mutateFunc The function which this subject uses to change its value.
   * @param initialVal The initial value of this subject.
   * @param inputs The subscribables which provide the inputs to this subject.
   */
  private constructor(
    mapFunc: (inputs: Readonly<I>, previousVal?: T) => T,
    equalityFunc: ((a: T, b: T) => boolean),
    mutateFunc?: ((oldVal: T, newVal: T) => void),
    initialVal?: T,
    ...inputs: CombinedSubscribableInputs<I>
  ) {
    this.input = CombinedSubject.create(...inputs) as unknown as CombinedSubject<I>;

    if (initialVal !== undefined && mutateFunc !== undefined) {
      this.mapped = this.input.map(mapFunc, equalityFunc, mutateFunc, initialVal);
    } else {
      this.mapped = this.input.map(mapFunc, equalityFunc);
    }
  }

  /**
   * Creates a new mapped subject. Values are compared for equality using the strict equality comparison (`===`).
   * @param mapFunc The function to use to map inputs to the new subject value.
   * @param inputs The subscribables which provide the inputs to the new subject.
   */
  public static create<I extends any[], T>(
    mapFunc: (inputs: Readonly<I>, previousVal?: T) => T,
    ...inputs: CombinedSubscribableInputs<I>
  ): MappedSubject<I, T>;
  /**
   * Creates a new mapped subject. Values are compared for equality using a custom function.
   * @param mapFunc The function to use to map inputs to the new subject value.
   * @param equalityFunc The function which the new subject uses to check for equality between values.
   * @param inputs The subscribables which provide the inputs to the new subject.
   */
  public static create<I extends any[], T>(
    mapFunc: (inputs: Readonly<I>, previousVal?: T) => T,
    equalityFunc: (a: T, b: T) => boolean,
    ...inputs: CombinedSubscribableInputs<I>
  ): MappedSubject<I, T>;
  /**
   * Creates a new mapped subject with a persistent, cached value which is mutated when it changes. Values are
   * compared for equality using a custom function.
   * @param mapFunc The function to use to map inputs to the new subject value.
   * @param equalityFunc The function which the new subject uses to check for equality between values.
   * @param mutateFunc The function to use to change the value of the new subject.
   * @param initialVal The initial value of the new subject.
   * @param inputs The subscribables which provide the inputs to the new subject.
   */
  public static create<I extends any[], T>(
    mapFunc: (inputs: Readonly<I>, previousVal?: T) => T,
    equalityFunc: (a: T, b: T) => boolean,
    mutateFunc: (oldVal: T, newVal: T) => void,
    initialVal: T,
    ...inputs: CombinedSubscribableInputs<I>
  ): MappedSubject<I, T>;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static create<I extends any[], T>(
    mapFunc: (inputs: Readonly<I>, previousVal?: T) => T,
    ...args: any
  ): MappedSubject<I, T> {
    let equalityFunc, mutateFunc, initialVal;
    if (typeof args[0] === 'function') {
      equalityFunc = args.shift() as (a: T, b: T) => boolean;
    } else {
      equalityFunc = AbstractSubscribable.DEFAULT_EQUALITY_FUNC;
    }

    if (typeof args[0] === 'function') {
      mutateFunc = args.shift() as ((oldVal: T, newVal: T) => void);
      initialVal = args.shift() as T;
    }

    return new MappedSubject<I, T>(mapFunc, equalityFunc, mutateFunc, initialVal, ...args as any);
  }

  /** @inheritdoc */
  public get(): T {
    return this.mapped.get();
  }

  /** @inheritdoc */
  public sub(handler: (v: T) => void, initialNotify = false, paused = false): Subscription {
    return this.mapped.sub(handler, initialNotify, paused);
  }

  /** @inheritdoc */
  public unsub(handler: (v: T) => void): void {
    this.mapped.unsub(handler);
  }

  /**
   * Maps this subscribable to a new subscribable.
   * @param fn The function to use to map to the new subscribable.
   * @param equalityFunc The function to use to check for equality between mapped values. Defaults to the strict
   * equality comparison (`===`).
   * @returns The mapped subscribable.
   */
  public map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc?: ((a: M, b: M) => boolean)): MappedSubscribable<M>;
  /**
   * Maps this subscribable to a new subscribable with a persistent, cached value which is mutated when it changes.
   * @param fn The function to use to map to the new subscribable.
   * @param equalityFunc The function to use to check for equality between mapped values.
   * @param mutateFunc The function to use to change the value of the mapped subscribable.
   * @param initialVal The initial value of the mapped subscribable.
   * @returns The mapped subscribable.
   */
  public map<M>(
    fn: (input: T, previousVal?: M) => M,
    equalityFunc: ((a: M, b: M) => boolean),
    mutateFunc: ((oldVal: M, newVal: M) => void),
    initialVal: M
  ): MappedSubscribable<M>;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public map<M>(
    fn: (input: T, previousVal?: M) => M,
    equalityFunc?: ((a: M, b: M) => boolean),
    mutateFunc?: ((oldVal: M, newVal: M) => void),
    initialVal?: M
  ): MappedSubscribable<M> {
    if (initialVal !== undefined && mutateFunc !== undefined && equalityFunc !== undefined) {
      return this.mapped.map(fn, equalityFunc, mutateFunc, initialVal);
    } else {
      return this.mapped.map(fn, equalityFunc);
    }
  }

  /**
   * Subscribes to and pipes this subscribable's state to a mutable subscribable. Whenever an update of this
   * subscribable's state is received through the subscription, it will be used as an input to change the other
   * subscribable's state.
   * @param to The mutable subscribable to which to pipe this subscribable's state.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  public pipe(to: MutableSubscribable<any, T>, paused?: boolean): Subscription;
  /**
   * Subscribes to this subscribable's state and pipes a mapped version to a mutable subscribable. Whenever an update
   * of this subscribable's state is received through the subscription, it will be transformed by the specified mapping
   * function, and the transformed state will be used as an input to change the other subscribable's state.
   * @param to The mutable subscribable to which to pipe this subscribable's mapped state.
   * @param map The function to use to transform inputs.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  public pipe<M>(to: MutableSubscribable<any, M>, map: (input: T) => M, paused?: boolean): Subscription;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public pipe<M>(to: MutableSubscribable<any, T> | MutableSubscribable<any, M>, arg2?: ((from: T) => M) | boolean, arg3?: boolean): Subscription {
    if (typeof arg2 === 'function') {
      return this.mapped.pipe(to as MutableSubscribable<any, M>, arg2, arg3);
    } else {
      return this.mapped.pipe(to as MutableSubscribable<any, T>, arg2);
    }
  }

  /** @inheritdoc */
  public pause(): void {
    this.input.pause();
  }

  /** @inheritdoc */
  public resume(): void {
    this.input.resume();
  }

  /** @inheritdoc */
  public destroy(): void {
    this.input.destroy();
  }
}