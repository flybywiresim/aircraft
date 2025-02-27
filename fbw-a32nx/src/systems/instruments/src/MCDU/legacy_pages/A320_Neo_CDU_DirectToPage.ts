// Copyright (c) 2020, 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { CDUFlightPlanPage } from './A320_Neo_CDU_FlightPlanPage';
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
import { isDiscontinuity } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { A32NX_Util } from '@shared/A32NX_Util';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { Wait } from '@microsoft/msfs-sdk';

// TODO this whole thing is thales layout...

export class CDUDirectToPage {
  static ShowPage(
    mcdu: LegacyFmsPageInterface,
    directToObject?: DirectTo,
    wptsListIndex = 0,
    isRadialInPilotEntered = false,
  ) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.DirectToPage;
    mcdu.returnPageCallback = () => {
      CDUDirectToPage.ShowPage(mcdu, directToObject, wptsListIndex);
    };

    mcdu.activeSystem = 'FMGC';

    const waypointsCell = ['', '', '', '', ''];
    let iMax = 5;
    let eraseLabel = '';
    let eraseLine = '';
    let insertLabel = '';
    let insertLine = '';
    if (mcdu.flightPlanService.hasTemporary) {
      // Invalid state, should not be able to call up DIR when a temporary exists
      if (!directToObject) {
        mcdu.eraseTemporaryFlightPlan(() => {
          CDUDirectToPage.ShowPage(mcdu);
        });
        return;
      }

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

          const oldValidity = SimVar.GetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool');
          if (oldValidity && (isDirectWithCourseIn(directToObject) || isDirectWithCourseOut(directToObject))) {
            // Disengage NAV
            SimVar.SetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool', false);
            await Wait.awaitDelay(300);
            SimVar.SetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool', true);
          }

          SimVar.SetSimVarValue('K:A32NX.FMGC_DIR_TO_TRIGGER', 'number', 0);
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
        .catch((err) => {
          // Rethrow if error is not an FMS message to display
          if (err.type === undefined) {
            throw err;
          }

          mcdu.showFmsErrorMessage(err.type);
        });
    };

