/// <reference types="msfstypes/JS/simvar" />
/// <reference types="msfstypes/JS/Avionics" />
import { ComSpacingChangeEvent } from '.';
import { ControlEvents } from '../data/ControlPublisher';
import { EventBus, PublishPacer } from '../data/EventBus';
import { EventSubscriber } from '../data/EventSubscriber';
import { HEvent } from '../data/HEventPublisher';
import { SimVarDefinition, SimVarValueType } from '../data/SimVars';
import { BasePublisher, SimVarPublisher } from './BasePublishers';
import { NavEvents, NavSourceId, NavSourceType } from './NavProcessor';
import { Radio, RadioType, FrequencyBank, RadioEvents } from './RadioCommon';

// There are two main componints to the Nav/Com system currently, because we
// can't rely on K events being processed synchronously.   Instead, we need
// to run a listener which picks up frequency change events, in additon to a
// setter that handles interavion events via H events.

// The first part of this file sets uf the simvar publisher.
// TODO Do we want to move this into a generalized publisher for other things to use?

/** SimVar definitions for a NavComSimVarPublisher */
interface NavComSimVars {
    /** NAV1 active freq */
    nav1ActiveFreq: number,
    /** NAV1 standby freq */
    nav1StandbyFreq: number,
    /** NAV1 ident */
    nav1Ident: string,
    /** NAV2 active freq */
    nav2ActiveFreq: number,
    /** NAV2 standby freq */
    nav2StandbyFreq: number,
    /** NAV2 ident */
    nav2Ident: string,
    /** COM1 active freq */
    com1ActiveFreq: number,
    /** COM1 standby freq */
    com1StandbyFreq: number,
    /** COM2 active freq */
    com2ActiveFreq: number,
    /** COM1 standby freq */
    com2StandbyFreq: number,
    /** ADF1 Standby Frequency */
    adf1StandbyFreq: number,
    /** ADF1 Active Frequency */
    adf1ActiveFreq: number
}

/** A publisher to poll and publish nav/com simvars. */
class NavComSimVarPublisher extends SimVarPublisher<NavComSimVars> {
    private static simvars = new Map<keyof NavComSimVars, SimVarDefinition>([
        ['nav1ActiveFreq', { name: 'NAV ACTIVE FREQUENCY:1', type: SimVarValueType.MHz }],
        ['nav1StandbyFreq', { name: 'NAV STANDBY FREQUENCY:1', type: SimVarValueType.MHz }],
        ['nav1Ident', { name: 'NAV IDENT:1', type: SimVarValueType.String }],
        ['nav2ActiveFreq', { name: 'NAV ACTIVE FREQUENCY:2', type: SimVarValueType.MHz }],
        ['nav2StandbyFreq', { name: 'NAV STANDBY FREQUENCY:2', type: SimVarValueType.MHz }],
        ['nav2Ident', { name: 'NAV IDENT:2', type: SimVarValueType.String }],
        ['com1ActiveFreq', { name: 'COM ACTIVE FREQUENCY:1', type: SimVarValueType.MHz }],
        ['com1StandbyFreq', { name: 'COM STANDBY FREQUENCY:1', type: SimVarValueType.MHz }],
        ['com2ActiveFreq', { name: 'COM ACTIVE FREQUENCY:2', type: SimVarValueType.MHz }],
        ['com2StandbyFreq', { name: 'COM STANDBY FREQUENCY:2', type: SimVarValueType.MHz }],
        ['adf1StandbyFreq', { name: 'ADF STANDBY FREQUENCY:1', type: SimVarValueType.KHz }],
        ['adf1ActiveFreq', { name: 'ADF ACTIVE FREQUENCY:1', type: SimVarValueType.KHz }]
    ])

    /**
     * Create a NavComSimVarPublisher
     * @param bus The EventBus to publish to
     * @param pacer An optional pacer to use to control the pace of publishing
     */
    public constructor(bus: EventBus, pacer: PublishPacer<NavComSimVars> | undefined = undefined) {
        super(NavComSimVarPublisher.simvars, bus, pacer);
    }
}


