// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { McduMessage, NXFictionalMessages } from '../../messages/NXSystemMessages';
import { AtsuMessageType } from '@datalink/common';
// FIXME rogue import from EFB
import { ISimbriefData } from '../../../../../../../../fbw-common/src/systems/instruments/src/EFB/Apis/Simbrief';
import { SimBriefUplinkAdapter } from '@fmgc/flightplanning/uplink/SimBriefUplinkAdapter';
import { SimbriefOfpState } from '../LegacyFmsPageInterface';

// FIXME move all to ATSU (systems host)

export function translateAtsuMessageType(type: AtsuMessageType) {
  switch (type) {
    case AtsuMessageType.Freetext:
      return 'FREETEXT';
    case AtsuMessageType.METAR:
      return 'METAR';
    case AtsuMessageType.TAF:
      return 'TAF';
    case AtsuMessageType.ATIS:
      return 'ATIS';
    default:
      return 'UNKNOWN';
  }
}

export function fetchTimeValue() {
  let timeValue = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');
  if (timeValue) {
    const seconds = Number.parseInt(timeValue);
    const displayTime = Utils.SecondsToDisplayTime(seconds, true, true, false);
    timeValue = displayTime.toString();
    return timeValue.substring(0, 5);
  }
  return null;
}

/**
 *  Converts lbs to kg
 * @param {string | number} value
 */
const lbsToKg = (value) => {
  return (+value * 0.4535934).toString();
};

/**
 * Fetch SimBrief OFP data and store on FMCMainDisplay object
 */
export const getSimBriefOfp = (
  // TODO fix this type
  mcdu: {
    simbrief: any;
    simbriefOfpState: SimbriefOfpState;
    simbriefOfp: ISimbriefData;
    setScratchpadMessage(m: McduMessage);
  },
  updateView: () => void,
  callback = () => {},
): Promise<ISimbriefData> => {
  const navigraphUsername = NXDataStore.get('NAVIGRAPH_USERNAME', '');
  const overrideSimBriefUserID = NXDataStore.get('CONFIG_OVERRIDE_SIMBRIEF_USERID', '');

  if (!navigraphUsername && !overrideSimBriefUserID) {
    mcdu.setScratchpadMessage(NXFictionalMessages.noNavigraphUser);
    throw new Error('No Navigraph username provided');
  }

  mcdu.simbrief['sendStatus'] = 'REQUESTING';
  mcdu.simbriefOfpState = SimbriefOfpState.Requested;

  updateView();

  return SimBriefUplinkAdapter.downloadOfpForUserID(navigraphUsername, overrideSimBriefUserID)
    .then((data) => {
      mcdu.simbriefOfp = data;
      mcdu.simbriefOfpState = SimbriefOfpState.Loaded;
      mcdu.simbrief['units'] = data.units;
      mcdu.simbrief['route'] = data.route;
      mcdu.simbrief['cruiseAltitude'] = data.cruiseAltitude;
      mcdu.simbrief['originIcao'] = data.origin.icao;
      mcdu.simbrief['originTransAlt'] = data.origin.transAlt;
      mcdu.simbrief['originTransLevel'] = data.origin.transLevel;
      mcdu.simbrief['destinationIcao'] = data.destination.icao;
      mcdu.simbrief['destinationTransAlt'] = data.destination.transAlt;
      mcdu.simbrief['destinationTransLevel'] = data.destination.transLevel;
      mcdu.simbrief['blockFuel'] = mcdu.simbrief['units'] === 'kgs' ? data.fuel.planRamp : lbsToKg(data.fuel.planRamp);
      mcdu.simbrief['payload'] =
        mcdu.simbrief['units'] === 'kgs' ? data.weights.payload : lbsToKg(data.weights.payload);
      mcdu.simbrief['estZfw'] =
        mcdu.simbrief['units'] === 'kgs' ? data.weights.estZeroFuelWeight : lbsToKg(data.weights.estZeroFuelWeight);
      mcdu.simbrief['paxCount'] = data.weights.passengerCount;
      mcdu.simbrief['bagCount'] = data.weights.bagCount;
      mcdu.simbrief['paxWeight'] = data.weights.passengerWeight;
      mcdu.simbrief['bagWeight'] = data.weights.bagWeight;
      mcdu.simbrief['freight'] = data.weights.freight;
      mcdu.simbrief['cargo'] = data.weights.cargo;
      mcdu.simbrief['costIndex'] = data.costIndex;
      mcdu.simbrief['navlog'] = data.navlog;
      mcdu.simbrief['callsign'] = data.flightNumber;
      let alternate = data.alternate;
      if (Array.isArray(data.alternate)) {
        alternate = data.alternate[0];
      }
      mcdu.simbrief['alternateIcao'] = alternate.icao;
      mcdu.simbrief['alternateTransAlt'] = alternate.transAlt;
      mcdu.simbrief['alternateTransLevel'] = alternate.transLevel;
      mcdu.simbrief['alternateAvgWindDir'] = alternate.averageWindDirection;
      mcdu.simbrief['alternateAvgWindSpd'] = alternate.averageWindSpeed;
      mcdu.simbrief['avgTropopause'] = data.averageTropopause;
      mcdu.simbrief['ete'] = data.times.estTimeEnroute;
      mcdu.simbrief['blockTime'] = data.times.estBlock;
      mcdu.simbrief['outTime'] = data.times.estOut;
      mcdu.simbrief['onTime'] = data.times.estOn;
      mcdu.simbrief['inTime'] = data.times.estIn;
      mcdu.simbrief['offTime'] = data.times.estOff;
      mcdu.simbrief['taxiFuel'] = mcdu.simbrief['units'] === 'kgs' ? data.fuel.taxi : lbsToKg(data.fuel.taxi);
      mcdu.simbrief['tripFuel'] =
        mcdu.simbrief['units'] === 'kgs' ? data.fuel.enrouteBurn : lbsToKg(data.fuel.enrouteBurn);
      mcdu.simbrief['sendStatus'] = 'DONE';

      callback();

      updateView();

      return data;
    })
    .catch((err) => {
      mcdu.simbrief['sendStatus'] = 'READY';
      updateView();

      // we need to rethrow so the upstream thing can handle it, otherwise its promise will resolve with bad data.
      throw err;
    });
};
