import React, { useEffect, useState } from 'react';
import { useArinc429Var } from '@instruments/common/arinc429';
import { render } from '@instruments/common/index';
import { setIsEcamPage } from '@instruments/common/defaults';
import { useSimVar } from '@instruments/common/simVars';
import { Arc, Needle } from '@instruments/common/gauges';
import { PageTitle } from '../../Common/PageTitle';

import './Apu.scss';
import { EcamPage } from '../../Common/EcamPage';
import { SvgGroup } from '../../Common/SvgGroup';

setIsEcamPage('apu_page');

export const ApuPage = () => {
    const [apuAvail] = useSimVar('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'Bool', 1000);
    const [apuMasterPbOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 1000);

    const [apuGenLoad] = useSimVar('L:A32NX_ELEC_APU_GEN_1_LOAD', 'Percent', 1000);
    const [apuGenVoltage] = useSimVar('L:A32NX_ELEC_APU_GEN_1_POTENTIAL', 'Volts', 1000);
    const [apuGenFreq] = useSimVar('L:A32NX_ELEC_APU_GEN_1_FREQUENCY', 'Hertz', 1000);

    const [apuBleedPbOnConfirmed, setApuBleedPbOnConfirmed] = useState(false);
    const [apuBleedPbOn] = useSimVar('L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON', 'Bool', 1000);
    const [apuBleedOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 1000);
    const [apuBleedPressure] = useSimVar('L:APU_BLEED_PRESSURE', 'PSI', 1000);
    const displayedBleedPressure = Math.round(apuBleedPressure / 2) * 2; // APU bleed pressure is shown in steps of two.

    const apuN = useArinc429Var('L:A32NX_APU_N', 100);
    const [apuNIndicationColor, setApuIndicationColor] = useState('Green');

    const apuEgt = useArinc429Var('L:A32NX_APU_EGT', 100);
    const apuEgtCaution = useArinc429Var('L:A32NX_APU_EGT_CAUTION', 500);
    const apuEgtWarning = useArinc429Var('L:A32NX_APU_EGT_WARNING', 500);
    const displayedEgtValue = Math.round(apuEgt.value / 5) * 5; // APU Exhaust Gas Temperature is shown in steps of five.
    const [apuEgtIndicationColor, setApuEgtIndicationColor] = useState('Green');

    const [apuGenPbOn] = useSimVar('A:APU GENERATOR SWITCH', 'Boolean', 1000);

    const [apuFlapOpenPercentage] = useSimVar('L:A32NX_APU_FLAP_OPEN_PERCENTAGE', 'Percent', 1000);
    const [lowFuelPressure] = useSimVar('L:A32NX_APU_LOW_FUEL_PRESSURE_FAULT', 'Bool', 1000);
    const [isIntakeIndicationFlashing, setIsIntakeIndicationFlashing] = useState(false);

    const [apuContactorClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_3XS_IS_CLOSED', 'Bool', 1000);

    enum apuGenState {STANDBY, OFF, ON}

    const [currentApuGenState, setCurrentApuGenState] = useState(apuGenState.STANDBY);

    useEffect(() => {
        if (!apuMasterPbOn && !apuAvail) {
            setCurrentApuGenState(apuGenState.STANDBY);
        } else if (!(currentApuGenState === apuGenState.STANDBY) && !apuGenPbOn) {
            setCurrentApuGenState(apuGenState.OFF);
        } else {
            setCurrentApuGenState(apuGenState.ON);
        }
    }, [apuMasterPbOn, apuAvail]);

    useEffect(() => {
        if (apuFlapOpenPercentage !== 0 && !apuMasterPbOn) {
            setTimeout(() => {
                setIsIntakeIndicationFlashing(true);
            }, 3000);
        } else {
            clearTimeout();
            setIsIntakeIndicationFlashing(false);
        }

        return () => clearTimeout();
    }, [apuMasterPbOn, apuFlapOpenPercentage]);

    useEffect(() => {
        if (apuBleedPbOn) {
            setTimeout(() => {
                setApuBleedPbOnConfirmed(true);
            }, 10_000);
        } else {
            setApuBleedPbOnConfirmed(false);
        }

        return () => clearTimeout();
    }, [apuBleedPbOn]);

    useEffect(() => {
        if (apuN.value >= 0 && apuN.value < 102) {
            setApuIndicationColor('Green');
        }
        if (apuN.value >= 102 && apuN.value < 107) {
            setApuIndicationColor('Amber');
        }
        if (apuN.value >= 107) {
            setApuIndicationColor('Red');
        }
    }, [apuN]);

    useEffect(() => {
        if (apuEgt.value <= apuEgtCaution.value) {
            setApuEgtIndicationColor('Green');
        }
        if (apuEgt.value > apuEgtCaution.value && apuEgt.value <= apuEgtWarning.value) {
            setApuEgtIndicationColor('Amber');
        }
        if (apuEgt.value > apuEgtWarning.value) {
            setApuEgtIndicationColor('Red');
        }
        // TODO FIXME: ecbAdvisoryDetected must be defined in a system later on.
        // if (apuEgt.value <= apuEgtCaution.value && apuAvail && ecbAdvisoryDetected) {
        //     setApuEgtIndicationColor('Pulse');
        // }
    }, [apuEgt, apuEgtCaution, apuEgtWarning]);

    return (
        <EcamPage name="main-apu">
            <PageTitle x={283} y={33} text="APU" />

            {/* APU Avail */}
            {apuAvail
            && (
                <SvgGroup x={305} y={85}>
                    <text x={0} y={0} className="Green FontTitle Center">AVAIL</text>
                </SvgGroup>
            )}

            {/* APU Gen */}
            <SvgGroup x={105} y={100}>

                {apuContactorClosed
                && (
                    <SvgGroup x={42} y={-28}>
                        <polygon points="0,20 8,5 16,20" className="Circle" />
                    </SvgGroup>
                )}
                <rect className="Box" width={100} height={111} />

                <text
                    x={50}
                    y={20}
                    className={`Center ${(currentApuGenState === apuGenState.OFF || (apuGenFreq <= 390 || apuGenFreq >= 410) || (apuGenVoltage <= 100 || apuGenVoltage >= 120)) && 'Amber'}`}
                >
                    APU GEN
                </text>

                {currentApuGenState === apuGenState.OFF
                && <text x={50} y={70} className="Center">OFF</text>}

                {currentApuGenState === apuGenState.ON
                && (
                    <>
                        <SvgGroup x={60} y={55}>
                            {/* FIXME - in amber when the generator is within overload; double check overload range, for now its > 100 */}
                            <text
                                x={0}
                                y={0}
                                className={`Right FontLarger ${apuGenLoad > 100 ? 'Amber' : 'Green'}`}
                            >
                                {apuGenLoad.toFixed()}
                            </text>
                            <text
                                x={0}
                                y={25}
                                className={`Right FontLarger ${(apuGenVoltage > 110 && apuGenVoltage < 120) ? 'Green' : 'Amber'}`}
                            >
                                {apuGenVoltage.toFixed()}
                            </text>
                            <text
                                x={0}
                                y={50}
                                className={`Right FontLarger ${(apuGenFreq > 390 && apuGenFreq < 410) ? 'Green' : 'Amber'}`}
                            >
                                {apuGenFreq.toFixed()}
                            </text>
                        </SvgGroup>
                        <SvgGroup x={70} y={55}>
                            <text x={0} y={0} className="Cyan">%</text>
                            <text x={0} y={25} className="Cyan">V</text>
                            <text x={0} y={50} className="Cyan">HZ</text>
                        </SvgGroup>
                    </>
                )}
            </SvgGroup>

            {/* Bleed */}
            {/* TODO: There should be XX in amber in center of circle if air valve status info is not available */}
            <SvgGroup x={420} y={153}>
                <rect className="Box" width={100} height={57} />

                <text x={50} y={22} className="Center FontNormal">BLEED</text>

                <text x={44} y={48} className="Green FontLarger Right">{displayedBleedPressure}</text>
                <text x={90} y={48} className="Cyan FontNormal Right">PSI</text>

                <line className="Line Green" x1={50} y1={-1} x2={50} y2={-22} />
                <circle className="Circle" cx={50} r={18} cy={-40} />

                <line
                    className={`Line ${(!apuBleedOpen && apuBleedPbOnConfirmed) ? 'Amber' : 'Green'}`}
                    x1={apuBleedOpen ? 50 : 32}
                    y1={apuBleedOpen ? -58 : -40}
                    x2={apuBleedOpen ? 50 : 68}
                    y2={apuBleedOpen ? -22 : -40}
                />
                {
                    apuBleedOpen && (
                        <>
                            <line className="Line Green" x1={50} y1={-57} x2={50} y2={-72} />
                            <polygon className="Circle" points="40,-72 50,-92 60,-72" />
                        </>
                    )
                }
            </SvgGroup>

            {/* Separation Bar */}
            <SvgGroup x={83} y={257}>
                <line className="Line Grey" x1={0} y1={0} x2={0} y2={26} />
                <line className="Line Grey" x1={-1} y1={0} x2={456} y2={0} />
                <line className="Line Grey" x1={455} y1={0} x2={455} y2={26} />
            </SvgGroup>

            {/* Memos */}
            <SvgGroup x={370} y={335}>
                { lowFuelPressure
                && <text className="Amber FontNormal" x={0} y={0}>FUEL LO PR</text> }

                { apuFlapOpenPercentage === 100
                 && <text className={`Green FontNormal ${isIntakeIndicationFlashing && 'FillPulse'}`} x={0} y={60}>FLAP OPEN</text> }

                {/* FIXME: APU LOW OIL IS CURRENTLY NOT A VALUE */}
                {/* { apuLowOil
                 && <text className="Green FillPulse" x={0} y={120}>LOW OIL LEVEL</text> } */}
            </SvgGroup>

            {/* APU N Gauge */}
            <SvgGroup x={145} y={300}>
                {/* Mark Annotations */}
                <text x={-23} y={62} className="FontSmall White">0</text>
                <text x={30} y={30} className="FontSmall White">10</text>

                <SvgGroup x={0} y={0} rotation={-22.5}>
                    {/* 0 */}
                    <Needle
                        x={-1}
                        y={50}
                        length={50}
                        scaleMax={120}
                        value={0}
                        className="GaugeMarking"
                        dashOffset={-44}
                    />
                    {/* 50 */}
                    <Needle
                        x={-1}
                        y={50}
                        length={50}
                        scaleMax={120}
                        value={50}
                        className="GaugeMarking"
                        dashOffset={-44}
                    />
                    {/* 100 */}
                    <Needle
                        x={-1}
                        y={50}
                        length={50}
                        scaleMax={120}
                        value={100}
                        className="GaugeMarking"
                        dashOffset={-44}
                    />
                    {/* 102 AMBER */}
                    <Needle
                        x={-1}
                        y={50}
                        length={60}
                        scaleMax={120}
                        value={100}
                        className="NoFill AmberHeavy"
                        dashOffset={-50}
                    />

                    <Arc x={0} y={50} radius={50} toValue={120} scaleMax={120} className="Line Red NoFill" />
                    <Arc x={0} y={50} radius={50} toValue={107} scaleMax={120} className="Line White NoFill" />

                    {!apuN.isNoComputedData()
                && (
                    <Needle
                        x={0}
                        y={50}
                        length={55}
                        scaleMax={120}
                        value={apuN.value}
                        className={`Line ${apuNIndicationColor}`}
                        dashOffset={-10}
                        strokeWidth={3}
                    />
                )}
                </SvgGroup>

                <SvgGroup x={100} y={13}>
                    <text x={0} y={0} className="White Center">N</text>
                    <text x={0} y={30} className="Cyan Center FontSmall">%</text>
                </SvgGroup>

                <text
                    x={60}
                    y={65}
                    className={`FontLarger Right ${apuN.isNoComputedData() ? 'Amber' : apuNIndicationColor}`}
                >
                    {apuN.isNoComputedData() ? 'XX' : apuN.value.toFixed()}
                </text>
            </SvgGroup>

            {/* EGT Gauge */}
            <SvgGroup x={145} y={410}>
                {/* Mark Annotations */}
                <text x={-33} y={57} className="FontSmall White">3</text>
                <text x={-4} y={22} className="FontSmall White">7</text>
                <text x={24} y={30} className="FontSmall White">10</text>

                <SvgGroup x={0} y={0} rotation={-15}>
                    {/* 300 */}
                    <Needle
                        x={-1}
                        y={50}
                        length={50}
                        scaleMin={300}
                        scaleMax={1100}
                        value={300}
                        className="GaugeMarking"
                        dashOffset={-44}
                    />
                    {/* 700 */}
                    <Needle
                        x={-1}
                        y={50}
                        length={50}
                        scaleMin={300}
                        scaleMax={1100}
                        value={700}
                        className="GaugeMarking"
                        dashOffset={-44}
                    />
                    {/* 1000 */}
                    <Needle
                        x={-1}
                        y={50}
                        length={50}
                        scaleMin={300}
                        scaleMax={1100}
                        value={1000}
                        className="GaugeMarking"
                        dashOffset={-44}
                    />
                    {/* AMBER BAR */}
                    {!(apuEgtCaution.isNoComputedData() || apuEgtWarning.isNoComputedData())
                    && (
                        <Needle
                            x={-1}
                            y={50}
                            length={60}
                            scaleMin={300}
                            scaleMax={1100}
                            value={apuEgtWarning.value - 33}
                            className="NoFill AmberHeavy"
                            dashOffset={-50}
                        />
                    )}

                    <Arc x={0} y={50} radius={50} toValue={1100} scaleMin={300} scaleMax={1100} className="Line Red NoFill" />
                    <Arc x={0} y={50} radius={50} toValue={apuEgtWarning.value} scaleMin={300} scaleMax={1100} className="Line White NoFill" />

                    {!apuEgt.isNoComputedData()
                && (
                    <Needle
                        x={0}
                        y={50}
                        length={55}
                        scaleMin={300}
                        scaleMax={1100}
                        value={apuEgt.value < 300 ? 300 : apuEgt.value}
                        className={`Line ${apuEgtIndicationColor === 'Pulse' ? 'LinePulse' : apuEgtIndicationColor}`}
                        dashOffset={-10}
                        strokeWidth={3}
                    />
                )}
                </SvgGroup>

                <SvgGroup x={100} y={13}>
                    <text x={0} y={0} className="White Center">EGT</text>
                    <text x={0} y={30} className="Cyan Center FontSmall">&deg;C</text>
                </SvgGroup>

                <text
                    x={60}
                    y={65}
                    // eslint-disable-next-line no-nested-ternary
                    className={`FontLarger Right ${apuEgt.isNoComputedData() ? 'Amber' : apuEgtIndicationColor === 'Pulse' ? 'FillPulse' : apuEgtIndicationColor}`}
                >
                    {apuEgt.isNoComputedData() ? 'XX' : displayedEgtValue}
                </text>
            </SvgGroup>
        </EcamPage>
    );
};

render(<ApuPage />);
