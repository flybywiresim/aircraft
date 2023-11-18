import { useSimVar } from '@instruments/common/simVars';
import React from 'react';
import { PageTitle } from '../Generic/PageTitle';

import '../../styles.scss';

const LITERS_PER_GALLON = 3.785411784;

export const HydPage = () => {
    const [greenPressure] = useSimVar('L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE', 'psi', 1000);
    const [yellowPressure] = useSimVar('L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE', 'psi', 1000);

    const [engine1State] = useSimVar('L:A32NX_ENGINE_STATE:1', 'Enum', 1000);
    const [engine2State] = useSimVar('L:A32NX_ENGINE_STATE:2', 'Enum', 1000);
    const [engine3State] = useSimVar('L:A32NX_ENGINE_STATE:3', 'Enum', 1000);
    const [engine4State] = useSimVar('L:A32NX_ENGINE_STATE:4', 'Enum', 1000);

    const [greenReservoirLevel] = useSimVar('L:A32NX_HYD_GREEN_RESERVOIR_LEVEL', 'gallon', 1000);
    const [greenReservoirLevelIsLow] = useSimVar('L:A32NX_HYD_GREEN_RESERVOIR_LEVEL_IS_LOW', 'boolean', 1000);
    const [greenReservoirAirPressureIsLow] = useSimVar('L:A32NX_HYD_GREEN_RESERVOIR_AIR_PRESSURE_IS_LOW', 'boolean', 1000);

    let greenReservoirFlags = ReservoirFailFlags.None;
    if (greenReservoirAirPressureIsLow) greenReservoirFlags |= ReservoirFailFlags.AirPressureLow;
    if (greenReservoirLevelIsLow) greenReservoirFlags |= ReservoirFailFlags.LevelLow;

    const [yellowReservoirLevel] = useSimVar('L:A32NX_HYD_YELLOW_RESERVOIR_LEVEL', 'gallon', 1000);
    const [yellowReservoirLevelIsLow] = useSimVar('L:A32NX_HYD_YELLOW_RESERVOIR_LEVEL_IS_LOW', 'boolean', 1000);
    const [yellowReservoirAirPressureIsLow] = useSimVar('L:A32NX_HYD_YELLOW_RESERVOIR_AIR_PRESSURE_IS_LOW', 'boolean', 1000);

    let yellowReservoirFlags = ReservoirFailFlags.None;
    if (yellowReservoirAirPressureIsLow) yellowReservoirFlags |= ReservoirFailFlags.AirPressureLow;
    if (yellowReservoirLevelIsLow) yellowReservoirFlags |= ReservoirFailFlags.LevelLow;

    const [engineDrivenPump1aState] = useEngineDrivenPumpState('1A');
    const [engineDrivenPump1bState] = useEngineDrivenPumpState('1B');
    const [engineDrivenPump2aState] = useEngineDrivenPumpState('2A');
    const [engineDrivenPump2bState] = useEngineDrivenPumpState('2B');
    const [engineDrivenPump3aState] = useEngineDrivenPumpState('3A');
    const [engineDrivenPump3bState] = useEngineDrivenPumpState('3B');
    const [engineDrivenPump4aState] = useEngineDrivenPumpState('4A');
    const [engineDrivenPump4bState] = useEngineDrivenPumpState('4B');

    const [engine1PumpAbDisconnect] = useSimVar('L:A32NX_HYD_ENG_1AB_PUMP_DISC', 'boolean', 1000);
    const [engine2PumpAbDisconnect] = useSimVar('L:A32NX_HYD_ENG_2AB_PUMP_DISC', 'boolean', 1000);
    const [engine3PumpAbDisconnect] = useSimVar('L:A32NX_HYD_ENG_3AB_PUMP_DISC', 'boolean', 1000);
    const [engine4PumpAbDisconnect] = useSimVar('L:A32NX_HYD_ENG_4AB_PUMP_DISC', 'boolean', 1000);

    const [isFireValve1Open] = useFireValveOpenState(1);
    const [isFireValve2Open] = useFireValveOpenState(2);
    const [isFireValve3Open] = useFireValveOpenState(3);
    const [isFireValve4Open] = useFireValveOpenState(4);

    const line1Center = 77;
    const line2Center = 230;
    const line3Center = 534;
    const line4Center = 686;

    return (
        <g className='hyd'>
            <PageTitle showMore={false} x={5} y={28}>HYD</PageTitle>
            <g>
                <EngineGraphic x={6} y={230} label={1} isRunning={engine1State === 1} />
                <EngineGraphic x={158} y={188} label={2} isRunning={engine2State === 1} />

                <SystemLabel x={36} y={60} label='GREEN' pressure={greenPressure} />

                <line x1={line1Center} y1={126} x2={line1Center} y2={294} className={greenPressure > 2900 ? 'Green' : 'Amber'} />
                <line x1={line2Center} y1={126} x2={line2Center} y2={248} className={greenPressure > 2900 ? 'Green' : 'Amber'} />

                <EnginePump x={line1Center - 45} y={296} state={engineDrivenPump1aState} label='A' isDisconnected={engine1PumpAbDisconnect} />
                <EnginePump x={line1Center + 4} y={296} state={engineDrivenPump1bState} label='B' isDisconnected={engine1PumpAbDisconnect} isMirrored />

                <EnginePump x={line2Center - 44} y={250} state={engineDrivenPump2aState} label='A' isDisconnected={engine2PumpAbDisconnect} />
                <EnginePump x={line2Center + 4} y={250} state={engineDrivenPump2bState} label='B' isDisconnected={engine2PumpAbDisconnect} isMirrored />

                <line x1={line1Center} y1={338} x2={line1Center} y2={390} className='Green body-line' />
                <line x1={line2Center} y1={292} x2={line2Center} y2={350} className='Green body-line' />

                <line x1={line1Center} y1={426} x2={line1Center} y2={620} className='Green' />
                <line x1={line2Center} y1={386} x2={line2Center} y2={450} className='Green' />

                <FireShutoffValve x={line1Center - 18} y={390} isOpen={isFireValve1Open} />
                <FireShutoffValve x={line2Center - 18} y={350} isOpen={isFireValve2Open} />

                <line x1={line1Center} y1={450} x2={line2Center} y2={450} className='Green body-line' />

                <Reservoir x={line1Center - 9} y={466} levelInLitres={greenReservoirLevel * LITERS_PER_GALLON} normalFillingRange={35} failFlags={greenReservoirFlags} />
            </g>
            <ElecPumps x={384} y={86} />
            <g>
                <EngineGraphic x={462} y={188} label={3} isRunning={engine3State === 1} />
                <EngineGraphic x={614} y={230} label={4} isRunning={engine4State === 1} />

                <SystemLabel x={502} y={60} label='YELLOW' pressure={yellowPressure} />

                <line x1={line3Center} y1={126} x2={line3Center} y2={248} className={yellowPressure > 2900 ? 'Green' : 'Amber'} />
                <line x1={line4Center} y1={126} x2={line4Center} y2={294} className={yellowPressure > 2900 ? 'Green' : 'Amber'} />

                <EnginePump x={line3Center - 44} y={250} state={engineDrivenPump3aState} label='A' isDisconnected={engine3PumpAbDisconnect} />
                <EnginePump x={line3Center + 4} y={250} state={engineDrivenPump3bState} label='B' isDisconnected={engine3PumpAbDisconnect} isMirrored />

                <EnginePump x={line4Center - 44} y={296} state={engineDrivenPump4aState} label='A' isDisconnected={engine4PumpAbDisconnect} />
                <EnginePump x={line4Center + 4} y={296} state={engineDrivenPump4bState} label='B' isDisconnected={engine4PumpAbDisconnect} isMirrored />

                <line x1={line3Center} y1={292} x2={line3Center} y2={350} className='Green body-line' />
                <line x1={line4Center} y1={338} x2={line4Center} y2={390} className='Green body-line' />

                <line x1={line3Center} y1={386} x2={line3Center} y2={450} className='Green body-line' />
                <line x1={line4Center} y1={426} x2={line4Center} y2={620} className='Green body-line' />

                <FireShutoffValve x={line3Center - 18} y={350} isOpen={isFireValve3Open} />
                <FireShutoffValve x={line4Center - 18} y={390} isOpen={isFireValve4Open} />

                <line x1={line3Center} y1={450} x2={line4Center} y2={450} className='Green body-line' />

                <Reservoir x={line4Center - 9} y={466} levelInLitres={yellowReservoirLevel * LITERS_PER_GALLON} normalFillingRange={35} isMirrored failFlags={yellowReservoirFlags} />
            </g>
        </g>
    );
};

