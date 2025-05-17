// @ts-strict-ignore
import { getSimBriefOfp } from '../legacy/A32NX_Core/A32NX_ATSU';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { NXSystemMessages } from '../messages/NXSystemMessages';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { PropagatedWindEntry, PropagationType, WindEntry, WindVector } from '@fmgc/flightplanning/data/wind';
import { BaseFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { FpmConfigs } from '@fmgc/flightplanning/FpmConfig';

export class CDUWindPage {
  static readonly WindCache: PropagatedWindEntry[] = [];

  static Return() {}

  static ShowPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex) {
    CDUWindPage.ShowCLBPage(mcdu, forPlan);
  }

  static ShowCLBPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, offset = 0) {
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
      ['TRU WIND/ALT', 'HISTORY[color]inop'],
      ['', 'WIND>[color]inop'],
      ['', ''],
      ['', ''],
      ['', 'WIND{sp}[color]amber'],
      ['', requestButton],
      ['', ''],
      ['', ''],
      ['', 'NEXT{sp}'],
      ['', 'PHASE>'],
      ['', ''],
      ['<RETURN', ''],
    ];

    mcdu.setTemplate(
      CDUWindPage.ShowWinds(template, mcdu, CDUWindPage.ShowCLBPage, plan.performanceData.climbWindEntries, offset, 5),
    );

    mcdu.onRightInput[4] = () => {
      CDUWindPage.ShowCRZPage(mcdu, forPlan, this.findNextCruiseLegIndex(plan, 0));
    };

    mcdu.onLeftInput[5] = () => {
      CDUWindPage.Return();
    };

    mcdu.onRightInput[2] = () => {
      if (requestEnable) {
        CDUWindPage.WindRequest(mcdu, forPlan, 'CLB', CDUWindPage.ShowCLBPage);
      }
    };
  }

  static findNextCruiseLegIndex(plan: BaseFlightPlan, fromIndex: number): number {
    // Find the first cruise leg index starting from the given index
    for (let i = fromIndex; i < plan.firstMissedApproachLegIndex; i++) {
      const leg = plan.maybeElementAt(i);

      if (leg?.isDiscontinuity === false && leg.isXF()) {
        return i;
      }
    }
    return -1; // Return -1 if no cruise leg is found
  }

  static async ShowCRZPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, fpIndex: number, offset = 0) {
    // FIXME winds - allow wind to be set for each waypoint

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

    const numWinds = await mcdu.flightPlanService.propagateWindsAt(fpIndex, this.WindCache, forPlan);

    const template = [
      [`CRZ WIND {small}AT{end} {green}${leg.ident ?? ''}{end}`],
      ['TRU WIND/ALT', ''],
      ['', ''],
      ['', ''],
      ['', ''],
      ['', 'WIND{sp}[color]amber'],
      ['', requestButton],
      ['', 'PREV{sp}'],
      ['', 'PHASE>'],
      ['{small}SAT / ALT{end}[color]inop', 'NEXT{sp}'],
      ['[ ]°/[{sp}{sp}{sp}][color]inop', 'PHASE>'],
      ['', ''],
      ['<RETURN', ''],
    ];

    // FIXME winds - pass in cruise winds here
    mcdu.setTemplate(
      CDUWindPage.ShowWinds(
        template,
        mcdu,
        CDUWindPage.ShowCRZPage,
        this.WindCache,
        offset,
        Math.min(numWinds + 1, FpmConfigs.A320_HONEYWELL_H3.NUM_CRUISE_WIND_LEVELS),
      ),
    );

    mcdu.onRightInput[3] = () => {
      CDUWindPage.ShowCLBPage(mcdu, forPlan);
    };
    mcdu.onRightInput[4] = () => {
      CDUWindPage.ShowDESPage(mcdu, forPlan);
    };

    mcdu.onLeftInput[5] = () => {
      CDUWindPage.Return();
    };

    mcdu.onRightInput[2] = () => {
      if (requestEnable) {
        CDUWindPage.WindRequest(mcdu, forPlan, 'CRZ', CDUWindPage.ShowCRZPage);
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

    mcdu.setArrows(allowScrollingUp, allowScrollingDown, false, false);
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

    let alternateHeader = '';
    let alternateCell = '';
    let altFLightlevel = '';

    if (alternateAirport) {
      alternateHeader = 'ALTN WIND';
      alternateCell = '[ ]°/[ ][color]cyan';
      altFLightlevel = '{green}{small}FL100{end}{end}';
      if (plan.performanceData.alternateWind != null) {
        alternateCell = `${CDUWindPage.FormatNumber(plan.performanceData.alternateWind.trueDegrees)}°/${CDUWindPage.FormatNumber(plan.performanceData.alternateWind.magnitude)}[color]cyan`;
      }
    }
    const template = [
      ['DESCENT WIND'],
      ['TRU WIND/ALT', alternateHeader],
      ['', alternateCell],
      ['', altFLightlevel],
      ['', ''],
      ['', 'WIND{sp}[color]amber'],
      ['', requestButton],
      ['', 'PREV{sp}'],
      ['', 'PHASE>'],
      ['', ''],
      ['', ''],
      ['', ''],
      ['<RETURN', ''],
    ];

    mcdu.setTemplate(
      CDUWindPage.ShowWinds(
        template,
        mcdu,
        CDUWindPage.ShowDESPage,
        plan.performanceData.descentWindEntries,
        offset,
        5,
      ),
    );

    if (alternateAirport) {
      mcdu.onRightInput[0] = (value, scratchpadCallback) => {
        if (value == Keypad.clrValue) {
          plan.performanceData.alternateWind = null;
          CDUWindPage.ShowDESPage(mcdu, offset);
          return;
        }
        const wind = CDUWindPage.ParseWind(value);
        if (wind == null) {
          mcdu.setScratchpadMessage(NXSystemMessages.formatError);
          scratchpadCallback();
        } else {
          plan.performanceData.alternateWind = wind;
          CDUWindPage.ShowDESPage(mcdu, offset);
        }
      };
    }

    mcdu.onRightInput[3] = () => {
      CDUWindPage.ShowCRZPage(mcdu, forPlan, this.findNextCruiseLegIndex(plan, 0));
    };

    mcdu.onLeftInput[5] = () => {
      CDUWindPage.Return();
    };

    mcdu.onRightInput[2] = () => {
      if (requestEnable) {
        CDUWindPage.WindRequest(mcdu, forPlan, 'DSC', CDUWindPage.ShowDESPage);
      }
    };
  }

  static FormatNumber(n: number, leadingZeroes = 0) {
    let output = `${n.toFixed(0)}`;
    for (let i = 0; i < leadingZeroes; i++) {
      if (n < 10 ** (leadingZeroes - i)) {
        output = `0${output}`;
      }
    }
    return output;
  }

  static ShowWinds(
    rows: string[][],
    mcdu: LegacyFmsPageInterface,
    _showPage: typeof CDUWindPage.ShowCLBPage,
    winds: WindEntry[],
    _offset: number,
    _max = 3,
  ) {
    let entries = 0;
    for (let i = 0; i < winds.length - _offset; i++) {
      if (i < _max) {
        const wind = winds[i + _offset];

        if ('type' in wind) {
          switch (wind.type as PropagationType) {
            case PropagationType.Forward:
              rows[i * 2 + 2][0] =
                `{small}${CDUWindPage.FormatNumber(wind.trueDegrees, 2)}°/${CDUWindPage.FormatNumber(wind.magnitude, 2)}{end}/FL${CDUWindPage.FormatNumber(wind.altitude, 2)}[color]cyan`;
              break;
            case PropagationType.Entry:
              rows[i * 2 + 2][0] =
                `${CDUWindPage.FormatNumber(wind.trueDegrees, 2)}°/${CDUWindPage.FormatNumber(wind.magnitude, 2)}/FL${CDUWindPage.FormatNumber(wind.altitude, 2)}[color]cyan`;
              break;
            case PropagationType.Backward:
              rows[i * 2 + 2][0] = `[\xa0]°/[\xa0]/FL${CDUWindPage.FormatNumber(wind.altitude, 2)}[color]cyan`;
              break;
          }
        } else {
          rows[i * 2 + 2][0] =
            `${CDUWindPage.FormatNumber(wind.trueDegrees, 2)}°/${CDUWindPage.FormatNumber(wind.magnitude, 2)}/FL${CDUWindPage.FormatNumber(wind.altitude, 2)}[color]cyan`;
        }

        entries = i + 1;
        mcdu.onLeftInput[i] = (value) => {
          if (value == Keypad.clrValue) {
            winds.splice(i + _offset, 1);
            _showPage(mcdu, _offset);
          }
        };
      }
    }
    if (entries < _max) {
      rows[entries * 2 + 2][0] = '{cyan}[ ]°/[ ]/[{sp}{sp}{sp}]{end}';
      mcdu.onLeftInput[entries] = (value, scratchpadCallback) => {
        CDUWindPage.TryAddWind(mcdu, winds, value, () => _showPage(mcdu, _offset), scratchpadCallback);
      };
    }

    let up = false;
    let down = false;

    if (winds.length > _max - 1 && _offset > 0) {
      mcdu.onDown = () => {
        _showPage(mcdu, _offset - 1);
      };
      down = true;
    }

    if (_offset < winds.length - (_max - 1)) {
      mcdu.onUp = () => {
        _showPage(mcdu, _offset + 1);
      };
      up = true;
    }

    mcdu.setArrows(up, down, false, false);

    return rows;
  }

  static ParseTrueWindAlt(_input) {
    const elements = _input.split('/');
    if (elements.length != 3) {
      return null;
    }

    let direction = parseInt(elements[0]);
    if (direction == 360) {
      direction = 0;
    }
    if (!isFinite(direction) || direction < 0 || direction > 359) {
      return null;
    }

    const speed = parseInt(elements[1]);
    if (!isFinite(speed) || speed < 0 || speed > 999) {
      return null;
    }

    const altitude = parseInt(elements[2]);
    if (!isFinite(altitude) || altitude < 0 || altitude > 450) {
      return null;
    }

    return {
      direction: direction,
      speed: speed,
      altitude: altitude,
    };
  }

  static TryAddWind(mcdu: LegacyFmsPageInterface, _windArray, _input, _showPage, scratchpadCallback) {
    const data = CDUWindPage.ParseTrueWindAlt(_input);
    if (data == null) {
      mcdu.setScratchpadMessage(NXSystemMessages.formatError);
      scratchpadCallback(_input);
    } else {
      _windArray.push(data);
      _showPage();
    }
  }

  static ParseWind(_input: string): WindVector | null {
    const elements = _input.split('/');
    if (elements.length != 2) {
      return null;
    }

    let direction = parseInt(elements[0]);
    if (direction == 360) {
      direction = 0;
    }
    if (!isFinite(direction) || direction < 0 || direction > 359) {
      return null;
    }

    const magnitude = parseInt(elements[1]);
    if (!isFinite(magnitude) || magnitude < 0 || magnitude > 999) {
      return null;
    }

    return {
      trueDegrees: direction,
      magnitude,
    };
  }

  static WindRequest(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, stage, _showPage) {
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
              if (wptIdx == 0) {
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
              if (wptIdx == 0) {
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
