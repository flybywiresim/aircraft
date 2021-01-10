import { AcceleratedKnob } from "./AcceleratedKnob.mjs";
import { RadioModeSelector } from './RadioModeSelector.mjs';
import { useInteractionEvent } from '../util.mjs';


/**
 * @param {number} frequency The frequency to find the next frequency for (in kHz).
 * @param {boolean} supports833 Whether the frequency should be an 8.33 kHz spacing frequency.
 * @returns {number} The next frequency.
 */
function nextFrequency(frequency, supports833) {
    if (supports833 === false) return frequency + 25;
    const trail = Math.round(frequency % 100);
    if (trail === 15 || trail === 40 || trail === 65 || trail === 90) return frequency + 10;
    return frequency + 5;
}


/**
 * @param {number} frequency The frequency to find the previous 8.33 kHz frequency for (in kHz).
 * @param {boolean} supports833 Whether the frequency should be an 8.33 kHz spacing frequency.
 * @returns {number} The previous 8.33 kHz frequency.
 */
function previousFrequency(frequency, supports833) {
    if (supports833 === false) return frequency - 25;
    const trail = Math.round(frequency % 100);
    if (trail === 0 || trail === 25 || trail === 50 || trail === 75) return frequency - 10;
    return frequency - 5;
}


/**
 * @param {number} frequency The frequency to format in kHz.
 * @returns {string} The frequency formated as 123.456 MHz.
 */
function formatFrequency(frequency) {
    return (frequency / 1000).toFixed(3).padEnd(7, '0');
}


export class RadioManagementPanel {
    constructor() {
        this.innerKnob = new AcceleratedKnob();
        this.outerKnob = new AcceleratedKnob();
        this.innerKnob.updateValue = (s) => this.updateDecimalValue(s);
        this.outerKnob.updateValue = (s) => this.updateIntegerValue(s);
        this.radioModeSelector = new RadioModeSelector(this);
    }

    get data() {
        return {
            active: formatFrequency(this.radioMode.active.value),
            standby: formatFrequency(this.radioMode.standby.value),
        };
    }

    dispatchDataUpdated() {
        if (this.onDataUpdated) this.onDataUpdated(this.data);
    }

    setRadioMode(radioMode) {
        this.radioMode = radioMode;
        this.dispatchDataUpdated();
    }

    transfer() {
        const temporary = this.radioMode.standby.value;
        this.radioMode.standby.value = this.radioMode.active.value;
        this.radioMode.active.value = temporary;
        this.dispatchDataUpdated();
    }

    registerCallbacks(onDataUpdated) {
        this.onDataUpdated = onDataUpdated;
        this.radioModeSelector.registerCallbacks();
        useInteractionEvent('A32NX_RMP_L_TRANSFER_BUTTON_PRESSED', () => this.transfer());
        useInteractionEvent('A32NX_RMP_L_INNER_KNOB_TURNED_CLOCKWISE', () => this.innerKnob.increase());
        useInteractionEvent('A32NX_RMP_L_INNER_KNOB_TURNED_ANTICLOCKWISE', () => this.innerKnob.decrease());
        useInteractionEvent('A32NX_RMP_L_OUTER_KNOB_TURNED_CLOCKWISE', () => this.outerKnob.increase());
        useInteractionEvent('A32NX_RMP_L_OUTER_KNOB_TURNED_ANTICLOCKWISE', () => this.outerKnob.decrease());
    }

    updateIntegerValue(speed) {
        const frequency = this.radioMode.standby.value + (1000 * speed);
        this.radioMode.standby.value = Utils.Clamp(frequency, this.radioMode.minimum, this.radioMode.maximum);
        this.dispatchDataUpdated();
    }

    updateDecimalValue(speed) {
        let frequency = this.radioMode.standby.value;
        const getNewFrequency = speed > 0 ? nextFrequency : previousFrequency;

        for (let i = 0; i < Math.abs(speed); i++) {
            frequency = getNewFrequency(frequency, this.radioMode.supports833);
        }

        this.radioMode.standby.value = Utils.Clamp(frequency, this.radioMode.minimum, this.radioMode.maximum);
        this.dispatchDataUpdated();
    }
}
