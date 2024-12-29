// Copyright (c) 2021-2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FMMessage, FMMessageTriggers } from '@flybywiresim/fbw-sdk';

import { RwyLsMismatchLeft, RwyLsMismatchRight } from '@fmgc/components/fms-messages/RwyLsMismatch';
import {
  SpecifiedNdbUnavailableLeft,
  SpecifiedNdbUnavailableRight,
} from '@fmgc/components/fms-messages/SpecifiedNdbUnavailable';
import {
  SpecifiedVorUnavailableLeft,
  SpecifiedVorUnavailableRight,
} from '@fmgc/components/fms-messages/SpecifiedVorUnavailable';
import { TuneNavaidLeft, TuneNavaidRight } from '@fmgc/components/fms-messages/TuneNavaid';
import { TurnAreaExceedanceLeft, TurnAreaExceedanceRight } from '@fmgc/components/fms-messages/TurnAreaExceedance';
import { TdReached } from '@fmgc/components/fms-messages/TdReached';
import { StepAhead } from '@fmgc/components/fms-messages/StepAhead';
import { StepDeleted } from '@fmgc/components/fms-messages/StepDeleted';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { FmgcComponent } from '../FmgcComponent';
import { GpsPrimary } from './GpsPrimary';
import { GpsPrimaryLost } from './GpsPrimaryLost';
import { MapPartlyDisplayedLeft, MapPartlyDisplayedRight } from './MapPartlyDisplayed';
import { Navigation } from '@fmgc/navigation/Navigation';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { TooSteepPathAhead } from '@fmgc/components/fms-messages/TooSteepPathAhead';
import { NoNavIntercept } from '@fmgc/components/fms-messages/NoNavIntercept';

/**
 * This class manages Type II messages sent from the FMGC.
 *
 * Since many of those are also sent to the EFIS, this class sets a bitfield signalling the active messages to the DMCs
 *
 * At the moment, other Type II messages which are not displayed on the EFIS are declared in the old JavaScript CDU/"FMC".
 *
 * **Note:** The plan is eventually to move them here as well - but since they can be triggered manually on pilot output as well, and it
 * is not currently convenient to use this class from the JS CDU, we will not do that at the moment
 *
 * -Benjamin
 */
