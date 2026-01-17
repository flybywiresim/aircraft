// Copyright (c) 2023-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Approach, ApproachType } from '@flybywiresim/fbw-sdk';

export function getEtaFromUtcOrPresent(seconds: number | null | undefined, fromPresent: boolean) {
  if (seconds === null || seconds === undefined) {
    return '--:--';
  } else if (Number.isNaN(seconds)) {
    console.error('[MFD] NaN input received for eta format');
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
  // The (RNP) suffix is added RNP-AR approaches, and for RNP-AR missed approaches (even on non-RNAV approaches).
  const approachSuffix = approach.multipleIndicator ? `-${approach.multipleIndicator}` : '';
  const arSuffix =
    withRnpSuffix && (approach.authorisationRequired || approach.missedApproachAuthorisationRequired) ? ' (RNP)' : '';
  return `${approachTypeNames[approach.type]}${approach.runwayIdent.substring(4)}${approachSuffix}${arSuffix}`;
}

export const noPositionAvailableText = '--°--.--/---°--.--';

export const showReturnButtonUriExtra = 'withReturn';

export const flightPlanUriPage = 'f-pln';
export const lateralRevisionHoldPage = 'f-pln-hold';
export const dataStatusUri = 'fms/data/status';
export const fuelAndLoadPage = 'fuel-load';
export const performancePage = 'perf';
export const initPage = 'init';
export const verticalRevisionPage = 'f-pln-vert-rev';
export const lateralRevisionPage = 'f-pln-lat-rev';
export const departurePage = 'f-pln-departure';
export const arrivalPage = 'f-pln-arrival';
export const airwaysPage = 'f-pln-airways';

export const secIndexPageUri = 'fms/sec/index';
export const activeFlightPlanPageUri = 'fms/active/' + flightPlanUriPage;
export const activeFlightPlanFuelAndLoadUri = 'fms/active/' + fuelAndLoadPage;
export const activeFlightPlanHoldUri = 'fms/active/' + lateralRevisionHoldPage;
export const fixInfoUri = 'fms/active/f-pln-fix-info';
export const dirToUri = 'fms/active/f-pln-direct-to';
