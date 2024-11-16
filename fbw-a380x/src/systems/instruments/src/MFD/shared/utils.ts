// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Approach, ApproachType } from '@flybywiresim/fbw-sdk';

export function getEtaFromUtcOrPresent(seconds: number | null, fromPresent: boolean) {
  if (seconds === null) {
    return '--:--';
  }

  const secondsEta = fromPresent ? seconds : seconds + SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');
  const eta = new Date(secondsEta * 1000);
  return `${eta.getUTCHours().toString().padStart(2, '0')}:${eta.getUTCMinutes().toString().padStart(2, '0')}`;
}

export function secondsToHHmmString(seconds: number) {
  const minutesTotal = seconds / 60;
  const hours = Math.abs(Math.floor(minutesTotal / 60))
    .toFixed(0)
    .toString()
    .padStart(2, '0');
  const minutes = Math.abs(minutesTotal % 60)
    .toFixed(0)
    .toString()
    .padStart(2, '0');
  return `${hours}:${minutes}`;
}

const approachTypeNames: Record<ApproachType, string> = {
  [ApproachType.Ils]: 'ILS',
  [ApproachType.Gls]: 'GLS',
  [ApproachType.Igs]: 'IGS',
  [ApproachType.Loc]: 'LOC',
  [ApproachType.LocBackcourse]: 'BAC',
  [ApproachType.Lda]: 'LDA',
  [ApproachType.Sdf]: 'SDF',
  [ApproachType.Gps]: 'GPS',
  [ApproachType.Rnav]: 'RNV',
  [ApproachType.Vor]: 'VOR',
  [ApproachType.VorDme]: 'VOR',
  [ApproachType.Vortac]: 'VOR',
  [ApproachType.Ndb]: 'NDB',
  [ApproachType.NdbDme]: 'NDB',
  [ApproachType.Fms]: 'RNAV',
  [ApproachType.Mls]: 'MLS', // not actually supported
  [ApproachType.MlsTypeA]: 'MLS', // not actually supported
  [ApproachType.MlsTypeBC]: 'MLS', // not actually supported
  [ApproachType.Tacan]: 'TAC', // not actually supported
  [ApproachType.Unknown]: '',
};

export function getApproachName(approach: Approach, withRnpSuffix = true): string {
  // we don't need to worry about circling approaches as they aren't available, so we can always expect a runway ident
  // FIXME add (RNP) suffix for RNP-AR missed approaches (even on non-RNAV approaches)
  const approachSuffix = approach.suffix ? `-${approach.suffix}` : '';
  const arSuffix = withRnpSuffix && approach.authorisationRequired ? ' (RNP)' : '';
  return `${approachTypeNames[approach.type]}${approach.runwayIdent?.substring(4)}${approachSuffix}${arSuffix}`;
}
