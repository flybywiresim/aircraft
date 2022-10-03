import { GeoPointInterface } from '../../geo/GeoPoint';
import { DmsFormatter } from '../../graphics/text/DmsFormatter';
import { Subject } from '../../sub/Subject';
import { Subscribable } from '../../sub/Subscribable';
import { SubscribableSet } from '../../sub/SubscribableSet';
import { Subscription } from '../../sub/Subscription';
import { ComponentProps, DisplayComponent, FSComponent, VNode } from '../FSComponent';

/**
 * Component props for WaypointComponent.
 */
export interface LatLonDisplayProps extends ComponentProps {
  /** A subscribable which provides a location to bind. */
  location: Subscribable<GeoPointInterface>;

  /** CSS class(es) to add to the root of the icon component. */
  class?: string | SubscribableSet<string>;
}

/**
 * A component which displays lat/lon coordinates.
 */
export class LatLonDisplay extends DisplayComponent<LatLonDisplayProps> {
  private locationSub?: Subscription;

  private readonly latPrefix = Subject.create('');
  private readonly latNum = Subject.create('');
  private readonly lonPrefix = Subject.create('');
  private readonly lonNum = Subject.create('');

  private readonly formatter = new DmsFormatter();

  /** @inheritdoc */
  public onAfterRender(): void {
    this.locationSub = this.props.location.sub(this.onLocationChanged.bind(this), true);
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
    this.setCoordSub(this.latPrefix, this.latNum, this.formatter.parseLat(location.lat), 2);
    this.setCoordSub(this.lonPrefix, this.lonNum, this.formatter.parseLon(location.lon), 3);
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
    this.latPrefix.set('_');
    this.latNum.set('__°__.__\'');
    this.lonPrefix.set('_');
    this.lonNum.set('___°__.__\'');
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={this.props.class ?? ''}>
        <div class='latlon-coord latlon-lat'>
          <div class='latlon-prefix'>{this.latPrefix}</div>
          <div class='latlon-num' style='white-space: nowrap;'>{this.latNum}</div>
        </div>
        <div class='latlon-coord latlon-lon'>
          <div class='latlon-prefix'>{this.lonPrefix}</div>
          <div class='latlon-num' style='white-space: nowrap;'>{this.lonNum}</div>
        </div>
      </div>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    this.locationSub?.destroy();
  }
}