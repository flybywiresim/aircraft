import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { ComponentPositionProps } from '@instruments/common/ComponentPosition';
import { Layer } from '@instruments/common/utils';
import { useArinc429Var } from '@instruments/common/arinc429';
import { GaugeComponent, GaugeMarkerComponent } from '@instruments/common/gauges';
import { PageTitle } from './Generic/PageTitle';

export const ApuPage = () => {
    const [apuAvail] = useSimVar('L:A32NX_OVHD_APU_START_PB_IS_AVAILABLE', 'Bool', 1000);

    return (
        <>
            <PageTitle showMore={false} x={5} y={28}>APU</PageTitle>
            {/* APU Avail */}
            {apuAvail
            && (
                <text x={384} y={55} className="Green Huge MiddleAlign">AVAIL</text>
            )}

            <ApuGen x={105} y={107} />

            <ApuBleed x={550} y={160} />

            {/* Separation Bar */}
            <Layer x={30} y={252}>
                <rect x={0} y={0} rx={1.5} width={4} height={34} className="White Fill" />
                <rect x={0} y={0} rx={1.5} width={710} height={4} className="White Fill" />
                <rect x={707} y={0} rx={1.5} width={4} height={34} className="White Fill" />
            </Layer>

            <NGauge x={155} y={320} />

            <EgtGauge x={155} y={525} />

            <ApuMemos x={480} y={400} />
        </>
    );
};

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
            <Layer x={x} y={y}>
                {(apuContactorClosed && (busTieContactor1Closed || busTieContactor2Closed))
                && (
                    <Layer x={42} y={-28}>
                        <polygon points="0,20 8,5 16,20" className="Line" />
                    </Layer>
                )}
                {!inModeStandby
                && <rect className="Box" width={100} height={111} />}

                <text
                    x={50}
                    y={20}
                    className={`MiddleAlign XSmall
                    // eslint-disable-next-line no-mixed-operators
                    ${(!inModeStandby && (!(apuGenPotentialNormalRange && apuGenLoadNormalRange && apuGenFreqNormalRange))
                        || inModeOff) && ' Amber'}`}
                >
                    APU GEN
                </text>

                {inModeOff
                && <text x={50} y={70} className="MiddleAlign XSmall White">OFF</text>}

                {inModeOn
                && (
                    <>
                        <Layer x={60} y={55}>
                            {/* FBW-31-08 */}
                            <text
                                x={0}
                                y={0}
                                className={`EndAlign Large ${apuGenLoadNormalRange ? 'Green' : 'Amber'}`}
                            >
                                {apuGenLoad.toFixed()}
                            </text>
                            <text
                                x={0}
                                y={25}
                                className={`EndAlign Large ${apuGenPotentialNormalRange ? 'Green' : 'Amber'}`}
                            >
                                {apuGenVoltage.toFixed()}
                            </text>
                            <text
                                x={0}
                                y={50}
                                className={`EndAlign Large ${apuGenFreqNormalRange ? 'Green' : 'Amber'}`}
                            >
                                {apuGenFreq.toFixed()}
                            </text>
                        </Layer>
                        <Layer x={70} y={55}>
                            <text x={0} y={0} className="Cyan XSmall">%</text>
                            <text x={0} y={25} className="Cyan XSmall">V</text>
                            <text x={0} y={50} className="Cyan XSmall">HZ</text>
                        </Layer>
                    </>
                )}
            </Layer>
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
            {/* FBW-31-08 */}
            <Layer x={x} y={y}>
                <Valve x={55} y={0} open={apuBleedOpen} amber={!apuBleedOpen && apuBleedPbOnConfirmed} showFlowArrow={apuBleedOpen} entryPipeLength={15} />

                <rect className="Box" width={110} height={63} />

                <text x={55} y={16} className="MiddleAlign White Small">BLEED</text>

                <text
                    x={49}
                    y={56}
                    className={`VLarge EndAlign ${adir1ModeSelectorKnob === 1 ? 'Green' : 'AmberFill'}`}
                >
                    {adir1ModeSelectorKnob === 1 ? displayedBleedPressure : 'XX'}
                </text>
                <text x={95} y={56} className="Cyan Small EndAlign">PSI</text>
            </Layer>
        </>
    );
};

// TODO: Include this in the common folder

interface ValveProps {
    x: number;
    y: number;
    open?: boolean;
    amber?: boolean
    showFlowArrow?: boolean;
    entryPipeLength?: number;
}

