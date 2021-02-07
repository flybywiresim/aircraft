import React from 'react';
import { StandbyFrequency } from './StandbyFrequency';
import { RadioPanelDisplay } from './RadioPanelDisplay';
import { useInteractionEvent } from '../../Common/ReactInstrument';
import { useSimVar, useSplitSimVar } from '../../Common/SimVarProvider';

/**
 *
 */
interface Props {
    side: string,
    transciever: number,
}

/**
 *
 */
const useActiveVhfFrequency = (transciever: number) => {
    const variableReadName = `COM ACTIVE FREQUENCY:${transciever}`;
    const variableWriteName = `K:COM${transciever === 1 ? '' : transciever}_RADIO_SET_HZ`;
    return useSplitSimVar(variableReadName, 'Hz', variableWriteName, 'Hz', 100);
}

/**
 *
 */
const useStandbyVhfFrequency = (side: string, transciever: number) => {
    // Use custom SimVars for abnormal standby frequency.
    // Allows true-to-life independent standby frequencies per RMP.
    // @todo, if we ever add a third RMP (e.g. C), update this.
    if (
        (side === 'L' && transciever !== 1) ||
        (side === 'R' && transciever !== 2)
    ) {
        return useSimVar(`L:A32NX_RMP_${side}_VHF${transciever}_STANDBY_FREQUENCY`, 'Hz', 100);
    }

    const variableReadName = `COM STANDBY FREQUENCY:${transciever}`;
    const variableWriteName = `K:COM${transciever === 1 ? '' : transciever}_STBY_RADIO_SET_HZ`;
    return useSplitSimVar(variableReadName, 'Hz', variableWriteName,  'Hz', 100);
}

/**
 *
 */
export const VhfRadioPanel = (props: Props) => {
    const [active, setActive] = useActiveVhfFrequency(props.transciever);
    const [standby, setStandby] = useStandbyVhfFrequency(props.side, props.transciever);

    // Handle Transfer Button Pressed.
    useInteractionEvent(`A32NX_RMP_${props.side}_TRANSFER_BUTTON_PRESSED`, () => {
        setActive(standby);
        setStandby(active);
    });

    return (
        <span>
            <RadioPanelDisplay value={active} />
            <StandbyFrequency side={props.side} value={standby} setValue={setStandby} />
        </span>
    );
}
