/**
 * Utility type to get the family of a unit type.
 */
export type FamilyOfUnit<U extends Unit<string>> = U extends Unit<infer T> ? T : never;

/**
 * Utility type to get the Unit type from a NumberUnit type.
 */
export type UnitOfNumber<N extends NumberUnitInterface<string>> = N extends NumberUnitInterface<string, infer U> ? U : never;

/**
 * A numeric value with unit type.
 */
export interface NumberUnitInterface<F extends string, U extends Unit<F> = Unit<F>> {
  /** This NumberUnit's numeric value. */
  number: number;

  /** This NumberUnit's unit type. */
  unit: U;

  /**
   * Adds a value to this NumberUnit and returns the result.
   * @param value The other value.
   * @param out The NumberUnit to which to write the result.
   * @returns The sum.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  add<OU extends Unit<F>>(value: NumberUnitInterface<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
  /**
   * Adds a value to this NumberUnit and returns the result.
   * @param value The other value.
   * @param unit The unit type of the other value.
   * @param out The NumberUnit to which to write the result.
   * @returns The sum.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  add<OU extends Unit<F>>(value: number, unit: Unit<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;

  /**
   * Subtracts a value from this NumberUnit and returns the result.
   * @param value The other value.
   * @param out The NumberUnit to which to write the result.
   * @returns The difference.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  subtract<OU extends Unit<F>>(value: NumberUnitInterface<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
  /**
   * Subtracts a value from this NumberUnit and returns the result.
   * @param value The other value.
   * @param unit The unit type of the other value.
   * @param out The NumberUnit to which to write the result.
   * @returns The difference.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  subtract<OU extends Unit<F>>(value: number, unit: Unit<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;

  /**
   * Scales this NumberUnit by a unit-less factor and returns the result.
   * @param factor The factor by which to scale.
   * @param out The NumberUnit to which to write the result.
   * @returns The scaled value.
   */
  scale<OU extends Unit<F>>(factor: number, out: NumberUnit<F, OU>): NumberUnit<F, OU>;

  /**
   * Finds the ratio of this NumberUnit to another value.
   * @param value The other value.
   * @returns The ratio.
   * @throws Error if the other value cannot be converted to this NumberUnit's unit type.
   */
  ratio(value: NumberUnitInterface<F>): number;
  /**
   * Finds the ratio of this NumberUnit to another value.
   * @param value The other value.
   * @param unit The unit type of the other value.
   * @returns the ratio.
   * @throws Error if the other value cannot be converted to this NumberUnit's unit type.
   */
  ratio(value: number, unit: Unit<F>): number;

  /**
   * Calculates the absolute value of this NumberUnit and returns the result.
   * @param out The NumberUnit to which to write the result.
   * @returns The absolute value.
   */
  abs<OU extends Unit<F>>(out: NumberUnit<F, OU>): NumberUnit<F, OU>;

  /**
   * Returns the numeric value of this NumberUnit after conversion to a specified unit.
   * @param unit The unit to which to convert.
   * @returns The converted numeric value.
   * @throws Error if this NumberUnit's unit type cannot be converted to the specified unit.
   */
  asUnit(unit: Unit<F>): number;

  /**
   * Checks whether this NumberUnit is greater than, equal to, or less than another value.
   * @param value The other value.
   * @returns 0 if this NumberUnit is equal to the other value, -1 if this number is less, 1 if this number is greater.
   * @throws Error if this NumberUnit cannot be compared to the other value.
   */
  compare(value: NumberUnitInterface<F>): number;
  /**
   * Checks whether this NumberUnit is greater than, equal to, or less than another value.
   * @param value The other value.
   * @param unit The unit type of the other value. Defaults to this NumberUnit's unit type.
   * @returns 0 if this NumberUnit is equal to the other value, -1 if this number is less, 1 if this number is greater.
   * @throws Error if this NumberUnit cannot be compared to the other value.
   */
  compare(value: number, unit?: Unit<F>): number;

  /**
   * Checks whether this NumberUnit is equal to another value.
   * @param value The other value.
   * @returns Whether this NumberUnit is equal to the other value.
   */
  equals(value: NumberUnitInterface<string>): boolean;
  /**
   * Checks whether this NumberUnit is equal to another value.
   * @param value The other value.
   * @param unit The unit type of the other value. Defaults to this NumberUnit's unit type.
   * @returns Whether this NumberUnit is equal to the other value.
   */
  equals(value: number, unit?: Unit<string>): boolean;