type ElecPumpGroupProps = {
    x: number;
    y: number;
}
const ElecPumps = ({ x, y }: ElecPumpGroupProps) => {
    const [electricPumpStateGreenA] = useElectricPumpState('G', 'A');
    const [electricPumpStateGreenB] = useElectricPumpState('G', 'B');
    const [electricPumpStateYellowA] = useElectricPumpState('Y', 'A');
    const [electricPumpStateYellowB] = useElectricPumpState('Y', 'B');

    return (
        <g className='hyd-elec-pumps'>
            <ElecPump x={x - 90} y={y} state={electricPumpStateGreenA} isMirrored label='A' isOverheat={false} />
            <ElecPump x={x - 90} y={y + 30} state={electricPumpStateGreenB} isMirrored label='B' isOverheat={false} />
            <text textAnchor='middle' x={x} y={y + 22} className='F26 White'>ELEC</text>
            <text textAnchor='middle' x={x} y={y + 22 + 25} className='F26 White'>PMPS</text>
            <ElecPump x={x + 52} y={y} state={electricPumpStateYellowA} isMirrored={false} label='A' isOverheat={false} />
            <ElecPump x={x + 52} y={y + 30} state={electricPumpStateYellowB} isMirrored={false} label='B' isOverheat={false} />
        </g>
    );
};

