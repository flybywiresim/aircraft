import { GeoPoint, LatLonInterface } from '../../geo';
import { ReadonlyFloat64Array, Vec3Math } from '../../math';
import { KdTree } from './KdTree';

/**
 * A visitor function for geo k-d tree searches.
 * @param element A search result.
 * @param point The location of the search result, in cartesian form.
 * @param distance The great-circle distance, in great-arc radians, from the search result to the query point.
 * @param queryPoint The query point, in cartesian form.
 * @returns Whether to continue the search.
 */
export type GeoKdTreeSearchVisitor<T> = (element: T, point: ReadonlyFloat64Array, distance: number, queryPoint: ReadonlyFloat64Array) => boolean;

/**
 * A filtering function for k-d tree searches.
 * @param element A candidate search result.
 * @param point The location of the candidate search result, in cartesian form.
 * @param distance The great-circle distance, in great-arc radians, from the candidate search result to the query point.
 * @param queryPoint The query point, in cartesian form.
 * @returns Whether to include the candidate in the final search results.
 */
export type GeoKdTreeSearchFilter<T> = (element: T, point: ReadonlyFloat64Array, distance: number, queryPoint: ReadonlyFloat64Array) => boolean;

/**
 * A spatial tree which is keyed on points on Earth's surface and allows searching for elements based on the great-
 * circle distances from their keys to a query point.
 */
