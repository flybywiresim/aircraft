/// <reference types="msfstypes/JS/common" />
/// <reference types="msfstypes/JS/Types" />
/// <reference types="msfstypes/JS/NetBingMap" />

import { ReadonlyFloat64Array } from '../../math';
import { Subscribable, SubscribableArray, SubscribableSet } from '../../sub';
import { BingComponent } from '../bing/BingComponent';
import { ComponentProps, DisplayComponent, FSComponent, VNode } from '../FSComponent';

/**
 * Component props for the MapComponent.
 */
export interface SynVisProps extends ComponentProps {
  /** The unique ID to assign to this Bing map. */
  bingId: string;

  /**
   * A subscribable which provides the internal resolution for the Bing component.
   */
  resolution: Subscribable<ReadonlyFloat64Array>;

  /**
   * A subscribable array which provides the earth colors. The array should have a length of exactly 61, with index 0
   * defining the water color and indexes 1 through 60 defining terrain colors from 0 to 60000 feet.
   */
  earthColors?: SubscribableArray<number>;

  /**
   * A subscribable which provides the sky color.
   */
  skyColor: Subscribable<number>;

  /** CSS class(es) to add to the root of the component. */
  class?: string | SubscribableSet<string>;
}

/**
 * A FSComponent that display the MSFS Bing Map, weather radar, and 3D terrain.
 */
export class SynVisComponent extends DisplayComponent<SynVisProps> {
  protected readonly bingRef = FSComponent.createRef<HTMLImageElement>();

  /**
   * A callback which is called when the Bing component is bound.
   */
  protected onBingBound = (): void => {
    // noop
  };

  /**
   * Renders the syn vis component.
   * @returns A component VNode.
   */
  public render(): VNode {
    return (
      <BingComponent
        ref={this.bingRef}
        id={this.props.bingId}
        mode={EBingMode.HORIZON}
        onBoundCallback={this.onBingBound}
        resolution={this.props.resolution}
        earthColors={this.props.earthColors} skyColor={this.props.skyColor}
        class={this.props.class}
      />
    );
  }
}
