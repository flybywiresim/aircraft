// @ts-strict-ignore
// Copyright (c) 2021-2023, 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

// FIXME fix circular ref with clrValue
import { PilotWaypoint, PilotWaypointType } from '@fmgc/flightplanning/DataManager';
// FIXME fix circular ref
import { CDUPilotsWaypoint } from './A320_Neo_CDU_PilotsWaypoint';
import { McduMessage, NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Fix, Waypoint } from '@flybywiresim/fbw-sdk';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';

type NewWaypointDoneCallback = (waypoint: PilotWaypoint | undefined | null) => void;
interface InProgressData {
  ident: string;
  type: PilotWaypointType;
  wp: Waypoint;
  coordinates: Coordinates;
  place: Fix;
  bearing: number;
  distance: number;
  place1: Fix;
  place2: Fix;
  bearing1: number;
  bearing2: number;
}

export class CDUNewWaypoint {
  /**
   * New Waypoint Page
   * @param doneCallback callback when the user is finished with the page
   * @param _inProgressData private data used by the page
   */
  static ShowPage(
    mcdu: LegacyFmsPageInterface,
    doneCallback: NewWaypointDoneCallback = undefined,
    _inProgressData: Partial<InProgressData> = {},
  ) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.NewWaypoint;
    mcdu.returnPageCallback = () => {
      CDUNewWaypoint.ShowPage(mcdu, doneCallback, _inProgressData);
    };

    const template = [
      ['NEW WAYPOINT'],
      ['IDENT'],
      [_inProgressData.ident !== undefined ? `{cyan}${_inProgressData.ident}{end}` : '_______[color]amber'],
      ['LAT/LONG'],
      ['____.__|_____.__[color]amber'],
      ['PLACE/BRG /DIST'],
      ['_______|___° |___. _[color]amber'],
      ['PLACE-BRG  /PLACE-BRG'],
      ['{amber}_____-___°  |_____-___°{end}'],
      [''],
      ['', 'RETURN>'],
      [''],
      ['', _inProgressData.type !== undefined ? '{amber}STORE}{end}' : ''],
    ];

    switch (_inProgressData.type) {
      case PilotWaypointType.LatLon:
        template[4][0] = `{cyan}${CDUPilotsWaypoint.formatLatLong(_inProgressData.wp.location)}{end}`;
        template[5].length = 0;
        template[6].length = 0;
        template[7].length = 0;
        template[8].length = 0;
        break;
      case PilotWaypointType.Pbd:
        template[4][0] = `{cyan}{small}${CDUPilotsWaypoint.formatLatLong(_inProgressData.wp.location)}{end}{end}`;
        template[5][0] = 'PLACE\xa0\xa0/BRG\xa0/DIST';
        template[6][0] = `{cyan}${_inProgressData.place.ident.padEnd(7, '\xa0')}/${CDUPilotsWaypoint.formatBearing(_inProgressData.bearing)}/${_inProgressData.distance.toFixed(1)}{end}`;
        template[7].length = 0;
        template[8].length = 0;
        break;
      case PilotWaypointType.Pbx:
        template[4][0] = `{cyan}{small}${CDUPilotsWaypoint.formatLatLong(_inProgressData.wp.location)}{end}{end}`;
        template[5].length = 0;
        template[6].length = 0;
        template[7][0] = 'PLACE-BRG\xa0\xa0/PLACE-BRG';
        template[8][0] = `{cyan}${_inProgressData.place1.ident.padEnd(5, '\xa0')}-${CDUPilotsWaypoint.formatBearing(_inProgressData.bearing1)}/${_inProgressData.place2.ident.padEnd(5, '\xa0')}-${CDUPilotsWaypoint.formatBearing(_inProgressData.bearing2)}{end}`;
        break;
      default:
    }

    mcdu.setTemplate(template);

