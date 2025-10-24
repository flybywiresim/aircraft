// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, EventBus, Instrument, MappedSubject, Subject } from '@microsoft/msfs-sdk';
import {
  Arinc429LocalVarConsumerSubject,
  Arinc429Register,
  Arinc429SignStatusMatrix,
  BTV_MIN_TOUCHDOWN_ZONE_DISTANCE,
  BtvData,
  FmsOansData,
  IrBusEvents,
  LgciuBusEvents,
  MathUtils,
  NearbyFacilityMonitor,
  NearbyFacilityType,
  OansMapProjection,
  RaBusEvents,
  RopsRunwayPrediction,
  UpdateThrottler,
} from '@flybywiresim/fbw-sdk';
import { OansControlEvents } from '@flybywiresim/oanc';
import { Coordinates, placeBearingDistance } from 'msfs-geo';
import { Position } from '@turf/turf';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { NavigationDatabase, NavigationDatabaseBackend } from '@fmgc/NavigationDatabase';

/**
 * Utility class for brake to vacate (BTV) functions on the A380
 */

export class BrakeToVacateDistanceUpdater implements Instrument {
  private readonly sub = this.bus.getSubscriber<BtvData & FmsOansData & IrBusEvents & LgciuBusEvents & RaBusEvents>();

  private readonly updateThrottler = new UpdateThrottler(200);

  private readonly airportLocalPos = ConsumerSubject.create(this.sub.on('oansAirportLocalCoordinates'), []);
  private readonly oansRunwayIdent = ConsumerSubject.create(this.sub.on('oansSelectedLandingRunway'), null);

  private readonly remainingDistToExitArinc = Arinc429Register.empty();

  private readonly remaininingDistToRwyEndArinc = Arinc429Register.empty();

  private readonly requestedStoppingDistArinc = Arinc429Register.empty();

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

    this.remainingDistToExit.sub((v) => {
      this.remainingDistToExitArinc.setValue(v < 0 ? 0 : v);
      this.remainingDistToExitArinc.setSsm(
        v < 0 ? Arinc429SignStatusMatrix.NoComputedData : Arinc429SignStatusMatrix.NormalOperation,
      );
      this.remainingDistToExitArinc.writeToSimVar('L:A32NX_OANS_BTV_REMAINING_DIST_TO_EXIT');
    });

    this.remaininingDistToRwyEnd.sub((v) => {
      console.log(`BTV Remaining Distance to RWY End: ${v}`);
      this.remaininingDistToRwyEndArinc.setValue(v < 0 ? 0 : v);
      this.remaininingDistToRwyEndArinc.setSsm(
        v < 0 ? Arinc429SignStatusMatrix.NoComputedData : Arinc429SignStatusMatrix.NormalOperation,
      );
      this.remaininingDistToRwyEndArinc.writeToSimVar('L:A32NX_OANS_BTV_REMAINING_DIST_TO_RWY_END');
    });

    this.thresholdPositions.sub((tPos) => {
      if (tPos.length > 0 && this.remaininingDistToRwyEnd.get() === -1) {
        const lda = MathUtils.pointDistance(tPos[0][0], tPos[0][1], tPos[1][0], tPos[1][1]);
        this.remaininingDistToRwyEnd.set(lda - BTV_MIN_TOUCHDOWN_ZONE_DISTANCE);
        this.remainingDistToExit.set(lda - BTV_MIN_TOUCHDOWN_ZONE_DISTANCE);
      }
    }, true);

