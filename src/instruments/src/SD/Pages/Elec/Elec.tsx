import classNames from 'classnames';
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
    const [emergencyGeneratorInUse] = useSimVar('L:A32NX_ELEC_CONTACTOR_2XE_IS_CLOSED', 'Bool', maxStaleness);
    const [galleyIsShed] = useSimVar('L:A32NX_ELEC_GALLEY_IS_SHED', 'Bool', maxStaleness);
    const [tr1SuppliesDc1] = useSimVar('L:A32NX_ELEC_CONTACTOR_5PU1_IS_CLOSED', 'Bool', maxStaleness);
    const [tr2SuppliesDc2] = useSimVar('L:A32NX_ELEC_CONTACTOR_5PU2_IS_CLOSED', 'Bool', maxStaleness);
    const [ac1SuppliesAcEss] = useSimVar('L:A32NX_ELEC_CONTACTOR_3XC1_IS_CLOSED', 'Bool', maxStaleness);
    const [ac2SuppliesAcEss] = useSimVar('L:A32NX_ELEC_CONTACTOR_3XC2_IS_CLOSED', 'Bool', maxStaleness);
    const [dc1AndDcBatConnected] = useSimVar('L:A32NX_ELEC_CONTACTOR_1PC1_IS_CLOSED', 'Bool', maxStaleness);
    const [dcBatAndDcEssConnected] = useSimVar('L:A32NX_ELEC_CONTACTOR_4PC_IS_CLOSED', 'Bool', maxStaleness);
    const [dc2AndDcBatConnected] = useSimVar('L:A32NX_ELEC_CONTACTOR_1PC2_IS_CLOSED', 'Bool', maxStaleness);

    const [emergencyGeneratorSupplies] = useSimVar('L:A32NX_ELEC_CONTACTOR_2XE_IS_CLOSED', 'Bool', maxStaleness);
    const [acEssBusContactorClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_15XE1_IS_CLOSED', 'Bool', maxStaleness);
    const [trEssSuppliesDcEss] = useSimVar('L:A32NX_ELEC_CONTACTOR_3PE_IS_CLOSED', 'Bool', maxStaleness);

    const [externalPowerContactorClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_3XG_IS_CLOSED', 'Bool', maxStaleness);
    const [apuGeneratorContactorClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_3XS_IS_CLOSED', 'Bool', maxStaleness);
    const [generatorLineContactor1Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_9XU1_IS_CLOSED', 'Bool', maxStaleness);
    const [generatorLineContactor2Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_9XU2_IS_CLOSED', 'Bool', maxStaleness);
    const [busTieContactor1Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_11XU1_IS_CLOSED', 'Bool', maxStaleness);
    const [busTieContactor2Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_11XU2_IS_CLOSED', 'Bool', maxStaleness);

    const [idg1Connected] = useSimVar('L:A32NX_ELEC_ENG_GEN_1_IDG_IS_CONNECTED', 'Bool', maxStaleness);
    const [idg2Connected] = useSimVar('L:A32NX_ELEC_ENG_GEN_2_IDG_IS_CONNECTED', 'Bool', maxStaleness);

    return (
        <EcamPage name="main-elec">
            <PageTitle text="ELEC" x={6} y={18} />

            <BatteryToBatBusWire number={1} x={196.611875} y={50.77125} />
            <BatteryToBatBusWire number={2} x={367.724375} y={50.77125} />

            { tr1SuppliesDc1 ? <Wire description="TR1 to DC1" d="M56.25 117 v44.1 v-44.1" /> : null }
            <Wire description="AC1 to TR1" amber={!ac1IsPowered} d="M56.25 238.35 v29 v-29" />

            { tr2SuppliesDc2 ? <Wire description="TR2 to DC2" d="M536.25 117 v44.1 v-44.1" /> : null }
            <Wire description="AC2 to TR2" amber={!ac2IsPowered} d="M536.25 238.35 v29 v-29" />

            { ac1SuppliesAcEss ? <Wire description="AC1 to AC ESS" d="M138.57 279.32 h94.63 h-94.63" /> : null }
            { ac2SuppliesAcEss ? <Wire description="AC2 to AC ESS" d="M367.5 279.32 h94.63 h-94.63" /> : null }

            { dc1AndDcBatConnected && !dcBatAndDcEssConnected ? <Wire description="DC1 to DC BAT" d="M90.15 103.125 h168.69 v-41" /> : null }
            { dc1AndDcBatConnected && dcBatAndDcEssConnected ? <Wire description="DC 1 to DC BAT and DC ESS" d="M90.15 103.125 h168.69 v-44 v58.40 v-14.4" /> : null }
            { dc2AndDcBatConnected ? <Wire description="DC2 to DC BAT" d="M 341.16 103.125 h 166.66 h -166.66 v -42.52 v42.52" /> : null }

            { acEssBusContactorClosed && !emergencyGeneratorSupplies ? <Wire description="AC ESS to ESS TR" d="M258.84 237.65 v 28.52 v -28.52" /> : null }
            { trEssSuppliesDcEss ? <Wire description="ESS TR to DC ESS" d="M258.84 143.63 v 7.11 v -7.11" /> : null }
            <Arrow description="ESS TR to DC ESS" green={trEssSuppliesDcEss} direction="up" x={258.84 - (arrowSize / 2)} y={157.58} />

            { emergencyGeneratorSupplies ? <Wire description="EMER GEN to ESS TR" d="M 319.02 207.90 h -20.04 h 20.04" /> : null }
            <Arrow description="EMER GEN to ESS TR" green={emergencyGeneratorSupplies} direction="left" x={326.25} y={214.77} />
            { acEssBusContactorClosed && emergencyGeneratorSupplies ? (
                <>
                    <Wire description="EMER GEN to AC ESS" d="M 343.55 237.62 v 14.25 v -14.25" />
                    <Arrow description="EMER GEN to AC ESS" green direction="down" x={350.42} y={252.87} />
                </>
            ) : null }

            { externalPowerContactorClosed && busTieContactor1Closed && !busTieContactor2Closed ? (
                <Wire description="EXT PWR to AC1" d="M56.44 302.81 v18.75 h305.10 v57.94" />
            ) : null }
            { externalPowerContactorClosed && !busTieContactor1Closed && busTieContactor2Closed ? (
                <Wire description="EXT PWR to AC2" d="M536.25 302.81 v18.75 h-174.68 v57.94" />
            ) : null }
            { externalPowerContactorClosed && busTieContactor1Closed && busTieContactor2Closed ? (
                <Wire description="EXT PWR to AC1 and AC2" d="M536.25 302.81 v18.75 h-174.68 v57.94 v-57.94 h-305.10 v-18.75" />
            ) : null }

            { apuGeneratorContactorClosed && busTieContactor1Closed && !busTieContactor2Closed ? (
                <Wire description="APU GEN to AC1" d="M56.44 302.81 v18.75 h159.60 v35.67" />
            ) : null }
            { apuGeneratorContactorClosed && !busTieContactor1Closed && busTieContactor2Closed ? (
                <Wire description="APU GEN to AC2" d="M536.25 302.81 v18.75 h-320.2 v35.67" />
            ) : null }
            { apuGeneratorContactorClosed && busTieContactor1Closed && busTieContactor2Closed ? (
                <Wire description="APU GEN to AC1 and AC2" d="M536.25 302.81 v18.75 h-320.2 v35.67 v-35.67 h-159.60 v-18.75" />
            ) : null }

            { generatorLineContactor1Closed && !busTieContactor1Closed ? <Wire description="GEN1 to AC1" d="M56.44 302.81 v42.5 v-42.5" /> : null }
            { generatorLineContactor1Closed && busTieContactor1Closed && busTieContactor2Closed
                ? <Wire description="GEN1 to AC1 and AC2" d="M56.44 302.81 v42.5 v-23.75 h479.81 v-20.75" /> : null }

            { generatorLineContactor2Closed && !busTieContactor2Closed ? <Wire description="GEN2 to AC2" d="M536.25 302.81 v42.5 v-42.5" /> : null }
            { generatorLineContactor2Closed && busTieContactor1Closed && busTieContactor2Closed
                ? <Wire description="GEN2 to AC1 and AC2" d="M536.25 302.81 v42.5 v-23.75 h-479.81 v-20.75" /> : null }

            { generatorLineContactor1Closed || busTieContactor1Closed ? <Arrow description="AC1" green direction="up" x={56.25 - (arrowSize / 2)} y={303.77} /> : null }
            { generatorLineContactor2Closed || busTieContactor2Closed ? <Arrow description="AC2" green direction="up" x={536.25 - (arrowSize / 2)} y={303.77} /> : null }
            { externalPowerContactorClosed && (busTieContactor1Closed || busTieContactor2Closed) ? <Arrow description="EXT PWR" green direction="up" x={354.77} y={385.88} /> : null }
            { apuGeneratorContactorClosed && (busTieContactor1Closed || busTieContactor2Closed) ? <Arrow description="APU GEN" green direction="up" x={209.09} y={363.75} /> : null }

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
            <EmergencyGenerator titleOnly={!emergencyGeneratorInUse} x={330} y={161.25} />

            { galleyIsShed ? <GalleyShed x={300} y={483.75} /> : null }

            <IntegratedDriveGeneratorTitle number={1} x={28.13} y={476.25} />
            <IntegratedDriveGeneratorTemperature number={1} x={135} y={476.25} />
            { !idg1Connected ? <IntegratedDriveGeneratorDisconnected x={29.13} y={495} /> : null }
            <IntegratedDriveGeneratorTitle number={2} x={513.75} y={476.25} />
            <IntegratedDriveGeneratorTemperature number={2} x={480} y={476.25} />
            { !idg2Connected ? <IntegratedDriveGeneratorDisconnected x={518.75} y={495} /> : null }
        </EcamPage>
    );
};

export const Battery = ({ number, x, y }) => {
    const simVarNumber = 9 + number;
    const [isAuto] = useSimVar(`L:A32NX_OVHD_ELEC_BAT_${simVarNumber}_PB_IS_AUTO`, 'Bool', maxStaleness);

    const [potential] = useSimVar(`L:A32NX_ELEC_BAT_${simVarNumber}_POTENTIAL`, 'Volts', maxStaleness);
    const [potentialWithinNormalRange] = useSimVar(`L:A32NX_ELEC_BAT_${simVarNumber}_POTENTIAL_NORMAL`, 'Bool', maxStaleness);

    const [current] = useSimVar(`L:A32NX_ELEC_BAT_${simVarNumber}_CURRENT`, 'Ampere', maxStaleness);
    const [currentWithinNormalRange] = useSimVar(`L:A32NX_ELEC_BAT_${simVarNumber}_CURRENT_NORMAL`, 'Bool', maxStaleness);

    const allParametersWithinNormalRange = potentialWithinNormalRange && currentWithinNormalRange;

    const [staticInverterInUse] = useSimVar('L:A32NX_ELEC_CONTACTOR_15XE2_IS_CLOSED', 'Bool', maxStaleness);

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
            { number === 1 && staticInverterInUse ? (
                <>
                    <Arrow direction="right" x={92.57625} y={1.875} />
                    <text className="Medium" x={108.75} y={15}>STAT INV</text>
                </>
            ) : null }
        </SvgGroup>
    );
};

const BatteryToBatBusWire = ({ number, x, y }) => {
    const [contactorClosed] = useSimVar(`L:A32NX_ELEC_CONTACTOR_6PB${number}_IS_CLOSED`, 'Bool', maxStaleness);
    const [current] = useSimVar(`L:A32NX_ELEC_BAT_${9 + number}_CURRENT`, 'Ampere', maxStaleness);
    const [showArrowWhenContactorClosed] = useSimVar(`L:A32NX_ELEC_CONTACTOR_6PB${number}_SHOW_ARROW_WHEN_CLOSED`, 'Bool', maxStaleness);

    const showArrow = contactorClosed && showArrowWhenContactorClosed;
    const isCharging = current > 0;
    const isDischarging = current < 0;

    const pointingRight = (number === 2 && isCharging) || (number === 1 && isDischarging);

    if (!contactorClosed) {
        return (<></>);
    }

    return (
        <SvgGroup x={x} y={y}>
            { showArrow
                ? (
                    <>
                        { pointingRight ? (
                            <>
                                <Wire amber={isDischarging} d="M0.3 0 h24.53 h-24.53" />
                                <Arrow direction="right" green={isCharging} amber={isDischarging} x={25.525625} y={-(arrowSize / 2)} />
                            </>
                        )
                            : (
                                <>
                                    <Wire amber={isDischarging} d="M11.5 0 h24.52 h-24.53" />
                                    <Arrow direction="left" green={isCharging} amber={isDischarging} x={10} y={arrowSize / 2} />
                                </>
                            )}

                    </>
                ) : <Wire d="M0.3 0 h36.15 h-36.15" /> }
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

    const [bat1IsAuto] = useSimVar('L:A32NX_OVHD_ELEC_BAT_10_PB_IS_AUTO', 'Bool', maxStaleness);
    const [bat2IsAuto] = useSimVar('L:A32NX_OVHD_ELEC_BAT_11_PB_IS_AUTO', 'Bool', maxStaleness);
    const atLeastOneBatteryIsAuto = bat1IsAuto || bat2IsAuto;

    const potentialIsWithinNormalRange = useSimVar('L:A32NX_ELEC_DC_BAT_BUS_POTENTIAL_NORMAL', 'Bool', maxStaleness);

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
    const [currentWithinNormalRange] = useSimVar(`L:A32NX_ELEC_TR_${number}_CURRENT_NORMAL`, 'Bool', maxStaleness);

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

const EmergencyGenerator = ({ titleOnly, x, y }) => {
    const [potential] = useSimVar('L:A32NX_ELEC_EMER_GEN_POTENTIAL', 'Volts', maxStaleness);
    const [potentialWithinNormalRange] = useSimVar('L:A32NX_ELEC_EMER_GEN_POTENTIAL_NORMAL', 'Bool', maxStaleness);

    const [frequency] = useSimVar('L:A32NX_ELEC_EMER_GEN_FREQUENCY', 'Hertz', maxStaleness);
    const [frequencyWithinNormalRange] = useSimVar('L:A32NX_ELEC_EMER_GEN_FREQUENCY_NORMAL', 'Bool', maxStaleness);

    const allParametersWithinNormalRange = potentialWithinNormalRange && frequencyWithinNormalRange;

    return (
        <SvgGroup x={x} y={y}>
            {
                titleOnly ? <text className="Medium" dominantBaseline="middle" x={0.9375} y={45}>EMER GEN</text>
                    : (
                        <>
                            <Box width={103.125} height={75} />

                            <text className={`Middle ${!allParametersWithinNormalRange ? 'Amber' : ''}`} x={51.5625} y={24.375}>EMER GEN</text>
                            <ElectricalProperty x={63.75} y={46.875} value={potential} unit="V" isWithinNormalRange={potentialWithinNormalRange} />
                            <ElectricalProperty x={63.75} y={69.375} value={frequency} unit="HZ" isWithinNormalRange={frequencyWithinNormalRange} />
                        </>
                    )
            }
        </SvgGroup>
    );
};

const GalleyShed = ({ x, y }) => (
    <SvgGroup x={x} y={y}>
        <text className="Middle">GALLEY</text>
        <text className="Middle" y={18.75}>SHED</text>
    </SvgGroup>
);

const IntegratedDriveGeneratorTitle = ({ number, x, y }) => {
    const [connected] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${number}_IDG_IS_CONNECTED`, 'Bool', maxStaleness);
    return (
        <SvgGroup x={x} y={y}>
            <text className={!connected ? 'Amber' : ''}>IDG</text>
            <text className={`Large ${!connected ? 'Amber' : ''}`} x={39.38}>{number}</text>
        </SvgGroup>
    );
};

const IntegratedDriveGeneratorTemperature = ({ number, x, y }) => {
    const [temperature] = useSimVar(`L:A32NX_ELEC_ENG_GEN_${number}_IDG_OIL_OUTLET_TEMPERATURE`, 'Celsius', maxStaleness);
    return (
        <SvgGroup x={x} y={y}>
            <text id="IDG2_TEMP_VALUE" className="Green Right">{Math.round(temperature)}</text>
            <text id="IDG2_TEMP_UNIT" className="Cyan" x={3.75}>°C</text>
        </SvgGroup>
    );
};

const IntegratedDriveGeneratorDisconnected = ({ x, y }) => <text className="Amber" x={x} y={y}>DISC</text>;

interface ArrowProps {
    direction: 'up' | 'down' | 'right' | 'left',
    green?: boolean,
    amber?: boolean,
    x: number,
    y: number,
    description?: string,
}
const Arrow = ({ direction, green, amber, x, y }: ArrowProps) => {
    const classes = classNames({ Green: green }, { Amber: amber });
    switch (direction) {
    default:
    case 'up':
        return <path className={classes} d={`M${x} ${y}h${arrowSize} l-6.8685 -8.99325z`} />;
    case 'down':
        return <path className={classes} d={`M${x} ${y}h-${arrowSize} l6.8685 8.99325z`} />;
    case 'right':
        return <path className={classes} d={`M${x} ${y}v${arrowSize} l8.99325 -6.8685z`} />;
    case 'left':
        return <path className={classes} d={`M${x} ${y}v-${arrowSize} l-8.99325 6.8685z`} />;
    }
};
const arrowSize = 13.737375;

interface WireProps {
    amber?: boolean,
    description?: string,
    d: string
}
const Wire = ({ amber, d }: WireProps) => {
    const classes = classNames({ Green: !amber }, { Amber: amber });
    return <path className={classes} d={d} />;
};

ReactDOM.render(<SimVarProvider><ElecPage /></SimVarProvider>, getRenderTarget());
