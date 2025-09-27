import { Coordinates } from 'msfs-geo';

export interface WindRequestMessage {
  /**
   * The first cruise level, null if no cruise level has been defined, or undefined if climb winds are not requested.
   */
  climbWindLevel?: number | null;
  /**
   * A list of altitudes and waypoints to request cruise winds for, or undefined if no cruise winds are requested, e.g if
   * if no cruise waypoints exist
   */
  cruiseWinds?: CruiseWindRequest;
  /**
   * The last cruise level, null if no cruise level has been defined, or undefined if descent winds are not requested, (e.g if no destination exists)
   */
  descentWindLevel?: number | null;
  /**
   * The destination and alternate destination icaos, or undefined if no alternate wind is requested.
   */
  alternateWind?: AlternateWindRequest;
}

export function formatWindDownlinkMessage(message: WindRequestMessage): string {
  const climbWindRequestElement =
    message.climbWindLevel === undefined
      ? ''
      : message.climbWindLevel === null
        ? '/CQ'
        : `/CQ${Math.round(message.climbWindLevel).toFixed(0)}`;

  const cruiseWindRequestElement =
    message.cruiseWinds === undefined || message.cruiseWinds.waypoints.length === 0
      ? ''
      : `/WQ${message.cruiseWinds.flightLevels.map((level) => Math.round(level).toFixed(0)).join('.')}:${message.cruiseWinds.waypoints.map(
          (wp) => {
            if (typeof wp === 'string') {
              return wp;
            }

            const latDeg = Math.abs(Math.trunc(wp.lat)).toFixed(0).padStart(2, '0');
            const lonDeg = Math.abs(Math.trunc(wp.long)).toFixed(0).padStart(3, '0');

            return `${wp.lat >= 0 ? 'N' : 'S'}${latDeg}${wp.long >= 0 ? 'E' : 'W'}${lonDeg}`;
          },
        )}`;

  const descentWindRequestElement =
    message.descentWindLevel === undefined
      ? ''
      : message.descentWindLevel === null
        ? '/DQ'
        : `/DQ${Math.round(message.descentWindLevel)}`;

  const alternateWindRequestElement =
    message.alternateWind === undefined
      ? ''
      : `/WR${message.alternateWind.destinationIcao}.${message.alternateWind.alternateIcao}`;

  return `REQPWI${climbWindRequestElement}${cruiseWindRequestElement}${descentWindRequestElement}${alternateWindRequestElement}`;
}

export interface AlternateWindRequest {
  destinationIcao: string;
  alternateIcao: string;
}

export interface CruiseWindRequest {
  flightLevels: number[];
  waypoints: (string | Coordinates)[];
}

export interface WindUplinkMessage {
  climbWinds: UplinkedWindLevel[] | undefined;
  cruiseWinds: UplinkedCruiseWindSet[] | undefined;
  descentWinds: UplinkedWindLevel[] | undefined;
  alternateWind: UplinkedWindLevel | undefined;
}

export interface UplinkedCruiseWindSet {
  flightLevel: number;
  fixes: UplinkedCruiseWindEntry[];
}

export interface UplinkedWindEntry {
  trueDegrees: number;
  magnitude: number;
}

export interface UplinkedWindLevel extends UplinkedWindEntry {
  flightLevel: number;
}

export interface UplinkedWindLevelTemperature extends UplinkedWindEntry {
  flightLevel?: number;
  temperature?: number;
}

interface UplinkedWaypointWindEntry extends UplinkedWindLevelTemperature {
  type: 'waypoint';
  fixIdent: string;
}

interface UplinkedLatLonWindEntry extends UplinkedWindLevelTemperature, Coordinates {
  type: 'latlon';
}

export type UplinkedCruiseWindEntry = UplinkedWaypointWindEntry | UplinkedLatLonWindEntry;

export function formatWindUplinkMessage(message: WindUplinkMessage): string {
  const climbWindRequestElement =
    message.climbWinds === undefined
      ? ''
      : `/CB${message.climbWinds.map((cw) => `${cw.flightLevel.toFixed(0).padStart(3, '0')}${cw.trueDegrees.toFixed(0).padStart(3, '0')}${cw.magnitude.toFixed(0).padStart(3, '0')}`).join('.')}`;

  const cruiseWindRequestElement =
    message.cruiseWinds === undefined
      ? ''
      : `${message.cruiseWinds
          .map(
            (set) =>
              `/WD${set.flightLevel.toFixed(0).padStart(3, '0')},${set.fixes
                .map((fix) => {
                  let fixIdent: string;
                  if (fix.type === 'waypoint') {
                    fixIdent = fix.fixIdent;
                  } else {
                    const latDeg = Math.abs(Math.trunc(fix.lat)).toFixed(0).padStart(2, '0');
                    const lonDeg = Math.abs(Math.trunc(fix.long)).toFixed(0).padStart(3, '0');

                    fixIdent = `${fix.lat >= 0 ? 'N' : 'S'}${latDeg}${fix.long >= 0 ? 'E' : 'W'}${lonDeg}`;
                  }

                  const temp =
                    fix.temperature !== undefined && fix.flightLevel !== undefined
                      ? `,${fix.flightLevel.toFixed(0).padStart(3, '0')}${Math.round(fix.temperature) >= 0 ? 'P' : 'M'}${Math.abs(Math.round(fix.temperature))}`
                      : '';

                  return `${fixIdent},${fix.trueDegrees.toFixed(0).padStart(3, '0')}${fix.magnitude.toFixed(0).padStart(3, '0')}${temp}`;
                })
                .join('.')}`,
          )
          .join('')}`;

  const descentWindRequestElement =
    message.descentWinds === undefined
      ? ''
      : `/DD${message.descentWinds.map((dw) => `${dw.flightLevel.toFixed(0).padStart(3, '0')}${dw.trueDegrees.toFixed(0).padStart(3, '0')}${dw.magnitude.toFixed(0).padStart(3, '0')}`).join('.')}`;

  const alternateWindRequestElement =
    message.alternateWind === undefined
      ? ''
      : `/AW${message.alternateWind.flightLevel.toFixed(0).padStart(3, '0')}${message.alternateWind.trueDegrees.toFixed(0).padStart(3, '0')}${message.alternateWind.magnitude.toFixed(0).padStart(3, '0')}`;

  return `PWI${climbWindRequestElement}${cruiseWindRequestElement}${descentWindRequestElement}${alternateWindRequestElement}`;
}
