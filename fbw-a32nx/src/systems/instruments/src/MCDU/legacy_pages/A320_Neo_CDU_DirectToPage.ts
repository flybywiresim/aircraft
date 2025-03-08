// Copyright (c) 2020, 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { CDUFlightPlanPage } from './A320_Neo_CDU_FlightPlanPage';
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { Fix } from '@flybywiresim/fbw-sdk';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { Wait } from '@microsoft/msfs-sdk';

// TODO this whole thing is thales layout...

export class CDUDirectToPage {
  static ShowPage(mcdu: LegacyFmsPageInterface, directWaypoint?: Fix, wptsListIndex = 0) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.DirectToPage;
    mcdu.returnPageCallback = () => {
      CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex);
    };

    mcdu.activeSystem = 'FMGC';

    let directWaypointCell = '';
    if (directWaypoint) {
      directWaypointCell = directWaypoint.ident;
    } else if (mcdu.flightPlanService.hasTemporary) {
      mcdu.eraseTemporaryFlightPlan(() => {
        CDUDirectToPage.ShowPage(mcdu);
      });
      return;
    }

    const waypointsCell = ['', '', '', '', ''];
    let iMax = 5;
    let eraseLabel = '';
    let eraseLine = '';
    let insertLabel = '';
    let insertLine = '';
    if (mcdu.flightPlanService.hasTemporary) {
      iMax--;
      eraseLabel = '\xa0DIR TO[color]amber';
      eraseLine = '{ERASE[color]amber';
      insertLabel = 'TMPY\xa0[color]amber';
      insertLine = 'DIRECT*[color]amber';
      mcdu.onLeftInput[5] = () => {
        mcdu.eraseTemporaryFlightPlan(() => {
          CDUDirectToPage.ShowPage(mcdu);
        });
      };
      mcdu.onRightInput[5] = () => {
        mcdu.insertTemporaryFlightPlan(async () => {
          CDUFlightPlanPage.ShowPage(mcdu);

          // TODO implement
          const isRadialInOut = false;

          if (isRadialInOut) {
            const oldValidity = SimVar.GetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool');
            if (oldValidity) {
              mcdu.disengageNavMode();
            }
          } else {
            await Wait.awaitDelay(300);
          }

          await SimVar.SetSimVarValue('K:A32NX.FMGC_DIR_TO_TRIGGER', 'number', 0);
        });
      };
    }

    mcdu.onLeftInput[0] = (value) => {
      if (value === Keypad.clrValue) {
        mcdu.eraseTemporaryFlightPlan(() => {
          CDUDirectToPage.ShowPage(mcdu, undefined, wptsListIndex);
        });
        return;
      }

      WaypointEntryUtils.getOrCreateWaypoint(mcdu, value, false)
        .then((w) => {
          if (w) {
            mcdu.eraseTemporaryFlightPlan(() => {
              mcdu
                .directToWaypoint(w)
                .then(() => {
                  CDUDirectToPage.ShowPage(mcdu, w, wptsListIndex);
                })
                .catch((err) => {
                  mcdu.logTroubleshootingError(err);
                  mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                  console.error(err);
                });
            });
          } else {
            mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
          }
        })
        .catch((err) => {
          // Rethrow if error is not an FMS message to display
          if (err.type === undefined) {
            throw err;
          }

          mcdu.showFmsErrorMessage(err.type);
        });
    };

    mcdu.onRightInput[2] = () => {
      mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
    };
    mcdu.onRightInput[3] = () => {
      mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
    };
    mcdu.onRightInput[4] = () => {
      mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
    };

    const plan = mcdu.flightPlanService.active;

    let i = 0;
    let cellIter = 0;
    wptsListIndex = Math.max(wptsListIndex, mcdu.flightPlanService.active.activeLegIndex);

    const totalWaypointsCount = plan.firstMissedApproachLegIndex;

    while (i < totalWaypointsCount && i + wptsListIndex < totalWaypointsCount && cellIter < iMax) {
      const legIndex = i + wptsListIndex;
      if (plan.elementAt(legIndex).isDiscontinuity) {
        i++;
        continue;
      }

      const leg = plan.legElementAt(legIndex);

      if (leg) {
        if (!leg.isXF()) {
          i++;
          continue;
        }

        waypointsCell[cellIter] = '{' + leg.ident + '[color]cyan';
        if (waypointsCell[cellIter]) {
          mcdu.onLeftInput[cellIter + 1] = () => {
            mcdu.eraseTemporaryFlightPlan(() => {
              mcdu
                .directToLeg(legIndex)
                .then(() => {
                  CDUDirectToPage.ShowPage(mcdu, leg.terminationWaypoint(), wptsListIndex);
                })
                .catch((err) => {
                  mcdu.logTroubleshootingError(err);
                  mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                  console.error(err);
                });
            });
          };
        }
      } else {
        waypointsCell[cellIter] = '----';
      }
      i++;
      cellIter++;
    }
    if (cellIter < iMax) {
      waypointsCell[cellIter] = '--END--';
    }
    let up = false;
    let down = false;
    if (wptsListIndex < totalWaypointsCount - 5) {
      mcdu.onUp = () => {
        wptsListIndex++;
        CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex);
      };
      up = true;
    }
    if (wptsListIndex > 0) {
      mcdu.onDown = () => {
        wptsListIndex--;
        CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex);
      };
      down = true;
    }
    mcdu.setArrows(up, down, false, false);
    mcdu.setTemplate([
      ['DIR TO'],
      ['\xa0WAYPOINT', 'DIST\xa0', 'UTC'],
      ['*[' + (directWaypointCell ? directWaypointCell : '\xa0\xa0\xa0\xa0\xa0') + '][color]cyan', '---', '----'],
      ['\xa0F-PLN WPTS'],
      [waypointsCell[0], 'DIRECT TO[color]cyan'],
      ['', 'WITH\xa0'],
      [waypointsCell[1], 'ABEAM PTS[color]cyan'],
      ['', 'RADIAL IN\xa0'],
      [waypointsCell[2], '[ ]°[color]cyan'],
      ['', 'RADIAL OUT\xa0'],
      [waypointsCell[3], '[ ]°[color]cyan'],
      [eraseLabel, insertLabel],
      [eraseLine ? eraseLine : waypointsCell[4], insertLine],
    ]);
  }
}
