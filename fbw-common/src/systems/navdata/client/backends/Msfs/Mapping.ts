// Copyright (c) 2021, 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

// This rule just informs about a possible optimization
/* eslint-disable no-await-in-loop */
import { Coordinates, bearingTo, distanceTo, placeBearingDistance } from 'msfs-geo';
// FIXME remove msfs-sdk dep
import { AirportClassMask } from '@microsoft/msfs-sdk';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import {
  AirportCommunication,
  Airway,
  AirwayDirection,
  AirwayLevel,
  AltitudeDescriptor,
  ApproachType,
  ApproachWaypointDescriptor,
  CommunicationType,
  FigureOfMerit,
  FrequencyUnits,
  IlsNavaid,
  LegType,
  LevelOfService,
  LsCategory,
  NdbClass,
  NdbNavaid,
  ProcedureLeg,
  ProcedureTransition,
  SpeedDescriptor,
  TerminalWaypoint,
  TurnDirection,
  VhfNavaid,
  VhfNavaidType,
  VorClass,
  Waypoint,
  WaypointArea,
  WaypointDescriptor,
} from '../../../shared';
import { Airport } from '../../../shared/types/Airport';
import { Approach } from '../../../shared/types/Approach';
import { Arrival } from '../../../shared/types/Arrival';
import { Departure } from '../../../shared/types/Departure';
import { Runway, RunwaySurfaceType } from '../../../shared/types/Runway';
import {
  AltitudeDescriptor as MSAltitudeDescriptor,
  ApproachType as MSApproachType,
  FixTypeFlags,
  FrequencyType,
  IcaoSearchFilter,
  JS_Approach,
  JS_ApproachTransition,
  JS_EnRouteTransition,
  JS_Facility,
  JS_FacilityAirport,
  JS_FacilityIntersection,
  JS_FacilityNDB,
  JS_FacilityVOR,
  JS_ILSFrequency,
  JS_Leg,
  JS_Procedure,
  JS_Runway,
  JS_RunwayTransition,
  LegType as MsLegType,
  NdbType,
  RnavTypeFlags,
  RouteType,
  RunwayDesignatorChar,
  RunwaySurface,
  TurnDirection as MSTurnDirection,
  VorClass as MSVorClass,
  VorType,
  LandingSystemCategory,
  SpeedRestrictionDescriptor,
  JS_ICAO,
} from './FsTypes';
import { FacilityCache, LoadType } from './FacilityCache';
import { Gate } from '../../../shared/types/Gate';
import {
  AirportSubsectionCode,
  EnrouteSubsectionCode,
  NavaidSubsectionCode,
  SectionCode,
} from '../../../shared/types/SectionCode';

type FacilityType<T> = T extends JS_FacilityIntersection
  ? Waypoint
  : T extends JS_FacilityNDB
    ? NdbNavaid
    : T extends JS_FacilityVOR
      ? VhfNavaid
      : T extends JS_FacilityAirport
        ? Airport
        : never;

export class MsfsMapping {
  private static readonly letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  private static readonly ILS_CAT_REGEX = /CAT\W?(1|2|3|I{1,3})/;

  // eslint-disable-next-line no-useless-constructor
  constructor(
    private cache: FacilityCache,
    // eslint-disable-next-line no-empty-function
  ) {}

  private mapRunwaySurface(surface?: RunwaySurface): RunwaySurfaceType {
    // TODO
    switch (surface) {
      default:
        return RunwaySurfaceType.Hard;
    }
  }

  mapRunwaySurfaceMsfsAirportClassBitmask(surface: number): AirportClassMask {
    let result: AirportClassMask = AirportClassMask.None;

    if (surface & RunwaySurfaceType.Hard) {
      result |= AirportClassMask.HardSurface;
    }
    if (surface & RunwaySurfaceType.Soft) {
      result |= AirportClassMask.SoftSurface;
    }
    if (surface & RunwaySurfaceType.Water) {
      result |= AirportClassMask.AllWater;
    }

    return result;
  }

  public mapAirport(msAirport: JS_FacilityAirport): Airport {
    const elevations: number[] = [];
    let longestRunway: [number, JS_Runway | undefined] = [0, undefined];
    msAirport.runways.forEach((runway) => {
      if (runway.length > longestRunway[0]) {
        longestRunway = [runway.length, runway];
      }
      elevations.push(runway.elevation / 0.3048);
    });

    // MSFS doesn't give the airport elevation... so we take the mean of the runway elevations
    const elevation = elevations.reduce((a, b) => a + b, 0) / elevations.length;

    const transitionAltitude =
      msAirport.transitionAlt !== undefined && msAirport.transitionAlt > 0
        ? Math.round(msAirport.transitionAlt / 0.3048)
        : undefined;

    const transitionLevel =
      msAirport.transitionLevel !== undefined && msAirport.transitionLevel > 0
        ? Math.round(msAirport.transitionLevel / 30.48)
        : undefined;

    const ident = this.mapAirportIdent(msAirport);

    return {
      databaseId: msAirport.icao,
      sectionCode: SectionCode.Airport,
      subSectionCode: AirportSubsectionCode.ReferencePoints,
      area: WaypointArea.Terminal,
      ident,
      airportIdent: ident, // needed for terminal fix
      icaoCode: msAirport.icao.substring(1, 3), // TODO
      name: Utils.Translate(msAirport.name),
      location: { lat: msAirport.lat, long: msAirport.lon, alt: elevation },
      longestRunwayLength: longestRunway[0],
      longestRunwaySurfaceType: this.mapRunwaySurface(longestRunway[1]?.surface),
      transitionAltitude,
      transitionLevel,
    };
  }

  public async mapAirportRunways(msAirport: JS_FacilityAirport): Promise<Runway[]> {
    const runways: Runway[] = [];

    const icaoCode = this.getIcaoCodeFromAirport(msAirport);

    const navaidIcaos = msAirport.approaches
      .map((appr) => appr.finalLegs[appr.finalLegs.length - 1].originIcao)
      .filter((icao) => icao.charAt(0) === 'V');
    const navaids = await this.cache.getFacilities(Array.from(new Set(navaidIcaos)), LoadType.Vor);

    const magVar = msAirport.magvar ?? Facilities.getMagVar(msAirport.lat, msAirport.lon);

    msAirport.runways.forEach((msRunway) => {
      const gradient =
        (Math.asin(
          (msRunway.primaryElevation - msRunway.secondaryElevation) /
            (msRunway.length - msRunway.primaryThresholdLength - msRunway.secondaryThresholdLength),
        ) *
          180) /
        Math.PI;

      msRunway.designation.split('-').forEach((designation, index) => {
        const primary = index === 0;

        const airportIdent = FacilityCache.ident(msAirport.icao);
        const runwayNumber = parseInt(designation);
        const runwayDesignator = primary ? msRunway.designatorCharPrimary : msRunway.designatorCharSecondary;
        const ident = `${airportIdent}${designation.padStart(2, '0')}${this.mapRunwayDesignator(runwayDesignator)}`;
        const databaseId = `R${icaoCode}${ident}`;
        const bearing = primary ? msRunway.direction : (msRunway.direction + 180) % 360;
        const startDistance = msRunway.length / 2;
        const thresholdDistance = primary ? msRunway.primaryThresholdLength : msRunway.secondaryThresholdLength;
        const startLocation = placeBearingDistance(
          { lat: msRunway.latitude, long: msRunway.longitude },
          this.oppositeBearing(bearing),
          startDistance / 1852,
        );
        const thresholdLocation = {
          ...(thresholdDistance > 0
            ? placeBearingDistance(startLocation, bearing, thresholdDistance / 1852)
            : startLocation),
          alt: (primary ? msRunway.primaryElevation : msRunway.secondaryElevation) / 0.3048,
        };
        // TODO we could get this from approach data...
        const thresholdCrossingHeight =
          50 + (primary ? msRunway.primaryElevation : msRunway.secondaryElevation) / 0.3048;
        const lsAppr = msAirport.approaches.find(
          (appr) =>
            appr.runwayNumber === runwayNumber &&
            appr.runwayDesignator === runwayDesignator &&
            this.approachHasLandingSystem(appr),
        );
        const lsIdent = lsAppr ? FacilityCache.ident(lsAppr.finalLegs[lsAppr.finalLegs.length - 1].originIcao) : '';
        // FIXME need to return an IlsNavaid for ILS
        const lsFrequencyChannel = lsAppr
          ? navaids.get(lsAppr.finalLegs[lsAppr.finalLegs.length - 1].originIcao)?.freqMHz
          : undefined;

        runways.push({
          sectionCode: SectionCode.Airport,
          subSectionCode: AirportSubsectionCode.Runways,
          databaseId,
          icaoCode,
          ident,
          location: thresholdLocation,
          area: WaypointArea.Terminal,
          airportIdent,
          bearing,
          magneticBearing: this.trueToMagnetic(bearing, magVar),
          gradient: primary ? gradient : -gradient,
          startLocation,
          thresholdLocation,
          thresholdCrossingHeight,
          length: msRunway.length,
          width: msRunway.width,
          lsFrequencyChannel,
          lsIdent,
          surfaceType: this.mapRunwaySurface(msRunway.surface),
        });
      });
    });

    return runways;
  }

