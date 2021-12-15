import React, { useEffect, useState } from 'react';
import { useArinc429Var } from '@instruments/common/arinc429';
import { render } from '@instruments/common/index';
import { setIsEcamPage } from '@instruments/common/defaults';
import { useSimVar } from '@instruments/common/simVars';
import { GaugeComponent, GaugeMarkerComponent } from '@instruments/common/gauges';
import { PageTitle } from '../../Common/PageTitle';

import './Apu.scss';
import { EcamPage } from '../../Common/EcamPage';
import { SvgGroup } from '../../Common/SvgGroup';

setIsEcamPage('apu_page');

export const ApuPage = () => {
    const [apuAvail] = useSimVar('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'Bool', 1000);

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

            <ApuGen x={105} y={100} />

            <ApuBleed x={420} y={153} />

            {/* Separation Bar */}
            <SvgGroup x={83} y={252}>
                <line className="Line Grey" x1={0} y1={0} x2={0} y2={26} />
                <line className="Line Grey" x1={-1} y1={0} x2={456} y2={0} />
                <line className="Line Grey" x1={455} y1={0} x2={455} y2={26} />
            </SvgGroup>

            <NGauge x={155} y={295} />

            <EgtGauge x={155} y={410} />

            <ApuMemos x={370} y={335} />
        </EcamPage>
    );
};

type ComponentPositionProps = {
    x: number,
    y: number,
}

