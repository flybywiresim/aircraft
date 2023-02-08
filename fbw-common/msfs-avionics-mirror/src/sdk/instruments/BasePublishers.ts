import { EventBus, MockEventTypes, Publisher, PublishPacer } from '../data/EventBus';
import { SimVarDefinition, SimVarEventTypes } from '../data/SimVars';

const latlonaltRegEx = new RegExp(/latlonalt/i);
const latlonaltpbhRegex = new RegExp(/latlonaltpbh/i);
const pbhRegex = new RegExp(/pbh/i);
const pid_structRegex = new RegExp(/pid_struct/i);
const xyzRegex = new RegExp(/xyz/i);
const stringRegex = new RegExp(/string/i);
const boolRegex = new RegExp(/boolean|bool/i);
const numberRegex = new RegExp(/number/i);
const defaultSource = '';
SimVar.GetSimVarValue = (name, unit, dataSource = defaultSource) => {
    try {
        // @ts-ignore
        if (simvar) {
            let output;
            const registeredID = SimVar.GetRegisteredId(name, unit, dataSource);
            if (registeredID >= 0) {
                if (numberRegex.test(unit)) {
                    // @ts-ignore
                    output = simvar.getValueReg(registeredID);
                } else if (stringRegex.test(unit)) {
                    // @ts-ignore
                    output = simvar.getValueReg_String(registeredID);
                } else if (latlonaltRegEx.test(unit)) {
                    // @ts-ignore
                    output = new LatLongAlt(simvar.getValue_LatLongAlt(name, dataSource));
                } else if (latlonaltpbhRegex.test(unit)) {
                    // @ts-ignore
                    output = new LatLongAltPBH(simvar.getValue_LatLongAltPBH(name, dataSource));
                } else if (pbhRegex.test(unit)) {
                    // @ts-ignore
                    output = new PitchBankHeading(simvar.getValue_PBH(name, dataSource));
                } else if (pid_structRegex.test(unit)) {
                    // @ts-ignore
                    output = new PID_STRUCT(simvar.getValue_PID_STRUCT(name, dataSource));
                } else if (xyzRegex.test(unit)) {
                    // @ts-ignore
                    output = new XYZ(simvar.getValue_XYZ(name, dataSource));
                } else {
                    // @ts-ignore
                    output = simvar.getValueReg(registeredID);
                }
            }
            return output;
        }

        console.warn(`SimVar handler is not defined (${name})`);
    } catch (error) {
        console.warn('ERROR ', error, ` GetSimVarValue ${name} unit : ${unit}`);
        return null;
    }
    return null;
};
SimVar.SetSimVarValue = (name, unit, value, dataSource = defaultSource) => {
    if (value == undefined) {
        console.warn(`${name} : Trying to set a null value`);
        return Promise.resolve();
    }
    try {
        // @ts-ignore
        if (simvar) {
            const regID = SimVar.GetRegisteredId(name, unit, dataSource);
            if (regID >= 0) {
                if (stringRegex.test(unit)) {
                    return Coherent.call('setValueReg_String', regID, value);
                }
                if (boolRegex.test(unit)) {
                    return Coherent.call('setValueReg_Bool', regID, !!value);
                }
                if (numberRegex.test(unit)) {
                    return Coherent.call('setValueReg_Number', regID, value);
                }
                if (latlonaltRegEx.test(unit)) {
                    return Coherent.call('setValue_LatLongAlt', name, value, dataSource);
                }
                if (latlonaltpbhRegex.test(unit)) {
                    return Coherent.call('setValue_LatLongAltPBH', name, value, dataSource);
                }
                if (pbhRegex.test(unit)) {
                    return Coherent.call('setValue_PBH', name, value, dataSource);
                }
                if (pid_structRegex.test(unit)) {
                    return Coherent.call('setValue_PID_STRUCT', name, value, dataSource);
                }
                if (xyzRegex.test(unit)) {
                    return Coherent.call('setValue_XYZ', name, value, dataSource);
                }

                return Coherent.call('setValueReg_Number', regID, value);
            }
        } else {
            console.warn('SimVar handler is not defined');
        }
    } catch (error) {
        console.warn(`error SetSimVarValue ${error}`);
    }
    return Promise.resolve();
};


/**
 * A basic event-bus publisher.
 */
export class BasePublisher<E> {

    private bus: EventBus;
    private publisher: Publisher<E>;
    private publishActive: boolean;
    private pacer: PublishPacer<E> | undefined;

