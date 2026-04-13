import { Airport } from '../../../shared/types/Airport';
import { ElevatedCoordinates } from '../../../shared/types/Common';
import { AirportSubsectionCode, EnrouteSubsectionCode, SectionCode } from '../../../shared/types/SectionCode';
import { Runway, RunwayDesignator, RunwaySurfaceType } from '../../../shared/types/Runway';
import { Waypoint, WaypointArea } from '../../../shared/types/Waypoint';
import { Coordinates } from 'msfs-geo';
import { Airway, AirwayDirection, AirwayLevel } from '../../../shared/types/Airway';

const fakeAirport = (icaoCode: string, ident: string, location: ElevatedCoordinates): Airport => ({
  sectionCode: SectionCode.Airport,
  subSectionCode: AirportSubsectionCode.ReferencePoints,
  databaseId: `AIRPORT-${icaoCode}-${ident}`,
  icaoCode,
  ident,
  location,
  longestRunwayLength: 0,
  longestRunwaySurfaceType: RunwaySurfaceType.Hard,
  area: WaypointArea.Terminal,
  airportIdent: ident,
  magVar: 0,
});

const fakeRunway = (
  icaoCode: string,
  airportIdent: string,
  number: string,
  designator: RunwayDesignator,
  bearing: number,
  location: Coordinates,
): Runway => {
  let designatorChar = '';
  switch (designator) {
    case RunwayDesignator.None:
      designatorChar = '';
      break;
    case RunwayDesignator.Centre:
      designatorChar = 'C';
      break;
    case RunwayDesignator.Left:
      designatorChar = 'L';
      break;
    case RunwayDesignator.Right:
      designatorChar = 'R';
      break;
    case RunwayDesignator.True:
      designatorChar = 'T';
      break;
    default:
      designator satisfies never;
  }

  return {
    sectionCode: SectionCode.Airport,
    subSectionCode: AirportSubsectionCode.Runways,
    databaseId: `RUNWAY-${icaoCode}-${airportIdent}-${number.padStart(2, '0')}${designatorChar}`,
    icaoCode,
    ident: `${airportIdent}${number.padStart(2, '0')}${designatorChar}`,
    number: parseInt(number),
    designator,
    airportIdent: 'CYYZ',
    bearing,
    magneticBearing: bearing,
    magVar: 0,
    gradient: 0,
    location,
    thresholdLocation: { ...location, alt: 0 },
    startLocation: location,
    thresholdCrossingHeight: 50,
    length: 0,
    width: 0,
    lsIdent: '',
    area: WaypointArea.Terminal,
  };
};

const fakeAirway = (ident: string, fixes: Waypoint[]): Airway => ({
  databaseId: `AIRWAY-${ident}`,
  ident,
  level: AirwayLevel.Both,
  fixes,
  direction: AirwayDirection.Either,
});

const fakeWaypoint = (icaoCode: string, ident: string, location: Coordinates): Waypoint => ({
  sectionCode: SectionCode.Enroute,
  subSectionCode: EnrouteSubsectionCode.Waypoints,
  databaseId: `WAYPOINT-${icaoCode}-${ident}`,
  icaoCode,
  area: WaypointArea.Enroute,
  ident,
  location,
});

export const TEST_AIRPORTS: Map<string, { airport: Airport; runways: Runway[] }> = new Map([
  [
    'CYYZ',
    {
      airport: fakeAirport('CY', 'CYYZ', {
        lat: 43.67607222222222,
        long: -79.63047499999999,
        alt: 569,
      }),
      runways: [
        fakeRunway('CY', 'CYYZ', '06', RunwayDesignator.Right, 46, {
          long: -79.60958194444444,
          lat: 43.66679444444444,
        }),
      ],
    },
  ],
  [
    'CYVR',
    {
      airport: fakeAirport('CY', 'CYVR', { lat: 0, long: 0, alt: 0 }),
      runways: [
        fakeRunway('CY', 'CYVR', '08', RunwayDesignator.Right, 46, {
          long: -79.60958194444444,
          lat: 43.66679444444444,
        }),
      ],
    },
  ],
]);

export const FAKE_WAYPOINTS = {
  NOSUS: fakeWaypoint('CY', 'NOSUS', { lat: 0, long: 0 }),
  DEBUS: fakeWaypoint('CY', 'DEBUS', { lat: 0, long: 0 }),
  DUTIL: fakeWaypoint('CY', 'DUTIL', { lat: 0, long: 0 }),
};

export const FAKE_AIRWAYS = {
  A1: fakeAirway('A1', [FAKE_WAYPOINTS.NOSUS, FAKE_WAYPOINTS.DEBUS, FAKE_WAYPOINTS.DUTIL]),
};
