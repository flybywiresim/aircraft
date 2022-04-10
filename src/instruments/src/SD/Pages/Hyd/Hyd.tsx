import React, { useEffect, useState } from 'react';
import { render } from '@instruments/common/index';
import { SimVarProvider, useSimVar } from '@instruments/common/simVars';
import { setIsEcamPage } from '@instruments/common/defaults';
import { levels } from './common';
import { Triangle } from '../../Common/Shapes';
import PTU from './elements/PTU';

import './Hyd.scss';

setIsEcamPage('hyd_page');

export const HydPage = () => {
    // The FADEC SimVars include a test for the fire button.
    const [Eng1N2] = useSimVar('TURB ENG N2:1', 'Percent', 1000);
    const [Eng2N2] = useSimVar('TURB ENG N2:2', 'Percent', 1000);

    const [greenPressure] = useSimVar('L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE', 'psi', 500);
    const [yellowPressure] = useSimVar('L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE', 'psi', 500);
    const [bluePressure] = useSimVar('L:A32NX_HYD_BLUE_SYSTEM_1_SECTION_PRESSURE', 'psi', 500);

    const [greenPumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_ENG_1_PUMP_PB_IS_AUTO', 'boolean', 500);
    const [yellowPumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_ENG_2_PUMP_PB_IS_AUTO', 'boolean', 500);
    const [bluePumpPBStatus] = useSimVar('L:A32NX_OVHD_HYD_EPUMPB_PB_IS_AUTO', 'boolean', 500);

    const [yellowElectricPumpStatus] = useSimVar('L:A32NX_HYD_YELLOW_EPUMP_ACTIVE', 'boolean', 500);

    const [greenHydLevel] = useSimVar('L:A32NX_HYD_GREEN_RESERVOIR_LEVEL', 'gallon', 1000);
    const [yellowHydLevel] = useSimVar('L:A32NX_HYD_YELLOW_RESERVOIR_LEVEL', 'gallon', 1000);
    const [blueHydLevel] = useSimVar('L:A32NX_HYD_BLUE_RESERVOIR_LEVEL', 'gallon', 1000);

    const [greenFireValve] = useSimVar('L:A32NX_HYD_GREEN_PUMP_1_FIRE_VALVE_OPENED', 'boolean', 500);
    const [yellowFireValve] = useSimVar('L:A32NX_HYD_YELLOW_PUMP_1_FIRE_VALVE_OPENED', 'boolean', 500);

    const [ACBus1IsPowered] = useSimVar('L:A32NX_ELEC_AC_1_BUS_IS_POWERED', 'bool', 1000);
    const [ACBus2IsPowered] = useSimVar('L:A32NX_ELEC_AC_2_BUS_IS_POWERED', 'bool', 1000);

    const [engine1Running, setEngine1Running] = useState(0);
    const [engine2Running, setEngine2Running] = useState(0);

    const [elecRightFormat, setElecRightFormat] = useState('hide');
    const [elecTriangleFill, setElecTriangleFill] = useState(0);
    const [elecTriangleColour, setElecTriangleColour] = useState('white');

    useEffect(() => {
        if (yellowElectricPumpStatus) {
            setElecTriangleFill(1);
            setElecTriangleColour(yellowPressure <= 1450 ? 'Amber' : 'Green');
            setElecRightFormat(yellowPressure <= 1450 ? 'AmberLine' : 'GreenLine');
        } else {
            setElecTriangleFill(0);
            setElecTriangleColour('White');
            setElecRightFormat('Hide');
        }
    }, [greenPressure, yellowPressure, yellowElectricPumpStatus]);

    useEffect(() => {
        setEngine1Running(Eng1N2 > 15 && greenFireValve);
        setEngine2Running(Eng2N2 > 15 && yellowFireValve);
    }, [Eng1N2, Eng2N2]);

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

                <PTU x={300} y={y + 126} />

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

    const hydLevelBoolean = (value: boolean) => {
        setHydLevelLow(value);
    };

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
    setHydLevel: React.RefCallback<
    Boolean>
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
    }, [fluidLevelInLitres]);

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

render(<SimVarProvider><HydPage /></SimVarProvider>);