  // TODO unify with the version that gets navaids
  private mapAirportRunwaysPartial(msAirport: JS_FacilityAirport): Runway[] {
    const runways: Runway[] = [];

    const icaoCode = this.getIcaoCodeFromAirport(msAirport);

    const magVar = msAirport.magvar ?? Facilities.getMagVar(msAirport.lat, msAirport.lon);

    msAirport.runways.forEach((msRunway) => {
      const gradient =
        (Math.asin(
          (msRunway.primaryElevation - msRunway.secondaryElevation) /
            (msRunway.length - msRunway.primaryThresholdLength - msRunway.secondaryThresholdLength),
        ) *
          180) /
        Math.PI;

      msRunway.designation.split('-').forEach((designation, index) => {
        const primary = index === 0;

        const airportIdent = FacilityCache.ident(msAirport.icao);
        const runwayNumber = parseInt(designation);
        const runwayDesignator = primary ? msRunway.designatorCharPrimary : msRunway.designatorCharSecondary;
        const ident = `${airportIdent}${designation.padStart(2, '0')}${this.mapRunwayDesignator(runwayDesignator)}`;
        const databaseId = `R${icaoCode}${ident}`;
        const bearing = primary ? msRunway.direction : (msRunway.direction + 180) % 360;
        const startDistance = msRunway.length / 2;
        const thresholdDistance = primary ? msRunway.primaryThresholdLength : msRunway.secondaryThresholdLength;
        const startLocation = placeBearingDistance(
          { lat: msRunway.latitude, long: msRunway.longitude },
          this.oppositeBearing(bearing),
          startDistance / 1852,
        );
        const thresholdLocation = {
          ...(thresholdDistance > 0
            ? placeBearingDistance(startLocation, bearing, thresholdDistance / 1852)
            : startLocation),
          alt: (primary ? msRunway.primaryElevation : msRunway.secondaryElevation) / 0.3048,
        };
        // TODO we could get this from approach data...
        const thresholdCrossingHeight =
          50 + (primary ? msRunway.primaryElevation : msRunway.secondaryElevation) / 0.3048;
        const lsAppr = msAirport.approaches.find(
          (appr) =>
            appr.runwayNumber === runwayNumber &&
            appr.runwayDesignator === runwayDesignator &&
            appr.approachType === MSApproachType.Ils,
        );
        const lsIdent = lsAppr ? FacilityCache.ident(lsAppr.finalLegs[lsAppr.finalLegs.length - 1].originIcao) : '';

        runways.push({
          sectionCode: SectionCode.Airport,
          subSectionCode: AirportSubsectionCode.Runways,
          databaseId,
          icaoCode,
          ident,
          location: thresholdLocation,
          area: WaypointArea.Terminal,
          airportIdent,
          bearing,
          magneticBearing: this.trueToMagnetic(bearing, magVar),
          gradient: primary ? gradient : -gradient,
          startLocation,
          thresholdLocation,
          thresholdCrossingHeight,
          length: msRunway.length,
          width: msRunway.width,
          lsIdent,
          surfaceType: this.mapRunwaySurface(msRunway.surface),
        });
      });
    });

    return runways;
  }

  public async mapAirportWaypoints(msAirport: JS_FacilityAirport): Promise<Waypoint[]> {
    const icaoSet: Set<string> = new Set();

    const legs: JS_Leg[] = [];

    for (const procedures of [msAirport.arrivals, msAirport.approaches, msAirport.departures]) {
      for (const proc of procedures) {
        // eslint-disable-next-line no-underscore-dangle
        if (proc.__Type === 'JS_Approach') {
          legs.push(...proc.finalLegs);
          legs.push(...proc.missedLegs);
          proc.transitions.forEach((trans) => legs.push(...trans.legs));
        } else {
          legs.push(...proc.commonLegs);
          proc.enRouteTransitions.forEach((trans) => legs.push(...trans.legs));
          proc.runwayTransitions.forEach((trans) => legs.push(...trans.legs));
        }
      }
    }

    for (const leg of legs) {
      if (FacilityCache.validFacilityIcao(leg.fixIcao, 'W')) {
        icaoSet.add(leg.fixIcao);
      }
      if (FacilityCache.validFacilityIcao(leg.originIcao, 'W')) {
        icaoSet.add(leg.originIcao);
      }
      if (FacilityCache.validFacilityIcao(leg.arcCenterFixIcao, 'W')) {
        icaoSet.add(leg.arcCenterFixIcao);
      }
    }

    const icaos = Array.from(icaoSet);

    const wps = await this.cache.getFacilities(icaos, LoadType.Intersection);

    return Array.from(wps.values())
      .filter((wp) => !!wp)
      .map((wp) => this.mapFacilityToWaypoint(wp));
  }

  public async mapAirportIls(msAirport: JS_FacilityAirport, ident?: string, lsIcaoCode?: string): Promise<IlsNavaid[]> {
    const vorApproachParings = new Map<string, JS_Approach>();

    for (const appr of msAirport.approaches.filter(this.approachHasLandingSystem)) {
      const lastLeg = appr.finalLegs[appr.finalLegs.length - 1];

      const matchesIdent = !ident || FacilityCache.ident(lastLeg.originIcao) === ident;
      const matchesIcao = !lsIcaoCode || lastLeg.originIcao === lsIcaoCode;

      if (FacilityCache.validFacilityIcao(lastLeg.originIcao, 'V') && matchesIdent && matchesIcao) {
        // Only consider non-ILS approach if we've not got an ILS yet
        if (appr.approachType !== MSApproachType.Ils && vorApproachParings.has(lastLeg.originIcao)) {
          continue;
        }

        vorApproachParings.set(lastLeg.originIcao, appr);
      }
    }

    const icaos = Array.from(vorApproachParings.keys());
    const ils = await this.cache.getFacilities(icaos, LoadType.Vor);

    return Promise.all(
      Array.from(ils.values())
        .filter((ils) => !!ils)
        .map((ils) => this.mapLandingSystem(ils, msAirport, vorApproachParings.get(ils.icao))),
    );
  }

  public async mapVorIls(msAirport: JS_FacilityAirport, msVor: JS_FacilityVOR): Promise<IlsNavaid> {
    const approaches = this.findApproachesWithLandingSystem(msAirport, msVor.icao);
    const approach = this.selectApproach(approaches);

    return this.mapLandingSystem(msVor, msAirport, approach);
  }

  private selectApproach(approaches: JS_Approach[]): JS_Approach | undefined {
    if (approaches.length > 1) {
      const ilsApproach = approaches.find((appr) => appr.approachType === MSApproachType.Ils);
      if (ilsApproach) {
        return ilsApproach;
      }
    }

    return approaches[0];
  }

  private findApproachesWithLandingSystem(msAirport: JS_FacilityAirport, lsIcaoCode: string): JS_Approach[] {
    return msAirport.approaches
      .filter(this.approachHasLandingSystem)
      .map((appr) => [appr, appr.finalLegs[appr.finalLegs.length - 1]] as const)
      .filter(
        ([_, lastLeg]) => FacilityCache.validFacilityIcao(lastLeg.originIcao, 'V') && lastLeg.originIcao === lsIcaoCode,
      )
      .map(([appr, _]) => appr);
  }