  /**
   * Checks whether this NumberUnit has a numeric value of NaN.
   * @returns Whether this NumberUnit has a numeric value of NaN.
   */
  isNaN(): boolean;

  /**
   * Copies this NumberUnit.
   * @returns A copy of this NumberUnit.
   */
  copy(): NumberUnit<F, U>;
}

/**
 * A number with an associated unit. Each NumberUnit is created with a reference unit type,
 * which cannot be changed after instantiation. The reference unit type determines how the
 * value of the NumberUnit is internally represented. Each NumberUnit also maintains an
 * active unit type, which can be dynamically changed at any time.
 */
export class NumberUnit<F extends string, U extends Unit<F> = Unit<F>> implements NumberUnitInterface<F, U> {
  private _number: number;
  private _unit: U;

  public readonly readonly: NumberUnitReadOnly<F, U>;

  /**
   * Constructor.
   * @param number - the initial numeric value of the new NumberUnit.
   * @param unit - the unit type of the new NumberUnit.
   */
  constructor(number: number, unit: U) {
    this._number = number;
    this._unit = unit;
    this.readonly = new NumberUnitReadOnly(this);
  }

  /**
   * Gets this NumberUnit's numeric value.
   * @returns This NumberUnit's numeric value.
   */
  public get number(): number {
    return this._number;
  }

  /**
   * Gets this NumberUnit's unit type.
   * @returns This NumberUnit's unit type.
   */
  public get unit(): U {
    return this._unit;
  }

  /**
   * Converts a value to a numeric value with this NumberUnit's unit type.
   * @param value - the value.
   * @param unit - the unit type of the new value. Defaults to this NumberUnit's unit type. This argument is ignored if
   * value is a NumberUnit.
   * @returns the numeric of the value with this NumberUnit's unit type.
   */
  private toNumberOfThisUnit(value: NumberUnitInterface<string> | number, unit?: Unit<string>): number | undefined {
    if ((typeof value !== 'number') && this.unit.canConvert(value.unit)) {
      return this.unit.convertFrom(value.number, value.unit as Unit<F>);
    }
    if (typeof value === 'number' && (!unit || this.unit.canConvert(unit))) {
      return unit ? this.unit.convertFrom(value, unit as Unit<F>) : value;
    }
    return undefined;
  }

