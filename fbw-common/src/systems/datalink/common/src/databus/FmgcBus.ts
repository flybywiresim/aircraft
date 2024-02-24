//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Arinc429Word } from '@flybywiresim/fbw-sdk';

export interface FmgcDataBusTypes {
  flightNumber: string;
  presentPositionLatitude: Arinc429Word;
  presentPositionLongitude: Arinc429Word;
  presentAltitude: Arinc429Word;
  presentHeading: Arinc429Word;
  presentTrack: Arinc429Word;
  computedAirspeed: Arinc429Word;
  presentMach: Arinc429Word;
  groundSpeed: Arinc429Word;
  verticalSpeed: Arinc429Word;
  autopilotActive: Arinc429Word;
  autothrustMode: Arinc429Word;
  autothrustSelectedMach: Arinc429Word;
  autothrustSelectedKnots: Arinc429Word;
  windDirection: Arinc429Word;
  windSpeed: Arinc429Word;
  staticAirTemperature: Arinc429Word;
  flightPhase: Arinc429Word;
}
