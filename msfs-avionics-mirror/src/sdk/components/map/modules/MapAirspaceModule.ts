import { Subject } from '../../../sub';

/**
 * A map of airspace show types to their associated nearest boundary search filter bitflags.
 */
export type MapAirspaceShowTypes = Record<any, number>;

/**
 * A module describing the display of airspaces.
 */
export class MapAirspaceModule<T extends MapAirspaceShowTypes> {
  /** Whether to show each type of airspace. */
  public readonly show: Record<keyof T, Subject<boolean>>;

  /**
   * Constructor.
   * @param showTypes A map of this module's airspace show types to their associated nearest boundary search filter
   * bitflags.
   */
  constructor(public readonly showTypes: T) {
    this.show = {} as Record<keyof T, Subject<boolean>>;
    for (const type in showTypes) {
      this.show[type] = Subject.create<boolean>(false);
    }
  }
}