const Valve = ({ x, y, open, amber, showFlowArrow, entryPipeLength = 21 }: ValveProps) => {
    const baseYOffset = -entryPipeLength;

    return (
        <Layer x={x} y={y}>
            <line className="Line Green" x1={0} y1={-1} x2={0} y2={baseYOffset - 1} />
            <circle className={`Line ${amber ? 'Amber' : 'Green'}`} cx={0} r={18} cy={baseYOffset - 20} />

            <line
                className={`Line ${amber ? 'Amber' : 'Green'}`}
                x1={open ? 0 : -18}
                y1={open ? baseYOffset - 38 : baseYOffset - 20}
                x2={open ? 0 : 18}
                y2={open ? baseYOffset - 2 : baseYOffset - 20}
            />
            {/* 15 in length */}
            {showFlowArrow
            && (
                <>
                    <line className="Line Green" x1={0} y1={baseYOffset - 39} x2={0} y2={baseYOffset - 54} />
                    <polygon className="Line Green" points={`-10, ${baseYOffset - 51} 0,${baseYOffset - 65} 10, ${baseYOffset - 51}`} />
                </>
            )}
        </Layer>
    );
};

const NGauge = ({ x, y } : ComponentPositionProps) => {
    const apuN = useArinc429Var('L:A32NX_APU_N', 100);
    let apuNIndicationColor;
    if (apuN.value < 102) {
        apuNIndicationColor = 'Green';
    } else if (apuN.value < 107) {
        apuNIndicationColor = 'Amber';
    } else {
        apuNIndicationColor = 'Red';
    }

    const GAUGE_MIN = 0;
    const GAUGE_MAX = 120;
    const GAUGE_MARKING_MAX = GAUGE_MAX / 10;
    const GAUGE_RADIUS = 64;
    const GAUGE_START = 225;
    const GAUGE_END = 45;

    const gaugeMarkerClassName = 'GaugeText ThickLine';

    return (
        <>
            <Layer x={x} y={y}>
                <Layer x={0} y={0}>
                    <GaugeComponent x={0} y={50} radius={GAUGE_RADIUS} startAngle={GAUGE_START} endAngle={GAUGE_END} visible className="Line White NoFill ThickLine">
                        <GaugeComponent x={0} y={50} radius={GAUGE_RADIUS - 1} startAngle={GAUGE_END - 23} endAngle={GAUGE_END} visible className="Line VThickLine Red NoFill">
                            {/* 0 */}
                            <GaugeMarkerComponent
                                x={-1}
                                y={50}
                                min={GAUGE_MIN}
                                max={GAUGE_MARKING_MAX}
                                value={0}
                                radius={GAUGE_RADIUS}
                                startAngle={GAUGE_START}
                                endAngle={GAUGE_END}
                                className={gaugeMarkerClassName}
                                textNudgeX={3}
                                textNudgeY={-8}
                                showValue
                                bold
                            />
                            {/* 50 */}
                            <GaugeMarkerComponent
                                x={-1}
                                y={50}
                                min={GAUGE_MIN}
                                max={GAUGE_MARKING_MAX}
                                value={5}
                                radius={GAUGE_RADIUS}
                                startAngle={GAUGE_START}
                                endAngle={GAUGE_END}
                                className={gaugeMarkerClassName}
                                bold
                            />
                            {/* 100 */}
                            <GaugeMarkerComponent
                                x={-1}
                                y={50}
                                min={GAUGE_MIN}
                                max={GAUGE_MARKING_MAX}
                                value={10}
                                radius={GAUGE_RADIUS}
                                startAngle={GAUGE_START}
                                endAngle={GAUGE_END}
                                className={gaugeMarkerClassName}
                                showValue
                                textNudgeY={10}
                                bold
                            />
                            {/* 102 AMBER */}
                            <GaugeMarkerComponent
                                x={-1}
                                y={50}
                                min={GAUGE_MIN}
                                max={GAUGE_MAX}
                                value={102}
                                radius={GAUGE_RADIUS}
                                startAngle={GAUGE_START}
                                multiplierOuter={1.2}
                                endAngle={GAUGE_END}
                                className="NoFill AmberHeavy"
                                outer
                            />
                            {apuN.isNormalOperation()
                            && (
                                <GaugeMarkerComponent
                                    x={0}
                                    y={50}
                                    min={GAUGE_MIN}
                                    radius={GAUGE_RADIUS}
                                    max={GAUGE_MAX}
                                    startAngle={GAUGE_START}
                                    endAngle={GAUGE_END}
                                    value={Number.parseFloat(apuN.value.toFixed())}
                                    className={`ThickLine ${apuNIndicationColor}`}
                                    indicator
                                />
                            )}
                        </GaugeComponent>
                    </GaugeComponent>
                </Layer>

                <Layer x={100} y={65}>
                    <text x={0} y={0} className="White MiddleAlign VLarge">N1</text>
                    <text x={0} y={35} className="Cyan MiddleAlign XSmall">%</text>
                    <text x={0} y={70} className="White MiddleAlign VLarge">N2</text>
                </Layer>

                <text
                    x={75}
                    y={70}
                    className={`Huge EndAlign ${apuN.isNormalOperation() ? apuNIndicationColor : 'AmberFill'}`}
                >
                    {apuN.isNormalOperation() ? apuN.value.toFixed() : 'XX'}
                </text>
                <text
                    x={75}
                    y={140}
                    className={`Huge EndAlign ${apuN.isNormalOperation() ? apuNIndicationColor : 'AmberFill'}`}
                >
                    {apuN.isNormalOperation() ? apuN.value.toFixed() : 'XX'}
                </text>
            </Layer>
        </>
    );
};

