import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import {
  areWindEntriesTheSame,
  FlightPlanWindEntry,
  FlightPlanWindEntryFlags,
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
import { ProfilePhase } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { isLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';

export class CDUWindPage {
  static readonly WindCache: PropagatedWindEntry[] = [];

  static Return() {}

  static ShowPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex) {
    const phase = mcdu.flightPhaseManager.phase;

    switch (phase) {
      case FmgcFlightPhase.Cruise:
        CDUWindPage.ShowCRZPage(mcdu, forPlan, 0);
        break;
      case FmgcFlightPhase.Descent:
      case FmgcFlightPhase.Approach:
      case FmgcFlightPhase.GoAround:
        CDUWindPage.ShowDESPage(mcdu, forPlan);
        break;
      case FmgcFlightPhase.Preflight:
      case FmgcFlightPhase.Takeoff:
      case FmgcFlightPhase.Climb:
      case FmgcFlightPhase.Done:
      default:
        CDUWindPage.ShowCLBPage(mcdu, forPlan);
        break;
    }
  }

  static ShowCLBPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.ClimbWind;

    const plan = mcdu.getFlightPlan(forPlan);
    const originElevation = plan.originAirport?.location.alt ?? 0;
    const isSec = forPlan >= FlightPlanIndex.FirstSecondary;

    const doesWindUplinkExist = plan.pendingWindUplink.isWindUplinkReadyToInsert();
    const doesClbWindUplinkExist = doesWindUplinkExist && plan.pendingWindUplink.climbWinds !== undefined;
    const isWindUplinkInProgress = plan.pendingWindUplink.isWindUplinkInProgress();

    let requestButton = 'UPLINK*[color]cyan';
    if (!doesWindUplinkExist) {
      requestButton = isWindUplinkInProgress ? 'REQUEST [color]amber' : 'REQUEST*[color]amber';
    }

    const phase = mcdu.flightPhaseManager.phase;
    const canModifyWinds = !doesClbWindUplinkExist && (phase < FmgcFlightPhase.Climb || phase === FmgcFlightPhase.Done);
    const allowHistoryWindAccess = forPlan === FlightPlanIndex.Active && phase === FmgcFlightPhase.Preflight;

    const template = [
      [isSec ? '\xa0SEC\xa0\xa0\xa0CLIMB WIND\xa0\xa0\xa0\xa0\xa0\xa0\xa0' : 'CLIMB WIND'],
      ['TRU WIND/ALT', allowHistoryWindAccess ? 'HISTORY\xa0' : ''],
      ['', allowHistoryWindAccess ? 'WIND>' : ''],
      ['', doesWindUplinkExist ? 'INSERT{sp}[color]cyan' : 'WIND/TEMP{sp}[color]amber'],
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

    const maxNumClimbWindEntries = 5;
    if (isWindUplinkInProgress) {
      for (let i = 0; i < maxNumClimbWindEntries; i++) {
        template[i * 2 + 2][0] = `---°/---/-----`;
      }
    } else {
      const climbWindEntries =
        // Check `plan.pendingWindUplink.climbWinds !== undefined` again to make TS happy
        doesClbWindUplinkExist && plan.pendingWindUplink.climbWinds !== undefined
          ? plan.pendingWindUplink.climbWinds
          : plan.performanceData.climbWindEntries.get();

      let numEntries = 0;
      for (let i = 0; i < Math.min(climbWindEntries.length, maxNumClimbWindEntries); i++) {
        const wind = climbWindEntries[i];

        template[i * 2 + 2][0] =
          wind.flags & FlightPlanWindEntryFlags.InsertedFromHistory
            ? `{small}${formatWindVector(wind.vector)}/${this.formatClimbWindAltitude(plan, wind.altitude)}{end}[color]${canModifyWinds ? 'cyan' : 'green'}`
            : `${formatWindVector(wind.vector)}/${this.formatClimbWindAltitude(plan, wind.altitude)}[color]${canModifyWinds ? 'cyan' : 'green'}`;

        numEntries = i + 1;
        mcdu.onLeftInput[i] = async (value, scratchpadCallback) => {
          if (!canModifyWinds) {
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
            scratchpadCallback();
            return;
          }

          try {
            if (value === Keypad.clrValue) {
              await mcdu.flightPlanService.setClimbWindEntry(wind.altitude, null, forPlan);
            } else {
              const entry = this.parseWindEntryEdit(mcdu, value, wind, originElevation);

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

      if (climbWindEntries.length < 5 && canModifyWinds) {
        template[numEntries * 2 + 2][0] = '{cyan}[ ]°/[ ]/[{sp}{sp}{sp}]{end}';

        mcdu.onLeftInput[numEntries] = async (value, scratchpadCallback) => {
          try {
            const entry = this.parseWindEntry(mcdu, value, originElevation);

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
    }

    mcdu.setTemplate(template);

    if (allowHistoryWindAccess) {
      // HISTORY WIND
      mcdu.onRightInput[0] = async () => {
        CDUWindPage.ShowHistoryPage(mcdu, forPlan);
      };
    }

    // WIND REQUEST
    mcdu.onRightInput[1] = async (value) => {
      if (doesClbWindUplinkExist) {
        if (value === Keypad.clrValue) {
          plan.pendingWindUplink.delete();
          CDUWindPage.ShowCLBPage(mcdu, forPlan);
          return;
        }

        try {
          await mcdu.uplinkWinds(forPlan, () => CDUWindPage.ShowCLBPage(mcdu, forPlan));
        } catch (e) {
          console.error('Error inserting climb wind uplink:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        }
      } else if (!isWindUplinkInProgress) {
        try {
          await mcdu.uplinkWinds(forPlan, () => CDUWindPage.ShowCLBPage(mcdu, forPlan));
        } catch (e) {
          console.error('Error requesting winds:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        }
      }

      if (mcdu.page.Current === mcdu.page.ClimbWind) {
        CDUWindPage.ShowCLBPage(mcdu, forPlan);
      }
    };

    // NEXT PHASE
    mcdu.onRightInput[4] = () => {
      const nextCruiseLegIndex = this.findNextCruiseLegIndex(mcdu, plan, 0);
      if (nextCruiseLegIndex >= 0) {
        CDUWindPage.ShowCRZPage(mcdu, forPlan, nextCruiseLegIndex);
      } else {
        CDUWindPage.ShowDESPage(mcdu, forPlan);
      }
    };
  }

  static async ShowCRZPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, fpIndex: number) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.CruiseWind;

    const plan = mcdu.getFlightPlan(forPlan);
    const isSec = forPlan >= FlightPlanIndex.FirstSecondary;

    // If - for any reason - we cannot find a suitable leg at the requested index or downstream of it, just show the
    // descent wind page instead
    const nextSuitableLegIndex = this.findNextCruiseLegIndex(mcdu, plan, fpIndex);
    if (nextSuitableLegIndex === -1) {
      this.ShowDESPage(mcdu, forPlan);
      return;
    }

    const leg = plan.legElementAt(fpIndex);

    const doesWindUplinkExist = plan.pendingWindUplink.isWindUplinkReadyToInsert();
    const doesCrzWindUplinkExist = doesWindUplinkExist && plan.pendingWindUplink.cruiseWinds !== undefined;
    const isWindUplinkInProgress = plan.pendingWindUplink.isWindUplinkInProgress();

    let requestButton = 'UPLINK*[color]cyan';
    if (!doesWindUplinkExist) {
      requestButton = isWindUplinkInProgress ? 'REQUEST [color]amber' : 'REQUEST*[color]amber';
    }

    const maxNumCruiseWindEntries = 4;

    const phase = mcdu.flightPhaseManager.phase;
    const canGoToPrevPhase = phase < FmgcFlightPhase.Cruise || phase === FmgcFlightPhase.Done;

    const template = [
      [isSec ? '\xa0SEC\xa0\xa0\xa0\xa0CRZ WIND\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0' : 'CRZ WIND'],
      ['', '', `AT {green}{big}${(leg.ident ?? '').padEnd(7, '\xa0')}{end}{end}`],
      ['', ''],
      ['TRU WIND/ALT', doesWindUplinkExist ? 'INSERT{sp}[color]cyan' : 'WIND/TEMP{sp}[color]amber'],
      ['', requestButton],
      ['', ''],
      ['', ''],
      ['', canGoToPrevPhase ? 'PREV{sp}' : ''],
      ['', canGoToPrevPhase ? 'PHASE>' : ''],
      ['', 'NEXT{sp}'],
      ['', 'PHASE>'],
      ['', ''],
      ['<RETURN', ''],
    ];

    if (isWindUplinkInProgress) {
      for (let i = 0; i < maxNumCruiseWindEntries; i++) {
        template[i * 2 + 4][0] = `---°/---/-----`;
      }
    } else if (
      doesCrzWindUplinkExist &&
      plan.pendingWindUplink.cruiseWinds !==
        undefined /** Check `plan.pendingWindUplink.cruiseWinds !== undefined` again to make TS happy */
    ) {
      const winds =
        plan.pendingWindUplink.cruiseWinds.find(
          (fix) =>
            (fix.type === 'waypoint' && fix.fixIdent === leg.ident) ||
            (fix.type === 'latlon' &&
              MathUtils.isAboutEqual(fix.lat, leg.terminationWaypoint()!.location.lat) &&
              MathUtils.isAboutEqual(fix.long, leg.terminationWaypoint()!.location.long)),
        )?.levels ?? [];

      for (let i = 0; i < winds.length; i++) {
        const wind = winds[i];

        template[i * 2 + 4][0] =
          `${formatWindVector(wind.vector)}/${this.formatCruiseWindAltitude(wind.altitude)}[color]green`;

        mcdu.onLeftInput[i + 1] = async (_, scratchpadCallback) => {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
          scratchpadCallback();
          return;
        };
      }
    } else {
      const winds = mcdu.flightPlanService.propagateWindsAt(fpIndex, this.WindCache, forPlan);

      let numEntries = 0;
      for (let i = 0; i < winds.length; i++) {
        const wind = winds[i];

        switch (wind.type) {
          case PropagationType.Forward:
            template[i * 2 + 4][0] =
              `{small}${formatWindVector(wind.vector)}{end}/${this.formatCruiseWindAltitude(wind.altitude)}[color]cyan`;
            break;
          case PropagationType.Entry:
            template[i * 2 + 4][0] =
              `${formatWindVector(wind.vector)}/${this.formatCruiseWindAltitude(wind.altitude)}[color]cyan`;
            break;
          case PropagationType.Backward:
            template[i * 2 + 4][0] = `[\xa0]°/[\xa0]/${this.formatCruiseWindAltitude(wind.altitude)}[color]cyan`;
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
              const entry = this.parseWindEntryEdit(mcdu, value, wind, NaN);

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

      if (numEntries < maxNumCruiseWindEntries) {
        template[numEntries * 2 + 4][0] = '{cyan}[ ]°/[ ]/[{sp}{sp}{sp}]{end}';

        mcdu.onLeftInput[numEntries + 1] = async (value, scratchpadCallback) => {
          const entry = this.parseWindEntry(mcdu, value, NaN);

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

    mcdu.onRightInput[1] = async (value) => {
      if (doesWindUplinkExist && plan.pendingWindUplink.cruiseWinds !== undefined) {
        if (value === Keypad.clrValue) {
          plan.pendingWindUplink.delete();
          CDUWindPage.ShowCRZPage(mcdu, forPlan, fpIndex);
          return;
        }

        try {
          await mcdu.uplinkWinds(forPlan, () => CDUWindPage.ShowCRZPage(mcdu, forPlan, fpIndex));
        } catch (e) {
          console.error('Error inserting cruise wind uplink:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        }
      } else if (!isWindUplinkInProgress) {
        try {
          await mcdu.uplinkWinds(forPlan, () => CDUWindPage.ShowCRZPage(mcdu, forPlan, fpIndex));
        } catch (e) {
          console.error('Error requesting winds:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        }
      }

      if (mcdu.page.Current === mcdu.page.CruiseWind) {
        CDUWindPage.ShowCRZPage(mcdu, forPlan, fpIndex);
      }
    };

    const previousCruiseLegIndex = this.findPreviousCruiseLegIndex(mcdu, plan, fpIndex - 1);
    const nextCruiseLegIndex = this.findNextCruiseLegIndex(mcdu, plan, fpIndex + 1);

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
    const destinationElevation = plan.destinationAirport?.location.alt ?? 0;
    const isSec = forPlan >= FlightPlanIndex.FirstSecondary;

    const doesWindUplinkExist = plan.pendingWindUplink.isWindUplinkReadyToInsert();
    const doesDesWindUplinkExist = doesWindUplinkExist && plan.pendingWindUplink.descentWinds !== undefined;
    const doesAltnWindUplinkExist = doesWindUplinkExist && plan.pendingWindUplink.alternateWind !== undefined;
    const isWindUplinkInProgress = plan.pendingWindUplink.isWindUplinkInProgress();

    let requestButton = 'UPLINK*[color]cyan';
    if (!doesWindUplinkExist) {
      requestButton = isWindUplinkInProgress ? 'REQUEST [color]amber' : 'REQUEST*[color]amber';
    }

    const alternateAirport = plan ? plan.alternateDestinationAirport : undefined;

    const phase = mcdu.flightPhaseManager.phase;
    const canGoToPrevPhase = phase < FmgcFlightPhase.Descent || phase === FmgcFlightPhase.Done;
    const canModifyDesWinds =
      !doesDesWindUplinkExist && (phase < FmgcFlightPhase.Descent || phase === FmgcFlightPhase.Done);

    const template = [
      [isSec ? '\xa0SEC\xa0\xa0DESCENT WIND\xa0\xa0\xa0\xa0\xa0\xa0' : 'DESCENT WIND'],
      ['TRU WIND/ALT', ''],
      ['', ''],
      ['', doesWindUplinkExist ? 'INSERT{sp}[color]cyan' : 'WIND/TEMP{sp}[color]amber'],
      ['', requestButton],
      ['', ''],
      ['', ''],
      ['', canGoToPrevPhase ? 'PREV{sp}' : ''],
      ['', canGoToPrevPhase ? 'PHASE>' : ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
    ];

    const numDescentWindEntriesPerPage = 6;
    const maxNumDescentWindEntries = FpmConfigs.A320_HONEYWELL_H3.NUM_DESCENT_WIND_LEVELS;

    const descentWindEntries =
      // Check `plan.pendingWindUplink.descentWinds !== undefined` again to make TS happy
      doesDesWindUplinkExist && plan.pendingWindUplink.descentWinds !== undefined
        ? plan.pendingWindUplink.descentWinds
        : plan.performanceData.descentWindEntries.get();

    if (isWindUplinkInProgress) {
      for (let i = 0; i < numDescentWindEntriesPerPage; i++) {
        template[i * 2 + 2][0] = `---°/---/-----`;
      }
    } else {
      // How many rows of e.g "120°/20/FL220" are shown on this page
      const numWindEntriesOnPage = Math.max(
        0,
        Math.min(descentWindEntries.length - page * numDescentWindEntriesPerPage, numDescentWindEntriesPerPage),
      );

      for (let i = 0; i < numWindEntriesOnPage; i++) {
        const wind = descentWindEntries[i + page * numDescentWindEntriesPerPage];

        template[i * 2 + 2][0] =
          `${formatWindVector(wind.vector)}/${this.formatDescentWindAltitude(plan, wind.altitude)}[color]${canModifyDesWinds ? 'cyan' : 'green'}`;

        mcdu.onLeftInput[i] = async (value, scratchpadCallback) => {
          if (!canModifyDesWinds) {
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
            scratchpadCallback();
            return;
          }

          try {
            if (value === Keypad.clrValue) {
              await mcdu.flightPlanService.setDescentWindEntry(wind.altitude, null, forPlan);
            } else {
              const entry = this.parseWindEntryEdit(mcdu, value, wind, destinationElevation);

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
        canModifyDesWinds &&
        descentWindEntries.length >= page * numDescentWindEntriesPerPage &&
        descentWindEntries.length < (page + 1) * numDescentWindEntriesPerPage &&
        descentWindEntries.length < maxNumDescentWindEntries;

      if (canAddEntryOnPage) {
        template[numWindEntriesOnPage * 2 + 2][0] = '{cyan}[ ]°/[ ]/[{sp}{sp}{sp}]{end}';

        mcdu.onLeftInput[numWindEntriesOnPage] = async (value, scratchpadCallback) => {
          const entry = this.parseWindEntry(mcdu, value, destinationElevation);

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
        const alternateWind =
          // Check `plan.pendingWindUplink.alternateWind !== undefined` again to make TS happy
          doesAltnWindUplinkExist && plan.pendingWindUplink.alternateWind !== undefined
            ? plan.pendingWindUplink.alternateWind.vector
            : plan.performanceData.alternateWind.get();

        const alternateCruiseLevel = mcdu.computeAlternateCruiseLevel(forPlan);
        const alternateCruiseLevelString =
          alternateCruiseLevel !== undefined
            ? `{small}{green}/FL${alternateCruiseLevel.toFixed(0).padStart(3, '0')}{end}{end}`
            : `{white}/-----{end}`;

        template[numWindRowsOnPage * 2 + 1][0] = ' ALTERNATE';
        template[numWindRowsOnPage * 2 + 2][0] =
          alternateWind !== null
            ? `${formatWindVector(alternateWind)}${alternateCruiseLevelString}[color]${doesAltnWindUplinkExist ? 'green' : 'cyan'}`
            : `[\xa0]°/[\xa0]${alternateCruiseLevelString}[color]cyan`;

        mcdu.onLeftInput[numWindRowsOnPage] = async (value, scratchpadCallback) => {
          // I think you can modify the alternate wind in any phase, but not if an uplink exists
          if (doesAltnWindUplinkExist) {
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
            scratchpadCallback();
            return;
          }

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
    }

    const totalNumRows =
      descentWindEntries.length + // e.g "120°/20/FL220"
      (descentWindEntries.length < maxNumDescentWindEntries ? 1 : 0) + // e.g "[ ]°/[ ]/[   ]"
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

    if (canGoToPrevPhase) {
      mcdu.onRightInput[3] = () => {
        const nextCruiseLegIndex = this.findNextCruiseLegIndex(mcdu, plan, 0);
        if (nextCruiseLegIndex >= 0) {
          CDUWindPage.ShowCRZPage(mcdu, forPlan, nextCruiseLegIndex);
        } else {
          CDUWindPage.ShowCLBPage(mcdu, forPlan);
        }
      };
    }

    mcdu.onRightInput[1] = async (value) => {
      if (doesDesWindUplinkExist) {
        if (value === Keypad.clrValue) {
          plan.pendingWindUplink.delete();
          CDUWindPage.ShowDESPage(mcdu, forPlan, page);
          return;
        }

        try {
          await mcdu.uplinkWinds(forPlan, () => CDUWindPage.ShowDESPage(mcdu, forPlan));
        } catch (e) {
          console.error('Error inserting descent wind uplink:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        }
      } else if (!isWindUplinkInProgress) {
        try {
          await mcdu.uplinkWinds(forPlan, () => CDUWindPage.ShowDESPage(mcdu, forPlan));
        } catch (e) {
          console.error('Error requesting winds:', e);
          mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
        }
      }

      if (mcdu.page.Current === mcdu.page.DescentWind) {
        CDUWindPage.ShowDESPage(mcdu, forPlan, page);
      }
    };

    // TODO temperature entries
    mcdu.onNextPage = () => mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
    mcdu.onPrevPage = () => mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
  }

  static ShowHistoryPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.ClimbWind;

    const plan = mcdu.getFlightPlan(forPlan);
    const cruiseLevel = plan.performanceData.cruiseFlightLevel.get();

    const historyWinds: WindEntry[] = mcdu.getHistoryWinds(cruiseLevel) ?? [];

    historyWinds.sort((a, b) => a.altitude - b.altitude);

    const shouldAllowInsertion =
      historyWinds.length > 0 &&
      !plan.pendingWindUplink.isWindUplinkInProgress() &&
      !plan.pendingWindUplink.isWindUplinkReadyToInsert() &&
      !this.haveHistoryWindsBeenInserted(plan, historyWinds);

    const template = [
      ['HISTORY WIND'],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['<CLIMB WIND', ''],
    ];

    for (let i = 0; i < historyWinds.length; i++) {
      const wind = historyWinds[i];

      if (cruiseLevel !== null && wind.altitude === cruiseLevel * 100) {
        template[i * 2 + 1][0] = '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0CRZ FL';
      }

      template[i * 2 + 2][0] =
        `{small}${formatWindVector(wind.vector)}\xa0\xa0${this.formatCruiseWindAltitude(wind.altitude)}{end}[color]green`;
    }

    // RETURN
    mcdu.onLeftInput[5] = () => {
      this.ShowCLBPage(mcdu, forPlan);
    };

    // INSERT
    if (shouldAllowInsertion) {
      template[12][1] = 'INSERT*[color]amber';

      mcdu.onRightInput[5] = async () => {
        await mcdu.flightPlanService.deleteClimbWindEntries(forPlan);

        for (const wind of historyWinds) {
          const windEntryToInsert: FlightPlanWindEntry = {
            flags: FlightPlanWindEntryFlags.InsertedFromHistory,
            altitude: wind.altitude,
            vector: Vec2Math.copy(wind.vector, Vec2Math.create()),
          };

          await mcdu.flightPlanService.setClimbWindEntry(wind.altitude, windEntryToInsert, forPlan);
        }

        this.ShowCLBPage(mcdu, forPlan);
      };
    }

    mcdu.setTemplate(template);
  }

  private static parseWindEntry(
    mcdu: LegacyFmsPageInterface,
    input: string,
    grndAltitude: number,
  ): FlightPlanWindEntry | null {
    const elements = input.split('/', 3);
    if (elements.length !== 3) {
      mcdu.setScratchpadMessage(NXSystemMessages.formatError);
      return null;
    }

    const vector = this.parseWindVector(mcdu, `${elements[0]}/${elements[1]}`);
    if (vector === null) {
      return null;
    }

    const altitude = this.parseWindEntryAltitude(mcdu, elements[2], grndAltitude);
    if (altitude === null) {
      return null;
    }

    return { altitude, vector, flags: 0 };
  }

  private static parseWindEntryEdit(
    mcdu: LegacyFmsPageInterface,
    input: string,
    oldEntry: WindEntry,
    grndAltitude: number,
  ): FlightPlanWindEntry | null {
    const elements = input.split('/');
    if (elements.length === 1) {
      return null;
    } else if (elements.length === 2) {
      // Either "120/40" or "/40"
      if (elements[0] === '') {
        // "/40"
        const altitude = this.parseWindEntryAltitude(mcdu, elements[1], grndAltitude);
        if (altitude === null) {
          return null;
        }

        return {
          altitude,
          vector: oldEntry.vector,
          flags: 0,
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
          flags: 0,
        };
      }
    }

    return this.parseWindEntry(mcdu, input, grndAltitude);
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

  private static parseWindEntryAltitude(
    mcdu: LegacyFmsPageInterface,
    input: string,
    // The altitude to use if "GRND" is entered as an altitude
    grndAltitude: number = NaN,
  ): number | null {
    if (!input.match(/^((FL)?\d{1,3}|\d{4,5}|GRND)$/)) {
      mcdu.setScratchpadMessage(NXSystemMessages.formatError);
      return null;
    }

    let altitude = grndAltitude;

    if (input !== 'GRND') {
      altitude = parseInt(input.replace('FL', ''), 10);

      if (altitude < 1000) {
        altitude *= 100;
      }
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

  /**
   * Find the index of the first cruise leg in the flight plan downstream of the given index. The search will never start before the active leg index.
   * @param mcdu
   * @param plan the flight plan to search in
   * @param fromIndex the index to start searching from (the search will never start before the active leg index)
   * @returns The index of the next cruise leg, or -1 if no cruise leg is found.
   */
  private static findNextCruiseLegIndex(mcdu: LegacyFmsPageInterface, plan: BaseFlightPlan, fromIndex: number): number {
    const legPredictions =
      plan.index === FlightPlanIndex.Active && mcdu.guidanceController
        ? mcdu.guidanceController.vnavDriver.mcduProfile?.waypointPredictions
        : undefined;

    for (let i = Math.max(fromIndex, plan.activeLegIndex); i < plan.firstMissedApproachLegIndex; i++) {
      const leg = plan.maybeElementAt(i);
      if (!isLeg(leg) || !leg.isXF()) {
        continue;
      }

      const legPrediction = legPredictions?.get(i);
      const isCruiseLeg =
        legPrediction !== undefined
          ? legPrediction.profilePhase === ProfilePhase.Cruise
          : leg.segment.class === SegmentClass.Enroute;

      if (isCruiseLeg) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Find the index of the first cruise leg in the flight plan upstream of the given index. The search will always end at or downstream of the active leg index.
   * @param mcdu
   * @param plan the flight plan to search in
   * @param fromIndex the index to start searching from (the search will always end downstream of the active leg index)
   * @returns The index of the previous cruise leg, or -1 if no cruise leg is found.
   */
  private static findPreviousCruiseLegIndex(
    mcdu: LegacyFmsPageInterface,
    plan: BaseFlightPlan,
    fromIndex: number,
  ): number {
    const legPredictions = mcdu.guidanceController?.vnavDriver.mcduProfile?.waypointPredictions;

    for (let i = fromIndex; i >= Math.max(0, plan.activeLegIndex); i--) {
      const leg = plan.maybeElementAt(i);
      if (!isLeg(leg) || !leg.isXF()) {
        continue;
      }

      const legPrediction = legPredictions?.get(i);
      const isCruiseLeg =
        legPrediction !== undefined
          ? legPrediction.profilePhase === ProfilePhase.Cruise
          : leg.segment.class === SegmentClass.Enroute;

      if (isCruiseLeg) {
        return i;
      }
    }

    return -1;
  }

  private static formatClimbWindAltitude(plan: FlightPlan, alt: number): string {
    const transAlt = plan.performanceData.transitionAltitude.get();
    const originAlt = plan.originAirport?.location.alt;

    const isGnd = originAlt !== undefined && alt <= originAlt + 400;
    const isFl = transAlt !== null && alt > transAlt;

    if (isGnd) {
      return 'GRND';
    } else if (isFl) {
      return `FL${(alt / 100).toFixed(0).padStart(3, '0')}`;
    }

    return (Math.round(alt / 10) * 10).toFixed(0);
  }

  private static formatDescentWindAltitude(plan: FlightPlan, alt: number): string {
    const transLevel = plan.performanceData.transitionLevel.get();
    const destinationAlt = plan.destinationAirport?.location.alt;

    const isGnd = destinationAlt !== undefined && alt <= destinationAlt + 400;
    const isFl = transLevel !== null && alt >= transLevel * 100;

    if (isGnd) {
      return 'GRND';
    } else if (isFl) {
      return `FL${(alt / 100).toFixed(0).padStart(3, '0')}`;
    }

    return (Math.round(alt / 10) * 10).toFixed(0);
  }

  private static formatCruiseWindAltitude(alt: number): string {
    // The cruise page always shows flight levels
    return `FL${(alt / 100).toFixed(0).padStart(3, '0')}`;
  }

  private static haveHistoryWindsBeenInserted(plan: FlightPlan, historyWinds: WindEntry[]) {
    const climbWinds = plan.performanceData.climbWindEntries.get();
    if (climbWinds === null || climbWinds.length !== historyWinds.length) {
      return false;
    }

    return climbWinds.every((wind, i) => areWindEntriesTheSame(wind, historyWinds[i]));
  }
}