    // DIRECT TO
    mcdu.onRightInput[1] = (s, scratchpadCallback) => {
      if (!directToObject) {
        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
        scratchpadCallback();
        return;
      }

      mcdu.eraseTemporaryFlightPlan(() => {
        directToObject = {
          flightPlanLegIndex: directToObject.flightPlanLegIndex,
          nonFlightPlanFix: directToObject.nonFlightPlanFix,
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

    // ABEAM
    mcdu.onRightInput[2] = () => {
      mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
    };

    const plan = mcdu.flightPlanService.active;
    const defaultRadialIn = CDUDirectToPage.computeDefaultRadialIn(plan, directToObject);

    // RADIAL IN
    mcdu.onRightInput[3] = (s, scratchpadCallback) => {
      if (!directToObject) {
        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
        scratchpadCallback();
        return;
      }

      let course = undefined;
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
                console.error(err);
              });
          });
          return;
        } else {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
          scratchpadCallback();
          return;
        }
      } else if (s === '' && defaultRadialIn !== undefined) {
        course = defaultRadialIn;
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
          flightPlanLegIndex: directToObject.flightPlanLegIndex,
          nonFlightPlanFix: directToObject.nonFlightPlanFix,
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
    mcdu.onRightInput[4] = (s, scratchpadCallback) => {
      if (!directToObject) {
        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
        scratchpadCallback();
        return;
      }

      // TODO this should allow a true course
      if (!/^\d{1,3}/.test(s)) {
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
          flightPlanLegIndex: directToObject.flightPlanLegIndex,
          nonFlightPlanFix: directToObject.nonFlightPlanFix,
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

    let directWaypointCell = '';
    if (directToObject) {
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

    let i = 0;
    let cellIter = 0;
    wptsListIndex = Math.max(wptsListIndex, mcdu.flightPlanService.active.activeLegIndex);

    const totalWaypointsCount = plan.firstMissedApproachLegIndex;

    while (i < totalWaypointsCount && i + wptsListIndex < totalWaypointsCount && cellIter < iMax) {
      const legIndex = i + wptsListIndex;
      if (isDiscontinuity(plan.elementAt(legIndex))) {
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
              directToObject = {
                flightPlanLegIndex: legIndex,
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

    const isWithAbeamSelected = directToObject && isDirectWithAbeam(directToObject);
    const canSelectWithAbeam = directToObject && !isWithAbeamSelected;
    // FIXME implement
    const isAbeamImplemented = false;

    const isRadialInSelected = directToObject && isDirectWithCourseIn(directToObject);
    const canSelectRadialIn = directToObject && !isRadialInSelected;

    let radialInText = '[ ]°';
    if (isRadialInSelected && isDirectWithCourseIn(directToObject)) {
      radialInText = isRadialInPilotEntered
        ? `${directToObject.courseIn.toFixed(0).padStart(3, '0')}°`
        : `{small}${directToObject.courseIn.toFixed(0).padStart(3, '0')}°{end}`;
    } else if (defaultRadialIn !== undefined) {
      radialInText = `{small}${defaultRadialIn.toFixed(0).padStart(3, '0')}°{end}`;
    }

    const isRadialOutSelected = directToObject && isDirectWithCourseOut(directToObject);
    const canSelectRadialOut = directToObject && !isRadialOutSelected;
    const radialOut =
      isRadialOutSelected && isDirectWithCourseOut(directToObject)
        ? `${directToObject.courseOut.toFixed(0).padStart(3, '0')}°`
        : '[ ]°';

    const isDirectToSelected = directToObject && !isWithAbeamSelected && !isRadialInSelected && !isRadialOutSelected;
    const canSelectDirectTo = directToObject && !isDirectToSelected;

    mcdu.setArrows(up, down, false, false);
    mcdu.setTemplate([
      ['DIR TO'],
      ['\xa0WAYPOINT', 'DIST\xa0', 'UTC'],
      ['*[' + (directWaypointCell ? directWaypointCell : '\xa0\xa0\xa0\xa0\xa0') + '][color]cyan', '---', '----'],
      ['\xa0F-PLN WPTS'],
      [waypointsCell[0], `DIRECT TO ${canSelectDirectTo ? '}' : ' '}[color]${isDirectToSelected ? 'yellow' : 'cyan'}`],
      ['', 'WITH\xa0'],
      [
        waypointsCell[1],
        `ABEAM PTS ${canSelectWithAbeam ? '}' : ' '}[color]${isAbeamImplemented ? (isWithAbeamSelected ? 'yellow' : 'cyan') : 'inop'}`,
      ],
      ['', 'RADIAL IN\xa0'],
      [
        waypointsCell[2],
        `${radialInText} ${canSelectRadialIn ? '}' : ' '}[color]${isRadialInSelected ? 'yellow' : 'cyan'}`,
      ],
      ['', 'RADIAL OUT\xa0'],
      [
        waypointsCell[3],
        `${radialOut} ${canSelectRadialOut ? '}' : ' '}[color]${isRadialOutSelected ? 'yellow' : 'cyan'}`,
      ],
      [eraseLabel, insertLabel],
      [eraseLine ? eraseLine : waypointsCell[4], insertLine],
    ]);
  }

  /**
   *
   * @param plan
   * @param directToObject
   * @returns {number | undefined}
   */
  static computeDefaultRadialIn(plan: FlightPlan, directToObject: DirectTo): number | undefined {
    if (!directToObject || directToObject.flightPlanLegIndex === undefined) {
      return undefined;
    }

    const directToLeg = plan.maybeElementAt(directToObject.flightPlanLegIndex);
    if (!directToLeg || directToLeg.isDiscontinuity === true || directToLeg.terminationWaypoint() === null) {
      return undefined;
    }

    const maybeLegBefore = plan.maybeElementAt(directToObject.flightPlanLegIndex - 1);
    const maybeLegAfter = plan.maybeElementAt(directToObject.flightPlanLegIndex + 1);

    if (
      directToObject.flightPlanLegIndex > plan.activeLegIndex &&
      maybeLegBefore &&
      maybeLegBefore.isDiscontinuity === false &&
      maybeLegBefore.terminationWaypoint() !== null
    ) {
      const trueRadialIn = Avionics.Utils.computeGreatCircleHeading(
        directToLeg.terminationWaypoint().location,
        maybeLegBefore.terminationWaypoint().location,
      );

      return A32NX_Util.trueToMagnetic(trueRadialIn, A32NX_Util.getRadialMagVar(directToLeg.terminationWaypoint()));
    } else if (
      maybeLegAfter &&
      maybeLegAfter.isDiscontinuity === false &&
      maybeLegAfter.terminationWaypoint() !== null
    ) {
      const trueRadialIn =
        180 +
        Avionics.Utils.computeGreatCircleHeading(
          directToLeg.terminationWaypoint().location,
          maybeLegAfter.terminationWaypoint().location,
        );

      return A32NX_Util.trueToMagnetic(trueRadialIn, A32NX_Util.getRadialMagVar(directToLeg.terminationWaypoint()));
    }

    return undefined;
  }
}