    // ident
    mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
      if (_inProgressData.ident !== undefined) {
        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
        scratchpadCallback();
      } else if (/^[A-Z0-9]{2,7}$/.test(value)) {
        _inProgressData = { ident: value };
        requestAnimationFrame(() => CDUNewWaypoint.ShowPage(mcdu, doneCallback, _inProgressData));
      } else {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
      }
    };

    // lat/lon
    mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
      if (value === Keypad.clrValue) {
        if (_inProgressData.type === PilotWaypointType.LatLon) {
          requestAnimationFrame(() => CDUNewWaypoint.ShowPage(mcdu, doneCallback, { ident: _inProgressData.ident }));
        } else {
          return scratchpadCallback();
        }
      }

      if (_inProgressData.type !== undefined) {
        return scratchpadCallback();
      }

      if (WaypointEntryUtils.isLatLonFormat(value)) {
        try {
          const coordinates = WaypointEntryUtils.parseLatLon(value);
          requestAnimationFrame(() =>
            CDUNewWaypoint.ShowPage(mcdu, doneCallback, {
              ident: _inProgressData.ident,
              type: PilotWaypointType.LatLon,
              wp: mcdu.dataManager.createLatLonWaypoint(coordinates, false, _inProgressData.ident).waypoint,
              coordinates,
            }),
          );
        } catch (err) {
          if (err instanceof McduMessage) {
            mcdu.setScratchpadMessage(err);
          } else {
            console.error(err);
          }
          scratchpadCallback();
        }
      } else {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
      }
    };

    // place/bearing/dist
    mcdu.onLeftInput[2] = (value, scratchpadCallback) => {
      if (value === Keypad.clrValue) {
        if (_inProgressData.type === PilotWaypointType.Pbd) {
          requestAnimationFrame(() => CDUNewWaypoint.ShowPage(mcdu, doneCallback, { ident: _inProgressData.ident }));
        } else {
          return scratchpadCallback();
        }
      }

      if (_inProgressData.type !== undefined) {
        return scratchpadCallback();
      }

      if (WaypointEntryUtils.isPbdFormat(value)) {
        try {
          WaypointEntryUtils.parsePbd(mcdu, value).then(([place, bearing, distance]) => {
            requestAnimationFrame(() =>
              CDUNewWaypoint.ShowPage(mcdu, doneCallback, {
                ident: _inProgressData.ident,
                type: PilotWaypointType.Pbd,
                wp: mcdu.dataManager.createPlaceBearingDistWaypoint(
                  place,
                  bearing,
                  distance,
                  false,
                  _inProgressData.ident,
                ).waypoint,
                place,
                bearing,
                distance,
              }),
            );
          });
        } catch (err) {
          if (err instanceof McduMessage) {
            mcdu.setScratchpadMessage(err);
          } else {
            console.error(err);
          }
          scratchpadCallback();
        }
      } else {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
      }
    };

    // place-bearing/place-bearing
    mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
      if (value === Keypad.clrValue) {
        if (_inProgressData.type === PilotWaypointType.Pbx) {
          requestAnimationFrame(() => CDUNewWaypoint.ShowPage(mcdu, doneCallback, { ident: _inProgressData.ident }));
        } else {
          return scratchpadCallback();
        }
      }

      if (_inProgressData.type !== undefined) {
        return scratchpadCallback();
      }

      if (WaypointEntryUtils.isPbxFormat(value)) {
        try {
          WaypointEntryUtils.parsePbx(mcdu, value).then(([place1, bearing1, place2, bearing2]) => {
            requestAnimationFrame(() =>
              CDUNewWaypoint.ShowPage(mcdu, doneCallback, {
                ident: _inProgressData.ident,
                type: PilotWaypointType.Pbx,
                wp: mcdu.dataManager.createPlaceBearingPlaceBearingWaypoint(
                  place1,
                  bearing1,
                  place2,
                  bearing2,
                  false,
                  _inProgressData.ident,
                ).waypoint,
                place1,
                bearing1,
                place2,
                bearing2,
              }),
            );
          });
        } catch (err) {
          if (err instanceof McduMessage) {
            mcdu.setScratchpadMessage(err);
          } else {
            console.error(err);
          }
          scratchpadCallback();
        }
      } else {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
      }
    };

    if (_inProgressData !== undefined) {
      mcdu.onRightInput[5] = () => {
        let stored: PilotWaypoint;
        switch (_inProgressData.type) {
          case PilotWaypointType.LatLon:
            stored = mcdu.dataManager.createLatLonWaypoint(_inProgressData.coordinates, true, _inProgressData.ident);
            break;
          case PilotWaypointType.Pbd:
            stored = mcdu.dataManager.createPlaceBearingDistWaypoint(
              _inProgressData.place,
              _inProgressData.bearing,
              _inProgressData.distance,
              true,
              _inProgressData.ident,
            );
            break;
          case PilotWaypointType.Pbx:
            stored = mcdu.dataManager.createPlaceBearingPlaceBearingWaypoint(
              _inProgressData.place1,
              _inProgressData.bearing1,
              _inProgressData.place2,
              _inProgressData.bearing2,
              true,
              _inProgressData.ident,
            );
            break;
          default:
            mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
            return;
        }
        requestAnimationFrame(() => {
          if (doneCallback !== undefined) {
            doneCallback(stored);
          } else {
            CDUPilotsWaypoint.ShowPage(mcdu, stored.storedIndex);
          }
        });
      };
    }

    mcdu.onRightInput[4] = () => {
      requestAnimationFrame(() => {
        if (doneCallback !== undefined) {
          doneCallback(undefined);
        } else {
          CDUPilotsWaypoint.ShowPage(mcdu);
        }
      });
    };
  }
}