  private mapIlsCatString(cat: string): LsCategory {
    switch (cat) {
      case '1':
      case 'I':
        return LsCategory.Category1;
      case '2':
      case 'II':
        return LsCategory.Category2;
      case '3':
      case 'III':
        return LsCategory.Category3;
    }
    return LsCategory.None;
  }

  private async mapLandingSystem(
    ls: JS_FacilityVOR,
    airport: JS_FacilityAirport,
    approach: JS_Approach | undefined,
  ): Promise<IlsNavaid> {
    // ILS icaos always have a blank region code, so we have to get that from the airport
    const icaoCode = this.getIcaoCodeFromAirport(airport);

    let locBearing = -1;
    let gsSlope: IlsNavaid['gsSlope'] = undefined;
    let gsLocation: IlsNavaid['gsLocation'] = undefined;
    let category = LsCategory.None;
    let trueReferenced: IlsNavaid['trueReferenced'] = undefined;

    // TODO don't need all these hax in FS2024, as we have ls.ils

    if (ls.ils) {
      // >= MSFS2024
      locBearing = ls.ils.localizerCourse;
      gsLocation = {
        lat: ls.ils?.glideslopeLat!,
        long: ls.ils?.glideslopeLon!,
        alt: ls.ils?.glideslopeAlt,
      };
      gsSlope = ls.ils.hasGlideslope ? -ls.ils.glideslopeAngle : undefined;
      category = this.mapLsCategory(ls.ils.lsCategory);
      trueReferenced = ls.trueReferenced;
    } else {
      // MSFS2020, we need some hax
      let jsFrequency: JS_ILSFrequency | null = null;
      for (const r of airport.runways) {
        if (r.primaryILSFrequency.icao === ls.icao) {
          jsFrequency = r.primaryILSFrequency;
        } else if (r.secondaryILSFrequency.icao === ls.icao) {
          jsFrequency = r.secondaryILSFrequency;
        }
      }

      if (jsFrequency !== null) {
        const nameMatch = jsFrequency.name.match(MsfsMapping.ILS_CAT_REGEX);
        if (nameMatch !== null) {
          category = this.mapIlsCatString(nameMatch[1]);
        }
        locBearing = jsFrequency.localizerCourse;
        gsSlope = jsFrequency.hasGlideslope ? jsFrequency.glideslopeAngle : undefined;
      } else if (approach) {
        gsSlope = this.approachHasGlideslope(approach)
          ? approach.finalLegs[approach.finalLegs.length - 1].verticalAngle - 360
          : undefined;

        const [bearing, bearingIsTrue] = await this.getFinalApproachCourse(airport, approach);
        if (bearing !== undefined) {
          locBearing = bearingIsTrue ? this.trueToMagnetic(bearing, -ls.magneticVariation) : bearing;
        }

        if (ls.name.length > 0) {
          const nameMatch = ls.name.match(MsfsMapping.ILS_CAT_REGEX);
          if (nameMatch !== null) {
            category = this.mapIlsCatString(nameMatch[1]);
          }
        }
      }
    }

    return {
      sectionCode: SectionCode.Airport,
      subSectionCode: AirportSubsectionCode.LocalizerGlideSlope,
      databaseId: ls.icao,
      icaoCode,
      ident: FacilityCache.ident(ls.icao),
      frequency: ls.freqMHz,
      category,
      locLocation: { lat: ls.lat, long: ls.lon },
      locBearing,
      stationDeclination: MathUtils.normalise180(360 - ls.magneticVariation),
      gsSlope,
      gsLocation,
      trueReferenced,
    };
  }

  private mapLsCategory(lsCategory?: LandingSystemCategory): LsCategory {
    switch (lsCategory) {
      case LandingSystemCategory.Cat1:
        return LsCategory.Category1;
      case LandingSystemCategory.Cat2:
        return LsCategory.Category2;
      case LandingSystemCategory.Cat3:
        return LsCategory.Category3;
      case LandingSystemCategory.Igs:
        return LsCategory.IgsOnly;
      case LandingSystemCategory.LdaNoGs:
        return LsCategory.LdaOnly;
      case LandingSystemCategory.LdaWithGs:
        return LsCategory.LdaGlideslope;
      case LandingSystemCategory.Localizer:
        return LsCategory.LocOnly;
      case LandingSystemCategory.SdfNoGs:
        return LsCategory.SdfOnly;
      case LandingSystemCategory.SdfWithGs:
        return LsCategory.SdfGlideslope;
      case LandingSystemCategory.None:
        return LsCategory.None;
    }
    return LsCategory.None;
  }

  private approachHasGlideslope(approach: JS_Approach): boolean {
    // TODO Check for LDA/SDF approaches whether they actually have a glideslope, how?
    return [MSApproachType.Ils, MSApproachType.Lda, MSApproachType.Sdf].includes(approach.approachType);
  }

  private approachHasLandingSystem(approach: JS_Approach): boolean {
    return [MSApproachType.Loc, MSApproachType.Ils, MSApproachType.Lda, MSApproachType.Sdf].includes(
      approach.approachType,
    );
  }

  private async getFinalApproachCourse(
    airport: JS_FacilityAirport,
    approach: JS_Approach,
  ): Promise<[bearing: number | undefined, isTrue: boolean]> {
    const lastLeg = approach.finalLegs[approach.finalLegs.length - 1];

    // Check this first. Localizer based procedures should have the approach course coded on all approach legs, even TF legs
    if (Math.abs(lastLeg.course) > Number.EPSILON) {
      return [lastLeg.course, lastLeg.trueDegrees];
    }
    if (lastLeg.type === MsLegType.TF) {
      const course = await this.computeFinalApproachCourse(airport, approach);
      if (course !== undefined) {
        return [course, true];
      }
    }

    return [undefined, false];
  }

  private async computeFinalApproachCourse(
    airport: JS_FacilityAirport,
    approach: JS_Approach,
  ): Promise<number | undefined> {
    const finalLeg = approach.finalLegs[approach.finalLegs.length - 1];
    const previousLeg = approach.finalLegs[approach.finalLegs.length - 2];

    if (!finalLeg || !previousLeg || !previousLeg.fixIcao.trim() || !finalLeg.fixIcao.trim()) {
      return undefined;
    }

    const facilities = await this.loadFacilitiesFromProcedures([approach]);

    let finalCoordinates: Coordinates | undefined = undefined;
    if (finalLeg.fixIcao.charAt(0) === 'R') {
      finalCoordinates = this.mapRunwayWaypoint(airport, finalLeg.fixIcao)?.location;
    } else {
      const finalWaypoint = facilities.get(finalLeg.fixIcao);
      finalCoordinates = finalWaypoint ? { lat: finalWaypoint.lat, long: finalWaypoint.lon } : undefined;
    }

    const previousWaypoint = facilities.get(previousLeg.fixIcao);

    if (!finalCoordinates || !previousWaypoint) {
      return undefined;
    }

    const finalLegCourse = bearingTo({ lat: previousWaypoint.lat, long: previousWaypoint.lon }, finalCoordinates);

    return finalLegCourse;
  }

  public async mapAirportCommunications(msAirport: JS_FacilityAirport): Promise<AirportCommunication[]> {
    const icaoCode = this.getIcaoCodeFromAirport(msAirport);

    const location = { lat: msAirport.lat, long: msAirport.lon };

    return msAirport.frequencies.map((freq) => ({
      communicationType: this.mapMsfsFrequencyToType(freq.type),
      frequency: freq.freqMHz,
      frequencyUnits: FrequencyUnits.VeryHigh,
      callsign: freq.name,
      location,
      icaoCode,
      airportIdentifier: FacilityCache.ident(msAirport.icao),
    }));
  }