    /**
     * Creates an instance of BasePublisher.
     * @param bus The common event bus.
     * @param pacer An optional pacer to control the rate of publishing.
     */
    public constructor(bus: EventBus, pacer: PublishPacer<E> | undefined = undefined) {
        this.bus = bus;
        this.publisher = this.bus.getPublisher<E>();
        this.publishActive = false;
        this.pacer = pacer;
    }

    /**
     * Start publishing.
     */
    public startPublish(): void {
        this.publishActive = true;
    }

    /**
     * Stop publishing.
     */
    public stopPublish(): void {
        this.publishActive = false;
    }

    /**
     * Tells whether or not the publisher is currently active.
     * @returns True if the publisher is active, false otherwise.
     */
    public isPublishing(): boolean {
        return this.publishActive;
    }

    /**
     * A callback called when the publisher receives an update cycle.
     */
    public onUpdate(): void {
        return;
    }

    /**
     * Publish a message if publishing is acpive
     * @param topic The topic key to publish to.
     * @param data The data type for chosen topic.
     * @param sync Whether or not the event should be synced via local storage.
     * @param isCached Whether or not the event should be cached.
     */
    protected publish<K extends keyof E>(topic: K, data: E[K], sync = false, isCached = true): void {
        if (this.publishActive && (!this.pacer || this.pacer.canPublish(topic, data))) {
            this.publisher.pub(topic, data, sync, isCached);
        }
    }
}

/**
 * A publisher that sends a constant stream of random numbers.
 */
export class RandomNumberPublisher extends BasePublisher<MockEventTypes> {
    /**
     * Start publishing random numbers.
     */
    public startPublish(): void {
        super.startPublish();
        this.publishRandomNumbers();
    }

    /**
     * Async thread that publishes random numbers
     * @param ms - Milliseconds to sleep between publishes
     */
    private async publishRandomNumbers(ms = 1000): Promise<any> {
        while (this.isPublishing()) {
            const newVal = Math.floor(Math.random() * ms);
            this.publish('randomNumber', newVal, true);
            await new Promise(r => setTimeout(r, ms));
        }
    }
}

/**
 * A base class for publishers that need to handle simvars with built-in
 * support for pacing callbacks.
 */
export class SimVarPublisher<E extends SimVarEventTypes> extends BasePublisher<E> {
    private simvars: Map<keyof E, SimVarDefinition>;
    protected subscribed: Set<keyof E>;

    /**
     * Create a SimVarPublisher
     * @param simVarMap A map of simvar event type keys to a SimVarDefinition.
     * @param bus The EventBus to use for publishing.
     * @param pacer An optional pacer to control the rate of publishing.
     */
    public constructor(simVarMap: Map<keyof E, SimVarDefinition>,
        bus: EventBus, pacer: PublishPacer<E> | undefined = undefined) {
        super(bus, pacer);
        this.simvars = simVarMap;
        this.subscribed = new Set<keyof E>();
    }

    /**
     * Subscribe to an event type to begin publishing.
     * @param data Key of the event type in the simVarMap
     */
    public subscribe(data: keyof E): void {
        this.subscribed.add(data);
    }

    /**
     * Unsubscribe to an event to stop publishing.
     * @param data Key of the event type in the simVarMap
     */
    public unsubscribe(data: keyof E): void {
        // TODO If we have multiple subscribers we may want to add reference counting here.
        this.subscribed.delete(data);
    }

    /**
     * Read the value of a given simvar by its key.
     * @param key The key of the simvar in simVarMap
     * @returns The value returned by SimVar.GetSimVarValue()
     */
    public getValue(key: keyof E): any {
        const simvar = this.simvars.get(key);
        if (simvar === undefined) {
            return undefined;
        }
        return SimVar.GetSimVarValue(typeof simvar.name === 'function' ? simvar.name() : simvar.name, simvar.type);
    }

    /**
     * Publish all subscribed data points to the bus.
     */
    public onUpdate(): void {
        for (const data of this.subscribed.values()) {
            const value = this.getValue(data);
            if (value !== undefined) {
                this.publish(data, value);
            }
        }
    }

    /**
     * Change the simvar read for a given key.
     * @param key The key of the simvar in simVarMap
     * @param value The new value to set the simvar to.
     */
    public updateSimVarSource(key: keyof E, value: SimVarDefinition): void {
        this.simvars.set(key, value);
    }
}
