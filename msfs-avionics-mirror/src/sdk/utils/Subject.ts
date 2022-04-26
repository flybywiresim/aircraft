import { AbstractSubscribable, MappedSubscribable, Subscribable } from './Subscribable';

/**
 * A subscribable subject whose value can be freely manipulated.
 */
export class Subject<T> extends AbstractSubscribable<T> {
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

  /**
   * Maps this subject to a new subscribable.
   * @param fn The function to use to map to the new subscribable.
   * @param equalityFunc The function to use to check for equality between mapped values. Defaults to the strict
   * equality comparison (`===`).
   * @returns The mapped subscribable.
   */
  public map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc?: ((a: M, b: M) => boolean)): MappedSubject<[T], M>;
  /**
   * Maps this subject to a new subscribable with a persistent, cached value which is mutated when it changes.
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
  ): MappedSubject<[T], M>;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public map<M>(
    fn: (input: T, previousVal?: M) => M,
    equalityFunc?: ((a: M, b: M) => boolean),
    mutateFunc?: ((oldVal: M, newVal: M) => void),
    initialVal?: M
  ): MappedSubject<[T], M> {
    const mapFunc = (inputs: readonly [T], previousVal?: M): M => fn(inputs[0], previousVal);
    return mutateFunc
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ? MappedSubject.create(mapFunc, equalityFunc!, mutateFunc, initialVal!, this)
      : MappedSubject.create(mapFunc, equalityFunc ?? AbstractSubscribable.DEFAULT_EQUALITY_FUNC, this);
  }
}

/**
 * A type which contains the `length` property of a tuple.
 */
// eslint-disable-next-line jsdoc/require-jsdoc
type TupleLength<T extends [...any[]]> = { length: T['length'] };

/**
 * A type which maps a tuple of input types to a tuple of subscribables that provide the input types.
 */
export type MappedSubscribableInputs<Types extends [...any[]]> = {
  [Index in keyof Types]: Subscribable<Types[Index]>
} & TupleLength<Types>;

/**
 * A subscribable subject that is a mapped stream from one or more input subscribables.
 */
export class MappedSubject<I extends [...any[]], T> extends AbstractSubscribable<T> implements MappedSubscribable<T> {
  protected readonly inputs: MappedSubscribableInputs<I>;
  protected readonly inputValues: I;

  protected value: T;
  protected readonly mutateFunc: (newVal: T) => void;

  protected readonly inputHandlers: (() => void)[];

  /**
   * Creates a new MappedSubject.
   * @param mapFunc The function which maps this subject's inputs to a value.
   * @param equalityFunc The function which this subject uses to check for equality between values.
   * @param mutateFunc The function which this subject uses to change its value.
   * @param initialVal The initial value of this subject.
   * @param inputs The subscribables which provide the inputs to this subject.
   */
  private constructor(
    protected readonly mapFunc: (inputs: Readonly<I>, previousVal?: T) => T,
    protected readonly equalityFunc: ((a: T, b: T) => boolean),
    mutateFunc?: ((oldVal: T, newVal: T) => void),
    initialVal?: T,
    ...inputs: MappedSubscribableInputs<I>
  ) {
    super();

    this.inputs = inputs;
    this.inputValues = inputs.map(input => input.get()) as I;

    if (initialVal && mutateFunc) {
      this.value = initialVal;
      mutateFunc(this.value, this.mapFunc(this.inputValues));
      this.mutateFunc = (newVal: T): void => { mutateFunc(this.value, newVal); };
    } else {
      this.value = this.mapFunc(this.inputValues);
      this.mutateFunc = (newVal: T): void => { this.value = newVal; };
    }

    this.inputHandlers = this.inputs.map((input, index) => this.updateValue.bind(this, index));
    for (let i = 0; i < inputs.length; i++) {
      inputs[i].sub(this.inputHandlers[i]);
    }
  }

