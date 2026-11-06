// Copyright (c) 2023-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { FlightPlanLeg, FlightPlanLegFlags } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { ReadonlyFlightPlanElement } from '@fmgc/flightplanning/legs/ReadonlyFlightPlanLeg';
import { BitFlags, DateTimeFormatter } from '@microsoft/msfs-sdk';
import { FmcServiceInterface } from '../FMC/FmcServiceInterface';
import { NXSystemMessages } from './NXSystemMessages';

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

export const hhmmFormatter = DateTimeFormatter.create('{HH}:{mm}', { nanString: '--:--' });
export const noPositionAvailableText = '--°--.--/---°--.--';
export const showReturnButtonUriExtra = 'withReturn';
export const fmsActivePagePrefix = 'fms/active/';
export const fmsSec1PagePrefix = 'fms/sec1/';
export const fmsSec2PagePrefix = 'fms/sec2/';
export const fmsSec3PagePrefix = 'fms/sec3/';
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
export const windPage = 'wind';
export const activeFlightPlanPageUri = fmsActivePagePrefix + flightPlanUriPage;
export const activeFlightPlanFuelAndLoadUri = fmsActivePagePrefix + fuelAndLoadPage;
export const activeFlightPlanHoldUri = fmsActivePagePrefix + lateralRevisionHoldPage;
export const fixInfoUri = fmsActivePagePrefix + 'f-pln-fix-info';
export const dirToUri = fmsActivePagePrefix + 'f-pln-direct-to';

/** Adds ENTRY NOT IN LIST scratchpad message. */
export function onEntryNotInList(fmc: FmcServiceInterface): void {
  fmc.master.addMessageToQueue(NXSystemMessages.EntryNotInList, undefined, undefined);
}

export function isConstraintRevisionAllowed(leg: ReadonlyFlightPlanElement) {
  return (
    leg instanceof FlightPlanLeg &&
    !leg.isRunway() &&
    leg.isXF() &&
    !BitFlags.isAny(leg.flags, FlightPlanLegFlags.DirectToTurningPoint)
  );
}
