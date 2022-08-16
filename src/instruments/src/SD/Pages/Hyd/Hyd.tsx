import React, { useEffect, useState } from 'react';
import { render } from '@instruments/common/index';
import { useSimVar } from '@instruments/common/simVars';
import { setIsEcamPage } from '@instruments/common/defaults';
import { SvgGroup } from '../../Common/SvgGroup';
import { ptuArray, levels } from './common';
import { Triangle } from '../../Common/Shapes';

import '../../Common/CommonStyles.scss';

setIsEcamPage('hyd_page');

export const HydPage = () => {
    // The FADEC SimVars include a test for the fire button.
    const [Eng1N2] = useSimVar('TURB ENG N2:1', 'Percent', 1000);
    const [Eng2N2] = useSimVar('TURB ENG N2:2', 'Percent', 1000);

    const [greenPressure] = useSimVar('L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE', 'psi', 500);
    const [yellowPressure] = useSimVar('L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE', 'psi', 500);
    const [bluePressure] = useSimVar('L:A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE', 'psi', 500);

    const [yellowPumpPressurisedSwitch] = useSimVar('L:A32NX_HYD_YELLOW_PUMP_1_SECTION_PRESSURE_SWITCH', 'boolean', 500);

    const [greenPumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO', 'boolean', 500);
    const [yellowPumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO', 'boolean', 500);
    const [bluePumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_EPUMPB_PB_IS_AUTO', 'boolean', 500);
    const [bluePumpActive] = useSimVar('L:A32NX_HYD_BLUE_EPUMP_ACTIVE', 'boolean', 500);

    const [yellowElectricPumpStatus] = useSimVar('L:A32NX_HYD_YELLOW_EPUMP_ACTIVE', 'boolean', 500);

    const [greenFireValve] = useSimVar('L:A32NX_HYD_GREEN_PUMP_1_FIRE_VALVE_OPENED', 'boolean', 500);
    const [yellowFireValve] = useSimVar('L:A32NX_HYD_YELLOW_PUMP_1_FIRE_VALVE_OPENED', 'boolean', 500);

    const [ACBus1IsPowered] = useSimVar('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'bool', 1000);

    const [engine1Running, setEngine1Running] = useState(false);
    const [engine2Running, setEngine2Running] = useState(false);

    useEffect(() => {
        setEngine1Running(Eng1N2 > 15 && greenFireValve);
        setEngine2Running(Eng2N2 > 15 && yellowFireValve);
    }, [Eng1N2, Eng2N2]);

    // PTU variables
    const [ptuAvailable] = useSimVar('L:A32NX_HYD_PTU_VALVE_OPENED', 'boolean', 500);
    const [ptuScenario, setPtuScenario] = useState('normal');

    type PressureChartType = {
        high: string,
        low: string,
        highValue: number,
        lowValue: number,
        ptuScenario: string
    }

    const [pressureChart, setPressureChart] = useState<PressureChartType>({ high: '', low: '', highValue: -1, lowValue: -1, ptuScenario: 'normal' });
    const [ptuActive, setPtuActive] = useState(0);

    function setPressures(clearState = false) {
        if (clearState) {
            setPressureChart({ high: '', low: '', highValue: -1, lowValue: -1, ptuScenario: 'normal' });
        } else if (yellowPressure > greenPressure) {
            setPressureChart({
                high: 'YELLOW',
                low: 'GREEN',
                highValue: yellowPressure,
                lowValue: greenPressure,
                ptuScenario: 'right-to-left',
            });
        } else {
            setPressureChart({
                high: 'GREEN',
                low: 'YELLOW',
                highValue: greenPressure,
                lowValue: yellowPressure,
                ptuScenario: 'left-to-right',
            });
        }
    }

    useEffect(() => {
        setPtuScenario(pressureChart.ptuScenario);
    }, [pressureChart]);

    // PTU logic
    useEffect(() => {
        if (ptuAvailable && !yellowElectricPumpStatus) {
            // The PTU valve has to be open and the yellow electric pump should not be on
            const pressureDifferential = Math.abs(greenPressure - yellowPressure);
            const maxPressure = Math.max(yellowPressure, greenPressure);
            // const minPressure = Math.min(yellowPressure, greenPressure);
            const negativePressureDifferential = pressureChart.low === 'GREEN' ? pressureChart.lowValue - yellowPressure : pressureChart.lowValue - greenPressure;
            if (maxPressure < 1450 || (greenPressure > 2990 && yellowPressure > 2990)) {
                setPressures(true);
                setPtuActive(0);
            } else if (pressureDifferential > 200 && maxPressure > 1450 && !ptuActive) {
                setPtuActive(1);
                setPressures();
            } else if (negativePressureDifferential <= -500 && ptuActive) {
                setPressures(true);
                setPtuActive(0);
            }
        } else if (ptuAvailable && yellowElectricPumpStatus && greenPressure <= 2990) {
            setPtuScenario('right-to-left');
            setPtuActive(1);
        } else {
            setPtuScenario(ptuAvailable ? 'normal' : 'PTU-off');
        }
    }, [greenPressure, yellowPressure, yellowElectricPumpStatus, ptuAvailable]);

    return (
        <>
            {/* This is already in an svg so we should remove the containing one - TODO remove style once we are not in the Asobo ECAM */}
            <svg id="hyd-page" className="ecam-common-styles" viewBox="0 0 768 768" xmlns="http://www.w3.org/2000/svg" style={{ marginTop: '-60px' }}>
                <text className="Title UnderlineWhite" x="351" y="39">HYD</text>
                <text className={`${engine1Running ? '' : 'Amber '}Title`} x="187" y="404">1</text>
                <text className={`${engine2Running ? '' : 'Amber '}Title`} x="562" y="404">2</text>

                <HydSys
                    title="GREEN"
                    pressure={greenPressure}
                    x={136}
                    y={65}
                    fireValve={greenFireValve}
                    pumpPBStatus={greenPumpPBStatus}
                />
                <HydSys
                    title="BLUE"
                    pressure={bluePressure}
                    x={383}
                    y={65}
                    fireValve={false}
                    pumpPBStatus={bluePumpPBStatus && bluePumpActive}
                />
                <HydSys
                    title="YELLOW"
                    pressure={yellowPressure}
                    x={630}
                    y={65}
                    fireValve={yellowFireValve}
                    pumpPBStatus={yellowPumpPBStatus}
                />

                <PTU x={383} y={216} ptuScenario={ptuScenario} />

                <RAT x={372} y={282} />

                <text
                    id="ELEC-centre"
                    className={!ACBus1IsPowered ? 'Large Amber' : 'Large'}
                    x={420}
                    y={384}
                >
                    ELEC
                </text>

                <YellowElecPump pumpPushbuttonOn={yellowElectricPumpStatus} pressure={yellowPressure} enginePumpPressureLowSwitch={!yellowPumpPressurisedSwitch} />

                <text className="Cyan Standard" x={243} y={157}>PSI</text>
                <text className="Cyan Standard" x={481} y={157}>PSI</text>

            </svg>
        </>
    );
};

type RATProps = {
    x: number,
    y: number,
}

const RAT = ({ x, y }: RATProps) => {
    const [RatStowed] = useSimVar('L:A32NX_HYD_RAT_STOW_POSITION', 'percent over 100', 500);

    return (
        <SvgGroup x={x} y={y}>
            <text className="Large" x={-78} y={10}>RAT</text>
            <line className={`GreenLine ${RatStowed > 0.1 ? '' : 'Hide'}`} x1={0} y1={0} x2={10} y2={0} />
            <Triangle x={0} y={0} scale={4 / 3} colour={RatStowed > 0.1 ? 'Green' : 'White'} fill={RatStowed > 0.1 ? 1 : 0} orientation={90} />
        </SvgGroup>
    );
};

type HydSysProps = {
    title: string,
    pressure: number,
    x: number,
    y: number,
    fireValve: boolean,
    pumpPBStatus: boolean,
}

const HydSys = ({ title, pressure, x, y, fireValve, pumpPBStatus } : HydSysProps) => {
    const lowPressure = 1450;
    const pressureNearest50 = Math.round(pressure / 50) * 50 >= 100 ? Math.round(pressure / 50) * 50 : 0;

    const [pumpPressurisedSwitch] = useSimVar(`L:A32NX_HYD_${title}_PUMP_1_SECTION_PRESSURE_SWITCH`, 'boolean', 500);
    const [systemPressurisedSwitch] = useSimVar(`L:A32NX_HYD_${title}_SYSTEM_1_SECTION_PRESSURE_SWITCH`, 'boolean', 500);

    const [reservoirLowQuantitySwitch] = useSimVar(`L:A32NX_HYD_${title}_RESERVOIR_LEVEL_IS_LOW`, 'boolean', 500);

    let hydTitleXPos: number;
    if (title === 'GREEN') {
        hydTitleXPos = -2;
    } else if (title === 'BLUE') {
        hydTitleXPos = 1;
    } else {
        hydTitleXPos = 3;
    }

    return (
        <SvgGroup x={x} y={y}>
            <Triangle x={0} y={0} colour={!systemPressurisedSwitch ? 'Amber' : 'Green'} fill={0} orientation={0} />
            <text className={`Huge Center${!systemPressurisedSwitch ? ' Amber' : ''}`} x={hydTitleXPos} y={50}>{title}</text>
            <text className={`Huge Center ${pressureNearest50 <= lowPressure ? 'Amber' : 'Green'}`} x={1} y={92}>{pressureNearest50}</text>

            <line className={pressureNearest50 <= lowPressure ? 'AmberLine' : 'GreenLine'} x1={0} y1={title === 'BLUE' ? 217 : 151} x2={0} y2={103} />

            <HydEngPump
                system={title}
                pumpOn={pumpPBStatus}
                x={0}
                y={title === 'BLUE' ? 370 : 303}
                pumpSwitchLowPressure={!pumpPressurisedSwitch}
            />
            {
                title !== 'BLUE' && <HydEngValve x={0} y={372} fireValve={fireValve} lowLevel={reservoirLowQuantitySwitch} />
            }
            {/* Reservoir */}
            <HydReservoir system={title} x={0} y={576} lowLevel={reservoirLowQuantitySwitch} />
        </SvgGroup>
    );
};

type HydEngPumpProps = {
    system: string,
    pumpOn: boolean,
    x: number,
    y: number,
    pumpSwitchLowPressure: boolean
}

const HydEngPump = ({ system, pumpOn, x, y, pumpSwitchLowPressure } : HydEngPumpProps) => {
    let pumpLineYUpper: number;
    if (system === 'GREEN') {
        pumpLineYUpper = -151;
    } else if (system === 'BLUE') {
        pumpLineYUpper = -153;
    } else {
        pumpLineYUpper = -84;
    }

    return (
        <SvgGroup x={x} y={y}>
            <line className={pumpSwitchLowPressure ? 'AmberLine' : 'GreenLine'} x1={0} y1={-42} x2={0} y2={pumpLineYUpper} />
            <rect className={pumpSwitchLowPressure || !pumpOn ? 'AmberLine' : 'GreenLine'} x={-21} y={-42} width={42} height={42} />
            <line className={!pumpSwitchLowPressure && pumpOn ? 'GreenLine' : 'Hide'} x1={0} y1={-1} x2={0} y2={-41} />
            <line className={pumpOn ? 'Hide' : 'AmberLine'} x1={-12} y1={-21} x2={12} y2={-21} />
            <text className={pumpSwitchLowPressure && pumpOn ? 'Standard Amber' : 'Hide'} x={-13} y={-14}>LO</text>
        </SvgGroup>
    );
};

type HydEngValveProps = {
    x: number,
    y: number,
    fireValve: boolean,
    lowLevel: boolean
}

const HydEngValve = ({ x, y, fireValve, lowLevel } : HydEngValveProps) => (
    <SvgGroup x={x} y={y}>
        <line className={fireValve && !lowLevel ? 'GreenLine' : 'AmberLine'} x1={-0} y1={0} x2={0} y2={-68} />
        <circle className={fireValve ? 'GreenLine' : 'AmberLine'} cx={0} cy={21} r="21" />
        <line className={fireValve ? 'GreenLine' : 'Hide'} x1={0} y1={42} x2={x} y2={0} />
        <line className={fireValve ? 'Hide' : 'AmberLine'} x1={-21} y1={21} x2={21} y2={21} />
    </SvgGroup>
);

type HydReservoirProps = {
    system: string,
    x: number,
    y: number,
    lowLevel: boolean,
}

const HydReservoir = ({ system, x, y, lowLevel } : HydReservoirProps) => {
    const [fluidLevel] = useSimVar(`L:A32NX_HYD_${system}_RESERVOIR_LEVEL`, 'gallon', 1000);

    const [lowAirPress] = useSimVar(`L:A32NX_HYD_${system}_RESERVOIR_AIR_PRESSURE_IS_LOW`, 'boolean', 1000);

    const fluidLevelInLitres = fluidLevel * 3.79;

    const values = levels.filter((item) => item.system === system);
    const litersPerPixel = 121 / values[0].max;
    const reserveHeight = (litersPerPixel * values[0].low);
    const upperReserve = -reserveHeight;
    const lowerNorm = -121 + (litersPerPixel * values[0].norm);
    const fluidLevelPerPixel = 121 / values[0].max;
    const fluidHeight = -(fluidLevelPerPixel * fluidLevelInLitres);

    return (
        <SvgGroup x={x} y={y}>
            <line className={lowLevel ? 'AmberLine' : 'GreenLine'} x1={0} y1={-121} x2={0} y2={system === 'BLUE' ? -205 : -161} />
            <line className={lowLevel ? 'AmberLine' : 'WhiteLine'} x1={0} y1={upperReserve.toFixed(0)} x2={0} y2={-121} />
            <line className="GreenLine" x1={0} y1={-121} x2={6} y2={-121} />
            <line className="GreenLine" x1={6} y1={lowerNorm.toFixed(0)} x2={6} y2={-121} />
            <line className="GreenLine" x1={0} y1={lowerNorm.toFixed(0)} x2={6} y2={lowerNorm.toFixed(0)} />
            <rect className="AmberLine" x={0} y={upperReserve.toFixed(0)} width={6} height={reserveHeight} />

            {/* Hydraulic level */}
            <line className={lowLevel ? 'AmberLine' : 'GreenLine'} x1={0} y1={0} x2={-12} y2={0} />
            <line className={lowLevel ? 'AmberLine' : 'GreenLine'} x1={-12} y1={0} x2={-12} y2={fluidHeight} />
            <line className={lowLevel ? 'AmberLine' : 'GreenLine'} x1={0} y1={fluidHeight} x2={-12} y2={fluidHeight} />
            <line className={lowLevel ? 'AmberLine' : 'GreenLine'} x1={0} y1={fluidHeight} x2={-13} y2={fluidHeight - 11} />

            <text className={lowAirPress ? 'Large Amber' : 'Hide'} x={20} y={-80}>LO AIR</text>
            <text className={lowAirPress ? 'Large Amber' : 'Hide'} x={20} y={-50}>PRESS</text>
        </SvgGroup>
    );
};

type YellowElecPumpProps = {
    pumpPushbuttonOn: boolean,
    pressure: number,
    enginePumpPressureLowSwitch: boolean,
};

const YellowElecPump = ({ pumpPushbuttonOn, pressure, enginePumpPressureLowSwitch }: YellowElecPumpProps) => {
    const [ACBus2IsPowered] = useSimVar('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'bool', 1000);

    let elecHorizontalLineFormat: string;
    let verticalLineFormat: string;
    let elecTriangleFill: number;
    let elecTriangleColour: string;

    if (!pumpPushbuttonOn) {
        elecTriangleFill = 0;
        elecHorizontalLineFormat = 'Hide';
        elecTriangleColour = 'White';
    } else {
        elecTriangleFill = 1;
        elecHorizontalLineFormat = pressure <= 1450 ? 'AmberLine' : 'GreenLine';
        elecTriangleColour = pressure <= 1450 ? 'Amber' : 'Green';
    }

    if ((enginePumpPressureLowSwitch && !pumpPushbuttonOn) || pressure <= 1450) {
        verticalLineFormat = 'AmberLine';
    } else {
        verticalLineFormat = 'GreenLine';
    }

    return (
        <>
            <text
                id="ELEC-right"
                className={!ACBus2IsPowered ? 'Large Amber' : 'Large'}
                x={676}
                y={292}
            >
                ELEC
            </text>
            <Triangle x={642} y={283} scale={4 / 3} colour={elecTriangleColour} fill={elecTriangleFill} orientation={-90} />
            <line className={elecHorizontalLineFormat} x1={631} y1={283} x2={642} y2={283} />
            <line className={verticalLineFormat} x1={630} y1={217} x2={630} y2={283} />
        </>
    );
};

type PTUProps = {
    x: number,
    y: number,
    ptuScenario: string
}

const PTU = ({ x, y, ptuScenario } : PTUProps) => {
    const result: any = ptuArray.find(({ scenario }) => scenario === ptuScenario);
    const ptu1 = result.format.find(({ id }) => id === 'ptu1');
    const ptu2 = result.format.find(({ id }) => id === 'ptu2');
    const ptu3 = result.format.find(({ id }) => id === 'ptu3');
    const ptu4 = result.format.find(({ id }) => id === 'ptu4');
    const ptu5 = result.format.find(({ id }) => id === 'ptu5');
    const triangle1 = result.format.find(({ id }) => id === 'triangle1');
    const triangle2 = result.format.find(({ id }) => id === 'triangle2');
    const triangle3 = result.format.find(({ id }) => id === 'triangle3');

    return (
        <SvgGroup x={x} y={y}>
            <line id="ptu1" className={ptu1.className} x1={-132} y1={0} x2={-246} y2={0} />
            <line id="ptu2" className={ptu2.className} x1={-107} y1={0} x2={-20} y2={0} />
            <path id="ptu3" className={ptu3.className} d="M-20 0 A20 20 0 0 0 20 0" />
            <line id="ptu4" className={ptu4.className} x1={20} y1={0} x2={56} y2={0} />
            <line id="ptu5" className={ptu5.className} x1={177} y1={0} x2={246} y2={0} />
            <text className="Large" x={92} y={10}>PTU</text>
            <Triangle scale={4 / 3} x={triangle1.orientation < 0 ? -131 : -107} y={0} colour={triangle1.colour} fill={triangle1.fill} orientation={triangle1.orientation} />
            <Triangle scale={4 / 3} x={triangle2.orientation > 0 ? 80 : 56} y={0} colour={triangle2.colour} fill={triangle2.fill} orientation={triangle2.orientation} />
            <Triangle scale={4 / 3} x={triangle3.orientation > 0 ? 177 : 153} y={0} colour={triangle3.colour} fill={triangle3.fill} orientation={triangle3.orientation} />
        </SvgGroup>
    );
};

render(<HydPage />);