  private mapMsfsFrequencyToType(type: FrequencyType): CommunicationType {
    switch (type) {
      case FrequencyType.ASOS:
        return CommunicationType.Asos;
      case FrequencyType.ATIS:
        return CommunicationType.Atis;
      case FrequencyType.AWOS:
        return CommunicationType.Awos;
      case FrequencyType.Approach:
        return CommunicationType.ApproachControl;
      case FrequencyType.CTAF:
        return CommunicationType.AirToAir;
      case FrequencyType.Center:
        return CommunicationType.AreaControlCenter;
      case FrequencyType.Clearance:
        return CommunicationType.ClearanceDelivery;
      case FrequencyType.ClearancePreTaxi:
        return CommunicationType.ClearancePreTaxi;
      case FrequencyType.Departure:
        return CommunicationType.DepartureControl;
      case FrequencyType.FSS:
        return CommunicationType.FlightServiceStation;
      case FrequencyType.Ground:
        return CommunicationType.GroundControl;
      case FrequencyType.Multicom:
        return CommunicationType.Multicom;
      case FrequencyType.RemoteDeliveryClearance:
        return CommunicationType.ClearanceDelivery;
      case FrequencyType.Tower:
        return CommunicationType.Tower;
      case FrequencyType.Unicom:
        return CommunicationType.Unicom;
      default:
        return CommunicationType.Unknown;
    }
  }

  public async mapApproaches(msAirport: JS_FacilityAirport): Promise<Approach[]> {
    const icaoCode = this.getIcaoCodeFromAirport(msAirport);
    const airportIdent = FacilityCache.ident(msAirport.icao);

    const facilities = await this.loadFacilitiesFromProcedures(msAirport.approaches);

    return (
      msAirport.approaches
        // Filter out circling approaches
        .filter((approach) => approach.runwayNumber !== 0)
        .map((approach) => {
          try {
            const approachName = this.mapApproachName(approach);
            const suffix = approach.approachSuffix.length > 0 ? approach.approachSuffix : undefined;

            // The AR flag is only available from MSFS2024, so fall back to a heuristic based on analysing the MSFS2020 data if not available.
            const authorisationRequired =
              approach.rnpAr !== undefined
                ? approach.rnpAr
                : approach.approachType === MSApproachType.Rnav && approach.rnavTypeFlags === 0;
            const rnp = authorisationRequired ? 0.3 : undefined;
            const missedApproachAuthorisationRequired =
              approach.rnpArMissed !== undefined ? approach.rnpArMissed : authorisationRequired;

            const runwayIdent = `${airportIdent}${approach.runwayNumber.toString().padStart(2, '0')}${this.mapRunwayDesignator(approach.runwayDesignator)}`;

            const levelOfService = this.mapRnavTypeFlags(approach.rnavTypeFlags);

            const transitions = this.mapApproachTransitions(approach, facilities, msAirport, approachName);

            const ret: Approach = {
              sectionCode: SectionCode.Airport,
              subSectionCode: AirportSubsectionCode.ApproachProcedures,
              databaseId: `P${icaoCode}${airportIdent}${approach.name}`,
              icaoCode,
              ident: approachName,
              suffix,
              runwayIdent,
              multipleIndicator: approach.approachSuffix,
              type: this.mapApproachType(approach.approachType),
              authorisationRequired,
              missedApproachAuthorisationRequired,
              levelOfService,
              transitions,
              legs: approach.finalLegs.map((leg, legIndex) =>
                this.mapLeg(leg, legIndex, facilities, msAirport, approachName, approach.approachType, rnp),
              ),
              missedLegs: approach.missedLegs.map((leg, legIndex) =>
                this.mapLeg(leg, legIndex, facilities, msAirport, approachName),
              ),
            };

            return ret;
          } catch (e) {
            console.error(`Error mapping approach ${msAirport.icao} ${approach.name}`, e);
          }
          return null;
        })
        .filter((v) => v !== null)
    );
  }

  public async mapArrivals(msAirport: JS_FacilityAirport): Promise<Arrival[]> {
    const icaoCode = this.getIcaoCodeFromAirport(msAirport);
    const airportIdent = FacilityCache.ident(msAirport.icao);

    const facilities = await this.loadFacilitiesFromProcedures(msAirport.arrivals);

    return msAirport.arrivals
      .map((arrival) => {
        try {
          const ret: Arrival = {
            sectionCode: SectionCode.Airport,
            subSectionCode: AirportSubsectionCode.STARs,
            databaseId: `P${icaoCode}${airportIdent}${arrival.name}`,
            icaoCode,
            ident: arrival.name,
            authorisationRequired: arrival.rnpAr ?? false,
            commonLegs: arrival.commonLegs.map((leg, legIndex) =>
              this.mapLeg(leg, legIndex, facilities, msAirport, arrival.name),
            ),
            enrouteTransitions: arrival.enRouteTransitions.map((trans, idx) =>
              this.mapEnrouteTransition(trans, facilities, msAirport, arrival.name, arrival.name + idx),
            ),
            runwayTransitions: arrival.runwayTransitions.map((trans, idx) =>
              this.mapRunwayTransition(trans, facilities, msAirport, arrival.name, arrival.name + idx),
            ),
          };
          return ret;
        } catch (e) {
          console.error(`Error mapping arrival ${msAirport.icao} ${arrival.name}`, e);
        }
        return null;
      })
      .filter((v) => v !== null);
  }

  public async mapDepartures(msAirport: JS_FacilityAirport): Promise<Departure[]> {
    const icaoCode = this.getIcaoCodeFromAirport(msAirport);
    const airportIdent = FacilityCache.ident(msAirport.icao);

    const facilities = await this.loadFacilitiesFromProcedures(msAirport.departures);

    return msAirport.departures
      .map((departure) => {
        try {
          let authorisationRequired = departure.rnpAr;
          if (authorisationRequired === undefined) {
            // fallback heuristic for MSFS2020
            authorisationRequired =
              this.isAnyRfLegPresent(departure.commonLegs) ||
              this.isAnyRfLegPresent(departure.runwayTransitions) ||
              this.isAnyRfLegPresent(departure.enRouteTransitions);
          }

          const commonLegsRnp = authorisationRequired ? 0.3 : undefined;

          const ret: Departure = {
            sectionCode: SectionCode.Airport,
            subSectionCode: AirportSubsectionCode.SIDs,
            databaseId: `P${icaoCode}${airportIdent}${departure.name}`,
            icaoCode,
            ident: departure.name,
            authorisationRequired,
            commonLegs: departure.commonLegs.map((leg, legIndex) =>
              this.mapLeg(leg, legIndex, facilities, msAirport, departure.name, undefined, commonLegsRnp),
            ),
            engineOutLegs: [],
            enrouteTransitions: departure.enRouteTransitions.map((trans, idx) =>
              this.mapEnrouteTransition(trans, facilities, msAirport, departure.name, departure.name + idx),
            ),
            runwayTransitions: departure.runwayTransitions.map((trans, idx) =>
              this.mapRunwayTransition(trans, facilities, msAirport, departure.name, departure.name + idx),
            ),
          };
          return ret;
        } catch (e) {
          console.error(`Error mapping departure ${msAirport.icao} ${departure.name}`, e);
        }
        return null;
      })
      .filter((v) => v !== null);
  }

  public async mapGates(msAirport: JS_FacilityAirport): Promise<Gate[]> {
    const icaoCode = this.getIcaoCodeFromAirport(msAirport);
    const airportIcao = FacilityCache.ident(msAirport.icao);

    return msAirport.gates.map((msGate) => {
      // values less than 12 are gate types, which we don't care for... 12 or greater are alphabetical chars which we do care for
      const prefix = msGate.name >= 12 && msGate.name < 38 ? MsfsMapping.letters[msGate.name - 12] : '';
      const suffix = msGate.suffix >= 12 && msGate.suffix < 38 ? MsfsMapping.letters[msGate.suffix - 12] : '';
      const ident = `${prefix}${msGate.number.toString()}${suffix}`;

      const databaseId = `G${icaoCode}${airportIcao}${ident}`;

      // the lat/lon are encoded as an offset from the airport reference point in meteres
      // circumference of the earth at average MSL
      const earthCircumference = 2 * Math.PI * 6371000;
      const latOffset = (360 * msGate.latitude) / earthCircumference;
      const longOffset = (360 * msGate.longitude) / (earthCircumference * Math.cos((msAirport.lat / 180) * Math.PI));

      const location = {
        lat: msAirport.lat + latOffset,
        long: msAirport.lon + longOffset,
      };

      return {
        sectionCode: SectionCode.Airport,
        subSectionCode: AirportSubsectionCode.Gates,
        databaseId,
        icaoCode,
        ident,
        airportIcao,
        location,
      };
    });
  }

