import { DmsFormatter } from '../../utils/DmsFormatter';
import { GeoPointInterface } from '../../utils/geo/GeoPoint';
import { Subscribable } from '../../utils/Subscribable';
import { Subject } from '../../utils/Subject';
import { ComponentProps, DisplayComponent, FSComponent, VNode } from '../FSComponent';

/**
 * Component props for WaypointComponent.
 */
export interface LatLonDisplayProps extends ComponentProps {
  /** A subscribable which provides a location to bind. */
  location: Subscribable<GeoPointInterface>;

  /** CSS class(es) to add to the root of the icon component. */
  class?: string;
}

/**
 * A component which displays lat/lon coordinates.
 */
export class LatLonDisplay extends DisplayComponent<LatLonDisplayProps> {
  private readonly locationChangedHandler = this.onLocationChanged.bind(this);

  private readonly latPrefixSub = Subject.create('');
  private readonly latNumSub = Subject.create('');
  private readonly lonPrefixSub = Subject.create('');
  private readonly lonNumSub = Subject.create('');

  private readonly formatter = new DmsFormatter();

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAfterRender(): void {
    this.props.location.sub(this.locationChangedHandler, true);
  }

  /**
   * A callback which is called when this component's bound location changes.
   * @param location The new location.
   */
  private onLocationChanged(location: GeoPointInterface): void {
    if (isNaN(location.lat) || isNaN(location.lon)) {
      this.clearDisplay();
    } else {
      this.setDisplay(location);
    }
  }

  /**
   * Displays the formatted lat/lon coordinates of a location.
   * @param location A location.
   */
  private setDisplay(location: GeoPointInterface): void {
    this.setCoordSub(this.latPrefixSub, this.latNumSub, this.formatter.parseLat(location.lat), 2);
    this.setCoordSub(this.lonPrefixSub, this.lonNumSub, this.formatter.parseLon(location.lon), 3);
  }

  /**
   * Sets coordinate subjects for a given set of coordinate values.
   * @param prefixSub The coordinate prefix subject.
   * @param numSub The coordinate number subject.
   * @param coordValues The DMS values of the coordinate.
   * @param padDeg The number of digits to which to pad the degrees value.
   */
  private setCoordSub(prefixSub: Subject<string>, numSub: Subject<string>, coordValues: any, padDeg: number): void {
    const prefix: 'N' | 'S' | 'E' | 'W' = coordValues.direction;
    let deg: number = coordValues.degrees;
    let minutes = Math.round((coordValues.minutes + coordValues.seconds / 60) * 100) / 100;
    if (minutes === 60) {
      // need to increment up degrees if minutes was rounded up to 60 from 59.xx.
      deg++;
      minutes = 0;
    }

    prefixSub.set(prefix);
    numSub.set(`${deg.toString().padStart(padDeg, '0')}°${minutes.toFixed(2)}'`);
  }

  /**
   * Displays the blank default value.
   */
  private clearDisplay(): void {
    this.latPrefixSub.set('_');
    this.latNumSub.set('__°__.__\'');
    this.lonPrefixSub.set('_');
    this.lonNumSub.set('___°__.__\'');
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div class={this.props.class ?? ''}>
        <div class='latlon-coord latlon-lat'>
          <div class='latlon-prefix'>{this.latPrefixSub}</div>
          <div class='latlon-num' style='white-space: nowrap;'>{this.latNumSub}</div>
        </div>
        <div class='latlon-coord latlon-lon'>
          <div class='latlon-prefix'>{this.lonPrefixSub}</div>
          <div class='latlon-num' style='white-space: nowrap;'>{this.lonNumSub}</div>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public destroy(): void {
    this.props.location.unsub(this.locationChangedHandler);
  }
}