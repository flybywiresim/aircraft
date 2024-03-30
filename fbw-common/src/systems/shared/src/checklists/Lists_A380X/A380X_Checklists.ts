// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ChecklistDefinition, ChecklistItemType } from '../../../../instruments/src/EFB/Checklists/Checklists';
import {
    checkA380XBatOff,
    checkA380XEnginesOff,
    checkA380XFuelPumpsOff,
    checkA380XLdgGearDown,
    checkA380XLdgGearUp,
    checkAdirsNav,
    checkAdirsOff,
    checkAPUMasterOff,
    checkAPUStarted,
    checkAutobrakeRTOArmed,
    checkBaroStd,
    checkBeaconOn,
    checkFlapsUp,
    checkLandingLightsOff,
    checkOxygenOff,
    checkParkingBrakeOn,
    checkRudderTrimReset,
    checkSeatBeltsOn,
    checkSignsOff,
    checkSignsOn,
    checkSpoilerArmed,
} from '../../../../instruments/src/EFB/Checklists/CheckItemStates';

export const beforeStartChecklistA380X: ChecklistDefinition = {
    name: 'BEFORE START',
    items: [
        // { item: 'SECURITY INSPECTION', action: 'COMPLETE', result: 'COMPLETED' },
        { item: 'CKPT PREP', action: 'COMPLETE', result: 'COMPLETED' },
        { item: 'OXYGEN', result: '___ SET' },
        { item: 'GEAR PINGS & COVERS', action: 'REMOVE', result: 'REMOVED' },
        { item: 'FUEL QTY', action: 'CHECK', result: 'CHECKED' },
        { item: 'TAKEOFF DATA', result: 'SET' },
        { item: 'ALTIMETERS', action: 'QNH___ COMPARE (BOTH)', result: 'SET' },
        { item: 'PARK BRK', result: 'ON', condition: () => checkParkingBrakeOn() },
        { item: 'SIGNS', result: 'ON', condition: () => checkSignsOn() },
        { item: 'ADIRS NAV', result: 'ON', condition: () => checkAdirsNav() },
        { type: ChecklistItemType.LINE, item: '', result: '' },
        { item: 'WINDOWS & DOORS', action: 'CLOSE (BOTH)', result: 'CLOSED' },
        { item: 'BEACON', result: 'ON', condition: () => checkBeaconOn() },

        // from ECL screenshots - not used in paper checklist
        // { item: 'FD', result: '1FD2', condition: () => checkFDsOn() },
        // { item: 'BARO REF VALUE', result: 'SET' },
        // { item: 'THRUST LEVERS', result: 'IDLE' },
    ],
};

export const afterStartChecklistA380X: ChecklistDefinition = {
    name: 'AFTER START',
    items: [
        { item: 'ANTI ICE', result: 'AS RQRD' },
        { item: 'F/CTL', action: 'CHECK', result: 'CHECKED' },
        { item: 'RUDDER TRIM', result: 'NEUTRAL', condition: () => checkRudderTrimReset() },
        { item: 'PITCH TRIM', action: 'CHECK', result: 'CHECKED' },
        { item: 'GROUND EQUIPMENT', action: 'CLEAR', result: 'CLEARED' },
    ],
};

export const beforeTakeoffChecklistA380X: ChecklistDefinition = {
    name: 'BEFORE TAKEOFF',
    items: [
        { item: 'FLIGHT INSTRUMENTS', action: 'CHECK', result: 'CHECKED' },
        { item: 'BRIEFING', action: 'CONFIRM', result: 'CONFIRMED' },
        { item: 'V1 /VR / V2 / THR RATING', action: 'CHECK (BOTH)', result: 'CHECKED' },
        { type: ChecklistItemType.SUBLISTHEADER, item: 'T.O', result: '' },
        { type: ChecklistItemType.SUBLISTITEM, item: 'SIGNS', result: 'ON', condition: () => checkSignsOn() },
        { type: ChecklistItemType.SUBLISTITEM, item: 'SPLRS', action: 'ARM', result: 'ARMED', condition: () => checkSpoilerArmed() },
        { type: ChecklistItemType.SUBLISTITEM, item: 'FLAPS', result: 'T.O' },
        { type: ChecklistItemType.SUBLISTITEM, item: 'AUTO BRK', result: 'RTO', condition: () => checkAutobrakeRTOArmed() },
        { type: ChecklistItemType.SUBLISTITEM, item: 'T.O CONFIG', action: 'TEST', result: 'TESTED' },
        { type: ChecklistItemType.LINE, item: '', result: '' },
        { item: 'CABIN CREW', result: 'READY' },
        { item: 'PACK 1+2', result: 'AS REQUIRED' },
        { item: 'EXTERIOR LIGHTS', result: 'SET' },

        // { item: 'SQUAWK', result: 'SET' },
    ],
};

