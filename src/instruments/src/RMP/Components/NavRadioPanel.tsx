import React, { useState } from 'react';

import { StandbyFrequency, TransceiverType } from './StandbyFrequency';
import { StandbyCourse } from './StandbyCourse';
import { useSplitSimVar, useSimVar } from '../../Common/simVars';
import { RadioPanelDisplay } from './RadioPanelDisplay';
import { useInteractionEvent } from '../../Common/hooks';

const DEFAULT_FREQUENCY_VOR = 113000000;
const DEFAULT_FREQUENCY_ILS = 108900000;
const DEFAULT_CHANNEL_MLS = 150;
const DEFAULT_FREQUENCY_ADF = 433000;

interface Props {
    /**
     * The RMP side (e.g. 'L' or 'R').
     */
    side: string,

    /**
     * The VHF transceiver mode (VHF 1, 2, or 3).
     */
    transceiver: number,

}

enum Mode {
    FREQUENCY = 0,
    COURSE = 1
}

const useSetActiveFrequency = (transceiver: number, index: number) => {
    if (transceiver === TransceiverType.ADF) {
        return useSimVar(`K:ADF${index === 1 ? '' : index}_ACTIVE_SET`, 'Frequency ADF BCD32', 100);
    }

    return useSimVar(`K:NAV${index}_RADIO_SET_HZ`, 'Hz', 100);
};

const useSetStandbyFrequency = (transceiver: number, index: number) => {
    if (transceiver === TransceiverType.ADF) {
        return useSimVar(`K:ADF${index === 1 ? '' : index}_STBY_SET`, 'Frequency ADF BCD32', 100);
    }

    return useSimVar(`K:NAV${index}_STBY_SET_HZ`, 'Hz', 100);
};

const useGetActiveFrequency = (transceiver: number, index: number) => {
    const [frequency] = useSimVar(`${transceiver === TransceiverType.ADF ? 'ADF' : 'NAV'} ACTIVE FREQUENCY:${index}`, 'Hz', 100);

    if (frequency !== 0) {
        return frequency;
    }

    // If frequency === 0 at startup
    // Which is the case if the NAV pb is pushed without initializing the RADNAV page
    switch (transceiver) {
    case TransceiverType.VOR:
        return DEFAULT_FREQUENCY_VOR;
    case TransceiverType.ADF:
        return DEFAULT_FREQUENCY_ADF;
    case TransceiverType.MLS:
        return DEFAULT_CHANNEL_MLS;
    default:
        return DEFAULT_FREQUENCY_ILS;
    }
};

const useGetStandbyFrequency = (transceiver: number, index: number) => {
    const [frequency] = useSimVar(`${transceiver === TransceiverType.ADF ? 'ADF' : 'NAV'} STANDBY FREQUENCY:${index}`, 'Hz', 100);

    if (frequency !== 0) {
        return frequency;
    }

    // If frequency === 0 at startup
    // Which is the case if the NAV pb is pushed without initializing the RADNAV page
    switch (transceiver) {
    case TransceiverType.VOR:
        return DEFAULT_FREQUENCY_VOR;
    case TransceiverType.ADF:
        return DEFAULT_FREQUENCY_ADF;
    case TransceiverType.MLS:
        return DEFAULT_CHANNEL_MLS;
    default:
        return DEFAULT_FREQUENCY_ILS;
    }
};

const useCourse = (indexInstrument: number, indexSide: number) => {
    const variableReadName = `NAV OBS:${indexSide}`;
    return useSplitSimVar(variableReadName, 'degrees', indexInstrument === TransceiverType.VOR ? `K:VOR${indexSide}_SET`
        : 'L:A32NX_FM_LS_COURSE', 'number', 100);
};

/**
 * NAV radio management panel React component.
 * Hooks into the mode active and standby frequency SimVars and wires transfer button.
 * Renders active frequency RadioPanelDisplay and appropriate StandbyFrequency sub-components.
 */
export const NavRadioPanel = (props: Props) => {
    let index = props.side === 'L' ? 1 : 2;
    if (props.transceiver === TransceiverType.ILS) {
        index = 3; // Both RMPs manage the same ILS
    }

    const [mode, setMode] = useState<Mode>(Mode.FREQUENCY);

    const [course, setStandbyCourse] = useState<number>(45);
    const [, setCourse] = useCourse(props.transceiver, index);

    /*
    * Couldn't use useSplitVar because there was a sync problem with ADF: BCD32 format could be seen before number value on the dial
    * Fact: You can only write ADF frequency in ADF BCD32 and we want to get the frequency in Hz
    * When using the setter (therefore BCD32), useSplitSimVar overrides the read value (which we want in Hz) too which leads to temporary wrong value
    * The solution I found is splitting them for real so there's so override
    */
    const [, setActive] = useSetActiveFrequency(props.transceiver, index);
    const [, setStandbyFrequency] = useSetStandbyFrequency(props.transceiver, index);
    const activeHz = useGetActiveFrequency(props.transceiver, index);
    const standbyHz = useGetStandbyFrequency(props.transceiver, index);

    let standbyWindow: JSX.Element;

    useInteractionEvent(`A32NX_RMP_${props.side}_TRANSFER_BUTTON_PRESSED`, () => {
        if (mode === Mode.FREQUENCY) {
            if (props.transceiver !== TransceiverType.ADF) {
                setMode(Mode.COURSE);
                setActive(standbyHz);
            } else {
                setActive(Avionics.Utils.make_adf_bcd32(standbyHz));
            }
        } else {
            setCourse(course);
            setMode(Mode.FREQUENCY);
        }
        if (props.transceiver !== TransceiverType.ADF) {
            setStandbyFrequency(activeHz);
        } else {
            setStandbyFrequency(Avionics.Utils.make_adf_bcd32(activeHz));
        }
    });

    if (mode === Mode.FREQUENCY) {
        standbyWindow = <StandbyFrequency side={props.side} value={standbyHz} setValue={setStandbyFrequency} transceiver={props.transceiver} />;
    } else {
        standbyWindow = <StandbyCourse side={props.side} value={course} setValue={setStandbyCourse} />;
    }

    return (
        <span>
            <RadioPanelDisplay value={activeHz} transceiver={props.transceiver} />
            {standbyWindow}
        </span>
    );
};
