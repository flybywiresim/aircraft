// @ts-strict-ignore
// Copyright (c) 2021-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { CDUPilotsWaypoint } from './A320_Neo_CDU_PilotsWaypoint';
import { NXSystemMessages } from '../messages/NXSystemMessages';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';

/*
    Displays blank waypoint field, when waypoint inputted, LAT, LONG will show.
    Derives from Data Index PG2
*/

export class CDUWaypointPage {
  static ShowPage(mcdu: LegacyFmsPageInterface, waypoint = undefined) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.WaypointPage;
    mcdu.returnPageCallback = () => {
      CDUWaypointPage.ShowPage(mcdu);
    };

    let identValue = '_______[color]amber';
    let latLongLabel = '';
    let latLongValue = '';

    if (waypoint) {
      identValue = `${waypoint.ident}[color]cyan`;
      latLongLabel = '\xa0\xa0\xa0\xa0LAT/LONG';
      latLongValue = `${CDUPilotsWaypoint.formatLatLong(waypoint.location)}[color]green`;
    }

    mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
      if (value === Keypad.clrValue) {
        CDUWaypointPage.ShowPage(mcdu, undefined);
        return;
      }

      mcdu.getOrSelectWaypointByIdent(value, (res) => {
        if (res) {
          CDUWaypointPage.ShowPage(mcdu, res);
        } else {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
          scratchpadCallback();
        }
      });
    };

    mcdu.setTemplate([
      ['WAYPOINT'],
      ['\xa0IDENT'],
      [identValue],
      [latLongLabel],
      [latLongValue],
      [''],
      [''],
      [''],
      [''],
      [''],
      [''],
      [''],
      [''],
    ]);
  }
}
