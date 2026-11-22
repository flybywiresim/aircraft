// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { VirtualCrewChecklistId } from '../../../../shared/src/VirtualCrew';
import { SimVarReader, VoiceLineId } from '../VirtualCrewTypes';
import { AUTOBRAKE_ARMED_MODE_RTO, CockpitControls, CockpitStates } from '../CockpitControls';
import { BriefedAntiIce, BriefingVars } from '../briefing/BriefingData';
import { autobrakeWords, minimumWords } from '../speech/Phrases';

/** State of the crew read like simulator variables by the verifications of the items */
export const CrewVars = {
  /** 1 if the flight control check has been performed in this flight */
  FlightControlsChecked: 'VCREW:FLIGHT_CONTROLS_CHECKED',
} as const;

/** An item of a normal checklist of the ECL */
export interface ChecklistItem {
  /** Item as displayed on the ECL */
  name: string;
  /** Challenge read by the pilot monitoring, undefined for a sub headline */
  challenge?: VoiceLineId;
  /** Response of the pilot flying, can be composed from the state of the aircraft (e.g. "two hundred, radio, set") */
  response: VoiceLineId | ((read: SimVarReader) => VoiceLineId[]);
  /**
   * True if the item is sensed by the FWS: the ECL checks it automatically when the condition is met, the pilot
   * monitoring only confirms it on the ECL.
   */
  sensed: boolean;
  /**
   * The ECL response ends with "(BOTH)": both pilots respond, the pilot flying first, then the pilot monitoring with
   * the same words once they have verified the item
   */
  both?: boolean;
  /**
   * Verification of the item by the pilot monitoring, looking at the cockpit. A non sensed item is accepted if not
   * defined. A sensed item is accepted when the ECL or this verification shows it, so that a delayed ECL state does
   * not cause a false discrepancy.
   */
  verify?: (read: SimVarReader) => boolean;
  /** Sub headline of the ECL, not read and not checked */
  headline?: boolean;
  /**
   * The item stands for the ECAM memo (sub headline "T.O" or "LDG" of the ECL): it is read as one item ("ECAM memo"
   * ... "takeoff, no blue") for this number of sensed items following it, which are verified together and not read
   */
  memoItems?: number;
  /** Actions of the pilot monitoring while reading the item, e.g. pressing T.O CONFIG */
  actionsWhenRead?: ReturnType<typeof CockpitControls.takeoffConfigTest>;
}

export interface Checklist {
  id: VirtualCrewChecklistId;
  /** ID of the normal checklist in the ECL (EcamNormalProcedures) */
  eclId: number;
  /** Announcement of the pilot flying when requesting the checklist */
  request: VoiceLineId;
  /** Announcement of the pilot monitoring when the checklist is completed */
  complete: VoiceLineId;
  /** The items, in the order of the ECL, sub headlines included */
  items: ChecklistItem[];
}

/** An item of the ECAM memo, sensed by the FWS, verified with the memo item and not read */
const memoItem = (name: string, verify?: ChecklistItem['verify']): ChecklistItem => ({
  name,
  response: 'respChecked',
  sensed: true,
  headline: true,
  verify,
});

const isOn = (read: SimVarReader, name: string) => read(name) === 1;

const enginesAntiIceOn = (read: SimVarReader) =>
  [1, 2, 3, 4].every((engine) => isOn(read, CockpitStates.engineAntiIce(engine)));

/** Flaps lever positions of the takeoff configurations: 1 (1+F), 2 and 3 */
const takeoffConfigResponse = (read: SimVarReader): VoiceLineId[] => {
  switch (read(CockpitStates.flapsLever)) {
    case 1:
      return ['respConfOnePlusF'];
    case 2:
      return ['respConfTwo'];
    case 3:
      return ['respConfThree'];
    default:
      return ['respSet'];
  }
};

/** ECL "COCKPIT PREPARATION", the part of the before start checklist down to the line */
export const CockpitPreparationChecklist: Checklist = {
  id: 'cockpitPreparation',
  eclId: 1000001,
  request: 'cockpitPreparationChecklist',
  complete: 'cockpitPreparationChecklistComplete',
  items: [
    { name: 'GEAR PINS & COVERS', challenge: 'clGearPinsAndCovers', response: 'respRemoved', sensed: false },
    { name: 'FUEL QUANTITY', challenge: 'clFuelQuantity', response: 'respChecked', sensed: false },
    {
      name: 'SEAT BELTS',
      challenge: 'clSeatBelts',
      response: 'respOn',
      sensed: true,
      verify: (read) => isOn(read, CockpitStates.seatBelts),
    },
    { name: 'BARO REF', challenge: 'clBaroRef', response: 'respSet', both: true, sensed: false },
  ],
};