type SystemLabelProps = {
    x: number,
    y: number,
    label: string,
    pressure: number
}
const SystemLabel = ({ x, y, label, pressure }: SystemLabelProps) => {
    const width = 226;
    const height = 36;

    return (
        <g className='hyd-system-label'>
            <path d={`M ${x + width / 2} ${y} l 12 19 h -24 z`} className={pressure > 2900 ? 'Green' : 'Amber'} />
            <rect x={x} y={y + 30} width={width} height={height} className={pressure > 2900 ? 'Green' : 'Amber'} />
            <text x={x + 6} y={y + height + 23} className={`${pressure > 2900 ? 'White' : 'Amber'}`}>{label}</text>
            <text
                x={x + 152 + label.length * 4}
                y={y + height + 23}
                textAnchor='end'
                className={`${pressure > 2900 ? 'Green' : 'Amber'} F28`}
            >
                {(Math.round(pressure / 100) * 100).toFixed(0)}
            </text>
            <text x={x + 156 + label.length * 4} y={y + height + 23} className='Cyan'>PSI</text>
        </g>
    );
};

function useEngineDrivenPumpState(label: string): [EnginePumpState] {
    const [engineDrivenPumpLowPressure] = useSimVar(`L:A32NX_HYD_EDPUMP_${label}_LOW_PRESS`, 'boolean', 1000);
    const [engineDrivenPumpPbIsAuto] = useSimVar(`L:A32NX_OVHD_HYD_ENG_${label}_PUMP_PB_IS_AUTO`, 'boolean', 1000);

    if (!engineDrivenPumpPbIsAuto) {
        if (!engineDrivenPumpLowPressure) {
            return [EnginePumpState.AbnormallyPressurized];
        }
        return [EnginePumpState.Depressurized];
    }

    if (engineDrivenPumpLowPressure) {
        return [EnginePumpState.LowPressure];
    }

    return [EnginePumpState.Normal];
}

function useFireValveOpenState(engineNumber: 1 | 2 | 3 | 4): [boolean] {
    // In the hydraulics simulation, there's one fire valve per engine pump, i.e 2 per engine. But there's only one symbol on the ECAM.
    // So we show the ECAM symbol closed only if the fire valves on both pumps are closed

    const [isFireValveAOpen] = useSimVar(`L:A32NX_HYD_${engineNumber <= 2 ? 'GREEN' : 'YELLOW'}_PUMP_${1 + 2 * ((engineNumber - 1) % 2)}_FIRE_VALVE_OPENED`, 'boolean', 1000); // 1, 3, 1, 3
    const [isFireValveBOpen] = useSimVar(`L:A32NX_HYD_${engineNumber <= 2 ? 'GREEN' : 'YELLOW'}_PUMP_${2 + 2 * ((engineNumber - 1) % 2)}_FIRE_VALVE_OPENED`, 'boolean', 1000); // 2, 4, 2, 4

    return [isFireValveAOpen || isFireValveBOpen];
}

enum EnginePumpState {
    Normal,
    Depressurized,
    AbnormallyPressurized,
    LowPressure,
}

type EnginePumpProps = {
    x: number;
    y: number;
    state: EnginePumpState,
    isDisconnected?: boolean,
    label: string;
    isMirrored?: boolean;
};