const EgtGauge = ({ x, y } : ComponentPositionProps) => {
    const apuEgt = useArinc429Var('L:A32NX_APU_EGT', 100);
    const displayedEgtValue = Math.round(apuEgt.value / 5) * 5; // APU Exhaust Gas Temperature is shown in steps of five.

    const apuEgtCaution = useArinc429Var('L:A32NX_APU_EGT_CAUTION', 500);
    const apuEgtWarning = useArinc429Var('L:A32NX_APU_EGT_WARNING', 500);

    const redLineShown = apuEgtCaution.isNormalOperation() && apuEgtWarning.isNormalOperation();

    // FBW-31-05
    let egtNeedleStyle: string;

    if (apuEgt.value > apuEgtWarning.value) {
        egtNeedleStyle = 'Red';
    } else if (apuEgt.value > apuEgtCaution.value) {
        egtNeedleStyle = 'Amber';
    } else {
        egtNeedleStyle = 'Green';
    }

    let egtNumericalStyle: string;

    if (!apuEgt.isNormalOperation()) {
        egtNumericalStyle = 'AmberFill';
    } else {
        egtNumericalStyle = egtNeedleStyle;
    }

    const GAUGE_MIN = 0;
    const GAUGE_MAX = 950;
    const GAUGE_MARKING_MAX = GAUGE_MAX / 100;

    const GAUGE_RADIUS = 64;
    const GAUGE_START = 220;
    const GAUGE_END = 120;

    const GAUGE_MARKING_START = GAUGE_START;

    const gaugeMarkerClassName = 'GaugeText ThickLine';

    return (
        <>
            <Layer x={x} y={y}>
                <GaugeComponent x={0} y={50} radius={GAUGE_RADIUS} startAngle={GAUGE_START - 10} endAngle={GAUGE_END} visible className="Line White NoFill ThickLine">
                    {/* 000 */}
                    <GaugeMarkerComponent
                        x={-1}
                        y={50}
                        min={GAUGE_MIN}
                        max={GAUGE_MARKING_MAX}
                        value={0}
                        radius={GAUGE_RADIUS}
                        startAngle={GAUGE_MARKING_START}
                        endAngle={GAUGE_END}
                        className={gaugeMarkerClassName}
                        textNudgeX={8}
                        textNudgeY={-8}
                        showValue
                        bold
                    />
                    {/* 400 */}
                    <GaugeMarkerComponent
                        x={-1}
                        y={50}
                        min={GAUGE_MIN}
                        max={GAUGE_MARKING_MAX}
                        value={4}
                        radius={GAUGE_RADIUS}
                        startAngle={GAUGE_MARKING_START}
                        endAngle={GAUGE_END}
                        className={gaugeMarkerClassName}
                        textNudgeX={3}
                        textNudgeY={-8}
                        bold
                    />
                    {/* 500 */}
                    <GaugeMarkerComponent
                        x={-1}
                        y={50}
                        min={GAUGE_MIN}
                        max={GAUGE_MARKING_MAX}
                        value={5}
                        radius={GAUGE_RADIUS}
                        startAngle={GAUGE_MARKING_START}
                        endAngle={GAUGE_END}
                        className={gaugeMarkerClassName}
                        textNudgeX={6}
                        textNudgeY={15}
                        showValue
                        bold
                    />
                    {/* 600 */}
                    <GaugeMarkerComponent
                        x={-1}
                        y={50}
                        min={GAUGE_MIN}
                        max={GAUGE_MARKING_MAX}
                        value={6}
                        radius={GAUGE_RADIUS}
                        startAngle={GAUGE_MARKING_START}
                        endAngle={GAUGE_END}
                        className={gaugeMarkerClassName}
                        textNudgeX={3}
                        textNudgeY={-8}
                        bold
                    />
                    {/* 700 */}
                    <GaugeMarkerComponent
                        x={-1}
                        y={50}
                        min={GAUGE_MIN}
                        max={GAUGE_MARKING_MAX}
                        value={7}
                        radius={GAUGE_RADIUS}
                        startAngle={GAUGE_MARKING_START}
                        endAngle={GAUGE_END}
                        className={gaugeMarkerClassName}
                        textNudgeX={-6}
                        textNudgeY={14}
                        showValue
                        bold
                    />
                    {/* 800 */}
                    <GaugeMarkerComponent
                        x={-1}
                        y={50}
                        min={GAUGE_MIN}
                        max={GAUGE_MARKING_MAX}
                        value={8}
                        radius={GAUGE_RADIUS}
                        startAngle={GAUGE_MARKING_START}
                        endAngle={GAUGE_END}
                        className={gaugeMarkerClassName}
                        textNudgeX={-12}
                        textNudgeY={3}
                        bold
                    />
                    {/* 900 */}
                    <GaugeMarkerComponent
                        x={-1}
                        y={50}
                        min={GAUGE_MIN}
                        max={GAUGE_MARKING_MAX}
                        value={9}
                        radius={GAUGE_RADIUS}
                        startAngle={GAUGE_MARKING_START}
                        endAngle={GAUGE_END}
                        className={gaugeMarkerClassName}
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
                            min={GAUGE_MIN}
                            max={GAUGE_MAX}
                            value={apuEgtWarning.value - 33}
                            radius={GAUGE_RADIUS}
                            startAngle={GAUGE_MARKING_START}
                            multiplierOuter={1.2}
                            endAngle={GAUGE_END}
                            className="NoFill AmberHeavy"
                            outer
                        />
                    )}

                    <GaugeComponent
                        x={0}
                        y={50}
                        radius={GAUGE_RADIUS}
                        startAngle={GAUGE_MARKING_START}
                        endAngle={GAUGE_END}
                        visible={redLineShown}
                        className="Line Red NoFill"
                    />
                    <GaugeComponent
                        x={0}
                        y={50}
                        radius={GAUGE_RADIUS}
                        startAngle={GAUGE_MARKING_START}
                        endAngle={240 + (((Math.max(300, apuEgtWarning.value - 300)) / 800) * 210)}
                        visible={redLineShown}
                        className="Line White NoFill"
                    />

                    {apuEgt.isNormalOperation()
                    && (
                        <GaugeMarkerComponent
                            x={0}
                            y={50}
                            min={GAUGE_MIN}
                            max={GAUGE_MAX}
                            radius={GAUGE_RADIUS}
                            startAngle={GAUGE_MARKING_START}
                            endAngle={GAUGE_END}
                            value={apuEgt.value < 300 ? 300 : displayedEgtValue}
                            className={`ThickLine ${egtNeedleStyle === 'Pulse' ? 'LinePulse' : egtNeedleStyle}`}
                            indicator
                        />
                    )}
                </GaugeComponent>

                <Layer x={100} y={63}>
                    <text x={0} y={0} className="White MiddleAlign VLarge">EGT</text>
                    <text x={-2} y={35} className="Cyan MiddleAlign XSmall" style={{ letterSpacing: -2 }}>&deg;C</text>
                </Layer>

                <text
                    x={70}
                    y={115}
                    className={`Huge EndAlign ${egtNumericalStyle}`}
                >
                    {apuEgt.isNormalOperation() ? displayedEgtValue : 'XX' }
                </text>
            </Layer>
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
            <Layer x={x} y={y}>
                {lowFuelPressure.value
                && <text className="AmberFill XLarge" x={0} y={0}>FUEL PRESS LO</text>}

                {apuFlapOpenPercentage === 100
                && <text className={`Green XLarge ${isIntakeIndicationFlashing && 'FillPulse'}`} x={0} y={70}>FLAP OPEN</text>}
                {/* FBW-31-07 */}
            </Layer>
        </>
    );
};