  /**
   * Sets this NumberUnit's numeric value. This method will not change this NumberUnit's unit type. If the supplied
   * value cannot be converted to this NumberUnit's unit type, this NumberUnit will not be changed and this method will
   * return undefined.
   * @param value - the new value.
   * @returns this NumberUnit, after it has been changed, or undefined if the operation could not be carried out.
   */
  public set(value: NumberUnitInterface<F>): this;
  /**
   * Sets this NumberUnit's numeric value. This method will not change this NumberUnit's unit type.
   * @param value - the new value.
   * @param unit - the unit type of the new value. Defaults to this NumberUnit's unit type.
   * @returns this NumberUnit, after it has been changed.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  public set(value: number, unit?: Unit<F>): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(arg1: NumberUnitInterface<F> | number, arg2?: Unit<F>): this {
    const converted = this.toNumberOfThisUnit(arg1, arg2);
    if (converted !== undefined) {
      this._number = converted;
      return this;
    }
    throw new Error('Invalid unit conversion attempted.');
  }

  /**
   * Adds a value to this NumberUnit and returns the result.
   * @param value The other value.
   * @param out The NumberUnit to which to write the result.
   * @returns The sum.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  public add<OU extends Unit<F>>(value: NumberUnitInterface<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
  /**
   * Adds a value to this NumberUnit in place and returns the result.
   * @param value The other value.
   * @returns The sum.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  public add(value: NumberUnitInterface<F>): this;
  /**
   * Adds a value to this NumberUnit and returns the result.
   * @param value The other value.
   * @param unit The unit type of the other value.
   * @param out The NumberUnit to which to write the result.
   * @returns The sum.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  public add<OU extends Unit<F>>(value: number, unit: Unit<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
  /**
   * Adds a value to this NumberUnit in place and returns the result.
   * @param value The other value.
   * @param unit The unit type of the other value.
   * @returns The sum.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  public add(value: number, unit: Unit<F>): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public add<OU extends Unit<F>>(arg1: NumberUnitInterface<F> | number, arg2?: Unit<F> | NumberUnit<F, OU>, arg3?: NumberUnit<F, OU>): NumberUnit<F, OU> | this {
    const isArg2NumberUnit = arg2 instanceof NumberUnit;
    const converted = this.toNumberOfThisUnit(arg1, isArg2NumberUnit ? undefined : arg2 as Unit<F>);
    if (converted !== undefined) {
      let out: NumberUnit<F, OU> | this | undefined = isArg2NumberUnit ? arg2 as NumberUnit<F, OU> : arg3;
      if (out) {
        out.set(this.number + converted, this.unit);
      } else {
        out = this;
        this._number += converted;
      }
      return out;
    }
    throw new Error('Invalid unit conversion attempted.');
  }

  /**
   * Subtracts a value from this NumberUnit and returns the result.
   * @param value The other value.
   * @param out The NumberUnit to which to write the result.
   * @returns The difference.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  public subtract<OU extends Unit<F>>(value: NumberUnitInterface<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
  /**
   * Subtracts a value from this NumberUnit in place and returns the result.
   * @param value The other value.
   * @param out The NumberUnit to which to write the result. Defaults to this NumberUnit.
   * @returns The difference.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  public subtract(value: NumberUnitInterface<F>): this;
  /**
   * Subtracts a value from this NumberUnit and returns the result.
   * @param value The other value.
   * @param unit The unit type of the other value.
   * @param out The NumberUnit to which to write the result.
   * @returns The difference.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  public subtract<OU extends Unit<F>>(value: number, unit: Unit<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
  /**
   * Subtracts a value from this NumberUnit in place and returns the result.
   * @param value The other value.
   * @param unit The unit type of the other value.
   * @returns The difference.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  public subtract(value: number, unit: Unit<F>): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public subtract<OU extends Unit<F>>(arg1: NumberUnitInterface<F> | number, arg2?: Unit<F> | NumberUnit<F, OU>, arg3?: NumberUnit<F, OU>): NumberUnit<F, OU> | this {
    const isArg2NumberUnit = arg2 instanceof NumberUnit;
    const converted = this.toNumberOfThisUnit(arg1, isArg2NumberUnit ? undefined : arg2 as Unit<F>);
    if (converted !== undefined) {
      let out: NumberUnit<F, OU> | this | undefined = isArg2NumberUnit ? arg2 as NumberUnit<F, OU> : arg3;
      if (out) {
        out.set(this.number - converted, this.unit);
      } else {
        out = this;
        this._number -= converted;
      }
      return out;
    }
    throw new Error('Invalid unit conversion attempted.');
  }

  /**
   * Scales this NumberUnit by a unit-less factor and returns the result.
   * @param factor The factor by which to scale.
   * @param out The NumberUnit to which to write the result.
   * @returns The scaled value.
   */
  public scale<OU extends Unit<F>>(factor: number, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
  /**
   * Scales this NumberUnit by a unit-less factor in place and returns the result.
   * @param factor The factor by which to scale.
   * @param out The NumberUnit to which to write the result.
   * @returns The scaled value.
   */
  public scale(factor: number): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public scale<OU extends Unit<F>>(factor: number, out?: NumberUnit<F, OU>): NumberUnit<F, OU> | this {
    if (out) {
      return out.set(this.number * factor, this.unit);
    } else {
      this._number *= factor;
      return this;
    }
  }

  /**
   * Finds the ratio of this NumberUnit to another value.
   * @param value The other value.
   * @returns The ratio.
   * @throws Error if the other value cannot be converted to this NumberUnit's unit type.
   */
  public ratio(value: NumberUnitInterface<F>): number;
  /**
   * Finds the ratio of this NumberUnit to another value.
   * @param value The other value.
   * @param unit The unit type of the other value.
   * @returns the ratio.
   * @throws Error if the other value cannot be converted to this NumberUnit's unit type.
   */
  public ratio(value: number, unit: Unit<F>): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public ratio(value: NumberUnitInterface<F> | number, unit?: Unit<F>): number {
    const converted = this.toNumberOfThisUnit(value, unit);
    if (converted) {
      return this.number / converted;
    }
    throw new Error('Invalid unit conversion attempted.');
  }

  /**
   * Calculates the absolute value of this NumberUnit and returns the result.
   * @param out The NumberUnit to which to write the result.
   * @returns The absolute value.
   */
  public abs<OU extends Unit<F>>(out: NumberUnit<F, OU>): NumberUnit<F, OU>;
  /**
   * Calculates the absolute value of this NumberUnit in place and returns the result.
   * @returns The absolute value.
   */
  public abs(): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public abs<OU extends Unit<F>>(out?: NumberUnit<F, OU>): NumberUnit<F, OU> | this {
    if (out) {
      return out.set(Math.abs(this.number), this.unit);
    } else {
      this._number = Math.abs(this._number);
      return this;
    }
  }

  /**
   * Returns the numeric value of this NumberUnit after conversion to a specified unit.
   * @param unit The unit to which to convert.
   * @returns The converted numeric value.
   * @throws Error if this NumberUnit's unit type cannot be converted to the specified unit.
   */
  public asUnit(unit: Unit<F>): number {
    return this.unit.convertTo(this.number, unit);
  }

  /**
   * Checks whether this NumberUnit is greater than, equal to, or less than another value.
   * @param value The other value.
   * @returns 0 if this NumberUnit is equal to the other value, -1 if this number is less, 1 if this number is greater.
   * @throws Error if this NumberUnit cannot be compared to the other value.
   */
  public compare(value: NumberUnitInterface<F>): number;
  /**
   * Checks whether this NumberUnit is greater than, equal to, or less than another value.
   * @param value The other value.
   * @param unit The unit type of the other value. Defaults to this NumberUnit's unit type.
   * @returns 0 if this NumberUnit is equal to the other value, -1 if this number is less, 1 if this number is greater.
   * @throws Error if this NumberUnit cannot be compared to the other value.
   */
  public compare(value: number, unit?: Unit<F>): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public compare(value: NumberUnitInterface<F> | number, unit?: Unit<F>): number {
    const converted = this.toNumberOfThisUnit(value, unit);
    if (converted === undefined) {
      throw new Error('Invalid unit conversion attempted.');
    }

    const diff = this.number - converted;
    if (Math.abs(diff) < 1e-14) {
      return 0;
    }
    return Math.sign(diff);
  }

  /**
   * Checks whether this NumberUnit is equal to another value.
   * @param value The other value.
   * @returns Whether this NumberUnit is equal to the other value.
   */
  public equals(value: NumberUnitInterface<string>): boolean;
  /**
   * Checks whether this NumberUnit is equal to another value.
   * @param value The other value.
   * @param unit The unit type of the other value. Defaults to this NumberUnit's unit type.
   * @returns Whether this NumberUnit is equal to the other value.
   */
  public equals(value: number, unit?: Unit<string>): boolean;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public equals(value: NumberUnitInterface<string> | number, unit?: Unit<string>): boolean {
    const converted = this.toNumberOfThisUnit(value, unit);
    if (converted === undefined) {
      return false;
    }

    const diff = this.number - converted;
    return Math.abs(diff) < 1e-14;
  }

  /**
   * Checks whether this NumberUnit has a numeric value of NaN.
   * @returns Whether this NumberUnit has a numeric value of NaN.
   */
  public isNaN(): boolean {
    return isNaN(this.number);
  }

  /**
   * Copies this NumberUnit.
   * @returns A copy of this NumberUnit.
   */
  public copy(): NumberUnit<F, U> {
    return new NumberUnit(this.number, this.unit);
  }
}

/**
 * A read-only interface for a WT_NumberUnit.
 */
export class NumberUnitReadOnly<F extends string, U extends Unit<F> = Unit<F>> implements NumberUnitInterface<F, U> {
  /**
   * Constructor.
   * @param source - the source of the new read-only NumberUnit.
   */
  constructor(private readonly source: NumberUnit<F, U>) {
  }