const EnginePump = ({ x, y, state, isDisconnected = false, label, isMirrored }: EnginePumpProps) => {
    const size = 39;

    return (
        <g className='hyd-engine-pump'>
            <rect x={x} y={y} width={size} height={size} className={state === EnginePumpState.Normal ? 'Green' : 'Amber'} />
            {(state === EnginePumpState.Normal || state === EnginePumpState.AbnormallyPressurized)
                && <line className={state === EnginePumpState.Normal ? 'Green' : 'Amber'} x1={x + size / 2} y1={y} x2={x + size / 2} y2={y + size} />}
            {state === EnginePumpState.Depressurized
                && <line className='Amber' x1={x + 8} y1={y + size / 2} x2={x + size - 8} y2={y + size / 2} />}
            {state === EnginePumpState.LowPressure && <text x={x + 3} y={y + 30} className='Amber F27'>LO</text>}
            <text x={isMirrored ? x + size + 4 : x - 20} y={y + 30} className='F28 hyd-engine-pump-label'>{label}</text>
            {isDisconnected && <text x={isMirrored ? x + 5 : x - 10} y={y + size + 18} className='Amber F19 hyd-engine-pump-disc'>DISC</text>}
        </g>
    );
};

type FireShutoffValveProps = {
    x: number;
    y: number;
    isOpen?: boolean;
};

const FireShutoffValve = ({ x, y, isOpen }: FireShutoffValveProps) => {
    const radius = 17;

    return (
        <>
            <circle
                cx={x + radius}
                cy={y + radius}
                r={radius}
                className={`${isOpen ? 'Green' : 'Amber'} body-line`}
            />
            {isOpen ? (
                <line x1={x + radius} y1={y} x2={x + radius} y2={y + 2 * radius} className='Green' />
            ) : (
                <line x1={x} y1={y + radius} x2={x + 2 * radius} y2={y + radius} className='Amber' />
            )}
        </>
    );
};

function useElectricPumpState(side: ('G' | 'Y'), aOrB: ('A' | 'B')): [ElecPumpState] {
    const [isElecPumpActive] = useSimVar(`L:A32NX_HYD_${side}${aOrB}_EPUMP_ACTIVE`, 'boolean', 1000);
    const [offPbIsAuto] = useSimVar(`L:A32NX_OVHD_HYD_EPUMP${side[0]}${aOrB}_OFF_PB_IS_AUTO`, 'boolean', 1000);
    const [offPbHasFault] = useSimVar(`L:A32NX_OVHD_HYD_EPUMP${side[0]}${aOrB}_OFF_PB_HAS_FAULT`, 'boolean', 1000);
    // TODO: Use the ON pb

    if (isElecPumpActive) {
        if (offPbHasFault) {
            return [ElecPumpState.FailOn];
        }

        return [ElecPumpState.On];
    }

    if (offPbHasFault || !offPbIsAuto) {
        return [ElecPumpState.FailOff];
    }

    return [ElecPumpState.Auto];
}

enum ElecPumpState {
    On = 'GreenFill Green',
    Auto = 'White',
    FailOn = 'Amber AmberFill',
    FailOff = 'Amber',
}

type ElecPumpProps = {
    x: number;
    y: number;
    state: ElecPumpState;
    label: 'A' | 'B';
    isOverheat?: boolean;
    isMirrored: boolean;
};
const ElecPump = ({ x, y, state, isOverheat = false, isMirrored, label }: ElecPumpProps) => {
    const isFailed = state === ElecPumpState.FailOff || state === ElecPumpState.FailOn;

    if (isMirrored) {
        return (
            <g id='hyd-elec-pump' className='hyd-elec-pump'>
                <path d={`M ${x + 13} ${y} l -13 9 l 13 9 z`} className={`${state}`} />
                <text x={x + 20} y={y + 18} className={`F25 ${isFailed ? 'Amber' : 'White'}`}>
                    {label}
                </text>
                {isOverheat && <text x={x + 4} y={label === 'A' ? y - 12 : y + 44} className='Amber F19'>OVHT</text>}
            </g>
        );
    }

    return (
        <g id='hyd-elec-pump' className='hyd-elec-pump'>
            <text x={x} y={y + 18} className={`F25 ${isFailed ? 'Amber' : 'White'}`}>
                {label}
            </text>
            <path d={`M ${x + 20} ${y} l 13 9 l -13 9 z`} className={`${state}`} />
            {isOverheat && <text x={x - 14} y={label === 'A' ? y - 12 : y + 44} className='Amber F19'>OVHT</text>}
        </g>
    );
};

