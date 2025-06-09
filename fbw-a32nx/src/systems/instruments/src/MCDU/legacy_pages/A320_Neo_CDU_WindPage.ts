// @ts-strict-ignore
import { getSimBriefOfp } from '../legacy/A32NX_Core/A32NX_ATSU';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import {
  formatWindAltitude,
  formatWindEntry,
  formatWindVector,
  PropagatedWindEntry,
  PropagationType,
  WindEntry,
  WindVector,
} from '@fmgc/flightplanning/data/wind';
import { BaseFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { Vec2Math } from '@microsoft/msfs-sdk';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { FmgcFlightPhase } from '@shared/flightphase';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { FpmConfigs } from '@fmgc/flightplanning/FpmConfig';

export class CDUWindPage {
  static readonly WindCache: PropagatedWindEntry[] = [];

  static Return() {}

  static ShowPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex) {
    const phase = mcdu.flightPhaseManager.phase;

    switch (phase) {
      case FmgcFlightPhase.Preflight:
      case FmgcFlightPhase.Takeoff:
      case FmgcFlightPhase.Climb:
        CDUWindPage.ShowCLBPage(mcdu, forPlan);
        break;
      case FmgcFlightPhase.Cruise:
        CDUWindPage.ShowCRZPage(mcdu, forPlan, this.findNextCruiseLegIndex(mcdu.getFlightPlan(forPlan), 0));
        break;
      case FmgcFlightPhase.Descent:
      case FmgcFlightPhase.Approach:
      case FmgcFlightPhase.GoAround:
      case FmgcFlightPhase.Done:
      default:
        CDUWindPage.ShowDESPage(mcdu, forPlan);
    }
  }

  static ShowCLBPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.ClimbWind;

    const plan = mcdu.getFlightPlan(forPlan);

    let requestButton = 'REQUEST*[color]amber';
    let requestEnable = true;
    if (mcdu.simbrief.sendStatus === 'REQUESTING') {
      requestEnable = false;
      requestButton = 'REQUEST [color]amber';
    }

    const phase = mcdu.flightPhaseManager.phase;

    const template = [
      ['CLIMB WIND'],
      ['TRU WIND/ALT', phase === FmgcFlightPhase.Preflight ? 'HISTORY\xa0[color]inop' : ''],
      ['', 'WIND>[color]inop'],
      ['', 'WIND/TEMP{sp}[color]amber'],
      ['', requestButton],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', 'NEXT{sp}'],
      ['', 'PHASE>'],
      ['', ''],
      ['', ''],
    ];

    let numEntries = 0;
    for (let i = 0; i < Math.min(plan.performanceData.climbWindEntries.length, 5); i++) {
      const wind = plan.performanceData.climbWindEntries[i];

      template[i * 2 + 2][0] = `${formatWindEntry(wind)}[color]${phase < FmgcFlightPhase.Climb ? 'cyan' : 'green'}`;

      numEntries = i + 1;
      if (phase < FmgcFlightPhase.Climb) {
        mcdu.onLeftInput[i] = async (value, scratchpadCallback) => {
          try {
            if (value === Keypad.clrValue) {
              await mcdu.flightPlanService.setClimbWindEntry(wind.altitude, null, forPlan);
            } else {
              const entry = this.parseWindEntryEdit(mcdu, value, wind);

              if (entry === null) {
                scratchpadCallback();
                return;
              }

              await mcdu.flightPlanService.setClimbWindEntry(wind.altitude, entry, forPlan);
            }

            CDUWindPage.ShowCLBPage(mcdu, forPlan);
          } catch (e) {
            console.error('Error updating climb wind entry:', e);
            mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
            scratchpadCallback();
          }
        };
      }
    }

    if (plan.performanceData.climbWindEntries.length < 5 && phase < FmgcFlightPhase.Climb) {
      template[numEntries * 2 + 2][0] = '{cyan}[ ]°/[ ]/[{sp}{sp}{sp}]{end}';

      mcdu.onLeftInput[numEntries] = async (value, scratchpadCallback) => {
        try {
          const entry = this.parseWindEntry(mcdu, value);

          if (entry === null) {
            scratchpadCallback();
            return;
          }

          await mcdu.flightPlanService.setClimbWindEntry(entry.altitude, entry, forPlan);

          CDUWindPage.ShowCLBPage(mcdu, forPlan);
        } catch (e) {
          console.error('Error adding climb wind entry:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
          scratchpadCallback();
        }
      };
    }

    mcdu.setTemplate(template);

    mcdu.onRightInput[4] = () => {
      const nextCruiseLegIndex = this.findNextCruiseLegIndex(plan, 0);
      if (nextCruiseLegIndex >= 0) {
        CDUWindPage.ShowCRZPage(mcdu, forPlan, nextCruiseLegIndex);
      } else {
        CDUWindPage.ShowDESPage(mcdu, forPlan);
      }
    };

    mcdu.onRightInput[1] = async () => {
      if (requestEnable) {
        try {
          await mcdu.uplinkWinds(forPlan);
        } catch (e) {
          console.error('Error requesting winds:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        }

        CDUWindPage.ShowCLBPage(mcdu, forPlan);
      }
    };
  }

  private static findNextCruiseLegIndex(plan: BaseFlightPlan, fromIndex: number): number {
    // Find the first cruise leg index starting from the given index
    for (let i = fromIndex; i < plan.firstMissedApproachLegIndex; i++) {
      const leg = plan.maybeElementAt(i);

      if (leg?.isDiscontinuity === false && leg.isXF() && leg.segment.class === SegmentClass.Enroute) {
        return i;
      }
    }
    return -1; // Return -1 if no cruise leg is found
  }

  private static findPreviousCruiseLegIndex(plan: BaseFlightPlan, fromIndex: number): number {
    // Find the first cruise leg index starting from the given index
    for (let i = fromIndex; i >= 0; i--) {
      const leg = plan.maybeElementAt(i);

      if (leg?.isDiscontinuity === false && leg.isXF() && leg.segment.class === SegmentClass.Enroute) {
        return i;
      }
    }
    return -1; // Return -1 if no cruise leg is found
  }

  static async ShowCRZPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, fpIndex: number) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.CruiseWind;

    let requestButton = 'REQUEST*[color]amber';
    let requestEnable = true;
    if (mcdu.simbrief.sendStatus === 'REQUESTING') {
      requestEnable = false;
      requestButton = 'REQUEST [color]amber';
    }

    const plan = mcdu.getFlightPlan(forPlan);
    // TODO handle non-leg gracefully
    const leg = plan.legElementAt(fpIndex);

    const winds = mcdu.flightPlanService.propagateWindsAt(fpIndex, this.WindCache, forPlan);
    const maxCruiseWindEntries = 4;

    const canGoToPrevPhase = mcdu.flightPhaseManager.phase < FmgcFlightPhase.Cruise;

    const prevPhaseText = canGoToPrevPhase ? 'PREV{sp}' : '';
    const prevPhaseButton = canGoToPrevPhase ? 'PHASE>' : '';

    const template = [
      ['CRZ WIND'],
      ['', '', `AT {green}{big}${(leg.ident ?? '').padEnd(7, '\xa0')}{end}{end}`],
      ['', ''],
      ['TRU WIND/ALT', 'WIND/TEMP{sp}[color]amber'],
      ['', requestButton],
      ['', ''],
      ['', ''],
      ['', prevPhaseText],
      ['', prevPhaseButton],
      ['', 'NEXT{sp}'],
      ['', 'PHASE>'],
      ['', ''],
      ['<RETURN', ''],
    ];

    let numEntries = 0;
    for (let i = 0; i < winds.length; i++) {
      const wind = winds[i];

      switch (wind.type) {
        case PropagationType.Forward:
          template[i * 2 + 4][0] =
            `{small}${formatWindVector(wind.vector)}{end}/${formatWindAltitude(wind)}[color]cyan`;
          break;
        case PropagationType.Entry:
          template[i * 2 + 4][0] = `${formatWindVector(wind.vector)}/${formatWindAltitude(wind)}[color]cyan`;
          break;
        case PropagationType.Backward:
          template[i * 2 + 4][0] = `[\xa0]°/[\xa0]/${formatWindAltitude(wind)}[color]cyan`;
          break;
      }

      numEntries = i + 1;
      mcdu.onLeftInput[i + 1] = async (value, scratchpadCallback) => {
        try {
          if (value === Keypad.clrValue) {
            // Cannot delete a propagated wind entry
            if (wind.type !== PropagationType.Entry) {
              mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
              scratchpadCallback();
              return;
            }

            await mcdu.flightPlanService.deleteCruiseWindEntry(fpIndex, wind.altitude, forPlan);
          } else {
            const entry = this.parseWindEntryEdit(mcdu, value, wind);

            if (entry === null) {
              scratchpadCallback();
              return;
            }

            await mcdu.flightPlanService.editCruiseWindEntry(fpIndex, wind.altitude, entry, forPlan);
          }

          CDUWindPage.ShowCRZPage(mcdu, forPlan, fpIndex);
        } catch (e) {
          console.error('Error deleting cruise wind entry:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
          scratchpadCallback();
        }
      };
    }

    if (numEntries < maxCruiseWindEntries) {
      template[numEntries * 2 + 4][0] = '{cyan}[ ]°/[ ]/[{sp}{sp}{sp}]{end}';

      mcdu.onLeftInput[numEntries + 1] = async (value, scratchpadCallback) => {
        const entry = this.parseWindEntry(mcdu, value);

        if (entry === null) {
          scratchpadCallback();
          return;
        }

        try {
          await mcdu.flightPlanService.addCruiseWindEntry(fpIndex, entry, forPlan);

          CDUWindPage.ShowCRZPage(mcdu, forPlan, fpIndex);
        } catch (e) {
          console.error('Error adding cruise wind entry:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
          scratchpadCallback();
        }
      };
    }

    mcdu.setTemplate(template);

    if (canGoToPrevPhase) {
      mcdu.onRightInput[3] = () => {
        CDUWindPage.ShowCLBPage(mcdu, forPlan);
      };
    }

    mcdu.onRightInput[4] = () => {
      CDUWindPage.ShowDESPage(mcdu, forPlan);
    };

    mcdu.onLeftInput[5] = () => {
      CDUWindPage.Return();
    };

    mcdu.onRightInput[1] = async () => {
      if (requestEnable) {
        try {
          await mcdu.uplinkWinds(forPlan);
        } catch (e) {
          console.error('Error requesting winds:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        }

        CDUWindPage.ShowCRZPage(mcdu, forPlan, fpIndex);
      }
    };

    const previousCruiseLegIndex = this.findPreviousCruiseLegIndex(plan, fpIndex - 1);
    const nextCruiseLegIndex = this.findNextCruiseLegIndex(plan, fpIndex + 1);

    const allowScrollingDown = previousCruiseLegIndex >= 0 && previousCruiseLegIndex < fpIndex;
    const allowScrollingUp = nextCruiseLegIndex >= 0 && nextCruiseLegIndex > fpIndex;

    if (allowScrollingUp) {
      mcdu.onUp = () => this.ShowCRZPage(mcdu, forPlan, nextCruiseLegIndex);
    }

    if (allowScrollingDown) {
      mcdu.onDown = () => this.ShowCRZPage(mcdu, forPlan, previousCruiseLegIndex);
    }

    // TODO temperature entries
    mcdu.onNextPage = () => mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
    mcdu.onPrevPage = () => mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);

    mcdu.setArrows(allowScrollingUp, allowScrollingDown, true, true);
  }

  static ShowDESPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, page: number = 0) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.DescentWind;

    const plan = mcdu.getFlightPlan(forPlan);

    const alternateAirport = plan ? plan.alternateDestinationAirport : undefined;

    let requestButton = 'REQUEST*[color]amber';
    let requestEnable = true;
    if (mcdu.simbrief.sendStatus === 'REQUESTING') {
      requestEnable = false;
      requestButton = 'REQUEST [color]amber';
    }

    const template = [
      ['DESCENT WIND'],
      ['TRU WIND/ALT', ''],
      ['', ''],
      ['', 'WIND/TEMP{sp}[color]amber'],
      ['', requestButton],
      ['', ''],
      ['', ''],
      ['', 'PREV{sp}'],
      ['', 'PHASE>'],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
    ];

    const numDescentWindEntriesPerPage = 6;
    const maxNumDescentWindEntries = FpmConfigs.A320_HONEYWELL_H3.NUM_DESCENT_WIND_LEVELS;

    // How many rows of e.g "120°/20/FL220" are shown on this page
    const numWindEntriesOnPage = Math.max(
      0,
      Math.min(
        plan.performanceData.descentWindEntries.length - page * numDescentWindEntriesPerPage,
        numDescentWindEntriesPerPage,
      ),
    );

    for (let i = 0; i < numWindEntriesOnPage; i++) {
      const wind = plan.performanceData.descentWindEntries[i + page * numDescentWindEntriesPerPage];

      template[i * 2 + 2][0] = `${formatWindEntry(wind)}[color]cyan`;

      mcdu.onLeftInput[i] = async (value, scratchpadCallback) => {
        try {
          if (value === Keypad.clrValue) {
            await mcdu.flightPlanService.setDescentWindEntry(wind.altitude, null, forPlan);
          } else {
            const entry = this.parseWindEntryEdit(mcdu, value, wind);

            if (entry === null) {
              scratchpadCallback();
              return;
            }

            await mcdu.flightPlanService.setDescentWindEntry(wind.altitude, entry, forPlan);
          }

          CDUWindPage.ShowDESPage(mcdu, forPlan, page);
        } catch (e) {
          console.error('Error updating descent wind entry:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
          scratchpadCallback();
        }
      };
    }

    // Whether to show "[ ]°/[ ]/[   ]" on this page
    const canAddEntryOnPage =
      plan.performanceData.descentWindEntries.length >= page * numDescentWindEntriesPerPage &&
      plan.performanceData.descentWindEntries.length < (page + 1) * numDescentWindEntriesPerPage &&
      plan.performanceData.descentWindEntries.length < maxNumDescentWindEntries;

    if (canAddEntryOnPage) {
      template[numWindEntriesOnPage * 2 + 2][0] = '{cyan}[ ]°/[ ]/[{sp}{sp}{sp}]{end}';

      mcdu.onLeftInput[numWindEntriesOnPage] = async (value, scratchpadCallback) => {
        const entry = this.parseWindEntry(mcdu, value);

        if (entry === null) {
          scratchpadCallback();
          return;
        }

        try {
          await mcdu.flightPlanService.setDescentWindEntry(entry.altitude, entry, forPlan);

          CDUWindPage.ShowDESPage(mcdu, forPlan, page);
        } catch (e) {
          console.error('Error adding descent wind entry:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
          scratchpadCallback();
        }
      };
    }

    const numWindRowsOnPage = numWindEntriesOnPage + (canAddEntryOnPage ? 1 : 0);
    // Whether to show the alternate wind entry on this page
    const shouldShowAlternateOnPage = alternateAirport && numWindRowsOnPage < numDescentWindEntriesPerPage;

    if (shouldShowAlternateOnPage) {
      template[numWindRowsOnPage * 2 + 1][0] = ' ALTERNATE';
      template[numWindRowsOnPage * 2 + 2][0] =
        plan.performanceData.alternateWind !== null
          ? `${formatWindVector(plan.performanceData.alternateWind)}{small}{green}/FL100{end}{end}[color]cyan`
          : '[\xa0]°/[\xa0]{small}{green}/FL100{end}{end}[color]cyan';

      mcdu.onLeftInput[numWindRowsOnPage] = async (value, scratchpadCallback) => {
        try {
          if (value === Keypad.clrValue) {
            await mcdu.flightPlanService.setAlternateWind(null, forPlan);
          } else {
            const wind = CDUWindPage.parseWindVector(mcdu, value);

            if (wind === null) {
              scratchpadCallback();
              return;
            }

            await mcdu.flightPlanService.setAlternateWind(wind, forPlan);
          }

          CDUWindPage.ShowDESPage(mcdu, forPlan, page);
        } catch (e) {
          console.error('Error updating alternate wind:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
          scratchpadCallback();
        }
      };
    }

    const totalNumRows =
      plan.performanceData.descentWindEntries.length + // e.g "120°/20/FL220"
      (plan.performanceData.descentWindEntries.length < maxNumDescentWindEntries ? 1 : 0) + // e.g "[ ]°/[ ]/[   ]"
      (alternateAirport !== undefined ? 1 : 0); // Alternate wind entry

    const numPages = Math.ceil(totalNumRows / numDescentWindEntriesPerPage);

    const canScrollDown = page > 0;
    const canScrollUp = page < numPages - 1;

    if (canScrollDown) {
      mcdu.onDown = () => {
        CDUWindPage.ShowDESPage(mcdu, forPlan, Math.max(0, page - 1));
      };
    }

    if (canScrollUp) {
      mcdu.onUp = () => {
        CDUWindPage.ShowDESPage(mcdu, forPlan, Math.min(numPages - 1, page + 1));
      };
    }

    mcdu.setArrows(canScrollUp, canScrollDown, true, true);

    mcdu.setTemplate(template);

    mcdu.onRightInput[3] = () => {
      const nextCruiseLegIndex = this.findNextCruiseLegIndex(plan, 0);
      if (nextCruiseLegIndex >= 0) {
        CDUWindPage.ShowCRZPage(mcdu, forPlan, nextCruiseLegIndex);
      } else {
        CDUWindPage.ShowCLBPage(mcdu, forPlan);
      }
    };

    mcdu.onRightInput[1] = async () => {
      if (requestEnable) {
        try {
          await mcdu.uplinkWinds(forPlan);
        } catch (e) {
          console.error('Error requesting winds:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        }

        CDUWindPage.ShowDESPage(mcdu, forPlan, page);
      }
    };

    // TODO temperature entries
    mcdu.onNextPage = () => mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
    mcdu.onPrevPage = () => mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
  }

  private static parseWindEntry(mcdu: LegacyFmsPageInterface, input: string): WindEntry | null {
    const elements = input.split('/', 3);
    if (elements.length !== 3) {
      mcdu.setScratchpadMessage(NXSystemMessages.formatError);
      return null;
    }

    const vector = this.parseWindVector(mcdu, `${elements[0]}/${elements[1]}`);
    if (vector === null) {
      return null;
    }

    const altitude = this.parseWindEntryAltitude(mcdu, elements[2]);
    if (altitude === null) {
      return null;
    }

    return { altitude, vector };
  }

  private static parseWindEntryEdit(
    mcdu: LegacyFmsPageInterface,
    input: string,
    oldEntry: WindEntry,
  ): WindEntry | null {
    const elements = input.split('/');
    if (elements.length === 1) {
      return null;
    } else if (elements.length === 2) {
      // Either "120/40" or "/40"
      if (elements[0] === '') {
        // "/40"
        const altitude = this.parseWindEntryAltitude(mcdu, elements[1]);
        if (altitude === null) {
          return null;
        }

        return {
          altitude,
          vector: oldEntry.vector,
        };
      } else {
        // "120/40"
        const vector = this.parseWindVector(mcdu, input);
        if (vector === null) {
          return null;
        }

        return {
          altitude: oldEntry.altitude,
          vector,
        };
      }
    }

    return this.parseWindEntry(mcdu, input);
  }

  private static parseWindVector(mcdu: LegacyFmsPageInterface, input: string): WindVector | null {
    if (!input.match(/^\d{1,3}\/\d{1,3}$/)) {
      mcdu.setScratchpadMessage(NXSystemMessages.formatError);
      return null;
    }

    const elements = input.split('/');

    const trueDegrees = parseInt(elements[0], 10);
    if (!Number.isFinite(trueDegrees)) {
      mcdu.setScratchpadMessage(NXSystemMessages.formatError);
      return null;
    }

    if (trueDegrees < 0 || trueDegrees > 360) {
      mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return null;
    }

    const magnitude = parseInt(elements[1], 10);
    if (!Number.isFinite(magnitude)) {
      mcdu.setScratchpadMessage(NXSystemMessages.formatError);
      return null;
    }

    if (magnitude < 0 || magnitude > 250) {
      mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return null;
    }

    return Vec2Math.setFromPolar(magnitude, trueDegrees * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create());
  }

  private static parseWindEntryAltitude(mcdu: LegacyFmsPageInterface, input: string): number | null {
    if (!input.match(/^((FL)?\d{1,3}|\d{4,5})$/)) {
      mcdu.setScratchpadMessage(NXSystemMessages.formatError);
      return null;
    }

    let altitude = parseInt(input.replace('FL', ''), 10);
    if (altitude < 1000) {
      altitude *= 100;
    }

    if (!Number.isFinite(altitude)) {
      mcdu.setScratchpadMessage(NXSystemMessages.formatError);
      return null;
    }

    if (altitude < 0 || altitude > 45000) {
      mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
      return null;
    }

    return altitude;
  }

  private static uplinkWinds(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, stage, _showPage: () => void) {
    const plan = mcdu.getFlightPlan(forPlan);

    getSimBriefOfp(
      mcdu,
      () => {},
      () => {
        let windData: WindEntry[] = [];
        let lastAltitude = 0;
        switch (stage) {
          case 'CLB': {
            const clbWpts = mcdu.simbrief.navlog.filter((val) => val.stage === stage);

            // iterate through each clbWpt grabbing the wind data
            clbWpts.forEach((clbWpt, wptIdx) => {
              if (wptIdx === 0) {
                let altIdx = 0;
                // we need to backfill from altitude 0 to below clbWpt.altitude_feet in windData
                while (lastAltitude < clbWpt.altitude_feet) {
                  const altitude = parseInt(clbWpt.wind_data.level[altIdx].altitude);
                  const speed = parseInt(clbWpt.wind_data.level[altIdx].wind_spd);
                  const direction = parseInt(clbWpt.wind_data.level[altIdx].wind_dir);

                  windData.push({
                    altitude: Math.round(altitude / 100) * 100,
                    vector: Vec2Math.setFromPolar(speed, direction * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create()),
                  });

                  lastAltitude = altitude;
                  altIdx++;
                }
              }
              // Now we add the closest wind data to the altitude of the clbWpt
              clbWpt.wind_data.level.forEach((wind, levelIdx) => {
                const altitude = parseInt(wind.altitude);

                let deltaPrevLevel = 0;
                let deltaThisLevel = 0;
                // Look backwards for the closest level
                if (levelIdx > 0 && levelIdx < clbWpt.wind_data.level.length - 1) {
                  deltaPrevLevel = Math.abs(
                    clbWpt.altitude_feet - parseInt(clbWpt.wind_data.level[levelIdx - 1].altitude),
                  );
                  deltaThisLevel = Math.abs(clbWpt.altitude_feet - altitude);
                }

                // Check that altitude isn't backtracking
                if (altitude > lastAltitude && lastAltitude <= clbWpt.altitude_feet) {
                  const idx = deltaPrevLevel > deltaThisLevel ? levelIdx : levelIdx - 1;

                  const idxAltitude = parseInt(clbWpt.wind_data.level[idx].altitude);
                  const direction = parseInt(clbWpt.wind_data.level[idx].wind_dir);
                  const speed = parseInt(clbWpt.wind_data.level[idx].wind_spd);

                  // Check again that we didn't backtrack
                  if (idxAltitude > lastAltitude) {
                    windData.push({
                      altitude: Math.round(idxAltitude / 100) * 100,
                      vector: Vec2Math.setFromPolar(speed, direction * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create()),
                    });
                    lastAltitude = idxAltitude;
                  }
                }
              });
            });

            for (const wind of windData) {
              mcdu.flightPlanService.setClimbWindEntry(wind.altitude, wind, forPlan);
            }

            break;
          }
          case 'CRZ': {
            // FIXME winds implement
            mcdu.simbrief.navlog.forEach((fix) => {
              if (fix.stage !== stage || fix.ident === 'TOC' || fix.ident === 'TOD' || fix.type === 'apt') {
                return;
              }

              const legIndex = plan.findLegIndexByFixIdent(fix.ident);

              if (legIndex < 0) {
                console.warn(`Could not find leg index for fix ${fix.ident} in CRZ stage.`);
                return;
              }

              fix.wind_data.level.forEach((val) => {
                const direction = parseInt(val.wind_dir);
                const speed = parseInt(val.wind_spd);
                const altitude = parseInt(val.altitude) / 100;

                mcdu.flightPlanService.addCruiseWindEntry(
                  legIndex,
                  {
                    altitude: Math.round(altitude) * 100,
                    vector: Vec2Math.setFromPolar(speed, direction * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create()),
                  },
                  forPlan,
                );

                lastAltitude = altitude;
              });
            });
            break;
          }
          case 'DSC': {
            // TOD is marked as cruise stage, but we want it's topmost wind data
            const tod = mcdu.simbrief.navlog.find((val) => val.ident === 'TOD');
            const desWpts = [tod, ...mcdu.simbrief.navlog.filter((val) => val.stage === stage)];

            if (isFinite(mcdu.simbrief.alternateAvgWindDir) && isFinite(mcdu.simbrief.alternateAvgWindSpd)) {
              plan.performanceData.alternateWind = Vec2Math.setFromPolar(
                mcdu.simbrief.alternateAvgWindSpd,
                mcdu.simbrief.alternateAvgWindDir * MathUtils.DEGREES_TO_RADIANS,
                Vec2Math.create(),
              );
            } else {
              plan.performanceData.alternateWind = null;
            }
            // iterate through each clbWpt grabbing the wind data
            windData = [];
            lastAltitude = 45000;
            desWpts.forEach((desWpt, wptIdx) => {
              if (wptIdx === 0) {
                let altIdx = desWpt.wind_data.level.length - 1;
                // we need to backfill from crz altitude to above next clbWpt.altitude_feet in windData
                while (lastAltitude > desWpt.altitude_feet) {
                  const altitude = parseInt(desWpt.wind_data.level[altIdx].altitude);
                  const speed = parseInt(desWpt.wind_data.level[altIdx].wind_spd);
                  const direction = parseInt(desWpt.wind_data.level[altIdx].wind_dir);

                  windData.push({
                    altitude: Math.round(altitude / 100) * 100,
                    vector: Vec2Math.setFromPolar(speed, direction * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create()),
                  });

                  lastAltitude = altitude;
                  altIdx--;
                }
              }
              // Now we add the closest wind data to the altitude of the desWpt
              desWpt.wind_data.level.reverse().forEach((wind, levelIdx) => {
                const altitude = parseInt(wind.altitude);

                let deltaNextLevel = 0;
                let deltaThisLevel = 0;
                // Look forwards for the closest level
                if (levelIdx < desWpt.wind_data.level.length - 2) {
                  deltaNextLevel = Math.abs(
                    desWpt.altitude_feet - parseInt(desWpt.wind_data.level[levelIdx + 1].altitude),
                  );
                  deltaThisLevel = Math.abs(desWpt.altitude_feet - altitude);
                }

                // Check that altitude isn't backtracking
                if (altitude >= lastAltitude && lastAltitude > desWpt.altitude_feet) {
                  const idx = deltaNextLevel > deltaThisLevel ? levelIdx : levelIdx + 1;

                  const idxAltitude = parseInt(desWpt.wind_data.level[idx].altitude);
                  const direction = parseInt(desWpt.wind_data.level[idx].wind_dir);
                  const speed = parseInt(desWpt.wind_data.level[idx].wind_spd);

                  // Check again that we didn't backtrack
                  if (idxAltitude < lastAltitude) {
                    windData.push({
                      altitude: Math.round(idxAltitude / 100) * 100,
                      vector: Vec2Math.setFromPolar(speed, direction * MathUtils.DEGREES_TO_RADIANS, Vec2Math.create()),
                    });
                    lastAltitude = idxAltitude;
                  }
                }
              });
            });

            for (const wind of windData) {
              mcdu.flightPlanService.setDescentWindEntry(wind.altitude, wind, forPlan);
            }

            break;
          }
        }
        _showPage();
      },
    );
  }
}