    this.exitPosition.sub((ePos) => {
      const tPos = this.thresholdPositions.get()[0];
      if (tPos && ePos) {
        const exitDistance =
          MathUtils.pointDistance(tPos[0], tPos[1], ePos[0], ePos[1]) - BTV_MIN_TOUCHDOWN_ZONE_DISTANCE;
        this.requestedStoppingDistArinc.setValue(exitDistance);
        this.requestedStoppingDistArinc.setSsm(Arinc429SignStatusMatrix.NormalOperation);
        this.requestedStoppingDistArinc.writeToSimVar('L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE');
      }
    }, true);
  }

  init() {
    this.clearSelection();
  }

  /** Updated during deceleration on the ground. Counted from touchdown distance (min. 400m).  */
  private readonly remainingDistToExit = Subject.create<number>(-1);

  /** Updated during deceleration on the ground. Counted from touchdown distance (min. 400m).  */
  private readonly remaininingDistToRwyEnd = Subject.create<number>(-1);

  private readonly thresholdPositions = ConsumerSubject.create(this.sub.on('oansThresholdPositions'), []);

  private readonly exitPosition = ConsumerSubject.create(this.sub.on('oansExitPosition'), []);

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

  private readonly fwsFlightPhase = ConsumerSubject.create(this.sub.on('fwcFlightPhase'), 0);

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

  private readonly autoBrakeMode = ConsumerSubject.create(this.sub.on('autoBrakeMode'), 0);
  private readonly autoBrakeActive = ConsumerSubject.create(this.sub.on('autoBrakeActive'), false);
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

  private readonly trueHeading1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_true_heading_1'));
  private readonly trueHeading2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_true_heading_2'));
  private readonly trueHeading3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('ir_true_heading_3'));

  private nearbyAirportMonitor: NearbyFacilityMonitor;

  private runwayIsSet() {
    const thresPos = this.thresholdPositions.get();
    return thresPos.length >= 2 && thresPos[0].length > 0 && thresPos[1].length > 0;
  }

  private async setBtvRunwayFromNavdata(airportIdent: string, rwyIdent: string) {
    if (airportIdent && rwyIdent) {
      const db = NavigationDatabaseService.activeDatabase.backendDatabase;

      const arps = await db.getAirports([airportIdent]);
      const arpCoordinates = arps[0].location;

      const runways = await db.getRunways(airportIdent);
      const landingRunwayNavdata = runways.filter((rw) => rw.ident === rwyIdent)[0];
      const oppositeThreshold = placeBearingDistance(
        landingRunwayNavdata.thresholdLocation,
        landingRunwayNavdata.bearing,
        landingRunwayNavdata.length / MathUtils.METRES_TO_NAUTICAL_MILES,
      );
      const localThr: Position = [0, 0];
      const localOppThr: Position = [0, 0];
      OansMapProjection.globalToAirportCoordinates(arpCoordinates, landingRunwayNavdata.thresholdLocation, localThr);
      OansMapProjection.globalToAirportCoordinates(arpCoordinates, oppositeThreshold, localOppThr);

      this.bus.getPublisher<FmsOansData>().pub('oansThresholdPositions', [localThr, localOppThr]);
    }
  }

  private async detectLandingRunway() {
    // Arming phase between 500ft and 300ft RA
    if (this.radioAltitude.get() < 300 || this.radioAltitude.get() > 500) {
      this.nearbyAirportMonitor.setLocation(undefined, undefined); // Invalidate location to prevent unnecessary searching
      return;
    }

    // Retrieve ppos
    const lon1 = this.longitude1.get();
    const lat1 = this.latitude1.get();
    const lon2 = this.longitude2.get();
    const lat2 = this.latitude2.get();
    const lon3 = this.longitude3.get();
    const lat3 = this.latitude3.get();

    let ppos: Coordinates | null = null;
    if (!lat1.isInvalid() && !lon1.isInvalid()) {
      ppos = { lat: lat1.value, long: lon1.value } as Coordinates;
    } else if (!lat2.isInvalid() && !lon2.isInvalid()) {
      ppos = { lat: lat2.value, long: lon2.value } as Coordinates;
    } else if (!lat3.isInvalid() && !lon3.isInvalid()) {
      ppos = { lat: lat3.value, long: lon3.value } as Coordinates;
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
      ppos,
    );

    // Set as ROPS/BTV runway
    if (landingRunway) {
      console.log(
        `Detected landing runway: ${landingRunway.airport} ${landingRunway.runway}, OANS runway: ${this.oansRunwayIdent.get()}`,
      );
      // If BTV runway already set, prioritize until 350ft RA
      if (
        !this.runwayIsSet() ||
        (this.runwayIsSet() && this.radioAltitude.get() < 350 && this.oansRunwayIdent.get() !== landingRunway.runway)
      ) {
        this.setBtvRunwayFromNavdata(landingRunway.airport, landingRunway.runway);
        this.bus.getPublisher<FmsOansData>().pub('ropsDetectedAirport', landingRunway.airport, true);
        this.bus.getPublisher<FmsOansData>().pub('ropsDetectedRunway', landingRunway.runway, true);
        this.bus.getPublisher<FmsOansData>().pub('ndBtvMessage', `RWY${landingRunway.runway.substring(4) ?? ''}`, true);
        console.log('Runway set');
      }
    }
  }

  private clearSelection() {
    this.remainingDistToExit.set(-1);
    this.remaininingDistToRwyEnd.set(-1);
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
      this.verticalSpeed3.get().valueOr(0) > 400
    ) {
      this.remaininingDistToRwyEnd.set(-1);
      this.remainingDistToExit.set(-1);
      return;
    }

    const thresholdPos = this.thresholdPositions.get()[0];
    const oppositeThresholdPos = this.thresholdPositions.get()[1];
    const airportLocalPos = this.airportLocalPos.get();

    console.log(`BTV Threshold Pos: ${thresholdPos}`);
    console.log(`BTV Opposite Threshold Pos: ${oppositeThresholdPos}`);
    console.log(`BTV Airport Local Pos: ${airportLocalPos}`);

    if (thresholdPos && thresholdPos.length > 0) {
      if (oppositeThresholdPos && oppositeThresholdPos.length > 0) {
        const rwyEndDistanceFromTdz =
          MathUtils.pointDistance(thresholdPos[0], thresholdPos[1], oppositeThresholdPos[0], oppositeThresholdPos[1]) -
          BTV_MIN_TOUCHDOWN_ZONE_DISTANCE;

        const rwyEndDistance = MathUtils.pointDistance(
          airportLocalPos[0],
          airportLocalPos[1],
          oppositeThresholdPos[0],
          oppositeThresholdPos[1],
        );

        this.remaininingDistToRwyEnd.set(MathUtils.round(Math.min(rwyEndDistanceFromTdz, rwyEndDistance), 0.1));
      }

      const exitPos = this.exitPosition.get();

      if (exitPos && exitPos.length > 0) {
        const exitDistanceFromTdz =
          MathUtils.pointDistance(thresholdPos[0], thresholdPos[1], exitPos[0], exitPos[1]) -
          BTV_MIN_TOUCHDOWN_ZONE_DISTANCE;

        const exitDistance = MathUtils.pointDistance(airportLocalPos[0], airportLocalPos[1], exitPos[0], exitPos[1]);

        this.remainingDistToExit.set(MathUtils.round(Math.min(exitDistanceFromTdz, exitDistance), 0.1));
        console.log(`BTV distance to exit: ${MathUtils.round(Math.min(exitDistanceFromTdz, exitDistance), 0.1)}`);
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
      this.clearSelection();
      this.bus.getPublisher<OansControlEvents>().pub('oans_remove_btv_data', true, true);
    }
    this.btvActiveOnGroundLastValue = btvActiveOnGround;
  }
}
