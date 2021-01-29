import { useState } from 'react';
import { useInteractionEvent } from '../../util.mjs';
import { StatefulSimVar } from '../Framework/StatefulSimVar.mjs';
import { AcceleratedKnob } from '../Framework/AcceleratedKnob.mjs';
import { SevenSegmentDisplay } from './SevenSegmentDisplay.jsx';

/**
 *
 * @param {*} value
 * @param {*} array
 */
function findNearestInArray(value, array) {
    return array.reduce(function(previous, current) {
        return (Math.abs(current - value) < Math.abs(previous - value) ? current : previous);
    });
}

/**
 *
 * @param {*} spacing
 * @param {*} channel
 * @param {*} offset
 */
function offsetFrequencyChannel(spacing, channel, offset) {
    // Determine endings from channel spacing.
    const endings =
        // 8.33 kHz Frequency Endings.
        (spacing === 8.33) ? [0,5,10,15,25,30,35,40,50,55,60,65,75,80,85,90] :
        // 25 kHz Frequency Endings.
        (spacing === 25) ? [0,25,50,75] :
        // High Frequency (HF) Endings.
        (spacing === 10) ? [0,10,20,30,40,50,60,70,80,90] :
        // VOR/ILS Frequency Endings.
        (spacing = 50) ? [0, 50] :
        // ADF is a special case where endings are not used.
        undefined;

    // Special cases, such as ADF, do not use the ending algorithm to find frequencies.
    if (endings === undefined) {
        const _channel = Math.floor(channel / 100);
        return (_channel + spacing * offset) * 100;
    }

    // Reverse the channel order if we're going backwards.
    if (offset < 0) endings.reverse();

    // For channel 456, front is 4.
    const _front = Math.floor(channel / 100);
    // For channel 456, back is 56.
    const _back = Math.round(channel % 100);

    // Find the nearest valid channel.
    const back = findNearestInArray(_back, endings);

    // Find the index of the channel;
    const index = endings.indexOf(back);

    // Find the offset channel's index.
    const newIndex = index + Math.abs(offset);

    // Figure out how the front needs to change.
    // I.e. how many times did we go off the end of the endings array.
    const front = _front + Math.floor(newIndex / endings.length) * Math.sign(offset);

    // Combine the calculated front and back to form the new channel.
    const newChannel = (front * 100) + endings[newIndex % endings.length];

    // Modulo 1000 (i.e. -10 will become 990 for 8.33 spacing).
    return ((newChannel % 1000) + 1000 ) % 1000;
}

/**
 * Format the given frequency to be displayed.
 * @param {number} frequency The frequency in Hertz.
 * @return {string} The formatted frequency.
 */
function formatFrequency(frequency) {
    return (frequency / 1000000).toFixed(3).padEnd(7, '0');
}

/**
 * Instantiates all the RMP frequency-related stateful SimVars.
 * Should only be called from a React component!
 */
function createFrequencyModeVariables() {
    return {
        vhf1: {
            active: new StatefulSimVar({
                simVarGetter: `COM ACTIVE FREQUENCY:1`,
                simVarSetter: `K:COM_RADIO_SET_HZ`,
                simVarUnit: "Hz",
            }),
            standby: new StatefulSimVar({
                simVarGetter: `COM STANDBY FREQUENCY:1`,
                simVarSetter: `K:COM_STBY_RADIO_SET_HZ`,
                simVarUnit: "Hz",
            }),
        },

        vhf2: {
            active: new StatefulSimVar({
                simVarGetter: `COM ACTIVE FREQUENCY:2`,
                simVarSetter: `K:COM2_RADIO_SET_HZ`,
                simVarUnit: "Hz",
            }),
            standby: new StatefulSimVar({
                simVarGetter: `COM STANDBY FREQUENCY:2`,
                simVarSetter: `K:COM2_STBY_RADIO_SET_HZ`,
                simVarUnit: "Hz",
            }),
        },
    }
}

/**
 * Instantiates and hooks up the two frequency knobs.
 * Should only be called from a React component!
 * @param {*} side
 * @param {*} currentModeVariables
 */
function createRadioManagementPanelControls(side, currentModeVariables) {
    // Used to change integer value of freq.
    const [outerKnob] = useState(new AcceleratedKnob());
    // Used to change decimal value of freq.
    const [innerKnob] = useState(new AcceleratedKnob());

    const active = currentModeVariables.active;
    // @todo temporarily disable standby refreshRate when using knobs.
    const standby = currentModeVariables.standby;

    useInteractionEvent(`A32NX_RMP_${side}_OUTER_KNOB_TURNED_CLOCKWISE`, () => outerKnob.increase());
    useInteractionEvent(`A32NX_RMP_${side}_OUTER_KNOB_TURNED_ANTICLOCKWISE`, () => outerKnob.decrease());
    useInteractionEvent(`A32NX_RMP_${side}_INNER_KNOB_TURNED_CLOCKWISE`, () => innerKnob.increase());
    useInteractionEvent(`A32NX_RMP_${side}_INNER_KNOB_TURNED_ANTICLOCKWISE`, () => innerKnob.decrease());

    // Handle outer knob turned.
    outerKnob.updateValue = (offset) => {
        const frequency = Math.round(standby.value / 1000);
        let integer = Math.floor(frequency / 1000);
        const decimal = frequency % 1000;
        // @todo determine correct min/max depending on mode.
        const newFrequency = ((integer + offset) * 1000 + decimal) * 1000;
        standby.value = newFrequency;
    }

    // Hangled inner knob turned.
    innerKnob.updateValue = (offset) => {
        const frequency = Math.round(standby.value / 1000);
        const integer = Math.floor(frequency / 1000);
        // @todo determine correct frequency spacing depending on mode.
        const newFrequency = integer * 1000 + offsetFrequencyChannel(8.33, frequency % 1000, offset);
        standby.value = newFrequency * 1000;
    };

    // Handle Transfer Button Pressed.
    useInteractionEvent(`A32NX_RMP_${side}_TRANSFER_BUTTON_PRESSED`, () => {
        // @todo will become more complex with Nav mode (due to course "submode").
        const previousStandbyValue = standby.value;
        standby.value = active.value;
        active.value = previousStandbyValue;
    });
}

export function RadioManagementPanel(props) {
    const panelPoweredVariable = new StatefulSimVar({
        simVarGetter: `L:XMLVAR_RMP_${props.side}_On`,
        simVarUnit: "Bool",
        refreshRate: 1500,
    });

    // Currently fixed vhf1 for left and vhf2 for right.
    const mode = (props.side === "R") ? "vhf2" : "vhf1";

    const frequencyVariables = createFrequencyModeVariables();
    const currentModeVariables = frequencyVariables[mode];
    createRadioManagementPanelControls(props.side, currentModeVariables);

    currentModeVariables.active.setRefreshRate(500);
    currentModeVariables.standby.setRefreshRate(500);

    // @todo This will be a bit different for Nav mode (due to course "submode").
    const leftDisplay = formatFrequency(currentModeVariables.active.value);
    const rightDisplay = formatFrequency(currentModeVariables.standby.value);

    return (<span className={panelPoweredVariable.value ? "" : "rmp-unpowered"}>
        <SevenSegmentDisplay value={leftDisplay} lightsTest={props.lightsTest} />
        <SevenSegmentDisplay value={rightDisplay} lightsTest={props.lightsTest} />
    </span>);
}
