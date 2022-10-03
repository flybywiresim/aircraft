import { AbstractUnit, NumberUnit, NumberUnitInterface, Unit } from '../math';
import { AbstractSubscribable } from '../sub/AbstractSubscribable';
import { MutableSubscribable } from '../sub/Subscribable';
import { LatLonInterface } from './GeoInterfaces';
import { GeoPoint } from './GeoPoint';
import { MagVar } from './MagVar';

/**
 * The possible reference norths for navigation angle units.
 */
export enum NavAngleUnitReferenceNorth {
  True = 'true',
  Magnetic = 'magnetic'
}

/**
 * A navigation angle unit, which is a measure of angular degrees relative to either true or magnetic north.
 *
 * Unlike most other unit types, each instance of navigation angle unit contains state specific to that instance,
 * namely the location used to retrieve magnetic variation for conversions. Therefore, it is generally recommended
 * not to re-use the same NavAngleUnit instance to instantiate multiple NumberUnits.
 *
 * Conversions use the location of the NavAngleUnit instance whose conversion method is called; this also means that
 * when using `NumberUnit.asUnit()`, the location of the unit of the NumberUnit whose `asUnit()` method was called
 * will be used.
 */
export class NavAngleUnit extends AbstractUnit<typeof NavAngleUnit.FAMILY> {
  public static readonly FAMILY = 'navangle';

  /** @inheritdoc */
  public readonly family = NavAngleUnit.FAMILY;

  /** This location used to retrieve magnetic variation for conversions related to this unit. */
  public readonly location = new GeoPoint(0, 0);

  constructor(type: NavAngleUnitReferenceNorth, location: LatLonInterface);
  constructor(type: NavAngleUnitReferenceNorth, lat: number, lon: number);
  // eslint-disable-next-line jsdoc/require-jsdoc
  constructor(type: NavAngleUnitReferenceNorth, arg1: LatLonInterface | number, arg2?: number) {
    super(type === NavAngleUnitReferenceNorth.True ? 'true bearing' : 'magnetic bearing');

    typeof arg1 === 'number' ? this.location.set(arg1, arg2 as number) : this.location.set(arg1);
  }

  /**
   * Checks whether this nav angle unit is relative to magnetic north.
   * @returns Whether this nav angle unit is relative to magnetic north.
   */
  public isMagnetic(): boolean {
    return this.name === 'magnetic bearing';
  }

  /**
   * Converts a value of this unit to another unit. This unit's location is used for the conversion.
   * @param value The value to convert.
   * @param toUnit The unit to which to convert.
   * @returns The converted value.
   * @throws Error if attempting an invalid conversion.
   */
  public convertTo(value: number, toUnit: Unit<typeof NavAngleUnit.FAMILY>): number {
    if (!this.canConvert(toUnit)) {
      throw new Error(`Invalid conversion from ${this.name} to ${toUnit.name}.`);
    }

    if (!isFinite(value)) {
      return NaN;
    }

    if (toUnit.name === this.name) {
      return value;
    }

    return this.isMagnetic() ? MagVar.magneticToTrue(value, this.location) : MagVar.trueToMagnetic(value, this.location);
  }

  /**
   * Converts a value of another unit to this unit. This unit's location is used for the conversion.
   * @param value The value to convert.
   * @param fromUnit The unit from which to convert.
   * @returns The converted value.
   * @throws Error if attempting an invalid conversion.
   */
  public convertFrom(value: number, fromUnit: Unit<typeof NavAngleUnit.FAMILY>): number {
    if (!this.canConvert(fromUnit)) {
      throw new Error(`Invalid conversion from ${fromUnit.name} to ${this.name}.`);
    }

    if (!isFinite(value)) {
      return NaN;
    }

    if (fromUnit.name === this.name) {
      return value;
    }

    return this.isMagnetic() ? MagVar.trueToMagnetic(value, this.location) : MagVar.magneticToTrue(value, this.location);
  }

  /** @inheritdoc */
  public equals(other: Unit<string>): boolean {
    return other instanceof NavAngleUnit && this.name === other.name && this.location.equals(other.location);
  }

  /**
   * Creates an instance of NavAngleUnit. The location of the unit is initialized to {0 N, 0 E}.
   * @param isMagnetic Whether the new unit is relative to magnetic north.
   * @returns An instance of NavAngleUnit.
   */
  public static create(isMagnetic: boolean): NavAngleUnit {
    return new NavAngleUnit(isMagnetic ? NavAngleUnitReferenceNorth.Magnetic : NavAngleUnitReferenceNorth.True, 0, 0);
  }
}

/**
 * A Subject which provides a navigation angle value.
 */
export class NavAngleSubject
  extends AbstractSubscribable<NumberUnitInterface<typeof NavAngleUnit.FAMILY, NavAngleUnit>>
  implements MutableSubscribable<NumberUnitInterface<typeof NavAngleUnit.FAMILY, NavAngleUnit>> {

  /** @inheritdoc */
  public readonly isMutableSubscribable = true;

  /**
   * Constructor.
   * @param value The value of this subject.
   */
  private constructor(private readonly value: NumberUnit<typeof NavAngleUnit.FAMILY, NavAngleUnit>) {
    super();
  }

  /**
   * Creates a NavAngleSubject.
   * @param initialVal The initial value.
   * @returns A NavAngleSubject.
   */
  public static create(initialVal: NumberUnit<typeof NavAngleUnit.FAMILY, NavAngleUnit>): NavAngleSubject {
    return new NavAngleSubject(initialVal);
  }

  /**
   * Creates a NavAngleSubject.
   * @param initialVal The initial value.
   * @returns A NavAngleSubject.
   * @deprecated Use `NavAngleSubject.create()` instead.
   */
  public static createFromNavAngle(initialVal: NumberUnit<typeof NavAngleUnit.FAMILY, NavAngleUnit>): NavAngleSubject {
    return new NavAngleSubject(initialVal);
  }

  /** @inheritdoc */
  public get(): NumberUnitInterface<typeof NavAngleUnit.FAMILY, NavAngleUnit> {
    return this.value.readonly;
  }

  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param value The new value.
   */
  public set(value: NumberUnitInterface<typeof NavAngleUnit.FAMILY, NavAngleUnit>): void;
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param value The numeric part of the new value.
   * @param unit The unit type of the new value. Defaults to the unit type of the NumberUnit used to create this
   * subject.
   */
  public set(value: number, unit?: NavAngleUnit): void;
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param value The numeric part of the new value.
   * @param lat The latitude of the new value's location.
   * @param lon The longitude of the new value's location.
   */
  public set(value: number, lat: number, lon: number): void;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(arg1: NumberUnitInterface<typeof NavAngleUnit.FAMILY, NavAngleUnit> | number, arg2?: NavAngleUnit | number, arg3?: number): void {
    const isArg1Number = typeof arg1 === 'number';
    const isArg2Number = typeof arg2 === 'number';
    const unit = isArg1Number
      ? isArg2Number || arg2 === undefined ? this.value.unit : arg2
      : arg1.unit;

    isArg2Number ? this.value.unit.location.set(arg2, arg3 as number) : this.value.unit.location.set(unit.location);

    const equals = (isArg1Number ? this.value.equals(arg1, unit) : this.value.equals(arg1));

    if (!equals) {
      isArg1Number
        ? (this.value as NumberUnit<typeof NavAngleUnit.FAMILY, NavAngleUnit>).set(arg1, unit)
        : (this.value as NumberUnit<typeof NavAngleUnit.FAMILY, NavAngleUnit>).set(arg1);

      this.notify();
    }
  }
}