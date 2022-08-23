// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useState } from 'react';
import { A320Failure, Failure, FailuresOrchestrator } from '@failures';
import { useUpdate } from '@flybywiresim/fbw-sdk';

interface FailuresOrchestratorContext {
    allFailures: Readonly<Readonly<Failure>[]>,
    activeFailures: Set<number>,
    changingFailures: Set<number>,
    activate(identifier: number): Promise<void>;
    deactivate(identifier: number): Promise<void>;
}

const createOrchestrator = () => new FailuresOrchestrator('A32NX', [
    [22, A320Failure.Fac1Failure, 'FAC 1'],
    [22, A320Failure.Fac2Failure, 'FAC 2'],

    [24, A320Failure.TransformerRectifier1, 'TR 1'],
    [24, A320Failure.TransformerRectifier2, 'TR 2'],
    [24, A320Failure.TransformerRectifierEssential, 'ESS TR'],
    [24, A320Failure.StaticInverter, 'Static Inverter'],
    [24, A320Failure.Generator1, 'Generator 1'],
    [24, A320Failure.Generator2, 'Generator 2'],
    [24, A320Failure.ApuGenerator1, 'APU Generator'],
    [24, A320Failure.AlternatingCurrent1, 'AC 1'],
    [24, A320Failure.AlternatingCurrent2, 'AC 2'],
    [24, A320Failure.AlternatingCurrentEssential, 'AC ESS'],
    [24, A320Failure.AlternatingCurrentEssentialShed, 'AC ESS SCHED'],
    [24, A320Failure.AlternatingCurrentStaticInverter, 'AC STAT INV'],
    [24, A320Failure.AlternatingCurrentGndFltService, 'AC GND FLT SRV'],
    [24, A320Failure.DirectCurrent1, 'DC 1'],
    [24, A320Failure.DirectCurrent2, 'DC 2'],
    [24, A320Failure.DirectCurrentEssential, 'DC ESS'],
    [24, A320Failure.DirectCurrentEssentialShed, 'DC ESS SCHED'],
    [24, A320Failure.DirectCurrentBattery, 'DC BAT'],
    [24, A320Failure.DirectCurrentHot1, 'DC HOT 1'],
    [24, A320Failure.DirectCurrentHot2, 'DC HOT 2'],
    [24, A320Failure.DirectCurrentGndFltService, 'DC GND FLT SRV'],

    [27, A320Failure.Elac1Failure, 'ELAC 1'],
    [27, A320Failure.Elac2Failure, 'ELAC 2'],
    [27, A320Failure.Sec1Failure, 'SEC 1'],
    [27, A320Failure.Sec2Failure, 'SEC 2'],
    [27, A320Failure.Sec3Failure, 'SEC 3'],
    [27, A320Failure.Fcdc1Failure, 'FCDC 1'],
    [27, A320Failure.Fcdc2Failure, 'FCDC 2'],

    [29, A320Failure.GreenReservoirLeak, 'Green reservoir leak'],
    [29, A320Failure.BlueReservoirLeak, 'Blue reservoir leak'],
    [29, A320Failure.YellowReservoirLeak, 'Yellow reservoir leak'],
    [29, A320Failure.GreenReservoirAirLeak, 'Green reservoir air leak'],
    [29, A320Failure.BlueReservoirAirLeak, 'Blue reservoir air leak'],
    [29, A320Failure.YellowReservoirAirLeak, 'Yellow reservoir air leak'],
    [29, A320Failure.GreenReservoirReturnLeak, 'Green reservoir return leak'],
    [29, A320Failure.BlueReservoirReturnLeak, 'Blue reservoir return leak'],
    [29, A320Failure.YellowReservoirReturnLeak, 'Yellow reservoir return leak'],
    [29, A320Failure.GreenEdpOverheat, 'Green engine pump overheat'],
    [29, A320Failure.BlueEpumpOverheat, 'Blue electric pump overheat'],
    [29, A320Failure.YellowEdpOverheat, 'Yellow engine pump overheat'],
    [29, A320Failure.YellowEpumpOverheat, 'Yellow electric pump overheat'],

    [31, A320Failure.LeftPfdDisplay, 'Captain PFD display'],
    [31, A320Failure.RightPfdDisplay, 'F/O PFD display'],
    [31, A320Failure.FlightWarningComputer1, 'FWC 1'],
    [31, A320Failure.FlightWarningComputer2, 'FWC 2'],

    [32, A320Failure.LgciuPowerSupply1, 'LGCIU 1 Power supply'],
    [32, A320Failure.LgciuPowerSupply2, 'LGCIU 2 Power supply'],
    [32, A320Failure.LgciuInternalError1, 'LGCIU 1 Internal error'],
    [32, A320Failure.LgciuInternalError2, 'LGCIU 2 Internal error'],

    [32, A320Failure.GearProxSensorDamageGearUplockNose1, 'Proximity sensor damage uplock nose gear #1'],
    [32, A320Failure.GearProxSensorDamageGearDownlockNose2, 'Proximity sensor damage downlock nose gear #2'],
    [32, A320Failure.GearProxSensorDamageGearUplockRight1, 'Proximity sensor damage uplock right gear #1'],
    [32, A320Failure.GearProxSensorDamageGearDownlockRight2, 'Proximity sensor damage downlock right gear #2'],
    [32, A320Failure.GearProxSensorDamageGearUplockLeft2, 'Proximity sensor damage uplock left gear #2'],
    [32, A320Failure.GearProxSensorDamageGearDownlockLeft1, 'Proximity sensor damage downlock left gear #1'],
    [32, A320Failure.GearProxSensorDamageGearDoorClosedNose1, 'Proximity sensor damage closed nose gear door #1'],
    [32, A320Failure.GearProxSensorDamageGearDoorOpenedNose2, 'Proximity sensor damage opened nose gear door #2'],
    [32, A320Failure.GearProxSensorDamageGearDoorClosedRight2, 'Proximity sensor damage closed right gear door #2'],
    [32, A320Failure.GearProxSensorDamageGearDoorOpenedRight1, 'Proximity sensor damage opened right gear door #1'],
    [32, A320Failure.GearProxSensorDamageGearDoorClosedLeft2, 'Proximity sensor damage closed left gear door #2'],
    [32, A320Failure.GearProxSensorDamageGearDoorOpenedLeft1, 'Proximity sensor damage opened left gear door #1'],

    [32, A320Failure.GearActuatorJammedGearNose, 'Nose gear jammed actuator'],
    [32, A320Failure.GearActuatorJammedGearLeft, 'Main left gear jammed actuator'],
    [32, A320Failure.GearActuatorJammedGearRight, 'Main right gear jammed actuator'],
    [32, A320Failure.GearActuatorJammedGearDoorNose, 'Nose gear door jammed actuator'],
    [32, A320Failure.GearActuatorJammedGearDoorLeft, 'Main left gear door jammed actuator'],
    [32, A320Failure.GearActuatorJammedGearDoorRight, 'Main right gear door jammed actuator'],

    [32, A320Failure.GreenBrakeHydraulicLeak, 'Green brakes circuit leak'],
    [32, A320Failure.YellowBrakeHydraulicLeak, 'Yellow brakes circuit leak'],
    [32, A320Failure.YellowBrakeAccumulatorGasLeak, 'Yellow brake accumulator gas leak'],

    [34, A320Failure.RadioAltimeter1, 'RA 1'],
    [34, A320Failure.RadioAltimeter2, 'RA 2'],
]);