  public static mapIcaoStructToIcao(icaoStruct: JS_ICAO): string {
    return `${icaoStruct.type}${icaoStruct.region.padEnd(2)}${icaoStruct.airport.padEnd(4)}${icaoStruct.ident.padEnd(5)}`;
  }

  public async mapHolds(msAirport: JS_FacilityAirport): Promise<ProcedureLeg[]> {
    // FIXME cache
    const ret: ProcedureLeg[] = [];
    // Not in MSFS2020
    if (msAirport.holdingPatterns) {
      for (const hold of msAirport.holdingPatterns) {
        const rawFix = await this.cache.getFacility(
          MsfsMapping.mapIcaoStructToIcao(hold.icaoStruct),
          LoadType.Intersection,
        );
        if (!rawFix) {
          console.warn('Failed to load fix for hold', hold);
          continue;
        }
        const waypoint = this.mapFacilityToWaypoint(rawFix);

        let altitudeDescriptor: ProcedureLeg['altitudeDescriptor'] = undefined;
        let altitude1: ProcedureLeg['altitude1'] = undefined;
        let altitude2: ProcedureLeg['altitude1'] = undefined;
        switch (true) {
          case hold.minAltitude > 0 && hold.maxAltitude > 0:
            altitudeDescriptor = AltitudeDescriptor.BetweenAlt1Alt2;
            altitude1 = hold.maxAltitude;
            altitude2 = hold.minAltitude;
            break;
          case hold.minAltitude > 0:
            altitudeDescriptor = AltitudeDescriptor.AtOrAboveAlt1;
            altitude1 = hold.minAltitude;
            break;
          case hold.maxAltitude > 0:
            altitudeDescriptor = AltitudeDescriptor.AtOrBelowAlt1;
            altitude1 = hold.maxAltitude;
            break;
        }

        const speedDescriptor: ProcedureLeg['speedDescriptor'] = hold.speed > 0 ? SpeedDescriptor.Maximum : undefined;
        const speed: ProcedureLeg['speed'] = hold.speed > 0 ? hold.speed : undefined;

        ret.push({
          type: LegType.HM,
          procedureIdent: hold.name,
          overfly: true,
          waypoint,
          arcRadius: hold.radius > 0 ? hold.radius / 1852 : undefined,
          length: hold.legLength > 0 ? hold.legLength / 1852 : undefined,
          lengthTime: hold.legTime,
          rnp: hold.rnp > 0 ? hold.rnp / 1852 : undefined,
          altitudeDescriptor,
          altitude1,
          altitude2,
          speedDescriptor,
          speed,
          turnDirection: hold.turnRight ? TurnDirection.Right : TurnDirection.Left,
          magneticCourse: hold.inboundCourse,
        });
      }
    }

    return ret;
  }

  private async loadFacilitiesFromProcedures(procedures: JS_Procedure[]): Promise<Map<string, JS_Facility>> {
    const icaoSet: Set<string> = new Set();

    const legs: JS_Leg[] = [];

    for (const proc of procedures) {
      // eslint-disable-next-line no-underscore-dangle
      if (proc.__Type === 'JS_Approach') {
        legs.push(...proc.finalLegs);
        legs.push(...proc.missedLegs);
        proc.transitions.forEach((trans) => legs.push(...trans.legs));
      } else {
        legs.push(...proc.commonLegs);
        proc.enRouteTransitions.forEach((trans) => legs.push(...trans.legs));
        proc.runwayTransitions.forEach((trans) => legs.push(...trans.legs));
      }
    }

    for (const leg of legs) {
      if (FacilityCache.validFacilityIcao(leg.fixIcao)) {
        icaoSet.add(leg.fixIcao);
      }
      if (FacilityCache.validFacilityIcao(leg.originIcao)) {
        icaoSet.add(leg.originIcao);
      }
      if (FacilityCache.validFacilityIcao(leg.arcCenterFixIcao)) {
        icaoSet.add(leg.arcCenterFixIcao);
      }
    }

    const icaos = Array.from(icaoSet);

    const airports = await this.cache.getFacilities(
      icaos.filter((icao) => icao.charAt(0) === 'A'),
      LoadType.Airport,
    );
    const vors = await this.cache.getFacilities(
      icaos.filter((icao) => icao.charAt(0) === 'V'),
      LoadType.Vor,
    );
    const ndbs = await this.cache.getFacilities(
      icaos.filter((icao) => icao.charAt(0) === 'N'),
      LoadType.Ndb,
    );
    const wps = await this.cache.getFacilities(
      icaos.filter((icao) => icao.charAt(0) === 'W'),
      LoadType.Intersection,
    );

    return new Map<string, JS_Facility>([...wps, ...ndbs, ...vors, ...airports]);
  }

  private mapApproachTransitions(
    approach: JS_Approach,
    facilities: Map<string, JS_Facility>,
    airport: JS_FacilityAirport,
    procedureIdent: string,
  ) {
    const transitions = approach.transitions.map((trans, index) =>
      this.mapApproachTransition(trans, facilities, airport, procedureIdent, procedureIdent + index),
    );

    approach.transitions.forEach((trans) => {
      // if the trans name is empty (in some 3pd navdata), fill it with the IAF name
      if (trans.name.trim().length === 0) {
        trans.name = FacilityCache.ident(trans.legs[0].fixIcao);
      }

      // Fix up navigraph approach transitions which hide IAPs inside other transitions rather
      // than splitting them out as they should be in MSFS data. Unfortunately this means
      // these transitions cannot be synced to the sim's flight plan system for ATC etc. as
      // they're not visible without this hack.
      // Note: it is safe to append to the array inside the forEach by the ECMA spec, and the appended
      // elements will not be visited.
      for (let i = 1; i < trans.legs.length; i++) {
        const leg = trans.legs[i];
        if ((leg.fixTypeFlags & FixTypeFlags.IAF) > 0 && (leg.type === MsLegType.TF || leg.type === MsLegType.IF)) {
          const iafIdent = FacilityCache.ident(leg.fixIcao);
          // this is a transition in itself... check that it doesn't already exist
          if (transitions.find((t) => t.ident === iafIdent) !== undefined) {
            continue;
          }

          transitions.push(
            this.mapApproachTransition(
              this.createMsApproachTransition(iafIdent, trans.legs.slice(i)),
              facilities,
              airport,
              procedureIdent,
              procedureIdent + transitions.length,
            ),
          );
        }
      }
    });

    return transitions;
  }

  private createMsApproachTransition(name: string, legs: JS_Leg[]): JS_ApproachTransition {
    // copy the IAF leg before we mutate it!
    legs[0] = { ...legs[0] };
    legs[0].type = MsLegType.IF;

    return {
      name,
      legs,
      __Type: 'JS_ApproachTransition',
    };
  }

  private mapApproachTransition(
    trans: JS_ApproachTransition,
    facilities: Map<string, JS_Facility>,
    airport: JS_FacilityAirport,
    procedureIdent: string,
    databaseId: string,
  ): ProcedureTransition {
    return {
      databaseId,
      ident: trans.name,
      legs: trans.legs.map((leg, legIndex) => this.mapLeg(leg, legIndex, facilities, airport, procedureIdent)),
    };
  }

  private mapEnrouteTransition(
    trans: JS_EnRouteTransition,
    facilities: Map<string, JS_Facility>,
    airport: JS_FacilityAirport,
    procedureIdent: string,
    databaseId: string,
  ): ProcedureTransition {
    const rnp = this.isAnyRfLegPresent(trans.legs) ? 0.3 : undefined;
    return {
      databaseId,
      ident: trans.name,
      legs: trans.legs.map((leg, legIndex) =>
        this.mapLeg(leg, legIndex, facilities, airport, procedureIdent, undefined, rnp),
      ),
    };
  }

  private mapRunwayTransition(
    trans: JS_RunwayTransition,
    facilities: Map<string, JS_Facility>,
    airport: JS_FacilityAirport,
    procedureIdent: string,
    databaseId: string,
  ): ProcedureTransition {
    const airportIdent = FacilityCache.ident(airport.icao);

    const rnp = this.isAnyRfLegPresent(trans.legs) ? 0.3 : undefined;
    const ident = `${airportIdent}${trans.runwayNumber.toFixed(0).padStart(2, '0')}${this.mapRunwayDesignator(trans.runwayDesignation)}`;

    return {
      databaseId,
      ident,
      legs: trans.legs.map((leg, legIndex) =>
        this.mapLeg(leg, legIndex, facilities, airport, procedureIdent, undefined, rnp),
      ),
    };
  }

