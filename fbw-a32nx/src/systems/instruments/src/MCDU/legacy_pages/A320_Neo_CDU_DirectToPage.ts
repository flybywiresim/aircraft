// Copyright (c) 2020, 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { CDUFlightPlanPage, Markers } from './A320_Neo_CDU_FlightPlanPage';
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { DirectTo, DirectToBuilder, DirectToType } from '@fmgc/flightplanning/types/DirectTo';
import { isDiscontinuity, isLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import { Fix, MagVar } from '@flybywiresim/fbw-sdk';
import { Wait } from '@microsoft/msfs-sdk';
import { Column, FormatLine, FormatTemplate } from '../legacy/A320_Neo_CDU_Format';

export class CDUDirectToPage {
  static ShowPage(
    mcdu: LegacyFmsPageInterface,
    directToObject?: A32NXDirectToBuilder,
    wptsListIndex = 0,
    isRadialInPilotEntered = false,
  ) {
    const plan = mcdu.flightPlanService.active;

    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.DirectToPage;
    mcdu.returnPageCallback = () => {
      CDUDirectToPage.ShowPage(mcdu, directToObject, wptsListIndex, isRadialInPilotEntered);
    };

    mcdu.activeSystem = 'FMGC';

    mcdu.SelfPtr = setTimeout(() => {
      if (mcdu.page.Current === mcdu.page.DirectToPage) {
        CDUDirectToPage.ShowPage(mcdu, directToObject, wptsListIndex, isRadialInPilotEntered);
      }
    }, mcdu.PageTimeout.Medium);

    const title = [new Column(17, plan.flightNumber.get() ?? '', Column.small, Column.right)];

    const defaultRadialIn = this.computeDefaultRadialIn(plan, directToObject?.get());
    const header = this.renderHeader(plan, directToObject?.get(), defaultRadialIn, isRadialInPilotEntered);

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

    mcdu.onLeftInput[0] = this.handleDirToLsk.bind(this, mcdu, directToObject, wptsListIndex);
    mcdu.onLeftInput[1] = this.handleAbeamPtsLsk.bind(this, mcdu, directToObject);

    mcdu.onRightInput[0] = this.handleRadialInLsk.bind(this, mcdu, directToObject, wptsListIndex, defaultRadialIn);
    mcdu.onRightInput[1] = this.handleRadialOutLsk.bind(this, mcdu, directToObject, wptsListIndex);

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

            A32NXDirectToBuilder.toFlightPlanFix(fpIndex).plan(mcdu, newWptsListIndex);

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
    pendingDirTo: DirectTo | undefined,
    defaultRadialIn: number | undefined,
    isRadialInPilotEntered: boolean,
  ): string[][] {
    if (pendingDirTo === undefined) {
      return FormatTemplate([
        [new Column(1, 'DIR TO', Column.small)],
        [new Column(1, '[\xa0\xa0\xa0\xa0\xa0]', Column.cyan)],
      ]);
    }

    let directWaypointIdent = '';
    if (pendingDirTo.isToFlightPlanFix === true) {
      // Don't just fetch the leg at the index, since the plan might've sequenced after this page was called up
      const directToLeg = plan.maybeElementAt(pendingDirTo.flightPlanLegIndex);

      if (directToLeg && !isDiscontinuity(directToLeg)) {
        directWaypointIdent = directToLeg.ident;
      }
    } else {
      directWaypointIdent = pendingDirTo.nonFlightPlanFix.ident;
    }

    if (directWaypointIdent === '') {
      return FormatTemplate([
        [new Column(1, 'DIR TO', Column.small)],
        [new Column(1, '[\xa0\xa0\xa0\xa0\xa0]', Column.cyan)],
      ]);
    }

    let radialInText = '[ ]°';
    if (pendingDirTo.type === DirectToType.RadialIn) {
      radialInText = `${pendingDirTo.courseIn.toFixed(0).padStart(3, '0')}°`;
    } else if (defaultRadialIn !== undefined) {
      radialInText = `${defaultRadialIn.toFixed(0).padStart(3, '0')}°`;
    }

    const radialOutText =
      pendingDirTo.type === DirectToType.RadialOut ? `${pendingDirTo.courseOut.toFixed(0).padStart(3, '0')}°` : '[ ]°';

    return FormatTemplate([
      [new Column(1, 'DIR TO', Column.small), new Column(13, 'RADIAL IN', Column.small)],
      [
        new Column(0, `*${directWaypointIdent}`, Column.cyan),
        new Column(
          21,
          radialInText,
          Column.right,
          Column.cyan,
          !isRadialInPilotEntered && defaultRadialIn !== undefined ? Column.small : Column.big,
        ),
        new Column(
          23,
          pendingDirTo.type === DirectToType.RadialIn || defaultRadialIn !== undefined ? '*' : '',
          Column.right,
          Column.cyan,
        ),
      ],
      [new Column(1, 'WITH', Column.small), new Column(13, 'RADIAL OUT', Column.small)],
      [
        new Column(0, `*ABEAM PTS`, Column.cyan),
        new Column(21, radialOutText, Column.right, Column.cyan, Column.big),
        new Column(23, pendingDirTo.type === DirectToType.RadialOut ? '*' : '\xa0', Column.right, Column.cyan),
      ],
    ]);
  }

  static computeDefaultRadialIn(plan: FlightPlan, directToObject?: DirectTo): number | undefined {
    if (!directToObject?.isToFlightPlanFix) {
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

  private static async handleDirToLsk(
    mcdu: LegacyFmsPageInterface,
    dirTo: A32NXDirectToBuilder | undefined,
    wptsListIndex: number,
    input: string,
    scratchpadCallback: () => void,
  ) {
    try {
      if (dirTo === undefined) {
        // Non FP direct to
        const w = await WaypointEntryUtils.getOrCreateWaypoint(mcdu, input, false);
        if (w === undefined) {
          mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
          scratchpadCallback();
          return;
        }

        A32NXDirectToBuilder.toNonFlightPlanFix(w).plan(mcdu, wptsListIndex);
      } else {
        if (input === Keypad.clrValue) {
          await dirTo.erase(mcdu);
          CDUDirectToPage.ShowPage(mcdu, undefined, wptsListIndex - 1);

          return;
        }

        await dirTo.insert(mcdu);
      }
    } catch (err: any) {
      if (err.type === undefined) {
        mcdu.logTroubleshootingError(err);
        mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        scratchpadCallback();
        console.error(err);
        return;
      }

      mcdu.showFmsErrorMessage(err.type);
    }
  }

  private static handleAbeamPtsLsk(
    mcdu: LegacyFmsPageInterface,
    dirTo: A32NXDirectToBuilder | undefined,
    _: string,
    scratchpadCallback: () => void,
  ) {
    if (dirTo === undefined) return;

    try {
      dirTo.withAbeams().planAndInsert(mcdu);
    } catch (err: any) {
      if (err.type === undefined) {
        mcdu.logTroubleshootingError(err);
        mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        scratchpadCallback();
        console.error(err);
        return;
      }

      mcdu.showFmsErrorMessage(err.type);
    }
  }

  private static async handleRadialInLsk(
    mcdu: LegacyFmsPageInterface,
    dirTo: A32NXDirectToBuilder | undefined,
    wptsListIndex: number,
    defaultRadialIn: number | undefined,
    input: string,
    scratchpadCallback: () => void,
  ) {
    if (dirTo === undefined) return;

    try {
      if (input === Keypad.clrValue) {
        if (dirTo.type === DirectToType.RadialIn && defaultRadialIn !== undefined) {
          await dirTo.radialIn(defaultRadialIn, false).plan(mcdu, wptsListIndex);
        } else {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
          scratchpadCallback();
        }
      } else if (input === '') {
        // Insert
        if (dirTo.type === DirectToType.RadialIn) {
          await dirTo.insert(mcdu);
        } else if (defaultRadialIn !== undefined) {
          dirTo.radialIn(defaultRadialIn, false).planAndInsert(mcdu);
        }
        return;
      } else if (/^\d{1,3}/.test(input)) {
        const course = parseInt(input);
        if (course > 360) {
          mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          scratchpadCallback();
          return;
        }

        dirTo.radialIn(course, true).plan(mcdu, wptsListIndex);
      } else {
        // TODO this should allow a true course
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
        return;
      }
    } catch (err: any) {
      if (err.type === undefined) {
        mcdu.logTroubleshootingError(err);
        mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        scratchpadCallback();
        console.error(err);
        return;
      }

      mcdu.showFmsErrorMessage(err.type);
    }
  }

  private static async handleRadialOutLsk(
    mcdu: LegacyFmsPageInterface,
    dirTo: A32NXDirectToBuilder | undefined,
    wptsListIndex: number,
    input: string,
    scratchpadCallback: () => void,
  ) {
    if (dirTo === undefined) return;

    try {
      if (input === Keypad.clrValue) {
        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
        scratchpadCallback();
      } else if (input === '' && dirTo.type === DirectToType.RadialOut) {
        await dirTo.insert(mcdu);
      } else if (/^\d{1,3}/.test(input)) {
        // TODO this should allow a true course
        const course = parseInt(input);
        if (course > 360) {
          mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
          scratchpadCallback();
          return;
        }

        dirTo.radialOut(course).plan(mcdu, wptsListIndex);
      } else {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
        return;
      }
    } catch (err: any) {
      if (err.type === undefined) {
        mcdu.logTroubleshootingError(err);
        mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        scratchpadCallback();
        console.error(err);
        return;
      }

      mcdu.showFmsErrorMessage(err.type);
    }
  }
}

class A32NXDirectToBuilder extends DirectToBuilder {
  public static toFlightPlanFix(atIndex: number) {
    return new this({
      type: DirectToType.Normal,
      isToFlightPlanFix: true,
      flightPlanLegIndex: atIndex,
    });
  }

  public static toNonFlightPlanFix(fix: Fix) {
    return new this({
      type: DirectToType.Normal,
      isToFlightPlanFix: false,
      nonFlightPlanFix: fix,
    });
  }

  public erase(mcdu: LegacyFmsPageInterface): Promise<void> {
    return new Promise((res, _) => {
      mcdu.eraseTemporaryFlightPlan(() => {
        res();
      });
    });
  }

  public async plan(mcdu: LegacyFmsPageInterface, wptsListIndex: number): Promise<void> {
    await this.erase(mcdu);
    await mcdu.directTo(this.directToObject);

    CDUDirectToPage.ShowPage(
      mcdu,
      this,
      wptsListIndex,
      this.directToObject.type === DirectToType.RadialIn && this.directToObject.isPilotEntered,
    );
  }

  public async planAndInsert(mcdu: LegacyFmsPageInterface): Promise<void> {
    await this.erase(mcdu);
    await mcdu.directTo(this.directToObject);
    await this.insert(mcdu);
  }

  public async insert(mcdu: LegacyFmsPageInterface): Promise<void> {
    return new Promise((res, rej) => {
      mcdu
        .insertTemporaryFlightPlan(async () => {
          CDUFlightPlanPage.ShowPage(mcdu);

          const oldValidity = SimVar.GetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool');
          if (oldValidity && (this.type === DirectToType.RadialIn || this.type === DirectToType.RadialOut)) {
            // Disengage NAV
            SimVar.SetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool', false);
            await Wait.awaitDelay(300);
            SimVar.SetSimVarValue('L:A32NX_FM_LATERAL_FLIGHTPLAN_AVAIL', 'Bool', true);
          }

          SimVar.SetSimVarValue('K:A32NX.FMGC_DIR_TO_TRIGGER', 'number', 0);
          res();
        })
        .catch((err) => rej(err));
    });
  }
}
