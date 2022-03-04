import { Subject } from '../Subject';
import { GeoPoint, GeoPointInterface } from './GeoPoint';

/**
 * A Subject which provides a GeoPointInterface value.
 */
export class GeoPointSubject extends Subject<GeoPointInterface> {
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param value The new value.
   */
  public set(value: GeoPointInterface): void;
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param lat The latitude of the new value.
   * @param lon The longitude of the new value.
   */
  public set(lat: number, lon: number): void;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(arg1: GeoPointInterface | number, arg2?: number): void {
    const isArg1Number = typeof arg1 === 'number';
    const equals = isArg1Number ? this.value.equals(arg1 as number, arg2 as number) : this.value.equals(arg1 as GeoPointInterface);
    if (!equals) {
      isArg1Number ? (this.value as GeoPoint).set(arg1 as number, arg2 as number) : (this.value as GeoPoint).set(arg1 as GeoPointInterface);
      this.notify();
    }
  }

  /**
   * Creates a GeoPointSubject.
   * @param initialVal The initial value.
   * @returns a GeoPointSubject.
   */
  public static createFromGeoPoint(initialVal: GeoPoint): GeoPointSubject {
    return new GeoPointSubject(initialVal, Subject.DEFAULT_EQUALITY_FUNC);
  }
}