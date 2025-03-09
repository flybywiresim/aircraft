// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { A380Failure } from '@failures';
import {
  a380EfisRangeSettings,
  IrBusEvents,
  Arinc429LocalVarConsumerSubject,
  Arinc429WordData,
  ArincEventBus,
  ClientState,
  EfisNdMode,
  EfisSide,
  ElevationSamplePathDto,
  FailuresConsumer,
  FcuBusPublisher,
  FcuSimVars,
  MsfsMiscEvents,
  PathVectorType,
  TawsAircraftStatusDataDto,
  TawsData,
  TawsEfisDataDto,
  UpdateThrottler,
  WaypointDto,
} from '@flybywiresim/fbw-sdk';
import {
  ClockEvents,
  ConsumerSubject,
  EventBus,
  Instrument,
  InstrumentBackplane,
  MappedSubject,
  SimVarValueType,
  Subject,
  Subscription,
} from '@microsoft/msfs-sdk';
import { ArmedLateralMode, isArmed, LateralMode } from '@shared/autopilot';
import { ResetPanelSimvars } from 'instruments/src/MsfsAvionicsCommon/providers/ResetPanelPublisher';
import { FmsSymbolsData } from 'instruments/src/ND/FmsSymbolsPublisher';
import { PowerSupplyBusTypes } from './powersupply';
import { EgpwcSimVars } from 'instruments/src/MsfsAvionicsCommon/providers/EgpwcBusPublisher';
import { FGVars } from 'instruments/src/MsfsAvionicsCommon/providers/FGDataPublisher';
import { AesuBusEvents } from 'instruments/src/MsfsAvionicsCommon/providers/AesuBusPublisher';
import { MfdSurvEvents } from 'instruments/src/MsfsAvionicsCommon/providers/MfdSurvPublisher';

/**
 * Collects EFIS information for a given EFIS side. Has to be used together with private bus since switchable publishers are used, don't want that to spill to the parent components
 */
class EfisDataSync implements Instrument {
  private readonly subscriptions: Subscription[] = [];
  private readonly bus = new EventBus();
  private readonly sub = this.bus.getSubscriber<FcuSimVars>();
  private readonly backplane = new InstrumentBackplane();
  private readonly fcuBusPublisher = new FcuBusPublisher(this.bus, this.side);

  public readonly ndRange = ConsumerSubject.create(this.sub.on('ndRangeSetting'), 0);
  public readonly ndMode = ConsumerSubject.create(this.sub.on('ndMode'), 0);
  public readonly ndOverlay = ConsumerSubject.create(this.sub.on('a380x_efis_cp_active_overlay'), 0);

  constructor(private readonly side: EfisSide) {
    this.backplane.addPublisher('fcubus', this.fcuBusPublisher);

    this.subscriptions.push(this.ndMode, this.ndRange, this.ndOverlay);
  }

  init(): void {
    this.backplane.init();
  }

  onUpdate(): void {
    this.backplane.onUpdate();
  }

  destroy() {
    for (const s of this.subscriptions) {
      s.destroy();
    }
  }
}

/**
 * Utility class to send data to the TAWS from the EFIS CP
 */

export class EfisTawsBridge implements Instrument {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.bus.getSubscriber<
    FmsSymbolsData &
      ClockEvents &
      ResetPanelSimvars &
      PowerSupplyBusTypes &
      EgpwcSimVars &
      FGVars &
      MsfsMiscEvents &
      IrBusEvents &
      AesuBusEvents &
      MfdSurvEvents
  >();

  private readonly updateThrottler = new UpdateThrottler(200);

  private readonly simBridgeClient = ClientState.getInstance();

  private coordinateEqualityWithPrecisionFunc = (a: Arinc429WordData, b: Arinc429WordData) => {
    return a.ssm === b.ssm && a.value.toPrecision(4) === b.value.toPrecision(4);
  };

  private roundedEqualityWithPrecisionFunc = (a: Arinc429WordData, b: Arinc429WordData) => {
    return a.ssm === b.ssm && Math.round(a.value) === Math.round(b.value);
  };

