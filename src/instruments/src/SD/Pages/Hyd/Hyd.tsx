import './Hyd.scss';
import ReactDOM from 'react-dom';
import React, { useCallback, useEffect, useState } from 'react';
import { SimVarProvider, useSimVar } from '@instruments/common/simVars';
import { getRenderTarget, setIsEcamPage } from '@instruments/common/defaults';
import { ptuArray, levels } from './common';
import { Triangle } from '../../Common/Shapes';

setIsEcamPage('hyd_page');

export const HydPage = () => {
    // The FADEC SimVars include a test for the fire button.
    const [Eng1N2] = useSimVar('TURB ENG N2:1', 'Percent', 1000);
    const [Eng2N2] = useSimVar('TURB ENG N2:2', 'Percent', 1000);

    const [greenPressure] = useSimVar('L:A32NX_HYD_GREEN_PRESSURE', 'psi', 500);
    const [yellowPressure] = useSimVar('L:A32NX_HYD_YELLOW_PRESSURE', 'psi', 500);
    const [bluePressure] = useSimVar('L:A32NX_HYD_BLUE_PRESSURE', 'psi', 500);

    const [greenPumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO', 'boolean', 500);
    const [yellowPumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO', 'boolean', 500);
    const [bluePumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_EPUMPB_PB_IS_AUTO', 'boolean', 500);

    const [yellowElectricPumpStatus] = useSimVar('L:A32NX_HYD_YELLOW_EPUMP_ACTIVE', 'boolean', 500);

    const [greenHydLevel] = useSimVar('L:A32NX_HYD_GREEN_RESERVOIR', 'gallon', 1000);
    const [yellowHydLevel] = useSimVar('L:A32NX_HYD_YELLOW_RESERVOIR', 'gallon', 1000);
    const [blueHydLevel] = useSimVar('L:A32NX_HYD_BLUE_RESERVOIR', 'gallon', 1000);

    const [greenFireValve] = useSimVar('L:A32NX_HYD_GREEN_FIRE_VALVE_OPENED', 'boolean', 500);
    const [yellowFireValve] = useSimVar('L:A32NX_HYD_YELLOW_FIRE_VALVE_OPENED', 'boolean', 500);

    const [ACBus1IsPowered] = useSimVar('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'bool', 1000);
    const [ACBus2IsPowered] = useSimVar('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'bool', 1000);

    const [engine1Running, setEngine1Running] = useState(0);
    const [engine2Running, setEngine2Running] = useState(0);

    useEffect(() => {
        setEngine1Running(Eng1N2 > 15 && greenFireValve);
        setEngine2Running(Eng2N2 > 15 && yellowFireValve);
    }, [Eng1N2, Eng2N2, greenFireValve, yellowFireValve]);

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

    const [elecRightFormat, setElecRightFormat] = useState('hide');
    const [elecTriangleFill, setElecTriangleFill] = useState(0);
    const [elecTriangleColour, setElecTriangleColour] = useState('white');

    useEffect(() => {
        setPtuScenario(pressureChart.ptuScenario);
    }, [pressureChart]);

    // PTU logic
    useEffect(() => {
        const setPressures = (clearState = false) => {
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
        };

        if (yellowElectricPumpStatus) {
            setElecTriangleFill(1);
            setElecTriangleColour(yellowPressure <= 1450 ? 'Amber' : 'Green');
            setElecRightFormat(yellowPressure <= 1450 ? 'AmberLine' : 'GreenLine');
        } else {
            setElecTriangleFill(0);
            setElecTriangleColour('White');
            setElecRightFormat('Hide');
        }

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
    }, [greenPressure, yellowPressure, yellowElectricPumpStatus, ptuActive, ptuAvailable, pressureChart.low, pressureChart.lowValue]);

    const y = 45;

    return (
        <>
            {/* This is already in an svg so we should remove the containing one - TODO remove style once we are not in the Asobo ECAM */}
            <svg id="hyd-page" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" style={{ marginTop: '-60px' }}>
                <text id="PageTitle" className="PageTitle" x="300" y="16" alignmentBaseline="central">HYD</text>
                <text className={`EngineNumber ${engine1Running ? 'FillWhite' : 'FillAmber'}`} x="160" y={y + 260} alignmentBaseline="central">1</text>
                <text className={`EngineNumber ${engine2Running ? 'FillWhite' : 'FillAmber'}`} x="440" y={y + 260} alignmentBaseline="central">2</text>

                <HydSys
                    title="GREEN"
                    pressure={greenPressure}
                    hydLevel={greenHydLevel}
                    x={110}
                    y={y}
                    fireValve={greenFireValve}
                    pumpPBStatus={greenPumpPBStatus}
                    yellowElectricPumpStatus={yellowElectricPumpStatus}
                />
                <HydSys
                    title="BLUE"
                    pressure={bluePressure}
                    hydLevel={blueHydLevel}
                    x={300}
                    y={y}
                    fireValve={0}
                    pumpPBStatus={bluePumpPBStatus}
                    yellowElectricPumpStatus={yellowElectricPumpStatus}
                />
                <HydSys
                    title="YELLOW"
                    pressure={yellowPressure}
                    hydLevel={yellowHydLevel}
                    x={490}
                    y={y}
                    fireValve={yellowFireValve}
                    pumpPBStatus={yellowPumpPBStatus}
                    yellowElectricPumpStatus={yellowElectricPumpStatus}
                />

                <PTU x={300} y={y + 126} ptuScenario={ptuScenario} />

                <RAT x={290} y={y} />

                <text
                    id="ELEC-centre"
                    className={!ACBus1IsPowered ? 'RatPtuElec FillAmber' : 'RatPtuElec FillWhite'}
                    x={350}
                    y={y + 245}
                    alignmentBaseline="central"
                >
                    ELEC

                </text>

                <text
                    id="ELEC-right"
                    className={!ACBus2IsPowered ? 'RatPtuElec FillAmber' : 'RatPtuElec FillWhite'}
                    x={548}
                    y={y + 180}
                    alignmentBaseline="central"
                >
                    ELEC

                </text>
                <Triangle x={500} y={y + 180} colour={elecTriangleColour} fill={elecTriangleFill} orientation={-90} />
                <line className={elecRightFormat} x1={490} y1={y + 180} x2={500} y2={y + 180} />

                <text className="Psi" x={205} y={y + 70} alignmentBaseline="central">PSI</text>
                <text className="Psi" x={395} y={y + 70} alignmentBaseline="central">PSI</text>

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
        <>
            <text className="RatPtuElec FillWhite" x={x - 42} y={y + 180} alignmentBaseline="central">RAT</text>
            <line className={`GreenLine ${RatStowed > 0.1 ? '' : 'Hide'}`} x1={x} y1={y + 180} x2={x + 10} y2={y + 180} />
            <Triangle x={x} y={y + 180} colour={RatStowed > 0.1 ? 'Green' : 'White'} fill={RatStowed > 0.1 ? 1 : 0} orientation={90} />
        </>
    );
};

type HydSysProps = {
    title: string,
    pressure: number,
    hydLevel: number,
    x: number,
    y: number,
    fireValve: number,
    pumpPBStatus: number,
    yellowElectricPumpStatus: number
}

const HydSys = ({ title, pressure, hydLevel, x, y, fireValve, pumpPBStatus, yellowElectricPumpStatus } : HydSysProps) => {
    const [hydLevelLow, setHydLevelLow] = useState(false);
    const lowPressure = 1450;
    const pressureNearest50 = Math.round(pressure / 50) * 50 >= 100 ? Math.round(pressure / 50) * 50 : 0;

    const [greenPumpActive] = useSimVar('L:A32NX_HYD_GREEN_EDPUMP_ACTIVE', 'boolean', 500);
    const [yellowPumpActive] = useSimVar('L:A32NX_HYD_YELLOW_EDPUMP_ACTIVE', 'boolean', 500);
    const [bluePumpActive] = useSimVar('L:A32NX_HYD_BLUE_EPUMP_ACTIVE', 'boolean', 500);

    const [greenPumpLowPressure] = useSimVar('L:A32NX_HYD_GREEN_EDPUMP_LOW_PRESS', 'boolean', 500);
    const [yellowPumpLowPressure] = useSimVar('L:A32NX_HYD_YELLOW_EDPUMP_LOW_PRESS', 'boolean', 500);
    const [bluePumpLowPressure] = useSimVar('L:A32NX_HYD_BLUE_EPUMP_LOW_PRESS', 'boolean', 500);

    function checkPumpLowPressure(pump) {
        switch (pump) {
        case 'GREEN':
            return greenPumpLowPressure || !greenPumpActive;
        case 'BLUE':
            return bluePumpLowPressure || !bluePumpActive;
        case 'YELLOW':
            return yellowPumpLowPressure || !yellowPumpActive;
        default:
            return 1;
        }
    }

    const pumpDetectLowPressure = checkPumpLowPressure(title);

    const hydLevelBoolean = useCallback(
        (value: boolean) => setHydLevelLow(value),
        [],
    );

    return (
        <>
            <Triangle x={x} y={y} colour={pressureNearest50 <= lowPressure ? 'Amber' : 'Green'} fill={0} orientation={0} />
            <text className={`Title ${pressureNearest50 <= lowPressure ? 'FillAmber' : 'FillWhite'}`} x={x} y={y + 43}>{title}</text>
            <text className={`Pressure ${pressureNearest50 <= lowPressure ? 'FillAmber' : 'FillGreen'}`} x={x} y={y + 75}>{pressureNearest50}</text>

            {/* The colour of these lines will be affected by the yellow electric pump */}
            <line className={pressureNearest50 <= lowPressure ? 'AmberLine' : 'GreenLine'} x1={x} y1={y + 126} x2={x} y2={y + 83} />
            <line
                className={pressureNearest50 <= lowPressure
                 || (pumpDetectLowPressure && title === 'GREEN')
                 || (pumpDetectLowPressure && !yellowElectricPumpStatus && title === 'YELLOW') ? 'AmberLine' : 'GreenLine'}
                x1={x}
                y1={y + 181}
                x2={x}
                y2={y + 125}
            />
            <line className={pressureNearest50 <= lowPressure || (pumpDetectLowPressure && title !== 'BLUE') ? 'AmberLine' : 'GreenLine'} x1={x} y1={y + 221} x2={x} y2={y + 180} />

            <HydEngPump
                system={title}
                pumpOn={pumpPBStatus}
                x={x}
                y={y + 290}
                hydLevelLow={hydLevelLow}
                fireValve={fireValve}
                pumpDetectLowPressure={pumpDetectLowPressure}
                pressure={pressureNearest50}
            />
            <HydEngValve system={title} x={x} y={y + 290} fireValve={fireValve} hydLevelLow={hydLevelLow} />
            {/* Reservoir */}
            <HydReservoir system={title} x={x} y={495} fluidLevel={hydLevel} setHydLevel={hydLevelBoolean} />
        </>
    );
};

type HydEngPumpProps = {
    system: string,
    pumpOn: number,
    x: number,
    y: number,
    hydLevelLow: boolean,
    fireValve: number,
    pumpDetectLowPressure: number
    pressure: number
}

const HydEngPump = ({ system, pumpOn, x, y, hydLevelLow, fireValve, pumpDetectLowPressure, pressure } : HydEngPumpProps) => {
    const lowPressure = 1450;
    if (system === 'BLUE') {
        return (
            <>
                <line className={pressure <= lowPressure ? 'AmberLine' : 'GreenLine'} x1={x} y1={y - 32} x2={x} y2={y - 80} />
                <rect className={pumpDetectLowPressure ? 'AmberLine' : 'GreenLine'} x={x - 16} y={y - 32} width={32} height={32} />
                <line className={!pumpDetectLowPressure ? 'GreenLine' : 'Hide'} x1={x} y1={y} x2={x} y2={y - 32} />
                <line className={pumpOn ? 'Hide' : 'AmberLine'} x1={x - 12} y1={y - 16} x2={x + 12} y2={y - 16} />
                <text id="ELEC-centre" className={pumpDetectLowPressure && pumpOn ? 'RatPtuElec FillAmber' : 'Hide'} x={x} y={y - 16} alignmentBaseline="central">LO</text>

            </>
        );
    }

    return (
        <>
            <rect className={pumpDetectLowPressure ? 'AmberLine' : 'GreenLine'} x={x - 16} y={y - 80} width={32} height={32} />
            <line className={!pumpDetectLowPressure ? 'GreenLine' : 'Hide'} x1={x} y1={y} x2={x} y2={y - 80} />
            <line className={pumpOn ? 'Hide' : 'AmberLine'} x1={x - 12} y1={y - 64} x2={x + 12} y2={y - 64} />
            <line className={hydLevelLow || !fireValve ? 'AmberLine' : 'GreenLine'} x1={x} y1={y} x2={x} y2={y - 48} />
            <text
                id="ELEC-centre"
                className={
                    pumpDetectLowPressure && pumpOn ? 'RatPtuElec FillAmber' : 'Hide'
                }
                x={x}
                y={y - 64}
                alignmentBaseline="central"
            >
                LO

            </text>

        </>
    );
};

type HydEngValveProps = {
    system: string,
    x: number,
    y: number,
    fireValve: number,
    hydLevelLow: boolean
}

const HydEngValve = ({ system, x, y, fireValve, hydLevelLow } : HydEngValveProps) => {
    if (system === 'BLUE') {
        return (
            <line className={!hydLevelLow ? 'GreenLine' : 'AmberLine'} x1={x} y1={y + 33} x2={x} y2={y} />
        );
    }

    return (
        <>
            <circle className={fireValve ? 'GreenLine' : 'AmberLine'} cx={x} cy={y + 16} r="16" />
            <line className={fireValve ? 'GreenLine' : 'Hide'} x1={x} y1={y + 32} x2={x} y2={y} />
            <line className={fireValve ? 'Hide' : 'AmberLine'} x1={x - 10} y1={y + 16} x2={x + 10} y2={y + 16} />
        </>
    );
};

type HydReservoirProps = {
    system: string,
    x: number,
    y: number,
    fluidLevel: number,
    setHydLevel: React.RefCallback<Boolean>
}

const HydReservoir = ({ system, x, y, fluidLevel, setHydLevel } : HydReservoirProps) => {
    const fluidLevelInLitres = fluidLevel * 3.79;

    const values = levels.filter((item) => item.system === system);
    const litersPerPixel = 96 / values[0].max;
    const reserveHeight = (litersPerPixel * values[0].low);
    const upperReserve = y - reserveHeight;
    const lowerNorm = y - 96 + (litersPerPixel * values[0].norm);
    const fluidLevelPerPixel = 96 / values[0].max;
    const fluidHeight = y - (fluidLevelPerPixel * fluidLevelInLitres);

    useEffect(() => {
        if (fluidLevelInLitres < values[0].low) {
            setHydLevel(true);
        } else {
            setHydLevel(false);
        }
    }, [fluidLevelInLitres, values, setHydLevel]);

    return (
        <>
            <line className={fluidLevelInLitres < values[0].low ? 'AmberLine' : 'GreenLine'} x1={x} y1={y - 96} x2={x} y2={y - 128} />
            <line className={fluidLevelInLitres < values[0].low ? 'AmberLine' : 'WhiteLine'} x1={x} y1={upperReserve.toFixed(0)} x2={x} y2={y - 96} />
            <line className="GreenLine" x1={x} y1={y - 96} x2={x + 4} y2={y - 96} strokeLinejoin="miter" />
            <line className="GreenLine" x1={x + 4} y1={lowerNorm.toFixed(0)} x2={x + 4} y2={y - 96} strokeLinejoin="miter" />
            <line className="GreenLine" x1={x} y1={lowerNorm.toFixed(0)} x2={x + 4} y2={lowerNorm.toFixed(0)} strokeLinejoin="miter" />
            <rect className="AmberLine" x={x} y={upperReserve.toFixed(0)} width={4} height={reserveHeight} />

            {/* Hydraulic level */}
            <line className={fluidLevelInLitres < values[0].low ? 'AmberLine' : 'GreenLine'} x1={x} y1={y} x2={x - 8} y2={y} strokeLinejoin="miter" />
            <line className={fluidLevelInLitres < values[0].low ? 'AmberLine' : 'GreenLine'} x1={x - 8} y1={y} x2={x - 8} y2={fluidHeight} strokeLinejoin="miter" />
            <line className={fluidLevelInLitres < values[0].low ? 'AmberLine' : 'GreenLine'} x1={x} y1={fluidHeight} x2={x - 8} y2={fluidHeight} strokeLinejoin="miter" />
            <line className={fluidLevelInLitres < values[0].low ? 'AmberLine' : 'GreenLine'} x1={x} y1={fluidHeight} x2={x - 8} y2={fluidHeight - 8} strokeLinejoin="miter" />
        </>
    );
};

type PTUProps = {
    x: number,
    y: number,
    ptuScenario: string
}

const PTU = ({ x, y, ptuScenario } : PTUProps) => {
    const semiCircleD = `M${x - 16},${y} C${x - 16},${y + 24} ${x + 16},${y + 24} ${x + 16},${y}`;

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
        <>
            <line id="ptu1" className={ptu1.className} x1={x - 82} y1={y} x2={x - 190} y2={y} />
            <line id="ptu2" className={ptu2.className} x1={x - 82} y1={y} x2={x - 16} y2={y} />
            <path id="ptu3" className={ptu3.className} d={semiCircleD} />
            <line id="ptu4" className={ptu4.className} x1={x + 16} y1={y} x2={x + 50} y2={y} />
            <line id="ptu5" className={ptu5.className} x1={x + 135} y1={y} x2={x + 190} y2={y} />
            <text className="RatPtuElec FillWhite" x={x + 92} y={y} alignmentBaseline="central">PTU</text>
            <Triangle x={triangle1.orientation < 0 ? x - 100 : x - 82} y={y} colour={triangle1.colour} fill={triangle1.fill} orientation={triangle1.orientation} />
            <Triangle x={triangle2.orientation > 0 ? x + 70 : x + 50} y={y} colour={triangle2.colour} fill={triangle2.fill} orientation={triangle2.orientation} />
            <Triangle x={triangle3.orientation > 0 ? x + 135 : x + 117} y={y} colour={triangle3.colour} fill={triangle3.fill} orientation={triangle3.orientation} />
        </>
    );
};

ReactDOM.render(<SimVarProvider><HydPage /></SimVarProvider>, getRenderTarget());
