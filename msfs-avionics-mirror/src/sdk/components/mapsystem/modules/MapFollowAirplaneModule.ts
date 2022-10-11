import { Subject } from '../../../sub/Subject';

/**
 * A module which describes whether the map is following the player airplane.
 */
export class MapFollowAirplaneModule {
  /** Whether the map is following the player airplane. */
  public readonly isFollowing = Subject.create(false);
}