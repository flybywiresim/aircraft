import { FMMessage } from '@flybywiresim/fbw-sdk';

/* eslint-disable no-multi-spaces */
export enum NdFmMessageFlag {
  None = 0,
  SelectTrueRef = 1 << 0,
  CheckNorthRef = 1 << 1,
  NavAccuracyDowngrade = 1 << 2,
  NavAccuracyUpgrade = 1 << 3,
  SpecifiedVorDmeUnavailable = 1 << 4,
  NavAccuracyUpgradeGps = 1 << 5,
  NavPrimary = 1 << 6,
  MapPartlyDisplayed = 1 << 7,
  OffsideFmControl = 1 << 8,
  NavPrimaryLost = 1 << 9,
}
/* eslint-enable no-multi-spaces */

export const NDFMMessageTypes: Readonly<Record<string, FMMessage>> = {
  SelectTrueRef: {
    id: 1,
    ndFlag: NdFmMessageFlag.SelectTrueRef,
    text: 'SELECT TRUE NORTH REF',
    color: 'Amber',
    ndPriority: 1,
  },
  CheckNorthRef: {
    id: 2,
    ndFlag: NdFmMessageFlag.CheckNorthRef,
    text: 'CHECK NORTH REF',
    color: 'Amber',
    ndPriority: 1,
  },
  NavAccuracyDowngrade: {
    id: 3,
    ndFlag: NdFmMessageFlag.NavAccuracyDowngrade,
    text: 'NAV ACCUR DOWNGRAD',
    color: 'Amber',
    ndPriority: 1,
  },
  NavAccuracyUpgraded: {
    id: 4,
    ndFlag: NdFmMessageFlag.NavAccuracyUpgrade,
    text: 'NAV ACCUR UPGRADED',
    color: 'White',
    ndPriority: 1,
  },
  SpecifiedVorDmeUnavailable: {
    id: 5,
    ndFlag: NdFmMessageFlag.SpecifiedVorDmeUnavailable,
    text: 'SPECIF VOR-D NOT AVAIL',
    color: 'Amber',
    ndPriority: 1,
  },
  NavPrimary: {
    id: 7,
    ndFlag: NdFmMessageFlag.NavPrimary,
    text: 'NAV PRIMARY',
    color: 'White',
    ndPriority: 1,
  },
  MapPartlyDisplayed: {
    id: 8,
    ndFlag: NdFmMessageFlag.MapPartlyDisplayed,
    efisText: 'MAP PARTLY DISPLAYED',
    color: 'Amber',
    ndPriority: 2,
  },
  OffsideFmControl: {
    id: 9,
    ndFlag: NdFmMessageFlag.OffsideFmControl,
    text: 'OFFSIDE FM CONTROL',
    color: 'Amber',
    ndPriority: 4,
  },
  NavPrimaryLost: {
    id: 10,
    ndFlag: NdFmMessageFlag.NavPrimaryLost,
    text: 'NAV PRIMARY LOST',
    color: 'Amber',
    ndPriority: 7,
  },
};
