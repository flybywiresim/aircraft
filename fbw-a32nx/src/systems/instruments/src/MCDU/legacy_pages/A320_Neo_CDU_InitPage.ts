// Copyright (c) 2021-2023, 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { getSimBriefOfp } from '../legacy/A32NX_Core/A32NX_ATSU';
import { Column, FormatTemplate } from '../legacy/A320_Neo_CDU_Format';
import { CDU_SingleValueField } from '../legacy/A320_Neo_CDU_Field';
import { McduMessage, NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { CDUAvailableFlightPlanPage } from './A320_Neo_CDU_AvailableFlightPlanPage';
import { CDUIRSInit } from './A320_Neo_CDU_IRSInit';
import { CDUWindPage } from './A320_Neo_CDU_WindPage';
import { NXUnits } from '@flybywiresim/fbw-sdk';
import { getZfw, getZfwcg } from '../legacy/A32NX_Core/A32NX_PayloadManager';
import { Keypad } from '../legacy/A320_Neo_CDU_Keypad';
import { FuelPredComputations, LegacyFmsPageInterface, SimbriefOfpState } from '../legacy/LegacyFmsPageInterface';
import { FuelPlanningPhases } from '../legacy/A32NX_Core/A32NX_FuelPred';
import { FmsFormatters } from '../legacy/FmsFormatters';
import { SimBriefUplinkAdapter } from '@fmgc/flightplanning/uplink/SimBriefUplinkAdapter';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

export class CDUInitPage {
  static computationsCache: FuelPredComputations = {
    tripFuel: null,
    tripTime: null,
    routeReserveFuel: null,
    routeReserveFuelPercentage: null,
    alternateFuel: null,
    alternateTime: null,
    finalHoldingFuel: null,
    finalHoldingTime: null,
    minimumDestinationFuel: null,
    takeoffWeight: null,
    landingWeight: null,
    destinationFuelOnBoard: null,
    alternateDestinationFuelOnBoard: null,
    extraFuel: null,
    extraTime: null,
  };

  static ShowPage1(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex = FlightPlanIndex.Active) {
    if (forPlan >= FlightPlanIndex.FirstSecondary) {
      mcdu.efisInterfaces.L.setSecRelatedPageOpen(true);
      mcdu.efisInterfaces.R.setSecRelatedPageOpen(true);
      mcdu.onUnload = () => {
        mcdu.efisInterfaces.L.setSecRelatedPageOpen(false);
        mcdu.efisInterfaces.R.setSecRelatedPageOpen(false);
      };
    }

    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.InitPageA;
    mcdu.pageRedrawCallback = () => CDUInitPage.ShowPage1(mcdu, forPlan);
    mcdu.activeSystem = 'FMGC';
    mcdu.coRoute.routes = [];

    const isForPrimary = forPlan < FlightPlanIndex.FirstSecondary;

    const plan = mcdu.getFlightPlan(forPlan);

    const haveFlightPlan = plan.originAirport && plan.destinationAirport;

    const coRoute = new Column(
      0,
      haveFlightPlan ? '' : isForPrimary ? '__________' : '[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0]',
      isForPrimary ? Column.amber : Column.cyan,
    );
    const fromTo = new Column(
      23,
      isForPrimary ? '____|____' : '[\xa0\xa0]|[\xa0\xa0]',
      isForPrimary ? Column.amber : Column.cyan,
      Column.right,
    );

    if (mcdu.coRoute.routeNumber) {
      coRoute.update(mcdu.coRoute.routeNumber);
    }

    const [flightNoAction, flightNoText, flightNoColor] = new CDU_SingleValueField(
      mcdu,
      'string',
      plan.flightNumber,
      {
        emptyValue: isForPrimary ? '________[color]amber' : '{cyan}[\xa0\xa0\xa0\xa0\xa0\xa0]{end}',
        suffix: '[color]cyan',
        maxLength: 7,
      },
      (value: string) => {
        mcdu.updateFlightNo(value, forPlan, (result) => {
          if (result) {
            CDUInitPage.ShowPage1(mcdu, forPlan);
          } else {
            mcdu.setScratchpadUserData(value);
          }
        });
      },
    ).getFieldAsColumnParameters();

    const altnAirport = plan.alternateDestinationAirport;
    const altDest = new Column(0, `${altnAirport ? altnAirport.ident : '----'}|----------`);
    let costIndexText = '---';
    let costIndexAction;
    let costIndexColor = Column.white;

    const cruiseFl = new Column(0, '-----');
    const cruiseTemp = new Column(10, '---°', Column.right);
    const cruiseFlTempSeparator = new Column(6, '/');

    let alignOption;
    const tropo = new Column(23, '36090', Column.small, Column.cyan, Column.right);
    let requestButton = 'REQUEST*';
    let requestButtonLabel = 'INIT';
    let requestEnable = true;

    if (mcdu.simbriefOfpState === SimbriefOfpState.Requested) {
      requestEnable = false;
      requestButton = 'REQUEST ';
    }

    const origin = plan.originAirport;
    const dest = plan.destinationAirport;

    if (origin) {
      if (dest) {
        fromTo.update(origin.ident + '/' + dest.ident, Column.cyan);

        // If an active SimBrief OFP matches the FP, hide the request option
        // This allows loading a new OFP via INIT/REVIEW loading a different orig/dest to the current one
        if (
          mcdu.simbriefOfpState !== SimbriefOfpState.Loaded ||
          (mcdu.simbriefOfp.origin.icao === origin.ident && mcdu.simbriefOfp.destination.icao === dest.ident)
        ) {
          requestEnable = false;
          requestButtonLabel = '';
          requestButton = '';
        }

        // Cost index
        [costIndexAction, costIndexText, costIndexColor] = new CDU_SingleValueField(
          mcdu,
          'int',
          plan.performanceData.costIndex,
          {
            clearable: true,
            emptyValue: isForPrimary ? '___[color]amber' : '[\xa0][color]cyan',
            minValue: 0,
            maxValue: 999,
            suffix: '[color]cyan',
          },
          (value) => {
            plan.setPerformanceData('costIndex', typeof value === 'number' ? value : null);
            CDUInitPage.ShowPage1(mcdu, forPlan);
          },
        ).getFieldAsColumnParameters();

        mcdu.onLeftInput[4] = costIndexAction;

        cruiseFl.update(isForPrimary ? '_____' : '[\xa0\xa0\xa0]', isForPrimary ? Column.amber : Column.cyan);
        cruiseTemp.update(isForPrimary ? '|___°' : '|[\xa0]°', isForPrimary ? Column.amber : Column.cyan);
        cruiseFlTempSeparator.updateAttributes(isForPrimary ? Column.amber : Column.cyan);

        const planCruiseLevel = plan.performanceData.cruiseFlightLevel;
        const planCruiseTemp = plan.performanceData.cruiseTemperature;

        //This is done so pilot enters a FL first, rather than using the computed one
        // TODO differentiate for SEC
        if (planCruiseLevel) {
          cruiseFl.update('FL' + planCruiseLevel.toFixed(0).padStart(3, '0'), Column.cyan);

          if (planCruiseTemp !== null) {
            cruiseTemp.update(CDUInitPage.formatTemperature(planCruiseTemp), Column.cyan);
            cruiseFlTempSeparator.updateAttributes(Column.cyan);
          } else {
            cruiseTemp.update(
              CDUInitPage.formatTemperature(Math.round(mcdu.tempCurve.evaluate(planCruiseLevel))),
              Column.cyan,
              Column.small,
            );
            cruiseFlTempSeparator.updateAttributes(Column.cyan, Column.small);
          }
        }

        // CRZ FL / FLX TEMP
        mcdu.onLeftInput[5] = (value, scratchpadCallback) => {
          if (mcdu.setCruiseFlightLevelAndTemperature(value, forPlan)) {
            CDUInitPage.ShowPage1(mcdu, forPlan);
          } else {
            scratchpadCallback();
          }
        };

        if (forPlan === FlightPlanIndex.Active && plan.originAirport) {
          alignOption = 'IRS INIT>';
        }

        altDest.update(altnAirport ? altnAirport.ident : 'NONE', Column.cyan);

        // TODO differentiate for SEC
        mcdu.onLeftInput[1] = async (value, scratchpadCallback) => {
          try {
            if (value === '') {
              await mcdu.getCoRouteList();
              CDUAvailableFlightPlanPage.ShowPage(mcdu, forPlan);
            } else {
              if (await mcdu.tryUpdateAltDestination(value, forPlan)) {
                CDUInitPage.ShowPage1(mcdu, forPlan);
              } else {
                scratchpadCallback();
              }
            }
          } catch (error) {
            console.error(error);
            mcdu.logTroubleshootingError(error);
            mcdu.setScratchpadMessage(NXFictionalMessages.internalError);
          }
        };
      }
    }

    mcdu.onLeftInput[0] = async (value, scratchpadCallback) => {
      await mcdu.updateCoRoute(value, (result) => {
        if (result) {
          CDUInitPage.ShowPage1(mcdu);
        } else {
          scratchpadCallback();
        }
      });
    };

    const planTropo = plan.performanceData.tropopause;

    if (planTropo) {
      tropo.update(planTropo.toString(), plan.performanceData.tropopauseIsPilotEntered ? Column.big : Column.small);
    }

    mcdu.onRightInput[4] = (value, scratchpadCallback) => {
      if (mcdu.tryUpdateTropo(value, forPlan)) {
        CDUInitPage.ShowPage1(mcdu);
      } else {
        scratchpadCallback();
      }
    };

    /**
     * If scratchpad is filled, attempt to update city pair
     * else show route selection pair if city pair is displayed
     * Ref: FCOM 4.03.20 P6
     */
    mcdu.onRightInput[0] = (value, scratchpadCallback) => {
      if (value !== '') {
        mcdu.tryUpdateFromTo(value, forPlan, (result) => {
          if (result) {
            CDUAvailableFlightPlanPage.ShowPage(mcdu, forPlan);
          } else {
            scratchpadCallback();
          }
        });
      } else if (plan.originAirport && plan.destinationAirport) {
        mcdu.getCoRouteList().then(() => {
          CDUAvailableFlightPlanPage.ShowPage(mcdu, forPlan);
        });
      }
    };
    mcdu.onRightInput[1] = () => {
      if (requestEnable) {
        getSimBriefOfp(mcdu, () => {
          if (mcdu.page.Current === mcdu.page.InitPageA) {
            CDUInitPage.ShowPage1(mcdu, forPlan);
          }
        })
          .then((data) => {
            SimBriefUplinkAdapter.uplinkFlightPlanFromSimbrief(mcdu, mcdu.flightPlanService, forPlan, data, {
              doUplinkProcedures: false,
            })
              .then(() => {
                console.log('SimBrief data uplinked.');

                mcdu.flightPlanService.uplinkInsert(forPlan);

                const plan = mcdu.getFlightPlan(forPlan);

                // TODO differentiate for sec
                mcdu.updateFlightNo(plan.flightNumber, forPlan);
                mcdu.setGroundTempFromOrigin(forPlan);

                if (mcdu.page.Current === mcdu.page.InitPageA) {
                  CDUInitPage.ShowPage1(mcdu, forPlan);
                }
              })
              .catch((error) => {
                console.error(error);
                mcdu.logTroubleshootingError(error);
                mcdu.setScratchpadMessage(NXSystemMessages.invalidFplnUplink);
              });
          })
          .catch((error) => {
            console.error(error);
            mcdu.logTroubleshootingError(error);
            mcdu.setScratchpadMessage(NXSystemMessages.invalidFplnUplink);
          });
      }
    };
    mcdu.rightInputDelay[2] = () => {
      return mcdu.getDelaySwitchPage();
    };
    mcdu.onRightInput[2] = () => {
      if (alignOption) {
        CDUIRSInit.ShowPage(mcdu);
      }
    };

    const groundTemp = new Column(23, '---°', Column.right);

    const planGroundTemp = plan.performanceData.groundTemperature;

    if (planGroundTemp !== null) {
      groundTemp.update(
        CDUInitPage.formatTemperature(planGroundTemp),
        Column.cyan,
        plan.performanceData.groundTemperatureIsPilotEntered ? Column.big : Column.small,
      );
    }

    mcdu.onRightInput[5] = (scratchpadValue, scratchpadCallback) => {
      try {
        mcdu.trySetGroundTemp(scratchpadValue, forPlan);
        CDUInitPage.ShowPage1(mcdu, forPlan);
      } catch (msg) {
        if (msg instanceof McduMessage) {
          mcdu.setScratchpadMessage(msg);
          scratchpadCallback();
        } else {
          throw msg;
        }
      }
    };

    mcdu.onLeftInput[2] = flightNoAction;

    mcdu.setArrows(false, false, true, true);

    mcdu.setTemplate(
      FormatTemplate([
        [new Column(1, forPlan >= FlightPlanIndex.FirstSecondary ? 'SEC' : ''), new Column(10, 'INIT')],
        [new Column(1, 'CO RTE'), new Column(21, 'FROM/TO', Column.right)],
        [coRoute, fromTo],
        [new Column(0, 'ALTN/CO RTE'), new Column(22, requestButtonLabel, Column.amber, Column.right)],
        [altDest, new Column(23, requestButton, Column.amber, Column.right)],
        [new Column(0, 'FLT NBR')],
        [new Column(0, flightNoText, flightNoColor), new Column(23, alignOption || '', Column.right)],
        [],
        [new Column(23, 'WIND/TEMP>', Column.right)],
        [new Column(0, 'COST INDEX'), new Column(23, 'TROPO', Column.right)],
        [new Column(0, costIndexText, costIndexColor), tropo],
        [new Column(0, 'CRZ FL/TEMP'), new Column(23, 'GND TEMP', Column.right)],
        [cruiseFl, cruiseFlTempSeparator, cruiseTemp, groundTemp],
      ]),
    );

    mcdu.onPrevPage = () => {
      mcdu.goToFuelPredPage(forPlan);
    };
    mcdu.onNextPage = () => {
      mcdu.goToFuelPredPage(forPlan);
    };

    mcdu.onRightInput[3] = () => {
      CDUWindPage.Return = () => {
        CDUInitPage.ShowPage1(mcdu, forPlan);
      };
      CDUWindPage.ShowPage(mcdu);
    };

    mcdu.onUp = () => {};
  }

  static fuelPredConditionsMet(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex) {
    const plan = mcdu.getFlightPlan(forPlan);

    const fob = mcdu.getFOB();

    return (
      Number.isFinite(fob) &&
      plan?.legCount > 0 &&
      plan.performanceData.zeroFuelWeight !== null &&
      plan.performanceData.zeroFuelWeightCenterOfGravity !== null
    );
  }
  static trySetFuelPred(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex) {
    if (CDUInitPage.fuelPredConditionsMet(mcdu, forPlan) && !mcdu._fuelPredDone) {
      setTimeout(() => {
        if (CDUInitPage.fuelPredConditionsMet(mcdu, forPlan) && !mcdu._fuelPredDone) {
          //Double check as user can clear block fuel during timeout
          mcdu._fuelPredDone = true;
          if (mcdu.page.Current === mcdu.page.InitPageB) {
            CDUInitPage.ShowPage2(mcdu, forPlan);
          }
        }
      }, mcdu.getDelayFuelPred());
    }
  }
  static ShowPage2(mcdu: LegacyFmsPageInterface, forPlan: FlightPlanIndex) {
    if (forPlan >= FlightPlanIndex.FirstSecondary) {
      mcdu.efisInterfaces.L.setSecRelatedPageOpen(true);
      mcdu.efisInterfaces.R.setSecRelatedPageOpen(true);
      mcdu.onUnload = () => {
        mcdu.efisInterfaces.L.setSecRelatedPageOpen(false);
        mcdu.efisInterfaces.R.setSecRelatedPageOpen(false);
      };
    }

    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.InitPageB;
    mcdu.activeSystem = 'FMGC';
    mcdu.pageRedrawCallback = () => CDUInitPage.ShowPage2(mcdu, forPlan);

    const plan = mcdu.getFlightPlan(forPlan);
    const isForPrimary = forPlan < FlightPlanIndex.FirstSecondary;

    const predictions = mcdu.runFuelComputations(forPlan, CDUInitPage.computationsCache);

    const alternate = mcdu.flightPlanService.active
      ? mcdu.flightPlanService.active.alternateDestinationAirport
      : undefined;

    const zfwCell = new Column(
      17,
      isForPrimary ? '___._' : '[\xa0\xa0.]',
      isForPrimary ? Column.amber : Column.cyan,
      Column.right,
    );
    const zfwCgCell = new Column(
      22,
      isForPrimary ? '__._' : '[\xa0.]',
      isForPrimary ? Column.amber : Column.cyan,
      Column.right,
    );
    const zfwCgCellDivider = new Column(18, '|', isForPrimary ? Column.amber : Column.cyan, Column.right);

    if (plan.performanceData.zeroFuelWeight !== null && plan.performanceData.zeroFuelWeightCenterOfGravity !== null) {
      zfwCell.update(NXUnits.kgToUser(plan.performanceData.zeroFuelWeight).toFixed(1), Column.cyan);
      zfwCgCell.update(plan.performanceData.zeroFuelWeightCenterOfGravity.toFixed(1), Column.cyan);
      zfwCgCellDivider.updateAttributes(Column.cyan);
    }
    mcdu.onRightInput[0] = async (value, scratchpadCallback) => {
      if (value === Keypad.clrValue) {
        mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
        scratchpadCallback();
        return;
      } else if (value === '') {
        let zfw = undefined;
        let zfwCg = undefined;
        const a32nxBoarding = SimVar.GetSimVarValue('L:A32NX_BOARDING_STARTED_BY_USR', 'bool');
        const gsxBoarding = SimVar.GetSimVarValue('L:FSDT_GSX_BOARDING_STATE', 'number');
        if (a32nxBoarding || (gsxBoarding >= 4 && gsxBoarding < 6)) {
          zfw = NXUnits.kgToUser(SimVar.GetSimVarValue('L:A32NX_AIRFRAME_ZFW_DESIRED', 'number'));
          zfwCg = SimVar.GetSimVarValue('L:A32NX_AIRFRAME_ZFW_CG_PERCENT_MAC_DESIRED', 'number');
        } else if (isFinite(getZfw()) && isFinite(getZfwcg())) {
          zfw = getZfw();
          zfwCg = getZfwcg();
        }

        // ZFW/ZFWCG auto-fill helper
        if (zfw && zfwCg) {
          mcdu.setScratchpadText(`${(zfw / 1000).toFixed(1)}/${zfwCg.toFixed(1)}`);
        } else {
          mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        }
      } else {
        if (mcdu.trySetZeroFuelWeightZFWCG(value, forPlan)) {
          CDUInitPage.ShowPage2(mcdu, forPlan);
          CDUInitPage.trySetFuelPred(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      }
    };

    const blockFuel = new Column(
      23,
      isForPrimary ? '__._' : '[\xa0.]',
      isForPrimary ? Column.amber : Column.cyan,
      Column.right,
    );

    // TODO handle fuel planning phase for sec
    if (plan.performanceData.blockFuel !== null || mcdu._fuelPlanningPhase === FuelPlanningPhases.IN_PROGRESS) {
      if (isFinite(plan.performanceData.blockFuel)) {
        blockFuel.update(NXUnits.kgToUser(plan.performanceData.blockFuel).toFixed(1), Column.cyan);
      }
    }
    mcdu.onRightInput[1] = async (value, scratchpadCallback) => {
      if (plan.performanceData.zeroFuelWeight !== null && value !== Keypad.clrValue) {
        //Simulate delay if calculating trip data
        if (mcdu.trySetBlockFuel(value, forPlan)) {
          CDUInitPage.ShowPage2(mcdu, forPlan);
          CDUInitPage.trySetFuelPred(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      } else {
        if (mcdu.trySetBlockFuel(value, forPlan)) {
          CDUInitPage.ShowPage2(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      }
    };

    const fuelPlanTopTitle = new Column(23, '', Column.amber, Column.right);
    const fuelPlanBottomTitle = new Column(23, '', Column.amber, Column.right);
    if (plan.performanceData.zeroFuelWeight !== null && plan.performanceData.blockFuel === null) {
      fuelPlanTopTitle.text = 'FUEL ';
      fuelPlanBottomTitle.text = 'PLANNING }';
      mcdu.onRightInput[2] = async () => {
        if (mcdu.tryFuelPlanning()) {
          CDUInitPage.ShowPage2(mcdu, forPlan);
        }
      };
    }
    if (mcdu._fuelPlanningPhase === FuelPlanningPhases.IN_PROGRESS) {
      fuelPlanTopTitle.update('BLOCK ', Column.green);
      fuelPlanBottomTitle.update('CONFIRM', Column.green);
      mcdu.onRightInput[2] = async () => {
        if (mcdu.tryFuelPlanning()) {
          CDUInitPage.ShowPage2(mcdu, forPlan);
          CDUInitPage.trySetFuelPred(mcdu, forPlan);
        }
      };
    }

    const towCell = new Column(17, '---.-', Column.right);
    const lwCell = new Column(23, '---.-', Column.right);
    const towLwCellDivider = new Column(18, '/');
    const taxiFuelCell = new Column(0, '0.4', Column.cyan, Column.small);

    taxiFuelCell.update(
      NXUnits.kgToUser(plan.performanceData.taxiFuel).toFixed(1),
      plan.performanceData.taxiFuelIsPilotEntered ? Column.big : Column.small,
    );

    mcdu.onLeftInput[0] = async (value, scratchpadCallback) => {
      if (mcdu._fuelPredDone) {
        setTimeout(async () => {
          if (mcdu.trySetTaxiFuelWeight(value, forPlan)) {
            if (mcdu.page.Current === mcdu.page.InitPageB) {
              CDUInitPage.ShowPage2(mcdu, forPlan);
            }
          } else {
            scratchpadCallback();
          }
        }, mcdu.getDelayHigh());
      } else {
        if (mcdu.trySetTaxiFuelWeight(value, forPlan)) {
          CDUInitPage.ShowPage2(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      }
    };

    const tripWeightCell = new Column(4, '---.-', Column.right);
    const tripTimeCell = new Column(9, '----', Column.right);
    const tripCellDivider = new Column(5, '/');
    const rteRsvWeightCell = new Column(4, '---.-', Column.right);
    const rteRsvPercentCell = new Column(6, '5.0', Column.cyan);
    const rteRsvCellDivider = new Column(5, '/', Column.cyan);

    if (Number.isFinite(predictions.routeReserveFuelPercentage)) {
      rteRsvPercentCell.text = predictions.routeReserveFuelPercentage.toFixed(1);
    }
    mcdu.onLeftInput[2] = async (value, scratchpadCallback) => {
      if (mcdu.trySetRouteReservedPercent(value, FlightPlanIndex.Active)) {
        CDUInitPage.ShowPage2(mcdu, forPlan);
      } else {
        scratchpadCallback();
      }
    };

    const altnWeightCell = new Column(4, '---.-', Column.right);
    const altnTimeCell = new Column(9, '----', Column.right);
    const altnCellDivider = new Column(5, '/');
    const finalWeightCell = new Column(4, '---.-', Column.right);
    const finalTimeCell = new Column(9, '----', Column.right);
    const finalCellDivider = new Column(5, '/');

    if (predictions.finalHoldingTime > 0) {
      finalTimeCell.update(FmsFormatters.minutesTohhmm(predictions.finalHoldingTime), Column.cyan);
      finalCellDivider.updateAttributes(Column.cyan);
    }
    mcdu.onLeftInput[4] = async (value, scratchpadCallback) => {
      if (mcdu.trySetRouteFinalTime(value, forPlan)) {
        CDUInitPage.ShowPage2(mcdu, forPlan);
      } else {
        scratchpadCallback();
      }
    };

    const extraWeightCell = new Column(18, '---.-', Column.right);
    const extraTimeCell = new Column(23, '----', Column.right);
    const extraCellDivider = new Column(19, '/');
    const minDestFob = new Column(4, '---.-', Column.right);
    const tripWindDirCell = new Column(19, '--');
    const tripWindAvgCell = new Column(21, '---');

    if (mcdu.flightPlanService.active.originAirport && mcdu.flightPlanService.active.destinationAirport) {
      tripWindDirCell.update(
        CDUInitPage.formatWindDirection(plan.performanceData.pilotTripWind ?? 0),
        Column.cyan,
        Column.small,
      );
      tripWindAvgCell.update(CDUInitPage.formatWindComponent(plan.performanceData.pilotTripWind ?? 0), Column.cyan);

      mcdu.onRightInput[4] = (value, scratchpadCallback) => {
        if (mcdu.trySetAverageWind(value, forPlan)) {
          CDUInitPage.ShowPage2(mcdu, forPlan);
        } else {
          scratchpadCallback();
        }
      };
    }

    if (CDUInitPage.fuelPredConditionsMet(mcdu, forPlan)) {
      fuelPlanTopTitle.text = '';
      fuelPlanBottomTitle.text = '';

      if (Number.isFinite(predictions.takeoffWeight)) {
        towCell.update(NXUnits.kgToUser(predictions.takeoffWeight).toFixed(1), Column.green, Column.small);
      }

      if (mcdu._fuelPredDone) {
        if (Number.isFinite(predictions.finalHoldingFuel) && Number.isFinite(predictions.tripTime)) {
          if (plan.performanceData.pilotFinalHoldingFuel !== null) {
            finalWeightCell.update(NXUnits.kgToUser(predictions.finalHoldingFuel).toFixed(1), Column.cyan);
          } else {
            finalWeightCell.update(
              NXUnits.kgToUser(predictions.finalHoldingFuel).toFixed(1),
              Column.cyan,
              Column.small,
            );
          }
          const isRouteFinalEntered =
            plan.performanceData.pilotFinalHoldingFuel !== null || plan.performanceData.isFinalHoldingTimePilotEntered;

          if (plan.performanceData.pilotFinalHoldingTime !== null || !isRouteFinalEntered) {
            finalTimeCell.update(FmsFormatters.minutesTohhmm(predictions.finalHoldingTime), Column.cyan);
          } else {
            finalTimeCell.update(FmsFormatters.minutesTohhmm(predictions.finalHoldingTime), Column.cyan, Column.small);
            finalCellDivider.updateAttributes(Column.small);
          }
          finalCellDivider.updateAttributes(Column.cyan);
        }
        mcdu.onLeftInput[4] = async (value, scratchpadCallback) => {
          setTimeout(async () => {
            if (mcdu.trySetRouteFinalFuel(value, forPlan)) {
              if (mcdu.page.Current === mcdu.page.InitPageB) {
                CDUInitPage.ShowPage2(mcdu, forPlan);
              }
            } else {
              scratchpadCallback();
            }
          }, mcdu.getDelayHigh());
        };

        if (alternate) {
          const altFuelEntered = plan.performanceData.pilotAlternateFuel !== null;
          if (Number.isFinite(predictions.alternateFuel)) {
            altnWeightCell.update(
              NXUnits.kgToUser(predictions.alternateFuel).toFixed(1),
              Column.cyan,
              altFuelEntered ? Column.big : Column.small,
            );
            const time = predictions.alternateTime;
            if (time) {
              altnTimeCell.update(FmsFormatters.minutesTohhmm(predictions.alternateTime), Column.green, Column.small);
              altnCellDivider.updateAttributes(Column.green, Column.small);
            } else {
              altnTimeCell.update('----', Column.white);
              altnCellDivider.updateAttributes(Column.white, altFuelEntered ? Column.big : Column.small);
            }
          }
        } else {
          altnWeightCell.update('0.0', Column.green, Column.small);
        }

        mcdu.onLeftInput[3] = async (value, scratchpadCallback) => {
          setTimeout(async () => {
            if (await mcdu.trySetRouteAlternateFuel(value, FlightPlanIndex.Active)) {
              if (mcdu.page.Current === mcdu.page.InitPageB) {
                CDUInitPage.ShowPage2(mcdu, forPlan);
              }
            } else {
              scratchpadCallback();
            }
          }, mcdu.getDelayHigh());
        };

        if (predictions.tripFuel !== null && predictions.tripTime !== null) {
          tripWeightCell.update(NXUnits.kgToUser(predictions.tripFuel).toFixed(1), Column.green, Column.small);
          tripTimeCell.update(FmsFormatters.minutesTohhmm(predictions.tripTime), Column.green, Column.small);
          tripCellDivider.updateAttributes(Column.green, Column.small);
        }

        if (isFinite(predictions.routeReserveFuel)) {
          if (plan.performanceData.pilotRouteReserveFuel !== null) {
            rteRsvWeightCell.update(NXUnits.kgToUser(predictions.routeReserveFuel).toFixed(1), Column.cyan);
          } else {
            rteRsvWeightCell.update(
              NXUnits.kgToUser(predictions.routeReserveFuel).toFixed(1),
              Column.cyan,
              Column.small,
            );
          }
        }

        // TODO should come from AMI
        const routeReserveOutOfRange =
          predictions.routeReserveFuelPercentage < 0 || predictions.routeReserveFuelPercentage > 15;

        if (routeReserveOutOfRange) {
          rteRsvPercentCell.update('--.-', Column.white);
          rteRsvCellDivider.updateAttributes(Column.white);
        } else if (isFinite(predictions.routeReserveFuelPercentage)) {
          const isRouteReservedEntered =
            plan.performanceData.isRouteReserveFuelPrecentagePilotEntered ||
            plan.performanceData.pilotRouteReserveFuel !== null;

          if (plan.performanceData.isRouteReserveFuelPrecentagePilotEntered || !isRouteReservedEntered) {
            rteRsvPercentCell.update(predictions.routeReserveFuelPercentage.toFixed(1), Column.cyan);
          } else {
            rteRsvPercentCell.update(predictions.routeReserveFuelPercentage.toFixed(1), Column.cyan, Column.small);
            rteRsvCellDivider.updateAttributes(Column.small);
          }
        }

        mcdu.onLeftInput[2] = async (value, scratchpadCallback) => {
          setTimeout(async () => {
            if (await mcdu.trySetRouteReservedFuel(value, forPlan)) {
              if (mcdu.page.Current === mcdu.page.InitPageB) {
                CDUInitPage.ShowPage2(mcdu, forPlan);
              }
            } else {
              scratchpadCallback();
            }
          }, mcdu.getDelayMedium());
        };

        lwCell.update(NXUnits.kgToUser(predictions.landingWeight).toFixed(1), Column.green, Column.small);
        towLwCellDivider.updateAttributes(Column.green, Column.small);

        const windComponent = plan.performanceData.pilotTripWind ?? 0;

        tripWindDirCell.update(CDUInitPage.formatWindDirection(windComponent), Column.small);
        tripWindAvgCell.update(CDUInitPage.formatWindComponent(windComponent), Column.big);

        mcdu.onRightInput[4] = async (value, scratchpadCallback) => {
          setTimeout(() => {
            if (mcdu.trySetAverageWind(value, forPlan)) {
              if (mcdu.page.Current === mcdu.page.InitPageB) {
                CDUInitPage.ShowPage2(mcdu, forPlan);
              }
            } else {
              scratchpadCallback();
            }
          }, mcdu.getDelayWindLoad());
        };

        minDestFob.update(
          NXUnits.kgToUser(predictions.minimumDestinationFuel).toFixed(1),
          Column.cyan,
          plan.performanceData.pilotMinimumDestinationFuelOnBoard !== null ? Column.big : Column.small,
        );

        mcdu.onLeftInput[5] = async (value, scratchpadCallback) => {
          setTimeout(async () => {
            if (await mcdu.trySetMinDestFob(value, forPlan)) {
              if (mcdu.page.Current === mcdu.page.InitPageB) {
                CDUInitPage.ShowPage2(mcdu, forPlan);
              }
            } else {
              scratchpadCallback();
            }
          }, mcdu.getDelayHigh());
        };
        mcdu.checkEFOBBelowMin();

        extraWeightCell.update(NXUnits.kgToUser(predictions.extraFuel).toFixed(1), Column.green, Column.small);
        if (predictions.extraFuel >= 0) {
          extraTimeCell.update(FmsFormatters.minutesTohhmm(predictions.extraTime), Column.green, Column.small);
          extraCellDivider.updateAttributes(Column.green, Column.small);
        }
      }
    }

    mcdu.setArrows(false, false, true, true);

    mcdu.setTemplate(
      FormatTemplate([
        [new Column(1, forPlan >= FlightPlanIndex.FirstSecondary ? 'SEC' : ''), new Column(5, 'INIT FUEL PRED')],
        [new Column(0, 'TAXI'), new Column(15, 'ZFW/ZFWCG')],
        [taxiFuelCell, zfwCell, zfwCgCellDivider, zfwCgCell],
        [new Column(0, 'TRIP'), new Column(5, '/TIME'), new Column(19, 'BLOCK')],
        [tripWeightCell, tripCellDivider, tripTimeCell, blockFuel],
        [new Column(0, 'RTE RSV/%'), fuelPlanTopTitle],
        [rteRsvWeightCell, rteRsvCellDivider, rteRsvPercentCell, fuelPlanBottomTitle],
        [new Column(0, 'ALTN'), new Column(5, '/TIME'), new Column(15, 'TOW/'), new Column(22, 'LW')],
        [altnWeightCell, altnCellDivider, altnTimeCell, towCell, towLwCellDivider, lwCell],
        [new Column(0, 'FINAL/TIME'), new Column(15, 'TRIP WIND')],
        [finalWeightCell, finalCellDivider, finalTimeCell, tripWindDirCell, tripWindAvgCell],
        [new Column(0, 'MIN DEST FOB'), new Column(14, 'EXTRA/TIME')],
        [minDestFob, extraWeightCell, extraCellDivider, extraTimeCell],
      ]),
    );

    mcdu.onPrevPage = () => {
      CDUInitPage.ShowPage1(mcdu, forPlan);
    };
    mcdu.onNextPage = () => {
      CDUInitPage.ShowPage1(mcdu, forPlan);
    };
  }

  // Defining as static here to avoid duplicate code in CDUIRSInit
  static ConvertDDToDMS(deg, lng) {
    // converts decimal degrees to degrees minutes seconds
    const M = 0 | ((deg % 1) * 60e7);
    let degree;
    if (lng) {
      degree = (0 | (deg < 0 ? -deg : deg)).toString().padStart(3, '0');
    } else {
      degree = 0 | (deg < 0 ? -deg : deg);
    }
    return {
      dir: deg < 0 ? (lng ? 'W' : 'S') : lng ? 'E' : 'N',
      deg: degree,
      min: Math.abs(0 | (M / 1e7)),
      sec: Math.abs((0 | (((M / 1e6) % 1) * 6e4)) / 100),
    };
  }

  static formatWindDirection(tailwindComponent) {
    return Math.round(tailwindComponent) > 0 ? 'TL' : 'HD';
  }

  static formatWindComponent(tailwindComponent) {
    return Math.round(Math.abs(tailwindComponent)).toFixed(0).padStart(3, '0');
  }

  static formatTemperature(temperature: number): string {
    return `${temperature > 0 ? '+' : ''}${temperature.toFixed(0)}°`;
  }
}