const Context = React.createContext<FailuresOrchestratorContext>({
    allFailures: [],
    activeFailures: new Set<number>(),
    changingFailures: new Set<number>(),
    activate: () => Promise.resolve(),
    deactivate: () => Promise.resolve(),
});

export const FailuresOrchestratorProvider = ({ children }) => {
    const [orchestrator] = useState(createOrchestrator);

    const [allFailures] = useState(() => orchestrator.getAllFailures());
    const [activeFailures, setActiveFailures] = useState<Set<number>>(() => new Set<number>());
    const [changingFailures, setChangingFailures] = useState<Set<number>>(() => new Set<number>());

    useUpdate(() => {
        orchestrator.update();

        const af = orchestrator.getActiveFailures();
        if (!areEqual(activeFailures, af)) {
            setActiveFailures(af);
        }

        const cf = orchestrator.getChangingFailures();
        if (!areEqual(changingFailures, cf)) {
            setChangingFailures(cf);
        }
    });

    return (
        <Context.Provider
            value={{
                allFailures,
                activeFailures,
                changingFailures,
                activate: (identifier) => orchestrator.activate(identifier),
                deactivate: (identifier) => orchestrator.deactivate(identifier),
            }}
        >
            {children}
        </Context.Provider>
    );
};

export function useFailuresOrchestrator() {
    const context = React.useContext(Context);
    if (context === undefined) {
        throw new Error('useFailuresOrchestrator must be used within a FailuresOrchestratorProvider');
    }

    return context;
}

function areEqual<T>(as: Set<T>, bs: Set<T>) {
    if (as.size !== bs.size) return false;
    for (const a of as) {
        if (!bs.has(a)) {
            return false;
        }
    }

    return true;
}
