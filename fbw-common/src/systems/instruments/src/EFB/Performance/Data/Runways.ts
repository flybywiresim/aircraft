import { RunwayDesignatorChar } from '@flybywiresim/fbw-sdk';

export interface Runway {
  airportIdent: string;
  ident: string;
  bearing: number;
  magneticBearing: number;
  /**
   * slope of the runway, negative for downhill
   */
  gradient: number;
  length: number;
  elevation: number;
}

function mapRunwayDesignator(designatorChar: RunwayDesignatorChar) {
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
    default:
      return '';
  }
}

export function getAirport(icao: string): Promise<RawAirport> {
  icao = icao.toUpperCase();
  return new Promise((resolve, reject) => {
    if (icao.length !== 4) {
      reject();
    }
    const handler = Coherent.on('SendAirport', (data) => {
      handler.clear();
      const ident = data.icao.substring(7, 11);
      if (ident === icao) {
        resolve(data);
      } else {
        reject();
      }
    });
    Coherent.call('LOAD_AIRPORT', `A      ${icao.toUpperCase()}`).then((ret) => {
      if (!ret) {
        handler.clear();
        reject();
      }
    });
  });
}

export async function getAirportMagVar(icao: string): Promise<number | null> {
  const airport = await getAirport(icao);
  return Facilities.getMagVar(airport.lat, airport.lon);
}

export async function getRunways(icao: string): Promise<Runway[]> {
  const airport = await getAirport(icao);

  const runways: Runway[] = [];

  const magVar = Facilities.getMagVar(airport.lat, airport.lon);

  for (const rawRunway of airport.runways) {
    for (const [i, number] of rawRunway.designation.split('-').entries()) {
      const runwayDesignator = i === 0 ? rawRunway.designatorCharPrimary : rawRunway.designatorCharSecondary;
      const ident = `${number.padStart(2, '0')}${mapRunwayDesignator(runwayDesignator)}`;
      const bearing = i === 0 ? rawRunway.direction : (rawRunway.direction + 180) % 360;
      const magneticBearing = (720 + bearing - magVar) % 360;
      const gradient =
        ((i === 0 ? 1 : -1) *
          Math.asin(
            (rawRunway.primaryElevation - rawRunway.secondaryElevation) /
              (rawRunway.length - rawRunway.primaryThresholdLength - rawRunway.secondaryThresholdLength),
          ) *
          180) /
        Math.PI;
      runways.push({
        airportIdent: icao,
        ident,
        bearing,
        magneticBearing,
        gradient,
        length: rawRunway.length,
        elevation: rawRunway.elevation / 0.3048,
      });
    }
  }

  return runways;
}