export class GeoKdTree<T> {
  private static readonly vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3)];

  private readonly cartesianTree = new KdTree(3, (element: T, out: Float64Array): Float64Array => {
    const vec = this.keyFunc(element, GeoKdTree.vec3Cache[0]);
    out[0] = vec[0];
    out[1] = vec[1];
    out[2] = vec[2];
    return out;
  });

  /**
   * Constructor.
   * @param keyFunc A function which generates keys from elements. Keys are cartesian representations of points on
   * Earth's surface.
   * @throws Error if the dimension count is less than 2.
   */
  constructor(private readonly keyFunc: (element: T, out: Float64Array) => Float64Array) {
  }

  /**
   * Searches this tree for elements located near a query point and visits each of them with a function.
   * @param lat The latitude of the query point, in degrees.
   * @param lon The longitude of the query point, in degrees.
   * @param radius The radius around the query point to search, in great-arc radians.
   * @param visitor A visitor function. This function will be called once per element found within the search radius.
   * If the visitor returns `true`, then the search will continue; if the visitor returns `false`, the search will
   * immediately halt.
   */
  public search(lat: number, lon: number, radius: number, visitor: GeoKdTreeSearchVisitor<T>): void
  /**
   * Searches this tree for elements located near a query point and visits each of them with a function.
   * @param center The query point.
   * @param radius The radius around the query point to search, in great-arc radians.
   * @param visitor A visitor function. This function will be called once per element found within the search radius.
   * If the visitor returns `true`, then the search will continue; if the visitor returns `false`, the search will
   * immediately halt.
   */
  public search(center: LatLonInterface | ReadonlyFloat64Array, radius: number, visitor: GeoKdTreeSearchVisitor<T>): void;
  /**
   * Searches this tree for elements located near a query point and returns them in order of increasing distance from
   * the query key.
   * @param lat The latitude of the query point, in degrees.
   * @param lon The longitude of the query point, in degrees.
   * @param radius The radius around the query point to search, in great-arc radians.
   * @param maxResultCount The maximum number of search results to return.
   * @param out An array in which to store the search results.
   * @param filter A function to filter the search results.
   * @returns An array containing the search results, in order of increasing distance from the query key.
   */
  public search(lat: number, lon: number, radius: number, maxResultCount: number, out: T[], filter?: GeoKdTreeSearchFilter<T>): T[];
  /**
   * Searches this tree for elements located near a query point and returns them in order of increasing distance from
   * the query key.
   * @param center The query point.
   * @param radius The radius around the query point to search, in great-arc radians.
   * @param maxResultCount The maximum number of search results to return.
   * @param out An array in which to store the search results.
   * @param filter A function to filter the search results.
   * @returns An array containing the search results, in order of increasing distance from the query key.
   */
  public search(center: LatLonInterface | ReadonlyFloat64Array, radius: number, maxResultCount: number, out: T[], filter?: GeoKdTreeSearchFilter<T>): T[];
  // eslint-disable-next-line jsdoc/require-jsdoc
  public search(
    arg1: LatLonInterface | ReadonlyFloat64Array | number,
    arg2: number,
    arg3: number | GeoKdTreeSearchVisitor<T>,
    arg4?: GeoKdTreeSearchVisitor<T> | T[] | number,
    arg5?: T[] | GeoKdTreeSearchFilter<T>,
    arg6?: GeoKdTreeSearchFilter<T>
  ): void | T[] {
    let center: Float64Array, radius: number;
    let argA: GeoKdTreeSearchVisitor<T> | number, argB: T[] | undefined | GeoKdTreeSearchFilter<T>, argC: GeoKdTreeSearchFilter<T> | undefined;
    if (typeof arg1 === 'number') {
      center = GeoPoint.sphericalToCartesian(arg1, arg2, GeoKdTree.vec3Cache[1]);
      radius = arg3 as number;
      argA = arg4 as GeoKdTreeSearchVisitor<T> | number;
      argB = arg5 as T[] | undefined | GeoKdTreeSearchFilter<T>;
      argC = arg6;
    } else if (!(arg1 instanceof Float64Array)) {
      center = GeoPoint.sphericalToCartesian(arg1 as LatLonInterface, GeoKdTree.vec3Cache[1]);
      radius = arg2;
      argA = arg3 as GeoKdTreeSearchVisitor<T> | number;
      argB = arg4 as T[] | undefined | GeoKdTreeSearchFilter<T>;
      argC = arg5 as GeoKdTreeSearchFilter<T> | undefined;
    } else {
      center = arg1;
      radius = arg2;
      argA = arg3 as GeoKdTreeSearchVisitor<T> | number;
      argB = arg4 as T[] | undefined | GeoKdTreeSearchFilter<T>;
      argC = arg5 as GeoKdTreeSearchFilter<T> | undefined;
    }

    const radiusCartesian = Math.sqrt(2 * (1 - Math.cos(Utils.Clamp(radius, 0, Math.PI))));

    if (typeof argA === 'number') {
      return this.doResultsSearch(center, radiusCartesian, argA, argB as T[], argC);
    } else {
      this.doVisitorSearch(center, radiusCartesian, argA);
    }
  }

  /**
   * Performs a tree search with a visitor function.
   * @param center The query point.
   * @param radiusCartesian The query radius.
   * @param visitor A visitor function. This function will be called once per element found within the search radius.
   * If the visitor returns `true`, then the search will continue; if the visitor returns `false`, the search will
   * immediately halt.
   */
  private doVisitorSearch(center: ReadonlyFloat64Array, radiusCartesian: number, visitor: GeoKdTreeSearchVisitor<T>): void {
    this.cartesianTree.searchKey(
      center, radiusCartesian, (element: T, key: ReadonlyFloat64Array): boolean => {
        const vec = Vec3Math.set(key[0], key[1], key[2], GeoKdTree.vec3Cache[2]);

        const greatCircleDist = GeoPoint.distance(vec, center);
        return visitor(element, vec, greatCircleDist, center);
      }
    );
  }

  /**
   * Performs a tree search and returns an array of search results.
   * @param center The query point.
   * @param radiusCartesian The query radius.
   * @param maxResultCount The maximum number of search results to return.
   * @param out An array in which to store the search results.
   * @param filter A function to filter the search results.
   * @returns An array containing the search results, in order of increasing distance from the query key.
   */
  private doResultsSearch(
    center: ReadonlyFloat64Array,
    radiusCartesian: number,
    maxResultCount: number,
    out: T[],
    filter?: GeoKdTreeSearchFilter<T>
  ): T[] {
    const cartesianFilter = filter
      ? (element: T, key: ReadonlyFloat64Array): boolean => {
        const vec = Vec3Math.set(key[0], key[1], key[2], GeoKdTree.vec3Cache[2]);

        const greatCircleDist = GeoPoint.distance(vec, center);
        return filter(element, vec, greatCircleDist, center);
      }
      : undefined;

    return this.cartesianTree.searchKey(center, radiusCartesian, maxResultCount, out, cartesianFilter);
  }

  /**
   * Inserts an element into this tree. This operation will trigger a rebalancing if, after the insertion, the length
   * of this tree's longest branch is more than twice the length of the shortest branch.
   * @param element The element to insert.
   */
  public insert(element: T): void {
    this.cartesianTree.insert(element);
  }

  /**
   * Inserts a batch of elements into this tree. This tree will be rebalanced after the elements are inserted.
   * @param elements An iterable of the elements to insert.
   */
  public insertAll(elements: Iterable<T>): void {
    this.cartesianTree.insertAll(elements);
  }

  /**
   * Removes an element from this tree. This tree will be rebalanced after the element is removed.
   * @param element The element to remove.
   * @returns Whether the element was removed.
   */
  public remove(element: T): boolean {
    return this.cartesianTree.remove(element);
  }

  /**
   * Removes a batch of elements from this tree. This tree will be rebalanced after the elements are removed.
   * @param elements An iterable of the elements to remove.
   * @returns Whether at least one element was removed.
   */
  public removeAll(elements: Iterable<T>): boolean {
    return this.cartesianTree.removeAll(elements);
  }

  /**
   * Removes elements from this tree, then inserts elements into this tree as a single operation. The tree will be
   * rebalanced at the end of the operation.
   *
   * Using this method is more efficient than calling `removeAll()` and `insertAll()` separately.
   * @param toRemove An iterable of the elements to remove.
   * @param toInsert An iterable of the elements to insert.
   */
  public removeAndInsert(toRemove: Iterable<T>, toInsert: Iterable<T>): void {
    this.cartesianTree.removeAndInsert(toRemove, toInsert);
  }

  /**
   * Rebuilds and balances this tree.
   */
  public rebuild(): void {
    this.cartesianTree.rebuild();
  }

  /**
   * Removes all elements from this tree.
   */
  public clear(): void {
    this.cartesianTree.clear();
  }
}