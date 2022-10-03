import { Subject } from './Subject';
import { MutableSubscribable, Subscribable } from './Subscribable';

/**
 * Utility methods for working with Subscribables.
 */
export class SubscribableUtils {
  /**
   * A numeric equality function which returns `true` if and only if two numbers are strictly equal or if they are both
   * `NaN`.
   * @param a The first number to compare.
   * @param b The second number to compare.
   * @returns Whether the two numbers are strictly equal or both `NaN`.
   */
  public static readonly NUMERIC_NAN_EQUALITY = (a: number, b: number): boolean => a === b || (isNaN(a) && isNaN(b));

  /**
   * Checks if a query is a subscribable.
   * @param query A query.
   * @returns Whether the query is a subscribable.
   */
  public static isSubscribable<T = any>(query: unknown): query is Subscribable<T> {
    return typeof query === 'object' && query !== null && (query as any).isSubscribable === true;
  }

  /**
   * Checks if a query is a mutable subscribable.
   * @param query A query.
   * @returns Whether the query is a mutable subscribable.
   */
  public static isMutableSubscribable<T = any, I = any>(query: unknown): query is MutableSubscribable<T, I> {
    return typeof query === 'object' && query !== null && (query as any).isMutableSubscribable === true;
  }

  /**
   * Converts a value to a subscribable.
   *
   * If the `excludeSubscribables` argument is `true` and the value is already a subscribable, then the value is
   * returned unchanged. Otherwise, a new subscribable whose state is always equal to the value will be created and
   * returned.
   * @param value The value to convert to a subscribable.
   * @param excludeSubscribables Whether to return subscribable values as-is instead of wrapping them in another
   * subscribable.
   * @returns A subscribable.
   */
  public static toSubscribable<V, Exclude extends boolean>(
    value: V,
    excludeSubscribables: Exclude
  ): Exclude extends true ? (V extends Subscribable<any> ? V : Subscribable<V>) : Subscribable<V> {
    if (excludeSubscribables && SubscribableUtils.isSubscribable(value)) {
      return value as any;
    } else {
      return Subject.create(value) as any;
    }
  }
}