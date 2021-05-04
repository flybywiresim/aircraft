import React from 'react';
import ReactDOM from 'react-dom';
import { PageTitle } from '../../Common/PageTitle';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';
import { SimVarProvider, useSimVar } from '../../../Common/simVars';

import './Elec.scss';

setIsEcamPage('elec_page');

export const ElecPage = () => {
    const [dc1IsPowered] = useSimVar('L:A32NX_ELEC_DC_1_BUS_IS_POWERED', 'Bool', 1000);
    const [dc2IsPowered] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Bool', 1000);
    const [dcEssIsPowered] = useSimVar('L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', 'Bool', 1000);
    const [ac1IsPowered] = useSimVar('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'Bool', 1000);
    const [ac2IsPowered] = useSimVar('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'Bool', 1000);
    const [acEssIsPowered] = useSimVar('L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED', 'Bool', 1000);

    return (
        <EcamPage name="main-elec">
            <PageTitle text="ELEC" x={6} y={18} />
            <Battery number={1} x={108.75} y={10} />
            <Battery number={2} x={405} y={10} />
            <BatteryBus x={232.5} y={35} width={135} />
            <Bus name="DC" number={1} isNormal={dc1IsPowered} x={6} y={90} width={86.25} />
            <Bus name="DC" number={2} isNormal={dc2IsPowered} x={507.75} y={90} width={86.25} />
            <Bus name="DC ESS" isNormal={dcEssIsPowered} x={232.5} y={116.25} width={135} />
            <Bus name="AC" number={1} isNormal={ac1IsPowered} x={6} y={266.25} width={135} />
            <Bus name="AC" number={2} isNormal={ac2IsPowered} x={459} y={266.25} width={135} />
            <Bus name="AC ESS" isNormal={acEssIsPowered} x={232.5} y={266.25} width={135} />
        </EcamPage>
    );
};

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

interface BusProps {
    x: number,
    y: number,
    width: number,
    name: string,
    number?: number,
    isNormal: boolean
}
const Bus = ({ x, y, width, name, number, isNormal } : BusProps) => (
    <SvgGroup x={x} y={y}>
        <rect className="Bus" width={width} height="26.25" />
        <text className={`Bus ${number ? 'Right' : 'Middle'} ${isNormal ? 'Green' : 'Amber'}`} dominantBaseline="middle" x={width / 2} y="11.25">{name}</text>
        {number ? <text className={`Bus Big ${isNormal ? 'Green' : 'Amber'}`} x={(width / 2) + 3.75} y="22">{number}</text> : null}
    </SvgGroup>
);

const BatteryBus = ({ x, y, width }) => {
    const [isPowered] = useSimVar('L:A32NX_ELEC_DC_BAT_BUS_IS_POWERED', 'Bool', 1000);

    const [bat1IsAuto] = useSimVar('L:A32NX_OVHD_ELEC_BAT_10_PB_IS_AUTO', 'Bool');
    const [bat2IsAuto] = useSimVar('L:A32NX_OVHD_ELEC_BAT_11_PB_IS_AUTO', 'Bool');
    const atLeastOneBatteryIsAuto = bat1IsAuto || bat2IsAuto;

    const potentialIsWithinNormalRange = useSimVar('L:A32NX_ELEC_DC_BAT_BUS_POTENTIAL_NORMAL', 'Bool');

    const name = atLeastOneBatteryIsAuto ? 'DC BAT' : 'XX';
    return (<Bus x={x} y={y} width={width} name={name} isNormal={isPowered && potentialIsWithinNormalRange && atLeastOneBatteryIsAuto} />);
};

ReactDOM.render(<SimVarProvider><ElecPage /></SimVarProvider>, getRenderTarget());