const ApuGen = ({ x, y } : ComponentPositionProps) => {
    const [apuContactorClosed] = useSimVar('L:A32NX_ELEC_CONTACTOR_3XS_IS_CLOSED', 'Bool', 1000);
    const [busTieContactor1Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_11XU1_IS_CLOSED', 'Bool');
    const [busTieContactor2Closed] = useSimVar('L:A32NX_ELEC_CONTACTOR_11XU2_IS_CLOSED', 'Bool');

    const [apuGenLoad] = useSimVar('L:A32NX_ELEC_APU_GEN_1_LOAD', 'Percent', 500);
    const [apuGenLoadNormalRange] = useSimVar('L:A32NX_ELEC_APU_GEN_1_LOAD_NORMAL', 'Bool', 750);

    const [apuGenVoltage] = useSimVar('L:A32NX_ELEC_APU_GEN_1_POTENTIAL', 'Volts', 500);
    const [apuGenPotentialNormalRange] = useSimVar('L:A32NX_ELEC_APU_GEN_1_POTENTIAL_NORMAL', 'Bool', 750);

    const [apuGenFreq] = useSimVar('L:A32NX_ELEC_APU_GEN_1_FREQUENCY', 'Hertz', 500);
    const [apuGenFreqNormalRange] = useSimVar('L:A32NX_ELEC_APU_GEN_1_FREQUENCY_NORMAL', 'Bool', 750);

    const [apuMasterPbOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 500);
    const [apuGenPbOn] = useSimVar('A:APU GENERATOR SWITCH', 'Boolean', 750);
    const [apuAvail] = useSimVar('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'Bool', 1000);

    // FBW-31-06
    const inModeStandby = !apuMasterPbOn && !apuAvail;
    const inModeOff = !inModeStandby && !apuGenPbOn;
    const inModeOn = !inModeStandby && !inModeOff;

    return (
        <>
            <SvgGroup x={x} y={y}>
                {(apuContactorClosed && (busTieContactor1Closed || busTieContactor2Closed))
                    && (
                        <SvgGroup x={42} y={-28}>
                            <polygon points="0,20 8,5 16,20" className="Circle" />
                        </SvgGroup>
                    )}
                {!inModeStandby
                && <rect className="Box" width={100} height={111} />}

                <text
                    x={50}
                    y={20}
                    className={`Center FontNormal
                    ${(!inModeStandby && (!(apuGenPotentialNormalRange && apuGenLoadNormalRange && apuGenFreqNormalRange))
                        || inModeOff) && ' Amber'}`}
                >
                    APU GEN
                </text>

                {inModeOff
                    && <text x={50} y={70} className="Center FontNormal">OFF</text>}

                {inModeOn
                    && (
                        <>
                            <SvgGroup x={60} y={55}>
                                {/* FBW-31-07 */}
                                <text
                                    x={0}
                                    y={0}
                                    className={`Right FontLarger ${apuGenLoadNormalRange ? 'Green' : 'Amber'}`}
                                >
                                    {apuGenLoad.toFixed()}
                                </text>
                                <text
                                    x={0}
                                    y={25}
                                    className={`Right FontLarger ${apuGenPotentialNormalRange ? 'Green' : 'Amber'}`}
                                >
                                    {apuGenVoltage.toFixed()}
                                </text>
                                <text
                                    x={0}
                                    y={50}
                                    className={`Right FontLarger ${apuGenFreqNormalRange ? 'Green' : 'Amber'}`}
                                >
                                    {apuGenFreq.toFixed()}
                                </text>
                            </SvgGroup>
                            <SvgGroup x={70} y={55}>
                                <text x={0} y={0} className="Cyan FontNormal">%</text>
                                <text x={0} y={25} className="Cyan FontNormal">V</text>
                                <text x={0} y={50} className="Cyan FontNormal">HZ</text>
                            </SvgGroup>
                        </>
                    )}
            </SvgGroup>
        </>
    );
};

const ApuBleed = ({ x, y } : ComponentPositionProps) => {
    const [apuBleedPbOn] = useSimVar('L:A32NX_OVHD_PNEU_APU_BLEED_PB_IS_ON', 'Bool', 1000);
    const [apuBleedPbOnConfirmed, setApuBleedPbOnConfirmed] = useState(false);
    const [apuBleedOpen] = useSimVar('L:A32NX_APU_BLEED_AIR_VALVE_OPEN', 'Bool', 1000);

    const [apuBleedPressure] = useSimVar('L:APU_BLEED_PRESSURE', 'PSI', 1000);
    const displayedBleedPressure = Math.round(apuBleedPressure / 2) * 2; // APU bleed pressure is shown in steps of two.

    const [adir1ModeSelectorKnob] = useSimVar('L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB', 'Enum');

    useEffect(() => {
        if (apuBleedPbOn) {
            const timeout = setTimeout(() => {
                setApuBleedPbOnConfirmed(true);
            }, 10_000);
            return () => clearTimeout(timeout);
        }
        setApuBleedPbOnConfirmed(false);

        return () => {};
    }, [apuBleedPbOn]);

    return (
        <>
            {/* FBW-31-07 */}
            <SvgGroup x={x} y={y}>
                <rect className="Box" width={100} height={57} />

                <text x={50} y={22} className="Center FontNormal">BLEED</text>

                <text
                    x={44}
                    y={48}
                    className={`FontLarger Right ${adir1ModeSelectorKnob === 1 ? 'Green' : 'Amber'}`}
                >
                    {adir1ModeSelectorKnob === 1 ? displayedBleedPressure : 'XX'}
                </text>
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
                {apuBleedOpen && (
                    <>
                        <line className="Line Green" x1={50} y1={-57} x2={50} y2={-72} />
                        <polygon className="Circle" points="40,-72 50,-92 60,-72" />
                    </>
                )}
            </SvgGroup>
        </>
    );
};

const NGauge = ({ x, y } : ComponentPositionProps) => {
    const apuN = useArinc429Var('L:A32NX_APU_N', 100);
    const [apuNIndicationColor, setApuIndicationColor] = useState('Green');

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

    return (
        <>
            <SvgGroup x={x} y={y}>
                <SvgGroup x={0} y={0}>
                    <GaugeComponent x={0} y={50} radius={50} startAngle={240} endAngle={60} visible className="Line White NoFill">
                        <GaugeComponent x={0} y={50} radius={50} startAngle={40} endAngle={60} visible className="Line Red NoFill">
                            {/* 0 */}
                            <GaugeMarkerComponent
                                x={-1}
                                y={50}
                                min={0}
                                max={120}
                                value={0}
                                radius={50}
                                startAngle={240}
                                endAngle={60}
                                className="GaugeText"
                                textNudgeX={3}
                                textNudgeY={-8}
                                showValue
                                bold
                            />
                            {/* 50 */}
                            <GaugeMarkerComponent
                                x={-1}
                                y={50}
                                min={0}
                                max={120}
                                value={50}
                                radius={50}
                                startAngle={240}
                                endAngle={60}
                                className="GaugeText"
                                bold
                            />
                            {/* 100 */}
                            <GaugeMarkerComponent
                                x={-1}
                                y={50}
                                min={0}
                                max={12}
                                value={10}
                                radius={50}
                                startAngle={240}
                                endAngle={60}
                                className="GaugeText"
                                showValue
                                textNudgeY={10}
                                bold
                            />
                            {/* 102 AMBER */}
                            <GaugeMarkerComponent
                                x={-1}
                                y={50}
                                min={0}
                                max={120}
                                value={102}
                                radius={50}
                                startAngle={240}
                                multiplierOuter={1.2}
                                endAngle={60}
                                className="NoFill AmberHeavy"
                                outer
                            />
                            {apuN.isNormalOperation()
                        && (
                            <GaugeMarkerComponent
                                x={0}
                                y={50}
                                min={0}
                                radius={50}
                                max={120}
                                startAngle={240}
                                endAngle={60}
                                value={Number.parseFloat(apuN.value.toFixed())}
                                className={`Line ${apuNIndicationColor}`}
                                indicator
                            />
                        )}
                        </GaugeComponent>
                    </GaugeComponent>
                </SvgGroup>

                <SvgGroup x={80} y={13}>
                    <text x={0} y={0} className="White Center FontNormal">N</text>
                    <text x={0} y={30} className="Cyan Center FontNormal">%</text>
                </SvgGroup>

                <text
                    x={10}
                    y={80}
                    className={`FontLarger Left ${apuN.isNormalOperation() ? apuNIndicationColor : 'Amber'}`}
                >
                    {apuN.isNormalOperation() ? apuN.value.toFixed() : 'XX'}
                </text>
            </SvgGroup>
        </>
    );
};

const EgtGauge = ({ x, y } : ComponentPositionProps) => {
    const apuEgt = useArinc429Var('L:A32NX_APU_EGT', 100);
    const displayedEgtValue = Math.round(apuEgt.value / 5) * 5; // APU Exhaust Gas Temperature is shown in steps of five.

    const apuEgtCaution = useArinc429Var('L:A32NX_APU_EGT_CAUTION', 500);
    const apuEgtWarning = useArinc429Var('L:A32NX_APU_EGT_WARNING', 500);

    const [apuEgtIndicationColor, setApuEgtIndicationColor] = useState('Green');

    const redLineShown = apuEgtCaution.isNormalOperation() && apuEgtWarning.isNormalOperation();

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
        // FBW-31-05
    }, [apuEgt, apuEgtCaution, apuEgtWarning]);

    let egtValueStyle;

    if (!apuEgt.isNormalOperation()) {
        egtValueStyle = 'Amber';
    } else if (apuEgtIndicationColor === 'Pulse') {
        egtValueStyle = 'FillPulse';
    } else {
        egtValueStyle = apuEgtIndicationColor;
    }

    return (
        <>
            <SvgGroup x={x} y={y}>
                <GaugeComponent x={0} y={50} radius={50} startAngle={240} endAngle={90} visible className="Line White NoFill">
                    {/* 300 */}
                    <GaugeMarkerComponent
                        x={-1}
                        y={50}
                        min={3}
                        max={11}
                        value={3}
                        radius={50}
                        startAngle={240}
                        endAngle={90}
                        className="GaugeText"
                        textNudgeX={3}
                        textNudgeY={-8}
                        showValue
                        bold
                    />
                    {/* 700 */}
                    <GaugeMarkerComponent
                        x={-1}
                        y={50}
                        min={3}
                        max={11}
                        value={7}
                        radius={50}
                        startAngle={240}
                        endAngle={90}
                        className="GaugeText"
                        textNudgeX={1}
                        textNudgeY={10}
                        showValue
                        bold
                    />
                    {/* 1000 */}
                    <GaugeMarkerComponent
                        x={-1}
                        y={50}
                        min={3}
                        max={11}
                        value={10}
                        radius={50}
                        startAngle={240}
                        endAngle={90}
                        className="GaugeText"
                        textNudgeX={-12}
                        textNudgeY={3}
                        showValue
                        bold
                    />

                    {/* AMBER BAR */}
                    {apuEgt.isNormalOperation() && apuEgtWarning.isNormalOperation()
                        && (
                            <GaugeMarkerComponent
                                x={-1}
                                y={50}
                                min={300}
                                max={1100}
                                value={apuEgtWarning.value - 33}
                                radius={50}
                                startAngle={240}
                                multiplierOuter={1.2}
                                endAngle={90}
                                className="NoFill AmberHeavy"
                                outer
                            />
                        )}

                    <GaugeComponent
                        x={0}
                        y={50}
                        radius={50}
                        startAngle={240}
                        endAngle={90}
                        visible={redLineShown}
                        className="Line Red NoFill"
                    />
                    <GaugeComponent
                        x={0}
                        y={50}
                        radius={50}
                        startAngle={240}
                        endAngle={240 + (((Math.max(300, apuEgtWarning.value - 300)) / 800) * 210)}
                        visible={redLineShown}
                        className="Line White NoFill"
                    />

                    {apuEgt.isNormalOperation()
                        && (
                            <GaugeMarkerComponent
                                x={0}
                                y={50}
                                min={300}
                                max={1100}
                                radius={50}
                                startAngle={240}
                                endAngle={90}
                                value={apuEgt.value < 300 ? 300 : displayedEgtValue}
                                className={`Line ${apuEgtIndicationColor === 'Pulse' ? 'LinePulse' : apuEgtIndicationColor}`}
                                indicator
                            />
                        )}
                </GaugeComponent>

                <SvgGroup x={80} y={13}>
                    <text x={0} y={0} className="White Center FontNormal">EGT</text>
                    <text x={0} y={30} className="Cyan Center FontNormal" style={{ letterSpacing: -2 }}>&deg;C</text>
                </SvgGroup>

                <text
                    x={10}
                    y={80}
                    className={`FontLarger Left ${egtValueStyle}`}
                >
                    {apuEgt.isNormalOperation() ? displayedEgtValue : 'XX' }
                </text>
            </SvgGroup>
        </>
    );
};

