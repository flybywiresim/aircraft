// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { AircraftToDescentProfileRelation } from '@fmgc/guidance/vnav/descent/AircraftToProfileRelation';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { LateralMode } from '@shared/autopilot';
import { FmgcFlightPhase } from '@shared/flightphase';
import { LocalSimVar, NXDataStore, PopUpDialog } from '@flybywiresim/fbw-sdk';

const TIMEOUT = 10_000;

export class TodGuidance {
  private tdReached: boolean;

  private tdPaused: boolean;

  private tdArmed: LocalSimVar<boolean>;

  private pauseAtTodDistance: number;

  private tdPauseEnabled: boolean;

  private apEngaged: boolean;

  private cooldown: number;

  constructor(
    private aircraftToDescentProfileRelation: AircraftToDescentProfileRelation,
    private observer: VerticalProfileComputationParametersObserver,
    private atmosphericConditions: AtmosphericConditions,
  ) {
    this.cooldown = 0;
    this.apEngaged = false;
    this.tdReached = false;
    this.tdPaused = false;
    this.tdPauseEnabled = false;
    this.tdArmed = new LocalSimVar('L:A32NX_PAUSE_AT_TOD_ARMED', 'bool');

    NXDataStore.getAndSubscribe(
      'PAUSE_AT_TOD_DISTANCE',
      (_, value: string) => {
        const pF = parseFloat(value);
        if (isNaN(pF)) {
          this.pauseAtTodDistance = 0;
        } else {
          this.pauseAtTodDistance = pF;
        }
      },
      '10',
    );

    NXDataStore.getAndSubscribe(
      'PAUSE_AT_TOD',
      (_, value: string) => {
        if (value === 'ENABLED') {
          this.tdPauseEnabled = true;
        } else {
          this.tdPauseEnabled = false;
        }
      },
      'DISABLED',
    );
  }

  showPausePopup(title: string, message: string) {
    this.cooldown = TIMEOUT;
    SimVar.SetSimVarValue('K:PAUSE_SET', 'number', 1);
    let popup = new PopUpDialog();
    popup.showInformation(title, message, 'small', () => {
      SimVar.SetSimVarValue('K:PAUSE_SET', 'number', 0);
      this.cooldown = TIMEOUT;
      popup = null;
    });
  }

  update(deltaTime: number) {
    this.updateTdReached(deltaTime);
    if (this.tdPauseEnabled) {
      this.updateTdPause(deltaTime);
    }
  }

  updateTdPause(deltaTime: number) {
    // Only armed if all conditions met
    this.tdArmed.setVar(
      this.cooldown <= 0 &&
        !this.tdPaused &&
        this.observer.get().flightPhase >= FmgcFlightPhase.Climb &&
        this.observer.get().flightPhase <= FmgcFlightPhase.Cruise,
    );

    if (this.tdArmed.getVar()) {
      // Check T/D pause first
      if (
        (this.aircraftToDescentProfileRelation.distanceToTopOfDescent() ?? Number.POSITIVE_INFINITY) <
        this.pauseAtTodDistance
      ) {
        this.tdPaused = true;
        this.showPausePopup(
          'TOP OF DESCENT',
          `Paused before the calculated top of descent. System Time was ${new Date().toLocaleTimeString()}.`,
        );
        // Check A/P mode reversion
      } else if (
        // Only guard A/P above transitional altitude
        this.atmosphericConditions.currentAltitude
          ? this.atmosphericConditions.currentAltitude > this.observer.get().originTransitionAltitude
          : false
      ) {
        const apActive =
          SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_ACTIVE', 'boolean') &&
          SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Enum') === LateralMode.NAV;

        if (this.apEngaged && !apActive) {
          this.showPausePopup(
            'AP PROTECTION',
            `Autopilot or lateral guidance disengaged before the calculated top of descent. System Time was ${new Date().toLocaleTimeString()}.`,
          );
        }

        if (this.apEngaged !== apActive) {
          this.apEngaged = apActive;
        }
      }
    }

    // Reset flags on turnaround
    if (
      this.observer.get().flightPhase === FmgcFlightPhase.Done ||
      this.observer.get().flightPhase === FmgcFlightPhase.Preflight
    ) {
      this.tdPaused = false;
      this.apEngaged = false;
    }
    // Iterate backoff timer
    if (this.cooldown > 0) {
      this.cooldown = Math.max(0, this.cooldown - deltaTime);
    }
  }

  updateTdReached(_deltaTime: number) {
    const tdReached =
      this.observer.get().flightPhase >= FmgcFlightPhase.Climb &&
      this.observer.get().flightPhase <= FmgcFlightPhase.Cruise &&
      this.aircraftToDescentProfileRelation.isPastTopOfDescent();

    if (tdReached !== this.tdReached) {
      this.tdReached = tdReached;
      SimVar.SetSimVarValue('L:A32NX_PFD_MSG_TD_REACHED', 'boolean', this.tdReached);
    }
  }
}
