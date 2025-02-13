// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  a380EfisRangeSettings,
  Arinc429LocalVarConsumerSubject,
  Arinc429WordData,
  ArincEventBus,
  ClientState,
  EfisNdMode,
  EfisTawsBridgeSimVars,
  ElevationSamplePathDto,
  PathVectorType,
  TawsAircraftStatusDataDto,
  TawsData,
  TawsEfisDataDto,
  UpdateThrottler,
  WaypointDto,
} from '@flybywiresim/fbw-sdk';
import { pathVectorLength } from '@fmgc/guidance/lnav/PathVector';
import { ClockEvents, ConsumerSubject, Instrument, MappedSubject, Subscription } from '@microsoft/msfs-sdk';
import { ArmedLateralMode, isArmed, LateralMode } from '@shared/autopilot';
import { FmsSymbolsData } from 'instruments/src/ND/FmsSymbolsPublisher';
import { bearingTo } from 'msfs-geo';

/**
 * Utility class to send data to the TAWS from the EFIS CP
 */

export class EfisTawsBridge implements Instrument {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.bus.getSubscriber<EfisTawsBridgeSimVars & FmsSymbolsData & ClockEvents>();

  private readonly updateThrottler = new UpdateThrottler(2_000);

  private readonly simBridgeClient = ClientState.getInstance();

  private coordinateEqualityWithPrecisionFunc = (a: Arinc429WordData, b: Arinc429WordData) => {
    return a.ssm === b.ssm && a.value.toPrecision(4) === b.value.toPrecision(4);
  };

  private roundedEqualityWithPrecisionFunc = (a: Arinc429WordData, b: Arinc429WordData) => {
    return a.ssm === b.ssm && Math.round(a.value) === Math.round(b.value);
  };