/**
 * A convenience class for creating a radio configuration set.
 *
 * Implementers should instantiate this and then populate the various maps
 * with the H events that their radio sends and which displays they affect.
 */
export class NavComConfig {
    public navSwitchEvents = new Map<string, string>();
    public navSelectorEvents = new Map<string, string>();
    public navWholeIncEvents = new Map<string, string>();
    public navWholeDecEvents = new Map<string, string>();
    public navFractionIncEvents = new Map<string, string>();
    public navFractionDecEvents = new Map<string, string>();
    public comSwitchEvents = new Map<string, string>();
    public comSelectorEvents = new Map<string, string>();
    public comWholeIncEvents = new Map<string, string>();
    public comWholeDecEvents = new Map<string, string>();
    public comFractionIncEvents = new Map<string, string>();
    public comFractionDecEvents = new Map<string, string>();
}

/**
 * Sends radio events from the nav/com controller to subscribers.
 */
class NavComPublisher extends BasePublisher<RadioEvents>{
    private sync: boolean;

    /**
     * Creates a NavComPublisher
     * @param bus The event bus to publish to.
     * @param pacer An optional pace to use to control the rate of publishing.
     * @param sync Whether to use synced events.
     */
    public constructor(bus: EventBus, pacer?: PublishPacer<RadioEvents>, sync = true) {
        super(bus, pacer);
        this.sync = sync;
    }

    /**
     * Publish a radio state event.
     *
     * This sets the complete state of a radio for initialzation or resync.
     * @param radio The Radio data to publish.
     */
    public publishRadioState(radio: Radio | undefined): void {
        if (radio !== undefined) {
            super.publish('setRadioState', radio, this.sync);
        }
    }

    /**
     * Publish a frequency change event.
     *
     * Unlike a radio state event, this just changes a specific frequency.
     * We provide this to avoid issues with potentially conflicting updates
     * if active and standby get updated quickly and we send a snapshot after
     * each.
     * @param radio The Radio to change.
     * @param bank The frequency bank to update.
     * @param frequency The new frequency to set.
     */
    public publishFreqChange(radio: Radio, bank: FrequencyBank, frequency: number): void {
        if (radio !== undefined) {
            super.publish('setFrequency', { radio: radio, bank: bank, frequency: frequency }, this.sync);
        }
    }

    /**
     * Publish the ident of the currently tuned station.
     * @param index The index number of the tuned radio.
     * @param ident The ident as a string.
     */
    public publishIdent(index: number, ident: string): void {
        super.publish('setIdent', { index: index, ident: ident }, this.sync);
    }
    /**
     * Publish the ADF1 Active Frequency in Khz.
     * @param freq The active frequency in Khz.
     */
    public publishAdfActiveFrequencySet(freq: number): void {
        super.publish('adf1ActiveFreq', freq, false);
    }
    /**
     * Publish the ADF1 Standby Frequency in Khz.
     * @param freq The standby frequency in Khz.
     */
    public publishAdfStandbyFrequencySet(freq: number): void {
        super.publish('adf1StandbyFreq', freq, false);
    }
}

/**
 * The core instrument that will drive all of a system's radios.
 */
export class NavComInstrument {
    private bus: EventBus;
    private hevents: EventSubscriber<HEvent>;
    private publisher: NavComPublisher;
    private simVarPublisher: NavComSimVarPublisher;
    private simVarSubscriber: EventSubscriber<NavComSimVars>;
    private controlSubscriber: EventSubscriber<ControlEvents>;

    private navRadios = new Array<Radio>();
    private comRadios = new Array<Radio>();
    private config: NavComConfig;

