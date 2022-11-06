import { MathUtils } from '../../math';
import { SortedArray } from './SortedArray';

/**
 * A lookup table breakpoint in a single dimension.
 */
type DimensionalBreakpoint = {
  /** The key of this breakpoint. */
  key: number,

  /** A sorted array of dimensional breakpoints, that fall under breakpoint, in the next lower dimension. */
  array?: SortedArray<DimensionalBreakpoint>;

  /** The value of this breakpoint, if this breakpoint is in the lowest dimension. */
  value?: number;
};

/**
 * A linearly interpolated N-dimensional lookup table.
 */
export class LerpLookupTable {
  private static readonly BREAKPOINT_COMPARATOR = (a: DimensionalBreakpoint, b: DimensionalBreakpoint): number => a.key - b.key;

  private static readonly tempBreakpoint: DimensionalBreakpoint = { key: 0 };

  private readonly _dimensionCount: number;
  // eslint-disable-next-line jsdoc/require-returns
  /** The number of dimensions in this table. */
  public get dimensionCount(): number {
    return this._dimensionCount;
  }

  private readonly table = new SortedArray<DimensionalBreakpoint>(LerpLookupTable.BREAKPOINT_COMPARATOR);

  /**
   * Creates a lookup table of a specified dimension.
   * @param dimensionCount The number of dimensions in the new table. Values less than 0 will be clamped to 0.
   */
  constructor(dimensionCount: number);
  /**
   * Creates a lookup table initialized with an array of breakpoints.
   * @param breakpoints An array of breakpoints with which to initialize the new table. Each breakpoint should be
   * expressed as a number array, where the first element represents the breakpoint value, and the next N elements
   * represent the breakpoint key in each dimension. If not all breakpoint arrays have the same length, the dimension
   * of the table will be set equal to `N - 1`, where `N` is the length of the shortest array. For arrays with length
   * greater than `N`, all keys after index `N - 1` will be ignored. If the table ends up with zero dimensions, it will
   * be initialized to an empty table.
   */
  constructor(breakpoints: readonly (readonly number[])[]);
  // eslint-disable-next-line jsdoc/require-jsdoc
  constructor(arg: readonly (readonly number[])[] | number) {
    if (typeof arg === 'number') {
      this._dimensionCount = isNaN(arg) ? 0 : Math.max(0, arg);
      return;
    }

    const leastDimension = arg.reduce((accum, current) => (current.length < accum.length) ? current : accum);
    this._dimensionCount = Math.max(0, leastDimension ? (leastDimension.length - 1) : 0);
    if (this._dimensionCount === 0) {
      return;
    }

    for (let i = 0; i < arg.length; i++) {
      this.insertBreakpoint(arg[i]);
    }
  }


  /**
   * Inserts a breakpoint into this table. If the breakpoint has more dimensions than this table, only the first `N`
   * keys of the breakpoint will be used, where `N` is the dimension count of this table.
   * @param breakpoint A breakpoint, as a number array with the value at index 0 followed by the keys for each
   * dimension.
   * @returns This table, after the breakpoint has been inserted.
   * @throws Error if this table has zero dimensions, or the breakpoint has fewer dimensions than this table.
   */
  public insertBreakpoint(breakpoint: readonly number[]): this {
    if (this._dimensionCount === 0) {
      throw new Error('LerpLookupTable: cannot insert a breakpoint into a 0-dimensional table');
    }

    if (breakpoint.length - 1 < this._dimensionCount) {
      throw new Error(`LerpLookupTable: cannot insert a ${breakpoint.length - 1}-dimensional breakpoint into a ${this._dimensionCount}-dimensional table`);
    }

    this.insertBreakpointHelper(breakpoint, 0, this.table);
    return this;
  }

  /**
   * Helper method for inserting a breakpoint into this table.
   * @param breakpoint The breakpoint to insert.
   * @param dimension The current dimension being evaluated.
   * @param array The array of dimensional breakpoints into which the breakpoint should be inserted.
   */
  private insertBreakpointHelper(breakpoint: readonly number[], dimension: number, array: SortedArray<DimensionalBreakpoint>): void {
    const dimensionKey = breakpoint[dimension + 1];
    const query = LerpLookupTable.tempBreakpoint;
    query.key = dimensionKey;

    if (dimension === this._dimensionCount - 1) {
      let match = array.match(query);
      if (!match) {
        match = { key: dimensionKey, value: breakpoint[0] };
        array.insert(match);
      }
    } else {
      let next = array.match(query);
      if (!next) {
        array.insert(next = { key: dimensionKey, array: new SortedArray<DimensionalBreakpoint>(LerpLookupTable.BREAKPOINT_COMPARATOR) });
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.insertBreakpointHelper(breakpoint, dimension + 1, next.array!);
    }
  }

  /**
   * Looks up a value in this table using a specified key. The returned value will be linearly interpolated from
   * surrounding breakpoints if the key is not an exact match for any of the table's breakpoints.
   * @param key The lookup key, as an ordered N-tuple of numbers.
   * @returns The value corresponding to the specified key, or undefined if a value could not be retrieved.
   * @throws Error if this table has zero dimensions, the key has fewer dimensions than this table, or a value could
   * not be retrieved.
   */
  public get(...key: number[]): number {
    if (this._dimensionCount === 0) {
      throw new Error('LerpLookupTable: cannot look up a key in a 0-dimensional table');
    }

    if (key.length < this._dimensionCount) {
      throw new Error(`LerpLookupTable: cannot look up a ${key.length}-dimensional key in a ${this._dimensionCount}-dimensional table`);
    }

    const value = this.lookupHelper(key, 0, this.table);

    if (value === undefined) {
      throw new Error(`LerpLookupTable: could not retrieve value for key ${key}`);
    }

    return value;
  }

  /**
   * Helper method for looking up a key in this table.
   * @param key The key to look up.
   * @param dimension The current dimension being evaluated.
   * @param lookupArray The array containing breakpoints in the next lower dimension in which to search for the key.
   * @returns The interpolated value of the key at the specified dimension.
   */
  private lookupHelper(key: number[], dimension: number, lookupArray: SortedArray<DimensionalBreakpoint>): number | undefined {
    const dimensionKey = key[dimension];
    const query = LerpLookupTable.tempBreakpoint;
    query.key = dimensionKey;

    const index = lookupArray.matchIndex(query);
    let start;
    let end;
    if (index >= 0) {
      start = lookupArray.get(index);
      end = start;
    } else {
      start = lookupArray.get(-index - 2);
      end = lookupArray.get(-index - 1);
      if (!start) {
        start = end;
      }
      if (!end) {
        end = start;
      }
    }

    if (!start || !end) {
      return undefined;
    }

    let startValue;
    let endValue;
    if (dimension === this.dimensionCount - 1) {
      startValue = start.value;
      endValue = end.value;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      startValue = this.lookupHelper(key, dimension + 1, start.array!);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      endValue = this.lookupHelper(key, dimension + 1, end.array!);
    }

    if (startValue === undefined || endValue === undefined) {
      return undefined;
    }

    if (startValue === endValue) {
      return startValue;
    }

    return MathUtils.lerp(dimensionKey, start.key, end.key, startValue, endValue);
  }
}