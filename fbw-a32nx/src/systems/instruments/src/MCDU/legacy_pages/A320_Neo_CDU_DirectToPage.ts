// Copyright (c) 2020, 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { CDUFlightPlanPage, Markers } from './A320_Neo_CDU_FlightPlanPage';
import { Fix } from '@flybywiresim/fbw-sdk';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { Column, FormatLine, FormatTemplate } from '../legacy/A320_Neo_CDU_Format';
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { Wait } from '@microsoft/msfs-sdk';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';

export class CDUDirectToPage {
  static ShowPage(mcdu: LegacyFmsPageInterface, directWaypoint?: Fix, wptsListIndex = 0) {
    const plan = mcdu.flightPlanService.active;

    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.DirectToPage;
    mcdu.returnPageCallback = () => {
      CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex);
    };

    mcdu.activeSystem = 'FMGC';

    mcdu.SelfPtr = setTimeout(() => {
      if (mcdu.page.Current === mcdu.page.DirectToPage) {
        CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex);
      }
    }, mcdu.PageTimeout.Medium);

    const title = [new Column(17, plan.flightNumber.get() ?? '', Column.small, Column.right)];

    const header = this.renderHeader(directWaypoint);

    const numRows = directWaypoint === undefined ? 5 : 4;
    const firstRowIndex = directWaypoint === undefined ? 1 : 2;

    const waypointsAndMarkers = CDUFlightPlanPage.createWaypointsAndMarkers(mcdu, plan, false, plan.activeLegIndex);
    if (waypointsAndMarkers.length === 0) {
      waypointsAndMarkers.push(
        { marker: Markers.FPLN_DISCONTINUITY, fpIndex: 0, inAlternate: false },
        { marker: Markers.END_OF_FPLN, fpIndex: 1, inAlternate: false },
      );
    }

    const scrollWindow = CDUFlightPlanPage.createScrollWindow(
      mcdu,
      waypointsAndMarkers,
      plan,
      wptsListIndex,
      false,
      Infinity,
      numRows,
    );
    const scrollText = CDUFlightPlanPage.createScrollText(scrollWindow, false);

    mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
      if (value === '') {
        if (directWaypoint !== undefined) {
          // Insert TMPY
          mcdu.insertTemporaryFlightPlan(async () => {
            CDUFlightPlanPage.ShowPage(mcdu);

            await Wait.awaitDelay(300);
            await SimVar.SetSimVarValue('K:A32NX.FMGC_DIR_TO_TRIGGER', 'number', 0);
          });
        } else {
          mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          scratchpadCallback();
          return;
        }
      } else if (value === Keypad.clrValue) {
        if (directWaypoint !== undefined) {
          mcdu.eraseTemporaryFlightPlan(() => {
            CDUDirectToPage.ShowPage(mcdu, undefined, wptsListIndex - 1);
          });
        }
      } else {
        // Non FP direct to
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
          .catch((err: any) => {
            // Rethrow if error is not an FMS message to display
            if (err.type === undefined) {
              throw err;
            }

            mcdu.showFmsErrorMessage(err.type);
          });
      }
    };

    if (directWaypoint !== undefined) {
      mcdu.onLeftInput[1] = (_, scratchpadCallback) => {
        mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
        scratchpadCallback();
      };
      mcdu.onRightInput[0] = (_, scratchpadCallback) => {
        mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
        scratchpadCallback();
      };
      mcdu.onRightInput[1] = (_, scratchpadCallback) => {
        mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
        scratchpadCallback();
      };
    }

    for (let i = 0; i < scrollWindow.length; i++) {
      const line = scrollWindow[i];

      mcdu.leftInputDelay[firstRowIndex + i] = mcdu.getDelayBasic;
      mcdu.onLeftInput[firstRowIndex + i] = (_, scratchpadCallback) => {
        switch (line.type) {
          case 'leg': {
            const { fpIndex, leg } = line;

            const term = leg.terminationWaypoint();
            if ((!leg.isXF() && !leg.isHX()) || term === null || fpIndex >= plan.firstMissedApproachLegIndex) {
              mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
              scratchpadCallback();
              return;
            }

            const newWptsListIndex = directWaypoint === undefined ? wptsListIndex + 1 : wptsListIndex;

            mcdu.eraseTemporaryFlightPlan(() => {
              mcdu
                .directToLeg(fpIndex)
                .then(() => {
                  CDUDirectToPage.ShowPage(mcdu, term, newWptsListIndex);
                })
                .catch((err) => {
                  mcdu.logTroubleshootingError(err);
                  mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                  console.error(err);
                });
            });
            break;
          }
          default:
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
            scratchpadCallback();
        }
      };

      mcdu.rightInputDelay[firstRowIndex + i] = mcdu.getDelayBasic;
      mcdu.onRightInput[firstRowIndex + i] = (_, scratchpadCallback) => {
        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
        scratchpadCallback();
      };
    }

    let up = false;
    let down = false;
    if (wptsListIndex < waypointsAndMarkers.length - 5) {
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
    mcdu.setTemplate([FormatLine(...title), ...header, ...scrollText]);
  }

  private static renderHeader(directToWaypoint?: Fix): string[][] {
    if (!directToWaypoint) {
      return FormatTemplate([
        [new Column(1, 'DIR TO', Column.small)],
        [new Column(1, '[\xa0\xa0\xa0\xa0\xa0]', Column.cyan)],
      ]);
    }

    return FormatTemplate([
      [new Column(1, 'DIR TO', Column.small), new Column(13, 'RADIAL IN', Column.small)],
      [new Column(0, `*${directToWaypoint.ident}`, Column.cyan), new Column(21, '[ ]°', Column.right, Column.inop)],
      [new Column(1, 'WITH', Column.small), new Column(13, 'RADIAL OUT', Column.small)],
      [new Column(0, `*ABEAM PTS`, Column.inop), new Column(21, '[ ]°', Column.right, Column.inop)],
    ]);
  }
}
