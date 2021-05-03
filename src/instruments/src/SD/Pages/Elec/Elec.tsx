import React from 'react';
import ReactDOM from 'react-dom';
import { PageTitle } from '../../Common/PageTitle';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';
import { SimVarProvider, useSimVar } from '../../../Common/simVars';

import './Elec.scss';

setIsEcamPage('elec_page');

// 3.75
export const ElecPage = () => (
    <EcamPage name="main-elec">
        <PageTitle x={6} y={18} text="ELEC" />
        <Battery number={1} x={108.75} y={10} />
        <Battery number={2} x={405} y={10} />
    </EcamPage>
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
        <SvgGroup x={x} y={y}>
            <Box width={86.25} height={71.25} />
            <text className={`Right ${!allParametersWithinNormalRange && isAuto ? 'Amber' : ''}`} x={52.5} y={21.625}>BAT</text>
            <text className={`${!allParametersWithinNormalRange && isAuto ? 'Amber' : ''}`} x={56.25} y={21.625}>{number}</text>
            { isAuto
                ? (
                    <>
                        <ElectricalProperty x={52.5} y={43.125} value={Math.round(potential)} unit="V" isWithinNormalRange={potentialWithinNormalRange} />
                        <ElectricalProperty x={52.5} y={65.625} value={Math.abs(Math.round(current))} unit="A" isWithinNormalRange={currentWithinNormalRange} />
                    </>
                ) : (<text className="Middle" dominantBaseline="middle" x={43.125} y={41.25}>OFF</text>) }
        </SvgGroup>
    );
};

const EcamPage = ({ name, children }) => (
    <svg id={name} version="1.1" viewBox="0 0 600 600" style={{ marginTop: '-60px' }} xmlns="http://www.w3.org/2000/svg">
        {children}
    </svg>
);

const SvgGroup = ({ x, y, children }) => <g transform={`translate(${x},${y})`}>{children}</g>;

const ElectricalProperty = ({ x, y, value, unit, isWithinNormalRange }) => (
    <SvgGroup x={x} y={y}>
        <text className={`Right ${isWithinNormalRange ? 'Green' : 'Amber'}`}>{value}</text>
        <text className="Cyan" x={3.75}>{unit}</text>
    </SvgGroup>
);

const Box = ({ width, height }) => (
    <rect className="Box" width={width} height={height} />
);

ReactDOM.render(<SimVarProvider><ElecPage /></SimVarProvider>, getRenderTarget());
