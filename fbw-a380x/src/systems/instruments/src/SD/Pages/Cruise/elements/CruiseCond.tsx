import React from 'react';
import { useSimVar } from '@instruments/common/simVars';

export const CruiseCond = () => {
    const [cockpitCabinTemp] = useSimVar('L:A32NX_COND_CKPT_TEMP', 'celsius', 1000);
    const [fwdLowerCabinTemp] = useSimVar('L:A32NX_COND_FWD_TEMP', 'celsius', 1000);
    const [aftLowerCabinTemp] = useSimVar('L:A32NX_COND_AFT_TEMP', 'celsius', 1000);
    const fwdUpperCabinTemp = fwdLowerCabinTemp + 2;
    const aftUpperCabinTemp = aftLowerCabinTemp + 2;
    const fwdCargoTemp = 12;
    const aftCargoTemp = 14;

    return (
        <>
            <text className="F22 Cyan" x="19" y="506">°C</text>
            <text id="CockpitTemp" className="F29 Green EndAlign" x="109" y="528">{cockpitCabinTemp.toFixed(0)}</text>

            <text id="ForwardUpperTemp" className="F29 Green EndAlign" x="210" y="506">{fwdUpperCabinTemp.toFixed(0)}</text>
            <text className="F24 White LS2" x="239" y="506">TO</text>
            <text id="AftUpperTemp" className="F29 Green EndAlign" x="340" y="506">{aftUpperCabinTemp.toFixed(0)}</text>

            <text id="ForwardLowerTemp" className="F29 Green EndAlign" x="210" y="552">{fwdLowerCabinTemp.toFixed(0)}</text>
            <text className="F24 White LS2" x="239" y="552">TO</text>
            <text id="AftLowerTemp" className="F29 Green EndAlign" x="340" y="552">{aftLowerCabinTemp.toFixed(0)}</text>

            {/* Cargo Temps */}
            <text id="fwdCargoTemp" className="F29 Green EndAlign" x="178" y="595">{fwdCargoTemp.toFixed(0)}</text>
            <text id="AftCargoTemp" className="F29 Green EndAlign" x="378" y="595">{aftCargoTemp.toFixed(0)}</text>
        </>
    );
};

export default CruiseCond;
