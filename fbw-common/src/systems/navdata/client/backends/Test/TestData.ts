import { Airport } from 'navdata/shared/types/Airport';
import { ElevatedCoordinates } from '../../../shared/types/Common';
import { AirportSubsectionCode, SectionCode } from '../../../shared/types/SectionCode';
import { Runway, RunwaySurfaceType } from '../../../shared/types/Runway';
import { WaypointArea } from '../../../shared/types/Waypoint';
import { Coordinates } from 'msfs-geo';

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
});

const fakeRunway = (
  icaoCode: string,
  airportIdent: string,
  number: string,
  designator: string,
  bearing: number,
  location: Coordinates,
): Runway => ({
  sectionCode: SectionCode.Airport,
  subSectionCode: AirportSubsectionCode.Runways,
  databaseId: `RUNWAY-${icaoCode}-${airportIdent}-${number.padStart(2, '0')}${designator}`,
  icaoCode,
  ident: `${airportIdent}${number.padStart(2, '0')}${designator}`,
  airportIdent: 'CYYZ',
  bearing,
  magneticBearing: bearing,
  gradient: 0,
  location,
  thresholdLocation: { ...location, alt: 0 },
  startLocation: location,
  thresholdCrossingHeight: 50,
  length: 0,
  width: 0,
  lsIdent: '',
  area: WaypointArea.Terminal,
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
      runways: [fakeRunway('CY', 'CYYZ', '06', 'R', 46, { long: -79.60958194444444, lat: 43.66679444444444 })],
    },
  ],
  [
    'CYVR',
    {
      airport: fakeAirport('CY', 'CYVR', { lat: 0, long: 0, alt: 0 }),
      runways: [fakeRunway('CY', 'CYVR', '08', 'R', 46, { long: -79.60958194444444, lat: 43.66679444444444 })],
    },
  ],
]);
