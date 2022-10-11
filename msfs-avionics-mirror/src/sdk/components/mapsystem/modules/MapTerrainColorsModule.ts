import { ArraySubject, Subject } from '../../../sub';
import { BingComponent } from '../../bing';

/**
 * A map data module that controls the terrain color reference point.
 */
export class MapTerrainColorsModule {
  /** The terrain colors reference point. */
  public readonly reference = Subject.create(EBingReference.SEA);

  /** Whether or not to show the map terrain isolines. */
  public readonly showIsoLines = Subject.create<boolean>(false);

  /** The terrain colors array. */
  public readonly colors = ArraySubject.create(BingComponent.createEarthColorsArray('#0000FF', [
    {
      elev: 0,
      color: '#000000'
    },
    {
      elev: 60000,
      color: '#000000'
    }
  ]));
}