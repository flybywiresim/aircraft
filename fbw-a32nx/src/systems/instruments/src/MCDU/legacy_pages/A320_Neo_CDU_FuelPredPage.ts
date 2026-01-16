// @ts-strict-ignore
// Copyright (c) 2021-2023 2026 FlyByWire Simulations
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
import { Wait } from '@microsoft/msfs-sdk';

export class CDUFuelPredPage {
  static ShowPage(mcdu: LegacyFmsPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.FuelPredPage;
    mcdu.pageRedrawCallback = () => CDUFuelPredPage.ShowPage(mcdu);
    mcdu.activeSystem = 'FMGC';
    const isFlying = mcdu.isFlying();

    const plan = mcdu.flightPlanService.active;
    const predictions = mcdu.getFuelPredComputation(FlightPlanIndex.Active);

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
    let rteRsvPercentCell = '/--.-';
    let rteRSvCellColor = '[color]white';
    let rteRsvPctColor = '{white}';

    let zfwCell = '___._';
    let zfwCgCell = '__._';
    let zfwColor = '[color]amber';

    mcdu.onRightInput[2] = async (value, scratchpadCallback) => {
      if (value === Keypad.clrValue) {
        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
        scratchpadCallback();
        return;
      } else if (value === '') {
        mcdu.setScratchpadText(
          (Number.isFinite(getZfw()) ? (getZfw() / 1000).toFixed(1) : '') +
            '/' +
            (Number.isFinite(getZfwcg()) ? getZfwcg().toFixed(1) : ''),
        );
      } else {
        if (mcdu.trySetZeroFuelWeightZFWCG(value, FlightPlanIndex.Active)) {
          mcdu.removeMessageFromQueue(NXSystemMessages.initializeWeightOrCg.text);
          mcdu.removeMessageFromQueue(NXSystemMessages.checkWeight.text);
          mcdu._checkWeightSettable = true;

          await CDUFuelPredPage.refreshAfterFuelPred(mcdu, FlightPlanIndex.Active);
        } else {
          scratchpadCallback();
        }
      }
    };

    let altFuelCell = '---.-';
    let altFuelTimeCell = '/----';
    let altFuelColor = '[color]white';
    let altTimeColor = '{white}';

    let fobCell = '---.-';
    let fobOtherCell = '-----';
    let fobCellColor = '[color]white';

    let finalFuelCell = '{white}---.-{end}';
    let finalTimeCell = '/----';
    let finalColor = '[color]white';

    let gwCell = '---.-';
    let cgCell = '--.-';
    let gwCgCellColor = '[color]white';

    let minDestFobCell = '---.-';
    let minDestFobCellColor = '[color]white';

    let extraFuelCell = '---.-';
    let extraTimeCell = '----';
    let extraCellColor = '[color]white';
    let extraTimeColor = '{white}';

    if (
      plan.performanceData.zeroFuelWeight.get() !== null &&
      plan.performanceData.zeroFuelWeightCenterOfGravity.get() !== null
    ) {
      zfwCell = NXUnits.kgToUser(plan.performanceData.zeroFuelWeight.get()).toFixed(1);
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

      fobCell = '{small}' + NXUnits.kgToUser(mcdu.getFOB(FlightPlanIndex.Active)).toFixed(1) + '{end}';
      fobOtherCell = '{inop}FF+FQ{end}';
      fobCellColor = '[color]cyan';
    }

    if (CDUInitPage.fuelPredConditionsMet(mcdu, FlightPlanIndex.Active)) {
      if (Number.isFinite(plan.performanceData.pilotFinalHoldingFuel.get())) {
        finalFuelCell = `{cyan}${NXUnits.kgToUser(plan.performanceData.pilotFinalHoldingFuel.get()).toFixed(1).padStart(5, '\xa0')}{end}`;
      } else if (Number.isFinite(predictions.finalHoldingFuel)) {
        finalFuelCell = `{cyan}{small}${NXUnits.kgToUser(predictions.finalHoldingFuel).toFixed(1).padStart(5, '\xa0')}{end}`;
      }

      if (
        Number.isFinite(plan.performanceData.finalHoldingTime.get()) &&
        !Number.isFinite(plan.performanceData.pilotFinalHoldingFuel.get())
      ) {
        finalTimeCell = `/${FmsFormatters.minutesTohhmm(plan.performanceData.finalHoldingTime.get())}`;
        finalColor = '[color]cyan';
      } else if (Number.isFinite(predictions.finalHoldingTime)) {
        finalTimeCell = '{small}/' + FmsFormatters.minutesTohhmm(predictions.finalHoldingTime) + '{end}';
        finalColor = '[color]cyan';
      }

      mcdu.onLeftInput[4] = async (value, scratchpadCallback) => {
        if (mcdu.trySetRouteFinalFuel(value, FlightPlanIndex.Active)) {
          await CDUFuelPredPage.refreshAfterFuelPred(mcdu, FlightPlanIndex.Active);
        } else {
          scratchpadCallback();
        }
      };

      if (alternate) {
        if (Number.isFinite(plan.performanceData.pilotAlternateFuel.get())) {
          altFuelCell = `${NXUnits.kgToUser(plan.performanceData.pilotAlternateFuel.get()).toFixed(1).padStart(5, '\xa0')}`;
          altFuelColor = '[color]cyan';
        } else if (Number.isFinite(predictions.alternateFuel)) {
          altFuelCell = `{small}${NXUnits.kgToUser(predictions.alternateFuel).toFixed(1).padStart(5, '\xa0')}{end}`;
          altFuelColor = '[color]cyan';
        }

        if (Number.isFinite(predictions.alternateTime)) {
          altFuelTimeCell = '{small}/' + FmsFormatters.minutesTohhmm(predictions.alternateTime) + '{end}';
          altTimeColor = '{green}';
        }

        altIdentCell = alternate.ident;

        if (Number.isFinite(predictions.alternateDestinationFuelOnBoard)) {
          altEFOBCell = NXUnits.kgToUser(predictions.alternateDestinationFuelOnBoard).toFixed(1);
          altEFOBCellColor = '[color]green';
        }
      } else {
        altFuelCell = '{sp}{sp}{small}0.0{end}';
        altFuelTimeCell = '/----';
        altFuelColor = '[color]green';
        altTimeColor = '{white}';
      }

      mcdu.onLeftInput[3] = async (value, scratchpadCallback) => {
        if (await mcdu.trySetRouteAlternateFuel(value, FlightPlanIndex.Active)) {
          await CDUFuelPredPage.refreshAfterFuelPred(mcdu, FlightPlanIndex.Active);
        } else {
          scratchpadCallback();
        }
      };

      if (destination) {
        destIdentCell = destination.ident;
      }

      if (Number.isFinite(predictions.destinationFuelOnBoard)) {
        destEFOBCell = NXUnits.kgToUser(predictions.destinationFuelOnBoard).toFixed(1);
        destEFOBCellColor = mcdu.isDestEfobAmber ? '[color]amber' : '[color]green';
      }

      if (Number.isFinite(predictions.tripTime)) {
        destTimeCell = mcdu.getTimePrediction(predictions.tripTime);
        destTimeCellColor = '[color]green';
      }

      if (alternate) {
        if (Number.isFinite(predictions.alternateTime) && Number.isFinite(predictions.tripTime)) {
          altTimeCell = mcdu.getTimePrediction(predictions.tripTime + predictions.alternateTime);
          altTimeCellColor = '[color]green';
        } else {
          altTimeCell = '----';
          altTimeCellColor = '[color]white';
        }
      }

      if (Number.isFinite(predictions.routeReserveFuel)) {
        rteRsvWeightCell = `{small}${NXUnits.kgToUser(predictions.routeReserveFuel).toFixed(1).padStart(5, '\xa0')}{end}`;
        rteRSvCellColor = isFlying ? '[color]green' : '[color]cyan';
      } else if (Number.isFinite(plan.performanceData.pilotRouteReserveFuel.get())) {
        rteRsvWeightCell = `${NXUnits.kgToUser(plan.performanceData.pilotRouteReserveFuel.get()).toFixed(1).padStart(5, '\xa0')}`;
        rteRSvCellColor = isFlying ? '[color]green' : '[color]cyan';
      }

      const routeReserveFuelPercentage =
        isFlying || Number.isFinite(plan.performanceData.pilotRouteReserveFuel.get())
          ? predictions.routeReserveFuelPercentage
          : plan.performanceData.routeReserveFuelPercentage.get();

      if (Number.isFinite(routeReserveFuelPercentage)) {
        // TODO thresholds should come from AMI
        const routeReserveOutOfRange = routeReserveFuelPercentage < 0 || routeReserveFuelPercentage > 15;

        if (!routeReserveOutOfRange) {
          if (isFlying || Number.isFinite(plan.performanceData.pilotRouteReserveFuel.get())) {
            rteRsvPercentCell = `{small}/${routeReserveFuelPercentage.toFixed(1)}{end}`;
          } else {
            rteRsvPercentCell = `/${routeReserveFuelPercentage.toFixed(1)}`;
          }

          rteRsvPctColor = isFlying ? '{green}' : '{cyan}';
        }
      }

      mcdu.onLeftInput[2] = async (value, scratchpadCallback) => {
        if (mcdu.trySetRouteReservedFuel(value, FlightPlanIndex.Active)) {
          await CDUFuelPredPage.refreshAfterFuelPred(mcdu, FlightPlanIndex.Active);
        } else {
          scratchpadCallback();
        }
      };

      if (Number.isFinite(plan.performanceData.pilotMinimumDestinationFuelOnBoard.get())) {
        minDestFobCell =
          '{sp}{sp}' + NXUnits.kgToUser(plan.performanceData.pilotMinimumDestinationFuelOnBoard.get()).toFixed(1);
        minDestFobCellColor = '[color]cyan';
      } else if (Number.isFinite(predictions.minimumDestinationFuel)) {
        minDestFobCell = '{sp}{sp}{small}' + NXUnits.kgToUser(predictions.minimumDestinationFuel).toFixed(1) + '{end}';
        minDestFobCellColor = '[color]cyan';
      }

      mcdu.onLeftInput[5] = async (value, scratchpadCallback) => {
        if (await mcdu.trySetMinDestFob(value, FlightPlanIndex.Active)) {
          await CDUFuelPredPage.refreshAfterFuelPred(mcdu, FlightPlanIndex.Active);
        } else {
          scratchpadCallback();
        }
      };

      if (predictions.extraFuel !== null) {
        extraFuelCell = '{small}' + NXUnits.kgToUser(predictions.extraFuel).toFixed(1);
        if (predictions.extraFuel < 0) {
          extraTimeCell = '----{end}';
          extraTimeColor = '{white}';
        } else {
          extraTimeCell = FmsFormatters.minutesTohhmm(predictions.extraTime) + '{end}';
          extraTimeColor = '{green}';
        }
        extraCellColor = '[color]green';
      }

      // Currently not updating as there's no simvar to retrieve this.
      if (plan.performanceData.zeroFuelWeight.get() !== null) {
        zfwCell = NXUnits.kgToUser(plan.performanceData.zeroFuelWeight.get()).toFixed(1);
        zfwColor = '[color]cyan';
      }
      const zfwcg = plan.performanceData.zeroFuelWeightCenterOfGravity.get();
      if (Number.isFinite(zfwcg)) {
        zfwCgCell = zfwcg.toFixed(1);
      }
    }

    mcdu.setTemplate([
      ['FUEL PRED{sp}'],
      ['\xa0AT', 'EFOB', mcdu.getTimePredictionHeader().padStart(4, '{sp}')],
      [destIdentCell + '[color]green', destEFOBCell + destEFOBCellColor, destTimeCell + destTimeCellColor],
      [''],
      [altIdentCell + '[color]green', altEFOBCell + altEFOBCellColor, altTimeCell + altTimeCellColor],
      ['RTE RSV/%', 'ZFW/ZFWCG'],
      [
        rteRsvWeightCell + rteRsvPctColor + rteRsvPercentCell + '{end}' + rteRSvCellColor,
        zfwCell + '/' + zfwCgCell + '{sp}' + zfwColor,
      ],
      ['ALTN\xa0/TIME', 'FOB{sp}{sp}{sp}{sp}{sp}{sp}'],
      [
        altFuelCell + altTimeColor + altFuelTimeCell + '{end}' + altFuelColor,
        fobCell + '/' + fobOtherCell + fobCellColor,
      ],
      ['FINAL/TIME', 'GW/{sp}{sp} CG'],
      [finalFuelCell + finalTimeCell + finalColor, gwCell + '/{sp}' + cgCell + gwCgCellColor],
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
  }

  static async refreshAfterFuelPred(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex) {
    mcdu.resetFuelPredComputation(forPlan);
    mcdu.computeTakeoffWeight(forPlan);
    CDUFuelPredPage.ShowPage(mcdu);

    if (CDUInitPage.fuelPredConditionsMet(mcdu, forPlan)) {
      await Wait.awaitDelay(mcdu.getDelayFuelPred());
      mcdu.runFuelPredComputation(forPlan);

      if (mcdu.page.Current === mcdu.page.FuelPredPage) {
        CDUFuelPredPage.ShowPage(mcdu);
      }
    }
  }
}