  /**
   * Gets this NumberUnit's numeric value.
   * @returns This NumberUnit's numeric value.
   */
  public get number(): number {
    return this.source.number;
  }

  /**
   * Gets this NumberUnit's unit type.
   * @returns This NumberUnit's unit type.
   */
  public get unit(): U {
    return this.source.unit;
  }

  /**
   * Adds a value to this NumberUnit and returns the result.
   * @param value The other value.
   * @param out The NumberUnit to which to write the result.
   * @returns The sum.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  public add<OU extends Unit<F>>(value: NumberUnitInterface<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
  /**
   * Adds a value to this NumberUnit and returns the result.
   * @param value The other value.
   * @param unit The unit type of the other value.
   * @param out The NumberUnit to which to write the result.
   * @returns The sum.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  public add<OU extends Unit<F>>(value: number, unit: Unit<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public add<OU extends Unit<F>>(arg1: NumberUnitInterface<F> | number, arg2?: Unit<F> | NumberUnit<F, OU>, arg3?: NumberUnit<F, OU>): NumberUnit<F, OU> {
    const isArg2NumberUnit = arg2 instanceof NumberUnit;
    const out = (isArg2NumberUnit ? arg2 : arg3) as NumberUnit<F, OU>;

    if (typeof arg1 === 'number') {
      return this.source.add(arg1, arg2 as Unit<F>, out);
    } else {
      return this.source.add(arg1 as NumberUnitInterface<F>, out);
    }
  }

  /**
   * Subtracts a value from this NumberUnit and returns the result.
   * @param value The other value.
   * @param out The NumberUnit to which to write the result.
   * @returns The difference.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  public subtract<OU extends Unit<F>>(value: NumberUnitInterface<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
  /**
   * Subtracts a value from this NumberUnit and returns the result.
   * @param value The other value.
   * @param unit The unit type of the other value.
   * @param out The NumberUnit to which to write the result.
   * @returns The difference.
   * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
   */
  public subtract<OU extends Unit<F>>(value: number, unit: Unit<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public subtract<OU extends Unit<F>>(arg1: NumberUnitInterface<F> | number, arg2?: Unit<F> | NumberUnit<F, OU>, arg3?: NumberUnit<F, OU>): NumberUnit<F, OU> {
    const isArg2NumberUnit = arg2 instanceof NumberUnit;
    const out = (isArg2NumberUnit ? arg2 : arg3) as NumberUnit<F, OU>;

    if (typeof arg1 === 'number') {
      return this.source.subtract(arg1, arg2 as Unit<F>, out);
    } else {
      return this.source.subtract(arg1 as NumberUnitInterface<F>, out);
    }
  }

  /**
   * Scales this NumberUnit by a unit-less factor and returns the result.
   * @param factor The factor by which to scale.
   * @param out The NumberUnit to which to write the result.
   * @returns The scaled value.
   */
  public scale<OU extends Unit<F>>(factor: number, out: NumberUnit<F, OU>): NumberUnit<F, OU> {
    return this.source.scale(factor, out);
  }

  /**
   * Finds the ratio of this NumberUnit to another value.
   * @param value The other value.
   * @returns The ratio.
   * @throws Error if the other value cannot be converted to this NumberUnit's unit type.
   */
  public ratio(value: NumberUnitInterface<F>): number;
  /**
   * Finds the ratio of this NumberUnit to another value.
   * @param value The other value.
   * @param unit The unit type of the other value.
   * @returns the ratio.
   * @throws Error if the other value cannot be converted to this NumberUnit's unit type.
   */
  public ratio(value: number, unit: Unit<F>): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public ratio(arg1: NumberUnitInterface<F> | number, arg2?: Unit<F>): number {
    if (typeof arg1 === 'number') {
      return this.source.ratio(arg1, arg2 as Unit<F>);
    } else {
      return this.source.ratio(arg1 as NumberUnitInterface<F>);
    }
  }

  /**
   * Calculates the absolute value of this NumberUnit and returns the result.
   * @param out The NumberUnit to which to write the result.
   * @returns The absolute value.
   */
  public abs<OU extends Unit<F>>(out: NumberUnit<F, OU>): NumberUnit<F, OU> {
    return this.source.abs(out);
  }

  /**
   * Returns the numeric value of this NumberUnit after conversion to a specified unit.
   * @param unit The unit to which to convert.
   * @returns The converted numeric value.
   * @throws Error if this NumberUnit's unit type cannot be converted to the specified unit.
   */
  public asUnit(unit: Unit<F>): number {
    return this.source.asUnit(unit);
  }

  /**
   * Checks whether this NumberUnit is greater than, equal to, or less than another value.
   * @param value The other value.
   * @returns 0 if this NumberUnit is equal to the other value, -1 if this number is less, 1 if this number is greater.
   * @throws Error if this NumberUnit cannot be compared to the other value.
   */
  public compare(value: NumberUnitInterface<F>): number;
  /**
   * Checks whether this NumberUnit is greater than, equal to, or less than another value.
   * @param value The other value.
   * @param unit The unit type of the other value. Defaults to this NumberUnit's unit type.
   * @returns 0 if this NumberUnit is equal to the other value, -1 if this number is less, 1 if this number is greater.
   * @throws Error if this NumberUnit cannot be compared to the other value.
   */
  public compare(value: number, unit?: Unit<F>): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public compare(arg1: NumberUnitInterface<F> | number, arg2?: Unit<F>): number {
    if (typeof arg1 === 'number') {
      return this.source.compare(arg1, arg2 as Unit<F>);
    } else {
      return this.source.compare(arg1 as NumberUnitInterface<F>);
    }
  }

  /**
   * Checks whether this NumberUnit is equal to another value.
   * @param value The other value.
   * @returns Whether this NumberUnit is equal to the other value.
   */
  public equals(value: NumberUnitInterface<string>): boolean;
  /**
   * Checks whether this NumberUnit is equal to another value.
   * @param value The other value.
   * @param unit The unit type of the other value. Defaults to this NumberUnit's unit type.
   * @returns Whether this NumberUnit is equal to the other value.
   */
  public equals(value: number, unit?: Unit<string>): boolean;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public equals(arg1: NumberUnitInterface<string> | number, arg2?: Unit<string>): boolean {
    if (typeof arg1 === 'number') {
      return this.source.equals(arg1, arg2 as Unit<string>);
    } else {
      return this.source.equals(arg1 as NumberUnitInterface<string>);
    }
  }

  /**
   * Checks whether this NumberUnit has a numeric value of NaN.
   * @returns Whether this NumberUnit has a numeric value of NaN.
   */
  public isNaN(): boolean {
    return this.source.isNaN();
  }

  /**
   * Copies this NumberUnit.
   * @returns A copy of this NumberUnit.
   */
  public copy(): NumberUnit<F, U> {
    return this.source.copy();
  }
}

/**
 * A unit of measurement.
 */
export interface Unit<F extends string> {
  /** This unit's family. */
  readonly family: F;

