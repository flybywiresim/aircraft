/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import { StandbyFrequency } from './StandbyFrequency';
import { useSplitSimVar } from '../../Common/simVars';
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

/**
 * VHF radio management panel React component.
 * Hooks into the mode active and standby frequency SimVars and wires transfer button.
 * Renders active frequency RadioPanelDisplay and appropriate StandbyFrequency sub-components.
 */
export const VhfRadioPanel = (props: Props) => {
    const [active, setActive] = useActiveVhfFrequency(props.transceiver);
    const [standby, setStandby] = useStandbyVhfFrequency(props.side, props.transceiver);

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
};
