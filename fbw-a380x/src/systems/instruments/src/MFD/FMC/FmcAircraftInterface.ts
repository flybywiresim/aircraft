// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerValue,
  EventBus,
  GameStateProvider,
  SimVarValueType,
  Subject,
  Subscription,
  UnitType,
} from '@microsoft/msfs-sdk';
import { Arinc429SignStatusMatrix, Arinc429Word, FmsData, MathUtils, NXDataStore } from '@flybywiresim/fbw-sdk';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { MmrRadioTuningStatus } from '@fmgc/navigation/NavaidTuner';
import { Vmcl, Vmo, maxCertifiedAlt, maxZfw } from '@shared/PerformanceConstants';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FmgcDataService } from 'instruments/src/MFD/FMC/fmgc';
import { ADIRS } from 'instruments/src/MFD/shared/Adirs';
import { NXSystemMessages } from 'instruments/src/MFD/shared/NXSystemMessages';
import { A380OperatingSpeeds, A380SpeedsUtils } from '@shared/OperatingSpeeds';
import { FmcInterface } from 'instruments/src/MFD/FMC/FmcInterface';
import { FlightPhaseManagerEvents } from '@fmgc/flightphase';
import { FGVars } from 'instruments/src/MsfsAvionicsCommon/providers/FGDataPublisher';
import { VerticalMode } from '@shared/autopilot';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { FmsMfdVars } from 'instruments/src/MsfsAvionicsCommon/providers/FmsMfdPublisher';
import { MfdFmsFplnVertRev } from 'instruments/src/MFD/pages/FMS/F-PLN/MfdFmsFplnVertRev';

/**
 * Interface between FMS and rest of aircraft through SimVars and ARINC values (mostly data being sent here)
 * Essentially part of the FMC (-A/-B/-C)
 */
export class FmcAircraftInterface {
  private readonly subs = [] as Subscription[];

  private gameState = GameStateProvider.get();
  // ARINC words
  // arinc bus output words
  public arincDiscreteWord2 = FmArinc429OutputWord.emptyFm('DISCRETE_WORD_2');

  public arincDiscreteWord3 = FmArinc429OutputWord.emptyFm('DISCRETE_WORD_3');

  public arincTakeoffPitchTrim = FmArinc429OutputWord.emptyFm('TO_PITCH_TRIM');

  public arincLandingElevation = FmArinc429OutputWord.emptyFm('LANDING_ELEVATION');

  public arincDestinationLatitude = FmArinc429OutputWord.emptyFm('DEST_LAT');

  public arincDestinationLongitude = FmArinc429OutputWord.emptyFm('DEST_LONG');

  public arincMDA = FmArinc429OutputWord.emptyFm('MINIMUM_DESCENT_ALTITUDE');

  public arincDH = FmArinc429OutputWord.emptyFm('DECISION_HEIGHT');

  public arincThrustReductionAltitude = FmArinc429OutputWord.emptyFm('THR_RED_ALT');

  public arincAccelerationAltitude = FmArinc429OutputWord.emptyFm('ACC_ALT');

  public arincEoAccelerationAltitude = FmArinc429OutputWord.emptyFm('EO_ACC_ALT');

  public arincMissedThrustReductionAltitude = FmArinc429OutputWord.emptyFm('MISSED_THR_RED_ALT');

  public arincMissedAccelerationAltitude = FmArinc429OutputWord.emptyFm('MISSED_ACC_ALT');

  public arincMissedEoAccelerationAltitude = FmArinc429OutputWord.emptyFm('MISSED_EO_ACC_ALT');

  public arincTransitionAltitude = FmArinc429OutputWord.emptyFm('TRANS_ALT');

  public arincTransitionLevel = FmArinc429OutputWord.emptyFm('TRANS_LVL');

  public arincZeroFuelWeight = FmArinc429OutputWord.emptyFm('ZERO_FUEL_WEIGHT');

  public arincZeroFuelWeightCg = FmArinc429OutputWord.emptyFm('ZERO_FUEL_WEIGHT_CG');

  /** contains fm messages (not yet implemented) and nodh bit */
  public arincEisWord2 = FmArinc429OutputWord.emptyFm('EIS_DISCRETE_WORD_2');

  /** These arinc words will be automatically written to the bus, and automatically set to 0/NCD when the FMS resets */
  public arincBusOutputs = [
    this.arincDiscreteWord2,
    this.arincDiscreteWord3,
    this.arincTakeoffPitchTrim,
    this.arincLandingElevation,
    this.arincDestinationLatitude,
    this.arincDestinationLongitude,
    this.arincMDA,
    this.arincDH,
    this.arincThrustReductionAltitude,
    this.arincAccelerationAltitude,
    this.arincEoAccelerationAltitude,
    this.arincMissedThrustReductionAltitude,
    this.arincMissedAccelerationAltitude,
    this.arincMissedEoAccelerationAltitude,
    this.arincTransitionAltitude,
    this.arincTransitionLevel,
    this.arincZeroFuelWeight,
    this.arincZeroFuelWeightCg,
    this.arincEisWord2,
  ];

  private readonly speedVs1g = Subject.create(0);
  private readonly speedVls = Subject.create(0);
  private readonly speedVmax = Subject.create(0);
  private readonly speedVfeNext = Subject.create(0);
  private readonly speedVapp = Subject.create(0);
  private readonly speedShortTermManaged = Subject.create(0);

  private readonly tdReached = this.bus
    .getSubscriber<FmsMfdVars>()
    .on('tdReached')
    .whenChanged()
    .handle((v) => {
      if (v) {
        this.fmc.addMessageToQueue(NXSystemMessages.tdReached, undefined, () => {
          SimVar.SetSimVarValue('L:A32NX_PFD_MSG_TD_REACHED', 'Bool', false);
        });
      } else {
        this.fmc.removeMessageFromQueue(NXSystemMessages.tdReached.text);
      }
    });

  private readonly flightPhase = ConsumerValue.create(
    this.bus.getSubscriber<FlightPhaseManagerEvents>().on('fmgc_flight_phase').whenChanged(),
    FmgcFlightPhase.Preflight,
  );
  private readonly fmaVerticalMode = ConsumerValue.create(
    this.bus.getSubscriber<FGVars>().on('fg.fma.verticalMode').whenChanged(),
    0,
  );

  private readonly fmsOrigin = Subject.create<string | null>('');
  private readonly fmsDepartureRunway = Subject.create<string | null>('');
  private readonly fmsDestination = Subject.create<string | null>('');
  private readonly fmsLandingRunway = Subject.create<string | null>('');
  private readonly fmsAlternate = Subject.create<string | null>('');

  constructor(
    private bus: EventBus,
    private fmc: FmcInterface,
    private fmgc: FmgcDataService,
    private flightPlanService: FlightPlanService,
  ) {
    this.init();
  }

  destroy() {
    for (const s of this.subs) {
      s.destroy();
    }
  }

