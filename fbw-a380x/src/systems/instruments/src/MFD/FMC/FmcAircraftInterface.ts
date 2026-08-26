// Copyright (c) 2023-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  ConsumerValue,
  EventBus,
  GameStateProvider,
  MappedSubject,
  SimVarValueType,
  Subject,
  Subscribable,
  Subscription,
} from '@microsoft/msfs-sdk';
import {
  Arinc429LocalVarConsumerSubject,
  Arinc429Register,
  Arinc429SignStatusMatrix,
  FmsData,
  MathUtils,
  NXDataStore,
  VerticalPathCheckpoint,
  NXLogicConfirmNode,
  NXLogicPulseNode,
  FmArinc429OutputWord,
  RaBusEvents,
  RegisteredSimVar,
  EfisSide,
} from '@flybywiresim/fbw-sdk';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { MmrRadioTuningStatus } from '@fmgc/navigation/NavaidTuner';
import { Vmcl, maxZfw } from '@shared/PerformanceConstants';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FmgcDataService } from './fmgc';
import { ADIRS } from '../shared/Adirs';
import { NXSystemMessages } from '../shared/NXSystemMessages';
import { A380OperatingSpeeds, A380SpeedsUtils } from '@shared/OperatingSpeeds';
import { FlightPhaseManagerEvents } from '@fmgc/flightphase';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { FmsMessageVars } from '../../MsfsAvionicsCommon/providers/FmsMessagePublisher';
import { MfdFmsFplnVertRev } from '../pages/FMS/F-PLN/MfdFmsFplnVertRev';
import { MfdSurvEvents, VdAltitudeConstraint } from '../../MsfsAvionicsCommon/providers/MfdSurvPublisher';
import { VerticalWaypointPrediction } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { RADIO_ALTITUDE_NODH_VALUE } from '../pages/common/DataEntryFormats';
import { FlightManagementComputer, FMS_CYCLE_TIME } from './FlightManagementComputer';
import { NavigationEvents } from '@fmgc/navigation/Navigation';
import { NDFMMessageTypes } from '@shared/FmMessages';
import { FlightPlanEvents } from '@fmgc/flightplanning/sync/FlightPlanEvents';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { VnavEvents } from '@fmgc/events/VnavEvents';
import { FcuEfisCpBusEvents } from '@shared/publishers/EfisCpBusPublisher';
import { PrimChoiceProvider } from '@shared/publishers/PrimChoiceProvider';
import { PrimFgBusBaseEvents } from '@shared/publishers/PrimFgPublisher';

/**
 * Interface between FMS and rest of aircraft through SimVars and ARINC values (mostly data being sent here)
 * Essentially part of the FMC (-A/-B/-C)
 */
