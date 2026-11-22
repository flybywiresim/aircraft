// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { VirtualCrewChecklistId, VirtualCrewFlightPhase } from '../../../../shared/src/VirtualCrew';
import { SimVarReader } from '../VirtualCrewTypes';
import { Checklist, Checklists } from './Checklists';
import { ChecklistOutput, ChecklistRunner, EclState } from './ChecklistRunner';

/** State of the flight relevant for the checklists */
export interface ChecklistContext {
  phase: VirtualCrewFlightPhase;
  briefingDone: boolean;
  /** True if the flow of the pilot monitoring has been performed */
  isFlowDone?: (id: string) => boolean;
  /** The aircraft is configured for landing: landing gear down and flaps in the landing position */
  landingConfiguration?: boolean;
  /** The flight control check has been performed (or skipped) */
  flightControlsChecked?: boolean;
  /** The brake check has been performed (or skipped) */
  brakesChecked?: boolean;
  /** All the engines are off */
  enginesOff?: boolean;
}

/**
 * Decides which checklist can be requested and keeps track of the completed checklists of the flight, in the order of
 * the SOP:
 * - COCKPIT PREPARATION ("before start checklist down to the line") once the takeoff briefing has been performed
 * - BEFORE START ("below the line") once the cockpit preparation checklist is completed and the preflight is over
 * - AFTER START once the after start flow is performed
 * - TAXI during the taxi, after the flight control check and the brake check
 * - LINE-UP at the holding point, once the line-up flow is performed
 * - APPROACH during the descent or the approach
 * - LANDING once the approach checklist is completed and the aircraft is configured for landing
 * - PARKING at the stand once the engines are off, SECURING THE AIRCRAFT after the parking checklist
 */
export class ChecklistManager {
  public readonly runner = new ChecklistRunner();

  private readonly done = new Set<VirtualCrewChecklistId>();

  /** True if the checklist has been completed in the current flight */
  public isDone(id: VirtualCrewChecklistId): boolean {
    return this.done.has(id);
  }

  /**
   * The checklist which can be requested now
   * @param context the state of the flight
   * @returns the checklist or undefined if none can be requested
   */
  public available(context: ChecklistContext): Checklist | undefined {
    if (this.runner.running) {
      return undefined;
    }
    return Checklists.find((checklist) => !this.done.has(checklist.id) && this.isAvailable(checklist, context));
  }

  /**
   * The pilot flying requests the available checklist
   * @param context the state of the flight
   * @param now the current time in milliseconds
   * @returns the output of the crew, undefined if no checklist can be requested
   */
  public request(context: ChecklistContext, now: number): ChecklistOutput | undefined {
    const checklist = this.available(context);
    return checklist ? this.runner.start(checklist, now) : undefined;
  }

  public update(now: number, ecl: EclState, read: SimVarReader): ChecklistOutput {
    const output = this.runner.update(now, ecl, read);
    const completed = this.runner.takeCompleted();
    if (completed) {
      this.done.add(completed.id);
    }
    return output;
  }

  /** Forgets the checklists of the flight */
  public reset(): void {
    this.runner.cancel();
    this.done.clear();
  }

  /**
   * The checklist has to be read again, e.g. the landing checklist after a go-around
   * @param id the checklist
   */
  public forget(id: VirtualCrewChecklistId): void {
    this.done.delete(id);
  }

  private isAvailable(checklist: Checklist, context: ChecklistContext): boolean {
    const phase = context.phase;
    const flowDone = (id: string) => context.isFlowDone?.(id) ?? false;
    switch (checklist.id) {
      case 'cockpitPreparation':
        return (
          context.briefingDone &&
          (phase === VirtualCrewFlightPhase.Preflight || phase === VirtualCrewFlightPhase.BeforeStart)
        );
      case 'beforeStart':
        return this.done.has('cockpitPreparation') && phase === VirtualCrewFlightPhase.BeforeStart;
      case 'afterStart':
        return (
          (phase === VirtualCrewFlightPhase.AfterStart || phase === VirtualCrewFlightPhase.Taxi) &&
          flowDone('afterStartFlow')
        );
      case 'taxi':
        return (
          phase === VirtualCrewFlightPhase.Taxi &&
          (context.flightControlsChecked ?? true) &&
          (context.brakesChecked ?? true)
        );
      case 'lineUp':
        return phase === VirtualCrewFlightPhase.BeforeTakeoff && flowDone('lineUpFlow');
      case 'approach':
        return phase === VirtualCrewFlightPhase.Descent || phase === VirtualCrewFlightPhase.Approach;
      case 'landing':
        return (
          phase === VirtualCrewFlightPhase.Approach &&
          this.done.has('approach') &&
          (context.landingConfiguration ?? false)
        );
      case 'parking':
        // after the items of the pilot monitoring at the engine shutdown (fuel pumps off)
        return (
          phase === VirtualCrewFlightPhase.Parking &&
          (context.enginesOff ?? true) &&
          (context.isFlowDone?.('shutdownFlow') ?? true)
        );
      case 'securing':
        return phase === VirtualCrewFlightPhase.Securing && this.done.has('parking');
      default:
        return false;
    }
  }
}
