// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  a380EfisRangeSettings,
  Arinc429LocalVarConsumerSubject,
  EfisNdMode,
  EfisTawsBridgeSimVars,
  TawsAircraftStatusDataDto,
  TawsData,
  TawsEfisDataDto,
  UpdateThrottler,
} from '@flybywiresim/fbw-sdk';
import { ConsumerSubject, EventBus, Instrument, Subscription } from '@microsoft/msfs-sdk';

/**
 * Utility class to send data to the TAWS from the EFIS CP
 */

export class EfisTawsBridge implements Instrument {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.bus.getSubscriber<EfisTawsBridgeSimVars>();

  private readonly updadeThrottler = new UpdateThrottler(100);

  private readonly latitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('latitudeRaw'));
  private readonly longitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('longitudeRaw'));
  private readonly altitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('altitudeRaw'));
  private readonly heading = Arinc429LocalVarConsumerSubject.create(this.sub.on('headingRaw'));
  private readonly verticalSpeed = Arinc429LocalVarConsumerSubject.create(this.sub.on('verticalSpeedRaw'));
  private readonly destinationLatitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('destinationLatitudeRaw'));
  private readonly destinationLongitude = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('destinationLongitudeRaw'),
  );

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
    ConsumerSubject.create(this.sub.on('vd_range_lower_capt'), 0),
    ConsumerSubject.create(this.sub.on('vd_range_lower_fo'), 0),
  ];
  private readonly vdRangeUpper = [
    ConsumerSubject.create(this.sub.on('vd_range_upper_capt'), 0),
    ConsumerSubject.create(this.sub.on('vd_range_upper_fo'), 0),
  ];

  private readonly gearIsDown = ConsumerSubject.create(this.sub.on('gearIsDown'), true);
  private readonly terrOnNdRenderingMode = ConsumerSubject.create(this.sub.on('terrOnNdRenderingMode'), 0);
  private readonly groundTruthLatitude = ConsumerSubject.create(this.sub.on('groundTruthLatitude'), 0);
  private readonly groundTruthLongitude = ConsumerSubject.create(this.sub.on('groundTruthLongitude'), 0);

  constructor(
    private readonly bus: EventBus,
    private readonly instrument: BaseInstrument,
  ) {}

  init() {}

  public onUpdate(): void {
    const deltaTime = this.updadeThrottler.canUpdate(this.instrument.deltaTime);

    if (deltaTime < 0) {
      return;
    }

    const adiruDataValid =
      this.longitude.get().isNormalOperation() &&
      this.latitude.get().isNormalOperation() &&
      this.altitude.get().isNormalOperation() &&
      this.heading.get().isNormalOperation() &&
      this.verticalSpeed.get().isNormalOperation();

    const efisDataCapt: TawsEfisDataDto = {
      ndRange: a380EfisRangeSettings[this.ndRange[0].get()],
      arcMode: this.ndMode[0].get() === EfisNdMode.ARC,
      terrSelected: this.ndMode[0].get() !== EfisNdMode.PLAN && this.terrActive[0].get(),
      efisMode: this.ndMode[0].get(),
      vdRangeLower: this.vdRangeLower[0].get(),
      vdRangeUpper: this.vdRangeUpper[0].get(),
    };
    const efisDataFO: TawsEfisDataDto = {
      ndRange: a380EfisRangeSettings[this.ndRange[1].get()],
      arcMode: this.ndMode[1].get() === EfisNdMode.ARC,
      terrSelected: this.ndMode[1].get() !== EfisNdMode.PLAN && this.terrActive[1].get(),
      efisMode: this.ndMode[1].get(),
      vdRangeLower: this.vdRangeLower[1].get(),
      vdRangeUpper: this.vdRangeUpper[1].get(),
    };

    const data: TawsAircraftStatusDataDto = {
      adiruDataValid,
      tawsInop: false,
      latitude: this.latitude.get().value,
      longitude: this.longitude.get().value,
      altitude: this.altitude.get().value,
      heading: this.heading.get().value,
      verticalSpeed: this.verticalSpeed.get().value,
      gearIsDown: !!this.gearIsDown.get(),
      runwayDataValid:
        this.destinationLatitude.get().isNormalOperation() && this.destinationLongitude.get().isNormalOperation(),
      runwayLatitude: this.destinationLatitude.get().value,
      runwayLongitude: this.destinationLongitude.get().value,
      efisDataCapt: efisDataCapt,
      efisDataFO: efisDataFO,
      navigationDisplayRenderingMode: this.terrOnNdRenderingMode.get(),
      manualAzimEnabled: true,
      manualAzimDegrees: 80,
      groundTruthLatitude: this.groundTruthLatitude.get(),
      groundTruthLongitude: this.groundTruthLongitude.get(),
    };
    TawsData.postAircraftStatusData(data);

    /* TawsData.postVerticalDisplayPath({
      pathWidth: 1,
      waypoints: [
        {
          latitude: 42.197,
          longitude: 13.225,
        },
      ],
    });*/
  }
}
