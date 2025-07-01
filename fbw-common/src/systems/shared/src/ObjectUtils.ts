// Copyright (c) Microsoft Corporation
// SPDX-License-Identifier: MIT

/**
 * Utility functions for working with objects.
 */
export class ObjectUtils {
  /**
   * Returns an object created by key-value entries for properties and methods.
   * Object.fromEntries is not available in CoherentJS.
   * @param entries An iterable object that contains key-value entries for properties and methods.
   * @returns The object.
   */
  public static fromEntries<T extends ReadonlyArray<readonly [PropertyKey, unknown]>>(
    entries: T,
  ): { [K in T[number] as K[0]]: K[1] } {
    const ret = {} as any;
    for (const entry of entries) {
      ret[entry[0]] = entry[1];
    }
    return ret as { [K in T[number] as K[0]]: K[1] };
  }
}