  /** This unit's name. */
  readonly name: string;

  /**
   * Checks whether conversions between this unit and another unit are possible.
   * @param otherUnit The other unit.
   * @returns Whether conversions between this unit and another unit are possible.
   */
  canConvert(otherUnit: Unit<string>): boolean;

  /**
   * Converts a value of this unit to another unit.
   * @param value The value to convert.
   * @param toUnit The unit to which to convert.
   * @returns The converted value.
   * @throws Error if attempting an invalid conversion.
   */
  convertTo(value: number, toUnit: Unit<F>): number;

  /**
   * Converts a value of another unit to this unit.
   * @param value The value to convert.
   * @param fromUnit The unit from which to convert.
   * @returns The converted value.
   * @throws Error if attempting an invalid conversion.
   */
  convertFrom(value: number, fromUnit: Unit<F>): number;

  /**
   * Creates a NumberUnit with a specified initial value of this unit type.
   * @param value The numeric value of the new NumberUnit.
   * @returns A NumberUnit of this unit type.
   */
  createNumber(value: number): NumberUnit<F, this>;

  /**
   * Checks whether this unit is equal to another unit. Returns true if and only if the other unit belongs to the same
   * family and has the same name as this unit.
   * @param other The other unit to which to compare.
   * @returns Whether this unit is equal to the comparison.
   */
  equals(other: Unit<string>): boolean;
}

/**
 * A unit type that can be compounded.
 */
export interface CompoundableUnit<F extends string> extends Unit<F> {
  /** The relative linear scale of this unit compared to the standard unit of the same family. */
  readonly scaleFactor: number;
}

/**
 * A unit of measurement.
 */
export abstract class AbstractUnit<F extends string> implements Unit<F> {
  public abstract readonly family: F;