export class FmcAircraftInterface {
  private static readonly fmApproachHeadWindRegisterdSimVar = RegisteredSimVar.create(
    'L:A380X_FM_APPROACH_HEADWIND_COMPONENT',
    SimVarValueType.String,
  );
  private readonly subs = [] as Subscription[];
  private gameState = GameStateProvider.get();
  // ARINC words
  // arinc bus output words
  public readonly arincDiscreteWord2 = new FmArinc429OutputWord('DISCRETE_WORD_2');
  public readonly arincDiscreteWord3 = new FmArinc429OutputWord('DISCRETE_WORD_3');
  public readonly arincTakeoffPitchTrim = new FmArinc429OutputWord('TO_PITCH_TRIM');
  public readonly arincLandingElevation = new FmArinc429OutputWord('LANDING_ELEVATION');
  public readonly arincDestinationLatitude = new FmArinc429OutputWord('DEST_LAT');
  public readonly arincDestinationLongitude = new FmArinc429OutputWord('DEST_LONG');
  public readonly arincMDA = new FmArinc429OutputWord('MINIMUM_DESCENT_ALTITUDE');
  public readonly arincDH = new FmArinc429OutputWord('DECISION_HEIGHT');
  public readonly arincThrustReductionAltitude = new FmArinc429OutputWord('THR_RED_ALT');
  public readonly arincAccelerationAltitude = new FmArinc429OutputWord('ACC_ALT');
  public readonly arincEoAccelerationAltitude = new FmArinc429OutputWord('EO_ACC_ALT');
  public readonly arincTransitionAltitude = new FmArinc429OutputWord('TRANS_ALT');
  public readonly arincTransitionLevel = new FmArinc429OutputWord('TRANS_LVL');
  public readonly arincZeroFuelWeight = new FmArinc429OutputWord('ZERO_FUEL_WEIGHT');
  public readonly arincZeroFuelWeightCg = new FmArinc429OutputWord('ZERO_FUEL_WEIGHT_CG');
  public readonly arincRemainingFlightTime = new FmArinc429OutputWord('REMAINING_FLIGHT_TIME');
  /** contains fm messages (not yet implemented) and nodh bit */
  public readonly arincEisWord2 = new FmArinc429OutputWord('EIS_DISCRETE_WORD_2');
  public readonly arincFlightNumber1 = new FmArinc429OutputWord('FLIGHT_NUMBER_1');
  public readonly arincFlightNumber2 = new FmArinc429OutputWord('FLIGHT_NUMBER_2');
  public readonly arincFlightNumber3 = new FmArinc429OutputWord('FLIGHT_NUMBER_3');
  public readonly arincFlightNumber4 = new FmArinc429OutputWord('FLIGHT_NUMBER_4');
  public readonly arincFlightNumber5 = new FmArinc429OutputWord('FLIGHT_NUMBER_5');
  private readonly arincHeadWindComponent = Arinc429Register.empty();
  private readonly arincHeadWindComponentRaw = Subject.create(0);

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
    this.arincTransitionAltitude,
    this.arincTransitionLevel,
    this.arincZeroFuelWeight,
    this.arincZeroFuelWeightCg,
    this.arincRemainingFlightTime,
    this.arincEisWord2,
    this.arincFlightNumber1,
    this.arincFlightNumber2,
    this.arincFlightNumber3,
    this.arincFlightNumber4,
    this.arincFlightNumber5,
  ];

  private readonly speedVs1g = Subject.create(0);
  private readonly speedVls = Subject.create(0);
  private readonly speedVmax = Subject.create(0);
  private readonly speedVfeNext = Subject.create(0);

  private readonly tdReached = this.bus
    .getSubscriber<FmsMessageVars>()
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

  private readonly flightPhase = ConsumerSubject.create(
    this.bus.getSubscriber<FlightPhaseManagerEvents>().on('fmgc_flight_phase'),
    FmgcFlightPhase.Preflight,
  );

  private readonly altActiveInClimbForMoreThan10Min = new NXLogicConfirmNode(600);

  private readonly fmsOrigin = Subject.create<string | null>('');
  private readonly fmsDepartureRunway = Subject.create<string | null>('');
  private readonly fmsDestination = Subject.create<string | null>('');
  private readonly fmsLandingRunway = Subject.create<string | null>('');
  private readonly fmsAlternate = Subject.create<string | null>('');
  private readonly destEfobBelowMin = this.fmgc.data.destEfobBelowMinInActive.sub((v) => {
    SimVar.SetSimVarValue('L:A380X_FMS_DEST_EFOB_BELOW_MIN', SimVarValueType.Bool, v);
  }, true);

  private readonly destEfobBelowMinScratchPadMessage = Subject.create(false);

  /* The following RA subs are paused during any FMS flightphase outside go around or approach as they are not needed outside those phases for the destination EFOB logic
   */
  private readonly radioAltitudeA = Arinc429LocalVarConsumerSubject.create(
    this.bus.getSubscriber<RaBusEvents>().on('ra_radio_altitude_1'),
    Arinc429Register.empty().rawWord,
  );
  private readonly radioAltitudeB = Arinc429LocalVarConsumerSubject.create(
    this.bus.getSubscriber<RaBusEvents>().on('ra_radio_altitude_2'),
    Arinc429Register.empty().rawWord,
  );
  private readonly radioAltitudeC = Arinc429LocalVarConsumerSubject.create(
    this.bus.getSubscriber<RaBusEvents>().on('ra_radio_altitude_3'),
    Arinc429Register.empty().rawWord,
  );

  private readonly radioAlt = MappedSubject.create(
    ([ra1, ra2, ra3]) => {
      if (ra1.isNormalOperation() || ra1.isFunctionalTest()) {
        return ra1.value;
      } else if (ra2.isNormalOperation() || ra2.isFunctionalTest()) {
        return ra2.value;
      } else if (ra3.isNormalOperation() || ra3.isFunctionalTest()) {
        return ra3.value;
      }
      return null;
    },
    this.radioAltitudeA,
    this.radioAltitudeB,
    this.radioAltitudeC,
  );

  private readonly engineFailurePulseNode = new NXLogicPulseNode();

  private readonly gpsPrimary = this.bus
    .getSubscriber<NavigationEvents>()
    .on('fms_nav_gps_primary')
    .whenChanged()
    .handle((v) => {
      if (v) {
        // TODO Split across both MFDs & NDs
        this.fmc.removeNdFmMessage(NDFMMessageTypes.NavPrimaryLost, 'L');
        this.fmc.removeNdFmMessage(NDFMMessageTypes.NavPrimaryLost, 'R');
        this.fmc.removeMessageFromQueue(NXSystemMessages.navprimaryLost.text);
        this.fmc.sendNdFmMessage(NDFMMessageTypes.NavPrimary, 'L');
        this.fmc.sendNdFmMessage(NDFMMessageTypes.NavPrimary, 'R');
        this.fmc.addMessageToQueue(NXSystemMessages.navprimary, undefined, () => {
          this.fmc.removeNdFmMessage(NDFMMessageTypes.NavPrimary, 'L');
          this.fmc.removeNdFmMessage(NDFMMessageTypes.NavPrimary, 'R');
        });
      } else {
        this.fmc.removeNdFmMessage(NDFMMessageTypes.NavPrimary, 'L');
        this.fmc.removeNdFmMessage(NDFMMessageTypes.NavPrimary, 'R');
        this.fmc.removeMessageFromQueue(NXSystemMessages.navprimary.text);
        this.fmc.sendNdFmMessage(NDFMMessageTypes.NavPrimaryLost, 'L');
        this.fmc.sendNdFmMessage(NDFMMessageTypes.NavPrimaryLost, 'R');
        this.fmc.addMessageToQueue(NXSystemMessages.navprimaryLost, undefined, undefined);
      }
    });
  /** The current flap lever position between 0 and 4 (full) */
  private flapLeverPosition = 0;
  private readonly sfccSlatFlapSystemStatusWord = Arinc429Register.empty();
  private readonly sfcc1SlatFlapSystemStatusWord = RegisteredSimVar.create<number>(
    'L:A32NX_SFCC_1_SLAT_FLAP_SYSTEM_STATUS_WORD',
    SimVarValueType.Enum,
  );
  private readonly sfcc2SlatFlapSystemStatusWord = RegisteredSimVar.create<number>(
    'L:A32NX_SFCC_2_SLAT_FLAP_SYSTEM_STATUS_WORD',
    SimVarValueType.Enum,
  );
  private readonly speedsManagedPfdVar = RegisteredSimVar.create<number>(
    'L:A32NX_SPEEDS_MANAGED_PFD',
    SimVarValueType.Knots,
  );
  private readonly speedsManagedPfd = Subject.create<number | null>(null);
  private readonly latDiscontinuityAhead = Subject.create(false);

  private readonly vnavManagedSpeedForDescentPhase = ConsumerValue.create(
    this.bus.getSubscriber<VnavEvents>().on('fms_vnav_managed_speed_descent_phase'),
    null,
  );
  private readonly fcuEfisLeftDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(
    this.bus.getSubscriber<FcuEfisCpBusEvents>().on('fcu_efis_l_discrete_word_2'),
  );
  private readonly fcuEfisRightDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(
    this.bus.getSubscriber<FcuEfisCpBusEvents>().on('fcu_efis_r_discrete_word_2'),
  );

  private readonly primChoiceProvider = new PrimChoiceProvider(this.bus);

  private readonly masterPrimAltitude = Arinc429LocalVarConsumerSubject.create(
    this.bus.getSubscriber<PrimFgBusBaseEvents>().on('prim_selected_altitude'),
  );

  private readonly masterPrimFgWord3 = Arinc429LocalVarConsumerSubject.create(
    this.bus.getSubscriber<PrimFgBusBaseEvents>().on('prim_fg_discrete_word_3'),
  );

  private readonly masterPrimFgWord4 = Arinc429LocalVarConsumerSubject.create(
    this.bus.getSubscriber<PrimFgBusBaseEvents>().on('prim_fg_discrete_word_4'),
  );

  private readonly masterPrimFgWord5 = Arinc429LocalVarConsumerSubject.create(
    this.bus.getSubscriber<PrimFgBusBaseEvents>().on('prim_fg_discrete_word_5'),
  );

  private readonly openOrManagedVerticalModesActive = this.masterPrimFgWord3.map(
    (v) => v.bitValueOr(11, false) || v.bitValue(12) || v.bitValue(13) || v.bitValue(14),
  );

  private readonly isTrackOrheadingActive = this.masterPrimFgWord4.map(
    (v) => !v.isInvalid() && (v.bitValue(16) || v.bitValue(17)),
  );

  private readonly isVsOrFpaActive = this.masterPrimFgWord3.map((v) => {
    return !v.isInvalid() && (v.bitValue(17) || v.bitValue(18));
  });

  private fcuAltitudeChangeCheckCruiseFlightLevel = false;

  private readonly cruiseAltitudeChangeConfirm = new NXLogicConfirmNode(3);

  constructor(
    private bus: EventBus,
    private fmc: FlightManagementComputer,
    private fmgc: FmgcDataService,
    private flightPlanService: FlightPlanService,
  ) {
    this.init();
    this.primChoiceProvider.init();
  }

  destroy() {
    for (const s of this.subs) {
      s.destroy();
    }
  }

  private init(): void {
    if (!this.flightPlanService.hasActive) {
      throw new Error('FmcAircraftInterface: No active flight plan available');
      return;
    }

    // write local vars for other systems
    this.subs.push(
      this.fmgc.data.greenDotSpeed.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_GD', 'number', v ?? 0), true),
    );
    this.subs.push(
      this.fmgc.data.slatRetractionSpeed.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_S', 'number', v ?? 0), true),
    );
    this.subs.push(
      this.fmgc.data.flapRetractionSpeed.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_F', 'number', v ?? 0), true),
    );

    this.subs.push(this.speedVs1g.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_VS', 'number', v), true));
    this.subs.push(this.speedVls.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_VLS', 'number', v), true));
    this.subs.push(this.speedVmax.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_VMAX', 'number', v), true));
    this.subs.push(this.speedVfeNext.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_VFEN', 'number', v), true));
    this.subs.push(
      this.fmgc.data.approachVapp.sub((v) => SimVar.SetSimVarValue('L:A32NX_SPEEDS_VAPP', 'number', v ?? 0), true),
    );

    this.subs.push(
      this.fmc.approachFlapsThreeSelected.sub(
        (v) => SimVar.SetSimVarValue('L:A380X_FM_LANDING_CONF3', SimVarValueType.Bool, v),
        true,
      ),
    );

    this.subs.push(this.tdReached);

    this.subs.push(
      this.fmc.zeroFuelWeight.sub((zfw) => {
        this.arincZeroFuelWeight.setBnrValue(
          zfw ? zfw * 1_000 : 0,
          zfw ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
          19,
          524288,
          0,
        );
      }),
    );

    this.subs.push(
      this.fmc.zeroFuelWeightCenterOfGravity.sub((zfwCg) =>
        this.arincZeroFuelWeightCg.setBnrValue(
          zfwCg ? zfwCg : 0,
          zfwCg ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
          12,
          64,
          0,
        ),
      ),
      this.latDiscontinuityAhead.sub((v) => {
        if (v) {
          this.fmc.addMessageToQueue(NXSystemMessages.lateralDiscontinuityAhead, undefined, undefined);
        } else {
          this.fmc.removeMessageFromQueue(NXSystemMessages.lateralDiscontinuityAhead.text);
        }
      }),
    );

    const pub = this.bus.getPublisher<FmsData>();
    this.subs.push(
      this.fmsOrigin.sub((v) => pub.pub('fmsOrigin', v, true), true),
      this.fmsDepartureRunway.sub((v) => pub.pub('fmsDepartureRunway', v, true), true),
      this.fmsDestination.sub((v) => pub.pub('fmsDestination', v, true), true),
      this.fmsLandingRunway.sub((v) => pub.pub('fmsLandingRunway', v, true), true),
      this.fmsAlternate.sub((v) => pub.pub('fmsAlternate', v, true), true),
      this.fmgc.data.atcCallsign.sub((v) => pub.pub('fmsFlightNumber', v, true), true),
      this.destEfobBelowMin,
      this.destEfobBelowMinScratchPadMessage.sub((v) => {
        if (v) {
          this.fmc.addMessageToQueue(NXSystemMessages.destEfobBelowMin, undefined, undefined);
        } else {
          this.fmc.removeMessageFromQueue(NXSystemMessages.destEfobBelowMin.text);
        }
      }),
      this.tdReached,
      this.fmc.pilotEntryMinFuelBelowAltnPlusFinal.sub((v) => {
        if (v) {
          this.fmc.addMessageToQueue(NXSystemMessages.checkMinFuelAtDest, undefined, undefined);
        } else {
          this.fmc.removeMessageFromQueue(NXSystemMessages.checkMinFuelAtDest.text);
        }
      }),
      this.flightPhase.sub((v) => {
        if (v === FmgcFlightPhase.Approach || v === FmgcFlightPhase.GoAround) {
          this.radioAltitudeA.resume();
          this.radioAltitudeB.resume();
          this.radioAltitudeC.resume();
        } else {
          this.radioAltitudeA.pause();
          this.radioAltitudeB.pause();
          this.radioAltitudeC.pause();
        }
      }, true),
      this.radioAlt,
      this.gpsPrimary,
    );

    // Check for STEP DELETED message
    this.subs.push(
      this.bus
        .getSubscriber<FlightPlanEvents>()
        .on('flightPlan.autoDeleteCruiseStep')
        .handle(({ planIndex }) => {
          if (planIndex === FlightPlanIndex.Active) {
            this.fmc.addMessageToQueue(NXSystemMessages.stepDeleted, undefined, undefined);
          }
        }),
    );
    this.subs.push(this.speedsManagedPfd.sub((v) => this.speedsManagedPfdVar.set(v ?? 0), true));
    this.subs.push(
      this.arincHeadWindComponentRaw.sub((v) => {
        FmcAircraftInterface.fmApproachHeadWindRegisterdSimVar.set(v.toString());
      }),
      this.masterPrimAltitude.sub((v) => {
        if (v.isNormalOperation()) {
          this.fmc.handleFcuAltKnobTurn();
          this.fcuAltitudeChangeCheckCruiseFlightLevel = true;
        }
      }),
      Arinc429LocalVarConsumerSubject.create(
        this.bus.getSubscriber<PrimFgBusBaseEvents>().on('prim_selected_vertical_speed'),
      ).sub((v) => {
        if (v.isNormalOperation()) {
          this.fmc.handleFcuVSKnob(this.onStepClimbDescent.bind(this));
        }
      }),
      Arinc429LocalVarConsumerSubject.create(
        this.bus.getSubscriber<PrimFgBusBaseEvents>().on('prim_selected_flight_path_angle'),
      ).sub((v) => {
        if (v.isNormalOperation()) {
          this.fmc.handleFcuVSKnob(this.onStepClimbDescent.bind(this));
        }
      }),
      this.openOrManagedVerticalModesActive.sub((v) => {
        if (v) {
          this.fmc.handleFcuAltKnobPushPull();
          this.onStepClimbDescent();
        }
      }),
      this.isVsOrFpaActive.sub((v) => {
        if (v) {
          this.fmc.handleFcuVSKnob(this.onStepClimbDescent.bind(this));
        }
      }),
    );
  }

  thrustReductionAccelerationChecks() {
    const activePlan = this.flightPlanService.active;

    const accelerationAltitude = activePlan.performanceData.accelerationAltitude.get();
    if (activePlan.reconcileAccelerationWithConstraints() && accelerationAltitude) {
      this.fmc.addMessageToQueue(
        NXSystemMessages.newAccAlt.getModifiedMessage(accelerationAltitude.toFixed(0)),
        undefined,
        undefined,
      );
    }

    const thrustReductionAltitude = activePlan.performanceData.thrustReductionAltitude.get();
    if (activePlan.reconcileThrustReductionWithConstraints() && thrustReductionAltitude) {
      this.fmc.addMessageToQueue(
        NXSystemMessages.newThrRedAlt.getModifiedMessage(thrustReductionAltitude.toFixed(0)),
        undefined,
        undefined,
      );
    }
  }

  public updateThrustReductionAcceleration() {
    const activePerformanceData = this.flightPlanService.hasActive
      ? this.flightPlanService.active.performanceData
      : null;

    const flightPhase = this.flightPhase.get();

    // Set the thrust reduction altitude and acceleration altitude in a single output.
    let thrustReductionAlt: number | null = null;
    let accelerationAlt: number | null = null;
    let engineOutAccelerationAlt: number | null = null;
    if (flightPhase <= FmgcFlightPhase.Takeoff) {
      thrustReductionAlt = activePerformanceData?.thrustReductionAltitude.get() ?? null;
      accelerationAlt = activePerformanceData?.accelerationAltitude.get() ?? null;
      engineOutAccelerationAlt = activePerformanceData?.engineOutAccelerationAltitude.get() ?? null;
    } else if (flightPhase === FmgcFlightPhase.GoAround) {
      thrustReductionAlt = activePerformanceData?.missedThrustReductionAltitude.get() ?? null;
      accelerationAlt = activePerformanceData?.missedAccelerationAltitude.get() ?? null;
      engineOutAccelerationAlt = activePerformanceData?.missedEngineOutAccelerationAltitude.get() ?? null;
    }
    this.arincThrustReductionAltitude.setBnrValue(
      thrustReductionAlt ?? 0,
      thrustReductionAlt !== null ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );

    this.arincAccelerationAltitude.setBnrValue(
      accelerationAlt ?? 0,
      accelerationAlt !== null ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );

    this.arincEoAccelerationAltitude.setBnrValue(
      engineOutAccelerationAlt ?? 0,
      engineOutAccelerationAlt !== null
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
      this.flightPlanService.active.performanceData.transitionAltitude.get() ?? 0, // as altitude
      this.flightPlanService.active.performanceData.transitionAltitude.get() !== null &&
        this.flightPlanService.active.performanceData.transitionAltitude.get() !== undefined
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      17,
      131072,
      0,
    );

    this.arincTransitionLevel.setBnrValue(
      this.flightPlanService.active.performanceData.transitionLevel.get() ?? 0, // as FL
      this.flightPlanService.active.performanceData.transitionLevel.get() !== null &&
        this.flightPlanService.active.performanceData.transitionLevel.get() !== undefined
        ? Arinc429SignStatusMatrix.NormalOperation
        : Arinc429SignStatusMatrix.NoComputedData,
      9,
      512,
      0,
    );
  }

  public updateApproachHeadWindComponent(value: number | null) {
    this.arincHeadWindComponent.setValue(value ?? 0);
    this.arincHeadWindComponent.setSsm(
      value !== null ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
    );
    this.arincHeadWindComponentRaw.set(this.arincHeadWindComponent.rawWord);
  }

  public updatePerformanceData() {
    if (!this.flightPlanService.hasActive) {
      return;
    }

    SimVar.SetSimVarValue('L:AIRLINER_V1_SPEED', 'Knots', this.flightPlanService.active.performanceData.v1.get() ?? -1);
    SimVar.SetSimVarValue('L:AIRLINER_V2_SPEED', 'Knots', this.flightPlanService.active.performanceData.v2.get() ?? 0); // Simulink model uses 0 as not valid
    SimVar.SetSimVarValue('L:AIRLINER_VR_SPEED', 'Knots', this.flightPlanService.active.performanceData.vr.get() ?? -1);
  }

  public getToSpeedsTooLow(): boolean {
    if (!this.flightPlanService.hasActive) {
      return false;
    }

    if (
      this.flightPlanService.active.performanceData.takeoffFlaps.get() === null ||
      this.fmc.fmgc.getGrossWeightKg() === null
    ) {
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
      (this.flightPlanService.active.performanceData.v1.get() ?? Infinity) < Math.trunc(A380SpeedsUtils.getVmcg(zp)) ||
      (this.flightPlanService.active.performanceData.vr.get() ?? Infinity) <
        Math.trunc(1.05 * A380SpeedsUtils.getVmca(zp)) ||
      (this.flightPlanService.active.performanceData.v2.get() ?? Infinity) <
        Math.trunc(1.1 * A380SpeedsUtils.getVmca(zp))
    );
  }

  private toSpeedsNotInserted = true;

  private toSpeedsTooLow = false;

  private vSpeedDisagree = false;

  private vSpeedsValid(): boolean {
    if (!this.flightPlanService.hasActive) {
      return false;
    }

    const v1Speed = this.flightPlanService.active.performanceData.v1.get();
    const vRSpeed = this.flightPlanService.active.performanceData.vr.get();
    const v2Speed = this.flightPlanService.active.performanceData.v2.get();

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
      !this.flightPlanService.active.performanceData.v1.get() ||
      !this.flightPlanService.active.performanceData.vr.get() ||
      !this.flightPlanService.active.performanceData.v2.get();
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
    this.arincDiscreteWord3.setSsm(Arinc429SignStatusMatrix.NormalOperation);
  }

  /**
   * Set the takeoff flap config
   * @param {0 | 1 | 2 | 3 | null} flaps
   */
  setTakeoffFlaps(flaps: FlapConf | null) {
    this.arincDiscreteWord2.setBitValue(13, flaps === 0);
    this.arincDiscreteWord2.setBitValue(14, flaps === 1);
    this.arincDiscreteWord2.setBitValue(15, flaps === 2);
    this.arincDiscreteWord2.setBitValue(16, flaps === 3);
    this.arincDiscreteWord2.setSsm(Arinc429SignStatusMatrix.NormalOperation);
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

  updateDestinationPredictions(destPred?: VerticalWaypointPrediction | null) {
    this.updateMinimums(destPred?.distanceFromAircraft);

    this.arincRemainingFlightTime.setBnrValue(
      destPred?.secondsFromPresent ?? 0,
      destPred === undefined || destPred === null
        ? Arinc429SignStatusMatrix.NoComputedData
        : Arinc429SignStatusMatrix.NormalOperation,
      17,
      131072,
    );
  }

  resetDestinationPredictions() {
    this.updateDestinationPredictions();
  }

  updateMinimums(distanceToDestination?: number) {
    const inRange = this.shouldTransmitMinimums(distanceToDestination);

    const mda = this.flightPlanService.active.performanceData.approachBaroMinimum.get();
    const dh = this.flightPlanService.active.performanceData.approachRadioMinimum.get();
    const dhNumerical = dh === 'NO DH' ? 0 : dh;

    const mdaValid = inRange && mda !== null;
    const dhValid = !mdaValid && inRange && dhNumerical !== null && dhNumerical > 0;

    const mdaSsm = mdaValid ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;
    const dhSsm = dhValid ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData;

    this.arincMDA.setBnrValue(mdaValid ? mda : 0, mdaSsm, 17, 131072, 0);
    this.arincDH.setBnrValue(dhValid ? dhNumerical : 0, dhSsm, 16, 8192, 0);
    this.arincEisWord2.setBitValue(29, inRange && dhNumerical === RADIO_ALTITUDE_NODH_VALUE);
    // FIXME we need to handle these better
    this.arincEisWord2.setSsm(Arinc429SignStatusMatrix.NormalOperation);
  }

  shouldTransmitMinimums(distanceToDestination: number | undefined) {
    const phase = this.flightPhase.get();
    const isCloseToDestination = distanceToDestination !== undefined ? distanceToDestination < 250 : true;

    return phase > FmgcFlightPhase.Cruise || (phase === FmgcFlightPhase.Cruise && isCloseToDestination);
  }

  updateFmsData() {
    const activeFlightPlan = this.flightPlanService.hasActive ? this.flightPlanService.active : null;

    this.fmsOrigin.set(activeFlightPlan?.originAirport?.ident ? activeFlightPlan.originAirport.ident : null);

    this.fmsDepartureRunway.set(activeFlightPlan?.originRunway?.ident ? activeFlightPlan.originRunway.ident : null);

    this.fmsDestination.set(
      activeFlightPlan?.destinationAirport?.ident ? activeFlightPlan.destinationAirport.ident : null,
    );

    this.fmsLandingRunway.set(
      activeFlightPlan?.destinationRunway?.ident ? activeFlightPlan.destinationRunway.ident : null,
    );

    this.fmsAlternate.set(
      activeFlightPlan?.alternateDestinationAirport?.ident ? activeFlightPlan.alternateDestinationAirport.ident : null,
    );

    this.fmgc.data.atcCallsign.set(activeFlightPlan?.flightNumber?.get() ?? null);
  }

  activatePreSelSpeedMach(preSel: number) {
    if (preSel) {
      SimVar.SetSimVarValue('K:A32NX.FMS_PRESET_SPD_ACTIVATE', 'number', 1);
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
    if (!this.fmgc.isAllEngineOn()) {
      kcas += 25; // add 25 knots to GD for EO
    }

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
    let holdSpeedTarget: number | null = null;
    let holdDecelReached = this.holdDecelReached;
    // FIXME big hack until VNAV can do this
    if (currentLeg && currentLeg.isDiscontinuity === false && currentLeg.type === 'HM') {
      holdSpeedTarget = this.getHoldingSpeed(currentLegConstraints.descentSpeed, currentLegConstraints.descentAltitude);
      holdDecelReached = true;
      enableHoldSpeedWarning = this.isAirspeedSelected() ?? false;
      this.holdLegIndex = plan.activeLegIndex;
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
        if (this.isAirspeedSelected() && dtg != null && dtg <= warningDist) {
          enableHoldSpeedWarning = true;
        }
      }
      this.holdLegIndex = plan.activeLegIndex + 1;
    } else {
      this.holdLegIndex = null;
      holdDecelReached = false;
    }

    if (holdDecelReached !== this.holdDecelReached) {
      this.holdDecelReached = holdDecelReached;
      SimVar.SetSimVarValue('L:A32NX_FM_HOLD_DECEL', 'bool', this.holdDecelReached);
    }

    if (holdSpeedTarget !== this.holdSpeedTarget) {
      this.holdSpeedTarget = holdSpeedTarget;
      SimVar.SetSimVarValue('L:A32NX_FM_HOLD_SPEED', 'number', this.holdSpeedTarget ?? 0);
    }

    if (enableHoldSpeedWarning && this.holdSpeedTarget !== null && cas - this.holdSpeedTarget > 5) {
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

  getHoldDecelReached(): boolean {
    return this.holdDecelReached;
  }

  getLegHoldingSpeed(legIndex: number, fpIndex: FlightPlanIndex): number | null {
    return this.holdLegIndex !== null &&
      legIndex === this.holdLegIndex &&
      (fpIndex === FlightPlanIndex.Active || fpIndex === FlightPlanIndex.Temporary)
      ? this.holdSpeedTarget
      : null;
  }

  /** in knots or mach */

  private managedSpeedTargetIsMach = false;

  private holdDecelReached = false;

  private holdSpeedTarget: number | null = null;

  private holdLegIndex: number | null = null;

  private setHoldSpeedMessageActive = false;

  /** in knots */
  private takeoffEngineOutSpeed: number | null = null;

  updateManagedSpeed() {
    if (!this.flightPlanService.hasActive) {
      return;
    }
    let vPfd: number | null = null;
    let isMach = false;
    const phase = this.flightPhase.get();
    this.updateHoldingSpeed();
    this.fmc.clearCheckSpeedModeMessage();

    if (this.holdDecelReached) {
      vPfd = this.holdSpeedTarget!;
    } else {
      if (this.setHoldSpeedMessageActive) {
        this.setHoldSpeedMessageActive = false;
        SimVar.SetSimVarValue('L:A32NX_PFD_MSG_SET_HOLD_SPEED', 'bool', false);
        this.fmc.removeMessageFromQueue(NXSystemMessages.setHoldSpeed.text);
      }
      const engineOut = !this.fmgc.isAllEngineOn();
      switch (phase) {
        case FmgcFlightPhase.Preflight:
        case FmgcFlightPhase.Takeoff:
          vPfd = this.flightPlanService.active.performanceData.v2.get();
          break;
        case FmgcFlightPhase.Climb: {
          let speed = this.fmgc.getManagedClimbSpeed();
          const speedLimit = this.fmgc.getClimbSpeedLimit();
          if (speedLimit !== null && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < speedLimit.underAltitude) {
            speed = Math.min(speed, speedLimit.speed);
          }
          speed = Math.min(speed, this.getSpeedConstraint());
          // EO handling. Ignore speed constraints or limits.
          if (engineOut) {
            const greenDotSpeed = this.fmgc.data.greenDotSpeed.get();
            const openClimbOrClimbActive =
              this.masterPrimFgWord3.get().bitValueOr(11, false) || this.masterPrimFgWord3.get().bitValue(13);
            if (openClimbOrClimbActive && greenDotSpeed) {
              // New speed target is GDOT (EO-GDOT), but it ramps down by 1kt per second
              const casWord = ADIRS.getCalibratedAirspeed();
              const cas = casWord && casWord.isNormalOperation() ? casWord.value : null;
              speed = cas ? cas - (cas - greenDotSpeed) * (FMS_CYCLE_TIME / 1_000) : greenDotSpeed;
            }
          }
          [vPfd, isMach] = this.getManagedTargets(speed, this.fmgc.getManagedClimbSpeedMach());
          break;
        }
        case FmgcFlightPhase.Cruise: {
          let speed = this.fmgc.getManagedCruiseSpeed();
          const speedLimit = this.fmgc.getClimbSpeedLimit();
          if (speedLimit !== null && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < speedLimit.underAltitude) {
            speed = Math.min(speed, speedLimit.speed);
          }
          [vPfd, isMach] = this.getManagedTargets(speed, this.fmgc.getManagedCruiseSpeedMach());
          break;
        }
        case FmgcFlightPhase.Descent: {
          // We fetch this data from VNAV
          vPfd = this.vnavManagedSpeedForDescentPhase.get() ?? this.fmgc.getManagedDescentSpeed();
          // Whether to use Mach or not should be based on the original managed speed, not whatever VNAV uses under the hood to vary it.
          // Also, VNAV already does the conversion from Mach if necessary
          isMach = this.getManagedTargets(vPfd, this.fmgc.getManagedDescentSpeedMach())[1];
          break;
        }
        case FmgcFlightPhase.Approach: {
          vPfd = this.fmgc.data.approachVapp.get();
          break;
        }
        case FmgcFlightPhase.GoAround: {
          const speedConstraint = this.getSpeedConstraint();
          const speed = Math.min(this.fmgc.data.greenDotSpeed.get() ?? Infinity, speedConstraint);
          vPfd = speed;
          break;
        }
        default:
          break;
      }
    }
    this.speedsManagedPfd.set(vPfd);

    // Automatically change fcu mach/speed mode
    if (this.managedSpeedTargetIsMach !== isMach) {
      if (isMach) {
        SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_ON', 'number', 1);
      } else {
        SimVar.SetSimVarValue('K:AP_MANAGED_SPEED_IN_MACH_OFF', 'number', 1);
      }
      this.managedSpeedTargetIsMach = isMach;
    }
  }

  public invalidateManagedSpeed() {
    this.speedsManagedPfd.set(null);
  }

  getAppManagedSpeed() {
    switch (this.flapLeverPosition) {
      case 0:
        return this.fmgc.data.greenDotSpeed.get();
      case 1:
        return this.fmgc.data.slatRetractionSpeed.get();
      case 3:
        return this.fmc.approachFlapsThreeSelected.get()
          ? this.fmgc.data.approachVapp.get()
          : this.fmgc.data.flapRetractionSpeed.get();
      case 4:
        return this.fmgc.data.approachVapp.get();
      default:
        return this.fmgc.data.flapRetractionSpeed.get();
    }
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

  /** in feet */
  private constraintAlt: number | null = null;

  /**
   * Updates performance speeds such as GD, F, S, Vls and approach speeds. Write to SimVars
   */
  public updatePerfSpeeds() {
    /** in kg */
    const estLdgWeight = this.fmc.getLandingWeight(FlightPlanIndex.Active);
    let ldgWeight = estLdgWeight;
    const grossWeight = this.fmc.fmgc.getGrossWeightKg() ?? maxZfw + (this.fmc.fmgc.getFOB() ?? 0) * 1_000;
    const grossWeightCG = this.fmc.fmgc.getGrossWeightCg() ?? 35;
    // Actual weight is used during approach phase (FCOM bulletin 46/2), and we also assume during go-around
    if (this.flightPhase.get() >= FmgcFlightPhase.Approach || estLdgWeight === null) {
      ldgWeight = grossWeight;
    }

    const pd = this.flightPlanService.active.performanceData;
    // if pilot has set approach wind in MCDU we use it, otherwise fall back to current measured wind
    const appWindDirection = pd.approachWindDirection.get();
    const appWindMagnitude = pd.approachWindMagnitude.get();
    let towerHeadwind = 0;
    if (appWindDirection !== null && appWindMagnitude !== null) {
      if (this.flightPlanService.active.destinationRunway) {
        towerHeadwind = A380SpeedsUtils.getHeadwind(
          appWindMagnitude,
          appWindDirection,
          this.flightPlanService.active.destinationRunway.magneticBearing,
        );
      }
    }

    // Calculate approach speeds. Independent from ADR data
    // TODO: is this the correct way of getting the landing CG?
    const landingCg = grossWeightCG;
    if (ldgWeight !== null && landingCg !== null) {
      const approachSpeeds = new A380OperatingSpeeds(
        ldgWeight,
        landingCg,
        0,
        pd.approachFlapsThreeSelected.get() ? FlapConf.CONF_3 : FlapConf.CONF_FULL,
        FmgcFlightPhase.Approach,
        this.fmgc.getV2Speed(),
        this.fmgc.getDestinationElevation(),
        towerHeadwind,
        true, // ignore VLS spoiler increase as it's only for display purposes
      );
      this.fmgc.data.approachVls.set(Math.ceil(approachSpeeds.vls));
      this.fmgc.data.approachVref.set(Math.ceil(approachSpeeds.vref));
      this.fmgc.data.approachGreenDotSpeed.set(Math.ceil(approachSpeeds.gd));
      this.fmgc.data.approachSlatRetractionSpeed.set(Math.ceil(approachSpeeds.s));
      this.fmgc.data.approachFlapRetractionSpeed.set(Math.ceil(approachSpeeds.f2));
      this.fmgc.data.approachVapp.set(pd.pilotVapp.get() ?? Math.ceil(approachSpeeds.vapp));
    } else {
      this.fmgc.data.approachVls.set(null);
      this.fmgc.data.approachVref.set(null);
      this.fmgc.data.approachGreenDotSpeed.set(null);
      this.fmgc.data.approachSlatRetractionSpeed.set(null);
      this.fmgc.data.approachFlapRetractionSpeed.set(null);
      this.fmgc.data.approachVapp.set(null);
    }
    // Retrieve altitude from ADRs
    const alt = this.fmc.navigation.getPressureAltitude();

    if (alt !== null) {
      // Only update speeds if ADR altitude data valid.

      const flapLever = SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Enum');
      const speeds = new A380OperatingSpeeds(
        grossWeight,
        grossWeightCG,
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
      !this.fmc.zeroFuelWeight.get() &&
      !this.fmc.zeroFuelWeightCenterOfGravity.get() &&
      !SimVar.GetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', SimVarValueType.Bool)
    ) {
      const initZfw = SimVar.GetSimVarValue('L:A32NX_AIRFRAME_ZFW', 'number');
      const initZfwCg = SimVar.GetSimVarValue('L:A32NX_AIRFRAME_ZFW_CG_PERCENT_MAC', 'number');

      // Update FMS ZFW and ZFWCG from SimVars, e.g. when spawning on a runway
      this.fmc.flightPlanInterface.active.setPerformanceData('zeroFuelWeight', initZfw / 1_000);
      this.fmc.flightPlanInterface.active.setPerformanceData('zeroFuelWeightCenterOfGravity', initZfwCg);
    }

    SimVar.SetSimVarValue('L:A32NX_FM_GROSS_WEIGHT', 'Number', gw ?? 0);
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
    const fcuSelAlt = this.masterPrimAltitude.get().valueOr(null);
    if (fcuSelAlt !== null) {
      const activeFpIndex = this.flightPlanService.activeLegIndex;
      const constraints = this.managedProfile.get(activeFpIndex);

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
  }

  onStepClimbDescent() {
    const cruiseLevel = this.flightPlanService.active.performanceData.cruiseFlightLevel.get();
    const flightPhase = this.flightPhase.get();
    const isCruise = flightPhase === FmgcFlightPhase.Cruise;
    const isClimbPhase = flightPhase === FmgcFlightPhase.Climb;

    if (!isClimbPhase && !isCruise) {
      return;
    }

    const primAltitude = this.masterPrimAltitude.get();
    const targetFlightLevel = primAltitude.isNormalOperation() ? primAltitude.value / 100 : null;

    if (
      targetFlightLevel !== null &&
      ((isClimbPhase && targetFlightLevel > (cruiseLevel ?? 0)) || (isCruise && targetFlightLevel !== cruiseLevel))
    ) {
      if (cruiseLevel !== null) {
        this.deleteOutdatedCruiseSteps(cruiseLevel, targetFlightLevel);
      }
      this.fmc.addMessageToQueue(
        NXSystemMessages.newCrzAlt.getModifiedMessage(primAltitude.value.toFixed(0)),
        undefined,
        undefined,
      );
      this.flightPlanService.active.setPerformanceData('cruiseFlightLevel', targetFlightLevel);
      SimVar.SetSimVarValue('L:A32NX_AIRLINER_CRUISE_ALTITUDE', 'number', primAltitude.value);
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

  /**
   * Checks whether or not the crz fl can be changed to the newly selected fcu altitude.
   */
  public checkCruiseLevelChangeDueToFcu(deltaTime: number) {
    if (this.fcuAltitudeChangeCheckCruiseFlightLevel) {
      const cruiseLevel = this.flightPlanService.active.performanceData.cruiseFlightLevel.get();
      const flightPhase = this.flightPhase.get();
      const isClimb = flightPhase === FmgcFlightPhase.Climb;
      const isCruise = flightPhase === FmgcFlightPhase.Cruise;
      const fcuAltitude = this.masterPrimAltitude.get().valueOr(null);
      const fcuFlightLevel = fcuAltitude !== null ? fcuAltitude / 100 : null;
      if (
        fcuFlightLevel !== null &&
        ((isClimb && fcuFlightLevel > (cruiseLevel ?? 0)) || (isCruise && fcuFlightLevel !== cruiseLevel))
      ) {
        const primFgDiscreteWord3 = this.masterPrimFgWord3.get();
        const fgModesSuitedForLevelChange =
          primFgDiscreteWord3.bitValueOr(11, false) || // CLB
          primFgDiscreteWord3.bitValue(12) || // DES
          primFgDiscreteWord3.bitValue(13) || // OP CLB
          primFgDiscreteWord3.bitValue(14) || // OP DES
          primFgDiscreteWord3.bitValue(17) || // VS
          primFgDiscreteWord3.bitValue(18); // FPA

        if (fgModesSuitedForLevelChange) {
          const changeCruiseFlightLevel = this.cruiseAltitudeChangeConfirm.write(true, deltaTime);
          if (changeCruiseFlightLevel) {
            this.fmc.addMessageToQueue(
              NXSystemMessages.newCrzAlt.getModifiedMessage(fcuAltitude!.toFixed(0)),
              undefined,
              undefined,
            );
            this.flightPlanService.active.setPerformanceData('cruiseFlightLevel', fcuFlightLevel);
            // used by FlightPhaseManager
            SimVar.SetSimVarValue('L:A32NX_AIRLINER_CRUISE_ALTITUDE', 'number', fcuAltitude);
            this.fcuAltitudeChangeCheckCruiseFlightLevel = false;
            return;
          }
        }
      }
      // Reset helpers
      this.cruiseAltitudeChangeConfirm.write(false, deltaTime);
      this.fcuAltitudeChangeCheckCruiseFlightLevel = false;
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

  public isHdgOrTrackModeEngaged(): Subscribable<boolean> {
    return this.isTrackOrheadingActive;
  }

  private isLateralModeManaged() {
    const primFgDiscreteWord4 = this.masterPrimFgWord4.get();
    return (
      primFgDiscreteWord4.bitValueOr(12, false) || // NAV
      primFgDiscreteWord4.bitValue(13) || // LOC CPT
      primFgDiscreteWord4.bitValue(14) || /// LOC TRACK
      primFgDiscreteWord4.bitValue(25) || /// LAND
      this.masterPrimFgWord3.get().bitValueOr(24, false) || // FLARE
      primFgDiscreteWord4.bitValue(26) // ROLLOUT
    );
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
    if (!this.isLateralModeManaged()) {
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

        const autoStepClimb = NXDataStore.getLegacy('AUTO_STEP_CLIMB', 'DISABLED') === 'ENABLED';
        if (autoStepClimb && !this.fmc.guidanceController.vnavDriver.isSelectedVerticalModeActive()) {
          SimVar.SetSimVarValue('K:A32NX.FCU_ALT_SET', SimVarValueType.Number, approachingCruiseStep.toAltitude).catch(
            console.error,
          );
          SimVar.SetSimVarValue('K:A32NX.FCU_ALT_PULL', SimVarValueType.Bool, true);
        }
        this.stepAheadTriggeredForAltitude = approachingCruiseStep.toAltitude;
      }
    }
  }

  public transmitVerticalPath(
    targetProfile: VerticalPathCheckpoint[],
    vdAltitudeConstraints: VdAltitudeConstraint[],
    actualProfile: VerticalPathCheckpoint[],
    descentProfile: VerticalPathCheckpoint[],
    trackChangeDistance: number | null,
  ) {
    const pub = this.bus.getPublisher<MfdSurvEvents>();

    pub.pub('a32nx_fms_vertical_target_profile', targetProfile, true);
    pub.pub('a32nx_fms_vertical_constraints', vdAltitudeConstraints, true);
    pub.pub('a32nx_fms_vertical_actual_profile', actualProfile, true);
    pub.pub('a32nx_fms_vertical_descent_profile', descentProfile, true);
    pub.pub('a32nx_fms_vd_track_change_distance', trackChangeDistance, true);
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

  checkDestEfobBelowMin() {
    const destEfob = this.fmc.fmgc.getDestEFOB(true);
    if (destEfob !== null) {
      const minFuelAtDestination = this.flightPlanService.active.performanceData.minimumDestinationFuelOnBoard.get();
      if (minFuelAtDestination !== null) {
        const isBelowMin = this.fmgc.data.destEfobBelowMinInActive.get();
        if (isBelowMin) {
          this.fmgc.data.destEfobBelowMinInActive.set(destEfob - minFuelAtDestination <= 0.3);
        } else {
          this.fmgc.data.destEfobBelowMinInActive.set(destEfob < minFuelAtDestination);
        }
        return;
      }
    }
    this.fmgc.data.destEfobBelowMinInActive.set(false);
  }

  checkDestEfobBelowMinScratchPadMessage(deltaTime: number) {
    const flightPhase = this.flightPhase.get();
    const altActiveInClimbForMoreThan10Min: boolean = this.altActiveInClimbForMoreThan10Min.write(
      flightPhase === FmgcFlightPhase.Climb && this.masterPrimFgWord3.get().bitValueOr(20, false),
      deltaTime,
    );

    this.destEfobBelowMinScratchPadMessage.set(
      this.fmgc.data.destEfobBelowMinInActive.get() &&
        (flightPhase === FmgcFlightPhase.Cruise ||
          flightPhase === FmgcFlightPhase.Descent ||
          altActiveInClimbForMoreThan10Min ||
          ((flightPhase === FmgcFlightPhase.Approach || flightPhase === FmgcFlightPhase.GoAround) &&
            (this.radioAlt.get() ?? 0) > 800)),
    );
  }

  checkEngineOut() {
    this.engineFailurePulseNode.write(this.fmgc.isFlying() && !this.fmgc.isAllEngineOn());
    if (!this.fmgc.data.engineOut.get() && this.engineFailurePulseNode.read()) {
      this.fmgc.data.engineOut.set(true);
    }

    if (this.fmgc.data.engineOut.get() && this.fmgc.isAllEngineOn()) {
      this.fmgc.data.engineOut.set(false);
    }
  }

  /**
   * Acquires SFCC data related to flap lever position
   */
  sfccAquisition() {
    this.sfccSlatFlapSystemStatusWord.set(this.sfcc1SlatFlapSystemStatusWord.get());
    if (this.sfccSlatFlapSystemStatusWord.isInvalid()) {
      this.sfccSlatFlapSystemStatusWord.set(this.sfcc2SlatFlapSystemStatusWord.get());
    }
    const conf1 = this.sfccSlatFlapSystemStatusWord.bitValueOr(18, false);
    const conf2 = this.sfccSlatFlapSystemStatusWord.bitValueOr(19, false);
    const conf3 = this.sfccSlatFlapSystemStatusWord.bitValueOr(20, false);
    const confFull = this.sfccSlatFlapSystemStatusWord.bitValueOr(21, false);

    if (conf1) {
      this.flapLeverPosition = 1;
    } else if (conf2) {
      this.flapLeverPosition = 2;
    } else if (conf3) {
      this.flapLeverPosition = 3;
    } else if (confFull) {
      this.flapLeverPosition = 4;
    } else {
      this.flapLeverPosition = 0;
    }
  }

  checkLateralDiscontinuityAhead() {
    this.latDiscontinuityAhead.set(this.fmc.guidanceController?.vnavDriver.shouldShowLatDiscontinuityAhead());
  }

  calculateFinalAndAlternateFuel(fpIndex = FlightPlanIndex.Active) {
    const fpExists = this.flightPlanService.has(fpIndex);
    if (fpExists) {
      const fp = this.flightPlanService.get(fpIndex);
      const pd = fp.performanceData;
      const hasAlternate = fp.alternateDestinationAirport !== undefined;
      //FIX ME. All these should be derived from VNAV predictions
      // Calculate alternate fuel
      pd.calculatedAlternateFuel.set(hasAlternate ? 6.5 : 0);
      if (!hasAlternate) {
        pd.pilotAlternateFuel.set(null);
      }
      // Calculate final fuel.
      if (pd.isFinalHoldingFuelPilotEntered.get()) {
        const finalFuel = pd.pilotFinalHoldingFuel.get();
        pd.calculatedFinalHoldingTime.set(finalFuel !== null ? finalFuel / 0.2 : null);
        pd.calculatedFinalHoldingFuel.set(null);
      } else {
        pd.calculatedFinalHoldingTime.set(null);
        const finalTime = pd.finalHoldingTime.get();
        pd.calculatedFinalHoldingFuel.set(finalTime !== null ? finalTime * 0.2 : null);
      }
    }
  }

  isInchesSelectedOnFcu(side: EfisSide): boolean {
    if (side == 'L') {
      return this.fcuEfisLeftDiscreteWord2.get().bitValueOr(13, false);
    } else {
      return this.fcuEfisRightDiscreteWord2.get().bitValueOr(13, false);
    }
  }

  getFcuSelectedAltitude(): number | null {
    return this.masterPrimAltitude.get().valueOr(null);
  }

  isAirspeedSelected(): boolean | null {
    return this.masterPrimFgWord5.get().bitValueOr(18, null);
  }

  isAirspeedManaged(): boolean | null {
    return this.masterPrimFgWord5.get().bitValueOr(17, null);
  }
}
