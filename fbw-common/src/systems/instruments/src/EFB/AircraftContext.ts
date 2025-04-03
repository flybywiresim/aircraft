//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { createContext } from 'react';
import { LandingPerformanceCalculator } from '../../../shared/src/performance/landing';
import { TakeoffPerformanceCalculator } from '../../../shared/src/performance/takeoff';

interface PerformanceCalculators {
  takeoff: TakeoffPerformanceCalculator | null;
  landing: LandingPerformanceCalculator | null;
}

interface PushbackPage {
  turnIndicatorTuningDefault: number;
}
interface SettingsPages {
  autoCalloutsPage: React.ComponentType<any>;
  audio: AudioOptions;
  pinProgram: PinProgramOptions;
  realism: RealismOptions;
  sim: SimOptions;
  throttle: ThrottleOptions;
}

interface AudioOptions {
  announcements: boolean;
  boardingMusic: boolean;
  masterVolume: boolean;
  windVolume: boolean;
  engineVolume: boolean;
  paxAmbience: boolean;
  ptuCockpit: boolean;
}
interface PinProgramOptions {
  latLonExtend: boolean;
  paxSign: boolean;
  rmpVhfSpacing: boolean;
  satcom: boolean;
}

interface RealismOptions {
  mcduKeyboard: boolean;
  pauseOnTod: boolean;
  autoStepClimb: boolean;
  pilotAvatars: boolean;
  eclSoftKeys: boolean;
}

interface SimOptions {
  cones: boolean;
  msfsFplnSync: boolean;
  pilotSeat: boolean;
  registrationDecal: boolean;
  wheelChocks: boolean;
  cabinLighting: boolean;
  oansPerformanceMode: boolean;
}

interface ThrottleOptions {
  numberOfAircraftThrottles: number;
  axisOptions: number[];
  axisMapping: number[][][];
}
interface AircraftEfbContext {
  performanceCalculators: PerformanceCalculators;
  pushbackPage: PushbackPage;
  settingsPages: SettingsPages;
}

export const AircraftContext = createContext<AircraftEfbContext>({
  performanceCalculators: {
    takeoff: null,
    landing: null,
  },
  pushbackPage: {
    turnIndicatorTuningDefault: 0,
  },
  settingsPages: {
    audio: {
      announcements: false,
      boardingMusic: false,
      engineVolume: false,
      masterVolume: false,
      windVolume: false,
      ptuCockpit: false,
      paxAmbience: false,
    },
    pinProgram: {
      latLonExtend: false,
      paxSign: false,
      rmpVhfSpacing: false,
      satcom: false,
    },
    realism: {
      mcduKeyboard: false,
      pauseOnTod: false,
      autoStepClimb: false,
      pilotAvatars: false,
      eclSoftKeys: false,
    },
    sim: {
      cones: false,
      msfsFplnSync: false,
      pilotSeat: false,
      registrationDecal: false,
      wheelChocks: false,
      cabinLighting: false,
      oansPerformanceMode: false,
    },
    throttle: {
      numberOfAircraftThrottles: 0,
      axisOptions: [],
      axisMapping: [],
    },
    autoCalloutsPage: null,
  },
});