  /**
   * Constructor.
   * @param name The name of this unit.
   */
  constructor(public readonly name: string) {
  }

  /** @inheritdoc */
  public canConvert(otherUnit: Unit<string>): boolean {
    return this.family === otherUnit.family;
  }

  /** @inheritdoc */
  public abstract convertTo(value: number, toUnit: Unit<F>): number;

  /** @inheritdoc */
  public abstract convertFrom(value: number, fromUnit: Unit<F>): number;

  /** @inheritdoc */
  public createNumber(value: number): NumberUnit<F, this> {
    return new NumberUnit<F, this>(value, this);
  }

  /** @inheritdoc */
  public equals(other: Unit<string>): boolean {
    return this.family === other.family && this.name === other.name;
  }
}

/**
 * A unit that can be converted to another unit of the same type via a fixed linear transformation.
 */
export class SimpleUnit<F extends string> extends AbstractUnit<F> implements CompoundableUnit<F> {
  /**
   * Constructor.
   * @param family The family to which this unit belongs.
   * @param name The name of this unit.
   * @param scaleFactor The relative linear scale of the new unit compared to the standard unit of the same family.
   * @param zeroOffset The zero offset of the new unit compared to the standard unit of the same family.
   */
  constructor(
    public readonly family: F,
    name: string,
    public readonly scaleFactor: number,
    public readonly zeroOffset: number = 0
  ) {
    super(name);
  }

  /** @inheritdoc */
  public canConvert(otherUnit: Unit<string>): boolean {
    return otherUnit instanceof SimpleUnit && super.canConvert(otherUnit);
  }

