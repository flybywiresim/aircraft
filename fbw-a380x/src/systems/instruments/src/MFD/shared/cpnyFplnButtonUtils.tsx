// Copyright (c) 2023-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FSComponent, MappedSubject, Subscribable } from '@microsoft/msfs-sdk';
import { FmcInterface } from '../FMC/FmcInterface';

export function cpnyFplnButtonDisabled(fmc: FmcInterface | null, flightPlanIndex: Subscribable<number>) {
  return fmc
    ? MappedSubject.create(
        ([uplinkInProgress, forPlan, flightPlanIndex]) =>
          uplinkInProgress || (forPlan !== null && forPlan !== flightPlanIndex),
        fmc.fmgc.data.cpnyFplnUplinkInProgress,
        fmc.fmgc.data.cpnyFplnRequestedForPlan,
        flightPlanIndex,
      )
    : MappedSubject.create(() => true);
}

export function cpnyFplnButtonLabel(fmc: FmcInterface | null, flightPlanIndex: Subscribable<number>) {
  return fmc
    ? MappedSubject.create(
        ([avail, forPlan, flightPlanIndex]) => {
          if (!avail || forPlan !== flightPlanIndex) {
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
        },
        fmc.fmgc.data.cpnyFplnAvailable,
        fmc.fmgc.data.cpnyFplnRequestedForPlan,
        flightPlanIndex,
      )
    : MappedSubject.create(() => <></>);
}

export function cpnyFplnButtonMenuItems(fmc: FmcInterface | null, flightPlanIndex: Subscribable<number>) {
  return fmc
    ? MappedSubject.create(
        ([avail, forPlan, flightPlanIndex]) =>
          avail && forPlan === flightPlanIndex
            ? [
                {
                  label: 'INSERT*',
                  action: () => fmc.insertCpnyFpln(),
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
        fmc.fmgc.data.cpnyFplnRequestedForPlan,
        flightPlanIndex,
      )
    : MappedSubject.create(() => []);
}