    /**
     * Create a NavComController.
     * @param bus The event bus to publish to.
     * @param config A NavComConfig object defining the radio configuration.
     * @param numNavRadios The number of nav radios in the system.
     * @param numComRadios The number of com radios in the system.
     * @param sync Whether to sync events or not, default true.
     */
    public constructor(bus: EventBus, config: NavComConfig, numNavRadios: number, numComRadios: number, sync = true) {
        this.bus = bus;
        this.config = config;

        // Populate our radio arrays.
        for (let i = 1; i <= numNavRadios; i++) {
            this.navRadios.push({
                index: i,
                activeFrequency: 0,
                ident: null,
                standbyFrequency: 0,
                radioType: RadioType.Nav,
                selected: false
            });
        }
        for (let i = 1; i <= numComRadios; i++) {
            this.comRadios.push({
                index: i,
                activeFrequency: 0,
                ident: null,
                standbyFrequency: 0,
                radioType: RadioType.Com,
                selected: false
            });
        }

        // Create our publishers and subscribers.
        this.hevents = this.bus.getSubscriber<HEvent>();
        this.publisher = new NavComPublisher(bus, undefined, sync);
        this.simVarPublisher = new NavComSimVarPublisher(this.bus);
        this.simVarSubscriber = new EventSubscriber<NavComSimVars>(this.bus);
        this.controlSubscriber = bus.getSubscriber<ControlEvents>();

        // Subscribe to the simvars we need to monitor.
        this.simVarPublisher.subscribe('nav1ActiveFreq');
        this.simVarPublisher.subscribe('nav1StandbyFreq');
        this.simVarPublisher.subscribe('nav2ActiveFreq');
        this.simVarPublisher.subscribe('nav2StandbyFreq');
        this.simVarPublisher.subscribe('com1ActiveFreq');
        this.simVarPublisher.subscribe('com1StandbyFreq');
        this.simVarPublisher.subscribe('com2ActiveFreq');
        this.simVarPublisher.subscribe('com2StandbyFreq');
        this.simVarPublisher.subscribe('nav1Ident');
        this.simVarPublisher.subscribe('nav2Ident');
        this.simVarPublisher.subscribe('adf1ActiveFreq');
        this.simVarPublisher.subscribe('adf1StandbyFreq');
    }

    /**
     * Initialize the instrument.
     */
    public init(): void {
        // Start our two publishers.

        this.publisher.startPublish();
        this.simVarPublisher.startPublish();

        // Set up our event handlers, for both H events and simvar updates.
        this.hevents.on('hEvent').handle(this.eventHandler);
        const navProcessorSubscriber = this.bus.getSubscriber<NavEvents>();
        navProcessorSubscriber.on('cdi_select').handle(this.setActiveRadio.bind(this));

        this.controlSubscriber.on('publish_radio_states').handle(this.publishRadioStates.bind(this));
        this.controlSubscriber.on('standby_com_freq').handle(this.setStandbyFreq.bind(this, RadioType.Com));
        this.controlSubscriber.on('com_spacing_set').handle(this.setComSpacing.bind(this));
        this.controlSubscriber.on('standby_nav_freq').handle(this.setStandbyFreq.bind(this, RadioType.Nav));

        this.simVarSubscriber.on('nav1ActiveFreq').whenChangedBy(0.01).handle((data) => {
            this.updateRadioFreqCb(RadioType.Nav, 0, FrequencyBank.Active, data);
        });
        this.simVarSubscriber.on('nav1StandbyFreq').whenChangedBy(0.01).handle((data) => {
            this.updateRadioFreqCb(RadioType.Nav, 0, FrequencyBank.Standby, data);
        });
        this.simVarSubscriber.on('nav2ActiveFreq').whenChangedBy(0.01).handle((data) => {
            this.updateRadioFreqCb(RadioType.Nav, 1, FrequencyBank.Active, data);
        });
        this.simVarSubscriber.on('nav2StandbyFreq').whenChangedBy(0.01).handle((data) => {
            this.updateRadioFreqCb(RadioType.Nav, 1, FrequencyBank.Standby, data);
        });
        this.simVarSubscriber.on('com1ActiveFreq').whenChangedBy(0.001).handle((data) => {
            this.updateRadioFreqCb(RadioType.Com, 0, FrequencyBank.Active, data);
        });
        this.simVarSubscriber.on('com1StandbyFreq').whenChangedBy(0.001).handle((data) => {
            this.updateRadioFreqCb(RadioType.Com, 0, FrequencyBank.Standby, data);
        });
        this.simVarSubscriber.on('com2ActiveFreq').whenChangedBy(0.001).handle((data) => {
            this.updateRadioFreqCb(RadioType.Com, 1, FrequencyBank.Active, data);
        });
        this.simVarSubscriber.on('com2StandbyFreq').whenChangedBy(0.001).handle((data) => {
            this.updateRadioFreqCb(RadioType.Com, 1, FrequencyBank.Standby, data);
        });
        this.simVarSubscriber.on('nav1Ident').whenChanged().handle((data) => {
            this.navRadios[0].ident = data;
            this.publisher.publishIdent(1, data);
        });
        this.simVarSubscriber.on('nav2Ident').whenChanged().handle((data) => {
            this.navRadios[1].ident = data;
            this.publisher.publishIdent(2, data);
        });
        this.simVarSubscriber.on('adf1ActiveFreq').whenChanged().handle((freq) => {
            this.publisher.publishAdfActiveFrequencySet(freq);
        });
        this.simVarSubscriber.on('adf1StandbyFreq').whenChanged().handle((freq) => {
            this.publisher.publishAdfStandbyFrequencySet(freq);
        });


        // Configure and publish the initial state of all our radios.
        this.navRadios[0].selected = true;
        this.comRadios[0].selected = true;
        for (let i = 0; i < this.navRadios.length; i++) {
            this.updateAndPublish(this.navRadios[i]);
        }

        for (let i = 0; i < this.comRadios.length; i++) {
            this.updateAndPublish(this.comRadios[i]);
        }
    }