  private tryGetWaypointFromIcao(
    airport: JS_FacilityAirport,
    facilities: Map<string, JS_Facility>,
    icao: string,
  ): ReturnType<MsfsMapping['mapFacilityToWaypoint']> | undefined {
    const isRunway = icao.charAt(0) === 'R';
    if (!FacilityCache.validFacilityIcao(icao) && !isRunway) {
      return undefined;
    }

    let ret: ReturnType<MsfsMapping['mapFacilityToWaypoint']> | undefined;

    if (isRunway) {
      ret = this.mapRunwayWaypoint(airport, icao);
    } else {
      const facility = facilities.get(icao);
      ret = facility ? this.mapFacilityToWaypoint(facility) : undefined;
    }

    if (!ret) {
      throw new Error(`Missing fix ${icao} for procedure leg!`);
    }
    return ret;
  }

  private mapLeg(
    leg: JS_Leg,
    legIndex: number,
    facilities: Map<string, JS_Facility>,
    airport: JS_FacilityAirport,
    procedureIdent: string,
    approachType?: MSApproachType,
    fallbackRnp?: number,
  ): ProcedureLeg {
    const arcCentreFix = this.tryGetWaypointFromIcao(airport, facilities, leg.arcCenterFixIcao);
    const waypoint = this.tryGetWaypointFromIcao(airport, facilities, leg.fixIcao);
    const recommendedNavaid = this.tryGetWaypointFromIcao(airport, facilities, leg.originIcao);

    let arcRadius: number | undefined;
    if (leg.type === MsLegType.RF) {
      if (!arcCentreFix) {
        throw new Error(`No arc centre fix for RF leg!`);
      }
      if (!waypoint) {
        throw new Error(`No waypoint fix for RF leg!`);
      }
      arcRadius = distanceTo(arcCentreFix.location, waypoint.location);
    }

    const approachWaypointDescriptor =
      approachType !== undefined ? this.mapMsLegToApproachWaypointDescriptor(leg, legIndex, approachType) : undefined;

    const rnp = leg.rnp !== undefined ? (leg.rnp > 0 ? leg.rnp / 1852 : undefined) : fallbackRnp;

    // speedRestrictionType is currently bugged, so ignore it for now until fixed.
    const speedDescriptor =
      /*leg.speedRestrictionType !== undefined
        ? this.mapSpeedDescriptor(leg.speedRestrictionType)
        :*/ leg.speedRestriction > 0 ? SpeedDescriptor.Maximum : undefined;

    // TODO for approach, pass approach type to mapMsAltDesc
    return {
      procedureIdent,
      type: this.mapMsLegType(leg.type),
      overfly: leg.flyOver,
      waypoint,
      recommendedNavaid,
      rho: leg.rho / 1852,
      theta: leg.theta,
      arcCentreFix,
      arcRadius,
      length: leg.distanceMinutes ? undefined : leg.distance / 1852,
      lengthTime: leg.distanceMinutes ? leg.distance : undefined,
      altitudeDescriptor: this.mapMsAltDesc(leg.altDesc, leg.fixTypeFlags, approachType, approachWaypointDescriptor),
      altitude1: Math.round(leg.altitude1 / 0.3048),
      altitude2: Math.round(leg.altitude2 / 0.3048),
      speed: speedDescriptor !== undefined ? leg.speedRestriction : undefined,
      speedDescriptor,
      turnDirection: this.mapMsTurnDirection(leg.turnDirection),
      magneticCourse: leg.course, // TODO check magnetic/true
      waypointDescriptor: this.mapMsIcaoToWaypointDescriptor(leg.fixIcao),
      approachWaypointDescriptor,
      verticalAngle: Math.abs(leg.verticalAngle) > Number.EPSILON ? leg.verticalAngle - 360 : undefined,
      rnp,
    };
  }

  private mapSpeedDescriptor(desc: SpeedRestrictionDescriptor): SpeedDescriptor | undefined {
    switch (desc) {
      case SpeedRestrictionDescriptor.At:
        return SpeedDescriptor.Mandatory;
      case SpeedRestrictionDescriptor.AtOrAbove:
        return SpeedDescriptor.Minimum;
      case SpeedRestrictionDescriptor.AtOrBelow:
        return SpeedDescriptor.Maximum;
      case SpeedRestrictionDescriptor.Between:
      case SpeedRestrictionDescriptor.Unused:
        return undefined;
    }
  }

  private mapRunwayWaypoint(airport: JS_FacilityAirport, icao: string): TerminalWaypoint | undefined {
    const airportIdent = FacilityCache.ident(airport.icao);
    const runwayIdent = `${airportIdent}${icao.substring(9).trim()}`;
    const runways = this.mapAirportRunwaysPartial(airport);

    for (const runway of runways) {
      if (runway.ident === runwayIdent) {
        return {
          sectionCode: SectionCode.Airport,
          subSectionCode: AirportSubsectionCode.Runways,
          databaseId: icao,
          icaoCode: icao.substring(1, 3),
          ident: runwayIdent,
          location: runway.thresholdLocation,
          area: WaypointArea.Terminal,
          airportIdent,
        };
      }
    }
    return undefined;
  }

  private mapApproachName(approach: JS_Approach): string {
    let prefix = ' ';
    switch (approach.approachType) {
      case MSApproachType.Backcourse:
        prefix = 'B';
        break;
      case MSApproachType.VorDme:
        prefix = 'D';
        break;
      case MSApproachType.Ils:
        prefix = 'I';
        break;
      case MSApproachType.Loc:
        prefix = 'L';
        break;
      case MSApproachType.Ndb:
        prefix = 'N';
        break;
      case MSApproachType.Gps:
        prefix = 'P';
        break;
      case MSApproachType.NdbDme:
        prefix = 'Q';
        break;
      case MSApproachType.Rnav:
        prefix = 'R';
        break;
      case MSApproachType.Sdf:
        prefix = 'U';
        break;
      case MSApproachType.Vor:
        prefix = 'V';
        break;
      case MSApproachType.Lda:
        prefix = 'X';
        break;
      default:
        break;
    }
    let suffix = '';
    if (approach.approachSuffix) {
      suffix = `${this.mapRunwayDesignator(approach.runwayDesignator, '-')}${approach.approachSuffix}`;
    } else if (approach.runwayDesignator > 0) {
      suffix = this.mapRunwayDesignator(approach.runwayDesignator);
    }
    return `${prefix}${approach.runwayNumber.toFixed(0).padStart(2, '0')}${suffix}`;
  }

  private getIcaoCodeFromAirport(msAirport: JS_FacilityAirport): string {
    if (msAirport.icaoStruct?.region?.length === 2) {
      return msAirport.icaoStruct.region;
    }

    const mapIcaos = msAirport.approaches.map((appr) => appr.finalLegs[appr.finalLegs.length - 1].fixIcao);
    // we do a little hack...
    return mapIcaos.length > 0 ? mapIcaos[0].substring(1, 3) : '  ';
  }