type ReservoirProps = {
    x: number;
    y: number;
    isMirrored?: boolean;
    levelInLitres: number;
    normalFillingRange?: number;
    failFlags?: ReservoirFailFlags;
};
const Reservoir = ({ x, y, levelInLitres, normalFillingRange, isMirrored = false, failFlags = ReservoirFailFlags.None }: ReservoirProps) => {
    const height = 160;
    const width = 18;
    const fallbackFillingRange = 40;

    // TODO: Figure out
    const reservoirCapacityInLiters = 50;
    const litersToPixels = (liters: number) => liters * height / reservoirCapacityInLiters;

    if (!Number.isFinite(normalFillingRange)) {
        failFlags |= ReservoirFailFlags.FillingRangeFail;
    } else if (failFlags & ReservoirFailFlags.FillingRangeFail) {
        normalFillingRange = undefined;
    }

    return (
        <g className='hyd-reservoir'>
            <path d={`M ${x}, ${y} v ${height} h ${width} v ${-height}`} className='White' />
            <rect
                x={x + 0.5}
                y={y + height - litersToPixels(levelInLitres)}
                height={litersToPixels(levelInLitres)}
                width={width - 1}
                className={`${failFlags & ReservoirFailFlags.LevelLow ? 'Amber' : 'Green'} Fill`}
            />
            <rect
                x={x + width}
                y={y + height - litersToPixels((normalFillingRange ?? fallbackFillingRange)) - 17}
                width={8}
                height={16}
                className={failFlags & ReservoirFailFlags.FillingRangeFail ? 'hyd-reservoir-normal-fail' : 'hyd-reservoir-normal'}
            />
            <rect
                x={x + width}
                y={y + height - litersToPixels(normalFillingRange ?? fallbackFillingRange)}
                width={8}
                height={16}
                className={failFlags & ReservoirFailFlags.FillingRangeFail ? 'hyd-reservoir-normal-fail' : 'hyd-reservoir-normal'}
            />
            {(failFlags & ReservoirFailFlags.FillingRangeFail)
                && <path className='Amber hyd-reservoir-normal-fail-x' d={`M ${x + width - 0.5} ${y + height - litersToPixels(fallbackFillingRange) - 4} l 8 8 m 0 -8 l -8 8`} />}
            <rect x={x + width} y={y + height - 35} width={7} height={36} className='hyd-reservoir-low' />
            <ReservoirFailIndications x={isMirrored ? x - 64 : x + 64} y={y + height - 80} flags={failFlags} />
        </g>
    );
};

enum ReservoirFailFlags {
    None = 0,
    AirPressureLow = 1,
    TemperatureHigh = 2,
    Overheat = 4,
    LevelLow = 8,
    FillingRangeFail = 16,
}
type ReservoirFailIndicationsProps = {
    x: number;
    y: number;
    flags?: ReservoirFailFlags
}
const ReservoirFailIndications = ({ x, y, flags = ReservoirFailFlags.None }: ReservoirFailIndicationsProps) => (
    <g className='hyd-reservoir-fail'>
        {flags & ReservoirFailFlags.AirPressureLow && <text x={x} y={y} textAnchor='middle' className='Amber F19'>AIR</text>}
        {flags & ReservoirFailFlags.AirPressureLow && <text x={x} y={y + 1 * 21} textAnchor='middle' className='Amber F19'>PRESS</text>}
        {flags & ReservoirFailFlags.AirPressureLow && <text x={x} y={y + 2 * 21} textAnchor='middle' className='Amber F19'>LOW</text>}
        {flags & ReservoirFailFlags.TemperatureHigh && <text x={x} y={y + 66} textAnchor='middle' className='Amber F19'>TEMP HI</text>}
        {flags & ReservoirFailFlags.Overheat && <text x={x} y={y + 66} textAnchor='middle' className='Amber F19'>OVHT</text>}
    </g>
);

type EngineGraphicProps = {
    x: number;
    y: number;
    label: number;
    isRunning: boolean;
};
const EngineGraphic = ({ x, y, label, isRunning }: EngineGraphicProps) => (
    <g className='hyd-engine-graphic'>
        <image xlinkHref='/Images/HYD_8-7_TRIMMED.png' x={x} y={y} width={142} height={206} />
        <text x={x + 8} y={y + 46} className={`${!isRunning ? 'Amber' : ''} F36`}>
            {label}
        </text>
    </g>
);