    /**
     * Perform events for the update loop.
     */
    public onUpdate(): void {
        // Currently, we just need to update our simvar publisher so it polls.
        this.simVarPublisher.onUpdate();
    }

    /**
     * Get the current frequency of a radio.
     * @param radioType The RadioType to query.
     * @param index The index number of the desired radio.
     * @param bank The FrequencyBank to query.
     * @returns The frequency in MHz.
     */
    private getFrequency(radioType: RadioType, index: number, bank: FrequencyBank): number {
        return SimVar.GetSimVarValue(`${radioType == RadioType.Com ? 'COM' : 'NAV'} ${bank == FrequencyBank.Active ? 'ACTIVE' : 'STANDBY'} FREQUENCY:${index}`, 'MHz');
    }

    /**
     * React to a change on a radio frequency simvar.
     * @param type The RadioType to update.
     * @param index Index of the radio in the internal array.
     * @param bank The FrequencyBank in the selected radio to update.
     * @param freq The new frequency in MHz.
     */
    private updateRadioFreqCb(type: RadioType, index: number, bank: FrequencyBank, freq: number): void {
        // Note: 'index' here is the index of the radio in our internal array,
        // not the device index.  This is confusing, and we should probably use
        // different words for each of the two data points.
        // TODO Disambigurate radio device number"index" from index in internal array.
        const radioArr = type == RadioType.Nav ? this.navRadios : this.comRadios;
        switch (bank) {
            case FrequencyBank.Active:
                radioArr[index].activeFrequency = freq;
                this.publisher.publishFreqChange(radioArr[index], FrequencyBank.Active, freq);
                break;
            case FrequencyBank.Standby:
                radioArr[index].standbyFrequency = freq;
                this.publisher.publishFreqChange(radioArr[index], FrequencyBank.Standby, freq);
                break;
        }
    }

