import { BasePublisher } from './BasePublishers';

/**
 * any kind of initable instrument
 */
export interface Instrument {
    /** the init function */
    init: () => void,
    /** the update function */
    onUpdate: () => void
}

/**
 * InstrumentBackplane provides a common control point for aggregating and
 * managing any number of publishers.  This can be used as an "update loop"
 * corral", amongst other things.
 */
export class InstrumentBackplane {
    // TODO Simplify the backplane
    // Now that we've added instruments and have a lot of redundant
    // logic for them as compared to publishers, we should reconsider
    // how we want the backplane to work.
    private publishers: Map<string, BasePublisher<any>>;
    private instruments: Map<string, Instrument>;

    /**
     * Create an InstrumentBackplane
     */
    public constructor() {
        this.publishers = new Map<string, BasePublisher<any>>();
        this.instruments = new Map<string, Instrument>();
    }

    /**
     * Initialize all the things. This is initially just a proxy for the
     * private initPublishers() and initInstruments() methods.
     *
     * This should be simplified.
     */
    public init(): void {
        this.initPublishers();
        this.initInstruments();
    }

    /**
     * Update all the things.  This is initially just a proxy for the private
     * updatePublishers() and updateInstruments() methods.
     *
     * This should be simplified.
     */
    public onUpdate(): void {
        this.updatePublishers();
        this.updateInstruments();
    }

    /**
     * Add a publisher to the backplane.
     * @param name - a symbolic name for the publisher for reference
     * @param publisher - a publisher extending BasePublisher
     */
    public addPublisher(name: string, publisher: BasePublisher<any>): void {
        this.publishers.set(name, publisher);
    }

    /**
     * Add an instrument to the backplane.
     * @param name - a symbolic name for the publisher for reference
     * @param instrument - an instrument implementing Instrment
     */
    public addInstrument(name: string, instrument: Instrument): void {
        this.instruments.set(name, instrument);
    }


    /**
     * Initialize all of the publishers that you hold.
     */
    private initPublishers(): void {
        for (const publisher of this.publishers.values()) {
            publisher.startPublish();
        }
    }

    /**
     * Initialize all of the instruments that you hold.
     */
    private initInstruments(): void {
        for (const instrument of this.instruments.values()) {
            instrument.init();
        }
    }

    /**
     * Update all of the publishers that you hold.
     */
    private updatePublishers(): void {
        for (const publisher of this.publishers.values()) {
            publisher.onUpdate();
        }
    }

    /**
     * Update all of the instruments that you hold.
     */
    private updateInstruments(): void {
        for (const instrument of this.instruments.values()) {
            instrument.onUpdate();
        }
    }
}