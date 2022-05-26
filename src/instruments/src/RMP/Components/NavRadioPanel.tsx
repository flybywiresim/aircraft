import React, { useState } from 'react';

import { StandbyFrequency, TransceiverType } from './StandbyFrequency';
import { StandbyCourse } from './StandbyCourse';
import { useSplitSimVar, useSimVar } from '../../Common/simVars';
import { RadioPanelDisplay } from './RadioPanelDisplay';
import { useInteractionEvent } from '../../Common/hooks';

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

/**
 * React hook for the active VHF frequency SimVar, set via a K SimVar.
 * @param transceiver The VHF transceiver to use (VHF 1, 2, or 3).
 */
// const useActiveNavFrequency = (transceiver: number, index: number) => {
//     let variableReadName = '';
//     let variableWriteName = '';

//     if (transceiver === TransceiverType.ADF) {
//         variableReadName = `ADF ACTIVE FREQUENCY:${index}`;
//         variableWriteName = 'K:ADF_ACTIVE_SET';
//         return useSplitSimVar(variableReadName, 'Hz', variableWriteName, 'Frequency ADF BCD32', 1);
//     }

//     variableReadName = `NAV ACTIVE FREQUENCY:${index}`;
//     variableWriteName = `K:NAV${index}_RADIO_SET_HZ`;
//     return useSplitSimVar(variableReadName, 'Hz', variableWriteName, 'Hz', 1);
// };

// /**
//  * React hook for the standby VHF frequency SimVar, set via a K SimVar.
//  * A custom SimVar is used for abnormal side/transceiver pairs (e.g. VHF 2 for left RMP).
//  * @param side The RMP side (e.g. 'L' or 'R').
//  * @param transceiver The VHF transceiver to use (VHF 1, 2, or 3).
//  */
// const useStandbyFrequency = (transceiver: number, index: number) => {
//     let variableReadName = '';
//     let variableWriteName = '';

//     if (transceiver === TransceiverType.ADF) {
//         variableReadName = `ADF STANDBY FREQUENCY:${index}`;
//         variableWriteName = 'K:ADF_STBY_SET';
//         return useSplitSimVar(variableReadName, 'Hz', variableWriteName, 'Frequency ADF BCD32', 1);
//     }

//     variableReadName = `NAV STANDBY FREQUENCY:${index}`;
//     variableWriteName = `K:NAV${index}_STBY_SET_HZ`;
//     return useSplitSimVar(variableReadName, 'Hz', variableWriteName, 'Hz', 1);
// };

const useSetActiveFrequency = (transceiver: number, index: number) => {
    if (transceiver === TransceiverType.ADF) {
        return useSimVar(`K:ADF${index === 1 ? '' : index}_ACTIVE_SET`, 'Frequency ADF BCD32', 100);
    }

    return useSimVar(`K:NAV${index}_RADIO_SET_HZ`, 'Frequency ADF BCD32', 100);
};

const useSetStandbyFrequency = (transceiver: number, index: number) => {
    if (transceiver === TransceiverType.ADF) {
        return useSimVar(`K:ADF${index === 1 ? '' : index}_STBY_SET`, 'Frequency ADF BCD32', 100);
    }

    return useSimVar(`K:NAV${index}_STBY_SET_HZ`, 'Frequency ADF BCD32', 100);
};

const useGetActiveFrequency = (transceiver: number, index: number) => {
    if (transceiver === TransceiverType.ADF) {
        return useSimVar(`ADF ACTIVE FREQUENCY:${index}`, 'Hz', 100);
    }

    return useSimVar(`NAV ACTIVE FREQUENCY:${index}`, 'Hz', 100);
};

const useGetStandbyFrequency = (transceiver: number, index: number) => {
    if (transceiver === TransceiverType.ADF) {
        return useSimVar(`ADF STANDBY FREQUENCY:${index}`, 'Hz', 100);
    }

    return useSimVar(`NAV STANDBY FREQUENCY:${index}`, 'Hz', 100);
};

const useCourse = (indexInstrument: number, indexSide: number) => {
    const variableReadName = `NAV OBS:${indexSide}`;
    let variableWriteName = '';

    if (indexInstrument !== TransceiverType.VOR) {
        variableWriteName = `K:NAV${indexSide}_SET`;
    } else {
        variableWriteName = `K:VOR${indexSide}_SET`;
    }

    return useSplitSimVar(variableReadName, 'degrees', variableWriteName, 'degrees', 100);
};

/**
 * VHF radio management panel React component.
 * Hooks into the mode active and standby frequency SimVars and wires transfer button.
 * Renders active frequency RadioPanelDisplay and appropriate StandbyFrequency sub-components.
 */
export const NavRadioPanel = (props: Props) => {
    const index = props.side === 'L' ? 1 : 2;

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
    const [activeHz] = useGetActiveFrequency(props.transceiver, index);
    const [standbyHz] = useGetStandbyFrequency(props.transceiver, index);

    let standbyWindow: JSX.Element;

    useInteractionEvent(`A32NX_RMP_${props.side}_TRANSFER_BUTTON_PRESSED`, () => {
        if (mode === Mode.FREQUENCY) {
            if (props.transceiver !== TransceiverType.ADF) {
                setMode(Mode.COURSE);
            }
            setActive(Avionics.Utils.make_adf_bcd32(standbyHz));
        } else {
            setCourse(course);
            setMode(Mode.FREQUENCY);
        }

        setStandbyFrequency(Avionics.Utils.make_adf_bcd32(activeHz));
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
