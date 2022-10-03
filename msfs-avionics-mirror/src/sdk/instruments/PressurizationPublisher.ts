import { EventBus, PublishPacer, SimVarDefinition, SimVarValueType } from '../data';
import { SimVarPublisher } from './BasePublishers';

/**
 * An interface that describes the possible Pressurization events
 * on the event bus.
 */
export interface PressurizationEvents {

  /** A cabin altitude value. */
  cabin_altitude: number;

  /** A cabin altitude rate value. */
  cabin_altitude_rate: number;

  /** A pressure differential value. */
  pressure_diff: number;

}

/**
 * A publisher for Pressurization information.
 */
export class PressurizationPublisher extends SimVarPublisher<PressurizationEvents> {
  private static simvars = new Map<keyof PressurizationEvents, SimVarDefinition>([
    ['cabin_altitude', { name: 'PRESSURIZATION CABIN ALTITUDE', type: SimVarValueType.Feet }],
    ['cabin_altitude_rate', { name: 'PRESSURIZATION CABIN ALTITUDE RATE', type: SimVarValueType.FPM }],
    ['pressure_diff', { name: 'PRESSURIZATION PRESSURE DIFFERENTIAL', type: SimVarValueType.PSI }]
  ]);

  /**
   * Updates the ADC publisher.
   */
  public onUpdate(): void {
    super.onUpdate();
  }

  /**
   * Create an PressurizationPublisher
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer: PublishPacer<PressurizationEvents> | undefined = undefined) {
    super(PressurizationPublisher.simvars, bus, pacer);
  }
}