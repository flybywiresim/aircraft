import React, { useState } from 'react';
import { ActiveFrequency } from '../Components/ActiveFrequency';
import { StandbyFrequency } from '../Components/StandbyFrequency';
import { useSimVar, useSplitSimVar } from '../../Common/simVars';
import { useInteractionEvent } from '../../Common/hooks';

const setCharAt = (str: string, index: number, chr: string): string => {
    if (index > str.length - 1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1);
};

const formatFrequency = (frequency: number): string => Math.max(118, frequency / 1000000).toFixed(3).padEnd(7, '0');

const formatTempFrequency = (frequency: number[]): string => {
    let value = '---.---';
    for (let i = 0; i < frequency.length; i++) {
        value = setCharAt(value, i + (i > 2 ? 1 : 0), frequency[i].toString());
    }
    return value;
};

const validateVhfFrequency = (frequency: number[]) => {
    let value = 0;
    for (let i = 0; i < frequency.length; i++) {
        value += frequency[i] * (10 ** (5 - i));
    }
    if (value < 118000 || value >= 137000 || value % 5 !== 0) {
        return null;
    }
    return value;
};

/**
 * React hook for the active VHF frequency SimVar, set via a K SimVar.
 * @param transceiver The VHF transceiver to use (VHF 1, 2, or 3).
 */
const useActiveVhfFrequency = (transceiver: number) => {
    const variableReadName = `COM ACTIVE FREQUENCY:${transceiver}`;
    const variableWriteName = `K:COM${transceiver === 1 ? '' : transceiver}_RADIO_SET_HZ`;
    return useSplitSimVar(variableReadName, 'Hz', variableWriteName, 'Hz', 100);
};

/**
 * React hook for the standby VHF frequency SimVar, set via a K SimVar.
 * A custom SimVar is used for abnormal side/transceiver pairs (e.g. VHF 2 for left RMP).
 * @param side The RMP side (e.g. 'L' or 'R').
 * @param transceiver The VHF transceiver to use (VHF 1, 2, or 3).
 */
const useStandbyVhfFrequency = (side: string, transceiver: number) => {
    let variableReadName = `COM STANDBY FREQUENCY:${transceiver}`;
    let variableWriteName = `K:COM${transceiver === 1 ? '' : transceiver}_STBY_RADIO_SET_HZ`;

    // Use custom SimVars for abnormal standby frequency.
    // Allows true-to-life independent standby frequencies per RMP.
    // Be sure to update this if if we ever add a third "C"-side RMP.
    if (
        (side === 'L' && transceiver !== 1)
        || (side === 'R' && transceiver !== 2)
    ) {
        variableReadName = `L:A32NX_RMP_${side}_VHF${transceiver}_STANDBY_FREQUENCY`;
        variableWriteName = variableReadName;
    }

    return useSplitSimVar(variableReadName, 'Hz', variableWriteName, 'Hz', 100);
};

const VhfTransceiverLabel = (props) => (
    <div className="vhf-transceiver-label">
        {props.text}
    </div>
);

const VhfCell = (props) => {
    const [standbyFrequency, setStandbyFrequency] = useStandbyVhfFrequency(props.side, props.transceiver);
    const [activeFrequency, setActiveFrequency] = useActiveVhfFrequency(props.transceiver);
    if (props.transceiver !== 3) {
        useInteractionEvent(`A380_RMP${props.side}_LSK${props.transceiver}_PRESSED`, () => {
            if (props.selected) {
                const validatedFrequency = validateVhfFrequency(props.tempFrequency);
                if (validatedFrequency != null) {
                    setStandbyFrequency(validatedFrequency * 1000);
                }
            }
        });
        useInteractionEvent(`A380_RMP${props.side}_ADK${props.transceiver}_PRESSED`, () => {
            setActiveFrequency(standbyFrequency);
            setStandbyFrequency(activeFrequency);
        });
    }
    return (
        <div className={props.separator ? 'cell separator' : 'cell'}>
            <ActiveFrequency value={props.transceiver === 3 ? 'DATA' : formatFrequency(activeFrequency)} />
            <VhfTransceiverLabel text={`VHF${props.transceiver}`} />
            <StandbyFrequency
                value={props.selected && props.tempFrequency.length ? formatTempFrequency(props.tempFrequency) : formatFrequency(standbyFrequency)}
                valid={validateVhfFrequency(props.tempFrequency) != null || props.tempFrequency.length === 0}
                selected={props.selected}
                label="STBY"
            />
        </div>
    );
};

export const VhfPage = (props) => {
    const [selected, setSelected] = useSimVar(`L:A380X_RMP${props.side}_SELECTED_VHF`, 'enum');
    const trySetSelected = (newValue: number) => {
        if (newValue === selected) {
            setSelected(0);
            setTempFrequency([]);
        } else {
            setSelected(newValue);
        }
    };
    useInteractionEvent(`A380_RMP${props.side}_LSK1_PRESSED`, () => {
        trySetSelected(1);
    });
    useInteractionEvent(`A380_RMP${props.side}_LSK2_PRESSED`, () => {
        trySetSelected(2);
    });
    /* useInteractionEvent(`A380_RMP${props.side}_LSK3_PRESSED`, () => {
        trySetSelected(3);
    }); */
    const [tempFrequency, setTempFrequency] = useState([]);
    const tryEnterDigit = (digit: number) => {
        if (selected) {
            if (tempFrequency.length >= 6 || tempFrequency.length === 0) {
                if (digit > 1) {
                    setTempFrequency([1, digit]);
                } else {
                    setTempFrequency([digit]);
                }
            } else {
                tempFrequency.push(digit);
            }
        }
    };
    useInteractionEvent(`A380_RMP${props.side}_0_PRESSED`, () => {
        tryEnterDigit(0);
    });
    useInteractionEvent(`A380_RMP${props.side}_1_PRESSED`, () => {
        tryEnterDigit(1);
    });
    useInteractionEvent(`A380_RMP${props.side}_2_PRESSED`, () => {
        tryEnterDigit(2);
    });
    useInteractionEvent(`A380_RMP${props.side}_3_PRESSED`, () => {
        tryEnterDigit(3);
    });
    useInteractionEvent(`A380_RMP${props.side}_4_PRESSED`, () => {
        tryEnterDigit(4);
    });
    useInteractionEvent(`A380_RMP${props.side}_5_PRESSED`, () => {
        tryEnterDigit(5);
    });
    useInteractionEvent(`A380_RMP${props.side}_6_PRESSED`, () => {
        tryEnterDigit(6);
    });
    useInteractionEvent(`A380_RMP${props.side}_7_PRESSED`, () => {
        tryEnterDigit(7);
    });
    useInteractionEvent(`A380_RMP${props.side}_8_PRESSED`, () => {
        tryEnterDigit(8);
    });
    useInteractionEvent(`A380_RMP${props.side}_9_PRESSED`, () => {
        tryEnterDigit(9);
    });
    useInteractionEvent(`A380_RMP${props.side}_CLR_PRESSED`, () => {
        if (tempFrequency.length > 0) {
            tempFrequency.pop();
        }
    });
    return (
        <g>
            <text x={823} y={512} fontSize={80} textAnchor="middle" fontFamily="RMP-11" fill="white">INOP</text>
        </g>
    );
};