const ApuMemos = ({ x, y } : ComponentPositionProps) => {
    const lowFuelPressure = useArinc429Var('L:A32NX_APU_LOW_FUEL_PRESSURE_FAULT', 1000);

    const [apuFlapOpenPercentage] = useSimVar('L:A32NX_APU_FLAP_OPEN_PERCENTAGE', 'Percent', 1000);
    const [isIntakeIndicationFlashing, setIsIntakeIndicationFlashing] = useState(false);

    const [apuMasterPbOn] = useSimVar('L:A32NX_OVHD_APU_MASTER_SW_PB_IS_ON', 'Bool', 1000);

    const intakeApuMismatch = apuFlapOpenPercentage !== 0 && !apuMasterPbOn;

    useEffect(() => {
        if (intakeApuMismatch) {
            const timeout = setTimeout(() => {
                setIsIntakeIndicationFlashing(true);
            }, 180000);
            return () => clearTimeout(timeout);
        }
        if (isIntakeIndicationFlashing) {
            setIsIntakeIndicationFlashing(false);
        }
        return () => {};
    }, [intakeApuMismatch, isIntakeIndicationFlashing]);

    return (
        <>
            {/* Memos */}
            <SvgGroup x={x} y={y}>
                {lowFuelPressure.value
                    && <text className="Amber FontNormal" x={0} y={0}>FUEL LO PR</text>}

                {apuFlapOpenPercentage === 100
                    && <text className={`Green FontNormal ${isIntakeIndicationFlashing && 'FillPulse'}`} x={0} y={60}>FLAP OPEN</text>}
                {/* FBW-31-07 */}
            </SvgGroup>
        </>
    );
};

render(<ApuPage />);