    /**
     * Handle an hEvent.
     * @param hEvent The event that needs to be handled.
     */
    private eventHandler = (hEvent: string): void => {
        // We can't use a switch statement here because of the need to retrieve
        // the key from each map.  Sorry it's so ugly.
        if (this.config.navSwitchEvents?.has(hEvent)) {
            this.swapFreqs(this.getSelectedRadio(this.navRadios));
        } else if (this.config.navSelectorEvents?.has(hEvent)) {
            this.swapSelection(this.navRadios);
        } else if (this.config.navWholeIncEvents?.has(hEvent)) {
            this.wholeInc(this.getSelectedRadio(this.navRadios));
        } else if (this.config.navWholeDecEvents?.has(hEvent)) {
            this.wholeDec(this.getSelectedRadio(this.navRadios));
        } else if (this.config.navFractionIncEvents?.has(hEvent)) {
            this.fractInc(this.getSelectedRadio(this.navRadios));
        } else if (this.config.navFractionDecEvents?.has(hEvent)) {
            this.fractDec(this.getSelectedRadio(this.navRadios));
        } else if (this.config.comSwitchEvents?.has(hEvent)) {
            this.swapFreqs(this.getSelectedRadio(this.comRadios));
        } else if (this.config.comSelectorEvents?.has(hEvent)) {
            this.swapSelection(this.comRadios);
        } else if (this.config.comWholeIncEvents?.has(hEvent)) {
            this.wholeInc(this.getSelectedRadio(this.comRadios));
        } else if (this.config.comWholeDecEvents?.has(hEvent)) {
            this.wholeDec(this.getSelectedRadio(this.comRadios));
        } else if (this.config.comFractionIncEvents?.has(hEvent)) {
            this.fractInc(this.getSelectedRadio(this.comRadios));
        } else if (this.config.comFractionDecEvents?.has(hEvent)) {
            this.fractDec(this.getSelectedRadio(this.comRadios));
        }
    }

    /**
     * Get the current selected radio in a collection of radios.
     * @param radios An array of Radios.
     * @returns The selected Radio in the array.
     */
    private getSelectedRadio(radios: Array<Radio>): Radio | undefined {
        for (const radio of radios) {
            if (radio.selected) {
                return radio;
            }
        }
        return undefined;
    }

    /**
     * Swap frequencies in a radio.
     * @param radio The radio whose frequencies we want to swap.
     */
    private swapFreqs(radio: Radio | undefined): void {
        if (radio !== undefined) {
            this.setKVar('SWAP', radio);
        }
    }

    /**
     * Update the frequencies in a radio from simvars.
     *
     * This is useful for snapshot updates as long as we're not worried
     * about one of the frequencies being updated while the snapshot is in
     * flight.
     * @param radio the radio to update
     */
    private updateAndPublish(radio: Radio | undefined): void {
        if (radio !== undefined) {
            radio.activeFrequency = this.getFrequency(radio.radioType,
                radio.index,
                FrequencyBank.Active);
            radio.standbyFrequency = this.getFrequency(radio.radioType,
                radio.index,
                FrequencyBank.Standby);
        }

        switch (radio?.radioType) {
            case RadioType.Com:
                this.comRadios[radio.index - 1] = radio;
                break;
            case RadioType.Nav:
                this.navRadios[radio.index - 1] = radio;
                break;
        }
        this.publisher.publishRadioState(radio);
    }


    /**
     * Explicitly set a new selected nav radio.
     * @param navSourceId An array of Radios to toggle.
     */
    private setActiveRadio(navSourceId: NavSourceId): void {
        if (navSourceId.type === NavSourceType.Nav) {
            for (let i = 0; i < this.navRadios.length; i++) {
                const radio = this.navRadios[i];
                if (radio.index == navSourceId.index) {
                    radio.selected = true;
                } else {
                    radio.selected = false;
                }
                this.publisher.publishRadioState(radio);
            }
        }
    }

    /**
     * Set the standby frequency of the currently selected nav or com radio.
     * @param radioType The radio type we want to set standby for.
     * @param frequency The frequency in MHz as a string.
     */
    private setStandbyFreq(radioType: RadioType, frequency: string): void {
        let radio: Radio | undefined;
        switch (radioType) {
            case RadioType.Com:
                radio = this.getSelectedRadio(this.comRadios);
                break;
            case RadioType.Nav:
                radio = this.getSelectedRadio(this.navRadios);
                break;
        }
        this.freqSet(radio, FrequencyBank.Standby, frequency);
    }

