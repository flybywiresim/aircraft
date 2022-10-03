import { Subject } from '../../../sub/Subject';

/**
 * A module describing properties of the own airplane icon.
 */
export class MapOwnAirplaneIconModule {
  /** Whether to show the airplane icon. */
  public readonly show = Subject.create(true);
}