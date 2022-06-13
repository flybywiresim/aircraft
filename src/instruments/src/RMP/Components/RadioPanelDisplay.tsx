import React from 'react';
import { TransceiverType } from './StandbyFrequency';
import { useSimVar } from '../../Common/simVars';

interface Props {
    /**
     * The value to display.
     */
    value: number | string,

    /**
     * Transceiver type (e.g VHF, HF, VOR, ILS, ADF)
     */
    transceiver?: number
}

const TEXT_DATA_MODE_VHF3 = 'DATA';

/**
 * Format the given frequency to be displayed.
 * @param frequency The given frequency number in Hz.
 * @returns The formated frequency string in 123.456
 */
const formatFrequency = (frequency: number, transceiver: number): string => {
    if (transceiver === TransceiverType.RADIO_VHF
        || transceiver === TransceiverType.ILS
        || transceiver === TransceiverType.VOR) {
        return (frequency / 1000000).toFixed(3).padEnd(7, '0');
    }

    if (transceiver === TransceiverType.ADF) {
        return (frequency / 1000).toFixed(1);
    }

    return (frequency / 1000).toFixed(1);
};

/**
 * Radio management panel seven-segment frequency/course display.
 * Hooks into lightsTest SimVar to show 888.888 when test is ON.
 * Renders the seven-segment display with the appropriate value.
 */
export function RadioPanelDisplay(props: Props) {
    const [lightsTest] = useSimVar('L:A32NX_OVHD_INTLT_ANN', 'Boolean', 1000);

    let content: JSX.Element;

    if (lightsTest === 0) {
        content = (
            <text x="100%" y="52%">
                8.8.8.8.8.8
            </text>
        );
    } else if ((typeof props.value === 'string')) {
        content = (
            <text x="100%" y="52%">
                {props.value}
            </text>
        );
    } else if (props.value > 0) {
        content = (
            <text x="100%" y="52%">
                {formatFrequency(props.value, props.transceiver)}
            </text>
        );
    } else {
        content = (
            <text x="85%" y="52%">
                {TEXT_DATA_MODE_VHF3}
            </text>
        );
    }

    return (
        <svg className="rmp-svg">
            {content}
        </svg>
    );
}
