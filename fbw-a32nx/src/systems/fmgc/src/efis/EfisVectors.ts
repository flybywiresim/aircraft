// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EfisNdMode, EfisSide, EfisVectorsGroup, GenericDataListenerSync } from '@flybywiresim/fbw-sdk';

import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { PathVector, pathVectorLength, pathVectorValid } from '@fmgc/guidance/lnav/PathVector';
import { LateralMode } from '@shared/autopilot';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { EfisInterface } from '@fmgc/efis/EfisInterface';
import { ReadonlyFlightPlan } from '@fmgc/flightplanning/plans/ReadonlyFlightPlan';
import { FmgcFlightPhase } from '@shared/flightphase';
import { ConsumerValue, EventBus } from '@microsoft/msfs-sdk';
import { FlightPhaseManagerEvents } from '@fmgc/flightphase';

const UPDATE_TIMER = 2_500;

export class EfisVectors {
  private syncer: GenericDataListenerSync = new GenericDataListenerSync();

  private lastFpVersions = new Map<number, number>();

  private lastEfisInterfaceVersions: Record<EfisSide, number> = { L: -1, R: -1 };

  private readonly flightPhase = ConsumerValue.create(
    this.bus.getSubscriber<FlightPhaseManagerEvents>().on('fmgc_flight_phase'),
    FmgcFlightPhase.Preflight,
  );

  constructor(
    private readonly bus: EventBus,
    private readonly flightPlanService: FlightPlanService,
    private guidanceController: GuidanceController,
    private efisInterfaces: Record<EfisSide, EfisInterface>,
  ) {}

  public forceUpdate() {
    this.updateTimer = UPDATE_TIMER + 1;
  }

  private updateTimer = 0;

  public update(deltaTime: number): void {
    this.updateTimer += deltaTime;

    if (this.updateTimer >= UPDATE_TIMER) {
      this.updateSide('L', true);
      this.updateSide('R', true);
      this.updateTimer = 0;
    } else {
      this.updateSide('L');
      this.updateSide('R');
    }
  }

  private updateSide(side: EfisSide, force = false): void {
    if (force || this.lastEfisInterfaceVersions[side] !== this.efisInterfaces[side].version) {
      this.lastEfisInterfaceVersions[side] = this.efisInterfaces[side].version;

      this.tryProcessFlightPlan(FlightPlanIndex.Active, side, true);
      this.tryProcessFlightPlan(FlightPlanIndex.Temporary, side, true);
      this.tryProcessFlightPlan(FlightPlanIndex.FirstSecondary, side, true);

      const activeFlightPlanVectors =
        this.guidanceController.activeGeometry?.getAllPathVectors(this.guidanceController.activeLegIndex) ?? [];

      const visibleActiveFlightPlanVectors = activeFlightPlanVectors.filter((vector) =>
        EfisVectors.isVectorReasonable(vector),
      );

      if (visibleActiveFlightPlanVectors.length !== activeFlightPlanVectors.length) {
        this.guidanceController.efisStateForSide[side].legsCulled = true;
      } else {
        this.guidanceController.efisStateForSide[side].legsCulled = false;
      }
    } else {
      this.tryProcessFlightPlan(FlightPlanIndex.Active, side);
      this.tryProcessFlightPlan(FlightPlanIndex.Temporary, side);
      this.tryProcessFlightPlan(FlightPlanIndex.FirstSecondary, side);
    }
  }

  /**
   * Protect against potential perf issues from immense vectors
   */
  private static isVectorReasonable(vector: PathVector): boolean {
    if (!pathVectorValid(vector)) {
      return false;
    }

    const length = pathVectorLength(vector);

    return length <= 5_000;
  }

