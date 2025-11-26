// Copyright (c) 2023-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, EventBus, Instrument, MappedSubject, SimVarValueType } from '@microsoft/msfs-sdk';
import {
  Arinc429LocalVarConsumerSubject,
  Arinc429RegisterSubject,
  Arinc429SignStatusMatrix,
  BTV_MIN_TOUCHDOWN_ZONE_DISTANCE,
  BtvData,
  FmsOansData,
  IrBusEvents,
  LgciuBusEvents,
  MathUtils,
  NearbyFacilityMonitor,
  NearbyFacilityType,
  OansControlEvents,
  OansFmsDataStore,
  OansMapProjection,
  RaBusEvents,
  RegisteredSimVar,
  RopsRunwayPrediction,
  Runway,
  UpdateThrottler,
} from '@flybywiresim/fbw-sdk';
import { Coordinates, placeBearingDistance } from 'msfs-geo';
import { Position } from 'geojson';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { NavigationDatabase, NavigationDatabaseBackend } from '@fmgc/NavigationDatabase';

/**
 * Utility class for brake to vacate (BTV) functions on the A380
 */

export class BrakeToVacate implements Instrument {
  private readonly sub = this.bus.getSubscriber<BtvData & FmsOansData & IrBusEvents & LgciuBusEvents & RaBusEvents>();

  private readonly updateThrottler = new UpdateThrottler(200);

  private readonly fmsDataStore = new OansFmsDataStore(this.bus);

  private arpCoordinates: Coordinates | undefined;
  private localPpos: Position = [];
  private landingRunwayNavdata: Runway | undefined;

  private readonly oansRunwayIdent = ConsumerSubject.create(this.sub.on('oansSelectedLandingRunway'), null);

  // Local coordinates, nav db reference
  /** Threshold, used for runway end distance calculation. Airport local coordinates, reference point from nav db. */
  private btvThresholdPositionNavDbReference: Position = [];
  /** Opposite threshold, used for runway end distance calculation. Airport local coordinates, reference point from nav db. */
  private btvOppositeThresholdPositionNavDbReference: Position = [];
  /** BTV exit position. Airport local coordinates, reference point from nav db. */
  private btvExitPositionNavDbReference: Position = [];

  /** Updated during deceleration on the ground. Counted from touchdown distance (min. 400m).  */
  private readonly remainingDistToExitArinc = Arinc429RegisterSubject.createEmpty();

  /** Updated during deceleration on the ground. Counted from touchdown distance (min. 400m).  */
  private readonly remaininingDistToRwyEndArinc = Arinc429RegisterSubject.createEmpty();

  private readonly requestedStoppingDistArinc = Arinc429RegisterSubject.createEmpty();

  private readonly runwayLengthArinc = Arinc429RegisterSubject.createEmpty();

  private readonly runwayBearingArinc = Arinc429RegisterSubject.createEmpty();

  private readonly btvApprDifferentRunwaySimvar = RegisteredSimVar.create<boolean>(
    'L:A32NX_BTV_APPR_DIFFERENT_RUNWAY',
    SimVarValueType.Bool,
  );

  private readonly oansSelectedRunway = ConsumerSubject.create(this.sub.on('oansSelectedLandingRunway'), null);
  private readonly oansSelectedExit = ConsumerSubject.create(this.sub.on('oansSelectedExit'), null);
  private readonly oansExitCoordinates = ConsumerSubject.create(this.sub.on('oansExitCoordinates'), {
    lat: 0,
    long: 0,
  });