    /**
     * Toggle which of the radios is selected.
     * @param radios An array of Radios to toggle.
     */
    private swapSelection(radios: Array<Radio>): void {
        // TODO It would be nice to extend this to handle systems with more than 2 radios
        for (let i = 0; i < radios.length; i++) {
            radios[i].selected = !radios[i].selected;
            this.publisher.publishRadioState(radios[i]);
        }
    }

    /**
     * Increase the integer portion of a frequency.
     * @param radio The Radio to update.
     */
    private wholeInc(radio: Radio | undefined): void {
        this.setKVar('WHOLE_INC', radio);
    }

    /**
     * Decrease the integer portion of a frequency.
     * @param radio The Radio to update.
     */
    private wholeDec(radio: Radio | undefined): void {
        this.setKVar('WHOLE_DEC', radio);
    }

    /**
     * Increase the decimal portion of a frequency.
     * @param radio The Radio to update.
     */
    private fractInc(radio: Radio | undefined): void {
        this.setKVar('FRACT_INC', radio);
    }

    /**
     * Decrease the decimal portion of a frequency.
     * @param radio The Radio to update.
     */
    private fractDec(radio: Radio | undefined): void {
        this.setKVar('FRACT_DEC', radio);
    }

    /**
     * Set the full frequency of a radio.
     * @param radio The Radio to update.
     * @param bank The FrequencyBank to update.
     * @param freq The new frequency in MHz as a string.
     */
    private freqSet(radio: Radio | undefined, bank: FrequencyBank, freq: string): void {
        if (!radio) {
            return;
        }

        let radioId: string;
        if (radio.radioType == RadioType.Com) {
            const first = radio.index == 1 ? 'COM' : `COM${radio.index}`;
            const second = bank == FrequencyBank.Active ? 'RADIO' : 'STBY_RADIO';
            radioId = `${first}_${second}`;
        } else {
            radioId = `NAV${radio.index}_${bank == FrequencyBank.Active ? 'RADIO' : 'STBY'}`;
        }

        const freqMhz = Math.round(parseFloat(freq) * 1000) / 1000;
        SimVar.SetSimVarValue(`K:${radioId}_SET`, 'Frequency BCD16', Avionics.Utils.make_bcd16(Math.round(freqMhz * 1_000_000)));
    }

    /**
     * Set the K var for a frequency event
     * @param action A string defining whole/fract and inc/dec.
     * @param radio The radio this frequency is for.
     */
    private setKVar(action: string, radio: Radio | undefined): void {
        if (radio == undefined) {
            return;
        }
        let device: string;
        switch (radio.radioType) {
            case RadioType.Nav:
                device = `NAV${radio.index}`;
                break;
            case RadioType.Com:
                if (action == 'SWAP') {
                    // Com radios break the naming pattern for swap events. :(
                    device = radio.index == 1 ? 'COM_STBY' : `COM${radio.index}`;
                } else {
                    device = radio.index == 1 ? 'COM' : `COM${radio.index}`;
                }
                break;
            default: // this should never happen
                return;
        }
        SimVar.SetSimVarValue(`K:${device}_RADIO_${action}`, 'number', 0);
    }

    /**
     * Send an update of all our radio states.
     * @param data True if we really want to do this.  (We need to support non-paramaterized commands.())
     */
    private publishRadioStates(data: boolean): void {
        if (!data) { return; }
        for (const radio of this.navRadios) {
            this.publisher.publishRadioState(radio);
        }
        for (const radio of this.comRadios) {
            this.publisher.publishRadioState(radio);
        }
    }

    /**
     * Sets the COM frequency spacing.
     * @param evt The event that is setting the spacing.
     */
    private setComSpacing(evt: ComSpacingChangeEvent): void {
        const currentSpacing = SimVar.GetSimVarValue(`COM SPACING MODE:${evt.index}`, SimVarValueType.Enum);
        if (currentSpacing !== evt.spacing) {
            SimVar.SetSimVarValue(`K:COM_${evt.index.toFixed(0)}_SPACING_MODE_SWITCH`, 'number', 0);
        }
    }
}