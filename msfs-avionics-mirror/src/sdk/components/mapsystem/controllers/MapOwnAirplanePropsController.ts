import { EventSubscriber } from '../../../data/EventSubscriber';
import { AdcEvents } from '../../../instruments/Adc';
import { AhrsEvents } from '../../../instruments/Ahrs';
import { GNSSEvents } from '../../../instruments/GNSS';
import { UnitType } from '../../../math/NumberUnit';
import { Subscribable } from '../../../sub/Subscribable';
import { Subscription } from '../../../sub/Subscription';
import { MapOwnAirplanePropsModule } from '../../map/modules/MapOwnAirplanePropsModule';
import { MapSystemContext } from '../MapSystemContext';
import { MapSystemController } from '../MapSystemController';
import { MapSystemKeys } from '../MapSystemKeys';

/**
 * Modules required for MapOwnAirplanePropsController.
 */
export interface MapOwnAirplanePropsControllerModules {
  /** Own airplane properties. */
  [MapSystemKeys.OwnAirplaneProps]: MapOwnAirplanePropsModule;
}

/**
 * A key for a property in {@link MapOwnAirplanePropsModule}.
 */
export type MapOwnAirplanePropsKey = Extract<keyof MapOwnAirplanePropsModule, string>;

/**
 * A partial set of subscriptions for module property bindings.
 */
type MapOwnAirplanePropsSub = Partial<Record<MapOwnAirplanePropsKey, Subscription>>;

/**
 * Updates the properties in a {@link MapOwnAirplanePropsModule}.
 */
export class MapOwnAirplanePropsController extends MapSystemController<MapOwnAirplanePropsControllerModules> {
  private readonly module = this.context.model.getModule(MapSystemKeys.OwnAirplaneProps);

  private readonly subs: MapOwnAirplanePropsSub = {};

  private updateFreqSub?: Subscription;

  /**
   * Constructor.
   * @param context This controller's map context.
   * @param properties The properties to update on the module.
   * @param updateFreq A subscribable which provides the update frequency, in hertz.
   */
  constructor(
    context: MapSystemContext<MapOwnAirplanePropsControllerModules>,
    private readonly properties: Iterable<MapOwnAirplanePropsKey>,
    private readonly updateFreq: Subscribable<number>
  ) {
    super(context);
  }

  /** @inheritdoc */
  public onAfterMapRender(): void {
    const sub = this.context.bus.getSubscriber<AdcEvents & AhrsEvents & GNSSEvents>();

    this.updateFreqSub = this.updateFreq.sub(freq => {
      for (const property of this.properties) {
        this.subs[property]?.destroy();
        this.subs[property] = this.bindProperty(sub, property, freq);
      }
    }, true);
  }

  /**
   * Binds a module property to data received through the event bus.
   * @param sub The event bus subscriber.
   * @param property The property to bind.
   * @param updateFreq The data update frequency.
   * @returns The subscription created by the binding.
   */
  private bindProperty(sub: EventSubscriber<AdcEvents & AhrsEvents & GNSSEvents>, property: MapOwnAirplanePropsKey, updateFreq: number): Subscription {
    switch (property) {
      case 'position':
        return sub.on('gps-position').atFrequency(updateFreq).handle(lla => { this.module.position.set(lla.lat, lla.long); });
      case 'altitude':
        return sub.on('indicated_alt').atFrequency(updateFreq).handle(alt => { this.module.altitude.set(alt, UnitType.FOOT); });
      case 'groundSpeed':
        return sub.on('ground_speed').atFrequency(updateFreq).handle(gs => { this.module.groundSpeed.set(gs, UnitType.KNOT); });
      case 'hdgTrue':
        return sub.on('hdg_deg_true').atFrequency(updateFreq).handle(hdg => { this.module.hdgTrue.set(hdg); });
      case 'trackTrue':
        return sub.on('track_deg_true').atFrequency(updateFreq).handle(track => { this.module.trackTrue.set(track); });
      case 'verticalSpeed':
        return sub.on('vertical_speed').atFrequency(updateFreq).handle(vs => { this.module.verticalSpeed.set(vs, UnitType.FPM); });
      case 'turnRate':
        return sub.on('delta_heading_rate').atFrequency(updateFreq).handle(turnRate => { this.module.turnRate.set(turnRate); });
      case 'isOnGround':
        return sub.on('on_ground').atFrequency(updateFreq).handle(isOnGround => { this.module.isOnGround.set(isOnGround); });
      case 'magVar':
        return sub.on('magvar').atFrequency(updateFreq).handle(magVar => { this.module.magVar.set(magVar); });
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