import React from 'react';
import ReactDOM from 'react-dom';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';
import { SimVarProvider, useSimVar } from '../../../Common/simVars';

import './Elec.scss';

setIsEcamPage('elec_page');

// 3.75
export const ElecPage = () => (
    <>
        <svg id="main-elec" version="1.1" viewBox="0 0 600 600" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
            <Battery number={1} x={108.75} y={15} />
            <Battery number={2} x={405} y={15} />
        </svg>
    </>
);

export const Battery = ({ number, x, y }) => {
    const simVarNumber = 9 + number;
    const [isAuto] = useSimVar(`L:A32NX_OVHD_ELEC_BAT_${simVarNumber}_PB_IS_AUTO`, 'Bool', 1000);

    const [potential] = useSimVar(`L:A32NX_ELEC_BAT_${simVarNumber}_POTENTIAL`, 'Volts');
    const [potentialWithinNormalRange] = useSimVar(`L:A32NX_ELEC_BAT_${simVarNumber}_POTENTIAL_NORMAL`, 'Bool');

    const [current] = useSimVar(`L:A32NX_ELEC_BAT_${simVarNumber}_CURRENT`, 'Ampere');
    const [currentWithinNormalRange] = useSimVar(`L:A32NX_ELEC_BAT_${simVarNumber}_CURRENT_NORMAL`, 'Bool');

    const allParametersWithinNormalRange = potentialWithinNormalRange && currentWithinNormalRange;

    return (
        <>
            <rect className="box" x={x} y={y} width="86.25" height="71.25" />
            <text className={`right ${!allParametersWithinNormalRange && isAuto ? 'amber' : ''}`} x={x + 52.5} y={y + 21.625}>BAT</text>
            <text className={`left ${!allParametersWithinNormalRange && isAuto ? 'amber' : ''}`} x={x + 56.25} y={y + 21.625}>{number}</text>
            { isAuto
                ? (
                    <>
                        <text className={`right ${potentialWithinNormalRange ? 'green' : 'amber'}`} x={x + 52.5} y={y + 43.125}>{Math.round(potential)}</text>
                        <text className="cyan left" x={x + 56.25} y={y + 43.125}>V</text>
                        <text className={`right ${currentWithinNormalRange ? 'green' : 'amber'}`} x={x + 52.5} y={y + 65.625}>{Math.abs(Math.round(current))}</text>
                        <text className="cyan left" x={x + 56.25} y={y + 65.625}>A</text>
                    </>
                ) : (<text className="middle" dominantBaseline="middle" x={x + 43.125} y={y + 41.25}>OFF</text>) }
        </>
    );
};

ReactDOM.render(<SimVarProvider><ElecPage /></SimVarProvider>, getRenderTarget());