  private init(): void {
    // write local vars for other systems
    this.subs.push(
      this.fmgc.data.greenDotSpeed.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_GD', 'number', v), true),
    );
    this.subs.push(
      this.fmgc.data.slatRetractionSpeed.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_S', 'number', v), true),
    );
    this.subs.push(
      this.fmgc.data.flapRetractionSpeed.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_F', 'number', v), true),
    );

    this.subs.push(this.speedVs1g.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_VS', 'number', v), true));
    this.subs.push(this.speedVls.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_VLS', 'number', v), true));
    this.subs.push(this.speedVmax.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_VMAX', 'number', v), true));
    this.subs.push(this.speedVfeNext.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_VFEN', 'number', v), true));
    this.subs.push(this.speedVapp.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_VAPP', 'number', v), true));
    this.subs.push(
      this.speedShortTermManaged.sub(
        (v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_SHORT_TERM_PFD', 'number', v),
        true,
      ),
    );

    this.subs.push(
      this.fmgc.data.approachFlapConfig.sub(
        (v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_LANDING_CONF3', SimVarValueType.Bool, v === FlapConf.CONF_3),
        true,
      ),
    );

    this.subs.push(
      this.fmc.fmgc.data.zeroFuelWeight.sub((zfw) => {
        this.arincZeroFuelWeight.setBnrValue(
          zfw ? zfw : 0,
          zfw ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
          19,
          524288,
          0,
        );
      }),
    );

    this.subs.push(
      this.fmc.fmgc.data.zeroFuelWeightCenterOfGravity.sub((zfwCg) =>
        this.arincZeroFuelWeightCg.setBnrValue(
          zfwCg ? zfwCg : 0,
          zfwCg ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
          12,
          64,
          0,
        ),
      ),
    );

    const pub = this.bus.getPublisher<FmsData>();
    this.subs.push(
      this.fmsOrigin.sub((v) => pub.pub('fmsOrigin', v, true), true),
      this.fmsDepartureRunway.sub((v) => pub.pub('fmsDepartureRunway', v, true), true),
      this.fmsDestination.sub((v) => pub.pub('fmsDestination', v, true), true),
      this.fmsLandingRunway.sub((v) => pub.pub('fmsLandingRunway', v, true), true),
      this.fmsAlternate.sub((v) => pub.pub('fmsAlternate', v, true), true),
      this.fmgc.data.atcCallsign.sub((v) => pub.pub('fmsFlightNumber', v, true), true),
    );
  }

  thrustReductionAccelerationChecks() {
    const activePlan = this.flightPlanService.active;

    if (activePlan.reconcileAccelerationWithConstraints() && activePlan.performanceData.accelerationAltitude) {
      this.fmc.addMessageToQueue(
        NXSystemMessages.newAccAlt.getModifiedMessage(activePlan.performanceData.accelerationAltitude.toFixed(0)),
        undefined,
        undefined,
      );
    }

    if (activePlan.reconcileThrustReductionWithConstraints() && activePlan.performanceData.thrustReductionAltitude) {
      this.fmc.addMessageToQueue(
        NXSystemMessages.newThrRedAlt.getModifiedMessage(activePlan.performanceData.thrustReductionAltitude.toFixed(0)),
        undefined,
        undefined,
      );
    }
  }

  public updateThrustReductionAcceleration() {
    if (!this.flightPlanService.hasActive) {
      return;
    }
    const activePerformanceData = this.flightPlanService.active.performanceData;

    this.arincThrustReductionAltitude.setBnrValue(
      activePerformanceData.thrustReductionAltitude !== null ? activePerformanceData.thrustReductionAltitude : 0,
      activePerformanceData.thrustReductionAltitude !== null
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );
    this.arincAccelerationAltitude.setBnrValue(
      activePerformanceData.accelerationAltitude !== null ? activePerformanceData.accelerationAltitude : 0,
      activePerformanceData.accelerationAltitude !== null
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );
    this.arincEoAccelerationAltitude.setBnrValue(
      activePerformanceData.engineOutAccelerationAltitude !== null
        ? activePerformanceData.engineOutAccelerationAltitude
        : 0,
      activePerformanceData.engineOutAccelerationAltitude !== null
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );

    this.arincMissedThrustReductionAltitude.setBnrValue(
      activePerformanceData.missedThrustReductionAltitude !== null
        ? activePerformanceData.missedThrustReductionAltitude
        : 0,
      activePerformanceData.missedThrustReductionAltitude !== null
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );
    this.arincMissedAccelerationAltitude.setBnrValue(
      activePerformanceData.missedAccelerationAltitude !== null ? activePerformanceData.missedAccelerationAltitude : 0,
      activePerformanceData.missedAccelerationAltitude !== null
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );
    this.arincMissedEoAccelerationAltitude.setBnrValue(
      activePerformanceData.missedEngineOutAccelerationAltitude !== null
        ? activePerformanceData.missedEngineOutAccelerationAltitude
        : 0,
      activePerformanceData.missedEngineOutAccelerationAltitude !== null
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );
  }

  public updateTransitionAltitudeLevel(): void {
    if (!this.flightPlanService.hasActive) {
      return;
    }

    this.arincTransitionAltitude.setBnrValue(
      this.flightPlanService.active.performanceData.transitionAltitude ?? 0, // as altitude
      this.flightPlanService.active.performanceData.transitionAltitude !== null &&
        this.flightPlanService.active.performanceData.transitionAltitude !== undefined
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );

    this.arincTransitionLevel.setBnrValue(
      this.flightPlanService.active.performanceData.transitionLevel ?? 0, // as FL
      this.flightPlanService.active.performanceData.transitionLevel !== null &&
        this.flightPlanService.active.performanceData.transitionLevel !== undefined
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      9,
      512,
      0,
    );
  }

  public updatePerformanceData() {
    if (!this.flightPlanService.hasActive) {
      return;
    }

    // If spawned after T/O, set reasonable V2
    if (this.flightPhase.get() > FmgcFlightPhase.Preflight && !this.flightPlanService.active.performanceData.v2) {
      const fSpeed = SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number') as number;
      this.flightPlanService.setPerformanceData('v2', Math.round(fSpeed));
    }

    SimVar.SetSimVarValue('L:AIRLINER_V1_SPEED', 'Knots', this.flightPlanService.active.performanceData.v1 ?? NaN);
    SimVar.SetSimVarValue('L:AIRLINER_V2_SPEED', 'Knots', this.flightPlanService.active.performanceData.v2 ?? NaN);
    SimVar.SetSimVarValue('L:AIRLINER_VR_SPEED', 'Knots', this.flightPlanService.active.performanceData.vr ?? NaN);
  }

  public getToSpeedsTooLow(): boolean {
    if (!this.flightPlanService.hasActive) {
      return false;
    }

    if (this.fmgc.data.takeoffFlapsSetting === null || this.fmc.fmgc.getGrossWeightKg() === null) {
      return false;
    }

    const departureElevation = this.fmgc.getDepartureElevation();

    const zp =
      departureElevation !== null
        ? this.fmgc.getPressureAltAtElevation(departureElevation, this.fmgc.getBaroCorrection1())
        : this.fmgc.getPressureAlt();
    if (zp === null) {
      return false;
    }

    return (
      (this.flightPlanService.active.performanceData.v1 ?? Infinity) < Math.trunc(A380SpeedsUtils.getVmcg(zp)) ||
      (this.flightPlanService.active.performanceData.vr ?? Infinity) < Math.trunc(1.05 * A380SpeedsUtils.getVmca(zp)) ||
      (this.flightPlanService.active.performanceData.v2 ?? Infinity) < Math.trunc(1.1 * A380SpeedsUtils.getVmca(zp))
    );
  }

  private toSpeedsNotInserted = true;

  private toSpeedsTooLow = false;

  private vSpeedDisagree = false;

  private vSpeedsValid(): boolean {
    if (!this.flightPlanService.hasActive) {
      return false;
    }

    const v1Speed = this.flightPlanService.active.performanceData.v1;
    const vRSpeed = this.flightPlanService.active.performanceData.vr;
    const v2Speed = this.flightPlanService.active.performanceData.v2;

    return (
      (!!v1Speed && !!vRSpeed ? v1Speed <= vRSpeed : true) &&
      (!!vRSpeed && !!v2Speed ? vRSpeed <= v2Speed : true) &&
      (!!v1Speed && !!v2Speed ? v1Speed <= v2Speed : true)
    );
  }

  public toSpeedsChecks() {
    if (!this.flightPlanService.hasActive) {
      return;
    }

    const toSpeedsNotInserted =
      !this.flightPlanService.active.performanceData.v1 ||
      !this.flightPlanService.active.performanceData.vr ||
      !this.flightPlanService.active.performanceData.v2;
    if (toSpeedsNotInserted !== this.toSpeedsNotInserted) {
      this.toSpeedsNotInserted = toSpeedsNotInserted;
    }

    const toSpeedsTooLow = false; // FIXME revert once speeds are checked this.getToSpeedsTooLow();
    if (toSpeedsTooLow !== this.toSpeedsTooLow) {
      this.toSpeedsTooLow = toSpeedsTooLow;
      if (toSpeedsTooLow) {
        this.fmc.addMessageToQueue(NXSystemMessages.toSpeedTooLow, () => !this.getToSpeedsTooLow(), undefined);
      }
    }

    const vSpeedDisagree = !this.vSpeedsValid();
    if (vSpeedDisagree !== this.vSpeedDisagree) {
      this.vSpeedDisagree = vSpeedDisagree;
      if (vSpeedDisagree) {
        this.fmc.addMessageToQueue(NXSystemMessages.vToDisagree, () => this.vSpeedsValid(), undefined);
      }
    }

    this.arincDiscreteWord3.setBitValue(16, vSpeedDisagree);
    this.arincDiscreteWord3.setBitValue(17, toSpeedsTooLow);
    this.arincDiscreteWord3.setBitValue(18, toSpeedsNotInserted);
    this.arincDiscreteWord3.ssm = Arinc429SignStatusMatrix.NormalOperation;
  }

  /**
   * Set the takeoff flap config
   * @param {0 | 1 | 2 | 3 | null} flaps
   */
  setTakeoffFlaps(flaps: FlapConf) {
    this.arincDiscreteWord2.setBitValue(13, flaps === 0);
    this.arincDiscreteWord2.setBitValue(14, flaps === 1);
    this.arincDiscreteWord2.setBitValue(15, flaps === 2);
    this.arincDiscreteWord2.setBitValue(16, flaps === 3);
    this.arincDiscreteWord2.ssm = Arinc429SignStatusMatrix.NormalOperation;
  }

  /**
   * Set the takeoff trim config
   * @param ths trimmable horizontal stabilizer
   */
  setTakeoffTrim(ths: number) {
    const ssm = ths !== null ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

    this.arincTakeoffPitchTrim.setBnrValue(ths, ssm, 12, 180, -180);
  }

  private landingElevation: number | null = null;

  private destinationLatitude: number | null = null;

  private destinationLongitude: number | null = null;

  async updateDestinationData() {
    let landingElevation: number | null = null;
    let latitude: number | null = null;
    let longitude: number | null = null;

    const runway = this.flightPlanService.active.destinationRunway;

    if (runway) {
      landingElevation = runway.thresholdLocation.alt;
      latitude = runway.thresholdLocation.lat;
      longitude = runway.thresholdLocation.long;
    } else {
      const airport = this.flightPlanService.active.destinationAirport;

      if (airport) {
        const ele = airport.location.alt;

        landingElevation = Number.isFinite(ele) ? ele : null;
        latitude = airport.location.lat;
        longitude = airport.location.long;
      }
    }

    if (this.landingElevation !== landingElevation) {
      this.landingElevation = landingElevation;

      const ssm =
        landingElevation !== undefined
          ? Arinc429SignStatusMatrix.NormalOperation
          : Arinc429SignStatusMatrix.NoComputedData;

      this.arincLandingElevation.setBnrValue(landingElevation || 0, ssm, 14, 16384, -2048);

      // FIXME CPCs should use the FM ARINC vars, and transmit their own vars as well
      SimVar.SetSimVarValue('L:A32NX_PRESS_AUTO_LANDING_ELEVATION', 'feet', landingElevation || 0);
    }

    if (this.destinationLatitude !== latitude) {
      this.destinationLatitude = latitude;

      const ssm =
        latitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

      this.arincDestinationLatitude.setBnrValue(latitude || 0, ssm, 18, 180, -180);
    }

    if (this.destinationLongitude !== longitude) {
      this.destinationLongitude = longitude;

      const ssm =
        longitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

      this.arincDestinationLongitude.setBnrValue(longitude || 0, ssm, 18, 180, -180);
    }
  }

  updateMinimums(distanceToDestination: number) {
    const inRange = this.shouldTransmitMinimums(distanceToDestination);

    const mda = this.fmgc.data.approachBaroMinimum.get();
    const dh = this.fmgc.data.approachRadioMinimum.get();

    const mdaValid = inRange && mda !== null;
    const dhValid = !mdaValid && inRange && typeof dh === 'number';

    const mdaSsm = mdaValid ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;
    const dhSsm = dhValid ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

    this.arincMDA.setBnrValue(mdaValid ? (mda as number) : 0, mdaSsm, 17, 131072, 0);
    this.arincDH.setBnrValue(dhValid ? dh : 0, dhSsm, 16, 8192, 0);
    this.arincEisWord2.setBitValue(29, inRange && !dhValid);
    // FIXME we need to handle these better
    this.arincEisWord2.ssm = Arinc429SignStatusMatrix.NormalOperation;
  }

  shouldTransmitMinimums(distanceToDestination: number) {
    const phase = this.flightPhase.get();
    const isCloseToDestination = Number.isFinite(distanceToDestination) ? distanceToDestination < 250 : true;

    return phase > FmgcFlightPhase.Cruise || (phase === FmgcFlightPhase.Cruise && isCloseToDestination);
  }

  updateFmsData() {
    this.fmsOrigin.set(
      this.flightPlanService.hasActive && this.flightPlanService.active?.originAirport?.ident
        ? this.flightPlanService.active.originAirport.ident
        : null,
    );

    this.fmsDepartureRunway.set(
      this.flightPlanService.hasActive && this.flightPlanService.active?.originRunway?.ident
        ? this.flightPlanService.active.originRunway.ident
        : null,
    );

    this.fmsDestination.set(
      this.flightPlanService.hasActive && this.flightPlanService.active?.destinationAirport?.ident
        ? this.flightPlanService.active.destinationAirport.ident
        : null,
    );

    this.fmsLandingRunway.set(
      this.flightPlanService.hasActive && this.flightPlanService.active?.destinationRunway?.ident
        ? this.flightPlanService.active.destinationRunway.ident
        : null,
    );

    this.fmsAlternate.set(
      this.flightPlanService.hasActive && this.flightPlanService.active?.alternateDestinationAirport?.ident
        ? this.flightPlanService.active.alternateDestinationAirport.ident
        : null,
    );
  }

  activatePreSelSpeedMach(preSel: number) {
    if (preSel) {
      if (preSel < 1) {
        SimVar.SetSimVarValue('H:A320_Neo_FCU_USE_PRE_SEL_MACH', 'number', 1);
      } else {
        SimVar.SetSimVarValue('H:A320_Neo_FCU_USE_PRE_SEL_SPEED', 'number', 1);
      }
    }
  }

  updatePreSelSpeedMach(preSel: number | null) {
    // The timeout is required to create a delay for the current value to be read and the new one to be set
    setTimeout(() => {
      if (preSel) {
        if (preSel > 1) {
          SimVar.SetSimVarValue('L:A32NX_SpeedPreselVal', 'knots', preSel);
          SimVar.SetSimVarValue('L:A32NX_MachPreselVal', 'mach', -1);
        } else {
          SimVar.SetSimVarValue('L:A32NX_SpeedPreselVal', 'knots', -1);
          SimVar.SetSimVarValue('L:A32NX_MachPreselVal', 'mach', preSel);
        }
      } else {
        SimVar.SetSimVarValue('L:A32NX_SpeedPreselVal', 'knots', -1);
        SimVar.SetSimVarValue('L:A32NX_MachPreselVal', 'mach', -1);
      }
    }, 200);
  }

  /*
        When the aircraft is in the holding, predictions assume that the leg is flown at holding speed
        with a vertical speed equal to - 1000 ft/mn until reaching a restrictive altitude constraint, the
        FCU altitude or the exit fix. If FCU or constraint altitude is reached first, the rest of the
        pattern is assumed to be flown level at that altitude
        */
  getHoldingSpeed(speedConstraint = null, altitude = null) {
    const fcuAltitude = SimVar.GetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR:3', 'feet');
    const alt = Math.max(fcuAltitude, altitude ? altitude : 0);

    let kcas = SimVar.GetSimVarValue('L:A32NX_SPEEDS_GD', 'number');
    if (this.flightPhase.get() === FmgcFlightPhase.Approach) {
      kcas = this.getAppManagedSpeed();
    }

    if (speedConstraint != null && speedConstraint > 100) {
      kcas = Math.min(kcas, speedConstraint);
    }

    // apply icao limits
    if (alt < 14000) {
      kcas = Math.min(230, kcas);
    } else if (alt < 20000) {
      kcas = Math.min(240, kcas);
    } else if (alt < 34000) {
      kcas = Math.min(265, kcas);
    } else {
      kcas = this.fmgc.guidanceController?.atmosphericConditions.computeCasFromMach(alt, 0.83);
    }

    // apply speed limit/alt
    if (this.flightPhase.get() <= FmgcFlightPhase.Cruise) {
      const climbSpeedLimit = this.fmgc.getClimbSpeedLimit();
      if (climbSpeedLimit !== null && alt <= climbSpeedLimit.underAltitude) {
        kcas = Math.min(climbSpeedLimit.speed, kcas);
      }
    } else if (this.flightPhase.get() < FmgcFlightPhase.GoAround) {
      const descentSpeedLimit = this.fmgc.getDescentSpeedLimit();
      if (descentSpeedLimit !== null && alt <= descentSpeedLimit.underAltitude) {
        kcas = Math.min(descentSpeedLimit.speed, kcas);
      }
    }

    kcas = Math.max(kcas, SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number'));

    return Math.ceil(kcas);
  }

  updateHoldingSpeed() {
    const plan = this.flightPlanService.active;
    const currentLegIndex = plan.activeLegIndex;
    const nextLegIndex = currentLegIndex + 1;
    const currentLegConstraints = this.managedProfile.get(currentLegIndex) || {};
    const nextLegConstraints = this.managedProfile.get(nextLegIndex) || {};

    const currentLeg = plan.maybeElementAt(currentLegIndex);
    const nextLeg = plan.maybeElementAt(nextLegIndex);

    const casWord = ADIRS.getCalibratedAirspeed();
    const cas = casWord && casWord.isNormalOperation() ? casWord.value : 0;

    let enableHoldSpeedWarning = false;
    let holdSpeedTarget = 0;
    let holdDecelReached = this.holdDecelReached;
    // FIXME big hack until VNAV can do this
    if (currentLeg && currentLeg.isDiscontinuity === false && currentLeg.type === 'HM') {
      holdSpeedTarget = this.getHoldingSpeed(currentLegConstraints.descentSpeed, currentLegConstraints.descentAltitude);
      holdDecelReached = true;
      enableHoldSpeedWarning = !Simplane.getAutoPilotAirspeedManaged();
      // this.holdIndex = plan.activeLegIndex; Only needed in A32NX for ATSU it seems
    } else if (nextLeg && nextLeg.isDiscontinuity === false && nextLeg.type === 'HM') {
      const adirLat = ADIRS.getLatitude();
      const adirLong = ADIRS.getLongitude();

      if (adirLat && adirLong && adirLat.isNormalOperation() && adirLong.isNormalOperation()) {
        holdSpeedTarget = this.getHoldingSpeed(nextLegConstraints.descentSpeed, nextLegConstraints.descentAltitude);

        const dtg = this.fmgc.guidanceController?.activeLegDtg;
        // decel range limits are [3, 20] NM
        const decelDist = this.calculateDecelDist(cas, holdSpeedTarget);
        if (dtg != null && dtg < decelDist) {
          holdDecelReached = true;
        }

        const gsWord = ADIRS.getGroundSpeed();
        const gs = gsWord && gsWord.isNormalOperation() ? gsWord.value : 0;
        const warningDist = decelDist + gs / 120;
        if (!Simplane.getAutoPilotAirspeedManaged() && dtg != null && dtg <= warningDist) {
          enableHoldSpeedWarning = true;
        }
      }
      // this.holdIndex = plan.activeLegIndex + 1; Only needed in A32NX for ATSU it seems
    } else {
      // this.holdIndex = 0; Only needed in A32NX for ATSU it seems
      holdDecelReached = false;
    }

    if (holdDecelReached !== this.holdDecelReached) {
      this.holdDecelReached = holdDecelReached;
      SimVar.SetSimVarValue('L:A32NX_FM_HOLD_DECEL', 'bool', this.holdDecelReached);
    }

    if (holdSpeedTarget !== this.holdSpeedTarget) {
      this.holdSpeedTarget = holdSpeedTarget;
      SimVar.SetSimVarValue('L:A32NX_FM_HOLD_SPEED', 'number', this.holdSpeedTarget);
    }

    if (enableHoldSpeedWarning && cas - this.holdSpeedTarget > 5) {
      if (!this.setHoldSpeedMessageActive) {
        this.setHoldSpeedMessageActive = true;
        this.fmc.addMessageToQueue(
          NXSystemMessages.setHoldSpeed,
          () => !this.setHoldSpeedMessageActive,
          () => SimVar.SetSimVarValue('L:A32NX_PFD_MSG_SET_HOLD_SPEED', 'bool', false),
        );
        SimVar.SetSimVarValue('L:A32NX_PFD_MSG_SET_HOLD_SPEED', 'bool', true);
      }
    } else if (this.setHoldSpeedMessageActive) {
      SimVar.SetSimVarValue('L:A32NX_PFD_MSG_SET_HOLD_SPEED', 'bool', false);
      this.setHoldSpeedMessageActive = false;
    }
  }

  /** in knots or mach */
  private managedSpeedTarget: number | null = null;

  private managedSpeedTargetIsMach = false;

  private holdDecelReached = false;

  private holdSpeedTarget = 0;

  private setHoldSpeedMessageActive = false;

  /** in knots */
  private takeoffEngineOutSpeed: number | null = null;

  updateManagedSpeed() {
    if (!this.flightPlanService.hasActive) {
      return;
    }
    const activePerformanceData = this.flightPlanService.active.performanceData;

    let vPfd: number = 0;
    let isMach = false;
    let takeoffGoAround = false;

    this.updateHoldingSpeed();
    this.fmc.clearCheckSpeedModeMessage();

    if (SimVar.GetSimVarValue('L:A32NX_FMA_EXPEDITE_MODE', 'number') === 1) {
      const verticalMode = this.fmaVerticalMode.get();
      if (verticalMode === VerticalMode.OP_CLB) {
        switch (SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number')) {
          case 0: {
            this.managedSpeedTarget = SimVar.GetSimVarValue('L:A32NX_SPEEDS_GD', 'number');
            break;
          }
          case 1: {
            this.managedSpeedTarget = SimVar.GetSimVarValue('L:A32NX_SPEEDS_S', 'number');
            break;
          }
          default: {
            this.managedSpeedTarget = SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number');
          }
        }
      } else if (verticalMode === VerticalMode.OP_DES) {
        this.managedSpeedTarget =
          SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number') === 0
            ? Math.min(340, SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', 0.8))
            : this.speedVmax.get() - 10;
      }
      if (this.managedSpeedTarget != null) {
        vPfd = this.managedSpeedTarget;
      }
    } else if (this.holdDecelReached) {
      vPfd = this.holdSpeedTarget;
      this.managedSpeedTarget = this.holdSpeedTarget;
    } else {
      if (this.setHoldSpeedMessageActive) {
        this.setHoldSpeedMessageActive = false;
        SimVar.SetSimVarValue('L:A32NX_PFD_MSG_SET_HOLD_SPEED', 'bool', false);
        this.fmc.removeMessageFromQueue(NXSystemMessages.setHoldSpeed.text);
      }

      const engineOut = !this.fmgc.isAllEngineOn();

      switch (this.flightPhase.get()) {
        case FmgcFlightPhase.Preflight: {
          if (activePerformanceData.v2) {
            vPfd = activePerformanceData.v2;
            this.managedSpeedTarget = activePerformanceData.v2 + 10;
            takeoffGoAround = true;
          }
          break;
        }
        case FmgcFlightPhase.Takeoff: {
          if (activePerformanceData.v2) {
            vPfd = activePerformanceData.v2;
            this.managedSpeedTarget = engineOut
              ? Math.min(
                  activePerformanceData.v2 + 15,
                  Math.max(activePerformanceData.v2, this.takeoffEngineOutSpeed ? this.takeoffEngineOutSpeed : 0),
                )
              : activePerformanceData.v2 + 10;
            takeoffGoAround = true;
          }
          break;
        }
        case FmgcFlightPhase.Climb: {
          let speed = this.fmgc.getManagedClimbSpeed();
          const speedLimit = this.fmgc.getClimbSpeedLimit();

          if (speedLimit !== null && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < speedLimit.underAltitude) {
            speed = Math.min(speed, speedLimit.speed);
          }

          speed = Math.min(speed, this.getSpeedConstraint());

          [this.managedSpeedTarget, isMach] = this.getManagedTargets(speed, this.fmgc.getManagedClimbSpeedMach());
          vPfd = this.managedSpeedTarget ?? speed;
          break;
        }
        case FmgcFlightPhase.Cruise: {
          let speed = this.fmgc.getManagedCruiseSpeed();
          const speedLimit = this.fmgc.getClimbSpeedLimit();
          if (speedLimit !== null && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < speedLimit.underAltitude) {
            speed = Math.min(speed, speedLimit.speed);
          }

          [this.managedSpeedTarget, isMach] = this.getManagedTargets(speed, this.fmgc.getManagedCruiseSpeedMach());
          vPfd = this.managedSpeedTarget ?? speed;
          break;
        }
        case FmgcFlightPhase.Descent: {
          // We fetch this data from VNAV
          vPfd = SimVar.GetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots');
          this.managedSpeedTarget = SimVar.GetSimVarValue('L:A32NX_SPEEDS_MANAGED_ATHR', 'knots');

          // Whether to use Mach or not should be based on the original managed speed, not whatever VNAV uses under the hood to vary it.
          // Also, VNAV already does the conversion from Mach if necessary
          isMach = this.getManagedTargets(
            this.fmgc.getManagedDescentSpeed(),
            this.fmgc.getManagedDescentSpeedMach(),
          )[1];
          break;
        }
        case FmgcFlightPhase.Approach: {
          // the displayed target is Vapp (with GSmini)
          // the guidance target is lower limited by FAC manouvering speeds (O, S, F) unless in landing config
          // constraints are not considered
          const speed = this.getAppManagedSpeed();
          vPfd = this.getVAppGsMini() ?? speed;

          this.managedSpeedTarget = Math.max(speed ?? 0, vPfd);
          break;
        }
        case FmgcFlightPhase.GoAround: {
          if (this.fmaVerticalMode.get() === VerticalMode.SRS_GA) {
            const speed = Math.min(
              this.fmgc.data.approachVls.get() ?? Infinity + (engineOut ? 15 : 25),
              Math.max(
                SimVar.GetSimVarValue('L:A32NX_GOAROUND_INIT_SPEED', 'number'),
                this.fmgc.data.approachSpeed.get() ?? 0,
              ),
              this.speedVmax.get() - 5,
            );
            vPfd = speed;
            this.managedSpeedTarget = speed;
            takeoffGoAround = true;
          } else {
            const speedConstraint = this.getSpeedConstraint();
            const speed = Math.min(this.fmgc.data.greenDotSpeed.get() ?? Infinity, speedConstraint);

            vPfd = speed;
            this.managedSpeedTarget = speed;
          }
          break;
        }
        default:
          break;
      }
    }

    // Automatically change fcu mach/speed mode
    if (this.managedSpeedTargetIsMach !== isMach) {
      if (isMach) {
        SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_ON', 'number', 1);
      } else {
        SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_OFF', 'number', 1);
      }
      this.managedSpeedTargetIsMach = isMach;
    }

    let Vtap = 0;
    let limitedByVls = false;
    // VLS protection
    if (this.managedSpeedTarget) {
      const vls = this.speedVls.get();
      if (this.managedSpeedTarget < vls) {
        Vtap = vls;
        limitedByVls = true;
      }
    }

    if (!Vtap) {
      // Overspeed protection
      const vMax = this.speedVmax.get();
      const greenDot = this.fmgc.data.greenDotSpeed.get();
      const vMin = SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number') === 0 && greenDot ? greenDot : 0;
      Vtap = Math.min(Math.max(this.managedSpeedTarget ?? Vmo - 5, vMin), vMax - 5);
    }
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_PFD', 'knots', vPfd);
    SimVar.SetSimVarValue('L:A32NX_SPEEDS_MANAGED_ATHR', 'knots', Vtap);

    const ismanaged = this.isAirspeedManaged();

    if (ismanaged) {
      Coherent.call('AP_SPD_VAR_SET', 0, Vtap).catch(console.error);
    }

    //short term managed speed
    let shortTermManagedSpeed = 0;
    const phase = this.flightPhase.get();
    if (phase != FmgcFlightPhase.Preflight) {
      if (this.managedSpeedTarget) {
        if (ismanaged) {
          const shortTermActiveInmanaged =
            !takeoffGoAround && phase != FmgcFlightPhase.Cruise && this.fmaVerticalMode.get() != VerticalMode.DES;
          if (shortTermActiveInmanaged && this.isSpeedDifferenceGreaterThan2Kt(vPfd, Vtap)) {
            shortTermManagedSpeed = Vtap;
          }
        } else {
          const selectedSpeed = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_SPEED_SELECTED', 'number');
          if (selectedSpeed) {
            const speedTarget = phase == FmgcFlightPhase.Approach || limitedByVls ? Vtap : vPfd; // FIX me Should use ECON during hold & deceleration segments
            if (this.isSpeedDifferenceGreaterThan2Kt(selectedSpeed, speedTarget)) {
              shortTermManagedSpeed = speedTarget;
            }
          }
        }
      }
    }
    this.speedShortTermManaged.set(Math.round(shortTermManagedSpeed));
  }

  private isSpeedDifferenceGreaterThan2Kt(speed: number, speed2: number) {
    return Math.abs(speed - speed2) > 2;
  }

  getAppManagedSpeed() {
    switch (SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number')) {
      case 0:
        return this.fmgc.data.greenDotSpeed.get();
      case 1:
        return this.fmgc.data.slatRetractionSpeed.get();
      case 3:
        return this.fmgc.data.approachFlapConfig.get() === FlapConf.CONF_3
          ? this.fmgc.data.approachSpeed.get()
          : this.fmgc.data.flapRetractionSpeed.get();
      case 4:
        return this.fmgc.data.approachSpeed.get();
      default:
        return this.fmgc.data.flapRetractionSpeed.get();
    }
  }

  getVAppGsMini() {
    let vAppTarget = this.fmgc.data.approachSpeed.get() ?? SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number');
    let towerHeadwind = 0;
    const appWind = this.fmgc.data.approachWind.get();
    const destRwy = this.fmgc.getDestinationRunway();
    if (appWind && Number.isFinite(appWind.speed) && Number.isFinite(appWind.direction)) {
      if (destRwy) {
        towerHeadwind = A380SpeedsUtils.getHeadwind(appWind.speed, appWind.direction, destRwy.magneticBearing);
      }
      vAppTarget = A380SpeedsUtils.getVtargetGSMini(vAppTarget, A380SpeedsUtils.getHeadWindDiff(towerHeadwind));
    }
    return vAppTarget;
  }

  private speedLimitExceeded = false;

  checkSpeedLimit() {
    let speedLimit: number | undefined;
    let speedLimitAlt: number | undefined;
    switch (this.flightPhase.get()) {
      case FmgcFlightPhase.Climb:
      case FmgcFlightPhase.Cruise:
        speedLimit = this.fmgc.getClimbSpeedLimit()?.speed;
        speedLimitAlt = this.fmgc.getClimbSpeedLimit()?.underAltitude;
        break;
      case FmgcFlightPhase.Descent:
        speedLimit = this.fmgc.getDescentSpeedLimit()?.speed;
        speedLimitAlt = this.fmgc.getDescentSpeedLimit()?.underAltitude;
        break;
      default:
        // no speed limit in other phases
        this.speedLimitExceeded = false;
        return;
    }

    if (speedLimit === undefined || speedLimitAlt === undefined) {
      this.speedLimitExceeded = false;
      return;
    }

    const cas = ADIRS.getCalibratedAirspeed();
    const alt = ADIRS.getBaroCorrectedAltitude();

    if (this.speedLimitExceeded && cas && alt) {
      const resetLimitExceeded =
        !cas.isNormalOperation() ||
        !alt.isNormalOperation() ||
        alt.value > speedLimitAlt ||
        cas.value <= speedLimit + 5;
      if (resetLimitExceeded) {
        this.speedLimitExceeded = false;
        this.fmc.removeMessageFromQueue(NXSystemMessages.spdLimExceeded.text);
      }
    } else if (cas && alt && cas.isNormalOperation() && alt.isNormalOperation()) {
      const setLimitExceeded = alt.value < speedLimitAlt - 150 && cas.value > speedLimit + 10;
      if (setLimitExceeded) {
        this.speedLimitExceeded = true;
        this.fmc.addMessageToQueue(NXSystemMessages.spdLimExceeded, () => !this.speedLimitExceeded, undefined);
      }
    }
  }

  private apMasterStatus: boolean = false;

  private lastUpdateAPTime: number = 0;

  private updateAutopilotCooldown: number = 0;

  private apCooldown: number = 500;

  private forceNextAltitudeUpdate: boolean = true;

  private activeWpIdx: number = 0;

  /** in feet */
  private constraintAlt: number | null = null;

  private lastRequestedFLCModeWaypointIndex: number | null = null;

  updateAutopilot(dt: number) {
    let apLogicOn = this.apMasterStatus || Simplane.getAutoPilotFlightDirectorActive(1);
    this.lastUpdateAPTime = Date.now();
    if (Number.isFinite(dt)) {
      this.updateAutopilotCooldown -= dt;
    }
    if (SimVar.GetSimVarValue('L:AIRLINER_FMC_FORCE_NEXT_UPDATE', 'number') === 1) {
      SimVar.SetSimVarValue('L:AIRLINER_FMC_FORCE_NEXT_UPDATE', 'number', 0);
      this.updateAutopilotCooldown = -1;
    }

    if (
      this.flightPhase.get() === FmgcFlightPhase.Takeoff &&
      !this.fmgc.isAllEngineOn() &&
      this.takeoffEngineOutSpeed === undefined
    ) {
      const casWord = ADIRS.getCalibratedAirspeed();
      this.takeoffEngineOutSpeed = casWord && casWord.isNormalOperation() ? casWord.value : null;
    }

    if (this.updateAutopilotCooldown < 0) {
      this.updatePerfSpeeds();
      this.updateConstraints();
      this.updateManagedSpeed();
      const currentApMasterStatus = SimVar.GetSimVarValue('AUTOPILOT MASTER', 'boolean');
      if (currentApMasterStatus !== this.apMasterStatus) {
        this.apMasterStatus = currentApMasterStatus;
        apLogicOn = this.apMasterStatus || Simplane.getAutoPilotFlightDirectorActive(1);
        this.forceNextAltitudeUpdate = true;
        console.log('Enforce AP in Altitude Lock mode. Cause : AP Master Status has changed.');
        SimVar.SetSimVarValue('L:A320_NEO_FCU_FORCE_IDLE_VS', 'Number', 1);
        if (this.apMasterStatus) {
          if (this.flightPlanService.hasActive && this.flightPlanService.active.legCount === 0) {
            this.onModeSelectedAltitude();
            this.onModeSelectedHeading();
          }
        }
      }
      if (apLogicOn) {
        if (!Simplane.getAutoPilotFLCActive() && !SimVar.GetSimVarValue('AUTOPILOT AIRSPEED HOLD', 'Boolean')) {
          SimVar.SetSimVarValue('K:AP_PANEL_SPEED_HOLD', 'Number', 1);
        }
        if (!SimVar.GetSimVarValue('AUTOPILOT HEADING LOCK', 'Boolean')) {
          if (!SimVar.GetSimVarValue('AUTOPILOT APPROACH HOLD', 'Boolean')) {
            SimVar.SetSimVarValue('K:AP_PANEL_HEADING_HOLD', 'Number', 1);
          }
        }
      }

      if (this.isAltitudeManaged()) {
        const plan = this.flightPlanService.active;

        const prevWaypoint = plan.hasElement(plan.activeLegIndex - 1);
        const nextWaypoint = plan.hasElement(plan.activeLegIndex + 1);

        if (prevWaypoint && nextWaypoint) {
          const activeWpIdx = plan.activeLegIndex;

          if (activeWpIdx !== this.activeWpIdx) {
            this.activeWpIdx = activeWpIdx;
            this.updateConstraints();
          }
          if (this.constraintAlt) {
            Coherent.call('AP_ALT_VAR_SET_ENGLISH', 2, this.constraintAlt, this.forceNextAltitudeUpdate).catch(
              console.error,
            );
            this.forceNextAltitudeUpdate = false;
          } else {
            const altitude = Simplane.getAutoPilotSelectedAltitudeLockValue('feet');
            if (Number.isFinite(altitude)) {
              Coherent.call('AP_ALT_VAR_SET_ENGLISH', 2, altitude, this.forceNextAltitudeUpdate).catch(console.error);
              this.forceNextAltitudeUpdate = false;
            }
          }
        } else {
          const altitude = Simplane.getAutoPilotSelectedAltitudeLockValue('feet');
          if (Number.isFinite(altitude)) {
            SimVar.SetSimVarValue('L:A32NX_FG_ALTITUDE_CONSTRAINT', 'feet', 0);
            Coherent.call('AP_ALT_VAR_SET_ENGLISH', 2, altitude, this.forceNextAltitudeUpdate).catch(console.error);
            this.forceNextAltitudeUpdate = false;
          }
        }
      }

      if (
        Simplane.getAutoPilotAltitudeManaged() &&
        this.flightPlanService.hasActive &&
        SimVar.GetSimVarValue('L:A320_NEO_FCU_STATE', 'number') !== 1
      ) {
        const currentWaypointIndex = this.flightPlanService.active.activeLegIndex;
        if (currentWaypointIndex !== this.lastRequestedFLCModeWaypointIndex) {
          this.lastRequestedFLCModeWaypointIndex = currentWaypointIndex;
          setTimeout(() => {
            if (Simplane.getAutoPilotAltitudeManaged()) {
              this.onModeManagedAltitude();
            }
          }, 1000);
        }
      }

      if (this.flightPhase.get() === FmgcFlightPhase.GoAround && apLogicOn) {
        // depending if on HDR/TRK or NAV mode, select appropriate Alt Mode (WIP)
        // this._onModeManagedAltitude();
        this.onModeSelectedAltitude();
      }
      this.updateAutopilotCooldown = this.apCooldown;
    }
  }

  /**
   * Tries to estimate the landing weight at destination
   * NaN on failure
   */
  tryEstimateLandingWeight() {
    const altActive = false;
    const landingWeight =
      this.fmgc.data.zeroFuelWeight.get() ??
      NaN + (altActive ? this.fmgc.getAltEFOB(true) : this.fmgc.getDestEFOB(true)) * 1_000;

    return Number.isFinite(landingWeight) ? landingWeight : NaN;
  }

  /**
   * Updates performance speeds such as GD, F, S, Vls and approach speeds. Write to SimVars
   */
  updatePerfSpeeds() {
    /** in kg */
    const estLdgWeight = this.tryEstimateLandingWeight();
    let ldgWeight = estLdgWeight;
    const grossWeight = this.fmc.fmgc.getGrossWeightKg() ?? maxZfw + this.fmc.fmgc.getFOB() * 1_000;
    const vnavPrediction = this.fmc.guidanceController?.vnavDriver?.getDestinationPrediction();
    // Actual weight is used during approach phase (FCOM bulletin 46/2), and we also assume during go-around
    if (this.flightPhase.get() >= FmgcFlightPhase.Approach || !Number.isFinite(estLdgWeight)) {
      ldgWeight = grossWeight;
    } else if (vnavPrediction && Number.isFinite(vnavPrediction.estimatedFuelOnBoard)) {
      ldgWeight =
        (this.fmgc.data.zeroFuelWeight.get() ?? maxZfw) +
        Math.max(0, UnitType.POUND.convertTo(vnavPrediction.estimatedFuelOnBoard, UnitType.KILOGRAM));
    }

    // if pilot has set approach wind in MCDU we use it, otherwise fall back to current measured wind
    const appWind = this.fmgc.data.approachWind.get();
    let towerHeadwind = 0;
    if (appWind && Number.isFinite(appWind.speed) && Number.isFinite(appWind.direction)) {
      if (this.flightPlanService.active.destinationRunway) {
        towerHeadwind = A380SpeedsUtils.getHeadwind(
          appWind.speed,
          appWind.direction,
          this.flightPlanService.active.destinationRunway.magneticBearing,
        );
      }
    }

    // Calculate approach speeds. Independent from ADR data
    const approachSpeeds = new A380OperatingSpeeds(
      ldgWeight,
      0,
      this.fmgc.data.approachFlapConfig.get(),
      FmgcFlightPhase.Approach,
      this.fmgc.getV2Speed(),
      this.fmgc.getDestinationElevation(),
      towerHeadwind,
    );
    this.fmgc.data.approachSpeed.set(Math.ceil(approachSpeeds.vapp));
    this.fmgc.data.approachVls.set(Math.ceil(approachSpeeds.vls));
    this.fmgc.data.approachVref.set(Math.ceil(approachSpeeds.vref));
    this.fmgc.data.approachGreenDotSpeed.set(Math.ceil(approachSpeeds.gd));
    this.fmgc.data.approachSlatRetractionSpeed.set(Math.ceil(approachSpeeds.s));
    this.fmgc.data.approachFlapRetractionSpeed.set(Math.ceil(approachSpeeds.f3));
    this.speedVapp.set(Math.round(approachSpeeds.vapp));

    // Retrieve altitude from ADRs
    const alt = this.fmc.navigation.getPressureAltitude();

    if (alt !== null) {
      // Only update speeds if ADR altitude data valid.

      const flapLever = SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Enum');
      const speeds = new A380OperatingSpeeds(
        grossWeight,
        this.fmc.navigation.getComputedAirspeed() ?? 0, // CAS is NCD for low speeds/standstill, leading to null here
        flapLever,
        this.flightPhase.get(),
        this.fmgc.getV2Speed(),
        alt,
        towerHeadwind,
      );

      this.speedVs1g.set(Math.round(speeds.vs1g));
      this.speedVls.set(Math.round(speeds.vls));

      if (this.flightPhase.get() === FmgcFlightPhase.Preflight) {
        const f = Math.max(speeds.f2, Vmcl + 5);
        this.fmgc.data.flapRetractionSpeed.set(Math.ceil(f));
      } else {
        if (flapLever === 2) {
          const f = Math.max(speeds.f2, Vmcl + 15);
          this.fmgc.data.flapRetractionSpeed.set(Math.ceil(f));
        } else if (flapLever === 3) {
          const f = Math.max(speeds.f3, Vmcl + 10);
          this.fmgc.data.flapRetractionSpeed.set(Math.ceil(f));
        }
      }

      this.fmgc.data.slatRetractionSpeed.set(Math.ceil(speeds.s));
      this.fmgc.data.greenDotSpeed.set(Math.ceil(speeds.gd));

      this.speedVmax.set(Math.round(speeds.vmax));
      this.speedVfeNext.set(Math.round(speeds.vfeN));
    }
  }

  /** Write gross weight to SimVar */
  updateWeights() {
    const gw = this.fmc.fmgc.getGrossWeightKg();

    if (
      this.gameState.get() === GameState.ingame &&
      !this.fmc.fmgc.data.zeroFuelWeight.get() &&
      !this.fmc.fmgc.data.zeroFuelWeightCenterOfGravity.get() &&
      !SimVar.GetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', SimVarValueType.Bool)
    ) {
      const initZfw = SimVar.GetSimVarValue('L:A32NX_AIRFRAME_ZFW', 'number');
      const initZfwCg = SimVar.GetSimVarValue('L:A32NX_AIRFRAME_ZFW_CG_PERCENT_MAC', 'number');

      // Update FMS ZFW and ZFWCG from SimVars, e.g. when spawning on a runway
      this.fmc.fmgc.data.zeroFuelWeight.set(initZfw);
      this.fmc.fmgc.data.zeroFuelWeightCenterOfGravity.set(initZfwCg);
    }

    if (gw) {
      SimVar.SetSimVarValue('L:A32NX_FM_GROSS_WEIGHT', 'Number', gw);
    }

    if (this.fmc.enginesWereStarted.get() && this.flightPhase.get() !== FmgcFlightPhase.Done) {
      this.fmc.fmgc.data.blockFuel.set(this.fmc.fmgc.getFOB() * 1_000);
    }
  }

  /**
   * Update pax number to be used by air conditioning system (to regulate air flow)
   * @param paxNumber Number of passengers, 0-999
   */
  // FIXME AFDX candidate
  updatePaxNumber(paxNumber: number) {
    SimVar.SetSimVarValue('L:A32NX_FMS_PAX_NUMBER', 'number', paxNumber);
  }

  updateConstraints() {
    const activeFpIndex = this.flightPlanService.activeLegIndex;
    const constraints = this.managedProfile.get(activeFpIndex);
    const fcuSelAlt = Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') ?? 0;

    let constraintAlt = 0;
    if (constraints) {
      const phase = this.flightPhase.get();
      if (
        (phase < FmgcFlightPhase.Cruise || phase === FmgcFlightPhase.GoAround) &&
        Number.isFinite(constraints.climbAltitude) &&
        constraints.climbAltitude < fcuSelAlt
      ) {
        constraintAlt = constraints.climbAltitude;
      }

      if (
        phase > FmgcFlightPhase.Cruise &&
        phase < FmgcFlightPhase.GoAround &&
        Number.isFinite(constraints.descentAltitude) &&
        constraints.descentAltitude > fcuSelAlt
      ) {
        constraintAlt = constraints.descentAltitude;
      }
    }

    if (constraintAlt !== this.constraintAlt) {
      this.constraintAlt = constraintAlt;
      SimVar.SetSimVarValue('L:A32NX_FG_ALTITUDE_CONSTRAINT', 'feet', this.constraintAlt);
    }
  }

  public onEvent(event: string): void {
    if (event === 'MODE_SELECTED_HEADING' || event === 'A320_Neo_CDU_MODE_SELECTED_HEADING') {
      if (Simplane.getAutoPilotHeadingManaged()) {
        if (SimVar.GetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number') === 0) {
          const currentHeading = Simplane.getHeadingMagnetic();

          Coherent.call('HEADING_BUG_SET', 1, currentHeading).catch(console.error);
        }
      }
      this.onModeSelectedHeading();
    }
    if (event === 'MODE_MANAGED_HEADING' || event === 'A320_Neo_CDU_MODE_MANAGED_HEADING') {
      if (this.flightPlanService.active.legCount === 0) {
        return;
      }

      this.onModeManagedHeading();
    }
    if (event === 'MODE_SELECTED_ALTITUDE' || event === 'A320_Neo_CDU_MODE_SELECTED_ALTITUDE') {
      const dist = Number.isFinite(this.fmgc.getDistanceToDestination()) ? this.fmgc.getDistanceToDestination() : -1;
      if (dist) {
        this.fmc.handleFcuAltKnobPushPull(dist);
      }
      this.onModeSelectedAltitude();
      this.onStepClimbDescent();
    }
    if (event === 'MODE_MANAGED_ALTITUDE' || event === 'A320_Neo_CDU_MODE_MANAGED_ALTITUDE') {
      const dist = Number.isFinite(this.fmgc.getDistanceToDestination()) ? this.fmgc.getDistanceToDestination() : -1;
      if (dist) {
        this.fmc.handleFcuAltKnobPushPull(dist);
      }
      this.onModeManagedAltitude();
      this.onStepClimbDescent();
    }
    if (
      event === 'AP_DEC_ALT' ||
      event === 'AP_INC_ALT' ||
      event === 'A320_Neo_CDU_AP_DEC_ALT' ||
      event === 'A320_Neo_CDU_AP_INC_ALT'
    ) {
      const dist = Number.isFinite(this.fmgc.getDistanceToDestination()) ? this.fmgc.getDistanceToDestination() : -1;
      if (dist) {
        this.fmc.handleFcuAltKnobTurn(dist);
      }
      this.onTrySetCruiseFlightLevel();
    }
    if (
      event === 'AP_DEC_HEADING' ||
      event === 'AP_INC_HEADING' ||
      event === 'A320_Neo_CDU_AP_DEC_HEADING' ||
      event === 'A320_Neo_CDU_AP_INC_HEADING'
    ) {
      if (SimVar.GetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number') === 0) {
        const currentHeading = Simplane.getHeadingMagnetic();
        Coherent.call('HEADING_BUG_SET', 1, currentHeading).catch(console.error);
      }
      SimVar.SetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number', 1);
    }
    if (event === 'VS' || event === 'A320_Neo_CDU_VS') {
      const dist = Number.isFinite(this.fmgc.getDistanceToDestination()) ? this.fmgc.getDistanceToDestination() : -1;
      if (dist) {
        this.fmc.handleFcuVSKnob(dist, this.onStepClimbDescent.bind(this));
      }
    }
  }

  onModeSelectedHeading() {
    if (SimVar.GetSimVarValue('AUTOPILOT APPROACH HOLD', 'boolean')) {
      return;
    }
    if (!SimVar.GetSimVarValue('AUTOPILOT HEADING LOCK', 'Boolean')) {
      SimVar.SetSimVarValue('K:AP_PANEL_HEADING_HOLD', 'Number', 1);
    }
    SimVar.SetSimVarValue('K:HEADING_SLOT_INDEX_SET', 'number', 1);
  }

  onModeManagedHeading() {
    if (SimVar.GetSimVarValue('AUTOPILOT APPROACH HOLD', 'boolean')) {
      return;
    }
    if (!SimVar.GetSimVarValue('AUTOPILOT HEADING LOCK', 'Boolean')) {
      SimVar.SetSimVarValue('K:AP_PANEL_HEADING_HOLD', 'Number', 1);
    }
    SimVar.SetSimVarValue('K:HEADING_SLOT_INDEX_SET', 'number', 2);
    SimVar.SetSimVarValue('L:A320_FCU_SHOW_SELECTED_HEADING', 'number', 0);
  }

  onModeSelectedAltitude() {
    if (!Simplane.getAutoPilotGlideslopeHold()) {
      SimVar.SetSimVarValue('L:A320_NEO_FCU_FORCE_IDLE_VS', 'Number', 1);
    }
    SimVar.SetSimVarValue('K:ALTITUDE_SLOT_INDEX_SET', 'number', 1);
    Coherent.call(
      'AP_ALT_VAR_SET_ENGLISH',
      1,
      Simplane.getAutoPilotDisplayedAltitudeLockValue(),
      this.forceNextAltitudeUpdate,
    ).catch(console.error);
  }

  onModeManagedAltitude() {
    SimVar.SetSimVarValue('K:ALTITUDE_SLOT_INDEX_SET', 'number', 2);
    Coherent.call(
      'AP_ALT_VAR_SET_ENGLISH',
      1,
      Simplane.getAutoPilotDisplayedAltitudeLockValue(),
      this.forceNextAltitudeUpdate,
    ).catch(console.error);
    Coherent.call(
      'AP_ALT_VAR_SET_ENGLISH',
      2,
      Simplane.getAutoPilotDisplayedAltitudeLockValue(),
      this.forceNextAltitudeUpdate,
    ).catch(console.error);
    if (!Simplane.getAutoPilotGlideslopeHold()) {
      SimVar.SetSimVarValue('L:A320_NEO_FCU_FORCE_IDLE_VS', 'Number', 1);
    }
  }

  onStepClimbDescent() {
    if (
      !(this.flightPhase.get() === FmgcFlightPhase.Climb || this.flightPhase.get() === FmgcFlightPhase.Cruise) ||
      !this.flightPlanService.active.performanceData.cruiseFlightLevel
    ) {
      return;
    }

    const targetFl = (Simplane.getAutoPilotDisplayedAltitudeLockValue() ?? 0) / 100;

    if (
      (this.flightPhase.get() === FmgcFlightPhase.Climb &&
        targetFl > this.flightPlanService.active.performanceData.cruiseFlightLevel) ||
      (this.flightPhase.get() === FmgcFlightPhase.Cruise &&
        targetFl !== this.flightPlanService.active.performanceData.cruiseFlightLevel)
    ) {
      this.deleteOutdatedCruiseSteps(this.flightPlanService.active.performanceData.cruiseFlightLevel, targetFl);
      this.fmc.addMessageToQueue(
        NXSystemMessages.newCrzAlt.getModifiedMessage((targetFl * 100).toFixed(0)),
        undefined,
        undefined,
      );
      this.flightPlanService.active.setPerformanceData('cruiseFlightLevel', targetFl);
      SimVar.SetSimVarValue('L:A32NX_AIRLINER_CRUISE_ALTITUDE', 'number', targetFl * 100);
    }
  }

  deleteOutdatedCruiseSteps(oldCruiseLevel: number, newCruiseLevel: number) {
    const isClimbVsDescent = newCruiseLevel > oldCruiseLevel;

    const activePlan = this.flightPlanService.active;

    for (let i = activePlan.activeLegIndex; i < activePlan.legCount; i++) {
      const element = activePlan.elementAt(i);

      if (!element || element.isDiscontinuity === true || !element.cruiseStep) {
        continue;
      }

      const stepLevel = Math.round(element.cruiseStep.toAltitude / 100);

      if (
        (isClimbVsDescent && stepLevel >= oldCruiseLevel && stepLevel <= newCruiseLevel) ||
        (!isClimbVsDescent && stepLevel <= oldCruiseLevel && stepLevel >= newCruiseLevel)
      ) {
        element.cruiseStep = undefined; // TODO call a method on FPS so that we sync this (fms-v2)
        this.fmc.removeMessageFromQueue(NXSystemMessages.stepAhead.text);
      }
    }
  }

  private cruiseFlightLevelTimeOut: ReturnType<typeof setTimeout> | null = null;

  /**
   * Executed on every alt knob turn, checks whether or not the crz fl can be changed to the newly selected fcu altitude
   * It creates a timeout to simulate real life delay which resets every time the fcu knob alt increases or decreases.
   * @private
   */
  private onTrySetCruiseFlightLevel() {
    if (
      !(this.flightPhase.get() === FmgcFlightPhase.Climb || this.flightPhase.get() === FmgcFlightPhase.Cruise) ||
      !this.flightPlanService.active.performanceData.cruiseFlightLevel
    ) {
      return;
    }

    const activeVerticalMode = this.fmaVerticalMode.get();

    if (
      (activeVerticalMode >= VerticalMode.ALT_CPT && activeVerticalMode <= VerticalMode.FPA) ||
      (activeVerticalMode >= VerticalMode.ALT_CST_CPT && activeVerticalMode <= VerticalMode.DES)
    ) {
      const fcuFl = (Simplane.getAutoPilotDisplayedAltitudeLockValue() ?? 0) / 100;

      if (
        (this.flightPhase.get() === FmgcFlightPhase.Climb &&
          fcuFl > this.flightPlanService.active.performanceData.cruiseFlightLevel) ||
        (this.flightPhase.get() === FmgcFlightPhase.Cruise &&
          fcuFl !== this.flightPlanService.active.performanceData.cruiseFlightLevel)
      ) {
        if (this.cruiseFlightLevelTimeOut) {
          clearTimeout(this.cruiseFlightLevelTimeOut);
          this.cruiseFlightLevelTimeOut = null;
        }

        this.cruiseFlightLevelTimeOut = setTimeout(() => {
          if (!this.flightPlanService.active.performanceData.cruiseFlightLevel) {
            return;
          }

          if (
            fcuFl === (Simplane.getAutoPilotDisplayedAltitudeLockValue() ?? 0) / 100 &&
            ((this.flightPhase.get() === FmgcFlightPhase.Climb &&
              fcuFl > this.flightPlanService.active.performanceData.cruiseFlightLevel) ||
              (this.flightPhase.get() === FmgcFlightPhase.Cruise &&
                fcuFl !== this.flightPlanService.active.performanceData.cruiseFlightLevel))
          ) {
            this.fmc.addMessageToQueue(
              NXSystemMessages.newCrzAlt.getModifiedMessage((fcuFl * 100).toFixed(0)),
              undefined,
              undefined,
            );
            this.flightPlanService.active.setPerformanceData('cruiseFlightLevel', fcuFl);
            // used by FlightPhaseManager
            SimVar.SetSimVarValue('L:A32NX_AIRLINER_CRUISE_ALTITUDE', 'number', fcuFl * 100);
          }
        }, 3000);
      }
    }
  }

  /**
   * Sets new Cruise FL if all conditions good
   * @param fl Altitude or FL
   * @returns input passed checks
   */
  private trySetCruiseFl(fl: number): boolean {
    if (!this.flightPlanService.hasActive) {
      return false;
    }

    if (!Number.isFinite(fl)) {
      this.fmc.addMessageToQueue(NXSystemMessages.notAllowed, undefined, undefined);
      return false;
    }
    if (fl > (this.fmc.getRecMaxFlightLevel() ?? maxCertifiedAlt / 100)) {
      this.fmc.addMessageToQueue(NXSystemMessages.entryOutOfRange, undefined, undefined);
      return false;
    }
    const phase = this.flightPhase.get();
    const selFl = Math.floor(Math.max(0, Simplane.getAutoPilotDisplayedAltitudeLockValue('feet') ?? 0) / 100);
    if (
      fl < selFl &&
      (phase === FmgcFlightPhase.Climb || phase === FmgcFlightPhase.Approach || phase === FmgcFlightPhase.GoAround)
    ) {
      this.fmc.addMessageToQueue(NXSystemMessages.entryOutOfRange, undefined, undefined);
      return false;
    }

    if (fl <= 0 || fl > (this.fmc.getRecMaxFlightLevel() ?? maxCertifiedAlt / 100)) {
      this.fmc.addMessageToQueue(NXSystemMessages.entryOutOfRange, undefined, undefined);
      return false;
    }

    this.flightPlanService.active.setPerformanceData('cruiseFlightLevel', fl);
    this.onUpdateCruiseLevel(fl);

    return true;
  }

  /**
   *
   * @param newFl FL in 100 increments (e.g. 240 for 24000ft)
   */
  public setCruiseFl(newFl: number) {
    const ret = this.trySetCruiseFl(newFl);
    if (ret) {
      if (
        SimVar.GetSimVarValue('L:A32NX_CRZ_ALT_SET_INITIAL', 'bool') === 1 &&
        SimVar.GetSimVarValue('L:A32NX_GOAROUND_PASSED', 'bool') === 1
      ) {
        SimVar.SetSimVarValue(
          'L:A32NX_NEW_CRZ_ALT',
          'number',
          this.flightPlanService.active.performanceData.cruiseFlightLevel,
        );
      } else {
        SimVar.SetSimVarValue('L:A32NX_CRZ_ALT_SET_INITIAL', 'bool', 1);
      }
    }
  }

  /**
   * called when cruise FL is updated through FMS
   * @param newCruiseLevel as flight level
   */
  onUpdateCruiseLevel(newCruiseLevel: number) {
    SimVar.SetSimVarValue('L:A32NX_AIRLINER_CRUISE_ALTITUDE', 'number', newCruiseLevel * 100);
    this.updateConstraints();

    this.fmc.handleNewCruiseAltitudeEntered(newCruiseLevel);
  }

  navModeEngaged() {
    const lateralMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Number');
    switch (lateralMode) {
      case 20: // NAV
      case 30: // LOC*
      case 31: // LOC
      case 32: // LAND
      case 33: // FLARE
      case 34: // ROLL OUT
        return true;
      default:
        return false;
    }
  }

  // TODO: make this util or local var?
  isAirspeedManaged() {
    return SimVar.GetSimVarValue('AUTOPILOT SPEED SLOT INDEX', 'number') === 2;
  }

  // TODO: make this util or local var?
  isHeadingManaged() {
    return SimVar.GetSimVarValue('AUTOPILOT HEADING SLOT INDEX', 'number') === 2;
  }

  // TODO: make this util or local var?
  isAltitudeManaged() {
    return SimVar.GetSimVarValue('AUTOPILOT ALTITUDE SLOT INDEX', 'number') === 2;
  }

  getManagedTargets(v: number, m: number): [number, boolean] {
    const sat = ADIRS.getStaticAirTemperature();
    const press = ADIRS.getCorrectedAverageStaticPressure();

    if (
      sat !== undefined &&
      (sat.isNormalOperation() || sat.isFunctionalTest()) &&
      press !== undefined &&
      (press.isNormalOperation() || press.isFunctionalTest())
    ) {
      const vM = MathUtils.convertMachToKCas(m, press.value);
      return v > vM ? [vM, true] : [v, false];
    } else {
      return [v, false];
    }
  }

  // TODO/VNAV: Speed constraint
  getSpeedConstraint() {
    if (!this.navModeEngaged()) {
      return Infinity;
    }

    return this.getNavModeSpeedConstraint();
  }

  // TODO better decel distance calc
  calculateDecelDist(fromSpeed: number, toSpeed: number) {
    return Math.min(20, Math.max(3, (fromSpeed - toSpeed) * 0.15));
  }

  getNavModeSpeedConstraint() {
    const transIndex = this.fmgc.guidanceController?.activeTransIndex;
    if (transIndex == null) {
      return;
    }

    const activeLegIndex = transIndex >= 0 ? transIndex : this.fmgc.guidanceController?.activeLegIndex;
    const constraints = this.managedProfile.get(activeLegIndex);
    if (constraints) {
      if (this.flightPhase.get() < FmgcFlightPhase.Cruise || this.flightPhase.get() === FmgcFlightPhase.GoAround) {
        return constraints.climbSpeed;
      }

      if (this.flightPhase.get() > FmgcFlightPhase.Cruise && this.flightPhase.get() < FmgcFlightPhase.GoAround) {
        // FIXME proper decel calc
        if (
          this.fmgc.guidanceController?.activeLegDtg &&
          this.fmgc.guidanceController?.activeLegDtg <
            this.calculateDecelDist(
              Math.min(constraints.previousDescentSpeed, this.fmgc.getManagedDescentSpeed()),
              constraints.descentSpeed,
            )
        ) {
          return constraints.descentSpeed;
        }
        return constraints.previousDescentSpeed;
      }
    }

    return Infinity;
  }

  private managedProfile = new Map();

  updateManagedProfile() {
    this.managedProfile.clear();

    const plan = this.flightPlanService.active;

    const destination = plan.destinationAirport;
    const destinationElevation = destination ? destination.location.alt : 0;

    // TODO should we save a constraint already propagated to the current leg?

    // propagate descent speed constraints forward
    let currentSpeedConstraint = Infinity;
    let previousSpeedConstraint = Infinity;
    for (let index = 0; index < Math.min(plan.firstMissedApproachLegIndex, plan.legCount); index++) {
      const leg = plan.elementAt(index);

      if (leg.isDiscontinuity === true) {
        continue;
      }

      if (leg.constraintType === 2 /** DES */ && leg.speedConstraint?.speed) {
        if (leg.speedConstraint) {
          currentSpeedConstraint = Math.min(currentSpeedConstraint, Math.round(leg.speedConstraint.speed));
        }
      }

      this.managedProfile.set(index, {
        descentSpeed: currentSpeedConstraint,
        previousDescentSpeed: previousSpeedConstraint,
        climbSpeed: Infinity,
        previousClimbSpeed: Infinity,
        climbAltitude: Infinity,
        descentAltitude: -Infinity,
      });

      previousSpeedConstraint = currentSpeedConstraint;
    }

    // propagate climb speed constraints backward
    // propagate alt constraints backward
    currentSpeedConstraint = Infinity;
    previousSpeedConstraint = Infinity;
    let currentDesConstraint = -Infinity;
    let currentClbConstraint = Infinity;

    for (let index = Math.min(plan.firstMissedApproachLegIndex, plan.legCount) - 1; index >= 0; index--) {
      const leg = plan.elementAt(index);

      if (leg.isDiscontinuity === true) {
        continue;
      }

      const altConstraint = leg.altitudeConstraint;
      const speedConstraint = leg.speedConstraint;

      if (leg.constraintType === 1 /** CLB */) {
        if (speedConstraint?.speed) {
          currentSpeedConstraint = Math.min(currentSpeedConstraint, Math.round(speedConstraint.speed));
        }

        if (altConstraint?.altitude1) {
          switch (altConstraint.altitudeDescriptor) {
            case '@': // at alt 1
            case '-': // at or below alt 1
            case 'B': // between alt 1 and alt 2
              currentClbConstraint = Math.min(currentClbConstraint, Math.round(altConstraint.altitude1));
              break;
            default:
            // not constraining
          }
        }
      } else if (leg.constraintType === 2 /** DES */) {
        if (altConstraint?.altitude1) {
          switch (altConstraint.altitudeDescriptor) {
            case '@': // at alt 1
            case '+': // at or above alt 1
              currentDesConstraint = Math.max(currentDesConstraint, Math.round(altConstraint.altitude1));
              break;
            case 'B': // between alt 1 and alt 2
              currentDesConstraint = Math.max(
                currentDesConstraint,
                Math.round(altConstraint.altitude2 ?? altConstraint.altitude1),
              );
              break;
            default:
            // not constraining
          }
        }
      }

      const profilePoint = this.managedProfile.get(index);
      profilePoint.climbSpeed = currentSpeedConstraint;
      profilePoint.previousClimbSpeed = previousSpeedConstraint;
      profilePoint.climbAltitude = currentClbConstraint;
      profilePoint.descentAltitude = Math.max(destinationElevation, currentDesConstraint);
      previousSpeedConstraint = currentSpeedConstraint;
    }
  }

  private stepAheadTriggeredForAltitude: number | null = null;

  public checkForStepClimb() {
    const [approachingCruiseStep, cruiseStepLegIndex] = MfdFmsFplnVertRev.nextCruiseStep(this.flightPlanService.active);

    if (approachingCruiseStep && !approachingCruiseStep.isIgnored && cruiseStepLegIndex) {
      const distanceToStep =
        this.fmc.guidanceController.vnavDriver.mcduProfile?.waypointPredictions.get(
          cruiseStepLegIndex,
        )?.distanceFromAircraft;

      if (
        distanceToStep !== undefined &&
        distanceToStep < 20 &&
        this.stepAheadTriggeredForAltitude !== approachingCruiseStep.toAltitude
      ) {
        this.fmc.addMessageToQueue(NXSystemMessages.stepAhead, undefined, undefined);

        const autoStepClimb = NXDataStore.get('AUTO_STEP_CLIMB', 'DISABLED') === 'ENABLED';
        if (autoStepClimb && !this.fmc.guidanceController.vnavDriver.isSelectedVerticalModeActive()) {
          // Set new FCU alt, push FCU knob
          Coherent.call('AP_ALT_VAR_SET_ENGLISH', 3, approachingCruiseStep.toAltitude, true).catch(console.error);
          SimVar.SetSimVarValue('H:A320_Neo_FCU_ALT_PUSH', 'number', 1);
          SimVar.SetSimVarValue('H:A320_Neo_CDU_MODE_MANAGED_ALTITUDE', 'number', 1);
        }
        this.stepAheadTriggeredForAltitude = approachingCruiseStep.toAltitude;
      }
    }

    // Check for STEP DELETED message
    if (SimVar.GetSimVarValue('L:A32NX_FM_VNAV_TRIGGER_STEP_DELETED', SimVarValueType.Bool) === 1) {
      // Add message
      this.fmc.addMessageToQueue(NXSystemMessages.stepDeleted, undefined, undefined);

      SimVar.SetSimVarValue('L:A32NX_FM_VNAV_TRIGGER_STEP_DELETED', SimVarValueType.Bool, false);
    }
  }

  //-----------------------------------------------------------------------------------
  // TODO:FPM REWRITE: Start of functions to refactor
  //-----------------------------------------------------------------------------------

  // FIXME remove A32NX_FM_LS_COURSE
  async updateIlsCourse(mmr: MmrRadioTuningStatus) {
    let course = -1;
    if (mmr.course !== null) {
      course = mmr.course;
    } else if (mmr.frequency !== null && SimVar.GetSimVarValue('L:A32NX_RADIO_RECEIVER_LOC_IS_VALID', 'number') === 1) {
      course = SimVar.GetSimVarValue('NAV LOCALIZER:3', 'degrees');
    }

    return SimVar.SetSimVarValue('L:A32NX_FM_LS_COURSE', 'number', course);
  }

  private hasTooSteepPathAhead = false;

  checkTooSteepPath() {
    const hasTooSteepPathAhead = this.fmc.guidanceController?.vnavDriver?.shouldShowTooSteepPathAhead();

    if (hasTooSteepPathAhead !== this.hasTooSteepPathAhead) {
      this.hasTooSteepPathAhead = hasTooSteepPathAhead;

      if (hasTooSteepPathAhead) {
        this.fmc.addMessageToQueue(
          NXSystemMessages.tooSteepPathAhead,
          () => !this.fmc.guidanceController?.vnavDriver?.shouldShowTooSteepPathAhead(),
          undefined,
        );
      }
    }
  }
}

class FmArinc429OutputWord extends Arinc429Word {
  private dirty = true;

  private _ssm = 0;

  constructor(
    private name: string,
    private _value: number = 0,
  ) {
    super(0);
  }

  // @ts-ignore
  get value() {
    // eslint-disable-next-line no-underscore-dangle
    return this._value;
  }

  set value(value) {
    // eslint-disable-next-line no-underscore-dangle
    if (this._value !== value) {
      this.dirty = true;
    }
    // eslint-disable-next-line no-underscore-dangle
    this._value = value;
  }

  // @ts-ignore
  get ssm() {
    // eslint-disable-next-line no-underscore-dangle
    return this._ssm;
  }

  set ssm(ssm) {
    // eslint-disable-next-line no-underscore-dangle
    if (this._ssm !== ssm) {
      this.dirty = true;
    }
    // eslint-disable-next-line no-underscore-dangle
    this._ssm = ssm;
  }

  static emptyFm(name: string) {
    return new FmArinc429OutputWord(name, 0);
  }

  async writeToSimVarIfDirty() {
    if (this.dirty) {
      this.dirty = false;
      return Promise.all([
        Arinc429Word.toSimVarValue(`L:A32NX_FM1_${this.name}`, this.value, this.ssm),
        Arinc429Word.toSimVarValue(`L:A32NX_FM2_${this.name}`, this.value, this.ssm),
      ]);
    }
    return Promise.resolve();
  }

  setBnrValue(value: number, ssm: number, bits: number, rangeMax: number, rangeMin = 0) {
    const quantum = Math.max(Math.abs(rangeMin), rangeMax) / 2 ** bits;
    const data = Math.max(rangeMin, Math.min(rangeMax, Math.round(value / quantum) * quantum));

    this.value = data;
    this.ssm = ssm;
  }
}