/** ECL "BEFORE START", the part of the before start checklist below the line */
export const BeforeStartChecklist: Checklist = {
  id: 'beforeStart',
  eclId: 1000002,
  request: 'beforeStartChecklist',
  complete: 'beforeStartChecklistComplete',
  items: [
    {
      name: 'PARKING BRAKE',
      challenge: 'clParkingBrake',
      response: 'respSet',
      sensed: false,
      verify: (read) => read(CockpitStates.parkingBrake) === 1,
    },
    {
      name: 'T.O SPEEDS & THRUST',
      challenge: 'clTakeoffSpeedsAndThrust',
      response: 'respSet',
      both: true,
      sensed: false,
      verify: (read) =>
        read('L:AIRLINER_V1_SPEED') > 0 && read('L:AIRLINER_VR_SPEED') > 0 && read('L:AIRLINER_V2_SPEED') > 0,
    },
    {
      name: 'BEACON',
      challenge: 'clBeacon',
      response: 'respOn',
      sensed: true,
      verify: (read) => isOn(read, CockpitStates.beacon),
    },
  ],
};

/** ECL "AFTER START" */
export const AfterStartChecklist: Checklist = {
  id: 'afterStart',
  eclId: 1000003,
  request: 'afterStartChecklist',
  complete: 'afterStartChecklistComplete',
  items: [
    {
      name: 'ANTI ICE',
      challenge: 'clAntiIce',
      response: (read) => [enginesAntiIceOn(read) ? 'respOn' : 'respOff'],
      sensed: false,
      // as briefed (the anti ice is a decision of the captain, recorded in the takeoff briefing)
      verify: (read) => {
        switch (read(BriefingVars.AntiIce) as BriefedAntiIce) {
          case BriefedAntiIce.Off:
            return !enginesAntiIceOn(read) && !isOn(read, CockpitStates.wingAntiIce);
          case BriefedAntiIce.Engines:
            return enginesAntiIceOn(read);
          case BriefedAntiIce.EnginesAndWings:
            return enginesAntiIceOn(read) && isOn(read, CockpitStates.wingAntiIce);
          default:
            return true;
        }
      },
    },
    { name: 'PITCH TRIM', challenge: 'clPitchTrim', response: 'respSetForTakeoff', sensed: false },
    {
      name: 'RUDDER TRIM',
      challenge: 'clRudderTrim',
      response: 'respNeutral',
      sensed: true,
      // neutral for the FWS: below 0.35 degrees
      verify: (read) => Math.abs(read(CockpitStates.rudderTrim)) < (0.35 * Math.PI) / 180,
    },
  ],
};

/** ECL "TAXI", the before takeoff checklist down to the line */
export const TaxiChecklist: Checklist = {
  id: 'taxi',
  eclId: 1000004,
  request: 'taxiChecklist',
  complete: 'taxiChecklistComplete',
  items: [
    {
      name: 'FLIGHT CONTROLS',
      challenge: 'clFlightControls',
      response: 'respChecked',
      both: true,
      sensed: false,
      verify: (read) => read(CrewVars.FlightControlsChecked) === 1,
    },
    {
      name: 'FLAPS SETTING',
      challenge: 'clFlapsSetting',
      response: takeoffConfigResponse,
      both: true,
      sensed: false,
      verify: (read) => read(CockpitStates.flapsLever) >= 1 && read(CockpitStates.flapsLever) <= 3,
    },
    { name: 'RADAR', challenge: 'clRadar', response: 'respOn', sensed: false },
    {
      name: 'T.O',
      challenge: 'clEcamMemo',
      response: 'respTakeoffNoBlue',
      sensed: true,
      memoItems: 5,
      // the pilot monitoring presses T.O CONFIG while reading the memo, the FWS senses the result
      actionsWhenRead: CockpitControls.takeoffConfigTest(),
    },
    memoItem('SEAT BELTS', (read) => isOn(read, CockpitStates.seatBelts)),
    memoItem('GND SPLRs', (read) => isOn(read, CockpitStates.groundSpoilersArmed)),
    memoItem('FLAPS', (read) => read(CockpitStates.flapsLever) >= 1 && read(CockpitStates.flapsLever) <= 3),
    memoItem('AUTO BRK', (read) => read(CockpitStates.autobrakeArmedMode) === AUTOBRAKE_ARMED_MODE_RTO),
    memoItem('T.O CONFIG'),
  ],
};