  /** @inheritdoc */
  public convertTo(value: number, toUnit: Unit<F>): number {
    if (!this.canConvert(toUnit)) {
      throw new Error(`Invalid conversion from ${this.name} to ${toUnit.name}.`);
    }

    return (value + this.zeroOffset) * (this.scaleFactor / (toUnit as SimpleUnit<F>).scaleFactor) - (toUnit as SimpleUnit<F>).zeroOffset;
  }

  /** @inheritdoc */
  public convertFrom(value: number, fromUnit: Unit<F>): number {
    if (!this.canConvert(fromUnit)) {
      throw new Error(`Invalid conversion from ${fromUnit.name} to ${this.name}.`);
    }

    return (value + (fromUnit as SimpleUnit<F>).zeroOffset) * ((fromUnit as SimpleUnit<F>).scaleFactor / this.scaleFactor) - this.zeroOffset;
  }
}

/**
 * A unit of measure composed of the multiplicative combination of multiple elementary units.
 */
export class CompoundUnit<F extends string> extends AbstractUnit<F> {
  public readonly family: F;

  private readonly numerator: CompoundableUnit<string>[];
  private readonly denominator: CompoundableUnit<string>[];
  protected readonly scaleFactor: number;

  /**
   * Constructor.
   * @param family The family to which this unit belongs.
   * @param numerator An array of CompoundableUnits containing all the units in the numerator of the compound unit.
   * @param denominator An array of CompoundableUnits containing all the units in the denominator of the compound unit.
   * @param name The name of this unit. If not defined, one will be automatically generated.
   */
  constructor(family: F, numerator: CompoundableUnit<string>[], denominator: CompoundableUnit<string>[], name?: string) {

    // if not specified, build name from component units.
    if (name === undefined) {
      name = '';
      let i = 0;
      while (i < numerator.length - 1) {
        name += `${numerator[i].name}-`;
      }
      name += `${numerator[i].name}`;
      if (denominator.length > 0) {
        name += ' per ';
        i = 0;
        while (i < denominator.length - 1) {
          name += `${denominator[i].name}-`;
        }
        name += `${denominator[i].name}`;
      }
    }

    super(name);

    this.family = family;

    this.numerator = Array.from(numerator);
    this.denominator = Array.from(denominator);

    this.numerator.sort((a, b) => a.family.localeCompare(b.family));
    this.denominator.sort((a, b) => a.family.localeCompare(b.family));

    this.scaleFactor = this.getScaleFactor();
  }

  /**
   * Gets the scale factor for this unit.
   * @returns the scale factor for this unit.
   */
  private getScaleFactor(): number {
    let factor = 1;
    factor = this.numerator.reduce((prev, curr) => prev * curr.scaleFactor, factor);
    factor = this.denominator.reduce((prev, curr) => prev / curr.scaleFactor, factor);
    return factor;
  }

  /** @inheritdoc */
  public canConvert(otherUnit: Unit<string>): boolean {
    return otherUnit instanceof CompoundUnit && super.canConvert(otherUnit);
  }

  /** @inheritdoc */
  public convertTo(value: number, toUnit: Unit<F>): number {
    if (!this.canConvert(toUnit)) {
      throw new Error(`Invalid conversion from ${this.name} to ${toUnit.name}.`);
    }

    return value * (this.scaleFactor / (toUnit as CompoundUnit<F>).scaleFactor);
  }

  /** @inheritdoc */
  public convertFrom(value: number, fromUnit: Unit<F>): number {
    if (!this.canConvert(fromUnit)) {
      throw new Error(`Invalid conversion from ${fromUnit.name} to ${this.name}.`);
    }

    return value * ((fromUnit as CompoundUnit<F>).scaleFactor / this.scaleFactor);
  }
}

/**
 * Predefined unit families.
 */
export enum UnitFamily {
  Distance = 'distance',
  Angle = 'angle',
  Duration = 'duration',
  Weight = 'weight',
  Volume = 'volume',
  Pressure = 'pressure',
  Temperature = 'temperature',
  Speed = 'speed',
  WeightFlux = 'weight_flux',
  VolumeFlux = 'volume_flux'
}

/**
 * Predefined unit types.
 */
export class UnitType {
  public static readonly METER = new SimpleUnit(UnitFamily.Distance, 'meter', 1);
  public static readonly FOOT = new SimpleUnit(UnitFamily.Distance, 'foot', 0.3048);
  public static readonly KILOMETER = new SimpleUnit(UnitFamily.Distance, 'kilometer', 1000);
  public static readonly MILE = new SimpleUnit(UnitFamily.Distance, 'mile', 1609.34);
  public static readonly NMILE = new SimpleUnit(UnitFamily.Distance, 'nautical mile', 1852);
  public static readonly GA_RADIAN = new SimpleUnit(UnitFamily.Distance, 'great arc radian', 6378100);

