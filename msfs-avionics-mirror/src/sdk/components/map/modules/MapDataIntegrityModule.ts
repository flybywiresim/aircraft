import { Subject } from '../../../utils/Subject';

/**
 * A map module describing whether or not various signals are valid.
 */
export class MapDataIntegrityModule {
  /** Whether or not the GPS position signal is valid. */
  public readonly gpsSignalValid = Subject.create<boolean>(false);

  /** Whether or not the heading magnetometer signal is valid. */
  public readonly headingSignalValid = Subject.create<boolean>(false);
}