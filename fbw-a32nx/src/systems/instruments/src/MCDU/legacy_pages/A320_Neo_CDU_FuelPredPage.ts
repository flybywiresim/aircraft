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

export class CDUFuelPredPage {
  static ShowPage(mcdu: LegacyFmsPageInterface) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.FuelPredPage;
    mcdu.pageRedrawCallback = () => CDUFuelPredPage.ShowPage(mcdu);
    mcdu.activeSystem = 'FMGC';
    const isFlying = mcdu.isFlying();

    const destination = mcdu.flightPlanService.active ? mcdu.flightPlanService.active.destinationAirport : undefined;
    const alternate = mcdu.flightPlanService.active
      ? mcdu.flightPlanService.active.alternateDestinationAirport
      : undefined;

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
        if (mcdu.trySetZeroFuelWeightZFWCG(value)) {
          CDUFuelPredPage.ShowPage(mcdu);
          CDUInitPage.trySetFuelPred(mcdu);
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

    if (mcdu._zeroFuelWeightZFWCGEntered) {
      if (isFinite(mcdu.zeroFuelWeight)) {
        zfwCell = NXUnits.kgToUser(mcdu.zeroFuelWeight).toFixed(1);
        zfwColor = '[color]cyan';
      }
      if (isFinite(mcdu.zeroFuelWeightMassCenter)) {
        zfwCgCell = getZfwcg().toFixed(1);
      }
      if (isFinite(mcdu.zeroFuelWeight) && isFinite(getZfwcg())) {
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

    if (CDUInitPage.fuelPredConditionsMet(mcdu)) {
      const utcTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');

      if (mcdu._fuelPredDone) {
        if (!mcdu.routeFinalEntered()) {
          mcdu.tryUpdateRouteFinalFuel();
        }
        if (isFinite(mcdu.getRouteFinalFuelWeight()) && isFinite(mcdu.getRouteFinalFuelTime())) {
          if (mcdu._rteFinalWeightEntered) {
            finalFuelCell = '{sp}{sp}' + NXUnits.kgToUser(mcdu.getRouteFinalFuelWeight()).toFixed(1);
          } else {
            finalFuelCell = '{sp}{sp}{small}' + NXUnits.kgToUser(mcdu.getRouteFinalFuelWeight()).toFixed(1) + '{end}';
          }
          if (mcdu._rteFinalTimeEntered || !mcdu.routeFinalEntered()) {
            finalTimeCell = FmsFormatters.minutesTohhmm(mcdu.getRouteFinalFuelTime());
          } else {
            finalTimeCell = '{small}' + FmsFormatters.minutesTohhmm(mcdu.getRouteFinalFuelTime()) + '{end}';
          }
          finalColor = '[color]cyan';
        }
        mcdu.onLeftInput[4] = async (value, scratchpadCallback) => {
          if (await mcdu.trySetRouteFinalFuel(value)) {
            CDUFuelPredPage.ShowPage(mcdu);
          } else {
            scratchpadCallback();
          }
        };

        if (alternate) {
          const altnFuelEntered = mcdu._routeAltFuelEntered;
          if (!altnFuelEntered) {
            mcdu.tryUpdateRouteAlternate();
          }
          if (isFinite(mcdu.getRouteAltFuelWeight())) {
            altFuelCell =
              '{sp}{sp}' +
              (altnFuelEntered ? '' : '{small}') +
              NXUnits.kgToUser(mcdu.getRouteAltFuelWeight()).toFixed(1);
            altFuelColor = '[color]cyan';
            const time = mcdu.getRouteAltFuelTime();
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
          if (await mcdu.trySetRouteAlternateFuel(value)) {
            CDUFuelPredPage.ShowPage(mcdu);
          } else {
            scratchpadCallback();
          }
        };
        if (alternate) {
          altIdentCell = alternate.ident;
          altEFOBCell = NXUnits.kgToUser(mcdu.getAltEFOB(true)).toFixed(1);
          altEFOBCellColor = '[color]green';
        }

        mcdu.tryUpdateRouteTrip(isFlying);

        const dest = mcdu.flightPlanService.active.destinationAirport;

        if (dest) {
          destIdentCell = dest.ident;
        }
        const efob = mcdu.getDestEFOB(true);
        destEFOBCell = NXUnits.kgToUser(efob).toFixed(1);
        // Should we use predicted values or liveETATo and liveUTCto?
        destTimeCell = isFlying
          ? FmsFormatters.secondsToUTC(utcTime + FmsFormatters.minuteToSeconds(mcdu._routeTripTime))
          : (destTimeCell = FmsFormatters.minutesTohhmm(mcdu._routeTripTime));

        if (alternate) {
          if (mcdu.getRouteAltFuelTime()) {
            altTimeCell = isFlying
              ? FmsFormatters.secondsToUTC(
                  utcTime +
                    FmsFormatters.minuteToSeconds(mcdu._routeTripTime) +
                    FmsFormatters.minuteToSeconds(mcdu.getRouteAltFuelTime()),
                )
              : FmsFormatters.minutesTohhmm(mcdu.getRouteAltFuelTime());
            altTimeCellColor = '[color]green';
          } else {
            altTimeCell = '----';
            altTimeCellColor = '[color]white';
          }
        }

        destTimeCellColor = '[color]green';

        rteRsvWeightCell = '{sp}{sp}' + NXUnits.kgToUser(mcdu.getRouteReservedWeight()).toFixed(1);
        if (!mcdu._rteReservedWeightEntered) {
          rteRsvWeightCell = '{small}' + rteRsvWeightCell + '{end}';
        }

        if (mcdu._rteRsvPercentOOR) {
          rteRsvPercentCell = '--.-';
          rteRSvCellColor = '[color]cyan';
          rteRsvPctColor = '{white}';
        } else {
          rteRsvPercentCell = mcdu.getRouteReservedPercent().toFixed(1);
          if (isFlying || (!mcdu._rteReservedPctEntered && mcdu.routeReservedEntered())) {
            rteRsvPercentCell = '{small}' + rteRsvPercentCell + '{end}';
          }
          rteRsvPctColor = isFlying ? '{green}' : '{cyan}';
          rteRSvCellColor = isFlying ? '[color]green' : '[color]cyan';
        }

        mcdu.onLeftInput[2] = async (value, scratchpadCallback) => {
          if (await mcdu.trySetRouteReservedFuel(value)) {
            CDUFuelPredPage.ShowPage(mcdu);
          } else {
            scratchpadCallback();
          }
        };

        if (mcdu._minDestFobEntered) {
          minDestFobCell = '{sp}{sp}' + NXUnits.kgToUser(mcdu._minDestFob).toFixed(1);
          minDestFobCellColor = '[color]cyan';
        } else {
          mcdu.tryUpdateMinDestFob();
          minDestFobCell = '{sp}{sp}{small}' + NXUnits.kgToUser(mcdu._minDestFob).toFixed(1) + '{end}';
          minDestFobCellColor = '[color]cyan';
        }
        mcdu.onLeftInput[5] = async (value, scratchpadCallback) => {
          if (await mcdu.trySetMinDestFob(value)) {
            CDUFuelPredPage.ShowPage(mcdu);
          } else {
            scratchpadCallback();
          }
        };
        mcdu.checkEFOBBelowMin();

        extraFuelCell = '{small}' + NXUnits.kgToUser(mcdu.tryGetExtraFuel(true)).toFixed(1);
        if (mcdu.tryGetExtraFuel(true) < 0) {
          extraTimeCell = '----{end}';
          extraTimeColor = '{white}';
        } else {
          extraTimeCell = FmsFormatters.minutesTohhmm(mcdu.tryGetExtraTime(true)) + '{end}';
          extraTimeColor = '{green}';
        }
        extraCellColor = '[color]green';

        // Currently not updating as there's no simvar to retrieve this.
        if (isFinite(mcdu.zeroFuelWeight)) {
          zfwCell = NXUnits.kgToUser(mcdu.zeroFuelWeight).toFixed(1);
          zfwColor = '[color]cyan';
        }
        if (isFinite(mcdu.zeroFuelWeightMassCenter)) {
          zfwCgCell = mcdu.zeroFuelWeightMassCenter.toFixed(1);
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
