// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ApproachUtils, NXUnits, RunwayUtils } from '@flybywiresim/fbw-sdk';
import { FmgcFlightPhase } from '@shared/flightphase';
import { CDUStepAltsPage } from './A320_Neo_CDU_StepAltsPage';
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FmsFormatters } from '../legacy/FmsFormatters';

export class CDUPerformancePage {
  private static _timer;
  private static _lastPhase;

  static ShowPage(mcdu: LegacyFmsPageInterface, _phase = undefined) {
    mcdu.activeSystem = 'FMGC';

    switch (_phase || mcdu.flightPhaseManager.phase) {
      case FmgcFlightPhase.Preflight:
        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
        break;
      case FmgcFlightPhase.Takeoff:
        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
        break;
      case FmgcFlightPhase.Climb:
        CDUPerformancePage.ShowCLBPage(mcdu);
        break;
      case FmgcFlightPhase.Cruise:
        CDUPerformancePage.ShowCRZPage(mcdu);
        break;
      case FmgcFlightPhase.Descent:
        CDUPerformancePage.ShowDESPage(mcdu);
        break;
      case FmgcFlightPhase.Approach:
        CDUPerformancePage.ShowAPPRPage(mcdu);
        break;
      case FmgcFlightPhase.GoAround:
        CDUPerformancePage.ShowGOAROUNDPage(mcdu);
        break;
    }
  }
  static ShowTAKEOFFPage(mcdu: LegacyFmsPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.PerformancePageTakeoff;
    CDUPerformancePage._timer = 0;
    CDUPerformancePage._lastPhase = mcdu.flightPhaseManager.phase;
    mcdu.pageUpdate = () => {
      CDUPerformancePage._timer++;
      if (CDUPerformancePage._timer >= 50) {
        if (mcdu.flightPhaseManager.phase === CDUPerformancePage._lastPhase) {
          CDUPerformancePage.ShowTAKEOFFPage(mcdu);
        } else {
          CDUPerformancePage.ShowPage(mcdu);
        }
      }
    };

    // TODO SEC F-PLN
    const targetPlan = mcdu.flightPlanService.active;

    let titleColor = 'white';
    if (mcdu.flightPhaseManager.phase === FmgcFlightPhase.Takeoff) {
      titleColor = 'green';
    }

    // check if we even have an airport
    const hasOrigin = !!targetPlan.originAirport;

    // runway
    let runway = '';
    let hasRunway = false;
    if (hasOrigin) {
      const runwayObj = targetPlan.originRunway;

      if (runwayObj) {
        runway = RunwayUtils.runwayString(runwayObj.ident);
        hasRunway = true;
      }
    }

    // v speeds
    let v1 = '---';
    let vR = '---';
    let v2 = '---';
    let v1Check = '{small}\xa0\xa0\xa0{end}';
    let vRCheck = '{small}\xa0\xa0\xa0{end}';
    let v2Check = '{small}\xa0\xa0\xa0{end}';
    if (mcdu.flightPhaseManager.phase < FmgcFlightPhase.Takeoff) {
      v1 = '{amber}___{end}';
      if (mcdu.unconfirmedV1Speed) {
        v1Check = `{small}{cyan}${('' + mcdu.unconfirmedV1Speed).padEnd(3)}{end}{end}`;
      } else if (mcdu.v1Speed) {
        v1 = `{cyan}${('' + mcdu.v1Speed).padEnd(3)}{end}`;
      }
      mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
        if (value === '') {
          if (mcdu.unconfirmedV1Speed) {
            mcdu.v1Speed = mcdu.unconfirmedV1Speed;
            mcdu.unconfirmedV1Speed = undefined;
          } else {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
          }
          CDUPerformancePage.ShowTAKEOFFPage(mcdu);
        } else {
          if (mcdu.trySetV1Speed(value)) {
            CDUPerformancePage.ShowTAKEOFFPage(mcdu);
          } else {
            scratchpadCallback();
          }
        }
      };
      vR = '{amber}___{end}';
      if (mcdu.unconfirmedVRSpeed) {
        vRCheck = `{small}{cyan}${('' + mcdu.unconfirmedVRSpeed).padEnd(3)}{end}{end}`;
      } else if (mcdu.vRSpeed) {
        vR = `{cyan}${('' + mcdu.vRSpeed).padEnd(3)}{end}`;
      }
      mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
        if (value === '') {
          if (mcdu.unconfirmedVRSpeed) {
            mcdu.vRSpeed = mcdu.unconfirmedVRSpeed;
            mcdu.unconfirmedVRSpeed = undefined;
          } else {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
          }
          CDUPerformancePage.ShowTAKEOFFPage(mcdu);
        } else {
          if (mcdu.trySetVRSpeed(value)) {
            CDUPerformancePage.ShowTAKEOFFPage(mcdu);
          } else {
            scratchpadCallback();
          }
        }
      };
      v2 = '{amber}___{end}';
      if (mcdu.unconfirmedV2Speed) {
        v2Check = `{small}{cyan}${('' + mcdu.unconfirmedV2Speed).padEnd(3)}{end}{end}`;
      } else if (mcdu.v2Speed) {
        v2 = `{cyan}${('' + mcdu.v2Speed).padEnd(3)}{end}`;
      }
      mcdu.onLeftInput[2] = (value, scratchpadCallback) => {
        if (value === '') {
          if (mcdu.unconfirmedV2Speed) {
            mcdu.v2Speed = mcdu.unconfirmedV2Speed;
            mcdu.unconfirmedV2Speed = undefined;
          } else {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
          }
          CDUPerformancePage.ShowTAKEOFFPage(mcdu);
        } else {
          if (mcdu.trySetV2Speed(value)) {
            CDUPerformancePage.ShowTAKEOFFPage(mcdu);
          } else {
            scratchpadCallback();
          }
        }
      };
    } else {
      v1 = '\xa0\xa0\xa0';
      vR = '\xa0\xa0\xa0';
      v2 = '\xa0\xa0\xa0';
      if (mcdu.v1Speed) {
        v1 = `{green}${('' + mcdu.v1Speed).padEnd(3)}{end}`;
      }
      if (mcdu.vRSpeed) {
        vR = `{green}${('' + mcdu.vRSpeed).padEnd(3)}{end}`;
      }
      if (mcdu.v2Speed) {
        v2 = `{green}${('' + mcdu.v2Speed).padEnd(3)}{end}`;
      }
      mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
        if (value !== '') {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
          scratchpadCallback();
        }
      };
      mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
        if (value !== '') {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
          scratchpadCallback();
        }
      };
      mcdu.onLeftInput[2] = (value, scratchpadCallback) => {
        if (value !== '') {
          mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
          scratchpadCallback();
        }
      };
    }

    // transition altitude - remains editable during take off
    let transAltCell = '';
    if (hasOrigin) {
      transAltCell = '[\xa0'.padEnd(4, '\xa0') + ']';

      const transAlt = targetPlan.performanceData.transitionAltitude;
      const transAltitudeIsFromDatabase = targetPlan.performanceData.transitionAltitudeIsFromDatabase;

      if (transAlt !== null) {
        transAltCell = `{cyan}${transAlt}{end}`;
        if (transAltitudeIsFromDatabase) {
          transAltCell += '[s-text]';
        }
      }

      mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
        if (mcdu.trySetTakeOffTransAltitude(value)) {
          CDUPerformancePage.ShowTAKEOFFPage(mcdu);
        } else {
          scratchpadCallback();
        }
      };
    }

    // thrust reduction / acceleration altitude
    const altitudeColour = hasOrigin
      ? mcdu.flightPhaseManager.phase >= FmgcFlightPhase.Takeoff
        ? 'green'
        : 'cyan'
      : 'white';

    const plan = mcdu.flightPlanService.active;
    const thrRed = plan.performanceData.thrustReductionAltitude;
    const thrRedPilot = plan.performanceData.thrustReductionAltitudeIsPilotEntered;
    const acc = plan.performanceData.accelerationAltitude;
    const accPilot = plan.performanceData.accelerationAltitudeIsPilotEntered;
    const eoAcc = plan.performanceData.engineOutAccelerationAltitude;
    const eoAccPilot = plan.performanceData.engineOutAccelerationAltitudeIsPilotEntered;

    const thrRedAcc = `{${thrRedPilot ? 'big' : 'small'}}${thrRed !== null ? thrRed.toFixed(0).padStart(5, '\xa0') : '-----'}{end}/{${accPilot ? 'big' : 'small'}}${acc !== null ? acc.toFixed(0).padEnd(5, '\xa0') : '-----'}{end}`;

    mcdu.onLeftInput[4] = (value, scratchpadCallback) => {
      if (mcdu.trySetThrustReductionAccelerationAltitude(value)) {
        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
      } else {
        scratchpadCallback();
      }
    };

    // eng out acceleration altitude
    const engOut = `{${eoAccPilot ? 'big' : 'small'}}${eoAcc !== null ? eoAcc.toFixed(0).padStart(5, '\xa0') : '-----'}{end}`;
    mcdu.onRightInput[4] = (value, scratchpadCallback) => {
      if (mcdu.trySetEngineOutAcceleration(value)) {
        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
      } else {
        scratchpadCallback();
      }
    };

    // center column
    let flpRetrCell = '---';
    let sltRetrCell = '---';
    let cleanCell = '---';
    if (isFinite(mcdu.zeroFuelWeight)) {
      const flapSpeed = mcdu.computedVfs;
      if (flapSpeed !== 0) {
        flpRetrCell = `{green}${flapSpeed.toFixed(0)}{end}`;
      }
      const slatSpeed = mcdu.computedVss;
      if (slatSpeed !== 0) {
        sltRetrCell = `{green}${slatSpeed.toFixed(0)}{end}`;
      }
      const cleanSpeed = mcdu.computedVgd;
      if (cleanSpeed !== 0) {
        cleanCell = `{green}${cleanSpeed.toFixed(0)}{end}`;
      }
    }
    // takeoff shift
    let toShiftCell = '{inop}----{end}\xa0';
    if (hasOrigin && hasRunway) {
      toShiftCell = '{inop}{small}[M]{end}[\xa0\xa0]*{end}';
      // TODO store and show TO SHIFT
    }

    // flaps / trim horizontal stabilizer
    let flapsThs = '[]/[\xa0\xa0\xa0][color]cyan';
    // The following line uses a special Javascript concept that is signed
    // zeroes. In Javascript -0 is strictly equal to 0, so for most cases we
    // don't care about that difference. But here, we use that fact to show
    // the pilot the precise value they entered: DN0.0 or UP0.0. The only
    // way to figure that difference out is using Object.is, as
    // Object.is(+0, -0) returns false. Alternatively we could use a helper
    // variable (yuck) or encode it using a very small, but negative value
    // such as -0.001.
    const formattedThs =
      mcdu.ths !== null
        ? mcdu.ths >= 0 && !Object.is(mcdu.ths, -0)
          ? `UP${Math.abs(mcdu.ths).toFixed(1)}`
          : `DN${Math.abs(mcdu.ths).toFixed(1)}`
        : '';
    if (mcdu.flightPhaseManager.phase < FmgcFlightPhase.Takeoff) {
      const flaps = mcdu.flaps !== null ? mcdu.flaps : '[]';
      const ths = formattedThs ? formattedThs : '[\xa0\xa0\xa0]';
      flapsThs = `${flaps}/${ths}[color]cyan`;
      mcdu.onRightInput[2] = (value, scratchpadCallback) => {
        if (mcdu.trySetFlapsTHS(value)) {
          CDUPerformancePage.ShowTAKEOFFPage(mcdu);
        } else {
          scratchpadCallback();
        }
      };
    } else {
      const flaps = mcdu.flaps !== null ? mcdu.flaps : '';
      const ths = formattedThs ? formattedThs : '\xa0\xa0\xa0\xa0\xa0';
      flapsThs = `${flaps}/${ths}[color]green`;
    }

    // flex takeoff temperature
    let flexTakeOffTempCell = '[\xa0\xa0]°[color]cyan';
    if (mcdu.flightPhaseManager.phase < FmgcFlightPhase.Takeoff) {
      if (isFinite(mcdu.perfTOTemp)) {
        if (mcdu._toFlexChecked) {
          flexTakeOffTempCell = `${mcdu.perfTOTemp.toFixed(0)}°[color]cyan`;
        } else {
          flexTakeOffTempCell = `{small}${mcdu.perfTOTemp.toFixed(0)}{end}${flexTakeOffTempCell}[color]cyan`;
        }
      }
      mcdu.onRightInput[3] = (value, scratchpadCallback) => {
        if (mcdu._toFlexChecked) {
          if (mcdu.setPerfTOFlexTemp(value)) {
            CDUPerformancePage.ShowTAKEOFFPage(mcdu);
          } else {
            scratchpadCallback();
          }
        } else {
          if (value === '' || mcdu.setPerfTOFlexTemp(value)) {
            mcdu._toFlexChecked = true;
            CDUPerformancePage.ShowTAKEOFFPage(mcdu);
          } else {
            scratchpadCallback();
          }
        }
      };
    } else {
      if (isFinite(mcdu.perfTOTemp)) {
        flexTakeOffTempCell = `${mcdu.perfTOTemp.toFixed(0)}°[color]green`;
      } else {
        flexTakeOffTempCell = '';
      }
    }

    let next = 'NEXT\xa0';
    let nextPhase = 'PHASE>';
    if (
      (mcdu.unconfirmedV1Speed || mcdu.unconfirmedVRSpeed || mcdu.unconfirmedV2Speed || !mcdu._toFlexChecked) &&
      mcdu.flightPhaseManager.phase < FmgcFlightPhase.Takeoff
    ) {
      next = 'CONFIRM\xa0';
      nextPhase = 'TO DATA*';
      mcdu.onRightInput[5] = () => {
        mcdu.v1Speed = mcdu.unconfirmedV1Speed ? mcdu.unconfirmedV1Speed : mcdu.v1Speed;
        mcdu.vRSpeed = mcdu.unconfirmedVRSpeed ? mcdu.unconfirmedVRSpeed : mcdu.vRSpeed;
        mcdu.v2Speed = mcdu.unconfirmedV2Speed ? mcdu.unconfirmedV2Speed : mcdu.v2Speed;
        mcdu.unconfirmedV1Speed = undefined;
        mcdu.unconfirmedVRSpeed = undefined;
        mcdu.unconfirmedV2Speed = undefined;
        mcdu._toFlexChecked = true;
        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
      };
    } else {
      mcdu.rightInputDelay[5] = () => {
        return mcdu.getDelaySwitchPage();
      };
      mcdu.onRightInput[5] = () => {
        CDUPerformancePage.ShowCLBPage(mcdu);
      };
    }

    mcdu.setTemplate([
      ['TAKE OFF RWY\xa0{green}' + runway.padStart(3, '\xa0') + '{end}[color]' + titleColor],
      ['\xa0V1\xa0\xa0FLP RETR', ''],
      [v1 + v1Check + '\xa0F=' + flpRetrCell, ''],
      ['\xa0VR\xa0\xa0SLT RETR', 'TO SHIFT\xa0'],
      [vR + vRCheck + '\xa0S=' + sltRetrCell, toShiftCell],
      ['\xa0V2\xa0\xa0\xa0\xa0\xa0CLEAN', 'FLAPS/THS'],
      [v2 + v2Check + '\xa0O=' + cleanCell, flapsThs],
      ['TRANS ALT', 'FLEX TO TEMP'],
      [`{cyan}${transAltCell}{end}`, flexTakeOffTempCell],
      ['THR\xa0RED/ACC', 'ENG\xa0OUT\xa0ACC'],
      [`{${altitudeColour}}${thrRedAcc}{end}`, `{${altitudeColour}}${engOut}{end}`],
      ['\xa0UPLINK[color]inop', next],
      ['<TO DATA[color]inop', nextPhase],
    ]);
  }
  static ShowCLBPage(mcdu: LegacyFmsPageInterface, confirmAppr = false) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.PerformancePageClb;
    CDUPerformancePage._timer = 0;
    CDUPerformancePage._lastPhase = mcdu.flightPhaseManager.phase;
    mcdu.pageUpdate = () => {
      CDUPerformancePage._timer++;
      if (CDUPerformancePage._timer >= 100) {
        if (mcdu.flightPhaseManager.phase === CDUPerformancePage._lastPhase) {
          CDUPerformancePage.ShowCLBPage(mcdu);
        } else {
          CDUPerformancePage.ShowPage(mcdu);
        }
      }
    };

    const hasFromToPair =
      mcdu.flightPlanService.active.originAirport && mcdu.flightPlanService.active.destinationAirport; // TODO use the right flight plan
    const showManagedSpeed = hasFromToPair && mcdu.isCostIndexSet && Number.isFinite(mcdu.costIndex);
    const isPhaseActive = mcdu.flightPhaseManager.phase === FmgcFlightPhase.Climb;
    const isTakeoffOrClimbActive = isPhaseActive || mcdu.flightPhaseManager.phase === FmgcFlightPhase.Takeoff;
    const titleColor = isPhaseActive ? 'green' : 'white';
    const isSelected =
      (isPhaseActive && Simplane.getAutoPilotAirspeedSelected()) ||
      (!isPhaseActive && mcdu.preSelectedClbSpeed !== undefined);
    const actModeCell = isSelected ? 'SELECTED' : 'MANAGED';
    const costIndexCell = CDUPerformancePage.formatCostIndexCell(mcdu, hasFromToPair, true);
    const canClickManagedSpeed = showManagedSpeed && mcdu.preSelectedClbSpeed !== undefined && !isPhaseActive;

    // Predictions to altitude
    const vnavDriver = mcdu.guidanceController.vnavDriver;

    const cruiseAltitude = mcdu.cruiseLevel * 100;
    const fcuAltitude = SimVar.GetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR:3', 'feet');
    const altitudeToPredict =
      mcdu.perfClbPredToAltitudePilot !== undefined
        ? mcdu.perfClbPredToAltitudePilot
        : Math.min(cruiseAltitude, fcuAltitude);

    const predToLabel = isTakeoffOrClimbActive ? '\xa0\xa0\xa0\xa0\xa0{small}PRED TO{end}' : '';
    const predToCell = isTakeoffOrClimbActive
      ? `${CDUPerformancePage.formatAltitudeOrLevel(altitudeToPredict, mcdu.getOriginTransitionAltitude())}[color]cyan`
      : '';

    let predToDistanceCell = '';
    let predToTimeCell = '';

    let expeditePredToDistanceCell = '';
    let expeditePredToTimeCell = '';

    if (isTakeoffOrClimbActive && vnavDriver) {
      [predToDistanceCell, predToTimeCell] = CDUPerformancePage.getTimeAndDistancePredictionsFromGeometryProfile(
        vnavDriver.ndProfile,
        altitudeToPredict,
        true,
      );
      [expeditePredToDistanceCell, expeditePredToTimeCell] =
        CDUPerformancePage.getTimeAndDistancePredictionsFromGeometryProfile(
          vnavDriver.expediteProfile,
          altitudeToPredict,
          true,
          true,
        );
    }

    let managedSpeedCell = '';
    if (isPhaseActive) {
      if (mcdu.managedSpeedTarget === mcdu.managedSpeedClimb) {
        managedSpeedCell = `\xa0${mcdu.managedSpeedClimb.toFixed(0)}/${mcdu.managedSpeedClimbMach.toFixed(2).replace('0.', '.')}`;
      } else if (mcdu.managedSpeedTargetIsMach) {
        managedSpeedCell = `\xa0${mcdu.managedSpeedClimbMach.toFixed(2).replace('0.', '.')}`;
      } else {
        managedSpeedCell = `\xa0${mcdu.managedSpeedTarget.toFixed(0)}`;
      }
    } else {
      let climbSpeed = Math.min(mcdu.managedSpeedClimb, mcdu.getNavModeSpeedConstraint());
      if (
        mcdu.climbSpeedLimit !== undefined &&
        SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < mcdu.climbSpeedLimitAlt
      ) {
        climbSpeed = Math.min(climbSpeed, mcdu.climbSpeedLimit);
      }

      managedSpeedCell = `${canClickManagedSpeed ? '*' : '\xa0'}${climbSpeed.toFixed(0)}`;

      mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
        if (mcdu.trySetPreSelectedClimbSpeed(value)) {
          CDUPerformancePage.ShowCLBPage(mcdu);
        } else {
          scratchpadCallback();
        }
      };
    }
    const [selectedSpeedTitle, selectedSpeedCell] = CDUPerformancePage.getClbSelectedTitleAndValue(
      mcdu,
      isPhaseActive,
      isSelected,
      mcdu.preSelectedClbSpeed,
    );

    if (hasFromToPair) {
      mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
        if (mcdu.tryUpdateCostIndex(value)) {
          CDUPerformancePage.ShowCLBPage(mcdu);
        } else {
          scratchpadCallback();
        }
      };
    }

    if (canClickManagedSpeed) {
      mcdu.onLeftInput[2] = (_, scratchpadCallback) => {
        if (mcdu.trySetPreSelectedClimbSpeed(Keypad.clrValue)) {
          CDUPerformancePage.ShowCLBPage(mcdu);
        }

        scratchpadCallback();
      };
    }

    if (isTakeoffOrClimbActive) {
      mcdu.onRightInput[1] = (value, scratchpadCallback) => {
        if (mcdu.trySetPerfClbPredToAltitude(value)) {
          CDUPerformancePage.ShowCLBPage(mcdu);
        } else {
          scratchpadCallback();
        }
      };
    }

    const [toUtcLabel, toDistLabel] = isTakeoffOrClimbActive ? ['\xa0UTC', 'DIST'] : ['', ''];

    const bottomRowLabels = ['\xa0PREV', 'NEXT\xa0'];
    const bottomRowCells = ['<PHASE', 'PHASE>'];
    mcdu.leftInputDelay[5] = () => mcdu.getDelaySwitchPage();
    if (isPhaseActive) {
      if (confirmAppr) {
        bottomRowLabels[0] = '\xa0CONFIRM[color]amber';
        bottomRowCells[0] = '*APPR PHASE[color]amber';
        mcdu.onLeftInput[5] = async () => {
          if (mcdu.flightPhaseManager.tryGoInApproachPhase()) {
            CDUPerformancePage.ShowAPPRPage(mcdu);
          }
        };
      } else {
        bottomRowLabels[0] = '\xa0ACTIVATE[color]cyan';
        bottomRowCells[0] = '{APPR PHASE[color]cyan';
        mcdu.onLeftInput[5] = () => {
          CDUPerformancePage.ShowCLBPage(mcdu, true);
        };
      }
    } else {
      mcdu.onLeftInput[5] = () => {
        CDUPerformancePage.ShowTAKEOFFPage(mcdu);
      };
    }

    mcdu.rightInputDelay[5] = () => mcdu.getDelaySwitchPage();
    mcdu.onRightInput[5] = () => {
      CDUPerformancePage.ShowCRZPage(mcdu);
    };
    mcdu.setTemplate([
      [`\xa0CLB[color]${titleColor}`],
      ['ACT MODE'],
      [`${actModeCell}[color]green`],
      ['CI'],
      [costIndexCell, predToCell, predToLabel],
      ['MANAGED', toDistLabel, toUtcLabel],
      [
        `{small}${showManagedSpeed ? managedSpeedCell : '\xa0---/---'}{end}[color]${showManagedSpeed ? 'green' : 'white'}`,
        !isSelected ? predToDistanceCell : '',
        !isSelected ? predToTimeCell : '',
      ],
      [selectedSpeedTitle],
      [selectedSpeedCell, isSelected ? predToDistanceCell : '', isSelected ? predToTimeCell : ''],
      [''],
      isPhaseActive ? ['{small}EXPEDITE{end}[color]green', expeditePredToDistanceCell, expeditePredToTimeCell] : [''],
      bottomRowLabels,
      bottomRowCells,
    ]);
  }

  static ShowCRZPage(mcdu: LegacyFmsPageInterface, confirmAppr = false) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.PerformancePageCrz;
    CDUPerformancePage._timer = 0;
    CDUPerformancePage._lastPhase = mcdu.flightPhaseManager.phase;
    mcdu.pageUpdate = () => {
      CDUPerformancePage._timer++;
      if (CDUPerformancePage._timer >= 100) {
        if (mcdu.flightPhaseManager.phase === CDUPerformancePage._lastPhase) {
          CDUPerformancePage.ShowCRZPage(mcdu);
        } else {
          CDUPerformancePage.ShowPage(mcdu);
        }
      }
    };

    const hasFromToPair =
      mcdu.flightPlanService.active.originAirport && mcdu.flightPlanService.active.destinationAirport; // TODO use the right flight plan
    const isPhaseActive = mcdu.flightPhaseManager.phase === FmgcFlightPhase.Cruise;
    const titleColor = isPhaseActive ? 'green' : 'white';
    const isSelected =
      (isPhaseActive && Simplane.getAutoPilotAirspeedSelected()) ||
      (!isPhaseActive && mcdu.preSelectedCrzSpeed !== undefined);
    const isFlying = mcdu.flightPhaseManager.phase >= FmgcFlightPhase.Takeoff;
    const actModeCell = isSelected ? 'SELECTED' : 'MANAGED';
    const costIndexCell = CDUPerformancePage.formatCostIndexCell(mcdu, hasFromToPair, true);

    // TODO: Figure out correct condition
    const showManagedSpeed = hasFromToPair && mcdu.isCostIndexSet && Number.isFinite(mcdu.costIndex);
    const canClickManagedSpeed = showManagedSpeed && mcdu.preSelectedCrzSpeed !== undefined && !isPhaseActive;
    let managedSpeedCell = '{small}\xa0---/---{end}[color]white';
    if (
      showManagedSpeed &&
      mcdu.cruiseLevel &&
      Number.isFinite(mcdu.managedSpeedCruise) &&
      Number.isFinite(mcdu.managedSpeedCruiseMach)
    ) {
      const shouldShowCruiseMach = mcdu.cruiseLevel > 250;
      managedSpeedCell = `{small}${canClickManagedSpeed ? '*' : '\xa0'}${shouldShowCruiseMach ? mcdu.managedSpeedCruiseMach.toFixed(2).replace('0.', '.') : mcdu.managedSpeedCruise.toFixed(0)}{end}[color]green`;
    }
    const preselTitle = isPhaseActive ? '' : 'PRESEL';
    let preselCell = '';
    if (!isPhaseActive) {
      const hasPreselectedSpeedOrMach = mcdu.preSelectedCrzSpeed !== undefined;
      if (hasPreselectedSpeedOrMach) {
        preselCell = `\xa0${mcdu.preSelectedCrzSpeed < 1 ? mcdu.preSelectedCrzSpeed.toFixed(2).replace('0.', '.') : mcdu.preSelectedCrzSpeed.toFixed(0)}[color]cyan`;
      } else {
        preselCell = '{small}*{end}[ ][color]cyan';
      }
    }

    if (hasFromToPair) {
      mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
        if (mcdu.tryUpdateCostIndex(value)) {
          CDUPerformancePage.ShowCRZPage(mcdu);
        } else {
          scratchpadCallback();
        }
      };
    }

    const timeLabel = isFlying ? '\xa0UTC' : 'TIME';

    const [destEfobCell, destTimeCell] = CDUPerformancePage.formatDestEfobAndTime(mcdu, isFlying);
    const [toUtcLabel, toDistLabel] = isFlying ? ['\xa0UTC', 'DIST'] : ['', ''];
    const [toReasonCell, toDistCell, toTimeCell] = isFlying
      ? CDUPerformancePage.formatToReasonDistanceAndTime(mcdu)
      : ['', '', ''];
    const desCabinRateCell = '{small}-350{end}';
    const shouldShowStepAltsOption =
      mcdu.cruiseLevel &&
      (mcdu.flightPhaseManager.phase < FmgcFlightPhase.Descent ||
        mcdu.flightPhaseManager.phase > FmgcFlightPhase.GoAround);

    const bottomRowLabels = ['\xa0PREV', 'NEXT\xa0'];
    const bottomRowCells = ['<PHASE', 'PHASE>'];
    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };
    if (isPhaseActive) {
      if (confirmAppr) {
        bottomRowLabels[0] = '\xa0CONFIRM[color]amber';
        bottomRowCells[0] = '*APPR PHASE[color]amber';
        mcdu.onLeftInput[5] = async () => {
          if (mcdu.flightPhaseManager.tryGoInApproachPhase()) {
            CDUPerformancePage.ShowAPPRPage(mcdu);
          }
        };
      } else {
        bottomRowLabels[0] = '\xa0ACTIVATE[color]cyan';
        bottomRowCells[0] = '{APPR PHASE[color]cyan';
        mcdu.onLeftInput[5] = () => {
          CDUPerformancePage.ShowCRZPage(mcdu, true);
        };
      }
    } else {
      mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
        if (mcdu.trySetPreSelectedCruiseSpeed(value)) {
          CDUPerformancePage.ShowCRZPage(mcdu);
        } else {
          scratchpadCallback();
        }
      };
      mcdu.onLeftInput[5] = () => {
        CDUPerformancePage.ShowCLBPage(mcdu);
      };
    }
    if (canClickManagedSpeed) {
      mcdu.onLeftInput[2] = (_, scratchpadCallback) => {
        if (mcdu.trySetPreSelectedCruiseSpeed(Keypad.clrValue)) {
          CDUPerformancePage.ShowCRZPage(mcdu);
        }

        scratchpadCallback();
      };
    }
    mcdu.onRightInput[3] = () => {
      // DES CABIN RATE
      mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
    };
    if (shouldShowStepAltsOption) {
      CDUStepAltsPage.Return = () => {
        CDUPerformancePage.ShowCRZPage(mcdu, false);
      };
      mcdu.onRightInput[4] = () => {
        CDUStepAltsPage.ShowPage(mcdu);
      };
    }
    mcdu.rightInputDelay[5] = () => mcdu.getDelaySwitchPage();
    mcdu.onRightInput[5] = () => {
      CDUPerformancePage.ShowDESPage(mcdu);
    };
    mcdu.setTemplate([
      [`\xa0CRZ[color]${titleColor}`],
      ['ACT MODE', 'DEST EFOB', timeLabel],
      [`${actModeCell}[color]green`, destEfobCell, destTimeCell],
      ['CI'],
      [costIndexCell, toReasonCell],
      ['MANAGED', toDistLabel, toUtcLabel],
      [managedSpeedCell, toDistCell, toTimeCell],
      [preselTitle, 'DES CABIN RATE'],
      [preselCell, `\xa0{cyan}${desCabinRateCell}{end}{white}{small}FT/MN{end}{end}`],
      [''],
      ['', shouldShowStepAltsOption ? 'STEP ALTS>' : ''],
      bottomRowLabels,
      bottomRowCells,
    ]);
  }

  static ShowDESPage(mcdu: LegacyFmsPageInterface, confirmAppr = false) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.PerformancePageDes;
    CDUPerformancePage._timer = 0;
    CDUPerformancePage._lastPhase = mcdu.flightPhaseManager.phase;
    mcdu.pageUpdate = () => {
      CDUPerformancePage._timer++;
      if (CDUPerformancePage._timer >= 100) {
        if (mcdu.flightPhaseManager.phase === CDUPerformancePage._lastPhase) {
          CDUPerformancePage.ShowDESPage(mcdu);
        } else {
          CDUPerformancePage.ShowPage(mcdu);
        }
      }
    };

    const hasFromToPair =
      mcdu.flightPlanService.active.originAirport && mcdu.flightPlanService.active.destinationAirport; // TODO use the right flight plan
    const isPhaseActive = mcdu.flightPhaseManager.phase === FmgcFlightPhase.Descent;
    const titleColor = isPhaseActive ? 'green' : 'white';
    const isFlying = mcdu.flightPhaseManager.phase >= FmgcFlightPhase.Takeoff;
    const isSelected = isPhaseActive && Simplane.getAutoPilotAirspeedSelected();
    const actModeCell = isSelected ? 'SELECTED' : 'MANAGED';

    // Predictions to altitude
    const vnavDriver = mcdu.guidanceController.vnavDriver;
    const fcuAltitude = SimVar.GetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR:3', 'feet');
    const altitudeToPredict =
      mcdu.perfDesPredToAltitudePilot !== undefined ? mcdu.perfDesPredToAltitudePilot : fcuAltitude;

    const predToLabel = isPhaseActive ? '\xa0\xa0\xa0\xa0\xa0{small}PRED TO{end}' : '';
    const predToCell = isPhaseActive
      ? `${CDUPerformancePage.formatAltitudeOrLevel(altitudeToPredict, mcdu.getDestinationTransitionLevel() * 100)}[color]cyan`
      : '';

    let predToDistanceCell = '';
    let predToTimeCell = '';

    if (isPhaseActive && vnavDriver) {
      [predToDistanceCell, predToTimeCell] = CDUPerformancePage.getTimeAndDistancePredictionsFromGeometryProfile(
        vnavDriver.ndProfile,
        altitudeToPredict,
        false,
      );
    }

    const costIndexCell = CDUPerformancePage.formatCostIndexCell(mcdu, hasFromToPair, !isPhaseActive);

    const econDesPilotEntered = mcdu.managedSpeedDescendPilot !== undefined;
    const econDes = econDesPilotEntered ? mcdu.managedSpeedDescendPilot : mcdu.managedSpeedDescend;
    const econDesMachPilotEntered = mcdu.managedSpeedDescendMachPilot !== undefined;
    const econDesMach = econDesMachPilotEntered ? mcdu.managedSpeedDescendMachPilot : mcdu.managedSpeedDescendMach;

    // TODO: Figure out correct condition
    const showManagedSpeed =
      hasFromToPair &&
      mcdu.isCostIndexSet &&
      Number.isFinite(mcdu.costIndex) &&
      econDesMach !== undefined &&
      econDes !== undefined;
    const managedDescentSpeedCellMach = `{${econDesMachPilotEntered ? 'big' : 'small'}}${econDesMach.toFixed(2).replace('0.', '.')}{end}`;
    const managedDescentSpeedCellSpeed = `{${econDesPilotEntered ? 'big' : 'small'}}/${econDes.toFixed(0)}{end}`;

    const managedDescentSpeedCell = showManagedSpeed
      ? `\xa0${managedDescentSpeedCellMach}${managedDescentSpeedCellSpeed}[color]cyan`
      : '\xa0{small}---/---{end}[color]white';

    const [selectedSpeedTitle, selectedSpeedCell] = CDUPerformancePage.getDesSelectedTitleAndValue(
      mcdu,
      isPhaseActive,
      isSelected,
    );
    const timeLabel = isFlying ? '\xa0UTC' : 'TIME';
    const [destEfobCell, destTimeCell] = CDUPerformancePage.formatDestEfobAndTime(mcdu, isFlying);
    const [toUtcLabel, toDistLabel] = isPhaseActive ? ['\xa0UTC', 'DIST'] : ['', ''];

    const bottomRowLabels = ['\xa0PREV', 'NEXT\xa0'];
    const bottomRowCells = ['<PHASE', 'PHASE>'];
    mcdu.leftInputDelay[5] = () => mcdu.getDelaySwitchPage();
    if (isPhaseActive) {
      mcdu.onRightInput[1] = (value, scratchpadCallback) => {
        if (mcdu.trySetPerfDesPredToAltitude(value)) {
          CDUPerformancePage.ShowDESPage(mcdu);
        } else {
          scratchpadCallback();
        }
      };

      if (confirmAppr) {
        bottomRowLabels[0] = '\xa0CONFIRM[color]amber';
        bottomRowCells[0] = '*APPR PHASE[color]amber';
        mcdu.onLeftInput[5] = async () => {
          if (mcdu.flightPhaseManager.tryGoInApproachPhase()) {
            CDUPerformancePage.ShowAPPRPage(mcdu);
          }
        };
      } else {
        bottomRowLabels[0] = '\xa0ACTIVATE[color]cyan';
        bottomRowCells[0] = '{APPR PHASE[color]cyan';
        mcdu.onLeftInput[5] = () => {
          CDUPerformancePage.ShowDESPage(mcdu, true);
        };
      }
    } else {
      mcdu.onLeftInput[5] = () => {
        CDUPerformancePage.ShowCRZPage(mcdu);
      };
    }
    // Can only modify cost index until the phase is active
    if (hasFromToPair && !isPhaseActive) {
      mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
        if (mcdu.tryUpdateCostIndex(value)) {
          CDUPerformancePage.ShowDESPage(mcdu);
        } else {
          scratchpadCallback();
        }
      };
    }

    if (showManagedSpeed) {
      mcdu.onLeftInput[2] = (value, scratchpadCallback) => {
        if (mcdu.trySetManagedDescentSpeed(value)) {
          CDUPerformancePage.ShowDESPage(mcdu);
        } else {
          scratchpadCallback();
        }
      };
    }

    mcdu.rightInputDelay[5] = () => mcdu.getDelaySwitchPage();
    mcdu.onRightInput[5] = () => {
      CDUPerformancePage.ShowAPPRPage(mcdu);
    };
    mcdu.setTemplate([
      [`\xa0DES[color]${titleColor}`],
      ['ACT MODE', 'DEST EFOB', timeLabel],
      [`${actModeCell}[color]green`, destEfobCell, destTimeCell],
      ['CI'],
      [costIndexCell, predToCell, predToLabel],
      ['MANAGED', toDistLabel, toUtcLabel],
      [managedDescentSpeedCell, !isSelected ? predToDistanceCell : '', !isSelected ? predToTimeCell : ''],
      [selectedSpeedTitle],
      [selectedSpeedCell, isSelected ? predToDistanceCell : '', isSelected ? predToTimeCell : ''],
      [''],
      [''],
      bottomRowLabels,
      bottomRowCells,
    ]);
  }

  static ShowAPPRPage(mcdu: LegacyFmsPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.PerformancePageAppr;

    const plan = mcdu.flightPlanService.active;

    CDUPerformancePage._timer = 0;
    CDUPerformancePage._lastPhase = mcdu.flightPhaseManager.phase;
    mcdu.pageUpdate = () => {
      CDUPerformancePage._timer++;
      if (CDUPerformancePage._timer >= 100) {
        if (mcdu.flightPhaseManager.phase === CDUPerformancePage._lastPhase) {
          CDUPerformancePage.ShowAPPRPage(mcdu);
        }
      }
    };

    const distanceToDest = mcdu.getDistanceToDestination();
    const closeToDest = distanceToDest !== undefined && distanceToDest <= 180;

    let qnhCell = '[\xa0\xa0][color]cyan';
    if (isFinite(mcdu.perfApprQNH)) {
      if (mcdu.perfApprQNH < 500) {
        qnhCell = mcdu.perfApprQNH.toFixed(2) + '[color]cyan';
      } else {
        qnhCell = mcdu.perfApprQNH.toFixed(0) + '[color]cyan';
      }
    } else if (closeToDest) {
      qnhCell = '____[color]amber';
    }
    mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
      if (mcdu.setPerfApprQNH(value)) {
        CDUPerformancePage.ShowAPPRPage(mcdu);
      } else {
        scratchpadCallback();
      }
    };

    let tempCell = '{cyan}[\xa0]°{end}';
    if (isFinite(mcdu.perfApprTemp)) {
      tempCell =
        '{cyan}' +
        (mcdu.perfApprTemp >= 0 ? '+' : '-') +
        ('' + Math.abs(mcdu.perfApprTemp).toFixed(0)).padStart(2).replace(/ /g, '\xa0') +
        '°{end}';
    } else if (closeToDest) {
      tempCell = '{amber}___°{end}';
    }
    mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
      if (mcdu.setPerfApprTemp(value)) {
        CDUPerformancePage.ShowAPPRPage(mcdu);
      } else {
        scratchpadCallback();
      }
    };
    let magWindHeadingCell = '[\xa0]';
    if (mcdu.perfApprWindHeading != null) {
      magWindHeadingCell = ('' + mcdu.perfApprWindHeading.toFixed(0)).padStart(3, '0');
    }
    let magWindSpeedCell = '[\xa0]';
    if (mcdu.perfApprWindSpeed != null) {
      magWindSpeedCell = mcdu.perfApprWindSpeed.toFixed(0).padStart(3, '0');
    }
    mcdu.onLeftInput[2] = (value, scratchpadCallback) => {
      if (mcdu.setPerfApprWind(value)) {
        mcdu.updateTowerHeadwind();
        mcdu.updatePerfSpeeds();
        CDUPerformancePage.ShowAPPRPage(mcdu);
      } else {
        scratchpadCallback();
      }
    };

    let transAltCell = '\xa0'.repeat(5);
    const hasDestination = !!plan.destinationAirport;

    if (hasDestination) {
      const transitionLevel = plan.performanceData.transitionLevel;

      if (transitionLevel !== null) {
        transAltCell = (transitionLevel * 100).toFixed(0).padEnd(5, '\xa0');

        if (plan.performanceData.transitionLevelIsFromDatabase) {
          transAltCell = `{small}${transAltCell}{end}`;
        }
      } else {
        transAltCell = '[\xa0]'.padEnd(5, '\xa0');
      }
    }
    mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
      if (mcdu.setPerfApprTransAlt(value)) {
        CDUPerformancePage.ShowAPPRPage(mcdu);
      } else {
        scratchpadCallback();
      }
    };

    let vappCell = '---';
    let vlsCell = '---';
    let flpRetrCell = '---';
    let sltRetrCell = '---';
    let cleanCell = '---';
    if (isFinite(mcdu.zeroFuelWeight) && mcdu.approachSpeeds && mcdu.approachSpeeds.valid) {
      vappCell = `{cyan}{small}${mcdu.approachSpeeds.vapp.toFixed(0)}{end}{end}`;
      vlsCell = `{green}${mcdu.approachSpeeds.vls.toFixed(0)}{end}`;
      flpRetrCell = `{green}${mcdu.approachSpeeds.f.toFixed(0)}{end}`;
      sltRetrCell = `{green}${mcdu.approachSpeeds.s.toFixed(0)}{end}`;
      cleanCell = `{green}${mcdu.approachSpeeds.gd.toFixed(0)}{end}`;
    }
    if (isFinite(mcdu.vApp)) {
      // pilot override
      vappCell = `{cyan}${mcdu.vApp.toFixed(0).padStart(3, '\xa0')}{end}`;
    }
    mcdu.onLeftInput[4] = (value, scratchpadCallback) => {
      if (mcdu.setPerfApprVApp(value)) {
        CDUPerformancePage.ShowAPPRPage(mcdu);
      } else {
        scratchpadCallback();
      }
    };
    mcdu.onRightInput[4] = () => {
      mcdu.setPerfApprFlaps3(!mcdu.perfApprFlaps3);
      mcdu.updatePerfSpeeds();
      CDUPerformancePage.ShowAPPRPage(mcdu);
    };

    let baroCell = '[\xa0\xa0\xa0]';
    if (mcdu.perfApprMDA !== null) {
      baroCell = mcdu.perfApprMDA.toFixed(0);
    }
    mcdu.onRightInput[1] = (value, scratchpadCallback) => {
      if (mcdu.setPerfApprMDA(value) && mcdu.setPerfApprDH(Keypad.clrValue)) {
        CDUPerformancePage.ShowAPPRPage(mcdu);
      } else {
        scratchpadCallback();
      }
    };

    const approach = plan.approach;
    const isILS = approach && approach.type === 5;
    let radioLabel = '';
    let radioCell = '';
    if (isILS) {
      radioLabel = 'RADIO';
      if (typeof mcdu.perfApprDH === 'number') {
        radioCell = mcdu.perfApprDH.toFixed(0);
      } else if (mcdu.perfApprDH === 'NO DH') {
        radioCell = 'NO DH';
      } else {
        radioCell = '[\xa0]';
      }
      mcdu.onRightInput[2] = (value, scratchpadCallback) => {
        if (mcdu.setPerfApprDH(value) && mcdu.setPerfApprMDA(Keypad.clrValue)) {
          CDUPerformancePage.ShowAPPRPage(mcdu);
        } else {
          scratchpadCallback();
        }
      };
    }

    const bottomRowLabels = ['\xa0PREV', 'NEXT\xa0'];
    const bottomRowCells = ['<PHASE', 'PHASE>'];
    let titleColor = 'white';
    if (mcdu.flightPhaseManager.phase === FmgcFlightPhase.Approach) {
      bottomRowLabels[0] = '';
      bottomRowCells[0] = '';
      titleColor = 'green';
    } else {
      if (mcdu.flightPhaseManager.phase === FmgcFlightPhase.GoAround) {
        mcdu.leftInputDelay[5] = () => {
          return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
          CDUPerformancePage.ShowGOAROUNDPage(mcdu);
        };
      } else {
        mcdu.leftInputDelay[5] = () => {
          return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
          CDUPerformancePage.ShowDESPage(mcdu);
        };
      }
    }
    if (mcdu.flightPhaseManager.phase === FmgcFlightPhase.GoAround) {
      bottomRowLabels[1] = '';
      bottomRowCells[1] = '';
    } else {
      mcdu.rightInputDelay[5] = () => {
        return mcdu.getDelaySwitchPage();
      };
      mcdu.onRightInput[5] = () => {
        CDUPerformancePage.ShowGOAROUNDPage(mcdu);
      };
    }

    let titleCell = `${'\xa0'.repeat(5)}{${titleColor}}APPR{end}\xa0`;
    if (approach) {
      const approachName = ApproachUtils.shortApproachName(approach);
      titleCell += `{green}${approachName}{end}` + '\xa0'.repeat(24 - 10 - approachName.length);
    } else {
      titleCell += '\xa0'.repeat(24 - 10);
    }

    mcdu.setTemplate([
      /* t  */ [titleCell],
      /* 1l */ ['QNH'],
      /* 1L */ [qnhCell],
      /* 2l */ ['TEMP', 'BARO'],
      /* 2L */ [`${tempCell}${'\xa0'.repeat(6)}O=${cleanCell}`, baroCell + '[color]cyan'],
      /* 3l */ ['MAG WIND', radioLabel],
      /* 3L */ [
        `{cyan}${magWindHeadingCell}°/${magWindSpeedCell}{end}\xa0\xa0S=${sltRetrCell}`,
        radioCell + '[color]cyan',
      ],
      /* 4l */ ['TRANS ALT'],
      /* 4L */ [`{cyan}${transAltCell}{end}${'\xa0'.repeat(5)}F=${flpRetrCell}`],
      /* 5l */ ['VAPP\xa0\xa0\xa0VLS', 'LDG CONF\xa0'],
      /* 5L */ [
        `${vappCell}${'\xa0'.repeat(4)}${vlsCell}`,
        mcdu.perfApprFlaps3 ? '{cyan}CONF3/{end}{small}FULL{end}*' : '{cyan}FULL/{end}{small}CONF3{end}*',
      ],
      /* 6l */ bottomRowLabels,
      /* 6L */ bottomRowCells,
    ]);
  }

  static ShowGOAROUNDPage(mcdu: LegacyFmsPageInterface, confirmAppr = false) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.PerformancePageGoAround;
    CDUPerformancePage._timer = 0;
    CDUPerformancePage._lastPhase = mcdu.flightPhaseManager.phase;
    mcdu.pageUpdate = () => {
      CDUPerformancePage._timer++;
      if (CDUPerformancePage._timer >= 100) {
        if (mcdu.flightPhaseManager.phase === CDUPerformancePage._lastPhase) {
          CDUPerformancePage.ShowGOAROUNDPage(mcdu);
        } else {
          CDUPerformancePage.ShowPage(mcdu);
        }
      }
    };

    const haveDestination = mcdu.flightPlanService.active.destinationAirport !== undefined;

    const titleColor = mcdu.flightPhaseManager.phase === FmgcFlightPhase.GoAround ? 'green' : 'white';
    const altitudeColour = haveDestination
      ? mcdu.flightPhaseManager.phase >= FmgcFlightPhase.GoAround
        ? 'green'
        : 'cyan'
      : 'white';

    const plan = mcdu.flightPlanService.active;
    const thrRed = plan.performanceData.missedThrustReductionAltitude;
    const thrRedPilot = plan.performanceData.missedThrustReductionAltitudeIsPilotEntered;
    const acc = plan.performanceData.missedAccelerationAltitude;
    const accPilot = plan.performanceData.missedAccelerationAltitudeIsPilotEntered;
    const eoAcc = plan.performanceData.missedEngineOutAccelerationAltitude;
    const eoAccPilot = plan.performanceData.missedEngineOutAccelerationAltitudeIsPilotEntered;

    const thrRedAcc = `{${thrRedPilot ? 'big' : 'small'}}${thrRed !== null ? thrRed.toFixed(0).padStart(5, '\xa0') : '-----'}{end}/{${accPilot ? 'big' : 'small'}}${acc !== null ? acc.toFixed(0).padEnd(5, '\xa0') : '-----'}{end}`;
    const engOut = `{${eoAccPilot ? 'big' : 'small'}}${eoAcc !== null ? eoAcc.toFixed(0).padStart(5, '\xa0') : '-----'}{end}`;

    mcdu.onLeftInput[4] = (value, scratchpadCallback) => {
      if (mcdu.trySetThrustReductionAccelerationAltitudeGoaround(value)) {
        CDUPerformancePage.ShowGOAROUNDPage(mcdu);
      } else {
        scratchpadCallback();
      }
    };

    mcdu.onRightInput[4] = (value, scratchpadCallback) => {
      if (mcdu.trySetEngineOutAccelerationAltitudeGoaround(value)) {
        CDUPerformancePage.ShowGOAROUNDPage(mcdu);
      } else {
        scratchpadCallback();
      }
    };

    let flpRetrCell = '---';
    let sltRetrCell = '---';
    let cleanCell = '---';
    if (isFinite(mcdu.zeroFuelWeight)) {
      const flapSpeed = mcdu.computedVfs;
      if (isFinite(flapSpeed)) {
        flpRetrCell = `{green}${flapSpeed.toFixed(0).padEnd(3, '\xa0')}{end}`;
      }
      const slatSpeed = mcdu.computedVss;
      if (isFinite(slatSpeed)) {
        sltRetrCell = `{green}${slatSpeed.toFixed(0).padEnd(3, '\xa0')}{end}`;
      }
      const cleanSpeed = mcdu.computedVgd;
      if (isFinite(cleanSpeed)) {
        cleanCell = `{green}${cleanSpeed.toFixed(0).padEnd(3, '\xa0')}{end}`;
      }
    }

    const bottomRowLabels = [
      '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0',
      '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0',
    ];
    const bottomRowCells = [
      '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0',
      '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0',
    ];
    if (mcdu.flightPhaseManager.phase === FmgcFlightPhase.GoAround) {
      if (confirmAppr) {
        bottomRowLabels[0] = '\xa0{amber}CONFIRM{amber}\xa0\xa0\xa0\xa0';
        bottomRowCells[0] = '{amber}*APPR\xa0PHASE{end}\xa0';
        mcdu.leftInputDelay[5] = () => {
          return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = async () => {
          if (mcdu.flightPhaseManager.tryGoInApproachPhase()) {
            CDUPerformancePage.ShowAPPRPage(mcdu);
          }
        };
      } else {
        bottomRowLabels[0] = '\xa0{cyan}ACTIVATE{end}\xa0\xa0\xa0';
        bottomRowCells[0] = '{cyan}{APPR\xa0PHASE{end}\xa0';
        mcdu.leftInputDelay[5] = () => {
          return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
          CDUPerformancePage.ShowGOAROUNDPage(mcdu, true);
        };
      }
      bottomRowLabels[1] = '\xa0\xa0\xa0\xa0\xa0\xa0\xa0{white}NEXT{end}\xa0';
      bottomRowCells[1] = '\xa0\xa0\xa0\xa0\xa0\xa0{white}PHASE>{end}';
      mcdu.rightInputDelay[5] = () => {
        return mcdu.getDelaySwitchPage();
      };
      mcdu.onRightInput[5] = () => {
        CDUPerformancePage.ShowAPPRPage(mcdu);
      };
    } else {
      bottomRowLabels[0] = '\xa0{white}PREV{end}\xa0\xa0\xa0\xa0\xa0\xa0\xa0';
      bottomRowCells[0] = '{white}<PHASE{end}\xa0\xa0\xa0\xa0\xa0\xa0';
      mcdu.leftInputDelay[5] = () => {
        return mcdu.getDelaySwitchPage();
      };
      mcdu.onLeftInput[5] = () => {
        CDUPerformancePage.ShowAPPRPage(mcdu);
      };
    }

    mcdu.setTemplate([
      [`{${titleColor}}\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0GO\xa0AROUND\xa0\xa0\xa0\xa0\xa0\xa0{end}`],
      ['', '', '\xa0\xa0\xa0\xa0\xa0FLP\xa0RETR\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0'],
      ['', '', `\xa0\xa0\xa0\xa0\xa0\xa0\xa0F=${flpRetrCell}\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0`],
      ['', '', '\xa0\xa0\xa0\xa0\xa0SLT RETR\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0'],
      ['', '', `\xa0\xa0\xa0\xa0\xa0\xa0\xa0S=${sltRetrCell}\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0`],
      ['', '', '\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0CLEAN\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0'],
      ['', '', `\xa0\xa0\xa0\xa0\xa0\xa0\xa0O=${cleanCell}\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0`],
      [''],
      [''],
      ['', '', 'THR\xa0RED/ACC\xa0\xa0ENG\xa0OUT\xa0ACC'],
      ['', '', `{${altitudeColour}}${thrRedAcc}\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0${engOut}{end}`],
      ['', '', bottomRowLabels.join('')],
      ['', '', bottomRowCells.join('')],
    ]);
  }

  static getClbSelectedTitleAndValue(mcdu: LegacyFmsPageInterface, isPhaseActive, isSelected, preSel) {
    if (!isPhaseActive) {
      return ['PRESEL', (isFinite(preSel) ? '\xa0' + preSel : '*[ ]') + '[color]cyan'];
    }

    if (!isSelected) {
      return ['', ''];
    }

    const aircraftAltitude = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
    const selectedSpdMach = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_SPEED_SELECTED', 'number');

    if (selectedSpdMach < 1) {
      return ['SELECTED', `\xa0${selectedSpdMach.toFixed(2).replace('0.', '.')}[color]green`];
    } else {
      const machAtManualCrossoverAlt = mcdu.casToMachManualCrossoverCurve.evaluate(selectedSpdMach);
      const manualCrossoverAltitude = mcdu.computeManualCrossoverAltitude(machAtManualCrossoverAlt);
      const shouldShowMach =
        aircraftAltitude < manualCrossoverAltitude &&
        (!mcdu.cruiseLevel || manualCrossoverAltitude < mcdu.cruiseLevel * 100);

      return [
        'SELECTED',
        `\xa0${Math.round(selectedSpdMach)}${shouldShowMach ? '{small}/' + machAtManualCrossoverAlt.toFixed(2).replace('0.', '.') + '{end}' : ''}[color]green`,
      ];
    }
  }

  static getDesSelectedTitleAndValue(mcdu: LegacyFmsPageInterface, isPhaseActive, isSelected) {
    if (!isPhaseActive || !isSelected) {
      return ['', ''];
    }

    const aircraftAltitude = SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
    const selectedSpdMach = SimVar.GetSimVarValue('L:A32NX_AUTOPILOT_SPEED_SELECTED', 'number');

    if (selectedSpdMach < 1) {
      const casAtCrossoverAltitude = mcdu.machToCasManualCrossoverCurve.evaluate(selectedSpdMach);
      const manualCrossoverAltitude = mcdu.computeManualCrossoverAltitude(selectedSpdMach);
      const shouldShowCas = aircraftAltitude > manualCrossoverAltitude;

      return [
        'SELECTED',
        `\xa0${shouldShowCas ? '{small}' + Math.round(casAtCrossoverAltitude) + '/{end}' : ''}${selectedSpdMach.toFixed(2).replace('0.', '.')}[color]green`,
      ];
    } else {
      return ['SELECTED', `\xa0${Math.round(selectedSpdMach)}[color]green`];
    }
  }

  static formatAltitudeOrLevel(altitudeToFormat, transitionAltitude) {
    if (transitionAltitude >= 100 && altitudeToFormat > transitionAltitude) {
      return `FL${(altitudeToFormat / 100).toFixed(0).toString().padStart(3, '0')}`;
    }

    return (10 * Math.round(altitudeToFormat / 10)).toFixed(0).toString().padStart(5, '\xa0');
  }

  static getTimeAndDistancePredictionsFromGeometryProfile(
    geometryProfile,
    altitudeToPredict,
    isClimbVsDescent,
    printSmall = false,
  ) {
    let predToDistanceCell = '---';
    let predToTimeCell = '----';

    if (!geometryProfile || !geometryProfile.isReadyToDisplay) {
      return [predToTimeCell, predToDistanceCell];
    }

    const predictions = isClimbVsDescent
      ? geometryProfile.computeClimbPredictionToAltitude(altitudeToPredict)
      : geometryProfile.computeDescentPredictionToAltitude(altitudeToPredict);

    if (predictions) {
      if (Number.isFinite(predictions.distanceFromStart)) {
        if (printSmall) {
          predToDistanceCell = '{small}' + predictions.distanceFromStart.toFixed(0) + '{end}[color]green';
        } else {
          predToDistanceCell = predictions.distanceFromStart.toFixed(0) + '[color]green';
        }
      }

      if (Number.isFinite(predictions.secondsFromPresent)) {
        const utcTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');
        const predToTimeCellText = FmsFormatters.secondsToUTC(utcTime + predictions.secondsFromPresent);

        if (printSmall) {
          predToTimeCell = '{small}' + predToTimeCellText + '{end}[color]green';
        } else {
          predToTimeCell = predToTimeCellText + '[color]green';
        }
      }
    }

    return [predToDistanceCell, predToTimeCell];
  }

  static formatDestEfobAndTime(mcdu: LegacyFmsPageInterface, isFlying) {
    const destinationPrediction = mcdu.guidanceController.vnavDriver.getDestinationPrediction();

    let destEfobCell = '---.-';
    let destTimeCell = '----';

    if (destinationPrediction) {
      if (Number.isFinite(destinationPrediction.estimatedFuelOnBoard)) {
        destEfobCell =
          (NXUnits.poundsToUser(destinationPrediction.estimatedFuelOnBoard) / 1000).toFixed(1) + '[color]green';
      }

      if (Number.isFinite(destinationPrediction.secondsFromPresent)) {
        const utcTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');

        const predToTimeCellText = isFlying
          ? FmsFormatters.secondsToUTC(utcTime + destinationPrediction.secondsFromPresent)
          : FmsFormatters.secondsTohhmm(destinationPrediction.secondsFromPresent);

        destTimeCell = predToTimeCellText + '[color]green';
      }
    }

    return [destEfobCell, destTimeCell];
  }

  static formatToReasonDistanceAndTime(mcdu: LegacyFmsPageInterface) {
    const toPrediction = mcdu.guidanceController.vnavDriver.getPerfCrzToPrediction();

    let reasonCell = '(T/D)';
    let distCell = '---';
    let timeCell = '----';

    if (toPrediction) {
      if (Number.isFinite(toPrediction.distanceFromPresentPosition)) {
        distCell = Math.round(toPrediction.distanceFromPresentPosition) + '[color]green';
      }

      if (Number.isFinite(toPrediction.secondsFromPresent)) {
        const utcTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');

        timeCell = FmsFormatters.secondsToUTC(utcTime + toPrediction.secondsFromPresent) + '[color]green';
      }

      if (toPrediction.reason === 'StepClimb') {
        reasonCell = '(S/C)';
      } else if (toPrediction.reason === 'StepDescent') {
        reasonCell = '(S/D)';
      }
    }

    return ['{small}TO{end}\xa0{green}' + reasonCell + '{end}', distCell, timeCell];
  }

  static formatCostIndexCell(mcdu: LegacyFmsPageInterface, hasFromToPair, allowModification) {
    let costIndexCell = '---';
    if (hasFromToPair) {
      if (mcdu.isCostIndexSet && Number.isFinite(mcdu.costIndex)) {
        costIndexCell = `${mcdu.costIndex.toFixed(0)}[color]${allowModification ? 'cyan' : 'green'}`;
      } else {
        costIndexCell = '___[color]amber';
      }
    }

    return costIndexCell;
  }
}