  public mapFacilityToWaypoint<T extends JS_Facility>(facility: T): FacilityType<T> {
    const airportIdent = facility.icao.substring(3, 7).trim();
    const isTerminalVsEnroute = airportIdent.length > 0;

    const databaseItem = {
      databaseId: facility.icao,
      icaoCode: facility.icao.substring(1, 3),
      ident: FacilityCache.ident(facility.icao),
      name: Utils.Translate(facility.name),
      location: { lat: facility.lat, long: facility.lon },
      area: isTerminalVsEnroute ? WaypointArea.Terminal : WaypointArea.Enroute,
      airportIdent: isTerminalVsEnroute ? airportIdent : undefined,
    };

    // TODO: VORs are also stored as intersections in the database. In this case, their ICAO starts with "V" but they are of type
    // `JS_FacilityIntersection`. What to do with those?
    switch (facility.icao.charAt(0)) {
      case 'N': {
        const ndb = facility as any as JS_FacilityNDB;
        return {
          ...databaseItem,
          sectionCode: isTerminalVsEnroute ? SectionCode.Airport : SectionCode.Navaid,
          subSectionCode: isTerminalVsEnroute ? AirportSubsectionCode.TerminalNdb : NavaidSubsectionCode.NdbNavaid,
          frequency: ndb.freqMHz, // actually kHz
          class: this.mapNdbType(ndb.type),
          bfoOperation: false, // TODO can we?
          airportIdent: isTerminalVsEnroute ? airportIdent : undefined,
        } as unknown as FacilityType<T>;
      }
      case 'V': {
        const vor = facility as any as JS_FacilityVOR;

        return {
          ...databaseItem,
          sectionCode: SectionCode.Navaid,
          subSectionCode: NavaidSubsectionCode.VhfNavaid,
          frequency: vor.freqMHz,
          range: this.mapVorRange(vor),
          figureOfMerit: this.mapVorFigureOfMerit(vor),
          stationDeclination: MathUtils.normalise180(360 - vor.magneticVariation),
          trueReferenced: vor.trueReferenced,
          dmeLocation: (vor.type & VorType.DME) > 0 ? databaseItem.location : undefined,
          type: this.mapVorType(vor),
          class: this.mapVorClass(vor),
        } as unknown as FacilityType<T>;
      }
      case 'A':
        return this.mapAirport(facility as JS_FacilityAirport) as FacilityType<T>;
      case 'W':
      default:
        return {
          ...databaseItem,
          sectionCode: isTerminalVsEnroute ? SectionCode.Airport : SectionCode.Enroute,
          subSectionCode: isTerminalVsEnroute
            ? AirportSubsectionCode.TerminalWaypoints
            : EnrouteSubsectionCode.Waypoints,
        } as FacilityType<T>;
    }
  }

  private mapRunwayDesignator(designatorChar: RunwayDesignatorChar, blankChar = ''): string {
    switch (designatorChar) {
      case RunwayDesignatorChar.A:
        return 'A';
      case RunwayDesignatorChar.B:
        return 'B';
      case RunwayDesignatorChar.C:
        return 'C';
      case RunwayDesignatorChar.L:
        return 'L';
      case RunwayDesignatorChar.R:
        return 'R';
      case RunwayDesignatorChar.W:
        return 'W';
      case RunwayDesignatorChar.None:
      default:
        return blankChar;
    }
  }

  private mapMsLegType(type: MsLegType): LegType {
    switch (type) {
      case MsLegType.AF:
        return LegType.AF;
      case MsLegType.CA:
        return LegType.CA;
      case MsLegType.CD:
        return LegType.CD;
      case MsLegType.CF:
        return LegType.CF;
      case MsLegType.CI:
        return LegType.CI;
      case MsLegType.CR:
        return LegType.CR;
      case MsLegType.DF:
        return LegType.DF;
      case MsLegType.FA:
        return LegType.FA;
      case MsLegType.FC:
        return LegType.FC;
      case MsLegType.FD:
        return LegType.FD;
      case MsLegType.FM:
        return LegType.FM;
      case MsLegType.HA:
        return LegType.HA;
      case MsLegType.HF:
        return LegType.HF;
      case MsLegType.HM:
        return LegType.HM;
      case MsLegType.IF:
        return LegType.IF;
      case MsLegType.PI:
        return LegType.PI;
      case MsLegType.RF:
        return LegType.RF;
      case MsLegType.TF:
        return LegType.TF;
      case MsLegType.VA:
        return LegType.VA;
      case MsLegType.VD:
        return LegType.VD;
      case MsLegType.VI:
        return LegType.VI;
      case MsLegType.VM:
        return LegType.VM;
      case MsLegType.VR:
        return LegType.VR;
      default:
        throw new Error(`Invalid leg type: ${type}`);
    }
  }

  private mapMsAltDesc(
    altDesc: MSAltitudeDescriptor,
    fixTypeFlags: FixTypeFlags,
    approachType?: MSApproachType,
    approachWaypointDescriptor?: ApproachWaypointDescriptor,
  ): AltitudeDescriptor | undefined {
    // TODO can we do more of these for other approach types?
    if (approachType === MSApproachType.Ils) {
      if (fixTypeFlags & FixTypeFlags.FAF) {
        if (altDesc === MSAltitudeDescriptor.At) {
          return AltitudeDescriptor.AtAlt1GsMslAlt2;
        }
        if (altDesc === MSAltitudeDescriptor.AtOrAbove) {
          return AltitudeDescriptor.AtOrAboveAlt1GsMslAlt2;
        }
      }
      if (approachWaypointDescriptor === ApproachWaypointDescriptor.FinalApproachCourseFix) {
        if (altDesc === MSAltitudeDescriptor.At) {
          return AltitudeDescriptor.AtAlt1GsIntcptAlt2;
        }
        if (altDesc === MSAltitudeDescriptor.AtOrAbove) {
          return AltitudeDescriptor.AtOrAboveAlt1GsIntcptAlt2;
        }
      }
    }

    switch (altDesc) {
      case MSAltitudeDescriptor.At:
        return AltitudeDescriptor.AtAlt1;
      case MSAltitudeDescriptor.AtOrAbove:
        return AltitudeDescriptor.AtOrAboveAlt1;
      case MSAltitudeDescriptor.AtOrBelow:
        return AltitudeDescriptor.AtOrBelowAlt1;
      case MSAltitudeDescriptor.Between:
        return AltitudeDescriptor.BetweenAlt1Alt2;
      default:
        return undefined;
    }
  }

  private mapMsTurnDirection(turnDirection: MSTurnDirection): TurnDirection {
    switch (turnDirection) {
      case MSTurnDirection.Left:
        return TurnDirection.Left;
      case MSTurnDirection.Right:
        return TurnDirection.Right;
      default:
        return TurnDirection.Either;
    }
  }

  private mapMsIcaoToWaypointDescriptor(icao: string): WaypointDescriptor {
    const type = icao.charAt(0);

    switch (type) {
      case 'A':
        return WaypointDescriptor.Airport;
      case 'N':
        return WaypointDescriptor.NdbNavaid;
      case 'R':
        return WaypointDescriptor.Runway;
      case 'V':
        return WaypointDescriptor.VhfNavaid;
      case ' ':
      case '':
        return WaypointDescriptor.None;
      case 'W':
      default:
        return WaypointDescriptor.Essential; // we don't have any info to decide anything more granular
    }
  }

  private isLocBasedApproach(approachType?: MSApproachType): boolean {
    // Localizer based approaches according to ARINC 424 6.4.1
    switch (approachType) {
      // IGS
      case MSApproachType.Ils:
      case MSApproachType.Lda:
      case MSApproachType.Loc:
      case MSApproachType.Sdf:
        return true;
      default:
        return false;
    }
  }

  private mapMsLegToApproachWaypointDescriptor(
    leg: JS_Leg,
    legIndex: number,
    approachType?: MSApproachType,
  ): ApproachWaypointDescriptor {
    // All localiser based approaches start with FACF (ARINC 424 6.4.1.1)
    if (legIndex === 0 && this.isLocBasedApproach(approachType)) {
      return ApproachWaypointDescriptor.FinalApproachCourseFix;
    }

    if ((leg.fixTypeFlags & FixTypeFlags.FAF) > 0) {
      return ApproachWaypointDescriptor.FinalApproachFix;
    }

    if ((leg.fixTypeFlags & FixTypeFlags.IAF) > 0) {
      return ApproachWaypointDescriptor.InitialApproachFix;
      // FIXME consider IAF with Hold/FACF types
    }

    if ((leg.fixTypeFlags & FixTypeFlags.MAP) > 0) {
      return ApproachWaypointDescriptor.MissedApproachPoint;
    }

    return 0;
  }

  private mapNdbType(type: NdbType): NdbClass {
    // TODO double check these
    switch (type) {
      case NdbType.CompassLocator:
        return NdbClass.Low;
      case NdbType.MH:
        return NdbClass.Medium;
      case NdbType.H:
        return NdbClass.Normal;
      case NdbType.HH:
        return NdbClass.High;
      default:
        return NdbClass.Unknown;
    }
  }

  private mapVorRange(vor: JS_FacilityVOR): number {
    switch (vor.vorClass) {
      case MSVorClass.HighAltitude:
        return 130;
      case MSVorClass.LowAltitude:
        return 40;
      default:
      case MSVorClass.Terminal:
        return 25;
    }
  }

