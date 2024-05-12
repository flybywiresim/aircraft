// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { LegType, TurnDirection } from '@flybywiresim/fbw-sdk';
import { FlightPlanLegDefinition } from '@fmgc/flightplanning/new/legs/FlightPlanLegDefinition';

export function procedureLegIdentAndAnnotation(
  procedureLeg: FlightPlanLegDefinition,
  procedureIdent?: string,
): [ident: string, annotation: string] {
  const legType = procedureLeg.type;

  switch (legType) {
    case LegType.AF:
      return [
        // @ts-expect-error TS18048 -- TODO fix this manually (strict mode migration)
        procedureLeg.waypoint.ident,
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        `${Math.round(procedureLeg.rho).toString().padStart(2, ' ')} ${procedureLeg.recommendedNavaid.ident.substring(0, 3)}`,
      ];
    case LegType.CF:
      // @ts-expect-error TS18048 -- TODO fix this manually (strict mode migration)
      return [procedureLeg.waypoint.ident, `C${Math.round(procedureLeg.magneticCourse).toString().padStart(3, '0')}°`];
    case LegType.IF:
    case LegType.DF:
    case LegType.TF:
      // @ts-expect-error TS18048 -- TODO fix this manually (strict mode migration)
      return [procedureLeg.waypoint.ident, procedureIdent ?? null];
    case LegType.RF:
      // @ts-expect-error TS18048 -- TODO fix this manually (strict mode migration)
      return [procedureLeg.waypoint.ident, `${Math.round(procedureLeg.length).toString().padStart(2, ' ')} ARC`];
    case LegType.CA:
    case LegType.FA:
    case LegType.VA:
      return [
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        Math.round(procedureLeg.altitude1).toString().substring(0, 9),
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        `${legType === LegType.VA ? 'H' : 'C'}${Math.round(procedureLeg.magneticCourse).toString().padStart(3, '0')}°`,
      ]; // TODO fix for VA
    case LegType.CD:
    case LegType.FC:
    case LegType.FD:
    case LegType.VD: {
      const targetFix = legType === LegType.FC ? procedureLeg.waypoint : procedureLeg.recommendedNavaid;

      return [
        // @ts-expect-error TS18048 -- TODO fix this manually (strict mode migration)
        `${targetFix.ident.substring(0, 3)}/${Math.round(procedureLeg.length).toString().padStart(2, '0')}`,
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        `${legType === LegType.VD ? 'H' : 'C'}${Math.round(procedureLeg.magneticCourse).toString().padStart(3, '0')}°`,
      ];
    }
    case LegType.CI:
    case LegType.VI:
      return [
        'INTCPT',
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        `${legType === LegType.CI ? 'C' : 'H'}${Math.round(procedureLeg.magneticCourse).toString().padStart(3, '0')}°`,
      ]; // TODO fix for VI
    case LegType.CR:
    case LegType.VR:
      return [
        // @ts-expect-error TS18048 -- TODO fix this manually (strict mode migration)
        `${procedureLeg.recommendedNavaid.ident.substring(0, 3)}${Math.round(procedureLeg.theta).toString().padStart(3, '0')}`,
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        `${legType === LegType.VR ? 'H' : 'C'}${Math.round(procedureLeg.magneticCourse).toString().padStart(3, '0')}°`,
      ]; // TODO fix for VR
    case LegType.HA:
      return [
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        Math.round(procedureLeg.altitude1).toString(),
        `HOLD ${procedureLeg.turnDirection === TurnDirection.Left ? 'L' : 'R'}`,
      ];
    case LegType.HF:
      // @ts-expect-error TS18048 -- TODO fix this manually (strict mode migration)
      return [procedureLeg.waypoint.ident, `HOLD ${procedureLeg.turnDirection === TurnDirection.Left ? 'L' : 'R'}`];
    case LegType.HM:
      return [
        // TODO leg before
        // @ts-expect-error TS18048 -- TODO fix this manually (strict mode migration)
        procedureLeg.waypoint.ident,
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        `C${Math.round(procedureLeg.magneticCourse).toString().padStart(3, '0')}°`,
      ];
    case LegType.PI:
      return ['INTCPT', `PROC ${procedureLeg.turnDirection === TurnDirection.Left ? 'L' : 'R'}`];
    case LegType.FM:
    case LegType.VM:
      return [
        'MANUAL',
        // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
        `${legType === LegType.FM ? 'C' : 'H'}${Math.round(procedureLeg.magneticCourse).toString().padStart(3, '0')}°`,
      ]; // TODO fix for VM
    default:
      break;
  }

  return [`(UNKN ${LegType[legType]})`, 'UNKNOWN'];
}

export const pposPointIDent = 'PPOS';

export const turningPointIdent = 'T-P';

export const inboundPointIdent = 'IN-BND';

export const outboundPointIdent = 'OUT-BND';
