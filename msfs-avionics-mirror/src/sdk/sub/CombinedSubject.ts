import { AbstractSubscribable } from './AbstractSubscribable';
import { MappedSubscribable, Subscribable } from './Subscribable';
import { Subscription } from './Subscription';

/**
 * A type which contains the `length` property of a tuple.
 */
// eslint-disable-next-line jsdoc/require-jsdoc
type TupleLength<T extends readonly any[]> = { length: T['length'] };

/**
 * A type which maps a tuple of input types to a tuple of subscribables that provide the input types.
 */
export type CombinedSubscribableInputs<Types extends readonly any[]> = {
  [Index in keyof Types]: Subscribable<Types[Index]>
} & TupleLength<Types>;

/**
 * A subscribable subject whose state is a combined tuple of an arbitrary number of values.
 */
export class CombinedSubject<I extends any[]> extends AbstractSubscribable<Readonly<I>> implements MappedSubscribable<Readonly<I>> {
  private readonly inputs: CombinedSubscribableInputs<I>;
  private readonly inputValues: I;
  private readonly inputSubs: Subscription[];

  private _isAlive = true;
  /** @inheritdoc */
  public get isAlive(): boolean {
    return this._isAlive;
  }

  private _isPaused = false;
  /** @inheritdoc */
  public get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Constructor.
   * @param inputs The subscribables which provide the inputs to this subject.
   */
  private constructor(
    ...inputs: CombinedSubscribableInputs<I>
  ) {
    super();

    this.inputs = inputs;
    this.inputValues = inputs.map(input => input.get()) as I;

    this.inputSubs = this.inputs.map((input, index) => input.sub(inputValue => {
      this.inputValues[index] = inputValue;
      this.notify();
    }));
  }

  /**
   * Creates a new subject whose state is a combined tuple of an arbitrary number of input values.
   * @param inputs The subscribables which provide the inputs to the new subject.
   * @returns A new subject whose state is a combined tuple of the specified input values.
   */
  public static create<I extends any[]>(
    ...inputs: CombinedSubscribableInputs<I>
  ): CombinedSubject<I> {
    return new CombinedSubject<I>(...inputs as any);
  }

  /** @inheritdoc */
  public get(): Readonly<I> {
    return this.inputValues;
  }

  /** @inheritdoc */
  public pause(): void {
    if (!this._isAlive) {
      throw new Error('CombinedSubject: cannot pause a dead subject');
    }

    if (this._isPaused) {
      return;
    }

    for (let i = 0; i < this.inputSubs.length; i++) {
      this.inputSubs[i].pause();
    }

    this._isPaused = true;
  }

  /** @inheritdoc */
  public resume(): void {
    if (!this._isAlive) {
      throw new Error('CombinedSubject: cannot resume a dead subject');
    }

    if (!this._isPaused) {
      return;
    }

    this._isPaused = false;

    for (let i = 0; i < this.inputSubs.length; i++) {
      this.inputValues[i] = this.inputs[i].get();
      this.inputSubs[i].resume();
    }

    this.notify();
  }

  /** @inheritdoc */
  public destroy(): void {
    this._isAlive = false;

    for (let i = 0; i < this.inputSubs.length; i++) {
      this.inputSubs[i].destroy();
    }
  }
}