  private readonly radioAltitude1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ra_radio_altitude_1'));
  private readonly radioAltitude2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ra_radio_altitude_2'));
  private readonly radioAltitude3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ra_radio_altitude_3'));
  private readonly radioAltitude = MappedSubject.create(
    ([ra1, ra2, ra3]) => {
      let ra = 1000;
      const numRaValid = (!ra1.isInvalid() ? 1 : 0) + (!ra2.isInvalid() ? 1 : 0) + (!ra3.isInvalid() ? 1 : 0);
      if (numRaValid === 1) {
        ra = !ra1.isInvalid() ? ra1.value : !ra2.isInvalid() ? ra2.value : ra3.value;
      } else if (numRaValid === 2) {
        // Return average of the two valid RAs
        let sum = 0;
        if (!ra1.isInvalid()) sum += ra1.value;
        if (!ra2.isInvalid()) sum += ra2.value;
        if (!ra3.isInvalid()) sum += ra3.value;
        ra = sum / 2;
      } else if (numRaValid === 3) {
        // Return median of the three RAs
        const ras = [ra1.value, ra2.value, ra3.value].sort((a, b) => a - b);
        ra = ras[1];
      }
      return ra;
    },
    this.radioAltitude1,
    this.radioAltitude2,
    this.radioAltitude3,
  );

  private readonly fwsFlightPhase = ConsumerSubject.create(this.sub.on('a380x_btv_fws_flight_phase'), 0);