  private mapVorFigureOfMerit(vor: JS_FacilityVOR): FigureOfMerit {
    switch (vor.vorClass) {
      case MSVorClass.LowAltitude:
        return 1;
      case MSVorClass.HighAltitude:
        return 2;
      case MSVorClass.Terminal:
      default:
        return 0;
    }
  }

  private mapVorType(vor: JS_FacilityVOR): VhfNavaidType {
    switch (vor.type) {
      case VorType.DME:
        return VhfNavaidType.Dme;
      case VorType.ILS:
        return VhfNavaidType.IlsDme;
      case VorType.TACAN:
        return VhfNavaidType.Tacan;
      case VorType.VOR:
        return VhfNavaidType.Vor;
      case VorType.VORDME:
        return VhfNavaidType.VorDme;
      case VorType.VORTAC:
        return VhfNavaidType.Vortac;
      case VorType.VOT:
        return VhfNavaidType.Vot;
      case VorType.Unknown:
      default:
        return VhfNavaidType.Unknown;
    }
  }

  private mapVorClass(vor: JS_FacilityVOR): VorClass {
    switch (vor.vorClass) {
      case MSVorClass.LowAltitude:
        return VorClass.LowAlt;
      case MSVorClass.HighAltitude:
        return VorClass.HighAlt;
      case MSVorClass.Terminal:
        return VorClass.Terminal;
      default:
        return VorClass.Unknown;
    }
  }

  private mapApproachType(type: MSApproachType): ApproachType {
    switch (type) {
      case MSApproachType.Gps:
        return ApproachType.Gps;
      case MSApproachType.Vor:
        return ApproachType.Vor;
      case MSApproachType.Ndb:
        return ApproachType.Ndb;
      case MSApproachType.Ils:
        return ApproachType.Ils;
      case MSApproachType.Loc:
        return ApproachType.Loc;
      case MSApproachType.Sdf:
        return ApproachType.Sdf;
      case MSApproachType.Lda:
        return ApproachType.Lda;
      case MSApproachType.VorDme:
        return ApproachType.VorDme;
      case MSApproachType.NdbDme:
        return ApproachType.NdbDme;
      case MSApproachType.Rnav:
        return ApproachType.Rnav;
      case MSApproachType.Backcourse:
        return ApproachType.LocBackcourse;
      default:
        return ApproachType.Unknown;
    }
  }

  private mapAirportIdent(msAirport: JS_FacilityAirport): string {
    return msAirport.icao.substring(7, 11);
  }

  public async getAirways(fixIdent: string, icaoCode: string, airwayIdent?: string): Promise<Airway[]> {
    const fixes = (await this.cache.searchByIdent(fixIdent, IcaoSearchFilter.Intersections, 100)).filter(
      (wp) => wp.icao.substring(1, 3) === icaoCode,
    );
    if (fixes.length < 1 || fixes[0].routes.length < 1) {
      return [];
    }
    if (fixes.length > 1) {
      console.warn(`Multiple fixes named ${fixIdent} in region ${icaoCode}`);
    }

    const fix = this.mapFacilityToWaypoint(fixes[0]);
    const routes = fixes[0].routes.filter((route) => !airwayIdent || route.name === airwayIdent);

    const airways = routes.map(
      (route) =>
        ({
          databaseId: `E${icaoCode}    ${route.name}${fixIdent}`,
          ident: route.name,
          level: this.mapAirwayLevel(route.type),
          fixes: [],
          direction: AirwayDirection.Either,
        }) as Airway,
    );

    for (let i = 0; i < airways.length; i++) {
      const airway = airways[i];

      const cachedAirwayFixes = this.cache.getCachedAirwayFixes(airway.databaseId);

      if (cachedAirwayFixes) {
        airway.fixes = cachedAirwayFixes;
      }
    }

    for (const route of routes) {
      const id = `E${icaoCode}    ${route.name}${fixIdent}`;

      const airwayObject = airways.find((it) => it.databaseId === id);

      if (!airwayObject) {
        throw new Error(`(getAirways) Airway object not found databaseID=${id}`);
      }

      if (airwayObject.fixes.length > 0) {
        // Fixes were already cached
        continue;
      }

      const previousFacs: JS_FacilityIntersection[] = [];
      const nextFacs: JS_FacilityIntersection[] = [];

      let previousIcao: string | undefined = route.prevIcao;
      // eslint-disable-next-line prefer-destructuring
      let nextIcao: string | undefined = route.nextIcao;

      let iterationCount = 0;

      while (previousIcao?.trim() || nextIcao?.trim()) {
        if (++iterationCount > 250) {
          throw new Error(`(getAirways) Too many iterations while getting airways: ${previousIcao} ${nextIcao}`);
        }
        if (previousIcao?.trim()) {
          const fac: JS_FacilityIntersection | undefined = await this.cache.getFacility(
            previousIcao,
            LoadType.Intersection,
          );

          if (!fac) {
            throw new Error(`(getAirways) Facility not loaded while looking back into route: ${previousIcao}`);
          }

          previousFacs.unshift(fac);

          previousIcao = fac.routes.find((it) => it.name === route.name)?.prevIcao;
        }

        if (nextIcao?.trim()) {
          const fac: JS_FacilityIntersection | undefined = await this.cache.getFacility(
            nextIcao,
            LoadType.Intersection,
          );

          if (!fac) {
            throw new Error(`(getAirways) Facility not loaded while looking back into route: ${nextIcao}`);
          }

          nextFacs.push(fac);

          nextIcao = fac.routes.find((it) => it.name === route.name)?.nextIcao;
        }
      }

      const allFixes = [
        ...previousFacs.map((it) => this.mapFacilityToWaypoint(it)),
        fix,
        ...nextFacs.map((it) => this.mapFacilityToWaypoint(it)),
      ];

      airwayObject.fixes = allFixes;

      this.cache.setCachedAirwayFixes(id, allFixes);
    }

    return airways;
  }

  private mapAirwayLevel(level: RouteType): AirwayLevel {
    switch (level) {
      case RouteType.All:
        return AirwayLevel.Both;
      case RouteType.HighLevel:
        return AirwayLevel.High;
      case RouteType.LowLevel:
        return AirwayLevel.Low;
      default:
        return AirwayLevel.Both;
    }
  }

  private mapRnavTypeFlags(flags: RnavTypeFlags): LevelOfService {
    let levels = 0;
    if (flags & RnavTypeFlags.LNAV) {
      levels |= LevelOfService.Lnav;
    }
    if (flags & RnavTypeFlags.LNAVVNAV) {
      levels |= LevelOfService.LnavVnav;
    }
    if (flags & RnavTypeFlags.LP) {
      levels |= LevelOfService.Lp;
    }
    if (flags & RnavTypeFlags.LPV) {
      levels |= LevelOfService.Lpv;
    }
    return levels;
  }

  /**
   * Checks if any leg in the array or within the array of transitions contains an RF leg.
   * Useful to determine AR/SAAR procedures since MSFS does not have such flags.
   * @param legsOrTransitions legs or transitions to check
   * @returns true if any RF leg is found
   */
  private isAnyRfLegPresent(legsOrTransitions: JS_Leg[] | JS_RunwayTransition[] | JS_EnRouteTransition[]): boolean {
    if (legsOrTransitions.length < 1) {
      return false;
    }

    if ('legs' in legsOrTransitions[0]) {
      const transitions = legsOrTransitions as JS_RunwayTransition[] | JS_EnRouteTransition[];
      return transitions.some((transition) => this.isAnyRfLegPresent(transition.legs));
    }

    const legs = legsOrTransitions as JS_Leg[];
    return legs.some((leg) => leg.type === MsLegType.RF);
  }

  /** @todo move to msfs-geo */
  private trueToMagnetic(bearing: number, magVar: number): number {
    return (360 + bearing - magVar) % 360;
  }

  /** @todo move to msfs-geo */
  private magneticToTrue(bearing: number, magVar: number): number {
    return (360 + bearing + magVar) % 360;
  }

  /** @todo move to msfs-geo */
  private oppositeBearing(bearing: number): number {
    return (bearing + 180) % 360;
  }
}
