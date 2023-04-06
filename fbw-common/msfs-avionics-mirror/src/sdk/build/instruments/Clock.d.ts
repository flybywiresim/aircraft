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
export declare class ClockPublisher extends BasePublisher<ClockEvents> {
    onUpdate(): void;
    /**
     * Converts the sim's absolute time to a UNIX timestamp. The sim's absolute time value is equivalent to a .NET
     * DateTime.Ticks value (epoch = 00:00:00 01 Jan 0001).
     * @param absoluteTime an absolute time value, in units of seconds.
     * @returns the UNIX timestamp corresponding to the absolute time value.
     */
    private static absoluteTimeToUNIXTime;
}
/**
 * A clock which keeps track of real-world and sim time.
 */
export declare class Clock {
    private publisher;
    /**
     * Constructor.
     * @param bus The event bus to use to publish events from this clock.
     */
    constructor(bus: EventBus);
    /**
     * Initializes this clock.
     */
    init(): void;
    /**
     * Updates this clock.
     */
    onUpdate(): void;
}
//# sourceMappingURL=Clock.d.ts.map