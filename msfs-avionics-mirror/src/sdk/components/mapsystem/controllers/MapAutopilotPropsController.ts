import { EventSubscriber } from '../../../data/EventSubscriber';
import { APEvents } from '../../../instruments/APPublisher';
import { UnitType } from '../../../math/NumberUnit';
import { Subscribable } from '../../../sub/Subscribable';
import { Subscription } from '../../../sub/Subscription';
import { MapAutopilotPropsModule } from '../../map/modules/MapAutopilotPropsModule';
import { MapSystemContext } from '../MapSystemContext';
import { MapSystemController } from '../MapSystemController';
import { MapSystemKeys } from '../MapSystemKeys';

/**
 * Modules required for MapAutopilotPropsController.
 */
export interface MapAutopilotPropsControllerModules {
  /** Autopilot properties. */
  [MapSystemKeys.AutopilotProps]: MapAutopilotPropsModule;
}

/**
 * A key for a property in {@link MapAutopilotPropsModule}.
 */
export type MapAutopilotPropsKey = Extract<keyof MapAutopilotPropsModule, string>;

/**
 * A partial set of subscriptions for module property bindings.
 */
type MapOwnAirplanePropsSub = Partial<Record<MapAutopilotPropsKey, Subscription>>;

/**
 * Updates the properties in a {@link MapAutopilotPropsModule}.
 */
export class MapAutopilotPropsController extends MapSystemController<MapAutopilotPropsControllerModules> {
  private readonly module = this.context.model.getModule(MapSystemKeys.AutopilotProps);

  private readonly subs: MapOwnAirplanePropsSub = {};

  private updateFreqSub?: Subscription;

  /**
   * Constructor.
   * @param context This controller's map context.
   * @param properties The properties to update on the module.
   * @param updateFreq A subscribable which provides the update frequency, in hertz. If not defined, the properties
   * will be updated every frame.
   */
  constructor(
    context: MapSystemContext<MapAutopilotPropsControllerModules>,
    private readonly properties: Iterable<MapAutopilotPropsKey>,
    private readonly updateFreq?: Subscribable<number>
  ) {
    super(context);
  }

  /** @inheritdoc */
  public onAfterMapRender(): void {
    const sub = this.context.bus.getSubscriber<APEvents>();

    if (this.updateFreq) {
      this.updateFreqSub = this.updateFreq.sub(freq => {
        for (const property of this.properties) {
          this.subs[property]?.destroy();
          this.subs[property] = this.bindProperty(sub, property, freq);
        }
      }, true);
    } else {
      for (const property of this.properties) {
        this.subs[property] = this.bindProperty(sub, property);
      }
    }
  }

  /**
   * Binds a module property to data received through the event bus.
   * @param sub The event bus subscriber.
   * @param property The property to bind.
   * @param updateFreq The data update frequency.
   * @returns The subscription created by the binding.
   */
  private bindProperty(sub: EventSubscriber<APEvents>, property: MapAutopilotPropsKey, updateFreq?: number): Subscription {
    switch (property) {
      case 'selectedAltitude':
        return (updateFreq === undefined ? sub.on('ap_altitude_selected') : sub.on('ap_altitude_selected').atFrequency(updateFreq))
          .handle(alt => { this.module.selectedAltitude.set(alt, UnitType.FOOT); });
    }
  }

  /** @inheritdoc */
  public onMapDestroyed(): void {
    this.destroy();
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.updateFreqSub?.destroy();
    for (const property of this.properties) {
      this.subs[property]?.destroy();
    }
  }
}