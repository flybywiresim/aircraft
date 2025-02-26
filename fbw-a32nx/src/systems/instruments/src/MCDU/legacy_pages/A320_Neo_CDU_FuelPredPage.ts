// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NXUnits } from '@flybywiresim/fbw-sdk';
import { getZfw, getZfwcg } from '../legacy/A32NX_Core/A32NX_PayloadManager';
import { CDUInitPage } from './A320_Neo_CDU_InitPage';
import { NXSystemMessages } from '../messages/NXSystemMessages';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FmsFormatters } from '../legacy/FmsFormatters';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

export class CDUFuelPredPage {
  // TODO sec?
  static ShowPage(mcdu: LegacyFmsPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.FuelPredPage;
    mcdu.pageRedrawCallback = () => CDUFuelPredPage.ShowPage(mcdu);
    mcdu.activeSystem = 'FMGC';
    const isFlying = mcdu.isFlying();

    const plan = mcdu.flightPlanService.active;
    const predictions = mcdu.runFuelComputations(FlightPlanIndex.Active, CDUInitPage.computationsCache);

    const destination = plan ? plan.destinationAirport : undefined;
    const alternate = plan ? plan.alternateDestinationAirport : undefined;

    let destIdentCell = 'NONE';
    let destTimeCell = '----';
    let destTimeCellColor = '[color]white';
    let destEFOBCell = '---.-';
    let destEFOBCellColor = '[color]white';

    let altIdentCell = 'NONE';
    let altTimeCell = '----';
    let altTimeCellColor = '[color]white';
    let altEFOBCell = '---.-';
    let altEFOBCellColor = '[color]white';

    let rteRsvWeightCell = '---.-';
    let rteRsvPercentCell = '---.-';
    let rteRSvCellColor = '[color]white';
    let rteRsvPctColor = '{white}';

    let zfwCell = '___._';
    let zfwCgCell = ' __._';
    let zfwColor = '[color]amber';
    mcdu.onRightInput[2] = async (value, scratchpadCallback) => {
      if (value === Keypad.clrValue) {
        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
        scratchpadCallback();
        return;
      } else if (value === '') {
        mcdu.setScratchpadText(
          (isFinite(getZfw()) ? (getZfw() / 1000).toFixed(1) : '') +
            '/' +
            (isFinite(getZfwcg()) ? getZfwcg().toFixed(1) : ''),
        );
      } else {
        if (mcdu.trySetZeroFuelWeightZFWCG(value, FlightPlanIndex.Active)) {
          CDUFuelPredPage.ShowPage(mcdu);
          CDUInitPage.trySetFuelPred(mcdu, FlightPlanIndex.Active);
          mcdu.removeMessageFromQueue(NXSystemMessages.initializeWeightOrCg.text);
          mcdu.removeMessageFromQueue(NXSystemMessages.checkWeight.text);
          mcdu._checkWeightSettable = true;
        } else {
          scratchpadCallback();
        }
      }
    };

    let altFuelCell = '---.-';
    let altFuelTimeCell = '----';
    let altFuelColor = '[color]white';
    let altTimeColor = '{white}';

    let fobCell = '---.-';
    let fobOtherCell = '-----';
    let fobCellColor = '[color]white';

    let finalFuelCell = '---.-';
    let finalTimeCell = '----';
    let finalColor = '[color]white';

    let gwCell = '---.-';
    let cgCell = ' --.-';
    let gwCgCellColor = '[color]white';

    let minDestFobCell = '---.-';
    let minDestFobCellColor = '[color]white';

    let extraFuelCell = '---.-';
    let extraTimeCell = '----';
    let extraCellColor = '[color]white';
    let extraTimeColor = '{white}';

    if (plan.performanceData.zeroFuelWeight !== null && plan.performanceData.zeroFuelWeightCenterOfGravity !== null) {
      zfwCell = NXUnits.kgToUser(plan.performanceData.zeroFuelWeight).toFixed(1);
      zfwColor = '[color]cyan';

      zfwCgCell = getZfwcg().toFixed(1);

      if (Number.isFinite(getZfwcg())) {
        zfwColor = '[color]cyan';
      }

      if (alternate) {
        altIdentCell = alternate.ident;
      }

      if (destination) {
        destIdentCell = destination.ident;
      }

      gwCell = '{small}' + NXUnits.kgToUser(mcdu.getGW()).toFixed(1);
      cgCell = mcdu.getCG().toFixed(1) + '{end}';
      gwCgCellColor = '[color]green';

      fobCell = '{small}' + NXUnits.kgToUser(mcdu.getFOB()).toFixed(1) + '{end}';
      fobOtherCell = '{inop}FF{end}';
      fobCellColor = '[color]cyan';
    }

    if (CDUInitPage.fuelPredConditionsMet(mcdu, FlightPlanIndex.Active)) {
      const utcTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');

      if (mcdu._fuelPredDone) {
        const isRouteFinalEntered =
          plan.performanceData.pilotFinalHoldingFuel !== null || plan.performanceData.isFinalHoldingTimePilotEntered;

        if (Number.isFinite(predictions.finalHoldingFuel) && Number.isFinite(predictions.finalHoldingTime)) {
          if (plan.performanceData.pilotFinalHoldingFuel !== null) {
            finalFuelCell = '{sp}{sp}' + NXUnits.kgToUser(predictions.finalHoldingFuel).toFixed(1);
          } else {
            finalFuelCell = '{sp}{sp}{small}' + NXUnits.kgToUser(predictions.finalHoldingFuel).toFixed(1) + '{end}';
          }
          if (plan.performanceData.isFinalHoldingTimePilotEntered || !isRouteFinalEntered) {
            finalTimeCell = FmsFormatters.minutesTohhmm(predictions.finalHoldingTime);
          } else {
            finalTimeCell = '{small}' + FmsFormatters.minutesTohhmm(predictions.finalHoldingTime) + '{end}';
          }
          finalColor = '[color]cyan';
        }
        mcdu.onLeftInput[4] = async (value, scratchpadCallback) => {
          if (mcdu.trySetRouteFinalFuel(value, FlightPlanIndex.Active)) {
            CDUFuelPredPage.ShowPage(mcdu);
          } else {
            scratchpadCallback();
          }
        };

        if (alternate) {
          const altnFuelEntered = plan.performanceData.pilotAlternateFuel !== null;

          if (Number.isFinite(predictions.alternateFuel)) {
            altFuelCell =
              '{sp}{sp}' + (altnFuelEntered ? '' : '{small}') + NXUnits.kgToUser(predictions.alternateFuel).toFixed(1);
            altFuelColor = '[color]cyan';
            const time = predictions.alternateTime;
            if (time) {
              altFuelTimeCell = '{small}' + FmsFormatters.minutesTohhmm(time) + '{end}';
              altTimeColor = '{green}';
            } else {
              altFuelTimeCell = '----';
              altTimeColor = '{white}';
            }
          }
        } else {
          altFuelCell = '{sp}{sp}{small}0.0{end}';
          altFuelTimeCell = '----';
          altFuelColor = '[color]green';
          altTimeColor = '{white}';
        }
        mcdu.onLeftInput[3] = async (value, scratchpadCallback) => {
          if (await mcdu.trySetRouteAlternateFuel(value, FlightPlanIndex.Active)) {
            CDUFuelPredPage.ShowPage(mcdu);
          } else {
            scratchpadCallback();
          }
        };
        if (alternate) {
          altIdentCell = alternate.ident;
          altEFOBCell = NXUnits.kgToUser(predictions.alternateDestinationFuelOnBoard).toFixed(1);
          altEFOBCellColor = '[color]green';
        }

        if (destination) {
          destIdentCell = destination.ident;
        }
        const efob = predictions.destinationFuelOnBoard;
        destEFOBCell = NXUnits.kgToUser(efob).toFixed(1);
        // Should we use predicted values or liveETATo and liveUTCto?
        destTimeCell = isFlying
          ? FmsFormatters.secondsToUTC(utcTime + FmsFormatters.minuteToSeconds(predictions.tripTime))
          : (destTimeCell = FmsFormatters.minutesTohhmm(predictions.tripTime));

        if (alternate) {
          if (Number.isFinite(predictions.alternateTime)) {
            altTimeCell = isFlying
              ? FmsFormatters.secondsToUTC(
                  utcTime +
                    FmsFormatters.minuteToSeconds(predictions.tripTime) +
                    FmsFormatters.minuteToSeconds(predictions.alternateTime),
                )
              : FmsFormatters.minutesTohhmm(predictions.alternateTime);
            altTimeCellColor = '[color]green';
          } else {
            altTimeCell = '----';
            altTimeCellColor = '[color]white';
          }
        }

        destTimeCellColor = '[color]green';

        rteRsvWeightCell = '{sp}{sp}' + NXUnits.kgToUser(predictions.routeReserveFuel).toFixed(1);
        if (plan.performanceData.pilotRouteReserveFuel === null) {
          rteRsvWeightCell = '{small}' + rteRsvWeightCell + '{end}';
        }

        // TODO should come from AMI
        const isRouteReservePrecentageOutOfRange =
          predictions.routeReserveFuelPercentage < 0 || predictions.routeReserveFuelPercentage > 15;

        if (isRouteReservePrecentageOutOfRange) {
          rteRsvPercentCell = '--.-';
          rteRSvCellColor = '[color]cyan';
          rteRsvPctColor = '{white}';
        } else {
          rteRsvPercentCell = predictions.routeReserveFuelPercentage.toFixed(1);
          if (isFlying || plan.performanceData.pilotRouteReserveFuel !== null) {
            rteRsvPercentCell = '{small}' + rteRsvPercentCell + '{end}';
          }
          rteRsvPctColor = isFlying ? '{green}' : '{cyan}';
          rteRSvCellColor = isFlying ? '[color]green' : '[color]cyan';
        }

        mcdu.onLeftInput[2] = async (value, scratchpadCallback) => {
          if (mcdu.trySetRouteReservedFuel(value, FlightPlanIndex.Active)) {
            CDUFuelPredPage.ShowPage(mcdu);
          } else {
            scratchpadCallback();
          }
        };

        if (plan.performanceData.pilotMinimumDestinationFuelOnBoard !== null) {
          minDestFobCell =
            '{sp}{sp}' + NXUnits.kgToUser(plan.performanceData.pilotMinimumDestinationFuelOnBoard).toFixed(1);
          minDestFobCellColor = '[color]cyan';
        } else {
          minDestFobCell =
            '{sp}{sp}{small}' + NXUnits.kgToUser(predictions.minimumDestinationFuel).toFixed(1) + '{end}';
          minDestFobCellColor = '[color]cyan';
        }
        mcdu.onLeftInput[5] = async (value, scratchpadCallback) => {
          if (await mcdu.trySetMinDestFob(value, FlightPlanIndex.Active)) {
            CDUFuelPredPage.ShowPage(mcdu);
          } else {
            scratchpadCallback();
          }
        };
        mcdu.checkEFOBBelowMin();

        extraFuelCell = '{small}' + NXUnits.kgToUser(predictions.extraFuel).toFixed(1);
        if (predictions.extraFuel < 0) {
          extraTimeCell = '----{end}';
          extraTimeColor = '{white}';
        } else {
          extraTimeCell = FmsFormatters.minutesTohhmm(predictions.extraTime) + '{end}';
          extraTimeColor = '{green}';
        }
        extraCellColor = '[color]green';

        // Currently not updating as there's no simvar to retrieve this.
        if (plan.performanceData.zeroFuelWeight !== null) {
          zfwCell = NXUnits.kgToUser(plan.performanceData.zeroFuelWeight).toFixed(1);
          zfwColor = '[color]cyan';
        }
        if (plan.performanceData.zeroFuelWeightCenterOfGravity !== null) {
          zfwCgCell = plan.performanceData.zeroFuelWeightCenterOfGravity.toFixed(1);
        }

        destEFOBCellColor = mcdu._isBelowMinDestFob ? '[color]amber' : '[color]green';
      }
    }

    mcdu.setTemplate([
      ['FUEL PRED{sp}'],
      ['\xa0AT', 'EFOB', isFlying ? '{sp}UTC' : 'TIME'],
      [destIdentCell + '[color]green', destEFOBCell + destEFOBCellColor, destTimeCell + destTimeCellColor],
      [''],
      [altIdentCell + '[color]green', altEFOBCell + altEFOBCellColor, altTimeCell + altTimeCellColor],
      ['RTE RSV/%', 'ZFW/ZFWCG'],
      [
        rteRsvWeightCell + rteRsvPctColor + '/' + rteRsvPercentCell + '{end}' + rteRSvCellColor,
        zfwCell + '/' + zfwCgCell + '{sp}' + zfwColor,
      ],
      ['ALTN\xa0/TIME', 'FOB{sp}{sp}{sp}{sp}{sp}{sp}'],
      [
        altFuelCell + altTimeColor + '/' + altFuelTimeCell + '{end}' + altFuelColor,
        fobCell + '/' + fobOtherCell + '{sp}{sp}{sp}' + fobCellColor,
      ],
      ['FINAL/TIME', 'GW/{sp}{sp} CG'],
      [finalFuelCell + '/' + finalTimeCell + finalColor, gwCell + '/ ' + cgCell + gwCgCellColor],
      ['MIN DEST FOB', 'EXTRA/TIME'],
      [
        minDestFobCell + minDestFobCellColor,
        extraFuelCell + extraTimeColor + '/' + extraTimeCell + '{end}' + extraCellColor,
      ],
    ]);

    mcdu.setArrows(false, false, true, true);

    mcdu.onPrevPage = () => {
      CDUInitPage.ShowPage1(mcdu);
    };
    mcdu.onNextPage = () => {
      CDUInitPage.ShowPage1(mcdu);
    };

    // regular update due to showing dynamic data on this page
    mcdu.SelfPtr = setTimeout(() => {
      if (mcdu.page.Current === mcdu.page.FuelPredPage) {
        CDUFuelPredPage.ShowPage(mcdu);
      }
    }, mcdu.PageTimeout.Dyn);
  }
}