  private readonly latitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('egpwc.presentLatitude')).map(
    (v) => v,
    this.coordinateEqualityWithPrecisionFunc,
  );
  private readonly longitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('egpwc.presentLongitude')).map(
    (v) => v,
    this.coordinateEqualityWithPrecisionFunc,
  );
  private readonly altitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('egpwc.presentAltitude')).map(
    (v) => v,
    this.roundedEqualityWithPrecisionFunc,
  );
  private readonly heading = Arinc429LocalVarConsumerSubject.create(this.sub.on('egpwc.presentHeading')).map(
    (v) => v,
    this.roundedEqualityWithPrecisionFunc,
  );
  private readonly verticalSpeed = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('egpwc.presentVerticalSpeed'),
  ).map((v) => v, this.roundedEqualityWithPrecisionFunc);
  private readonly destinationLatitude = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('egpwc.destinationLatitude'),
  ).map((v) => v, this.coordinateEqualityWithPrecisionFunc);
  private readonly destinationLongitude = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('egpwc.destinationLongitude'),
  ).map((v) => v, this.coordinateEqualityWithPrecisionFunc);

  private readonly efisDataSyncCapt = new EfisDataSync('L');
  private readonly efisDataSyncFO = new EfisDataSync('R');

  private readonly vdRangeLower = [
    ConsumerSubject.create(this.sub.on('a32nx_aesu_vd_range_lower_1').whenChangedBy(5), 0),
    ConsumerSubject.create(this.sub.on('a32nx_aesu_vd_range_lower_2').whenChangedBy(5), 0),
  ];
  private readonly vdRangeUpper = [
    ConsumerSubject.create(this.sub.on('a32nx_aesu_vd_range_upper_1').whenChangedBy(5), 0),
    ConsumerSubject.create(this.sub.on('a32nx_aesu_vd_range_upper_2').whenChangedBy(5), 0),
  ];

  private readonly gearIsDown = ConsumerSubject.create(this.sub.on('egpwc.gearIsDown'), 1);
  private readonly terrOnNdRenderingMode = ConsumerSubject.create(this.sub.on('egpwc.terrOnNdRenderingMode'), 0);
  private readonly groundTruthLatitude = ConsumerSubject.create(this.sub.on('msfs_latitude').withPrecision(4), 0);
  private readonly groundTruthLongitude = ConsumerSubject.create(this.sub.on('msfs_longitude').withPrecision(4), 0);

  private readonly activeLateralMode = ConsumerSubject.create(this.sub.on('fg.fma.lateralMode'), 0);
  private readonly armedLateralMode = ConsumerSubject.create(this.sub.on('fg.fma.lateralArmedBitmask'), 0);
  private readonly shouldShowTrackLine = MappedSubject.create(
    ([active, armed]) =>
      (active === LateralMode.NONE ||
        active === LateralMode.HDG ||
        active === LateralMode.TRACK ||
        active === LateralMode.RWY ||
        active === LateralMode.RWY_TRACK ||
        active === LateralMode.GA_TRACK) &&
      !isArmed(armed, ArmedLateralMode.NAV),
    this.activeLateralMode,
    this.armedLateralMode,
  );

  private readonly terrFailed = Subject.create(false);

  private readonly aesu1ResetPulled = ConsumerSubject.create(this.sub.on('a380x_reset_panel_aesu1'), false);
  private readonly aesu2ResetPulled = ConsumerSubject.create(this.sub.on('a380x_reset_panel_aesu2'), false);

  private readonly acEssPowered = ConsumerSubject.create(this.sub.on('acBusEss'), false);
  private readonly ac4Powered = ConsumerSubject.create(this.sub.on('acBus4'), false);

  private readonly efisDataCapt = MappedSubject.create(
    ([ndRange, ndMode, ndOverlay, vdRangeLower, vdRangeUpper, terrFailed]) => {
      return {
        ndRange: Math.max(a380EfisRangeSettings[ndRange], 0),
        arcMode: ndMode === EfisNdMode.ARC,
        terrOnNd: ndMode !== EfisNdMode.PLAN && ndOverlay === 2 && !terrFailed,
        terrOnVd: (ndMode === EfisNdMode.ARC || ndMode === EfisNdMode.ROSE_NAV) && !terrFailed,
        efisMode: ndMode,
        vdRangeLower: vdRangeLower,
        vdRangeUpper: vdRangeUpper,
      } as TawsEfisDataDto;
    },
    this.efisDataSyncCapt.ndRange,
    this.efisDataSyncCapt.ndMode,
    this.efisDataSyncCapt.ndOverlay,
    this.vdRangeLower[0],
    this.vdRangeUpper[0],
    this.terrFailed,
  );
  private readonly efisDataFO = MappedSubject.create(
    ([ndRange, ndMode, ndOverlay, vdRangeLower, vdRangeUpper, terrFailed]) => {
      return {
        ndRange: Math.max(a380EfisRangeSettings[ndRange], 0),
        arcMode: ndMode === EfisNdMode.ARC,
        terrOnNd: ndMode !== EfisNdMode.PLAN && ndOverlay === 2 && !terrFailed,
        terrOnVd: (ndMode === EfisNdMode.ARC || ndMode === EfisNdMode.ROSE_NAV) && !terrFailed,
        efisMode: ndMode,
        vdRangeLower: vdRangeLower,
        vdRangeUpper: vdRangeUpper,
      } as TawsEfisDataDto;
    },
    this.efisDataSyncFO.ndRange,
    this.efisDataSyncFO.ndMode,
    this.efisDataSyncFO.ndOverlay,
    this.vdRangeLower[1],
    this.vdRangeUpper[1],
    this.terrFailed,
  );

  private readonly aircraftStatusData = MappedSubject.create(
    ([
      latitude,
      longitude,
      altitude,
      heading,
      verticalSpeed,
      gearIsDown,
      destinationLatitude,
      destinationLongitude,
      efisDataCapt,
      efisDataFO,
      terrOnNdRenderingMode,
      groundTruthLatitude,
      groundTruthLongitude,
      trackLineShown,
    ]) => {
      const adiruDataValid =
        longitude.isNormalOperation() &&
        latitude.isNormalOperation() &&
        altitude.isNormalOperation() &&
        heading.isNormalOperation() &&
        verticalSpeed.isNormalOperation();

      return {
        adiruDataValid,
        tawsInop: false,
        latitude: latitude.value,
        longitude: longitude.value,
        altitude: altitude.value,
        heading: heading.value,
        verticalSpeed: verticalSpeed.value,
        gearIsDown: !!gearIsDown,
        runwayDataValid: destinationLatitude.isNormalOperation() && destinationLongitude.isNormalOperation(),
        runwayLatitude: destinationLatitude.value,
        runwayLongitude: destinationLongitude.value,
        efisDataCapt: efisDataCapt,
        efisDataFO: efisDataFO,
        navigationDisplayRenderingMode: terrOnNdRenderingMode,
        manualAzimEnabled: trackLineShown,
        manualAzimDegrees: heading.value,
        groundTruthLatitude: groundTruthLatitude,
        groundTruthLongitude: groundTruthLongitude,
      } as TawsAircraftStatusDataDto;
    },
    this.latitude,
    this.longitude,
    this.altitude,
    this.heading,
    this.verticalSpeed,
    this.gearIsDown,
    this.destinationLatitude,
    this.destinationLongitude,
    this.efisDataCapt,
    this.efisDataFO,
    this.terrOnNdRenderingMode,
    this.groundTruthLatitude,
    this.groundTruthLongitude,
    this.shouldShowTrackLine,
  );

  private aircraftStatusShouldBeUpdated = true;

  // FIXME receive path over complete distance
  private readonly fmsLateralPath = ConsumerSubject.create(this.sub.on('vectorsActive'), []);
  private readonly fmsVerticalPath = ConsumerSubject.create(this.sub.on('a32nx_fms_vertical_path'), []);

  private readonly track1Word = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_ir_true_track_1'));
  private readonly track2Word = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_ir_true_track_2'));
  private readonly track3Word = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_ir_true_track_3'));
  private readonly validTrack = MappedSubject.create(
    ([t1, t2, t3]) => {
      if (t1.isNormalOperation()) {
        return t1.value;
      } else if (t2.isNormalOperation()) {
        return t2.value;
      } else if (t3.isNormalOperation()) {
        return t3.value;
      }
      return null;
    },
    this.track1Word,
    this.track2Word,
    this.track3Word,
  );

  private readonly ir1MaintWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_ir_maint_word_1'));
  private readonly ir2MaintWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_ir_maint_word_2'));
  private readonly ir3MaintWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_ir_maint_word_3'));
  private readonly validIrMaintWord = MappedSubject.create(
    ([t1, t2, t3]) => {
      if (t1.isNormalOperation()) {
        return t1;
      } else if (t2.isNormalOperation()) {
        return t2;
      } else if (t3.isNormalOperation()) {
        return t3;
      }
      return null;
    },
    this.ir1MaintWord,
    this.ir2MaintWord,
    this.ir3MaintWord,
  );

  /** If track from one segment differs more than 3° from previous track, paint grey area */
  private readonly trackChangeDistance = MappedSubject.create(([path]) => {
    if (!path || path.length === 0) {
      return -1;
    }

    let currentTrack = null;

    for (const segment of path) {
      if (segment.trackToTerminationWaypoint === null) {
        continue;
      }

      if (currentTrack !== null && Math.abs(segment.trackToTerminationWaypoint - currentTrack) > 3) {
        return segment.distanceFromAircraft;
      }
      currentTrack = segment.trackToTerminationWaypoint;
    }
    return -1;
  }, this.fmsVerticalPath);

  private readonly terrVdPathData = MappedSubject.create(
    ([fmsPath, trackChangeDistance]) => {
      const waypoints = !fmsPath
        ? []
        : fmsPath
            .filter((p) => p.type !== PathVectorType.DebugPoint)
            .map((p) => {
              const waypoint: WaypointDto = {
                latitude: p.startPoint.lat,
                longitude: p.startPoint.long,
              };
              return waypoint;
            });

      const data: ElevationSamplePathDto = {
        pathWidth: 1, // FIXME implement logic for width of vertical cut, DSC-31-CDS-20-40-10
        trackChangesSignificantlyAtDistance: trackChangeDistance,
        waypoints: waypoints,
      };
      return data;
    },
    this.fmsLateralPath,
    this.trackChangeDistance,
  );

  private verticalPathShouldBeUpdated = true;

  private readonly terr1Failed = Subject.create(false);
  private readonly terr2Failed = Subject.create(false);
  private readonly gpws1Failed = Subject.create(false);
  private readonly gpws2Failed = Subject.create(false);
  private readonly wxr1Failed = Subject.create(true);
  private readonly wxr2Failed = Subject.create(true);

  constructor(
    private readonly bus: ArincEventBus,
    private readonly instrument: BaseInstrument,
    private readonly failuresConsumer: FailuresConsumer,
  ) {}

  init() {
    this.efisDataSyncCapt.init();
    this.efisDataSyncFO.init();

    this.subscriptions.push(
      this.aircraftStatusData.sub(() => {
        this.aircraftStatusShouldBeUpdated = true;
      }, true),
      this.terrVdPathData.sub(() => {
        this.verticalPathShouldBeUpdated = true;
      }, true),
      this.sub
        .on('realTime')
        .atFrequency(0.1)
        .handle(() => {
          this.aircraftStatusShouldBeUpdated = true;
          this.verticalPathShouldBeUpdated = true;
        }),
      this.terr1Failed.sub((v) => SimVar.SetSimVarValue('L:A32NX_TERR_1_FAILED', SimVarValueType.Bool, v), true),
      this.terr2Failed.sub((v) => SimVar.SetSimVarValue('L:A32NX_TERR_2_FAILED', SimVarValueType.Bool, v), true),
      this.gpws1Failed.sub((v) => SimVar.SetSimVarValue('L:A32NX_GPWS_1_FAILED', SimVarValueType.Bool, v), true),
      this.gpws2Failed.sub((v) => SimVar.SetSimVarValue('L:A32NX_GPWS_2_FAILED', SimVarValueType.Bool, v), true),
      this.wxr1Failed.sub((v) => SimVar.SetSimVarValue('L:A32NX_WXR_1_FAILED', SimVarValueType.Bool, v), true),
      this.wxr2Failed.sub((v) => SimVar.SetSimVarValue('L:A32NX_WXR_2_FAILED', SimVarValueType.Bool, v), true),
    );

    this.subscriptions.push(
      this.latitude,
      this.longitude,
      this.altitude,
      this.heading,
      this.verticalSpeed,
      this.destinationLatitude,
      this.destinationLongitude,
      this.vdRangeLower[0],
      this.vdRangeLower[1],
      this.vdRangeUpper[0],
      this.vdRangeUpper[1],
      this.gearIsDown,
      this.terrOnNdRenderingMode,
      this.groundTruthLatitude,
      this.groundTruthLongitude,
      this.activeLateralMode,
      this.armedLateralMode,
      this.shouldShowTrackLine,
      this.aesu1ResetPulled,
      this.aesu2ResetPulled,
      this.efisDataCapt,
      this.efisDataFO,
      this.aircraftStatusData,
      this.fmsLateralPath,
      this.fmsVerticalPath,
      this.track1Word,
      this.track2Word,
      this.track3Word,
      this.validTrack,
      this.ir1MaintWord,
      this.ir2MaintWord,
      this.ir3MaintWord,
      this.validIrMaintWord,
      this.trackChangeDistance,
      this.terrVdPathData,
    );

    this.failuresConsumer.register(A380Failure.Terr1);
    this.failuresConsumer.register(A380Failure.Terr2);
    this.failuresConsumer.register(A380Failure.Gpws1);
    this.failuresConsumer.register(A380Failure.Gpws2);
  }

  public async onUpdate() {
    const deltaTime = this.updateThrottler.canUpdate(this.instrument.deltaTime);

    this.efisDataSyncCapt.onUpdate();
    this.efisDataSyncFO.onUpdate();

    if (deltaTime < 0) {
      return;
    }

    const tawsWxrSelected = SimVar.GetSimVarValue('L:A32NX_WXR_TAWS_SYS_SELECTED', SimVarValueType.Number);
    const extremeLatitude = this.validIrMaintWord.get().bitValueOr(15, false);
    this.terr1Failed.set(
      this.failuresConsumer.isActive(A380Failure.Terr1) ||
        this.aesu1ResetPulled.get() ||
        !this.acEssPowered.get() ||
        extremeLatitude,
    );
    this.terr2Failed.set(
      this.failuresConsumer.isActive(A380Failure.Terr2) ||
        this.aesu2ResetPulled.get() ||
        !this.ac4Powered.get() ||
        extremeLatitude,
    );
    this.gpws1Failed.set(
      this.failuresConsumer.isActive(A380Failure.Gpws1) || this.aesu1ResetPulled.get() || !this.acEssPowered.get(),
    );
    this.gpws2Failed.set(
      this.failuresConsumer.isActive(A380Failure.Gpws2) || this.aesu2ResetPulled.get() || !this.ac4Powered.get(),
    );

    this.terrFailed.set(
      tawsWxrSelected === 1 ? this.terr1Failed.get() : tawsWxrSelected === 2 ? this.terr2Failed.get() : true,
    );

    if (this.aircraftStatusShouldBeUpdated && this.simBridgeClient.isConnected()) {
      const success = await TawsData.postAircraftStatusData(this.aircraftStatusData.get());
      this.aircraftStatusShouldBeUpdated = !success;
    }

    if (this.verticalPathShouldBeUpdated && this.simBridgeClient.isConnected()) {
      const success = await TawsData.postVerticalDisplayPath(this.terrVdPathData.get());
      this.verticalPathShouldBeUpdated = !success;
    }
  }

  destroy() {
    for (const s of this.subscriptions) {
      s.destroy();
    }
    this.efisDataCapt.destroy();
    this.efisDataFO.destroy();
  }
}