  public static readonly RADIAN = new SimpleUnit(UnitFamily.Angle, 'radian', 1);
  public static readonly DEGREE = new SimpleUnit(UnitFamily.Angle, 'degree', Math.PI / 180);
  public static readonly ARC_MIN = new SimpleUnit(UnitFamily.Angle, 'minute', Math.PI / 180 / 60);
  public static readonly ARC_SEC = new SimpleUnit(UnitFamily.Angle, 'second', Math.PI / 180 / 3600);

  public static readonly MILLISECOND = new SimpleUnit(UnitFamily.Duration, 'millisecond', 0.001);
  public static readonly SECOND = new SimpleUnit(UnitFamily.Duration, 'second', 1);
  public static readonly MINUTE = new SimpleUnit(UnitFamily.Duration, 'minute', 60);
  public static readonly HOUR = new SimpleUnit(UnitFamily.Duration, 'hour', 3600);

  public static readonly KILOGRAM = new SimpleUnit(UnitFamily.Weight, 'kilogram', 1);
  public static readonly POUND = new SimpleUnit(UnitFamily.Weight, 'pound', 0.453592);
  public static readonly TON = new SimpleUnit(UnitFamily.Weight, 'ton', 907.185);
  public static readonly TONNE = new SimpleUnit(UnitFamily.Weight, 'tonne', 1000);

  // the following fuel units use the generic conversion factor of 1 gal = 6.7 lbs
  public static readonly LITER_FUEL = new SimpleUnit(UnitFamily.Weight, 'liter', 0.80283679);
  public static readonly GALLON_FUEL = new SimpleUnit(UnitFamily.Weight, 'gallon', 3.0390664);

  public static readonly LITER = new SimpleUnit(UnitFamily.Volume, 'liter', 1);
  public static readonly GALLON = new SimpleUnit(UnitFamily.Volume, 'gallon', 3.78541);

  public static readonly HPA = new SimpleUnit(UnitFamily.Pressure, 'hectopascal', 1);
  public static readonly ATM = new SimpleUnit(UnitFamily.Pressure, 'atmosphere', 1013.25);
  public static readonly IN_HG = new SimpleUnit(UnitFamily.Pressure, 'inch of mercury', 33.8639);
  public static readonly MM_HG = new SimpleUnit(UnitFamily.Pressure, 'millimeter of mercury', 1.33322);

  public static readonly CELSIUS = new SimpleUnit(UnitFamily.Temperature, '° Celsius', 1, 273.15);
  public static readonly FAHRENHEIT = new SimpleUnit(UnitFamily.Temperature, '° Fahrenheit', 5 / 9, 459.67);

  public static readonly KNOT = new CompoundUnit(UnitFamily.Speed, [UnitType.NMILE], [UnitType.HOUR], 'knot');
  public static readonly KPH = new CompoundUnit(UnitFamily.Speed, [UnitType.KILOMETER], [UnitType.HOUR]);
  public static readonly MPM = new CompoundUnit(UnitFamily.Speed, [UnitType.METER], [UnitType.MINUTE]);
  public static readonly MPS = new CompoundUnit(UnitFamily.Speed, [UnitType.METER], [UnitType.SECOND]);
  public static readonly FPM = new CompoundUnit(UnitFamily.Speed, [UnitType.FOOT], [UnitType.MINUTE]);
  public static readonly FPS = new CompoundUnit(UnitFamily.Speed, [UnitType.FOOT], [UnitType.SECOND]);
  public static readonly KGH = new CompoundUnit(UnitFamily.WeightFlux, [UnitType.KILOGRAM], [UnitType.HOUR]);
  public static readonly PPH = new CompoundUnit(UnitFamily.WeightFlux, [UnitType.POUND], [UnitType.HOUR]);
  public static readonly LPH_FUEL = new CompoundUnit(UnitFamily.WeightFlux, [UnitType.LITER_FUEL], [UnitType.HOUR]);
  public static readonly GPH_FUEL = new CompoundUnit(UnitFamily.WeightFlux, [UnitType.GALLON_FUEL], [UnitType.HOUR]);
}