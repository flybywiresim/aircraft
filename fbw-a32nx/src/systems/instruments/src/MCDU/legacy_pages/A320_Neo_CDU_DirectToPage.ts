// Copyright (c) 2020, 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { CDUFlightPlanPage, Markers } from './A320_Neo_CDU_FlightPlanPage';
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import {
  DirectTo,
  isDirectWithAbeam,
  isDirectWithCourseIn,
  isDirectWithCourseOut,
} from '@fmgc/flightplanning/types/DirectTo';
import { isDiscontinuity, isLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { MagVar, MathUtils } from '@flybywiresim/fbw-sdk';
import { Wait } from '@microsoft/msfs-sdk';
import { Column, FormatLine, FormatTemplate } from '../legacy/A320_Neo_CDU_Format';

export class CDUDirectToPage {
  static ShowPage(
    mcdu: LegacyFmsPageInterface,
    directToObject?: DirectTo,
    wptsListIndex = 0,
    isRadialInPilotEntered = false,
  ) {
    const plan = mcdu.flightPlanService.active;

    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.DirectToPage;
    mcdu.returnPageCallback = () => {
      CDUDirectToPage.ShowPage(mcdu, directToObject, wptsListIndex);
    };

    mcdu.activeSystem = 'FMGC';

    mcdu.SelfPtr = setTimeout(() => {
      if (mcdu.page.Current === mcdu.page.DirectToPage) {
        CDUDirectToPage.ShowPage(mcdu, directToObject, wptsListIndex);
      }
    }, mcdu.PageTimeout.Medium);

    const title = [new Column(17, plan.flightNumber.get() ?? '', Column.small, Column.right)];

    const defaultRadialIn = this.computeDefaultRadialIn(plan, directToObject);
    const header = this.renderHeader(plan, directToObject, defaultRadialIn, isRadialInPilotEntered);

    const numRows = directToObject === undefined ? 5 : 4;
    const firstRowIndex = directToObject === undefined ? 1 : 2;

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
        if (directToObject !== undefined) {
          // Insert TMPY
          mcdu.insertTemporaryFlightPlan(async () => {
            CDUFlightPlanPage.ShowPage(mcdu);
            SimVar.SetSimVarValue('K:A32NX.FMGC_DIR_TO_TRIGGER', 'number', 0);
          });
        } else {
          mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          scratchpadCallback();
          return;
        }
      } else if (value === Keypad.clrValue) {
        if (directToObject !== undefined) {
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
                directToObject = {
                  nonFlightPlanFix: w,
                };

                mcdu
                  .directTo(directToObject)
                  .then(() => {
                    CDUDirectToPage.ShowPage(mcdu, directToObject, wptsListIndex);
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

    if (directToObject !== undefined) {
      // ABEAMS
      mcdu.onLeftInput[1] = (_, scratchpadCallback) => {
        mcdu.eraseTemporaryFlightPlan(() => {
          directToObject = {
            flightPlanLegIndex: directToObject?.flightPlanLegIndex,
            nonFlightPlanFix: directToObject?.nonFlightPlanFix,
            withAbeam: true,
          };

          mcdu
            .directTo(directToObject)
            .then(() => {
              mcdu.insertTemporaryFlightPlan(async () => {
                CDUFlightPlanPage.ShowPage(mcdu);
                SimVar.SetSimVarValue('K:A32NX.FMGC_DIR_TO_TRIGGER', 'number', 0);
              });
            })
            .catch((err) => {
              mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
              scratchpadCallback();
              console.error(err);
            });
        });
      };

      // RADIAL IN
      mcdu.onRightInput[0] = (s, scratchpadCallback) => {
        let course: number | undefined = undefined;
        let isPilotEntered = false;

        if (s === Keypad.clrValue) {
          if (isDirectWithCourseIn(directToObject) && defaultRadialIn !== undefined) {
            mcdu.eraseTemporaryFlightPlan(() => {
              if (!isDirectWithCourseIn(directToObject)) {
                return;
              }

              directToObject.courseIn = defaultRadialIn;

              mcdu
                .directTo(directToObject)
                .then(() => {
                  CDUDirectToPage.ShowPage(mcdu, directToObject, wptsListIndex);
                })
                .catch((err) => {
                  mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                  scratchpadCallback();
                  console.error(err);
                });
            });
            return;
          } else {
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
            scratchpadCallback();
            return;
          }
        } else if (s === '') {
          // Insert
          if (isDirectWithCourseIn(directToObject)) {
            mcdu.insertTemporaryFlightPlan(async () => {
              CDUFlightPlanPage.ShowPage(mcdu);

              const oldValidity = SimVar.GetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool');
              if (oldValidity) {
                // Disengage NAV
                SimVar.SetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool', false);
                await Wait.awaitDelay(300);
                SimVar.SetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool', true);
              }

              SimVar.SetSimVarValue('K:A32NX.FMGC_DIR_TO_TRIGGER', 'number', 0);
            });
          } else if (defaultRadialIn !== undefined) {
            mcdu.eraseTemporaryFlightPlan(() => {
              directToObject = {
                flightPlanLegIndex: directToObject?.flightPlanLegIndex,
                nonFlightPlanFix: directToObject?.nonFlightPlanFix,
                courseIn: MathUtils.normalise360(defaultRadialIn),
              };

              mcdu
                .directTo(directToObject)
                .then(() => {
                  mcdu.insertTemporaryFlightPlan(async () => {
                    CDUFlightPlanPage.ShowPage(mcdu);

                    const oldValidity = SimVar.GetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool');
                    if (
                      oldValidity &&
                      (isDirectWithCourseIn(directToObject) || isDirectWithCourseOut(directToObject))
                    ) {
                      // Disengage NAV
                      SimVar.SetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool', false);
                      await Wait.awaitDelay(300);
                      SimVar.SetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool', true);
                    }

                    SimVar.SetSimVarValue('K:A32NX.FMGC_DIR_TO_TRIGGER', 'number', 0);
                  });
                })
                .catch((err) => {
                  mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
                  console.error(err);
                });
            });
          }
          return;
        } else if (/^\d{1,3}/.test(s)) {
          course = parseInt(s);
          if (course > 360) {
            mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            scratchpadCallback();
            return;
          }

          isPilotEntered = true;
        } else {
          // TODO this should allow a true course
          mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          scratchpadCallback();
          return;
        }

        mcdu.eraseTemporaryFlightPlan(() => {
          directToObject = {
            flightPlanLegIndex: directToObject?.flightPlanLegIndex,
            nonFlightPlanFix: directToObject?.nonFlightPlanFix,
            courseIn: MathUtils.normalise360(course),
          };

          mcdu
            .directTo(directToObject)
            .then(() => {
              CDUDirectToPage.ShowPage(mcdu, directToObject, wptsListIndex, isPilotEntered);
            })
            .catch((err) => {
              mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
              console.error(err);
            });
        });
      };

      // RADIAL OUT
      mcdu.onRightInput[1] = (s, scratchpadCallback) => {
        // TODO this should allow a true course
        if (isDirectWithCourseOut(directToObject)) {
          // Insert
          mcdu.insertTemporaryFlightPlan(async () => {
            CDUFlightPlanPage.ShowPage(mcdu);

            const oldValidity = SimVar.GetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool');
            if (oldValidity) {
              // Disengage NAV
              SimVar.SetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool', false);
              await Wait.awaitDelay(300);
              SimVar.SetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool', true);
            }

            SimVar.SetSimVarValue('K:A32NX.FMGC_DIR_TO_TRIGGER', 'number', 0);
          });
          return;
        } else if (!/^\d{1,3}/.test(s)) {
          mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          scratchpadCallback();
          return;
        }

        const course = parseInt(s);
        if (course > 360) {
          mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          scratchpadCallback();
          return;
        }

        mcdu.eraseTemporaryFlightPlan(() => {
          directToObject = {
            flightPlanLegIndex: directToObject?.flightPlanLegIndex,
            nonFlightPlanFix: directToObject?.nonFlightPlanFix,
            courseOut: MathUtils.normalise360(course),
          };

          mcdu
            .directTo(directToObject)
            .then(() => {
              CDUDirectToPage.ShowPage(mcdu, directToObject, wptsListIndex);
            })
            .catch((err) => {
              mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
              console.error(err);
            });
        });
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

            const newWptsListIndex = directToObject === undefined ? wptsListIndex + 1 : wptsListIndex;

            mcdu.eraseTemporaryFlightPlan(() => {
              directToObject = {
                flightPlanLegIndex: fpIndex,
              };

              mcdu
                .directTo(directToObject)
                .then(() => {
                  CDUDirectToPage.ShowPage(mcdu, directToObject, newWptsListIndex);
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
        CDUDirectToPage.ShowPage(mcdu, directToObject, wptsListIndex);
      };
      up = true;
    }
    if (wptsListIndex > 0) {
      mcdu.onDown = () => {
        wptsListIndex--;
        CDUDirectToPage.ShowPage(mcdu, directToObject, wptsListIndex);
      };
      down = true;
    }

    mcdu.setArrows(up, down, false, false);
    mcdu.setTemplate([FormatLine(...title), ...header, ...scrollText]);
  }

  private static renderHeader(
    plan: FlightPlan,
    directToObject: DirectTo | undefined,
    defaultRadialIn: number | undefined,
    isRadialInPilotEntered: boolean,
  ): string[][] {
    let directWaypointCell = '';
    if (directToObject !== undefined) {
      if (directToObject.flightPlanLegIndex !== undefined) {
        // Don't just fetch the leg at the index, since the plan might've sequenced after this page was called up
        const directToLeg = plan.maybeElementAt(directToObject.flightPlanLegIndex);

        if (directToLeg && !isDiscontinuity(directToLeg)) {
          directWaypointCell = directToLeg.ident;
        }
      } else if (directToObject.nonFlightPlanFix !== undefined) {
        directWaypointCell = directToObject.nonFlightPlanFix.ident;
      }
    }

    if (directWaypointCell === '') {
      return FormatTemplate([
        [new Column(1, 'DIR TO', Column.small)],
        [new Column(1, '[\xa0\xa0\xa0\xa0\xa0]', Column.cyan)],
      ]);
    }

    const isWithAbeamSelected = directToObject && isDirectWithAbeam(directToObject);
    const canSelectWithAbeams = directToObject?.flightPlanLegIndex && !isWithAbeamSelected;

    const isRadialInSelected = directToObject && isDirectWithCourseIn(directToObject);
    const canSelectRadialIn = directToObject && !isRadialInSelected;

    let radialInText = '[ ]°';
    if (isRadialInSelected && isDirectWithCourseIn(directToObject)) {
      radialInText = `${directToObject.courseIn.toFixed(0).padStart(3, '0')}°`;
    } else if (defaultRadialIn !== undefined) {
      radialInText = `${defaultRadialIn.toFixed(0).padStart(3, '0')}°`;
    }

    const isRadialOutSelected = directToObject && isDirectWithCourseOut(directToObject);
    const canSelectRadialOut = directToObject && !isRadialOutSelected;
    const radialOutText =
      isRadialOutSelected && isDirectWithCourseOut(directToObject)
        ? `${directToObject.courseOut.toFixed(0).padStart(3, '0')}°`
        : '[ ]°';

    const canSelectDirectTo = directToObject !== undefined;

    return FormatTemplate([
      [new Column(1, 'DIR TO', Column.small), new Column(13, 'RADIAL IN', Column.small)],
      [
        new Column(0, `${canSelectDirectTo ? '*' : '\xa0'}${directWaypointCell}`, Column.cyan),
        new Column(21, radialInText, Column.right, Column.cyan, isRadialInPilotEntered ? Column.big : Column.small),
        new Column(23, canSelectRadialIn ? '*' : '\xa0', Column.right, Column.cyan),
      ],
      [new Column(1, 'WITH', Column.small), new Column(13, 'RADIAL OUT', Column.small)],
      [
        new Column(0, `${canSelectWithAbeams ? '*' : '\xa0'}ABEAM PTS`, Column.cyan),
        new Column(21, radialOutText, Column.right, Column.cyan, Column.big),
        new Column(23, canSelectRadialOut ? '*' : '\xa0', Column.right, Column.cyan),
      ],
    ]);
  }

  /**
   *
   * @param plan
   * @param directToObject
   * @returns {number | undefined}
   */
  static computeDefaultRadialIn(plan: FlightPlan, directToObject?: DirectTo): number | undefined {
    if (!directToObject || directToObject.flightPlanLegIndex === undefined) {
      return undefined;
    }

    const directToLeg = plan.maybeElementAt(directToObject.flightPlanLegIndex);
    if (!isLeg(directToLeg)) {
      return undefined;
    }

    const termination = directToLeg.terminationWaypoint();
    if (termination === null) {
      return undefined;
    }

    const maybeLegBefore = plan.maybeElementAt(directToObject.flightPlanLegIndex - 1);
    const maybeLegAfter = plan.maybeElementAt(directToObject.flightPlanLegIndex + 1);

    const fixMagVar = MagVar.getForFix(termination);

    if (
      directToObject.flightPlanLegIndex > plan.activeLegIndex &&
      isLeg(maybeLegBefore) &&
      maybeLegBefore.terminationWaypoint() !== null
    ) {
      const trueRadialIn = Avionics.Utils.computeGreatCircleHeading(
        termination.location,
        maybeLegBefore.terminationWaypoint()!.location,
      );

      return fixMagVar === null ? trueRadialIn : MagVar.trueToMagnetic(trueRadialIn, fixMagVar);
    } else if (isLeg(maybeLegAfter) && maybeLegAfter.terminationWaypoint() !== null) {
      const trueRadialIn =
        180 +
        Avionics.Utils.computeGreatCircleHeading(termination.location, maybeLegAfter.terminationWaypoint()!.location);

      return fixMagVar === null ? trueRadialIn : MagVar.trueToMagnetic(trueRadialIn, fixMagVar);
    }

    return undefined;
  }
}