export class FmsMessages implements FmgcComponent {
  private listener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);

  private ndMessageFlags: Record<'L' | 'R', number> = {
    L: 0,
    R: 0,
  };

  private messageSelectors: FMMessageSelector[] = [
    new GpsPrimary(),
    new GpsPrimaryLost(),
    new MapPartlyDisplayedLeft(),
    new MapPartlyDisplayedRight(),
    new TurnAreaExceedanceLeft(),
    new TurnAreaExceedanceRight(),
    new TuneNavaidLeft(),
    new TuneNavaidRight(),
    new SpecifiedVorUnavailableLeft(),
    new SpecifiedVorUnavailableRight(),
    new SpecifiedNdbUnavailableLeft(),
    new SpecifiedNdbUnavailableRight(),
    new RwyLsMismatchLeft(),
    new RwyLsMismatchRight(),
    new TdReached(),
    new StepAhead(),
    new StepDeleted(),
    new TooSteepPathAhead(),
    new NoNavIntercept(),
  ];

  init(navigation: Navigation, guidanceController: GuidanceController, flightPlanService: FlightPlanService): void {
    for (const selector of this.messageSelectors) {
      if (selector.init) {
        selector.init(navigation, guidanceController, flightPlanService);
      }
    }
  }

  update(deltaTime: number): void {
    let didMutateNd = false;
    for (const selector of this.messageSelectors) {
      const newState = selector.process(deltaTime);
      const message = selector.message;

      switch (newState) {
        case FMMessageUpdate.SEND:
          if (message.text) {
            this.listener.triggerToAllSubscribers(FMMessageTriggers.SEND_TO_MCDU, message);
          }

          if (message.ndFlag > 0) {
            if (selector.efisSide) {
              this.ndMessageFlags[selector.efisSide] |= message.ndFlag;
            } else {
              for (const side in this.ndMessageFlags) {
                if (Object.prototype.hasOwnProperty.call(this.ndMessageFlags, side)) {
                  this.ndMessageFlags[side] |= message.ndFlag;
                }
              }
            }
            didMutateNd = true;
          }
          break;
        case FMMessageUpdate.RECALL:
          if (message.text) {
            this.listener.triggerToAllSubscribers(FMMessageTriggers.RECALL_FROM_MCDU_WITH_ID, message.text); // TODO id
          }

          if (message.ndFlag > 0) {
            if (selector.efisSide) {
              this.ndMessageFlags[selector.efisSide] &= ~message.ndFlag;
            } else {
              for (const side in this.ndMessageFlags) {
                if (Object.prototype.hasOwnProperty.call(this.ndMessageFlags, side)) {
                  this.ndMessageFlags[side] &= ~message.ndFlag;
                }
              }
            }
            didMutateNd = true;
          }
          break;
        case FMMessageUpdate.NO_ACTION:
          break;
        default:
          throw new Error('Invalid FM message update state');
      }
    }
    if (didMutateNd) {
      for (const side in this.ndMessageFlags) {
        if (Object.prototype.hasOwnProperty.call(this.ndMessageFlags, side)) {
          SimVar.SetSimVarValue(`L:A32NX_EFIS_${side}_ND_FM_MESSAGE_FLAGS`, 'number', this.ndMessageFlags[side]);
        }
      }
    }
  }

  send(messageClass: { new (): FMMessageSelector }): void {
    const message = this.messageSelectors.find((it) => it instanceof messageClass).message;

    this.listener.triggerToAllSubscribers(FMMessageTriggers.SEND_TO_MCDU, message);

    if (message.ndFlag) {
      for (const side in this.ndMessageFlags) {
        if (Object.prototype.hasOwnProperty.call(this.ndMessageFlags, side)) {
          this.ndMessageFlags[side] |= message.ndFlag;
          SimVar.SetSimVarValue(`L:A32NX_EFIS_${side}_ND_FM_MESSAGE_FLAGS`, 'number', this.ndMessageFlags[side]);
        }
      }
    }
  }

  recall(messageClass: { new (): FMMessageSelector }): void {
    const message = this.messageSelectors.find((it) => it instanceof messageClass).message;

    this.listener.triggerToAllSubscribers(FMMessageTriggers.RECALL_FROM_MCDU_WITH_ID, message.text); // TODO id

    if (message.ndFlag) {
      for (const side in this.ndMessageFlags) {
        if (Object.prototype.hasOwnProperty.call(this.ndMessageFlags, side)) {
          this.ndMessageFlags[side] &= ~message.ndFlag;
          SimVar.SetSimVarValue(`L:A32NX_EFIS_${side}_ND_FM_MESSAGE_FLAGS`, 'number', this.ndMessageFlags[side]);
        }
      }
    }
  }

  recallId(id: number) {
    const message = this.messageSelectors.find((it) => it.message.id === id).message;

    this.listener.triggerToAllSubscribers(FMMessageTriggers.RECALL_FROM_MCDU_WITH_ID, message.text); // TODO id

    if (message.ndFlag) {
      for (const side in this.ndMessageFlags) {
        if (Object.prototype.hasOwnProperty.call(this.ndMessageFlags, side)) {
          this.ndMessageFlags[side] &= ~message.ndFlag;
          SimVar.SetSimVarValue(`L:A32NX_EFIS_${side}_ND_FM_MESSAGE_FLAGS`, 'number', this.ndMessageFlags[side]);
        }
      }
    }
  }
}

/**
 * Type II message update state.
 *
 * Used when a message selector implements the {@link FMMessageSelector.process `process`} method.
 */
export enum FMMessageUpdate {
  /**
   * Self-explanatory
   */
  NO_ACTION,

  /**
   * Send the message to the MCDU, and EFIS target if applicable
   */
  SEND,

  /**
   * Recall the message from the MCDU, and EFIS target if applicable
   */
  RECALL,
}

/**
 * Defines a selector for a Type II message.
 */
export interface FMMessageSelector {
  message: FMMessage;

  efisSide?: 'L' | 'R';

  init?(navigation: Navigation, guidanceController: GuidanceController, flightPlanService: FlightPlanService): void;

  /**
   * Optionally triggers a message when there isn't any other system or Redux update triggering it.
   */
  process(deltaTime: number): FMMessageUpdate;
}
