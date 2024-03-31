// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ChecklistDefinition } from './index';
import {
    checkA32NXBatOff,
    checkA32NXEnginesOff,
    checkA32NXFuelPumpsOff,
    checkAdirsNav,
    checkBeaconOn, checkEmerExtLtOff, checkOxygenOff,
    checkRudderTrimReset,
    checkSeatBeltsOn,
    checkWingLtOff,
    checkWxOffPredWsOff,
    checkWxOnPredWsAuto,
    checkYellowEPumpOff,
} from './CheckItemStates';

export const cockpitPreparationChecklistA32NX: ChecklistDefinition = {
    name: 'COCKPIT PREPARATION',
    items: [
        { item: 'GEAR PINS & COVERS', action: 'REMOVE', result: 'REMOVED' },
        { item: 'FUEL QUANTITY', result: '_____ KG/LB' },
        { item: 'SEAT BELTS', result: 'ON', condition: () => checkSeatBeltsOn() },
        { item: 'ADIRS', result: 'NAV', condition: () => checkAdirsNav() },
        { item: 'BARO REF', result: '_____ (BOTH)' },
    ],
};

export const beforeStartChecklistA32NX: ChecklistDefinition = {
    name: 'BEFORE START',
    items: [
        { item: 'PARKING BRAKE', result: 'AS RQRD' },
        { item: 'T.O SPEEDS & THRUST', result: '_____ (BOTH)' },
        { item: 'WINDOWS', result: 'CLOSED (BOTH)' },
        { item: 'BEACON', result: 'ON', condition: () => checkBeaconOn() },
    ],
};

export const afterStartChecklistA32NX: ChecklistDefinition = {
    name: 'AFTER START',
    items: [
        { item: 'ANTI ICE', result: 'AS RQRD' },
        { item: 'ECAM STATUS', action: 'CHECK', result: 'CHECKED' },
        { item: 'PITCH TRIM', result: '_____%' },
        { item: 'RUDDER TRIM', result: 'NEUTRAL', condition: () => checkRudderTrimReset() },
    ],
};

export const taxiChecklistA32NX: ChecklistDefinition = {
    name: 'TAXI',
    items: [
        { item: 'FLIGHT CONTROL', result: 'CHECKED (BOTH)' },
        { item: 'FLAPS SETTING', result: 'CONF _____ (BOTH)' },
        { item: 'RADAR & PRED W/S', result: 'ON & AUTO', condition: () => checkWxOnPredWsAuto() },
        { item: 'ENG MODE SEL', result: 'AS RQRD' },
        { item: 'ECAM MEMO', result: 'TO NO BLUE' },
        { item: 'CABIN', result: 'READY' },
    ],
};

export const lineUpChecklistA32NX: ChecklistDefinition = {
    name: 'LINE-UP',
    items: [
        { item: 'T.O. RWY', result: '_____(BOTH)' },
        { item: 'TCAS', result: 'AS RQRD' },
        { item: 'PACKS 1 & 2', result: 'AS RQRD' },
    ],
};

export const approachChecklistA32NX: ChecklistDefinition = {
    name: 'APPROACH',
    items: [
        { item: 'BARO REF', result: '_____SET (BOTH)' },
        { item: 'SEAT BELTS', result: 'ON', condition: () => checkSeatBeltsOn() },
        { item: 'MINIMUM', result: 'AS RQRD' },
        { item: 'AUTO BRAKE', result: 'AS RQRD' },
        { item: 'ENG MODE SEL', result: 'AS RQRD' },
    ],
};

export const landingChecklistA32NX = {
    name: 'LANDING',
    items: [
        { item: 'ECAM MEMO', result: 'LDG NO BLUE' },
        { item: 'CABIN', result: 'READY' },
    ],
};

export const afterLandingChecklistA32NX: ChecklistDefinition = {
    name: 'AFTER LANDING',
    items: [
        { item: 'RADAR & PRED W/S', result: 'OFF', condition: () => checkWxOffPredWsOff() },
    ],
};

export const parkingChecklistA32NX: ChecklistDefinition = {
    name: 'PARKING',
    items: [
        { item: 'PARK BRK or CHOCKS', result: 'SET' },
        { item: 'ENGINES', result: 'OFF', condition: () => checkA32NXEnginesOff() },
        { item: 'WING LIGHTS', result: 'OFF', condition: () => checkWingLtOff() },
        { item: 'FUEL PUMPS', result: 'OFF', condition: () => checkA32NXFuelPumpsOff() },
        { item: 'YELLOW ELEC PUMP', result: 'OFF', condition: () => checkYellowEPumpOff() },
    ],
};

export const securingAircraftChecklistA32NX: ChecklistDefinition = {
    name: 'SECURING AIRCRAFT',
    items: [
        { item: 'OXYGEN', result: 'OFF', condition: () => checkOxygenOff() },
        { item: 'EMER EXIT LT', result: 'OFF', condition: () => checkEmerExtLtOff() },
        { item: 'BATTERIES', result: 'OFF', condition: () => checkA32NXBatOff() },
    ],
};
