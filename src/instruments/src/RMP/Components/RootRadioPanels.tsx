import React, { useEffect } from 'react';
import { RootRadioPanel } from './BaseRadioPanels';
import { useSimVar } from '../../Common/simVars';

declare const SimVar; // this can also be replaced once /typings are available

function initFrequencies() {
    SimVar.SetSimVarValue('K:COM_RADIO_SET_HZ', 'Hz', 122800000); // Unicom
    SimVar.SetSimVarValue('K:COM2_RADIO_SET_HZ', 'Hz', 121500000); // Guard
    SimVar.SetSimVarValue('K:COM3_RADIO_SET_HZ', 'Hz', 131500000);
    SimVar.SetSimVarValue('K:COM_STBY_RADIO_SET_HZ', 'Hz', 121950000);
    SimVar.SetSimVarValue('K:COM2_STBY_RADIO_SET_HZ', 'Hz', 136975000);
    SimVar.SetSimVarValue('K:COM3_STBY_RADIO_SET_HZ', 'Hz', 135475000);
    SimVar.SetSimVarValue('A32NX_RMP_L_VHF2_STANDBY_FREQUENCY', 'Hz', 124275000);
    SimVar.SetSimVarValue('A32NX_RMP_L_VHF3_STANDBY_FREQUENCY', 'Hz', 135475000);
    SimVar.SetSimVarValue('A32NX_RMP_R_VHF1_STANDBY_FREQUENCY', 'Hz', 129675000);
    SimVar.SetSimVarValue('A32NX_RMP_R_VHF3_STANDBY_FREQUENCY', 'Hz', 136975000);
}

export const RadioPanelsContainer = () => {
    const [com1] = useSimVar('COM ACTIVE FREQUENCY:1', 'Hz', 1000);
    const initFreqs = com1 === 0;

    // Workaround for Asobo bug
    // Frequency can be 0 when starting at the gate even when set in Apron.FLT
    useEffect(() => {
        initFrequencies();
    }, [initFreqs]);

    return (
        <div className="rmp-wrapper">
            <RootRadioPanel side="L" />
            <RootRadioPanel side="R" />
        </div>
    );
};
