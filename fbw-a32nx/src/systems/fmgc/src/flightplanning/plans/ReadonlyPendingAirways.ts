import { Airway, Fix, Waypoint } from '@flybywiresim/fbw-sdk';

export interface PendingAirwayEntry {
  fromIndex?: number;
  airway?: Airway;
  to?: Fix;
  isDct?: true;
  isAutoConnected?: true;
}

/**
 * A read-only pending airways data structure
 */
export interface ReadonlyPendingAirways {
  /** The pending airway elements */
  elements: PendingAirwayEntry[];

  /** Find a fix by ident along the tail airway */
  fixAlongTailAirway(ident: string): Waypoint;
}
