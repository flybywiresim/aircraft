// Copyright (c) 2023-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FSComponent, MappedSubject } from '@microsoft/msfs-sdk';
import { FmcInterface } from '../FMC/FmcInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

export class CpnyFplnButtonUtils {
  public static cpnyFplnButtonDisabled(fmc: FmcInterface | null, flightPlanIndex: number) {
    return fmc
      ? MappedSubject.create(
          ([uplinkInProgress, forPlan, enginesStarted, hasActiveFlightPlan]) =>
            uplinkInProgress ||
            (flightPlanIndex === FlightPlanIndex.Active &&
              (enginesStarted ||
                hasActiveFlightPlan ||
                (forPlan !== null && forPlan >= FlightPlanIndex.FirstSecondary))),
          fmc.fmgc.data.cpnyFplnUplinkInProgress,
          fmc.fmgc.data.cpnyFplnRequestedForPlan,
          fmc.enginesWereStarted,
          fmc.hasActiveFlightPlan,
        )
      : MappedSubject.create(() => true);
  }

  public static cpnyFplnButtonLabel(fmc: FmcInterface | null) {
    return fmc
      ? MappedSubject.create(([avail]) => {
          if (!avail) {
            return (
              <span>
                CPNY F-PLN
                <br />
                REQUEST
              </span>
            );
          }
          return (
            <span>
              RECEIVED
              <br />
              CPNY F-PLN
            </span>
          );
        }, fmc.fmgc.data.cpnyFplnAvailable)
      : MappedSubject.create(() => <></>);
  }

  public static cpnyFplnButtonMenuItems(fmc: FmcInterface | null, flightPlanIndex: number) {
    return fmc
      ? MappedSubject.create(
          ([avail]) =>
            avail
              ? [
                  {
                    label: 'INSERT*',
                    action: () => fmc.insertCpnyFpln(flightPlanIndex),
                  },
                  {
                    label: 'CLEAR*',
                    action: () => {
                      fmc.flightPlanInterface.uplinkDelete();
                      fmc.fmgc.data.cpnyFplnAvailable.set(false);
                      fmc.fmgc.data.cpnyFplnRequestedForPlan.set(null);
                    },
                  },
                ]
              : [],
          fmc.fmgc.data.cpnyFplnAvailable,
        )
      : MappedSubject.create(() => []);
  }
}
