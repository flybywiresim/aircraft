import { EventBus } from '../data/EventBus';
import { BasePublisher } from './BasePublishers';

/**
 * Events related to the clock.
 */
export interface ClockEvents {
  /** A UNIX timestamp corresponding to the real-world (operating system) time. */
  realTime: number;

  /** A UNIX timestamp corresponding to the simulation time. */
  simTime: number;
}

/**
 * A publisher of clock events.
 */
export class ClockPublisher extends BasePublisher<ClockEvents> {
  // eslint-disable-next-line jsdoc/require-jsdoc
  public onUpdate(): void {
    this.publish('realTime', Date.now());
    this.publish('simTime', ClockPublisher.absoluteTimeToUNIXTime(SimVar.GetSimVarValue('E:ABSOLUTE TIME', 'seconds')));
  }

  /**
   * Converts the sim's absolute time to a UNIX timestamp. The sim's absolute time value is equivalent to a .NET
   * DateTime.Ticks value (epoch = 00:00:00 01 Jan 0001).
   * @param absoluteTime an absolute time value, in units of seconds.
   * @returns the UNIX timestamp corresponding to the absolute time value.
   */
  private static absoluteTimeToUNIXTime(absoluteTime: number): number {
    return (absoluteTime - 62135596800) * 1000;
  }
}

/**
 * A clock which keeps track of real-world and sim time.
 */
export class Clock {
  private publisher: ClockPublisher;

  /**
   * Constructor.
   * @param bus The event bus to use to publish events from this clock.
   */
  constructor(bus: EventBus) {
    this.publisher = new ClockPublisher(bus);
  }

  /**
   * Initializes this clock.
   */
  public init(): void {
    this.publisher.startPublish();
  }

  /**
   * Updates this clock.
   */
  public onUpdate(): void {
    this.publisher.onUpdate();
  }
}