  private readonly latitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('latitudeRaw')).map(
    (v) => v,
    this.coordinateEqualityWithPrecisionFunc,
  );
  private readonly longitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('longitudeRaw')).map(
    (v) => v,
    this.coordinateEqualityWithPrecisionFunc,
  );
  private readonly altitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('altitudeRaw')).map(
    (v) => v,
    this.roundedEqualityWithPrecisionFunc,
  );
  private readonly heading = Arinc429LocalVarConsumerSubject.create(this.sub.on('headingRaw')).map(
    (v) => v,
    this.roundedEqualityWithPrecisionFunc,
  );
  private readonly verticalSpeed = Arinc429LocalVarConsumerSubject.create(this.sub.on('verticalSpeedRaw')).map(
    (v) => v,
    this.roundedEqualityWithPrecisionFunc,
  );
  private readonly destinationLatitude = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('destinationLatitudeRaw'),
  ).map((v) => v, this.coordinateEqualityWithPrecisionFunc);
  private readonly destinationLongitude = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('destinationLongitudeRaw'),
  ).map((v) => v, this.coordinateEqualityWithPrecisionFunc);

  private readonly ndRange = [
    ConsumerSubject.create(this.sub.on('nd_range_capt'), 0),
    ConsumerSubject.create(this.sub.on('nd_range_fo'), 0),
  ];
  private readonly ndMode = [
    ConsumerSubject.create(this.sub.on('nd_mode_capt'), 0),
    ConsumerSubject.create(this.sub.on('nd_mode_fo'), 0),
  ];
  private readonly terrActive = [
    ConsumerSubject.create(this.sub.on('terr_active_capt'), false),
    ConsumerSubject.create(this.sub.on('terr_active_fo'), false),
  ];
  private readonly vdRangeLower = [
    ConsumerSubject.create(this.sub.on('vd_range_lower_capt').whenChangedBy(5), 0),
    ConsumerSubject.create(this.sub.on('vd_range_lower_fo').whenChangedBy(5), 0),
  ];
  private readonly vdRangeUpper = [
    ConsumerSubject.create(this.sub.on('vd_range_upper_capt').whenChangedBy(5), 0),
    ConsumerSubject.create(this.sub.on('vd_range_upper_fo').whenChangedBy(5), 0),
  ];

  private readonly gearIsDown = ConsumerSubject.create(this.sub.on('gearIsDown'), true);
  private readonly terrOnNdRenderingMode = ConsumerSubject.create(this.sub.on('terrOnNdRenderingMode'), 0);
  private readonly groundTruthLatitude = ConsumerSubject.create(this.sub.on('groundTruthLatitude').withPrecision(4), 0);
  private readonly groundTruthLongitude = ConsumerSubject.create(
    this.sub.on('groundTruthLongitude').withPrecision(4),
    0,
  );

  private readonly activeLateralMode = ConsumerSubject.create(this.sub.on('activeLateralMode'), 0);
  private readonly armedLateralMode = ConsumerSubject.create(this.sub.on('armedLateralMode'), 0);
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

  private readonly efisDataCapt = MappedSubject.create(
    ([ndRange, ndMode, terrActive, vdRangeLower, vdRangeUpper]) => {
      return {
        ndRange: Math.max(a380EfisRangeSettings[ndRange], 0),
        arcMode: ndMode === EfisNdMode.ARC,
        terrOnNd: ndMode !== EfisNdMode.PLAN && terrActive,
        terrOnVd: ndMode === EfisNdMode.ARC || ndMode === EfisNdMode.ROSE_NAV,
        efisMode: ndMode,
        vdRangeLower: vdRangeLower,
        vdRangeUpper: vdRangeUpper,
      } as TawsEfisDataDto;
    },
    this.ndRange[0],
    this.ndMode[0],
    this.terrActive[0],
    this.vdRangeLower[0],
    this.vdRangeUpper[0],
  );
  private readonly efisDataFO = MappedSubject.create(
    ([ndRange, ndMode, terrActive, vdRangeLower, vdRangeUpper]) => {
      return {
        ndRange: Math.max(a380EfisRangeSettings[ndRange], 0),
        arcMode: ndMode === EfisNdMode.ARC,
        terrOnNd: ndMode !== EfisNdMode.PLAN && terrActive,
        terrOnVd: ndMode === EfisNdMode.ARC || ndMode === EfisNdMode.ROSE_NAV,
        efisMode: ndMode,
        vdRangeLower: vdRangeLower,
        vdRangeUpper: vdRangeUpper,
      } as TawsEfisDataDto;
    },
    this.ndRange[1],
    this.ndMode[1],
    this.terrActive[1],
    this.vdRangeLower[1],
    this.vdRangeUpper[1],
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

  private readonly track1Word = Arinc429LocalVarConsumerSubject.create(this.sub.on('trueTrack1Raw'));
  private readonly track2Word = Arinc429LocalVarConsumerSubject.create(this.sub.on('trueTrack2Raw'));
  private readonly track3Word = Arinc429LocalVarConsumerSubject.create(this.sub.on('trueTrack3Raw'));
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

  /** If track from one segment differs more than 3° from previous track, paint grey area */
  private readonly trackChangeDistance = MappedSubject.create(
    ([path, track]) => {
      if (track === null || path.length === 0) {
        return -1;
      }

      let currentTrack = track;
      let traveledDistance = 0;
      for (const vector of path) {
        if (vector.type === PathVectorType.DebugPoint) {
          continue;
        }
        const newTrack = bearingTo(vector.startPoint, vector.endPoint);

        if (newTrack - currentTrack > 3) {
          return traveledDistance;
        }
        currentTrack = newTrack;
        traveledDistance += pathVectorLength(vector);
      }
      return -1;
    },
    this.fmsLateralPath,
    this.validTrack,
  );

  private readonly terrVdPathData = MappedSubject.create(
    ([fmsPath, trackChangeDistance]) => {
      const waypoints = fmsPath
        .filter((p) => p.type !== PathVectorType.DebugPoint)
        .map((p) => {
          const waypoint: WaypointDto = {
            latitude: p.startPoint.lat,
            longitude: p.startPoint.long,
          };
          return waypoint;
        });

      const data: ElevationSamplePathDto = {
        pathWidth: 1,
        trackChangesSignificantlyAtDistance: trackChangeDistance,
        waypoints: waypoints,
      };
      return data;
    },
    this.fmsLateralPath,
    this.trackChangeDistance,
  );

  private verticalPathShouldBeUpdated = true;

  constructor(
    private readonly bus: ArincEventBus,
    private readonly instrument: BaseInstrument,
  ) {}

  init() {
    this.aircraftStatusData.sub(() => {
      this.aircraftStatusShouldBeUpdated = true;
    }, true);
    this.terrVdPathData.sub(() => {
      this.verticalPathShouldBeUpdated = true;
    }, true);
    this.sub
      .on('realTime')
      .atFrequency(0.1)
      .handle(() => {
        this.aircraftStatusShouldBeUpdated = true;
        this.verticalPathShouldBeUpdated = true;
      });
  }

  public async onUpdate() {
    const deltaTime = this.updateThrottler.canUpdate(this.instrument.deltaTime);

    if (deltaTime < 0) {
      return;
    }

    if (this.aircraftStatusShouldBeUpdated && this.simBridgeClient.isConnected()) {
      const success = await TawsData.postAircraftStatusData(this.aircraftStatusData.get());
      this.aircraftStatusShouldBeUpdated = !success;
    }

    if (this.verticalPathShouldBeUpdated && this.simBridgeClient.isConnected()) {
      const success = Promise.all([
        TawsData.postVerticalDisplayPath('L', this.terrVdPathData.get()),
        TawsData.postVerticalDisplayPath('R', this.terrVdPathData.get()),
      ]);
      this.verticalPathShouldBeUpdated = !success;
    }
  }
}
