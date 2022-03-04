import { Subject } from '../Subject';
import { NumberUnit, NumberUnitInterface, Unit } from './NumberUnit';

/**
 * A Subject which provides a NumberUnitInterface value.
 */
export class NumberUnitSubject<F extends string, U extends Unit<F> = Unit<F>> extends Subject<NumberUnitInterface<F, U>> {
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param value The new value.
   */
  public set(value: NumberUnitInterface<F>): void;
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param value The numeric part of the new value.
   * @param unit The unit type of the new value. Defaults to the unit type of the NumberUnit used to create this
   * subject.
   */
  public set(value: number, unit?: Unit<F>): void;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(arg1: NumberUnitInterface<F> | number, arg2?: Unit<F>): void {
    const isArg1Number = typeof arg1 === 'number';
    const equals = isArg1Number ? this.value.equals(arg1 as number, arg2) : this.value.equals(arg1 as NumberUnitInterface<F>);
    if (!equals) {
      isArg1Number ? (this.value as NumberUnit<F, U>).set(arg1 as number, arg2) : (this.value as NumberUnit<F, U>).set(arg1 as NumberUnitInterface<F>);
      this.notify();
    }
  }

  /**
   * Creates a NumberUnitSubject.
   * @param initialVal The initial value.
   * @returns a NumberUnitSubject.
   */
  public static createFromNumberUnit<F extends string, U extends Unit<F>>(initialVal: NumberUnit<F, U>): NumberUnitSubject<F, U> {
    return new NumberUnitSubject(initialVal, Subject.DEFAULT_EQUALITY_FUNC);
  }
}