  private readonly lgciuDiscreteWord2_1 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('lgciu_discrete_word_2_1'),
  );
  private readonly lgciuDiscreteWord2_2 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('lgciu_discrete_word_2_2'),
  );
  private readonly onGround = MappedSubject.create(
    ([g1, g2]) => {
      if (g1.isNormalOperation()) {
        return g1.bitValue(11);
      } else {
        return g2.bitValueOr(11, false);
      }
    },
    this.lgciuDiscreteWord2_1,
    this.lgciuDiscreteWord2_2,
  );

  private readonly autoBrakeMode = ConsumerSubject.create(this.sub.on('a380x_btv_auto_brake_mode'), 0);
  private readonly autoBrakeActive = ConsumerSubject.create(this.sub.on('a380x_btv_auto_brake_active'), false);
  private btvActiveOnGroundLastValue = false;

  private readonly verticalSpeed1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_vertical_speed_1'));
  private readonly verticalSpeed2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_vertical_speed_2'));
  private readonly verticalSpeed3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_vertical_speed_3'));

  private readonly latitude1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_latitude_1'));
  private readonly longitude1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_longitude_1'));
  private readonly latitude2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_latitude_2'));
  private readonly longitude2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_longitude_2'));
  private readonly latitude3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_latitude_3'));
  private readonly longitude3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_longitude_3'));

  private ppos: Coordinates = { lat: 0, long: 0 };

  private readonly trueHeading1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_true_heading_1'));
  private readonly trueHeading2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_true_heading_2'));
  private readonly trueHeading3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_true_heading_3'));

  private nearbyAirportMonitor: NearbyFacilityMonitor;

  constructor(
    private readonly bus: EventBus,
    private readonly instrument: BaseInstrument,
  ) {
    // FIXME this should only ever be used within the FMGC
    const db = new NavigationDatabase(this.bus, NavigationDatabaseBackend.Msfs);
    NavigationDatabaseService.activeDatabase = db;

    this.nearbyAirportMonitor = NavigationDatabaseService.activeDatabase.createNearbyFacilityMonitor(
      NearbyFacilityType.Airport,
    );
    this.nearbyAirportMonitor.setMaxResults(5);
    this.nearbyAirportMonitor.setRadius(5);

    MappedSubject.create(
      ([oansRwy, fmsRwy]) => (oansRwy ? oansRwy : fmsRwy), // Prioritize OANS runway selection
      this.oansSelectedRunway,
      this.fmsDataStore.landingRunway,
    ).sub((runway) => {
      if (runway) {
        this.setBtvRunwayFromNavdata(runway);
      } else {
        this.clearBtvData();
      }
    }, true);

    MappedSubject.create(
      ([exitName, exitCoords]) => {
        if (exitName && exitCoords && exitCoords.lat !== 0 && exitCoords.long !== 0) {
          this.setExitFromOans(exitName, exitCoords);
        }
      },
      this.oansSelectedExit,
      this.oansExitCoordinates,
    );

    MappedSubject.create(
      ([lat1, lon1, lat2, lon2, lat3, lon3]) => {
        if (!lat1.isInvalid() && !lon1.isInvalid()) {
          this.ppos.lat = lat1.value;
          this.ppos.long = lon1.value;
        } else if (!lat2.isInvalid() && !lon2.isInvalid()) {
          this.ppos.lat = lat2.value;
          this.ppos.long = lon2.value;
        } else if (!lat3.isInvalid() && !lon3.isInvalid()) {
          this.ppos.lat = lat3.value;
          this.ppos.long = lon3.value;
        } else {
          this.ppos.lat = 0;
          this.ppos.long = 0;
        }
        return this.ppos;
      },
      this.latitude1,
      this.longitude1,
      this.latitude2,
      this.longitude2,
      this.latitude3,
      this.longitude3,
    );

    this.remainingDistToExitArinc.sub((v) => {
      v.writeToSimVar('L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE');
    }, true);
    this.remaininingDistToRwyEndArinc.sub((v) => {
      v.writeToSimVar('L:A32NX_OANS_BTV_REMAINING_DIST_TO_RWY_END');
    }, true);
    this.requestedStoppingDistArinc.sub((v) => {
      v.writeToSimVar('L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE');
    }, true);
    this.runwayLengthArinc.sub((v) => {
      v.writeToSimVar('L:A32NX_OANS_RWY_LENGTH');
    }, true);
    this.runwayBearingArinc.sub((v) => {
      v.writeToSimVar('L:A32NX_OANS_RWY_BEARING');
    }, true);

    this.sub.on('oansManualStoppingDistance').handle((distance) => {
      this.setBtvFallbackStoppingDistance(distance);
    });
  }

  init() {
    this.clearBtvData();
  }

  private runwayIsSet() {
    return (
      this.btvThresholdPositionNavDbReference &&
      this.btvOppositeThresholdPositionNavDbReference &&
      this.btvThresholdPositionNavDbReference.length > 0 &&
      this.btvOppositeThresholdPositionNavDbReference.length > 0
    );
  }

  private async setBtvRunwayFromNavdata(rwyIdent: string) {
    if (rwyIdent) {
      const db = NavigationDatabaseService.activeDatabase.backendDatabase;

      const arps = await db.getAirports([rwyIdent.substring(0, 4)]);
      this.arpCoordinates = arps[0].location;

      const runways = await db.getRunways(rwyIdent.substring(0, 4));
      this.landingRunwayNavdata = runways.filter((rw) => rw.ident === rwyIdent)[0];
      const oppositeThreshold = placeBearingDistance(
        this.landingRunwayNavdata.thresholdLocation,
        this.landingRunwayNavdata.bearing,
        this.landingRunwayNavdata.length / MathUtils.METRES_TO_NAUTICAL_MILES,
      );

      OansMapProjection.globalToAirportCoordinates(
        this.arpCoordinates,
        this.landingRunwayNavdata.thresholdLocation,
        this.btvThresholdPositionNavDbReference,
      );
      OansMapProjection.globalToAirportCoordinates(
        this.arpCoordinates,
        oppositeThreshold,
        this.btvOppositeThresholdPositionNavDbReference,
      );

      const pub = this.bus.getPublisher<FmsOansData>();
      pub.pub('ropsDetectedRunwayLda', this.landingRunwayNavdata.length, true);
      pub.pub('oansSelectedLandingRunway', rwyIdent, true);

      this.runwayLengthArinc.setValueSsm(this.landingRunwayNavdata.length, Arinc429SignStatusMatrix.NormalOperation);
      this.runwayBearingArinc.setValueSsm(this.landingRunwayNavdata.bearing, Arinc429SignStatusMatrix.NormalOperation);

      this.remaininingDistToRwyEndArinc.setValueSsm(
        this.landingRunwayNavdata.length - BTV_MIN_TOUCHDOWN_ZONE_DISTANCE,
        Arinc429SignStatusMatrix.NormalOperation,
      );
      this.remainingDistToExitArinc.setValueSsm(
        this.landingRunwayNavdata.length - BTV_MIN_TOUCHDOWN_ZONE_DISTANCE,
        Arinc429SignStatusMatrix.NormalOperation,
      );

      this.btvApprDifferentRunwaySimvar.set(false);
    }
  }

  private async setBtvFallbackStoppingDistance(distance: number | null) {
    if (distance && distance > BTV_MIN_TOUCHDOWN_ZONE_DISTANCE && this.landingRunwayNavdata && this.arpCoordinates) {
      const exitLocation = placeBearingDistance(
        this.landingRunwayNavdata.thresholdLocation,
        this.landingRunwayNavdata.bearing,
        distance / MathUtils.METRES_TO_NAUTICAL_MILES,
      );
      OansMapProjection.globalToAirportCoordinates(
        this.arpCoordinates,
        exitLocation,
        this.btvExitPositionNavDbReference,
      );

      const pub = this.bus.getPublisher<FmsOansData>();
      pub.pub('oansSelectedExit', 'N/A', true);
      pub.pub('oansExitCoordinates', exitLocation, true);

      pub.pub('ndBtvMessage', `BTV ${this.landingRunwayNavdata.ident.substring(4) ?? ''}/MANUAL`, true);
    }
  }

  private async setExitFromOans(exitName: string, exitPositionOansReference: Coordinates) {
    if (!this.landingRunwayNavdata || !this.arpCoordinates) {
      return;
    }

    // Convert exit position from OANS reference to nav db reference
    OansMapProjection.globalToAirportCoordinates(
      this.arpCoordinates,
      exitPositionOansReference,
      this.btvExitPositionNavDbReference,
    );

    const tPos = this.btvThresholdPositionNavDbReference;
    if (tPos && exitPositionOansReference) {
      const exitDistance =
        MathUtils.pointDistance(
          tPos[0],
          tPos[1],
          this.btvExitPositionNavDbReference[0],
          this.btvExitPositionNavDbReference[1],
        ) - BTV_MIN_TOUCHDOWN_ZONE_DISTANCE;
      this.requestedStoppingDistArinc.setValue(exitDistance);
      this.requestedStoppingDistArinc.setSsm(Arinc429SignStatusMatrix.NormalOperation);
    }

    this.bus
      .getPublisher<FmsOansData>()
      .pub('ndBtvMessage', `BTV ${this.landingRunwayNavdata.ident.substring(4) ?? ''}/${exitName}`, true);
  }

  private async detectLandingRunway() {
    // Arming phase between 500ft and 300ft RA
    if (
      this.radioAltitude.get() < 300 ||
      this.radioAltitude.get() > 500 ||
      (this.ppos.lat === 0 && this.ppos.long === 0)
    ) {
      this.nearbyAirportMonitor.setLocation(undefined, undefined); // Invalidate location to prevent unnecessary searching
      this.btvApprDifferentRunwaySimvar.set(false);
      return;
    }

    const trueHeading = !this.trueHeading1.get().isInvalid()
      ? this.trueHeading1.get().value
      : !this.trueHeading2.get().isInvalid()
        ? this.trueHeading2.get().value
        : !this.trueHeading3.get().isInvalid()
          ? this.trueHeading3.get().value
          : 0;

    const landingRunway = await RopsRunwayPrediction.detectLandingRunway(
      this.nearbyAirportMonitor,
      this.radioAltitude.get(),
      trueHeading,
      this.ppos,
    );

    // Set as ROPS/BTV runway
    if (landingRunway) {
      // If BTV runway already set, prioritize until 350ft RA
      if (
        !this.runwayIsSet() ||
        (this.runwayIsSet() && this.radioAltitude.get() < 350 && this.oansRunwayIdent.get() !== landingRunway.runway)
      ) {
        await this.setBtvRunwayFromNavdata(landingRunway.runway);
        this.btvApprDifferentRunwaySimvar.set(true);
        this.bus.getPublisher<FmsOansData>().pub('ropsDetectedAirport', landingRunway.airport, true);
        this.bus.getPublisher<FmsOansData>().pub('ropsDetectedRunway', landingRunway.runway, true);
        this.bus.getPublisher<FmsOansData>().pub('ndBtvMessage', `RWY${landingRunway.runway.substring(4) ?? ''}`, true);
      }
    }
  }

  private clearBtvData() {
    this.remainingDistToExitArinc.setValueSsm(0, Arinc429SignStatusMatrix.NoComputedData);
    this.remaininingDistToRwyEndArinc.setValueSsm(0, Arinc429SignStatusMatrix.NoComputedData);
    this.bus.getPublisher<OansControlEvents>().pub('oans_remove_btv_data', true, true);
    this.bus.getPublisher<FmsOansData>().pub('ropsDetectedAirport', null, true);
    this.bus.getPublisher<FmsOansData>().pub('ropsDetectedRunway', null, true);
    this.bus.getPublisher<FmsOansData>().pub('oansSelectedLandingRunway', null, true);
    this.btvApprDifferentRunwaySimvar.set(false);
  }

  private updateRemainingDistances() {
    // Only update below 600ft AGL, and in landing FMGC phase
    // Also, V/S should be below +400ft/min, to avoid ROW during G/A
    if (
      this.radioAltitude.get() > 600 ||
      this.fwsFlightPhase.get() < 9 ||
      this.fwsFlightPhase.get() > 11 ||
      this.verticalSpeed1.get().valueOr(0) > 400 ||
      this.verticalSpeed2.get().valueOr(0) > 400 ||
      this.verticalSpeed3.get().valueOr(0) > 400 ||
      !this.arpCoordinates ||
      (this.ppos.lat === 0 && this.ppos.long === 0)
    ) {
      this.remainingDistToExitArinc.setValueSsm(0, Arinc429SignStatusMatrix.NoComputedData);
      this.remaininingDistToRwyEndArinc.setValueSsm(0, Arinc429SignStatusMatrix.NoComputedData);
      return;
    }

    OansMapProjection.globalToAirportCoordinates(this.arpCoordinates, this.ppos, this.localPpos);

    if (this.btvThresholdPositionNavDbReference && this.btvThresholdPositionNavDbReference.length > 0) {
      if (
        this.btvOppositeThresholdPositionNavDbReference &&
        this.btvOppositeThresholdPositionNavDbReference.length > 0
      ) {
        const rwyEndDistanceFromTdz =
          MathUtils.pointDistance(
            this.btvThresholdPositionNavDbReference[0],
            this.btvThresholdPositionNavDbReference[1],
            this.btvOppositeThresholdPositionNavDbReference[0],
            this.btvOppositeThresholdPositionNavDbReference[1],
          ) - BTV_MIN_TOUCHDOWN_ZONE_DISTANCE;

        const rwyEndDistance = MathUtils.pointDistance(
          this.localPpos[0],
          this.localPpos[1],
          this.btvOppositeThresholdPositionNavDbReference[0],
          this.btvOppositeThresholdPositionNavDbReference[1],
        );

        this.remaininingDistToRwyEndArinc.setValueSsm(
          MathUtils.round(Math.min(rwyEndDistanceFromTdz, rwyEndDistance), 0.1),
          Arinc429SignStatusMatrix.NormalOperation,
        );
      }

      const exitPos = this.btvExitPositionNavDbReference;

      if (exitPos && exitPos.length > 0) {
        const exitDistanceFromTdz =
          MathUtils.pointDistance(
            this.btvThresholdPositionNavDbReference[0],
            this.btvThresholdPositionNavDbReference[1],
            exitPos[0],
            exitPos[1],
          ) - BTV_MIN_TOUCHDOWN_ZONE_DISTANCE;

        const exitDistance = MathUtils.pointDistance(this.localPpos[0], this.localPpos[1], exitPos[0], exitPos[1]);

        this.remainingDistToExitArinc.setValueSsm(
          MathUtils.round(Math.min(exitDistanceFromTdz, exitDistance), 0.1),
          Arinc429SignStatusMatrix.NormalOperation,
        );
      }
    }
  }

  public onUpdate(): void {
    const deltaTime = this.updateThrottler.canUpdate(this.instrument.deltaTime);
    if (deltaTime <= 0) {
      return;
    }

    this.detectLandingRunway();
    this.updateRemainingDistances();

    // If BTV disarmed when on ground, clear BTV selection
    const btvActiveOnGround = this.autoBrakeActive.get() && this.onGround.get() && this.autoBrakeMode.get() === 1;
    if (this.btvActiveOnGroundLastValue && !btvActiveOnGround) {
      this.clearBtvData();
    }
    this.btvActiveOnGroundLastValue = btvActiveOnGround;
  }
}