  /**
   * Creates a new mapped subject. Values are compared for equality using the strict equality comparison (`===`).
   * @param mapFunc The function to use to map inputs to the new subject value.
   * @param inputs The subscribables which provide the inputs to the new subject.
   */
  public static create<I extends [...any[]], T>(
    mapFunc: (inputs: Readonly<I>, previousVal?: T) => T,
    ...inputs: MappedSubscribableInputs<I>
  ): MappedSubject<I, T>;
  /**
   * Creates a new mapped subject. Values are compared for equality using a custom function.
   * @param mapFunc The function to use to map inputs to the new subject value.
   * @param equalityFunc The function which the new subject uses to check for equality between values.
   * @param inputs The subscribables which provide the inputs to the new subject.
   */
  public static create<I extends [...any[]], T>(
    mapFunc: (inputs: Readonly<I>, previousVal?: T) => T,
    equalityFunc: (a: T, b: T) => boolean,
    ...inputs: MappedSubscribableInputs<I>
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
  public static create<I extends [...any[]], T>(
    mapFunc: (inputs: Readonly<I>, previousVal?: T) => T,
    equalityFunc: (a: T, b: T) => boolean,
    mutateFunc: (oldVal: T, newVal: T) => void,
    initialVal: T,
    ...inputs: MappedSubscribableInputs<I>
  ): MappedSubject<I, T>;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static create<I extends [...any[]], T>(
    mapFunc: (inputs: Readonly<I>, previousVal?: T) => T,
    ...args: any
  ): MappedSubject<I, T> {
    let equalityFunc, mutateFunc, initialVal;
    if (typeof args[0] === 'function') {
      equalityFunc = args.shift() as (a: T, b: T) => boolean;
    } else {
      equalityFunc = MappedSubject.DEFAULT_EQUALITY_FUNC;
    }

    if (typeof args[0] === 'function') {
      mutateFunc = args.shift() as ((oldVal: T, newVal: T) => void);
      initialVal = args.shift() as T;
    }

    return new MappedSubject<I, T>(mapFunc, equalityFunc, mutateFunc, initialVal, ...args as any);
  }

  /**
   * Updates an input value, then re-maps this subject's value, and notifies subscribers if this results in a change to
   * the mapped value according to this subject's equality function.
   * @param index The index of the input value to update.
   */
  protected updateValue(index: number): void {
    this.inputValues[index] = this.inputs[index].get();

    const value = this.mapFunc(this.inputValues, this.value);
    if (!this.equalityFunc(this.value, value)) {
      this.mutateFunc(value);
      this.notify();
    }
  }

  /**
   * Gets the current value of the subject.
   * @returns The current value.
   */
  public get(): T {
    return this.value;
  }

  /**
   * Destroys the subscription to the parent subscribable.
   */
  public destroy(): void {
    for (let i = 0; i < this.inputs.length; i++) {
      this.inputs[i].unsub(this.inputHandlers[i]);
    }
  }

  /**
   * Maps this subject to a new subscribable.
   * @param fn The function to use to map to the new subscribable.
   * @param equalityFunc The function to use to check for equality between mapped values. Defaults to the strict
   * equality comparison (`===`).
   * @returns The mapped subscribable.
   */
  public map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc?: ((a: M, b: M) => boolean)): MappedSubject<[T], M>;
  /**
   * Maps this subject to a new subscribable with a persistent, cached value which is mutated when it changes.
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
  ): MappedSubject<[T], M>;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public map<M>(
    fn: (input: T, previousVal?: M) => M,
    equalityFunc?: ((a: M, b: M) => boolean),
    mutateFunc?: ((oldVal: M, newVal: M) => void),
    initialVal?: M
  ): MappedSubject<[T], M> {
    const mapFunc = (inputs: readonly [T], previousVal?: M): M => fn(inputs[0], previousVal);
    return new MappedSubject(mapFunc, equalityFunc ?? MappedSubject.DEFAULT_EQUALITY_FUNC, mutateFunc, initialVal, this);
  }
}