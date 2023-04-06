import { BasePublisher } from './BasePublishers';
/**
 * A publisher of clock events.
 */
export class ClockPublisher extends BasePublisher {
    // eslint-disable-next-line jsdoc/require-jsdoc
    onUpdate() {
        this.publish('realTime', Date.now());
        this.publish('simTime', ClockPublisher.absoluteTimeToUNIXTime(SimVar.GetSimVarValue('E:ABSOLUTE TIME', 'seconds')));
    }
    /**
     * Converts the sim's absolute time to a UNIX timestamp. The sim's absolute time value is equivalent to a .NET
     * DateTime.Ticks value (epoch = 00:00:00 01 Jan 0001).
     * @param absoluteTime an absolute time value, in units of seconds.
     * @returns the UNIX timestamp corresponding to the absolute time value.
     */
    static absoluteTimeToUNIXTime(absoluteTime) {
        return (absoluteTime - 62135596800) * 1000;
    }
}
/**
 * A clock which keeps track of real-world and sim time.
 */
export class Clock {
    /**
     * Constructor.
     * @param bus The event bus to use to publish events from this clock.
     */
    constructor(bus) {
        this.publisher = new ClockPublisher(bus);
    }
    /**
     * Initializes this clock.
     */
    init() {
        this.publisher.startPublish();
    }
    /**
     * Updates this clock.
     */
    onUpdate() {
        this.publisher.onUpdate();
    }
}
