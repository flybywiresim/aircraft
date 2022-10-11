import { AbstractSubscribable } from '../sub/AbstractSubscribable';
import { MutableSubscribable } from '../sub/Subscribable';
import { LatLonInterface } from './GeoInterfaces';
import { GeoPoint, GeoPointInterface } from './GeoPoint';

/**
 * A Subject which provides a {@link GeoPointInterface} value.
 */
export class GeoPointSubject extends AbstractSubscribable<GeoPointInterface> implements MutableSubscribable<GeoPointInterface, LatLonInterface> {
  /** @inheritdoc */
  public readonly isMutableSubscribable = true;

  /**
   * Constructor.
   * @param value The value of this subject.
   */
  private constructor(private readonly value: GeoPoint) {
    super();
  }

  /**
   * Creates a GeoPointSubject.
   * @param initialVal The initial value.
   * @returns A GeoPointSubject.
   */
  public static create(initialVal: GeoPoint): GeoPointSubject {
    return new GeoPointSubject(initialVal);
  }

  /**
   * Creates a GeoPointSubject.
   * @param initialVal The initial value.
   * @returns A GeoPointSubject.
   * @deprecated Use `GeoPointSubject.create()` instead.
   */
  public static createFromGeoPoint(initialVal: GeoPoint): GeoPointSubject {
    return new GeoPointSubject(initialVal);
  }

  /** @inheritdoc */
  public get(): GeoPointInterface {
    return this.value.readonly;
  }

  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param value The new value.
   */
  public set(value: LatLonInterface): void;
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param lat The latitude of the new value.
   * @param lon The longitude of the new value.
   */
  public set(lat: number, lon: number): void;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(arg1: LatLonInterface | number, arg2?: number): void {
    const isArg1Number = typeof arg1 === 'number';
    const equals = isArg1Number ? this.value.equals(arg1 as number, arg2 as number) : this.value.equals(arg1 as LatLonInterface);
    if (!equals) {
      isArg1Number ? (this.value as GeoPoint).set(arg1 as number, arg2 as number) : (this.value as GeoPoint).set(arg1 as LatLonInterface);
      this.notify();
    }
  }
}