// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  IndexedEventType,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';
// FIXME systems should not import from instruments
import { VdSymbol } from '../../../instruments/src/NavigationDisplay';

/**
 * Transmitted from FMS
 */
export interface BaseFmsData {
  /** Selected origin airport. */
  fmsOrigin: string | null;
  /** Selected destination airport. */
  fmsDestination: string | null;
  /** Selected alternate airport. */
  fmsAlternate: string | null;
  /** Identifier of departure runway. */
  fmsDepartureRunway: string | null;
  /** Identifier of landing runway selected through FMS. */
  fmsLandingRunway: string | null;
  /** Flight number entered on INIT page */
  fmsFlightNumber: string | null;
  /** A429 raw value */
  fmZeroFuelWeight: number;
  /** A429 raw value */
  fmZeroFuelWeightCg: number;
  /** A429 raw value */
  fmLandingElevation: number;
  fmGrossWeight: number;
  /** Symbols displayed on VD */
  vdSymbols_L: VdSymbol[];
  vdSymbols_R: VdSymbol[];
  /** HUD synthetic runway symbols */
  gradient: number | null;
  location: string | null;
  direction: number | null;
  startLocation: string | null;
  thresholdLocation: string | null;
  thresholdCrossingHeight: number | null;
  latitude: number | null;
  longitude: number | null;
  elevation: number | null;
  length: number | null;
  width: number | null;
  srwyP1: string | null;
  srwyP2: string | null;
  srwyP3: string | null;
  srwyP4: string | null;
  srwyP5: string | null;
  srwyP6: string | null;
  srwyP7: string | null;
  srwyP8: string | null;
  srwyP9: string | null;
}

type IndexedTopics = 'fmZeroFuelWeight' | 'fmZeroFuelWeightCg' | 'fmLandingElevation';
type FmsIndexedEvents = {
  [P in keyof Pick<BaseFmsData, IndexedTopics> as IndexedEventType<P>]: BaseFmsData[P];
};

export interface FmsData extends BaseFmsData, FmsIndexedEvents {}

/** A publisher to poll and publish nav/com simvars. */
export class FmsDataPublisher extends SimVarPublisher<FmsData> {
  private static simvars = new Map<keyof FmsData, SimVarPublisherEntry<any>>([
    ['fmZeroFuelWeight', { name: 'L:A32NX_FM#index#_ZERO_FUEL_WEIGHT', type: SimVarValueType.Number, indexed: true }],
    [
      'fmZeroFuelWeightCg',
      { name: 'L:A32NX_FM#index#_ZERO_FUEL_WEIGHT_CG', type: SimVarValueType.Number, indexed: true },
    ],
    ['fmGrossWeight', { name: 'L:A32NX_FM_GROSS_WEIGHT', type: SimVarValueType.Number }],
    [
      'fmLandingElevation',
      { name: 'L:A32NX_FM#index#_LANDING_ELEVATION', type: SimVarValueType.Number, indexed: true },
    ],
  ]);

  public constructor(bus: EventBus) {
    super(FmsDataPublisher.simvars, bus);
  }
}
