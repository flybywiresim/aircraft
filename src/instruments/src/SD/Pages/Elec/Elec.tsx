import React from 'react';
import ReactDOM from 'react-dom';
import { PageTitle } from '../../Common/PageTitle';
import { getRenderTarget, setIsEcamPage } from '../../../Common/defaults';
import { SimVarProvider, useSimVar } from '../../../Common/simVars';

import './Elec.scss';

setIsEcamPage('elec_page');

const maxStaleness = 300;

export const ElecPage = () => {
    const [dc1IsPowered] = useSimVar('L:A32NX_ELEC_DC_1_BUS_IS_POWERED', 'Bool', maxStaleness);
    const [dc2IsPowered] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Bool', maxStaleness);
    const [dcEssIsPowered] = useSimVar('L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', 'Bool', maxStaleness);
    const [dcEssShedBusIsPowered] = useSimVar('L:A32NX_ELEC_DC_ESS_SHED_BUS_IS_POWERED', 'Bool', maxStaleness);
    const [ac1IsPowered] = useSimVar('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'Bool', maxStaleness);
    const [ac2IsPowered] = useSimVar('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'Bool', maxStaleness);
    const [acEssIsPowered] = useSimVar('L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED', 'Bool', maxStaleness);
    const [acEssShedBusIsPowered] = useSimVar('L:A32NX_ELEC_AC_ESS_SHED_BUS_IS_POWERED', 'Bool', maxStaleness);
    const [externalPowerAvailable] = useSimVar('EXTERNAL POWER AVAILABLE:1', 'Bool', maxStaleness);
    const [staticInverterInUse] = useSimVar('L:A32NX_ELEC_CONTACTOR_15XE2_IS_CLOSED', 'Bool', maxStaleness);
    const [trEssInUse] = useSimVar('L:A32NX_ELEC_CONTACTOR_3PE_IS_CLOSED', 'Bool', maxStaleness);

    return (
        <EcamPage name="main-elec">
            <PageTitle text="ELEC" x={6} y={18} />
            <Battery number={1} x={108.75} y={10} />
            <Battery number={2} x={405} y={10} />
            <BatteryBus x={232.5} y={35} width={135} />
            <Bus name="DC" number={1} isNormal={dc1IsPowered} x={6} y={90} width={86.25} />
            <Bus name="DC" number={2} isNormal={dc2IsPowered} x={507.75} y={90} width={86.25} />
            <Bus name="DC ESS" isNormal={dcEssIsPowered} isShed={!dcEssShedBusIsPowered} x={232.5} y={116.25} width={135} />
            <Bus name="AC" number={1} isNormal={ac1IsPowered} x={6} y={266.25} width={135} />
            <Bus name="AC" number={2} isNormal={ac2IsPowered} x={459} y={266.25} width={135} />
            <Bus name="AC ESS" isNormal={acEssIsPowered} isShed={!acEssShedBusIsPowered} x={232.5} y={266.25} width={135} />
            <EngineGenerator number={1} x={13.125} y={345} />
            <EngineGenerator number={2} x={493.125} y={345} />
            <ApuGenerator x={168.75} y={367.5} />
            { staticInverterInUse ? <StaticInverter x={315} y={390} /> : null }
            { !staticInverterInUse && externalPowerAvailable ? <ExternalPower x={315} y={390} /> : null }
            <TransformerRectifier number={1} x={13.125} y={161.25} />
            <TransformerRectifier number={2} x={493.125} y={161.25} />
            <TransformerRectifier number={3} x={213.75} y={161.25} titleOnly={!trEssInUse} />
        </EcamPage>
    );
};

export const Battery = ({ number, x, y }) => {
    const simVarNumber = 9 + number;
    const [isAuto] = useSimVar(`L:A32NX_OVHD_ELEC_BAT_${simVarNumber}_PB_IS_AUTO`, 'Bool', maxStaleness);

    const [potential] = useSimVar(`L:A32NX_ELEC_BAT_${simVarNumber}_POTENTIAL`, 'Volts');
    const [potentialWithinNormalRange] = useSimVar(`L:A32NX_ELEC_BAT_${simVarNumber}_POTENTIAL_NORMAL`, 'Bool');

    const [current] = useSimVar(`L:A32NX_ELEC_BAT_${simVarNumber}_CURRENT`, 'Ampere');
    const [currentWithinNormalRange] = useSimVar(`L:A32NX_ELEC_BAT_${simVarNumber}_CURRENT_NORMAL`, 'Bool');

    const allParametersWithinNormalRange = potentialWithinNormalRange && currentWithinNormalRange;

    return (
        <SvgGroup x={x} y={y}>
            <Box width={86.25} height={71.25} />
            <text className={`Right ${!allParametersWithinNormalRange && isAuto ? 'Amber' : ''}`} x={52.5} y={21.625}>BAT</text>
            <text className={`Large ${!allParametersWithinNormalRange && isAuto ? 'Amber' : ''}`} x={56.25} y={21.625}>{number}</text>
            { isAuto
                ? (
                    <>
                        <ElectricalProperty x={52.5} y={43.125} value={potential} unit="V" isWithinNormalRange={potentialWithinNormalRange} />
                        <ElectricalProperty x={52.5} y={65.625} value={Math.abs(current)} unit="A" isWithinNormalRange={currentWithinNormalRange} />
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
        <text className={`Right ${isWithinNormalRange ? 'Green' : 'Amber'}`}>{Math.round(value)}</text>
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
    isShed?: boolean
}
const Bus = ({ x, y, width, name, number, isNormal, isShed } : BusProps) => {
    const busHeight = 26.25;
    return (
        <SvgGroup x={x} y={y}>
            <rect className="Bus" width={width} height={busHeight} />
            <text className={`Large ${number ? 'Right' : 'Middle'} ${isNormal ? 'Green' : 'Amber'}`} dominantBaseline="middle" x={width / 2} y="10.5">{name}</text>
            {number ? <text className={`ExtraLarge ${isNormal ? 'Green' : 'Amber'}`} x={(width / 2) + 3.75} y="22">{number}</text> : null}
            {isShed ? <text className="Middle ExtraSmall Amber" dominantBaseline="middle" x={(width / 2)} y={busHeight + 8.25}>SHED</text> : null}
        </SvgGroup>
    );
};

const BatteryBus = ({ x, y, width }) => {
    const [isPowered] = useSimVar('L:A32NX_ELEC_DC_BAT_BUS_IS_POWERED', 'Bool', maxStaleness);

    const [bat1IsAuto] = useSimVar('L:A32NX_OVHD_ELEC_BAT_10_PB_IS_AUTO', 'Bool');
    const [bat2IsAuto] = useSimVar('L:A32NX_OVHD_ELEC_BAT_11_PB_IS_AUTO', 'Bool');
    const atLeastOneBatteryIsAuto = bat1IsAuto || bat2IsAuto;

    const potentialIsWithinNormalRange = useSimVar('L:A32NX_ELEC_DC_BAT_BUS_POTENTIAL_NORMAL', 'Bool');

    const name = atLeastOneBatteryIsAuto ? 'DC BAT' : 'XX';
    return (<Bus x={x} y={y} width={width} name={name} isNormal={isPowered && potentialIsWithinNormalRange && atLeastOneBatteryIsAuto} />);
};

const EngineGenerator = ({ number, x, y }) => {
    const [isOn] = useSimVar(`GENERAL ENG MASTER ALTERNATOR:${number}`, 'Bool', maxStaleness);

    const [load] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${number}_LOAD`, 'Percent', maxStaleness);
    const [loadWithinNormalRange] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${number}_LOAD_NORMAL`, 'Bool', maxStaleness);

    const [potential] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${number}_POTENTIAL`, 'Volts', maxStaleness);
    const [potentialWithinNormalRange] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${number}_POTENTIAL_NORMAL`, 'Bool', maxStaleness);

    const [frequency] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${number}_FREQUENCY`, 'Hertz', maxStaleness);
    const [frequencyWithinNormalRange] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${number}_FREQUENCY_NORMAL`, 'Bool', maxStaleness);

    const allParametersWithinNormalRange = loadWithinNormalRange && potentialWithinNormalRange && frequencyWithinNormalRange;
    return (
        <SvgGroup x={x} y={y}>
            <Box width={86.25} height={93.75} />

            <text className={`Right ${!isOn || !allParametersWithinNormalRange ? 'Amber' : ''}`} x={54.375} y={22.5}>GEN</text>
            <text className={`Large ${!isOn || !allParametersWithinNormalRange ? 'Amber' : ''}`} x={54.375 + 3.75} y={22.5}>{number}</text>
            { isOn
                ? (
                    <>
                        <ElectricalProperty x={54.375} y={45} value={load} unit="%" isWithinNormalRange={loadWithinNormalRange} />
                        <ElectricalProperty x={54.375} y={67.5} value={potential} unit="V" isWithinNormalRange={potentialWithinNormalRange} />
                        <ElectricalProperty x={54.375} y={90} value={frequency} unit="HZ" isWithinNormalRange={frequencyWithinNormalRange} />
                    </>
                )
                : <text className="Middle" dominantBaseline="middle" x={43.125} y={54.375}>OFF</text>}
        </SvgGroup>
    );
};

const ApuGenerator = ({ x, y }) => {
    const [masterSwPbOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', maxStaleness);
    const [genSwitchOn] = useSimVar('APU GENERATOR SWITCH:1', 'Bool', maxStaleness);

    const [load] = useSimVar('L:A32NX_ELEC_APU_GEN_1_LOAD', 'Percent', maxStaleness);
    const [loadWithinNormalRange] = useSimVar('L:A32NX_ELEC_APU_GEN_1_LOAD_NORMAL', 'Bool', maxStaleness);

    const [potential] = useSimVar('L:A32NX_ELEC_APU_GEN_1_POTENTIAL', 'Volts', maxStaleness);
    const [potentialWithinNormalRange] = useSimVar('L:A32NX_ELEC_APU_GEN_1_POTENTIAL_NORMAL', 'Bool', maxStaleness);

    const [frequency] = useSimVar('L:A32NX_ELEC_APU_GEN_1_FREQUENCY', 'Hertz', maxStaleness);
    const [frequencyWithinNormalRange] = useSimVar('L:A32NX_ELEC_APU_GEN_1_FREQUENCY_NORMAL', 'Bool', maxStaleness);

    const allParametersWithinNormalRange = loadWithinNormalRange && potentialWithinNormalRange && frequencyWithinNormalRange;

    const apuGenTitle = <text className={`Middle ${!masterSwPbOn || (genSwitchOn && allParametersWithinNormalRange) ? '' : 'Amber'}`} x={46.875} y={18.75}>APU GEN</text>;

    return (
        <SvgGroup x={x} y={y}>
            { masterSwPbOn ? (
                <>
                    <Box width={93.75} height={90} />
                    {apuGenTitle}
                    { genSwitchOn ? (
                        <>
                            <ElectricalProperty x={58.125} y={41.25} value={load} unit="%" isWithinNormalRange={loadWithinNormalRange} />
                            <ElectricalProperty x={58.125} y={63.75} value={potential} unit="V" isWithinNormalRange={potentialWithinNormalRange} />
                            <ElectricalProperty x={58.125} y={86.25} value={frequency} unit="HZ" isWithinNormalRange={frequencyWithinNormalRange} />
                        </>
                    ) : <text className="Middle" dominantBaseline="middle" x={46.875} y={48.75}>OFF</text> }

                </>
            ) : apuGenTitle}

        </SvgGroup>
    );
};

const ExternalPower = ({ x, y }) => {
    const [potential] = useSimVar('L:A32NX_ELEC_EXT_PWR_POTENTIAL', 'Volts', maxStaleness);
    const [potentialWithinNormalRange] = useSimVar('L:A32NX_ELEC_EXT_PWR_POTENTIAL_NORMAL', 'Bool', maxStaleness);

    const [frequency] = useSimVar('L:A32NX_ELEC_EXT_PWR_FREQUENCY', 'Hertz', maxStaleness);
    const [frequencyWithinNormalRange] = useSimVar('L:A32NX_ELEC_EXT_PWR_FREQUENCY_NORMAL', 'Bool', maxStaleness);

    return (
        <PotentialFrequencyBox
            x={x}
            y={y}
            text="EXT PWR"
            potential={potential}
            potentialWithinNormalRange={potentialWithinNormalRange}
            frequency={frequency}
            frequencyWithinNormalRange={frequencyWithinNormalRange}
        />
    );
};

const StaticInverter = ({ x, y }) => {
    const [potential] = useSimVar('L:A32NX_ELEC_STAT_INV_POTENTIAL', 'Volts', maxStaleness);
    const [potentialWithinNormalRange] = useSimVar('L:A32NX_ELEC_STAT_INV_POTENTIAL_NORMAL', 'Bool', maxStaleness);

    const [frequency] = useSimVar('L:A32NX_ELEC_STAT_INV_FREQUENCY', 'Hertz', maxStaleness);
    const [frequencyWithinNormalRange] = useSimVar('L:A32NX_ELEC_STAT_INV_FREQUENCY_NORMAL', 'Bool', maxStaleness);

    return (
        <PotentialFrequencyBox
            x={x}
            y={y}
            text="STAT INV"
            potential={potential}
            potentialWithinNormalRange={potentialWithinNormalRange}
            frequency={frequency}
            frequencyWithinNormalRange={frequencyWithinNormalRange}
        />
    );
};

const PotentialFrequencyBox = ({ x, y, text, potential, potentialWithinNormalRange, frequency, frequencyWithinNormalRange }) => {
    const allParametersWithinNormalRange = potentialWithinNormalRange && frequencyWithinNormalRange;

    return (
        <SvgGroup x={x} y={y}>
            <Box width={93.75} height={67.5} />
            <text className={`Middle ${text.length > 7 ? 'Small' : ''} ${!allParametersWithinNormalRange ? 'Amber' : ''}`} x={46.875} y={18.75}>{text}</text>
            <ElectricalProperty x={52.5} y={41.25} value={potential} unit="V" isWithinNormalRange={potentialWithinNormalRange} />
            <ElectricalProperty x={52.5} y={63.75} value={frequency} unit="HZ" isWithinNormalRange={frequencyWithinNormalRange} />
        </SvgGroup>
    );
};

interface TransformerRectifierProps {
    number: number,
    titleOnly?: boolean,
    x: number,
    y:number
}
const TransformerRectifier = ({ number, titleOnly, x, y }: TransformerRectifierProps) => {
    const [potential] = useSimVar(`L:A32NX_ELEC_TR_${number}_POTENTIAL`, 'Volts', maxStaleness);
    const [potentialWithinNormalRange] = useSimVar(`L:A32NX_ELEC_TR_${number}_POTENTIAL_NORMAL`, 'Bool', maxStaleness);

    const [current] = useSimVar(`L:A32NX_ELEC_TR_${number}_CURRENT`, 'Ampere', maxStaleness);
    const [currentWithinNormalRange] = useSimVar(`L:A32NX_ELEC_TR_${number}_CURRENT_NORMAL`, 'Bool');

    const allParametersWithinNormalRange = potentialWithinNormalRange && currentWithinNormalRange;

    const title = (
        <text
            className={`Right ${!allParametersWithinNormalRange && !titleOnly ? 'Amber' : ''}`}
            x={number === 3 ? 80 : 50}
            y={24.375}
        >
            {number === 3 ? 'ESS TR' : 'TR'}
        </text>
    );

    return (
        <SvgGroup x={x} y={y}>
            { titleOnly ? title : (
                <>
                    <Box width={86.25} height={75} />
                    {title}
                    { number !== 3 ? <text className={`Large ${!allParametersWithinNormalRange ? 'Amber' : ''}`} x={53.75} y={24.375}>{number}</text> : null }
                    <ElectricalProperty x={54.375} y={46.875} value={potential} unit="V" isWithinNormalRange={potentialWithinNormalRange} />
                    <ElectricalProperty x={54.375} y={69.375} value={current} unit="A" isWithinNormalRange={currentWithinNormalRange} />
                </>
            )}

        </SvgGroup>
    );
};

ReactDOM.render(<SimVarProvider><ElecPage /></SimVarProvider>, getRenderTarget());
