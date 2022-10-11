import { ClockEvents } from '../../../instruments/Clock';
import { Subscribable } from '../../../sub/Subscribable';
import { Subscription } from '../../../sub/Subscription';
import { MapSystemComponent } from '../MapSystemComponent';
import { MapSystemController } from '../MapSystemController';

/**
 * Context values required for MapClockUpdateController.
 */
export interface MapClockUpdateControllerContext {
  /** The map update frequency. */
  updateFreq: Subscribable<number>;
}

/**
 * Updates a map at regular intervals based on event bus clock events.
 */
export class MapClockUpdateController extends MapSystemController<any, any, any, MapClockUpdateControllerContext> {
  private freqSub?: Subscription;
  private clockSub?: Subscription;

  /** @inheritdoc */
  public onAfterMapRender(ref: MapSystemComponent): void {

    this.freqSub = this.context.updateFreq.sub(freq => {
      this.clockSub?.destroy();

      this.clockSub = this.context.bus.getSubscriber<ClockEvents>().on('realTime').atFrequency(freq).handle(realTime => {
        ref.update(realTime);
      });
    }, true);
  }

  /** @inheritdoc */
  public onMapDestroyed(): void {
    this.destroy();
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.clockSub?.destroy();
    this.freqSub?.destroy();
  }
}