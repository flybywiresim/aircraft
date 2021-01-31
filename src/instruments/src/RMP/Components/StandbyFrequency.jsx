import { useState } from 'react';
import { useInteractionEvent } from '../../util.mjs';
import { AcceleratedKnob } from '../Framework/AcceleratedKnob.mjs';
import { SevenSegmentDisplay } from './SevenSegmentDisplay.jsx';

/**
 *
 * @param {*} value
 * @param {*} array
 */
function findNearestInArray(value, array) {
    return array.reduce((previous, current) => (Math.abs(current - value) < Math.abs(previous - value) ? current : previous));
}

/**
 *
 * @param {*} spacing
 * @param {*} channel
 * @param {*} offset
 */
function offsetFrequencyChannel(spacing, channel, offset) {
    // Determine endings from channel spacing.
    let endings = undefined;

    // 8.33 kHz Frequency Endings.
    if (spacing === 8.33) endings = [0, 5, 10, 15, 25, 30, 35, 40, 50, 55, 60, 65, 75, 80, 85, 90];
    // 25 kHz Frequency Endings.
    if (spacing === 25) endings = [0, 25, 50, 75];
    // High Frequency (HF) Endings.
    if (spacing === 10) endings = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
    // VOR/ILS Frequency Endings.
    if (spacing === 50) endings = [0, 50];

    // Special cases, such as ADF, do not use the ending algorithm to find frequencies.
    if (endings === undefined) {
        return (Math.floor(channel / 100) + spacing * offset) * 100;
    }

    // Reverse the channel order if we're going backwards.
    if (offset < 0) {
        endings.reverse();
    }

    // For channel 456, front is 4.
    const front = Math.floor(channel / 100);

    // For channel 456, back is 56. Find the nearest valid channel.
    const back = findNearestInArray(Math.round(channel % 100), endings);

    // Find the index of the channel;
    const index = endings.indexOf(back);

    // Find the offset channel's index.
    const newIndex = index + Math.abs(offset);

    // Figure out how the front needs to change.
    // I.e. how many times did we go off the end of the endings array.
    const newFront = front + Math.floor(newIndex / endings.length) * Math.sign(offset);

    // Combine the calculated front and back to form the new channel.
    const newChannel = (newFront * 100) + endings[newIndex % endings.length];

    // Modulo 1000 (i.e. -10 will become 990 for 8.33 spacing).
    return ((newChannel % 1000) + 1000) % 1000;
}

export function StandbyFrequency(props) {
    // Used to change integer value of freq.
    const [outerKnob] = useState(new AcceleratedKnob());
    // Used to change decimal value of freq.
    const [innerKnob] = useState(new AcceleratedKnob());

    useInteractionEvent(`A32NX_RMP_${props.side}_OUTER_KNOB_TURNED_CLOCKWISE`, () => outerKnob.increase());
    useInteractionEvent(`A32NX_RMP_${props.side}_OUTER_KNOB_TURNED_ANTICLOCKWISE`, () => outerKnob.decrease());
    useInteractionEvent(`A32NX_RMP_${props.side}_INNER_KNOB_TURNED_CLOCKWISE`, () => innerKnob.increase());
    useInteractionEvent(`A32NX_RMP_${props.side}_INNER_KNOB_TURNED_ANTICLOCKWISE`, () => innerKnob.decrease());

    // Handle outer knob turned.
    outerKnob.updateValue = (offset) => {
        const frequency = Math.round(props.variable.value / 1000);
        const integer = Math.floor(frequency / 1000);
        const decimal = frequency % 1000;
        // @todo determine min/max depending on mode.
        const maxInteger = decimal > 975 ? 135 : 136;
        const newInteger = Utils.Clamp(integer + offset, 118, maxInteger);
        props.variable.value = (newInteger * 1000 + decimal) * 1000;
    };

    // Handle inner knob turned.
    innerKnob.updateValue = (offset) => {
        const frequency = Math.round(props.variable.value / 1000);
        if (Math.sign(offset) === 1 && frequency === 136975) {
            return;
        }

        const integer = Math.floor(frequency / 1000);
        // @todo determine correct frequency spacing depending on mode.
        const decimal = offsetFrequencyChannel(8.33, frequency % 1000, offset);
        // @todo determine min/max depending on mode.
        const maxDecimal = integer === 136 ? 975 : 1000;
        const newDecimal = Utils.Clamp(decimal, 0, maxDecimal);
        props.variable.value = (integer * 1000 + newDecimal) * 1000;
    };

    return (<SevenSegmentDisplay value={props.variable.value} lightsTest={props.lightsTest} />);
}