export const afterTakeoffChecklistA380X: ChecklistDefinition = {
    name: 'AFTER TAKEOFF / CLIMB',
    items: [
        { item: 'LDG GEAR', result: 'UP', condition: () => checkA380XLdgGearUp() },
        { item: 'FLAPS', result: '0', condition: () => checkFlapsUp() },
        { item: 'PACKS 1+2', result: 'AS RQRD' },
        { item: 'APU MASTER', result: 'OFF', condition: () => checkAPUMasterOff() },
        { type: ChecklistItemType.LINE, item: '', result: '' },
        { item: 'LANDING LIGHTS', result: 'OFF', condition: () => checkLandingLightsOff() },
        { item: 'BARO REF STD', result: 'SET (BOTH)', condition: () => checkBaroStd() },
    ],
};

export const approachChecklistA380X: ChecklistDefinition = {
    name: 'APPROACH',
    items: [
        { item: 'CABIN CREW', action: 'ADVISE', result: 'ADVISED' },
        { item: 'LANDING DATA', result: 'SET' },
        { item: 'AUTOBRAKE/BTV', result: 'AS REQUIRED' },
        { item: 'LANDING BRIEFING', action: 'CONFIRM', result: 'CONFIRMED' },
        { item: 'ECAM STS', result: 'NORMAL' },
        { item: 'ALTIMETER', result: '___ QNH/HPA SET' },
        { item: 'LANDING LIGHT', result: 'ON' },
        { item: 'MINIMA', result: 'SET' },
        { item: 'SEAT BELTS', result: 'ON', condition: () => checkSeatBeltsOn() },
    ],
};

export const landingChecklistA380X = {
    name: 'LANDING',
    items: [
        { item: 'A/THR MODE', result: 'SPEED/OFF' },
        { type: ChecklistItemType.SUBLISTHEADER, item: 'LDG', result: '' },
        { type: ChecklistItemType.SUBLISTITEM, item: 'SIGNS', result: 'ON', condition: () => checkSignsOn() },
        { type: ChecklistItemType.SUBLISTITEM, item: 'LDG GEAR', result: 'DOWN', condition: () => checkA380XLdgGearDown() },
        { type: ChecklistItemType.SUBLISTITEM, item: 'FLAPS', result: 'LDG' },
        { type: ChecklistItemType.SUBLISTITEM, item: 'SPLRs', result: 'ARM', condition: () => checkSpoilerArmed() },
    ],
};

export const afterLandingChecklistA380X: ChecklistDefinition = {
    name: 'AFTER LANDING',
    items: [
        { item: 'EXTERIOR LIGHTS', result: 'SET' },
        { item: 'SPLRS', action: 'DISARM', result: 'DISARMED', condition: () => !checkSpoilerArmed() },
        { item: 'FLAPS', result: '0', condition: () => checkFlapsUp() },
        { item: 'APU', action: 'START', result: 'STARTED', condition: () => checkAPUStarted() },
    ],
};

export const parkingChecklistA380X: ChecklistDefinition = {
    name: 'PARKING',
    items: [
        { item: 'PARK BRK or CHOCKS', result: 'AS RQRD' },
        { item: 'EXT LT', result: 'AS RQRD' },
        { item: 'APU BLEED', result: 'ON' },
        { item: 'ALL ENGs OFF', result: 'OFF', condition: () => checkA380XEnginesOff() },
        { item: 'FUEL PMPs', result: 'OFF', condition: () => checkA380XFuelPumpsOff() },
        { item: 'SEAT BELTS', result: 'OFF', condition: () => !checkSeatBeltsOn() },
    ],
};

export const securingAircraftChecklistA380X: ChecklistDefinition = {
    name: 'SECURING AIRCRAFT',
    items: [
        { item: 'ADIRS', result: 'OFF', condition: () => checkAdirsOff() },
        { item: 'OXYGEN', result: 'OFF', condition: () => checkOxygenOff() },
        { item: 'SIGNS', result: 'OFF', condition: () => checkSignsOff() },
        { item: 'APU', result: 'OFF', condition: () => checkAPUMasterOff() },
        { item: 'LAPTOPS', result: 'OFF' },
        { item: 'BATTERIES', result: 'OFF', condition: () => checkA380XBatOff() },
    ],
};