  private tryProcessFlightPlan(planIndex: FlightPlanIndex, side: EfisSide, force = false) {
    const planExists = this.flightPlanService.has(planIndex);

    if (!planExists) {
      this.lastFpVersions.delete(planIndex);

      switch (planIndex) {
        case FlightPlanIndex.Active:
          this.transmit(null, EfisVectorsGroup.ACTIVE, side);
          this.transmit(null, EfisVectorsGroup.DASHED, side);
          this.transmit(null, EfisVectorsGroup.MISSED, side);
          this.transmit(null, EfisVectorsGroup.ALTERNATE, side);
          break;
        case FlightPlanIndex.Temporary:
          this.transmit(null, EfisVectorsGroup.TEMPORARY, side);
          break;
        case FlightPlanIndex.FirstSecondary:
        case FlightPlanIndex.Uplink:
        default:
          this.transmit(null, EfisVectorsGroup.SECONDARY, side);
          break;
      }

      return;
    }

    const plan = this.flightPlanService.get(planIndex);

    if (!force && this.lastFpVersions.get(planIndex) === plan.version) {
      return;
    }

    this.lastFpVersions.set(planIndex, plan.version);

    switch (planIndex) {
      case FlightPlanIndex.Active: {
        const engagedLateralMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Number') as LateralMode;

        const doesPreNavEngagePathExist = this.guidanceController.doesPreNavModeEngagementPathExist();

        const transmitActive =
          (engagedLateralMode !== LateralMode.HDG &&
            engagedLateralMode !== LateralMode.TRACK &&
            engagedLateralMode !== LateralMode.GA_TRACK &&
            engagedLateralMode !== LateralMode.RWY_TRACK) ||
          doesPreNavEngagePathExist;

        if (transmitActive) {
          this.transmitFlightPlan(
            plan,
            side,
            EfisVectorsGroup.ACTIVE,
            EfisVectorsGroup.MISSED,
            EfisVectorsGroup.ALTERNATE,
          );
          this.transmit(null, EfisVectorsGroup.DASHED, side);
        } else {
          this.transmit(null, EfisVectorsGroup.ACTIVE, side);
          this.transmitFlightPlan(
            plan,
            side,
            EfisVectorsGroup.DASHED,
            EfisVectorsGroup.MISSED,
            EfisVectorsGroup.ALTERNATE,
          );
        }
        break;
      }
      case FlightPlanIndex.Temporary:
        this.transmitFlightPlan(plan, side, EfisVectorsGroup.TEMPORARY);
        break;
      default:
        if (this.efisInterfaces[side].shouldTransmitSecondary()) {
          this.transmitFlightPlan(plan, side, EfisVectorsGroup.SECONDARY);
        } else {
          this.transmit(null, EfisVectorsGroup.SECONDARY, side);
        }
        break;
    }
  }

  private transmitFlightPlan(
    plan: ReadonlyFlightPlan,
    side: EfisSide,
    mainGroup: EfisVectorsGroup,
    missedApproachGroup = mainGroup,
    alternateGroup = mainGroup,
  ) {
    const mode: EfisNdMode = SimVar.GetSimVarValue(`L:A32NX_EFIS_${side}_ND_MODE`, 'number');
    const isPlanMode = mode === EfisNdMode.PLAN;

    if (!this.guidanceController.hasGeometryForFlightPlan(plan.index)) {
      this.transmit(null, mainGroup, side);

      if (missedApproachGroup !== mainGroup) {
        this.transmit(null, missedApproachGroup, side);
      }

      if (alternateGroup !== mainGroup) {
        this.transmit(null, alternateGroup, side);
      }

      return;
    }

    // ACTIVE

    const geometry = this.guidanceController.doesPreNavModeEngagementPathExist()
      ? this.guidanceController.getPreNavModeEngagementPathGeometry()
      : this.guidanceController.getGeometryForFlightPlan(plan.index);
    const activeLegIndex = this.guidanceController.doesPreNavModeEngagementPathExist()
      ? plan.activeLegIndex - 1
      : plan.activeLegIndex;

    const vectors = geometry.getAllPathVectors(activeLegIndex).filter((it) => EfisVectors.isVectorReasonable(it));

    // ACTIVE missed

    const transmitMissed = this.efisInterfaces[side].shouldTransmitMissed(plan.index, isPlanMode);

    if (transmitMissed) {
      const missedVectors = geometry.getAllPathVectors(0, true).filter((it) => EfisVectors.isVectorReasonable(it));

      if (missedApproachGroup === mainGroup) {
        vectors.push(...missedVectors);
      } else {
        this.transmit(missedVectors, missedApproachGroup, side);
      }
    } else if (missedApproachGroup !== mainGroup) {
      this.transmit(null, missedApproachGroup, side);
    }

    this.transmit(vectors, mainGroup, side);

    // ALTN

    const transmitAlternate = this.efisInterfaces[side].shouldTransmitAlternate(plan.index, isPlanMode);

    if (transmitAlternate) {
      const alternateGeometry = this.guidanceController.getGeometryForFlightPlan(plan.index, true);

      if (alternateGeometry) {
        const alternateVectors = alternateGeometry
          .getAllPathVectors(0)
          .filter((it) => EfisVectors.isVectorReasonable(it));

        // ALTN missed

        const transmitAlternateMissed = this.efisInterfaces[side].shouldTransmitAlternateMissed(plan.index, isPlanMode);

        if (transmitAlternateMissed) {
          const missedVectors = alternateGeometry
            .getAllPathVectors(0, true)
            .filter((it) => EfisVectors.isVectorReasonable(it));

          alternateVectors.push(...missedVectors);
        }

        if (alternateGroup === mainGroup) {
          vectors.push(...alternateVectors);
        } else {
          this.transmit(alternateVectors, alternateGroup, side);
        }
      } else if (alternateGroup !== mainGroup) {
        this.transmit(null, alternateGroup, side);
      }
    } else if (alternateGroup !== mainGroup) {
      this.transmit(null, alternateGroup, side);
    }
  }

  private transmit(vectors: PathVector[], vectorsGroup: EfisVectorsGroup, side: EfisSide): void {
    this.syncer.sendEvent(`A32NX_EFIS_VECTORS_${side}_${EfisVectorsGroup[vectorsGroup]}`, vectors);
  }
}
