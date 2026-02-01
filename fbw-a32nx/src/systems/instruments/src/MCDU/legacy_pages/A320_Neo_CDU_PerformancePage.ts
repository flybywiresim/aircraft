// @ts-strict-ignore
// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ApproachUtils, NXUnits, RunwayUtils, ApproachType } from '@flybywiresim/fbw-sdk';
import { FmgcFlightPhase } from '@shared/flightphase';
import { CDUStepAltsPage } from './A320_Neo_CDU_StepAltsPage';
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FmsFormatters } from '../legacy/FmsFormatters';
import { FlightPlanIndex } from '../../../../fmgc/src/flightplanning/FlightPlanManager';
import { BitFlags } from '@microsoft/msfs-sdk';
import { FlightPlanFlags } from '@fmgc/flightplanning/plans/FlightPlanFlags';

export class CDUPerformancePage {
  private static _timer: number | undefined = undefined;
  private static _lastPhase: FmgcFlightPhase | undefined = undefined;

  static ShowPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, _phase = undefined) {
    if (forPlan >= FlightPlanIndex.FirstSecondary) {
      mcdu.efisInterfaces.L.setSecRelatedPageOpen(
        forPlan >= FlightPlanIndex.FirstSecondary ? forPlan - FlightPlanIndex.FirstSecondary + 1 : null,
      );
      mcdu.efisInterfaces.R.setSecRelatedPageOpen(
        forPlan >= FlightPlanIndex.FirstSecondary ? forPlan - FlightPlanIndex.FirstSecondary + 1 : null,
      );
      mcdu.onUnload = () => {
        mcdu.efisInterfaces.L.setSecRelatedPageOpen(null);
        mcdu.efisInterfaces.R.setSecRelatedPageOpen(null);
      };
    }
    mcdu.activeSystem = 'FMGC';

    const targetPlan = mcdu.getFlightPlan(forPlan);
    const targetPhase = targetPlan.isActiveOrCopiedFromActive()
      ? _phase ?? mcdu.flightPhaseManager.phase
      : FmgcFlightPhase.Preflight;

    switch (targetPhase) {
      case FmgcFlightPhase.Preflight:
        CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
        break;
      case FmgcFlightPhase.Takeoff:
        CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
        break;
      case FmgcFlightPhase.Climb:
        CDUPerformancePage.ShowCLBPage(mcdu, forPlan);
        break;
      case FmgcFlightPhase.Cruise:
        CDUPerformancePage.ShowCRZPage(mcdu, forPlan);
        break;
      case FmgcFlightPhase.Descent:
        CDUPerformancePage.ShowDESPage(mcdu, forPlan);
        break;
      case FmgcFlightPhase.Approach:
        CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
        break;
      case FmgcFlightPhase.GoAround:
        CDUPerformancePage.ShowGOAROUNDPage(mcdu, forPlan);
        break;
    }
  }
  static ShowTAKEOFFPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.PerformancePageTakeoff;
    CDUPerformancePage._timer = 0;
    CDUPerformancePage._lastPhase = mcdu.flightPhaseManager.phase;

    const targetPlan = mcdu.getFlightPlan(forPlan);

    mcdu.pageUpdate = () => {
      CDUPerformancePage._timer++;
      if (CDUPerformancePage._timer >= 50) {
        if (
          !targetPlan.isActiveOrCopiedFromActive() || // Do not switch page automatically on SEC page
          mcdu.flightPhaseManager.phase === CDUPerformancePage._lastPhase
        ) {
          CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
        } else {
          CDUPerformancePage.ShowPage(mcdu, forPlan);
        }
      }
    };

    const isActivePlan = forPlan === FlightPlanIndex.Active;

    const isPhaseActive = mcdu.flightPhaseManager.phase === FmgcFlightPhase.Takeoff;
    const titlePrefix = forPlan >= FlightPlanIndex.FirstSecondary ? 'SEC\xa0' : '\xa0\xa0\xa0\xa0';
    const titleColor = isPhaseActive && isActivePlan ? 'green' : 'white';

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
    if (mcdu.flightPhaseManager.phase < FmgcFlightPhase.Takeoff || !targetPlan.isActiveOrCopiedFromActive()) {
      v1 = isActivePlan ? '{amber}___{end}' : '{cyan}[\xa0]{end}';

      if (isActivePlan && mcdu.unconfirmedV1Speed) {
        v1Check = `{small}{cyan}${('' + mcdu.unconfirmedV1Speed).padEnd(3)}{end}{end}`;
      } else if (targetPlan.performanceData.v1.get()) {
        v1 = `{cyan}${('' + targetPlan.performanceData.v1.get()).padEnd(3)}{end}`;
      }
      mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
        if (isActivePlan && value === '') {
          if (mcdu.unconfirmedV1Speed) {
            mcdu.setV1Speed(mcdu.unconfirmedV1Speed, forPlan);
            mcdu.unconfirmedV1Speed = undefined;
          } else {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
          }
          CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
        } else {
          if (mcdu.trySetV1Speed(value, forPlan)) {
            CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
          } else {
            scratchpadCallback();
          }
        }
      };
      vR = isActivePlan ? '{amber}___{end}' : '{cyan}[\xa0]{end}';
      if (isActivePlan && mcdu.unconfirmedVRSpeed) {
        vRCheck = `{small}{cyan}${('' + mcdu.unconfirmedVRSpeed).padEnd(3)}{end}{end}`;
      } else if (targetPlan.performanceData.vr.get()) {
        vR = `{cyan}${('' + targetPlan.performanceData.vr.get()).padEnd(3)}{end}`;
      }
      mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
        if (isActivePlan && value === '') {
          if (mcdu.unconfirmedVRSpeed) {
            mcdu.setVrSpeed(mcdu.unconfirmedVRSpeed, forPlan);
            mcdu.unconfirmedVRSpeed = undefined;
          } else {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
          }
          CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
        } else {
          if (mcdu.trySetVRSpeed(value, forPlan)) {
            CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
          } else {
            scratchpadCallback();
          }
        }
      };
      v2 = isActivePlan ? '{amber}___{end}' : '{cyan}[\xa0]{end}';
      if (isActivePlan && mcdu.unconfirmedV2Speed) {
        v2Check = `{small}{cyan}${('' + mcdu.unconfirmedV2Speed).padEnd(3)}{end}{end}`;
      } else if (targetPlan.performanceData.v2.get()) {
        v2 = `{cyan}${('' + targetPlan.performanceData.v2.get()).padEnd(3)}{end}`;
      }
      mcdu.onLeftInput[2] = (value, scratchpadCallback) => {
        if (isActivePlan && value === '') {
          if (mcdu.unconfirmedV2Speed) {
            mcdu.setV2Speed(mcdu.unconfirmedV2Speed, forPlan);
            mcdu.unconfirmedV2Speed = undefined;
          } else {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
          }
          CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
        } else {
          if (mcdu.trySetV2Speed(value, forPlan)) {
            CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
          } else {
            scratchpadCallback();
          }
        }
      };
    } else {
      v1 = '\xa0\xa0\xa0';
      vR = '\xa0\xa0\xa0';
      v2 = '\xa0\xa0\xa0';

      if (targetPlan.performanceData.v1.get() !== null) {
        v1 = `{green}${('' + targetPlan.performanceData.v1.get()).padEnd(3)}{end}`;
      }
      if (targetPlan.performanceData.vr.get() !== null) {
        vR = `{green}${('' + targetPlan.performanceData.vr.get()).padEnd(3)}{end}`;
      }
      if (targetPlan.performanceData.v2.get() !== null) {
        v2 = `{green}${('' + targetPlan.performanceData.v2.get()).padEnd(3)}{end}`;
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

      const transAlt = targetPlan.performanceData.transitionAltitude.get();
      const transAltitudeIsFromDatabase = targetPlan.performanceData.transitionAltitudeIsFromDatabase.get();

      if (transAlt !== null) {
        transAltCell = `{cyan}${transAlt}{end}`;
        if (transAltitudeIsFromDatabase) {
          transAltCell += '[s-text]';
        }
      }

      mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
        if (mcdu.trySetTakeOffTransAltitude(value, forPlan)) {
          CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      };
    }

    // thrust reduction / acceleration altitude
    const altitudeColour = hasOrigin
      ? mcdu.flightPhaseManager.phase >= FmgcFlightPhase.Takeoff && targetPlan.isActiveOrCopiedFromActive()
        ? 'green'
        : 'cyan'
      : 'white';

    const thrRed = targetPlan.performanceData.thrustReductionAltitude.get();
    const thrRedPilot = targetPlan.performanceData.thrustReductionAltitudeIsPilotEntered.get();
    const acc = targetPlan.performanceData.accelerationAltitude.get();
    const accPilot = targetPlan.performanceData.accelerationAltitudeIsPilotEntered.get();
    const eoAcc = targetPlan.performanceData.engineOutAccelerationAltitude.get();
    const eoAccPilot = targetPlan.performanceData.engineOutAccelerationAltitudeIsPilotEntered.get();

    const thrRedAcc = `{${thrRedPilot ? 'big' : 'small'}}${thrRed !== null ? thrRed.toFixed(0).padStart(5, '\xa0') : '-----'}{end}/{${accPilot ? 'big' : 'small'}}${acc !== null ? acc.toFixed(0).padEnd(5, '\xa0') : '-----'}{end}`;

    mcdu.onLeftInput[4] = (value, scratchpadCallback) => {
      if (mcdu.trySetThrustReductionAccelerationAltitude(value, forPlan)) {
        CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
      } else {
        scratchpadCallback();
      }
    };

    // eng out acceleration altitude
    const engOut = `{${eoAccPilot ? 'big' : 'small'}}${eoAcc !== null ? eoAcc.toFixed(0).padStart(5, '\xa0') : '-----'}{end}`;
    mcdu.onRightInput[4] = (value, scratchpadCallback) => {
      if (mcdu.trySetEngineOutAcceleration(value, forPlan)) {
        CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
      } else {
        scratchpadCallback();
      }
    };

    // center column
    let flpRetrCell = '---';
    let sltRetrCell = '---';
    let cleanCell = '---';
    // TODO sec perf characteristic speeds computation
    if (Number.isFinite(targetPlan.performanceData.zeroFuelWeight.get()) && forPlan === FlightPlanIndex.Active) {
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
      targetPlan.performanceData.trimmableHorizontalStabilizer.get() !== null
        ? targetPlan.performanceData.trimmableHorizontalStabilizer.get() >= 0 &&
          !Object.is(targetPlan.performanceData.trimmableHorizontalStabilizer.get(), -0)
          ? `UP${Math.abs(targetPlan.performanceData.trimmableHorizontalStabilizer.get()).toFixed(1)}`
          : `DN${Math.abs(targetPlan.performanceData.trimmableHorizontalStabilizer.get()).toFixed(1)}`
        : '';
    if (mcdu.flightPhaseManager.phase < FmgcFlightPhase.Takeoff || !targetPlan.isActiveOrCopiedFromActive()) {
      const flaps =
        targetPlan.performanceData.takeoffFlaps.get() !== null ? targetPlan.performanceData.takeoffFlaps.get() : '[]';
      const ths = formattedThs ? formattedThs : '[\xa0\xa0\xa0]';
      flapsThs = `${flaps}/${ths}[color]cyan`;
      mcdu.onRightInput[2] = (value, scratchpadCallback) => {
        if (mcdu.trySetFlapsTHS(value, forPlan)) {
          CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      };
    } else {
      const flaps =
        targetPlan.performanceData.takeoffFlaps.get() !== null ? targetPlan.performanceData.takeoffFlaps.get() : '';
      const ths = formattedThs ? formattedThs : '\xa0\xa0\xa0\xa0\xa0';
      flapsThs = `${flaps}/${ths}[color]green`;
    }

    // flex takeoff temperature
    let flexTakeOffTempCell = '[\xa0\xa0]°[color]cyan';
    if (mcdu.flightPhaseManager.phase < FmgcFlightPhase.Takeoff || !targetPlan.isActiveOrCopiedFromActive()) {
      if (Number.isFinite(targetPlan.performanceData.flexTakeoffTemperature.get())) {
        if (mcdu._toFlexChecked) {
          flexTakeOffTempCell = `${targetPlan.performanceData.flexTakeoffTemperature.get().toFixed(0)}°[color]cyan`;
        } else {
          flexTakeOffTempCell = `{small}${targetPlan.performanceData.flexTakeoffTemperature.get().toFixed(0)}{end}${flexTakeOffTempCell}[color]cyan`;
        }
      }
      mcdu.onRightInput[3] = (value, scratchpadCallback) => {
        if (mcdu._toFlexChecked) {
          if (mcdu.setPerfTOFlexTemp(value, forPlan)) {
            CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
          } else {
            scratchpadCallback();
          }
        } else {
          if (value === '' || mcdu.setPerfTOFlexTemp(value, forPlan)) {
            mcdu._toFlexChecked = true;
            CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
          } else {
            scratchpadCallback();
          }
        }
      };
    } else {
      if (Number.isFinite(targetPlan.performanceData.flexTakeoffTemperature.get())) {
        flexTakeOffTempCell = `${targetPlan.performanceData.flexTakeoffTemperature.get().toFixed(0)}°[color]green`;
      } else {
        flexTakeOffTempCell = '';
      }
    }

    let next = 'NEXT\xa0';
    let nextPhase = 'PHASE>';
    if (
      isActivePlan &&
      (mcdu.unconfirmedV1Speed || mcdu.unconfirmedVRSpeed || mcdu.unconfirmedV2Speed || !mcdu._toFlexChecked) &&
      mcdu.flightPhaseManager.phase < FmgcFlightPhase.Takeoff
    ) {
      next = 'CONFIRM\xa0';
      nextPhase = 'TO DATA*';
      mcdu.onRightInput[5] = () => {
        mcdu.setV1Speed(
          mcdu.unconfirmedV1Speed ? mcdu.unconfirmedV1Speed : targetPlan.performanceData.v1.get(),
          forPlan,
        );
        mcdu.setVrSpeed(
          mcdu.unconfirmedVRSpeed ? mcdu.unconfirmedVRSpeed : targetPlan.performanceData.vr.get(),
          forPlan,
        );
        mcdu.setV2Speed(
          mcdu.unconfirmedV2Speed ? mcdu.unconfirmedV2Speed : targetPlan.performanceData.v2.get(),
          forPlan,
        );
        mcdu.unconfirmedV1Speed = undefined;
        mcdu.unconfirmedVRSpeed = undefined;
        mcdu.unconfirmedV2Speed = undefined;
        mcdu._toFlexChecked = true;
        CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
      };
    } else {
      mcdu.rightInputDelay[5] = () => {
        return mcdu.getDelaySwitchPage();
      };
      mcdu.onRightInput[5] = () => {
        CDUPerformancePage.ShowCLBPage(mcdu, forPlan);
      };
    }

    const titleCell = `${titlePrefix}TAKE\xa0OFF\xa0RWY\xa0{green}${runway.padStart(3, '\xa0')}{end}\xa0\xa0\xa0\xa0[color]${titleColor}`;

    mcdu.setTemplate([
      [titleCell],
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
  static ShowCLBPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, confirmAppr = false) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.PerformancePageClb;
    CDUPerformancePage._timer = 0;
    CDUPerformancePage._lastPhase = mcdu.flightPhaseManager.phase;

    const targetPlan = mcdu.getFlightPlan(forPlan);

    mcdu.pageUpdate = () => {
      CDUPerformancePage._timer++;
      if (CDUPerformancePage._timer >= 100) {
        if (
          !targetPlan.isActiveOrCopiedFromActive() || // Do not switch page automatically on SEC page
          mcdu.flightPhaseManager.phase === CDUPerformancePage._lastPhase
        ) {
          CDUPerformancePage.ShowCLBPage(mcdu, forPlan);
        } else {
          CDUPerformancePage.ShowPage(mcdu, forPlan);
        }
      }
    };

    const isActivePlan = forPlan === FlightPlanIndex.Active;
    const isCopyOfActivePlan = BitFlags.isAll(targetPlan.flags, FlightPlanFlags.CopiedFromActive);

    const hasFromToPair = !!targetPlan.originAirport && !!targetPlan.destinationAirport;
    const showManagedSpeed = hasFromToPair && targetPlan.performanceData.costIndex.get() !== null;
    const isPhaseActive = mcdu.flightPhaseManager.phase === FmgcFlightPhase.Climb;
    const isTakeoffOrClimbActive = isPhaseActive || mcdu.flightPhaseManager.phase === FmgcFlightPhase.Takeoff;
    const titlePrefix = forPlan >= FlightPlanIndex.FirstSecondary ? 'SEC' : '\xa0\xa0\xa0';
    const titleColor = isPhaseActive && isActivePlan ? 'green' : 'white';
    const preselectedClimbSpeed = targetPlan.performanceData.preselectedClimbSpeed.get();
    const isPhaseActiveInActive = isPhaseActive && targetPlan.isActiveOrCopiedFromActive();
    const isSelected =
      (isPhaseActiveInActive && Simplane.getAutoPilotAirspeedSelected()) ||
      (!isPhaseActiveInActive && preselectedClimbSpeed !== null);
    const actModeCell = isSelected ? 'SELECTED' : 'MANAGED';
    const costIndexCell = CDUPerformancePage.formatCostIndexCell(
      targetPlan.performanceData.costIndex.get(),
      isActivePlan,
      hasFromToPair,
      true,
    );
    const canClickManagedSpeed = showManagedSpeed && preselectedClimbSpeed !== null && !isPhaseActive;

    // Predictions to altitude
    const vnavDriver = mcdu.guidanceController.vnavDriver;

    const cruiseLevel = targetPlan.performanceData.cruiseFlightLevel.get();
    const cruiseAltitude = cruiseLevel !== null ? cruiseLevel * 100 : null;
    const fcuAltitude = SimVar.GetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR:3', 'feet');
    const altitudeToPredict =
      mcdu.perfClbPredToAltitudePilot !== undefined
        ? mcdu.perfClbPredToAltitudePilot
        : cruiseAltitude !== null
          ? Math.min(cruiseAltitude, fcuAltitude)
          : fcuAltitude;

    const shouldShowPredTo = isActivePlan && isTakeoffOrClimbActive;
    const shouldShowExpedite = isActivePlan && isPhaseActive;

    const predToLabel = shouldShowPredTo ? '\xa0\xa0\xa0\xa0\xa0{small}PRED TO{end}' : '';
    const predToCell = shouldShowPredTo
      ? `${CDUPerformancePage.formatAltitudeOrLevel(altitudeToPredict, mcdu.getOriginTransitionAltitude())}[color]cyan`
      : '';

    let predToDistanceCell = '';
    let predToTimeCell = '';

    let expeditePredToDistanceCell = '';
    let expeditePredToTimeCell = '';

    if (shouldShowPredTo && vnavDriver) {
      [predToDistanceCell, predToTimeCell] = CDUPerformancePage.getTimeAndDistancePredictionsFromGeometryProfile(
        vnavDriver.ndProfile,
        altitudeToPredict,
        true,
      );
    }
    if (shouldShowExpedite && vnavDriver) {
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
      managedSpeedCell = `\xa0${mcdu.managedSpeedClimb.toFixed(0)}/${mcdu.managedSpeedClimbMach.toFixed(2).replace('0.', '.')}`;
    } else {
      let climbSpeed = Math.min(mcdu.managedSpeedClimb, mcdu.getNavModeSpeedConstraint());
      if (
        mcdu.climbSpeedLimit !== undefined &&
        SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < mcdu.climbSpeedLimitAlt
      ) {
        climbSpeed = Math.min(climbSpeed, mcdu.climbSpeedLimit);
      }

      managedSpeedCell = `${canClickManagedSpeed ? '*' : '\xa0'}${climbSpeed.toFixed(0)}/${mcdu.managedSpeedClimbMach
        .toFixed(2)
        .replace('0.', '.')}`;

      mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
        if (mcdu.trySetPreSelectedClimbSpeed(value, forPlan)) {
          CDUPerformancePage.ShowCLBPage(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      };
    }
    const [selectedSpeedTitle, selectedSpeedCell] = CDUPerformancePage.getClbSelectedTitleAndValue(
      mcdu,
      isPhaseActive,
      isSelected,
      targetPlan.performanceData.cruiseFlightLevel.get(),
      targetPlan.performanceData.preselectedClimbSpeed.get(),
    );

    if (hasFromToPair) {
      mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
        if (mcdu.tryUpdateCostIndex(value, forPlan)) {
          CDUPerformancePage.ShowCLBPage(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      };
    }

    if (canClickManagedSpeed) {
      mcdu.onLeftInput[2] = (_, scratchpadCallback) => {
        if (mcdu.trySetPreSelectedClimbSpeed(Keypad.clrValue, forPlan)) {
          CDUPerformancePage.ShowCLBPage(mcdu, forPlan);
        }

        scratchpadCallback();
      };
    }

    if (shouldShowPredTo) {
      mcdu.onRightInput[1] = (value, scratchpadCallback) => {
        if (mcdu.trySetPerfClbPredToAltitude(value, cruiseLevel)) {
          CDUPerformancePage.ShowCLBPage(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      };
    }

    const [toUtcLabel, toDistLabel] = shouldShowPredTo ? ['\xa0UTC', 'DIST'] : ['', ''];

    const bottomRowLabels = ['\xa0PREV', 'NEXT\xa0'];
    const bottomRowCells = ['<PHASE', 'PHASE>'];
    mcdu.leftInputDelay[5] = () => mcdu.getDelaySwitchPage();
    if (isActivePlan && isPhaseActive) {
      if (confirmAppr) {
        bottomRowLabels[0] = '\xa0CONFIRM[color]amber';
        bottomRowCells[0] = '*APPR PHASE[color]amber';
        mcdu.onLeftInput[5] = async () => {
          if (mcdu.flightPhaseManager.tryGoInApproachPhase()) {
            CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
          }
        };
      } else {
        bottomRowLabels[0] = '\xa0ACTIVATE[color]cyan';
        bottomRowCells[0] = '{APPR PHASE[color]cyan';
        mcdu.onLeftInput[5] = () => {
          CDUPerformancePage.ShowCLBPage(mcdu, forPlan, true);
        };
      }
    } else if (!isCopyOfActivePlan || !isPhaseActive) {
      mcdu.onLeftInput[5] = () => {
        CDUPerformancePage.ShowTAKEOFFPage(mcdu, forPlan);
      };
    } else {
      // Don't allow going back to TO page for SEC plan that is a copy of active plan
      bottomRowLabels[0] = '';
      bottomRowCells[0] = '';
    }

    mcdu.rightInputDelay[5] = () => mcdu.getDelaySwitchPage();
    mcdu.onRightInput[5] = () => {
      CDUPerformancePage.ShowCRZPage(mcdu, forPlan);
    };

    const titleCell = `\xa0${titlePrefix}\xa0\xa0\xa0\xa0\xa0\xa0\xa0{${titleColor}}CLB{end}\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0`;

    mcdu.setTemplate([
      [titleCell],
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
      shouldShowExpedite
        ? ['{small}EXPEDITE{end}[color]green', expeditePredToDistanceCell, expeditePredToTimeCell]
        : [''],
      bottomRowLabels,
      bottomRowCells,
    ]);
  }

  static ShowCRZPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, confirmAppr = false) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.PerformancePageCrz;
    CDUPerformancePage._timer = 0;
    CDUPerformancePage._lastPhase = mcdu.flightPhaseManager.phase;

    const targetPlan = mcdu.getFlightPlan(forPlan);

    mcdu.pageUpdate = () => {
      CDUPerformancePage._timer++;
      if (CDUPerformancePage._timer >= 100) {
        if (
          !targetPlan.isActiveOrCopiedFromActive() || // Do not switch page automatically on SEC page
          mcdu.flightPhaseManager.phase === CDUPerformancePage._lastPhase
        ) {
          CDUPerformancePage.ShowCRZPage(mcdu, forPlan);
        } else {
          CDUPerformancePage.ShowPage(mcdu, forPlan);
        }
      }
    };

    const isActivePlan = forPlan === FlightPlanIndex.Active;
    const isCopyOfActivePlan = BitFlags.isAll(targetPlan.flags, FlightPlanFlags.CopiedFromActive);

    const hasFromToPair = !!targetPlan.originAirport && !!targetPlan.destinationAirport;
    const isPhaseActive = mcdu.flightPhaseManager.phase === FmgcFlightPhase.Cruise;
    const isPhaseActiveInActive = isPhaseActive && targetPlan.isActiveOrCopiedFromActive();
    const titlePrefix = forPlan >= FlightPlanIndex.FirstSecondary ? 'SEC' : '\xa0\xa0\xa0';
    const titleColor = isPhaseActive && isActivePlan ? 'green' : 'white';
    const preselectedCruiseSpeed = targetPlan.performanceData.preselectedCruiseSpeed.get();
    const isSelected =
      (isPhaseActiveInActive && Simplane.getAutoPilotAirspeedSelected()) ||
      (!isPhaseActiveInActive && preselectedCruiseSpeed !== null);

    const isFlying = mcdu.flightPhaseManager.phase >= FmgcFlightPhase.Takeoff;
    const actModeCell = isSelected ? 'SELECTED' : 'MANAGED';
    const costIndexCell = CDUPerformancePage.formatCostIndexCell(
      targetPlan.performanceData.costIndex.get(),
      isActivePlan,
      hasFromToPair,
      true,
    );

    const shouldShowToTdInformation = isActivePlan && isFlying;
    const shouldShowCabinRate = isActivePlan;

    // TODO: Figure out correct condition
    const showManagedSpeed = hasFromToPair && targetPlan.performanceData.costIndex.get() !== null;
    const canClickManagedSpeed = showManagedSpeed && preselectedCruiseSpeed !== null && !isPhaseActive;
    let managedSpeedCell = '{small}\xa0---/---{end}[color]white';
    if (
      showManagedSpeed &&
      targetPlan.performanceData.cruiseFlightLevel.get() !== null &&
      Number.isFinite(mcdu.managedSpeedCruise) &&
      Number.isFinite(mcdu.managedSpeedCruiseMach)
    ) {
      const shouldShowCruiseMach = targetPlan.performanceData.cruiseFlightLevel.get() > 250;
      managedSpeedCell = `{small}${canClickManagedSpeed ? '*' : '\xa0'}${shouldShowCruiseMach ? mcdu.managedSpeedCruiseMach.toFixed(2).replace('0.', '.') : mcdu.managedSpeedCruise.toFixed(0)}{end}[color]green`;
    }

    const preselTitle = isPhaseActive ? '' : 'PRESEL';
    let preselCell = '';
    if (!isPhaseActive) {
      const hasPreselectedSpeedOrMach = preselectedCruiseSpeed !== null;
      if (hasPreselectedSpeedOrMach) {
        preselCell = `\xa0${preselectedCruiseSpeed < 1 ? preselectedCruiseSpeed.toFixed(2).replace('0.', '.') : preselectedCruiseSpeed.toFixed(0)}[color]cyan`;
      } else {
        preselCell = '{small}*{end}[ ][color]cyan';
      }
    }

    if (hasFromToPair) {
      mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
        if (mcdu.tryUpdateCostIndex(value, forPlan)) {
          CDUPerformancePage.ShowCRZPage(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      };
    }

    const timeLabel = isFlying && targetPlan.isActiveOrCopiedFromActive() ? '\xa0UTC' : 'TIME';

    const [destEfobCell, destTimeCell] = CDUPerformancePage.formatDestEfobAndTime(mcdu, isFlying, forPlan);
    const [toUtcLabel, toDistLabel] = shouldShowToTdInformation ? ['\xa0UTC', 'DIST'] : ['', ''];
    const [toReasonCell, toDistCell, toTimeCell, stepWaypoint] = shouldShowToTdInformation
      ? CDUPerformancePage.formatToReasonDistanceAndTime(mcdu, forPlan)
      : ['', '', '', ''];

    const desCabinRateCell = shouldShowCabinRate ? '{small}-350{end}' : '';

    const cruiseLevel = targetPlan.performanceData.cruiseFlightLevel.get();
    const shouldShowStepAltsOption =
      cruiseLevel &&
      (mcdu.flightPhaseManager.phase < FmgcFlightPhase.Descent ||
        mcdu.flightPhaseManager.phase > FmgcFlightPhase.GoAround);

    const bottomRowLabels = ['\xa0PREV', 'NEXT\xa0'];
    const bottomRowCells = ['<PHASE', 'PHASE>'];

    mcdu.leftInputDelay[5] = () => {
      return mcdu.getDelaySwitchPage();
    };

    if (isActivePlan && isPhaseActive) {
      if (confirmAppr) {
        bottomRowLabels[0] = '\xa0CONFIRM[color]amber';
        bottomRowCells[0] = '*APPR PHASE[color]amber';
        mcdu.onLeftInput[5] = async () => {
          if (mcdu.flightPhaseManager.tryGoInApproachPhase()) {
            CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
          }
        };
      } else {
        bottomRowLabels[0] = '\xa0ACTIVATE[color]cyan';
        bottomRowCells[0] = '{APPR PHASE[color]cyan';
        mcdu.onLeftInput[5] = () => {
          CDUPerformancePage.ShowCRZPage(mcdu, forPlan, true);
        };
      }
    } else {
      mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
        if (mcdu.trySetPreSelectedCruiseSpeed(value, forPlan)) {
          CDUPerformancePage.ShowCRZPage(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      };

      if (!isCopyOfActivePlan || !isPhaseActive) {
        mcdu.onLeftInput[5] = () => {
          CDUPerformancePage.ShowCLBPage(mcdu, forPlan);
        };
      } else {
        // Don't allow going back to CLB page for SEC plan that is a copy of active plan if CRZ is active
        bottomRowLabels[0] = '';
        bottomRowCells[0] = '';
      }
    }
    if (canClickManagedSpeed) {
      mcdu.onLeftInput[2] = (_, scratchpadCallback) => {
        if (mcdu.trySetPreSelectedCruiseSpeed(Keypad.clrValue, forPlan)) {
          CDUPerformancePage.ShowCRZPage(mcdu, forPlan);
        }

        scratchpadCallback();
      };
    }

    if (shouldShowCabinRate) {
      mcdu.onRightInput[3] = () => {
        // DES CABIN RATE
        mcdu.setScratchpadMessage(NXFictionalMessages.notYetImplemented);
      };
    }

    if (shouldShowStepAltsOption) {
      CDUStepAltsPage.Return = () => {
        CDUPerformancePage.ShowCRZPage(mcdu, forPlan, false);
      };
      mcdu.onRightInput[4] = () => {
        CDUStepAltsPage.ShowPage(mcdu, forPlan);
      };
    }

    mcdu.rightInputDelay[5] = () => mcdu.getDelaySwitchPage();
    mcdu.onRightInput[5] = () => {
      CDUPerformancePage.ShowDESPage(mcdu, forPlan);
    };

    const titleCell = `\xa0${titlePrefix}\xa0\xa0\xa0\xa0\xa0\xa0\xa0{${titleColor}}CRZ{end}\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0`;

    mcdu.setTemplate([
      [titleCell],
      ['ACT MODE', 'DEST EFOB', timeLabel],
      [`${actModeCell}[color]green`, destEfobCell, destTimeCell],
      ['CI', stepWaypoint],
      [costIndexCell, toReasonCell],
      ['MANAGED', toDistLabel, toUtcLabel],
      [managedSpeedCell, toDistCell, toTimeCell],
      [preselTitle, shouldShowCabinRate ? 'DES CABIN RATE' : ''],
      [preselCell, shouldShowCabinRate ? `\xa0{cyan}${desCabinRateCell}{end}{white}{small}FT/MN{end}{end}` : ''],
      [''],
      ['', shouldShowStepAltsOption ? 'STEP ALTS>' : ''],
      bottomRowLabels,
      bottomRowCells,
    ]);
  }

  static ShowDESPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, confirmAppr = false) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.PerformancePageDes;
    CDUPerformancePage._timer = 0;
    CDUPerformancePage._lastPhase = mcdu.flightPhaseManager.phase;

    const targetPlan = mcdu.getFlightPlan(forPlan);

    mcdu.pageUpdate = () => {
      CDUPerformancePage._timer++;
      if (CDUPerformancePage._timer >= 100) {
        if (
          !targetPlan.isActiveOrCopiedFromActive() || // Do not switch page automatically on SEC page
          mcdu.flightPhaseManager.phase === CDUPerformancePage._lastPhase
        ) {
          CDUPerformancePage.ShowDESPage(mcdu, forPlan);
        } else {
          CDUPerformancePage.ShowPage(mcdu, forPlan);
        }
      }
    };

    const isActivePlan = forPlan === FlightPlanIndex.Active;
    const isCopyOfActivePlan = BitFlags.isAll(targetPlan.flags, FlightPlanFlags.CopiedFromActive);

    const hasFromToPair = !!targetPlan.originAirport && !!targetPlan.destinationAirport;
    const isPhaseActive = mcdu.flightPhaseManager.phase === FmgcFlightPhase.Descent;
    const isPhaseActiveInActive = isPhaseActive && targetPlan.isActiveOrCopiedFromActive();
    const titlePrefix = forPlan >= FlightPlanIndex.FirstSecondary ? 'SEC' : '\xa0\xa0\xa0';
    const titleColor = isPhaseActive && isActivePlan ? 'green' : 'white';
    const isFlying =
      targetPlan.isActiveOrCopiedFromActive() && mcdu.flightPhaseManager.phase >= FmgcFlightPhase.Takeoff;

    const isSelected = isPhaseActiveInActive && Simplane.getAutoPilotAirspeedSelected();
    const actModeCell = isSelected ? 'SELECTED' : 'MANAGED';

    const shouldShowPredTo = isActivePlan && isPhaseActive;

    // Predictions to altitude
    const vnavDriver = mcdu.guidanceController.vnavDriver;
    const fcuAltitude = SimVar.GetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR:3', 'feet');
    const altitudeToPredict =
      mcdu.perfDesPredToAltitudePilot !== undefined ? mcdu.perfDesPredToAltitudePilot : fcuAltitude;

    const predToLabel = shouldShowPredTo ? '\xa0\xa0\xa0\xa0\xa0{small}PRED TO{end}' : '';
    const predToCell = shouldShowPredTo
      ? `${CDUPerformancePage.formatAltitudeOrLevel(altitudeToPredict, mcdu.getDestinationTransitionLevel() * 100)}[color]cyan`
      : '';

    let predToDistanceCell = '';
    let predToTimeCell = '';

    if (shouldShowPredTo && vnavDriver) {
      [predToDistanceCell, predToTimeCell] = CDUPerformancePage.getTimeAndDistancePredictionsFromGeometryProfile(
        vnavDriver.ndProfile,
        altitudeToPredict,
        false,
      );
    }

    const costIndexCell = CDUPerformancePage.formatCostIndexCell(
      targetPlan.performanceData.costIndex.get(),
      isActivePlan,
      hasFromToPair,
      !isPhaseActive,
    );

    const econDesPilotEntered = targetPlan.performanceData.pilotManagedDescentSpeed.get() !== null;
    const econDes = econDesPilotEntered
      ? targetPlan.performanceData.pilotManagedDescentSpeed.get() ?? undefined
      : mcdu.managedSpeedDescend;
    const econDesMachPilotEntered = targetPlan.performanceData.pilotManagedDescentMach.get() !== null;
    const econDesMach = econDesMachPilotEntered
      ? targetPlan.performanceData.pilotManagedDescentMach.get() ?? undefined
      : mcdu.managedSpeedDescendMach;

    // TODO: Figure out correct condition
    const showManagedSpeed =
      hasFromToPair &&
      targetPlan.performanceData.costIndex.get() !== null &&
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
    const [destEfobCell, destTimeCell] = CDUPerformancePage.formatDestEfobAndTime(mcdu, isFlying, forPlan);
    const [toUtcLabel, toDistLabel] = shouldShowPredTo ? ['\xa0UTC', 'DIST'] : ['', ''];

    const bottomRowLabels = ['\xa0PREV', 'NEXT\xa0'];
    const bottomRowCells = ['<PHASE', 'PHASE>'];
    mcdu.leftInputDelay[5] = () => mcdu.getDelaySwitchPage();
    if (shouldShowPredTo) {
      mcdu.onRightInput[1] = (value, scratchpadCallback) => {
        if (mcdu.trySetPerfDesPredToAltitude(value)) {
          CDUPerformancePage.ShowDESPage(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      };
    }

    if (isActivePlan && isPhaseActive) {
      if (confirmAppr) {
        bottomRowLabels[0] = '\xa0CONFIRM[color]amber';
        bottomRowCells[0] = '*APPR PHASE[color]amber';
        mcdu.onLeftInput[5] = async () => {
          if (mcdu.flightPhaseManager.tryGoInApproachPhase()) {
            CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
          }
        };
      } else {
        bottomRowLabels[0] = '\xa0ACTIVATE[color]cyan';
        bottomRowCells[0] = '{APPR PHASE[color]cyan';
        mcdu.onLeftInput[5] = () => {
          CDUPerformancePage.ShowDESPage(mcdu, forPlan, true);
        };
      }
    } else if (!isCopyOfActivePlan || !isPhaseActive) {
      mcdu.onLeftInput[5] = () => {
        CDUPerformancePage.ShowCRZPage(mcdu, forPlan);
      };
    } else {
      // Don't allow going back to CRZ page for SEC plan that is a copy of active plan
      bottomRowLabels[0] = '';
      bottomRowCells[0] = '';
    }

    // Can only modify cost index until the phase is active
    if (hasFromToPair && !isPhaseActive) {
      mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
        if (mcdu.tryUpdateCostIndex(value, forPlan)) {
          CDUPerformancePage.ShowDESPage(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      };
    }

    if (showManagedSpeed) {
      mcdu.onLeftInput[2] = (value, scratchpadCallback) => {
        if (mcdu.trySetManagedDescentSpeed(value, forPlan)) {
          CDUPerformancePage.ShowDESPage(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      };
    }

    mcdu.rightInputDelay[5] = () => mcdu.getDelaySwitchPage();
    mcdu.onRightInput[5] = () => {
      CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
    };

    const titleCell = `\xa0${titlePrefix}\xa0\xa0\xa0\xa0\xa0\xa0\xa0{${titleColor}}DES{end}\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0`;

    mcdu.setTemplate([
      [titleCell],
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

  static ShowAPPRPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.PerformancePageAppr;

    const isActivePlan = forPlan === FlightPlanIndex.Active;
    const plan = mcdu.getFlightPlan(forPlan);

    const isPhaseActive = mcdu.flightPhaseManager.phase === FmgcFlightPhase.Approach;

    CDUPerformancePage._timer = 0;
    CDUPerformancePage._lastPhase = mcdu.flightPhaseManager.phase;
    mcdu.pageUpdate = () => {
      CDUPerformancePage._timer++;
      if (CDUPerformancePage._timer >= 100) {
        if (!plan.isActiveOrCopiedFromActive() || mcdu.flightPhaseManager.phase === CDUPerformancePage._lastPhase) {
          CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
        }
      }
    };

    const distanceToDest = mcdu.getDistanceToDestination();
    const closeToDest = distanceToDest !== undefined && distanceToDest <= 180;

    let qnhCell = '[\xa0\xa0][color]cyan';
    if (Number.isFinite(plan.performanceData.approachQnh.get())) {
      if (plan.performanceData.approachQnh.get() < 500) {
        qnhCell = plan.performanceData.approachQnh.get().toFixed(2) + '[color]cyan';
      } else {
        qnhCell = plan.performanceData.approachQnh.get().toFixed(0) + '[color]cyan';
      }
    } else if (closeToDest && isActivePlan) {
      qnhCell = '____[color]amber';
    }
    mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
      if (mcdu.setPerfApprQNH(value, forPlan)) {
        CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
      } else {
        scratchpadCallback();
      }
    };

    let tempCell = '{cyan}[\xa0]°{end}';
    if (Number.isFinite(plan.performanceData.approachTemperature.get())) {
      tempCell =
        '{cyan}' +
        (plan.performanceData.approachTemperature.get() >= 0 ? '+' : '-') +
        ('' + Math.abs(plan.performanceData.approachTemperature.get()).toFixed(0)).padStart(2).replace(/ /g, '\xa0') +
        '°{end}';
    } else if (closeToDest && isActivePlan) {
      tempCell = '{amber}___°{end}';
    }
    mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
      if (mcdu.setPerfApprTemp(value, forPlan)) {
        CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
      } else {
        scratchpadCallback();
      }
    };
    let magWindHeadingCell = '[\xa0]';
    if (Number.isFinite(plan.performanceData.approachWindDirection.get())) {
      magWindHeadingCell = ('' + plan.performanceData.approachWindDirection.get().toFixed(0)).padStart(3, '0');
    }
    let magWindSpeedCell = '[\xa0]';
    if (Number.isFinite(plan.performanceData.approachWindMagnitude.get())) {
      magWindSpeedCell = plan.performanceData.approachWindMagnitude.get().toFixed(0).padStart(3, '0');
    }
    mcdu.onLeftInput[2] = (value, scratchpadCallback) => {
      if (mcdu.setPerfApprWind(value, forPlan)) {
        mcdu.updateTowerHeadwind();
        mcdu.updatePerfSpeeds();
        CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
      } else {
        scratchpadCallback();
      }
    };

    let transAltCell = '\xa0'.repeat(5);
    const hasDestination = !!plan.destinationAirport;

    if (hasDestination) {
      const transitionLevel = plan.performanceData.transitionLevel.get();

      if (transitionLevel !== null) {
        transAltCell = (transitionLevel * 100).toFixed(0).padEnd(5, '\xa0');

        if (plan.performanceData.transitionLevelIsFromDatabase.get()) {
          transAltCell = `{small}${transAltCell}{end}`;
        }
      } else {
        transAltCell = '[\xa0]'.padEnd(5, '\xa0');
      }
    }
    mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
      if (mcdu.setPerfApprTransAlt(value, forPlan)) {
        CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
      } else {
        scratchpadCallback();
      }
    };

    let vappCell = '---';
    let vlsCell = '---';
    let flpRetrCell = '---';
    let sltRetrCell = '---';
    let cleanCell = '---';
    if (
      isActivePlan &&
      Number.isFinite(plan.performanceData.zeroFuelWeight.get()) &&
      mcdu.approachSpeeds &&
      mcdu.approachSpeeds.valid
    ) {
      vappCell = `{cyan}{small}${mcdu.approachSpeeds.vapp.toFixed(0)}{end}{end}`;
      vlsCell = `{green}${mcdu.approachSpeeds.vls.toFixed(0)}{end}`;
      flpRetrCell = `{green}${mcdu.approachSpeeds.f.toFixed(0)}{end}`;
      sltRetrCell = `{green}${mcdu.approachSpeeds.s.toFixed(0)}{end}`;
      cleanCell = `{green}${mcdu.approachSpeeds.gd.toFixed(0)}{end}`;
    }
    if (Number.isFinite(plan.performanceData.pilotVapp.get())) {
      // pilot override
      vappCell = `{cyan}${plan.performanceData.pilotVapp.get().toFixed(0).padStart(3, '\xa0')}{end}`;
    }
    mcdu.onLeftInput[4] = (value, scratchpadCallback) => {
      if (mcdu.setPerfApprVApp(value, forPlan)) {
        CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
      } else {
        scratchpadCallback();
      }
    };
    mcdu.onRightInput[4] = () => {
      mcdu.setPerfApprFlaps3(!plan.performanceData.approachFlapsThreeSelected.get(), forPlan);
      mcdu.updatePerfSpeeds();
      CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
    };

    let baroCell = '[\xa0\xa0\xa0]';
    if (plan.performanceData.approachBaroMinimum.get() !== null) {
      baroCell = plan.performanceData.approachBaroMinimum.get().toFixed(0);
    }
    mcdu.onRightInput[1] = (value, scratchpadCallback) => {
      if (mcdu.setPerfApprMDA(value, forPlan) && mcdu.setPerfApprDH(Keypad.clrValue, forPlan)) {
        CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
      } else {
        scratchpadCallback();
      }
    };

    const approach = plan.approach;
    const isILS = approach && approach.type === ApproachType.Ils;
    let radioLabel = '';
    let radioCell = '';
    if (isILS) {
      radioLabel = 'RADIO';

      const dh = plan.performanceData.approachRadioMinimum.get();
      if (typeof dh === 'number') {
        radioCell = dh.toFixed(0);
      } else if (dh === 'NO DH') {
        radioCell = 'NO DH';
      } else {
        radioCell = '[\xa0]';
      }
      mcdu.onRightInput[2] = (value, scratchpadCallback) => {
        if (mcdu.setPerfApprDH(value, forPlan) && mcdu.setPerfApprMDA(Keypad.clrValue, forPlan)) {
          CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      };
    }

    const bottomRowLabels = ['\xa0PREV', 'NEXT\xa0'];
    const bottomRowCells = ['<PHASE', 'PHASE>'];

    const titlePrefix = forPlan >= FlightPlanIndex.FirstSecondary ? 'SEC' : '\xa0\xa0\xa0';
    const titleColor = isPhaseActive && isActivePlan ? 'green' : 'white';

    if (isPhaseActive && plan.isActiveOrCopiedFromActive()) {
      bottomRowLabels[0] = '';
      bottomRowCells[0] = '';
    } else {
      if (mcdu.flightPhaseManager.phase === FmgcFlightPhase.GoAround) {
        mcdu.leftInputDelay[5] = () => {
          return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
          CDUPerformancePage.ShowGOAROUNDPage(mcdu, forPlan);
        };
      } else {
        mcdu.leftInputDelay[5] = () => {
          return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
          CDUPerformancePage.ShowDESPage(mcdu, forPlan);
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
        CDUPerformancePage.ShowGOAROUNDPage(mcdu, forPlan);
      };
    }

    let titleCell = `\xa0${titlePrefix}\xa0{${titleColor}}APPR{end}\xa0`;
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
        plan.performanceData.approachFlapsThreeSelected.get()
          ? '{cyan}CONF3/{end}{small}FULL{end}*'
          : '{cyan}FULL/{end}{small}CONF3{end}*',
      ],
      /* 6l */ bottomRowLabels,
      /* 6L */ bottomRowCells,
    ]);
  }

  static ShowGOAROUNDPage(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex, confirmAppr = false) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.PerformancePageGoAround;
    CDUPerformancePage._timer = 0;
    CDUPerformancePage._lastPhase = mcdu.flightPhaseManager.phase;
    mcdu.pageUpdate = () => {
      CDUPerformancePage._timer++;
      if (CDUPerformancePage._timer >= 100) {
        if (mcdu.flightPhaseManager.phase === CDUPerformancePage._lastPhase) {
          CDUPerformancePage.ShowGOAROUNDPage(mcdu, forPlan);
        } else {
          CDUPerformancePage.ShowPage(mcdu, forPlan);
        }
      }
    };

    const isActivePlan = forPlan === FlightPlanIndex.Active;
    const plan = mcdu.getFlightPlan(forPlan);
    const haveDestination = plan.destinationAirport !== undefined;

    const titlePrefix = forPlan >= FlightPlanIndex.FirstSecondary ? 'SEC' : '\xa0\xa0\xa0';
    const isPhaseActive = mcdu.flightPhaseManager.phase === FmgcFlightPhase.GoAround;
    const titleColor = isPhaseActive && isActivePlan ? 'green' : 'white';
    const altitudeColour = haveDestination
      ? mcdu.flightPhaseManager.phase >= FmgcFlightPhase.GoAround
        ? 'green'
        : 'cyan'
      : 'white';

    const thrRed = plan.performanceData.missedThrustReductionAltitude.get();
    const thrRedPilot = plan.performanceData.missedThrustReductionAltitudeIsPilotEntered.get();
    const acc = plan.performanceData.missedAccelerationAltitude.get();
    const accPilot = plan.performanceData.missedAccelerationAltitudeIsPilotEntered.get();
    const eoAcc = plan.performanceData.missedEngineOutAccelerationAltitude.get();
    const eoAccPilot = plan.performanceData.missedEngineOutAccelerationAltitudeIsPilotEntered.get();

    const thrRedAcc = `{${thrRedPilot ? 'big' : 'small'}}${thrRed !== null ? thrRed.toFixed(0).padStart(5, '\xa0') : '-----'}{end}/{${accPilot ? 'big' : 'small'}}${acc !== null ? acc.toFixed(0).padEnd(5, '\xa0') : '-----'}{end}`;
    const engOut = `{${eoAccPilot ? 'big' : 'small'}}${eoAcc !== null ? eoAcc.toFixed(0).padStart(5, '\xa0') : '-----'}{end}`;

    mcdu.onLeftInput[4] = (value, scratchpadCallback) => {
      if (mcdu.trySetThrustReductionAccelerationAltitudeGoaround(value, forPlan)) {
        CDUPerformancePage.ShowGOAROUNDPage(mcdu, forPlan);
      } else {
        scratchpadCallback();
      }
    };

    mcdu.onRightInput[4] = (value, scratchpadCallback) => {
      if (mcdu.trySetEngineOutAccelerationAltitudeGoaround(value, forPlan)) {
        CDUPerformancePage.ShowGOAROUNDPage(mcdu, forPlan);
      } else {
        scratchpadCallback();
      }
    };

    let flpRetrCell = '---';
    let sltRetrCell = '---';
    let cleanCell = '---';
    if (isActivePlan && Number.isFinite(plan.performanceData.zeroFuelWeight.get())) {
      if (Number.isFinite(mcdu.approachSpeeds.f)) {
        flpRetrCell = `{green}${mcdu.approachSpeeds.f.toFixed(0).padEnd(3, '\xa0')}{end}`;
      }
      if (Number.isFinite(mcdu.approachSpeeds.s)) {
        sltRetrCell = `{green}${mcdu.approachSpeeds.s.toFixed(0).padEnd(3, '\xa0')}{end}`;
      }
      if (Number.isFinite(mcdu.approachSpeeds.gd)) {
        cleanCell = `{green}${mcdu.approachSpeeds.gd.toFixed(0).padEnd(3, '\xa0')}{end}`;
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
    if (isPhaseActive && plan.isActiveOrCopiedFromActive()) {
      if (isActivePlan) {
        if (confirmAppr) {
          bottomRowLabels[0] = '\xa0{amber}CONFIRM{amber}\xa0\xa0\xa0\xa0';
          bottomRowCells[0] = '{amber}*APPR\xa0PHASE{end}\xa0';
          mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
          };
          mcdu.onLeftInput[5] = async () => {
            if (mcdu.flightPhaseManager.tryGoInApproachPhase()) {
              CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
            }
          };
        } else {
          bottomRowLabels[0] = '\xa0{cyan}ACTIVATE{end}\xa0\xa0\xa0';
          bottomRowCells[0] = '{cyan}{APPR\xa0PHASE{end}\xa0';
          mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
          };
          mcdu.onLeftInput[5] = () => {
            CDUPerformancePage.ShowGOAROUNDPage(mcdu, forPlan, true);
          };
        }
      }
      bottomRowLabels[1] = '\xa0\xa0\xa0\xa0\xa0\xa0\xa0{white}NEXT{end}\xa0';
      bottomRowCells[1] = '\xa0\xa0\xa0\xa0\xa0\xa0{white}PHASE>{end}';
      mcdu.rightInputDelay[5] = () => {
        return mcdu.getDelaySwitchPage();
      };
      mcdu.onRightInput[5] = () => {
        CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
      };
    } else {
      bottomRowLabels[0] = '\xa0{white}PREV{end}\xa0\xa0\xa0\xa0\xa0\xa0\xa0';
      bottomRowCells[0] = '{white}<PHASE{end}\xa0\xa0\xa0\xa0\xa0\xa0';
      mcdu.leftInputDelay[5] = () => {
        return mcdu.getDelaySwitchPage();
      };
      mcdu.onLeftInput[5] = () => {
        CDUPerformancePage.ShowAPPRPage(mcdu, forPlan);
      };
    }

    mcdu.setTemplate([
      [`{${titleColor}}\xa0${titlePrefix}\xa0\xa0\xa0\xa0\xa0GO\xa0AROUND\xa0\xa0\xa0\xa0\xa0\xa0{end}`],
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

  static getClbSelectedTitleAndValue(
    mcdu: LegacyFmsPageInterface,
    isPhaseActive: boolean,
    isSelected: boolean,
    cruiseLevel: number | null,
    preSel?: number,
  ) {
    if (!isPhaseActive) {
      return ['PRESEL', (Number.isFinite(preSel) ? '\xa0' + preSel : '*[ ]') + '[color]cyan'];
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
        (cruiseLevel === null || manualCrossoverAltitude < cruiseLevel * 100);

      return [
        'SELECTED',
        `\xa0${Math.round(selectedSpdMach)}${shouldShowMach ? '{small}/' + machAtManualCrossoverAlt.toFixed(2).replace('0.', '.') + '{end}' : ''}[color]green`,
      ];
    }
  }

  static getDesSelectedTitleAndValue(mcdu: LegacyFmsPageInterface, isPhaseActive: boolean, isSelected: boolean) {
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

  static formatDestEfobAndTime(mcdu: LegacyFmsPageInterface, isFlying: boolean, forPlan: FlightPlanIndex) {
    // TODO sec - handle non active flight plan
    const destinationPrediction =
      forPlan === FlightPlanIndex.Active ? mcdu.guidanceController.vnavDriver.getDestinationPrediction() : undefined;

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

  static formatToReasonDistanceAndTime(
    mcdu: LegacyFmsPageInterface,
    forPlan: FlightPlanIndex,
  ): [string, string, string, string] {
    // TODO sec - handle non active flight plan
    const toPrediction =
      forPlan === FlightPlanIndex.Active ? mcdu.guidanceController.vnavDriver.getPerfCrzToPrediction() : undefined;

    const nextLegWithStep = mcdu.flightPlanService.active.allLegs
      .filter((it) => it.isDiscontinuity === false)
      .find((it) => it.cruiseStep !== undefined);

    let flightLevel = '';
    if (nextLegWithStep?.cruiseStep?.toAltitude !== undefined) {
      flightLevel = Math.round(nextLegWithStep.cruiseStep.toAltitude / 100).toString();
    }

    let stepWaypoint = '';
    let toReasonCell = '';
    let toDistCell = '---';
    let toTimeCell = '----';

    if (toPrediction) {
      if (Number.isFinite(toPrediction.distanceFromPresentPosition)) {
        toDistCell = Math.round(toPrediction.distanceFromPresentPosition) + '[color]green';
      }

      if (Number.isFinite(toPrediction.secondsFromPresent)) {
        const utcTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');
        toTimeCell = FmsFormatters.secondsToUTC(utcTime + toPrediction.secondsFromPresent) + '[color]green';
      }

      // Check if we have a downstream cruise step
      if (
        nextLegWithStep?.cruiseStep &&
        (toPrediction.reason === 'StepClimb' || toPrediction.reason === 'StepDescent')
      ) {
        stepWaypoint = `{small}AT\xa0\xa0 {green}${nextLegWithStep.ident}{end}`;
        toReasonCell = `{white}{small}STEP TO{end} {green}FL${flightLevel}{end}`;
      } else if (toPrediction.reason === 'TopOfDescent') {
        toReasonCell = `{white}{small}TO{end}\xa0{green}(T/D){end}`;
      }
    }

    return [toReasonCell, toDistCell, toTimeCell, stepWaypoint];
  }

  static formatCostIndexCell(
    costIndex: number | null,
    isActive: boolean,
    hasFromToPair: boolean,
    allowModification: boolean,
  ) {
    let costIndexCell = '---';
    if (hasFromToPair) {
      if (costIndex !== null) {
        costIndexCell = `${costIndex.toFixed(0)}[color]${allowModification ? 'cyan' : 'green'}`;
      } else {
        costIndexCell = isActive ? '___[color]amber' : '[\xa0][color]cyan';
      }
    }

    return costIndexCell;
  }
}