/** ECL "LINE-UP", the before takeoff checklist below the line */
export const LineUpChecklist: Checklist = {
  id: 'lineUp',
  eclId: 1000005,
  request: 'lineUpChecklist',
  complete: 'lineUpChecklistComplete',
  items: [
    { name: 'T.O RWY', challenge: 'clTakeoffRunway', response: 'respConfirmed', both: true, sensed: false },
    { name: 'PACK 1 & 2', challenge: 'clPacks', response: 'respOn', sensed: false },
  ],
};

/** ECL "APPROACH" */
export const ApproachChecklist: Checklist = {
  id: 'approach',
  eclId: 1000010,
  request: 'approachChecklist',
  complete: 'approachChecklistComplete',
  items: [
    { name: 'BARO REF', challenge: 'clBaroRef', response: 'respSet', both: true, sensed: false },
    {
      name: 'SEAT BELTS',
      challenge: 'clSeatBelts',
      response: 'respOn',
      sensed: true,
      verify: (read) => isOn(read, CockpitStates.seatBelts),
    },
    {
      name: 'MINIMUM',
      challenge: 'clMinimum',
      // the minimum of the FMS, baro (MDA) or radio (DH)
      response: (read) => [
        ...minimumWords(read(CockpitStates.minimumDescentAltitude), read(CockpitStates.decisionHeight)),
        'respSet',
      ],
      sensed: false,
      verify: (read) => read(CockpitStates.minimumDescentAltitude) > 0 || read(CockpitStates.decisionHeight) >= 0,
    },
    {
      name: 'AUTO BRAKE',
      challenge: 'clAutobrake',
      response: (read) => autobrakeWords(read(CockpitStates.autobrakeSelector)),
      sensed: false,
      verify: (read) => {
        const briefed = read(BriefingVars.Autobrake);
        return briefed < 0
          ? read(CockpitStates.autobrakeSelector) > 0
          : read(CockpitStates.autobrakeSelector) === briefed;
      },
    },
  ],
};

/** ECL "LANDING" */
export const LandingChecklist: Checklist = {
  id: 'landing',
  eclId: 1000012,
  request: 'landingChecklist',
  complete: 'landingChecklistComplete',
  items: [
    { name: 'LDG', challenge: 'clEcamMemo', response: 'respLandingNoBlue', sensed: true, memoItems: 4 },
    memoItem('SEAT BELTS', (read) => isOn(read, CockpitStates.seatBelts)),
    memoItem('LDG GEAR', (read) => read(CockpitStates.gearLever) > 0.5),
    memoItem('GND SPLRs', (read) => isOn(read, CockpitStates.groundSpoilersArmed)),
    memoItem('FLAPS', (read) => read(CockpitStates.flapsLever) >= 3),
  ],
};

/** ECL "PARKING" */
export const ParkingChecklist: Checklist = {
  id: 'parking',
  eclId: 1000013,
  request: 'parkingChecklist',
  complete: 'parkingChecklistComplete',
  items: [
    {
      name: 'PARKING BRAKE OR CHOCKS',
      challenge: 'clParkingBrakeOrChocks',
      response: 'respSet',
      sensed: false,
      verify: (read) => read(CockpitStates.parkingBrake) === 1,
    },
    {
      name: 'ENGINES',
      challenge: 'clEngines',
      response: 'respOff',
      sensed: true,
      verify: (read) => [1, 2, 3, 4].every((engine) => read(CockpitStates.engineState(engine)) === 0),
    },
    {
      name: 'WING LIGHTS',
      challenge: 'clWingLights',
      response: 'respOff',
      sensed: false,
      verify: (read) => !isOn(read, CockpitStates.wingLights),
    },
    { name: 'FUEL PUMPs', challenge: 'clFuelPumps', response: 'respOff', sensed: true },
  ],
};

/** ECL "SECURING THE AIRCRAFT" */
export const SecuringChecklist: Checklist = {
  id: 'securing',
  eclId: 1000014,
  request: 'securingChecklist',
  complete: 'securingChecklistComplete',
  items: [
    { name: 'OXYGEN', challenge: 'clOxygen', response: 'respOff', sensed: true },
    { name: 'EMER EXIT LIGHT', challenge: 'clEmergencyExitLight', response: 'respOff', sensed: true },
    { name: 'EFBs', challenge: 'clEfbs', response: 'respOff', sensed: false },
    { name: 'BATTERIES', challenge: 'clBatteries', response: 'respOff', sensed: false },
  ],
};

/** The checklists, in the order of VirtualCrewChecklists */
export const Checklists: Checklist[] = [
  CockpitPreparationChecklist,
  BeforeStartChecklist,
  AfterStartChecklist,
  TaxiChecklist,
  LineUpChecklist,
  ApproachChecklist,
  LandingChecklist,
  ParkingChecklist,
  SecuringChecklist,
];
