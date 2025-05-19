// @ts-strict-ignore
import { getSimBriefOfp } from '../legacy/A32NX_Core/A32NX_ATSU';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { PropagatedWindEntry, PropagationType, WindEntry, WindVector } from '@fmgc/flightplanning/data/wind';
import { BaseFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';

export class CDUWindPage {
  static readonly WindCache: PropagatedWindEntry[] = [];

  static Return() {}

  static ShowPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex) {
    CDUWindPage.ShowCLBPage(mcdu, forPlan);
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

    const template = [
      ['CLIMB WIND'],
      ['TRU WIND/ALT', 'HISTORY\xa0[color]inop'],
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

      template[i * 2 + 2][0] =
        `${wind.trueDegrees.toFixed(0).padStart(3, '0')}°/${wind.magnitude.toFixed(0).padStart(3, '0')}/FL${(wind.altitude / 100).toFixed(0).padStart(3, '0')}[color]cyan`;

      numEntries = i + 1;
      mcdu.onLeftInput[i] = async (value, scratchpadCallback) => {
        if (value === Keypad.clrValue) {
          await mcdu.flightPlanService.setClimbWindEntry(wind.altitude, null, forPlan);

          CDUWindPage.ShowCLBPage(mcdu, forPlan);
        } else {
          const entry = this.parseTrueWindEntry(value);

          if (entry === null) {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
            return;
          }

          await mcdu.flightPlanService.setClimbWindEntry(wind.altitude, entry, forPlan);

          CDUWindPage.ShowCLBPage(mcdu, forPlan);
        }
      };
    }

    if (plan.performanceData.climbWindEntries.length < 5) {
      template[numEntries * 2 + 2][0] = '{cyan}[ ]°/[ ]/[{sp}{sp}{sp}]{end}';

      mcdu.onLeftInput[numEntries] = async (value, scratchpadCallback) => {
        const entry = this.parseTrueWindEntry(value);

        if (entry === null) {
          mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          scratchpadCallback();
          return;
        }

        await mcdu.flightPlanService.setClimbWindEntry(entry.altitude, entry, forPlan);

        CDUWindPage.ShowCLBPage(mcdu, forPlan);
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

    mcdu.onRightInput[1] = () => {
      if (requestEnable) {
        CDUWindPage.uplinkWinds(mcdu, forPlan, 'CLB', CDUWindPage.ShowCLBPage);
      }
    };
  }

  private static findNextCruiseLegIndex(plan: BaseFlightPlan, fromIndex: number): number {
    // Find the first cruise leg index starting from the given index
    for (let i = fromIndex; i < plan.firstMissedApproachLegIndex; i++) {
      const leg = plan.maybeElementAt(i);

      if (leg?.isDiscontinuity === false && leg.isXF()) {
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

    const winds = await mcdu.flightPlanService.propagateWindsAt(fpIndex, this.WindCache, forPlan);
    const maxCruiseWindEntries = 4;

    const template = [
      ['CRZ WIND'],
      ['', '', `AT {green}{big}${(leg.ident ?? '').padEnd(7, '\xa0')}{end}{end}`],
      ['', ''],
      ['TRU WIND/ALT', 'WIND/TEMP{sp}[color]amber'],
      ['', requestButton],
      ['', ''],
      ['', ''],
      ['', 'PREV{sp}'],
      ['', 'PHASE>'],
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
            `{small}${wind.trueDegrees.toFixed(0).padStart(3, '0')}°/${wind.magnitude.toFixed(0).padStart(3, '0')}{end}/FL${(wind.altitude / 100).toFixed(0).padStart(3, '0')}[color]cyan`;
          break;
        case PropagationType.Entry:
          template[i * 2 + 4][0] =
            `${wind.trueDegrees.toFixed(0).padStart(3, '0')}°/${wind.magnitude.toFixed(0).padStart(3, '0')}/FL${(wind.altitude / 100).toFixed(0).padStart(3, '0')}[color]cyan`;
          break;
        case PropagationType.Backward:
          template[i * 2 + 4][0] = `[\xa0]°/[\xa0]/FL${(wind.altitude / 100).toFixed(0).padStart(3, '0')}[color]cyan`;
          break;
      }

      numEntries = i + 1;
      mcdu.onLeftInput[i + 1] = async (value, scratchpadCallback) => {
        if (value === Keypad.clrValue) {
          if (wind.type !== PropagationType.Entry) {
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
            scratchpadCallback();
            return;
          }

          await mcdu.flightPlanService.deleteCruiseWindEntry(fpIndex, wind.altitude, forPlan);

          CDUWindPage.ShowCRZPage(mcdu, forPlan, fpIndex);
        } else {
          const entry = this.parseTrueWindEntry(value);

          if (entry === null) {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
            return;
          }

          await mcdu.flightPlanService.editCruiseWindEntry(fpIndex, wind.altitude, entry, forPlan);

          CDUWindPage.ShowCRZPage(mcdu, forPlan, fpIndex);
        }
      };
    }

    if (numEntries < maxCruiseWindEntries) {
      template[numEntries * 2 + 4][0] = '{cyan}[ ]°/[ ]/[{sp}{sp}{sp}]{end}';

      mcdu.onLeftInput[numEntries + 1] = async (value, scratchpadCallback) => {
        const entry = this.parseTrueWindEntry(value);

        if (entry === null) {
          mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          scratchpadCallback();
          return;
        }

        await mcdu.flightPlanService.addCruiseWindEntry(fpIndex, entry, forPlan);

        CDUWindPage.ShowCRZPage(mcdu, forPlan, fpIndex);
      };
    }

    mcdu.setTemplate(template);

    mcdu.onRightInput[3] = () => {
      CDUWindPage.ShowCLBPage(mcdu, forPlan);
    };
    mcdu.onRightInput[4] = () => {
      CDUWindPage.ShowDESPage(mcdu, forPlan);
    };

    mcdu.onLeftInput[5] = () => {
      CDUWindPage.Return();
    };

    mcdu.onRightInput[1] = () => {
      if (requestEnable) {
        CDUWindPage.uplinkWinds(mcdu, forPlan, 'CRZ', CDUWindPage.ShowCRZPage);
      }
    };

    const previousCruiseLegIndex = this.findNextCruiseLegIndex(plan, 0);
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

  static ShowDESPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, offset = 0) {
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

    if (alternateAirport) {
      const rowIndex = Math.min(plan.performanceData.descentWindEntries.length * 2 + 3, 11);
      const lskIndex = Math.min(plan.performanceData.descentWindEntries.length + 1, 5);

      template[rowIndex][0] = ' ALTERNATE';
      template[rowIndex + 1][0] =
        plan.performanceData.alternateWind !== null
          ? `${plan.performanceData.alternateWind.trueDegrees.toFixed(0).padStart(3, '0')}°/${plan.performanceData.alternateWind.magnitude.toFixed(0).padStart(3, '0')}{small}{green}/FL100{end}{end}[color]cyan`
          : '[\xa0]°/[\xa0]{small}{green}/FL100{end}{end}[color]cyan';

      mcdu.onLeftInput[lskIndex] = async (value, scratchpadCallback) => {
        if (value === Keypad.clrValue) {
          await mcdu.flightPlanService.setAlternateWind(null, forPlan);

          CDUWindPage.ShowDESPage(mcdu, forPlan, offset);
        } else {
          const wind = CDUWindPage.parseWindVector(value);

          if (wind === null) {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
            return;
          }

          await mcdu.flightPlanService.setAlternateWind(wind, forPlan);

          CDUWindPage.ShowDESPage(mcdu, forPlan, offset);
        }
      };
    }

    const numDescentWindEntriesPerPage = 5;

    let numEntries = 0;
    for (
      let i = 0;
      i < Math.min(plan.performanceData.descentWindEntries.length - offset, numDescentWindEntriesPerPage);
      i++
    ) {
      const wind = plan.performanceData.descentWindEntries[i + offset];

      template[i * 2 + 2][0] =
        `${wind.trueDegrees.toFixed(0).padStart(3, '0')}°/${wind.magnitude.toFixed(0).padStart(3, '0')}/FL${(wind.altitude / 100).toFixed(0).padStart(3, '0')}[color]cyan`;

      numEntries = i + 1;
      mcdu.onLeftInput[i] = async (value, scratchpadCallback) => {
        if (value === Keypad.clrValue) {
          await mcdu.flightPlanService.setDescentWindEntry(wind.altitude, null, forPlan);

          CDUWindPage.ShowDESPage(mcdu, forPlan, offset);
        } else {
          const entry = this.parseTrueWindEntry(value);

          if (entry === null) {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
            return;
          }

          await mcdu.flightPlanService.setDescentWindEntry(wind.altitude, entry, forPlan);

          CDUWindPage.ShowDESPage(mcdu, forPlan, offset);
        }
      };
    }

    if (plan.performanceData.descentWindEntries.length < 10) {
      template[numEntries * 2 + 2][0] = '{cyan}[ ]°/[ ]/[{sp}{sp}{sp}]{end}';

      mcdu.onLeftInput[numEntries] = (value, scratchpadCallback) => {
        const entry = this.parseTrueWindEntry(value);

        if (entry === null) {
          mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          scratchpadCallback();
          return;
        }

        mcdu.flightPlanService.setDescentWindEntry(entry.altitude, entry, forPlan);

        CDUWindPage.ShowDESPage(mcdu, forPlan, offset);
      };
    }

    const canScrollDown =
      plan.performanceData.descentWindEntries.length > numDescentWindEntriesPerPage - 1 && offset > 0;
    const canScrollUp = offset < plan.performanceData.descentWindEntries.length - (numDescentWindEntriesPerPage - 1);

    if (canScrollDown) {
      mcdu.onDown = () => {
        CDUWindPage.ShowDESPage(mcdu, forPlan, offset - 1);
      };
    }

    if (canScrollUp) {
      mcdu.onUp = () => {
        CDUWindPage.ShowDESPage(mcdu, forPlan, offset + 1);
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

    mcdu.onRightInput[1] = () => {
      if (requestEnable) {
        CDUWindPage.uplinkWinds(mcdu, forPlan, 'DSC', CDUWindPage.ShowDESPage);
      }
    };

    // TODO temperature entries
    mcdu.onNextPage = () => mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
    mcdu.onPrevPage = () => mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
  }

  private static parseTrueWindEntry(input: string): WindEntry | null {
    const elements = input.split('/');
    if (elements.length != 3) {
      return null;
    }

    let trueDegrees = parseInt(elements[0]);
    if (trueDegrees === 360) {
      trueDegrees = 0;
    }
    if (!Number.isFinite(trueDegrees) || trueDegrees < 0 || trueDegrees > 359) {
      return null;
    }

    const magnitude = parseInt(elements[1]);
    if (!Number.isFinite(magnitude) || magnitude < 0 || magnitude > 999) {
      return null;
    }

    let altitude = parseInt(elements[2]);
    if (altitude < 1000) {
      altitude *= 100;
    }

    if (!Number.isFinite(altitude) || altitude < 0 || altitude > 45000) {
      return null;
    }

    return {
      trueDegrees,
      magnitude,
      altitude,
    };
  }

  private static parseWindVector(input: string): WindVector | null {
    const elements = input.split('/');
    if (elements.length != 2) {
      return null;
    }

    let trueDegrees = parseInt(elements[0]);
    if (trueDegrees === 360) {
      trueDegrees = 0;
    }
    if (!Number.isFinite(trueDegrees) || trueDegrees < 0 || trueDegrees > 359) {
      return null;
    }

    const magnitude = parseInt(elements[1]);
    if (!Number.isFinite(magnitude) || magnitude < 0 || magnitude > 999) {
      return null;
    }

    return {
      trueDegrees,
      magnitude,
    };
  }

  private static uplinkWinds(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, stage, _showPage) {
    const plan = mcdu.getFlightPlan(forPlan);

    getSimBriefOfp(
      mcdu,
      () => {},
      () => {
        let windData = [];
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
                    direction,
                    speed,
                    altitude: altitude / 100,
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
                      direction,
                      speed,
                      altitude: idxAltitude / 100,
                    });
                    lastAltitude = idxAltitude;
                  }
                }
              });
            });

            plan.performanceData.climbWindEntries = windData;
            break;
          }
          case 'CRZ': {
            // FIXME winds implement
            // const toc = mcdu.simbrief.navlog.find((val) => val.ident === 'TOC');
            // mcdu.winds.cruise = [];
            // toc.wind_data.level.forEach((val) => {
            //   const direction = parseInt(val.wind_dir);
            //   const speed = parseInt(val.wind_spd);
            //   const altitude = parseInt(val.altitude) / 100;
            //   mcdu.winds.cruise.push({
            //     direction,
            //     speed,
            //     altitude,
            //   });
            //   lastAltitude = altitude;
            // });
            break;
          }
          case 'DSC': {
            // TOD is marked as cruise stage, but we want it's topmost wind data
            const tod = mcdu.simbrief.navlog.find((val) => val.ident === 'TOD');
            const desWpts = [tod, ...mcdu.simbrief.navlog.filter((val) => val.stage === stage)];

            if (isFinite(mcdu.simbrief.alternateAvgWindDir) && isFinite(mcdu.simbrief.alternateAvgWindSpd)) {
              plan.performanceData.alternateWind = {
                trueDegrees: mcdu.simbrief.alternateAvgWindDir,
                magnitude: mcdu.simbrief.alternateAvgWindSpd,
              };
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
                    direction,
                    speed,
                    altitude: altitude / 100,
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
                      direction,
                      speed,
                      altitude: idxAltitude / 100,
                    });
                    lastAltitude = idxAltitude;
                  }
                }
              });
            });
            plan.performanceData.descentWindEntries = windData;
            break;
          }
        }
        _showPage(mcdu);
      },
    );
  }
}
