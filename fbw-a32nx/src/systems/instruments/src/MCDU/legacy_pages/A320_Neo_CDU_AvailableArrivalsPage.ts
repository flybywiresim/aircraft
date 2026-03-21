// @ts-strict-ignore
/*
 * A32NX
 * Copyright (C) 2020-2021, 2025 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
  Airport,
  AirportSubsectionCode,
  Approach,
  ApproachType,
  ApproachUtils,
  Arrival,
  NXUnits,
  Runway,
  RunwayUtils,
} from '@flybywiresim/fbw-sdk';
import { CDUFlightPlanPage } from './A320_Neo_CDU_FlightPlanPage';
import { NXFictionalMessages, NXSystemMessages } from '../messages/NXSystemMessages';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

const ApproachTypeOrder = Object.freeze({
  [ApproachType.Mls]: 0,
  [ApproachType.MlsTypeA]: 1,
  [ApproachType.MlsTypeBC]: 2,
  [ApproachType.Ils]: 3,
  [ApproachType.Gls]: 4,
  [ApproachType.Igs]: 5,
  [ApproachType.Loc]: 6,
  [ApproachType.LocBackcourse]: 7,
  [ApproachType.Lda]: 8,
  [ApproachType.Sdf]: 9,
  [ApproachType.Fms]: 10,
  [ApproachType.Gps]: 11,
  [ApproachType.Rnav]: 12,
  [ApproachType.VorDme]: 13,
  [ApproachType.Vortac]: 13, // VORTAC and VORDME are intentionally the same
  [ApproachType.Vor]: 14,
  [ApproachType.NdbDme]: 15,
  [ApproachType.Ndb]: 16,
  [ApproachType.Unknown]: 17,
});

const ArrivalPagination = Object.freeze({
  ARR_PAGE: 3,
  TRNS_PAGE: 2,
  VIA_PAGE: 4,
});

const Labels = Object.freeze({
  NO_TRANS: 'NO TRANS',
  NO_VIA: 'NO VIA',
  NO_STAR: 'NO STAR',
});

export class CDUAvailableArrivalsPage {
  static async ShowPage(
    mcdu: LegacyFmsPageInterface,
    airport: Airport,
    pageCurrent = 0,
    starSelection = false,
    forPlan = FlightPlanIndex.Active,
    inAlternate = false,
  ) {
    /** @type {BaseFlightPlan} */
    const targetPlan = inAlternate ? mcdu.getAlternateFlightPlan(forPlan) : mcdu.getFlightPlan(forPlan);

    const isTemporary = targetPlan.index === FlightPlanIndex.Temporary;

    const selectedApproachId = targetPlan.approach ? targetPlan.approach.databaseId : targetPlan.approach;
    const selectedStarId = targetPlan.arrival ? targetPlan.arrival.databaseId : targetPlan.arrival;
    const selectedTransitionId = targetPlan.arrivalEnrouteTransition
      ? targetPlan.arrivalEnrouteTransition.databaseId
      : targetPlan.arrivalEnrouteTransition;

    const flightPlanAccentColor = isTemporary ? 'yellow' : 'green';

    const ilss = await mcdu.navigationDatabase.backendDatabase.getIlsAtAirport(targetPlan.destinationAirport.ident);

    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.AvailableArrivalsPage;
    let selectedApproachCell = '------';
    let selectedViasCell = '------';
    let selectedTransitionCell = '------';
    let selectedApproachCellColor = 'white';
    let selectedViasCellColor = 'white';
    let selectedTransitionCellColor = 'white';

    let viasPageLabel = '';
    let viasPageLine = '';

    const selectedApproach = targetPlan.approach;

    if (selectedApproach && selectedApproach.ident) {
      selectedApproachCell = ApproachUtils.shortApproachName(selectedApproach);
      selectedApproachCellColor = flightPlanAccentColor;

      const selectedApproachTransition = targetPlan.approachVia;
      const availableVias = targetPlan.availableApproachVias;

      if (availableVias.length === 0 || selectedApproachTransition === null) {
        selectedViasCell = 'NONE';
        selectedViasCellColor = flightPlanAccentColor;
      } else if (selectedApproachTransition) {
        selectedViasCell = selectedApproachTransition.ident;
        selectedViasCellColor = flightPlanAccentColor;
      }
    } else if (!selectedApproach && targetPlan.destinationRunway) {
      selectedApproachCell = RunwayUtils.runwayString(targetPlan.destinationRunway.ident);
      selectedApproachCellColor = flightPlanAccentColor;

      // Runway-only approaches have no VIAs
      selectedViasCell = 'NONE';
      selectedViasCellColor = flightPlanAccentColor;
    }

    let selectedStarCell = '------';
    let selectedStarCellColor = 'white';

    const selectedArrival = targetPlan.arrival;
    const availableArrivals = targetPlan.availableArrivals;

    if (selectedArrival) {
      selectedStarCell = selectedArrival.ident;
      selectedStarCellColor = flightPlanAccentColor;

      const selectedTransition = targetPlan.arrivalEnrouteTransition;
      const availableTransitions = selectedArrival.enrouteTransitions;

      if (selectedTransition) {
        selectedTransitionCell = selectedTransition.ident;
        selectedTransitionCellColor = flightPlanAccentColor;
      } else if (availableTransitions.length === 0 || selectedTransition === null) {
        selectedTransitionCell = 'NONE';
        selectedTransitionCellColor = flightPlanAccentColor;
      }
    } else if (selectedArrival === null || availableArrivals.length === 0) {
      selectedStarCell = 'NONE';
      selectedStarCellColor = flightPlanAccentColor;

      selectedTransitionCell = 'NONE';
      selectedTransitionCellColor = flightPlanAccentColor;
    }

    const approaches = targetPlan.availableApproaches;
    const runways = [...targetPlan.availableDestinationRunways].sort((a, b) => a.ident.localeCompare(b.ident));

    // Sort the approaches in Honeywell's documented order
    const sortedApproaches = approaches
      .slice()
      // The A320 cannot fly TACAN approaches
      .filter(({ type }) => type !== ApproachType.Tacan)
      // Filter out approaches with no matching runway
      // Approaches not going to a specific runway (i.e circling approaches are filtered out at DB level)
      .filter((a) => !!runways.find((rw) => rw.ident === a.runwayIdent))
      // Sort the approaches in Honeywell's documented order, and alphabetical in between
      // Sort the approaches in Honeywell's documented order, then by runway number, runway designator, and finally approach suffix.
      .sort((a, b) =>
        a.type != b.type
          ? ApproachTypeOrder[a.type] - ApproachTypeOrder[b.type]
          : a.runwayNumber !== b.runwayNumber
            ? a.runwayNumber - b.runwayNumber
            : a.runwayDesignator !== b.runwayDesignator
              ? a.runwayDesignator - b.runwayDesignator
              : a.multipleIndicator.localeCompare(b.multipleIndicator),
      );
    const allApproaches = (sortedApproaches as (Runway | Approach)[]).concat(
      // Runway-by-itself approaches
      runways.slice().sort((a, b) => (a.number !== b.number ? a.number - b.number : a.designator - b.designator)),
    );
    const rows = [[''], [''], [''], [''], [''], [''], [''], ['']];

    const matchingArrivals: { arrival: Arrival; arrivalIndex: number }[] = [];

    if (!starSelection) {
      for (let i = 0; i < ArrivalPagination.ARR_PAGE; i++) {
        const index = i + pageCurrent * ArrivalPagination.ARR_PAGE;

        const approachOrRunway = allApproaches[index];
        if (!approachOrRunway) {
          break;
        }

        if (approachOrRunway.subSectionCode === AirportSubsectionCode.ApproachProcedures) {
          let runwayLength = '----';
          let runwayCourse = '---';

          const isSelected = selectedApproach && selectedApproachId === approachOrRunway.databaseId;
          const color = isSelected && !isTemporary ? 'green' : 'cyan';

          const runway = targetPlan.availableDestinationRunways.find((rw) => rw.ident === approachOrRunway.runwayIdent);
          if (runway) {
            runwayLength = NXUnits.mToUser(runway.length).toFixed(0);
            runwayCourse = Utils.leadingZeros(Math.round(runway.magneticBearing), 3);

            const finalLeg = approachOrRunway.legs[approachOrRunway.legs.length - 1];
            const matchingIls =
              approachOrRunway.type === ApproachType.Ils
                ? ilss.find(
                    (ils) =>
                      finalLeg &&
                      finalLeg.recommendedNavaid &&
                      ils.databaseId === finalLeg.recommendedNavaid.databaseId,
                  )
                : undefined;
            const hasIls = !!matchingIls;
            const ilsText = hasIls ? `${matchingIls.ident.padStart(6)}/${matchingIls.frequency.toFixed(2)}` : '';

            rows[2 * i] = [
              `{${color}}${!isSelected ? '{' : '{sp}'}${ApproachUtils.shortApproachName(approachOrRunway)}{end}`,
              '',
              `{sp}{sp}${runwayLength.padStart(6, '\xa0')}{small}${NXUnits.userDistanceUnit().padEnd(2)}{end}[color]${color}`,
            ];
            rows[2 * i + 1] = [`{${color}}{sp}{sp}{sp}${runwayCourse}${ilsText}{end}`];
          }

          mcdu.onLeftInput[i + 2] = async (_, scratchpadCallback) => {
            // Clicking the already selected approach is not allowed
            if (!isSelected) {
              try {
                await mcdu.flightPlanService.setApproach(approachOrRunway.databaseId, forPlan, inAlternate);
                await CDUAvailableArrivalsPage.tryAutoSetApproachVia(mcdu, forPlan, inAlternate);

                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
              } catch (e) {
                console.error(e);
                mcdu.logTroubleshootingError(e);
                mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                mcdu.eraseTemporaryFlightPlan(() => {
                  CDUAvailableArrivalsPage.ShowPage(mcdu, airport, pageCurrent, false, forPlan, inAlternate);
                });
              }
            } else {
              mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);

              scratchpadCallback();
            }
          };
        } else {
          const runwayCourse = Utils.leadingZeros(Math.round(approachOrRunway.magneticBearing), 3);

          const isSelected =
            !selectedApproach &&
            targetPlan.destinationRunway &&
            approachOrRunway.databaseId === targetPlan.destinationRunway.databaseId;
          const color = isSelected && !isTemporary ? 'green' : 'cyan';

          rows[2 * i] = [
            `{${color}}${!isSelected ? '{' : '{sp}'}${RunwayUtils.runwayString(approachOrRunway.ident)}{end}`,
            '',
            `{sp}{sp}${NXUnits.mToUser(approachOrRunway.length).toFixed(0).padStart(6, '\xa0')}{small}${NXUnits.userDistanceUnit().padEnd(2)}{end}[color]${color}`,
          ];
          rows[2 * i + 1] = ['{sp}{sp}{sp}' + runwayCourse + '[color]cyan'];

          mcdu.onLeftInput[i + 2] = async (_, scratchpadCallback) => {
            // Clicking the already selected runway is not allowed
            if (!isSelected) {
              try {
                await mcdu.flightPlanService.setApproach(undefined, forPlan, inAlternate);
                await mcdu.flightPlanService.setDestinationRunway(approachOrRunway.ident, forPlan, inAlternate);

                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
              } catch (e) {
                console.error(e);
                mcdu.logTroubleshootingError(e);
                mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                mcdu.eraseTemporaryFlightPlan(() => {
                  CDUAvailableArrivalsPage.ShowPage(mcdu, airport, pageCurrent, false, forPlan, inAlternate);
                });
              }
            } else {
              mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);

              scratchpadCallback();
            }
          };
        }
      }
    } else {
      const destinationRunway = targetPlan.destinationRunway;

      if (destinationRunway) {
        const arrivals = [...targetPlan.availableArrivals].sort((a, b) => a.ident.localeCompare(b.ident));

        for (let i = 0; i < arrivals.length; i++) {
          const arrival = arrivals[i];

          if (arrival.runwayTransitions.length) {
            for (let j = 0; j < arrival.runwayTransitions.length; j++) {
              const runwayTransition = arrival.runwayTransitions[j];
              if (runwayTransition) {
                // Check if selectedRunway matches a transition on the approach (and also checks for Center runways)
                if (
                  runwayTransition.ident === destinationRunway.ident ||
                  (runwayTransition.ident.charAt(6) === 'B' &&
                    runwayTransition.ident.substring(4, 6) === destinationRunway.ident.substring(4, 6))
                ) {
                  matchingArrivals.push({ arrival: arrival, arrivalIndex: i });
                }
              }
            }
          } else {
            //add the arrival even if it isn't runway specific
            matchingArrivals.push({ arrival: arrival, arrivalIndex: i });
          }
        }
      } else {
        for (let i = 0; i < targetPlan.availableArrivals.length; i++) {
          const arrival = targetPlan.availableArrivals[i];
          matchingArrivals.push({ arrival: arrival, arrivalIndex: i });
        }
      }
      for (let i = 0; i < ArrivalPagination.ARR_PAGE; i++) {
        let index = i + pageCurrent * ArrivalPagination.ARR_PAGE;
        if (index === 0) {
          const isSelected = selectedArrival === null;
          const color = isSelected && !isTemporary ? 'green' : 'cyan';

          rows[2 * i] = [`{${color}}${!isSelected ? '{' : '{sp}'}${Labels.NO_STAR}{end}`];

          if (!isSelected) {
            mcdu.onLeftInput[i + 2] = async () => {
              try {
                await mcdu.flightPlanService.setArrival(null, forPlan, inAlternate);
                if (await CDUAvailableArrivalsPage.tryAutoSetApproachVia(mcdu, forPlan, inAlternate)) {
                  CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                } else {
                  const newTargetPlan = inAlternate
                    ? mcdu.getAlternateFlightPlan(forPlan)
                    : mcdu.getFlightPlan(forPlan);
                  const availableVias = newTargetPlan.availableApproachVias;

                  if (selectedApproach !== undefined && availableVias.length > 0) {
                    CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, 0, forPlan, inAlternate);
                  } else {
                    CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                  }
                }
              } catch (e) {
                console.error(e);
                mcdu.logTroubleshootingError(e);
                mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                mcdu.eraseTemporaryFlightPlan(() => {
                  CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
                });
              }
            };
          }
        } else {
          index--;
          if (matchingArrivals[index]) {
            const star = matchingArrivals[index].arrival;
            const starDatabaseId = matchingArrivals[index].arrival.databaseId;
            const isSelected = selectedStarId === starDatabaseId;
            const color = isSelected && !isTemporary ? 'green' : 'cyan';

            rows[2 * i] = [`{${color}}${!isSelected ? '{' : '{sp}'}${star.ident}{end}`];

            mcdu.onLeftInput[i + 2] = async (_, scratchpadCallback) => {
              // Clicking the already selected star is not allowed
              if (!isSelected) {
                const destinationRunway = targetPlan.destinationRunway;

                const arrivalRunway = destinationRunway
                  ? star.runwayTransitions.find((t) => {
                      return t.ident === destinationRunway.ident;
                    })
                  : undefined;

                try {
                  if (arrivalRunway !== undefined) {
                    await mcdu.flightPlanService.setDestinationRunway(arrivalRunway.ident, forPlan, inAlternate);
                  }

                  await mcdu.flightPlanService.setArrival(starDatabaseId, forPlan, inAlternate);

                  if (await CDUAvailableArrivalsPage.tryAutoSetApproachVia(mcdu, forPlan, inAlternate)) {
                    CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                  } else {
                    const availableVias = targetPlan.availableApproachVias;

                    if (selectedApproach !== undefined && availableVias.length > 0) {
                      CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, 0, forPlan, inAlternate);
                    } else {
                      CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
                    }
                  }
                } catch (e) {
                  console.error(e);
                  mcdu.logTroubleshootingError(e);
                  mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                  mcdu.eraseTemporaryFlightPlan(() => {
                    CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
                  });
                }
              } else {
                mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);

                scratchpadCallback();
              }
            };
          }
        }
      }

      if (selectedArrival) {
        if (selectedArrival.enrouteTransitions.length > 0) {
          const isNoTransSelected = selectedTransitionId === null;
          const color = isNoTransSelected && !isTemporary ? 'green' : 'cyan';

          rows[0][1] = `${Labels.NO_TRANS}${!isNoTransSelected ? '}' : '{sp}'}[color]${color}`;

          mcdu.onRightInput[2] = async () => {
            try {
              await mcdu.flightPlanService.setArrivalEnrouteTransition(null, forPlan, inAlternate);

              CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
            } catch (e) {
              console.error(e);
              mcdu.logTroubleshootingError(e);
              mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

              mcdu.eraseTemporaryFlightPlan(() => {
                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
              });
            }
          };

          for (let i = 0; i < ArrivalPagination.TRNS_PAGE; i++) {
            const index = i + pageCurrent * ArrivalPagination.TRNS_PAGE;

            const transition = selectedArrival.enrouteTransitions[index];
            if (transition) {
              const isSelected = selectedTransitionId === transition.databaseId;
              const color = isSelected && !isTemporary ? 'green' : 'cyan';

              rows[2 * (i + 1)][1] = `{${color}}${transition.ident}${!isSelected ? '}' : '{sp}'}{end}`;

              // Clicking the already selected transition is not allowed
              mcdu.onRightInput[i + 3] = async (_, scratchpadCallback) => {
                if (!isSelected) {
                  try {
                    await mcdu.flightPlanService.setArrivalEnrouteTransition(
                      transition.databaseId,
                      forPlan,
                      inAlternate,
                    );

                    CDUAvailableArrivalsPage.ShowPage(mcdu, airport, pageCurrent, true, forPlan, inAlternate);
                  } catch (e) {
                    console.error(e);
                    mcdu.logTroubleshootingError(e);
                    mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

                    mcdu.eraseTemporaryFlightPlan(() => {
                      CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
                    });
                  }
                } else {
                  mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);

                  scratchpadCallback();
                }
              };
            }
          }
        }
      }

      if (selectedApproach) {
        const availableApproachVias = targetPlan.availableApproachVias;

        if (availableApproachVias.length > 0) {
          viasPageLabel = '{sp}APPR';
          viasPageLine = '<VIAS';
          mcdu.onLeftInput[1] = () => {
            CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, 0, forPlan, inAlternate);
          };
        }
      }
    }

    let bottomLine = ['<RETURN'];
    if (isTemporary) {
      bottomLine = ['{ERASE[color]amber', 'INSERT*[color]amber'];
      mcdu.onLeftInput[5] = async () => {
        mcdu.eraseTemporaryFlightPlan(() => {
          CDUFlightPlanPage.ShowPage(mcdu, 0, false, forPlan);
        });
      };
      mcdu.onRightInput[5] = async () => {
        mcdu.insertTemporaryFlightPlan(() => {
          mcdu.updateTowerHeadwind();
          mcdu.updateConstraints();
          CDUFlightPlanPage.ShowPage(mcdu, 0, false, forPlan);
        });
      };
    } else {
      mcdu.onLeftInput[5] = () => {
        CDUFlightPlanPage.ShowPage(mcdu, 0, false, forPlan);
      };
    }
    let up = false;
    let down = false;
    const maxPage = starSelection
      ? selectedArrival
        ? Math.max(
            Math.ceil(selectedArrival.enrouteTransitions.length / ArrivalPagination.TRNS_PAGE) - 1,
            Math.ceil((matchingArrivals.length + 1) / ArrivalPagination.ARR_PAGE) - 1,
          )
        : Math.ceil((matchingArrivals.length + 1) / ArrivalPagination.ARR_PAGE) - 1
      : Math.ceil(allApproaches.length / ArrivalPagination.ARR_PAGE) - 1;
    if (pageCurrent < maxPage) {
      mcdu.onUp = () => {
        pageCurrent++;
        if (pageCurrent < 0) {
          pageCurrent = 0;
        }
        CDUAvailableArrivalsPage.ShowPage(mcdu, airport, pageCurrent, starSelection, forPlan, inAlternate);
      };
      up = true;
    }
    if (pageCurrent > 0) {
      mcdu.onDown = () => {
        pageCurrent--;
        if (pageCurrent < 0) {
          pageCurrent = 0;
        }
        CDUAvailableArrivalsPage.ShowPage(mcdu, airport, pageCurrent, starSelection, forPlan, inAlternate);
      };
      down = true;
    }
    mcdu.setArrows(up, down, true, true);

    const titleCell =
      forPlan >= FlightPlanIndex.FirstSecondary
        ? `SEC ARRIVAL {small}TO{end} ${airport.ident}{sp}{sp}{sp}{sp}{sp}`
        : `ARRIVAL {small}TO{end} {green}${airport.ident}{end}{sp}`;

    mcdu.setTemplate([
      [titleCell],
      ['{sp}APPR', 'STAR{sp}', '{sp}VIA'],
      [
        `{${selectedApproachCellColor}}${selectedApproachCell.padEnd(10)}{end}{${selectedViasCellColor}}${selectedViasCell}{end}`,
        selectedStarCell + '[color]' + selectedStarCellColor,
      ],
      [viasPageLabel, 'TRANS{sp}'],
      [viasPageLine, selectedTransitionCell + '[color]' + selectedTransitionCellColor],
      [
        '{big}' + (starSelection ? 'STARS' : 'APPR').padEnd(5) + '{end}{sp}{sp}AVAILABLE',
        starSelection ? '{big}TRANS{end}' : '',
        '',
      ],
      rows[0],
      rows[1],
      rows[2],
      rows[3],
      rows[4],
      rows[5],
      bottomLine,
    ]);
    mcdu.onPrevPage = () => {
      CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, !starSelection, forPlan, inAlternate);
    };
    mcdu.onNextPage = mcdu.onPrevPage;
  }

  static ShowViasPage(
    mcdu: LegacyFmsPageInterface,
    airport: Airport,
    pageCurrent = 0,
    forPlan = FlightPlanIndex.Active,
    inAlternate = false,
  ) {
    const targetPlan = inAlternate ? mcdu.getAlternateFlightPlan(forPlan) : mcdu.getFlightPlan(forPlan);

    const isTemporary = targetPlan.index === FlightPlanIndex.Temporary;
    const planColor = isTemporary ? 'yellow' : 'green';

    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.AvailableArrivalsPageVias;
    let selectedApproachCell = '------';
    let selectedApproachCellColor = 'white';
    let selectedViasCell = '------';
    let selectedViasCellColor = 'white';

    const selectedApproach = targetPlan.approach;
    const selectedApproachVia = targetPlan.approachVia;

    if (selectedApproach) {
      selectedApproachCell = ApproachUtils.shortApproachName(selectedApproach);
      selectedApproachCellColor = planColor;

      if (selectedApproachVia === null) {
        selectedViasCell = 'NONE';
        selectedViasCellColor = planColor;
      } else if (selectedApproachVia) {
        selectedViasCell = selectedApproachVia.ident;
        selectedViasCellColor = planColor;
      }
    }

    let selectedStarCell = '------';
    let selectedStarCellColor = 'white';

    const selectedArrival = targetPlan.arrival;
    const availableArrivals = targetPlan.availableArrivals;

    if (selectedArrival) {
      selectedStarCell = selectedArrival.ident;
      selectedStarCellColor = planColor;
    } else if (selectedArrival === null || availableArrivals.length === 0) {
      selectedStarCell = 'NONE';
      selectedStarCellColor = planColor;
    }

    const rows = [[''], [''], [''], [''], [''], [''], [''], ['']];

    const vias = CDUAvailableArrivalsPage.getVias(mcdu, forPlan, inAlternate);
    vias.unshift({
      ident: Labels.NO_VIA,
      databaseId: null,
      isOtherVia: false,
    });

    const firstOtherViaIndex = vias.findIndex((v) => v.isOtherVia);

    for (let i = 0; i < ArrivalPagination.VIA_PAGE; i++) {
      const index = i + pageCurrent * ArrivalPagination.VIA_PAGE;

      const via = vias[index];
      if (via) {
        const isFirstAvailableVia = i === 0 && !via.isOtherVia;
        const isFirstOtherVia = index === firstOtherViaIndex || (i === 0 && via.isOtherVia);
        const isSelected =
          (via.databaseId === null && selectedApproachVia === null) ||
          via.databaseId === selectedApproachVia?.databaseId;
        const color = isSelected && !isTemporary ? 'green' : 'cyan';

        if (isFirstAvailableVia) {
          rows[2 * i][0] = 'APPR VIAS AVAILABLE';
        } else if (isFirstOtherVia) {
          rows[2 * i][0] = '----OTHER APPR VIAS-----';
        }
        rows[2 * i + 1][0] = `{${color}}${!isSelected ? '{' : '{sp}'}${via.ident}{end}`;

        mcdu.onLeftInput[i + 1] = async (_, scratchpadCallback) => {
          // Clicking the already selected via is not allowed
          if (!isSelected) {
            try {
              await mcdu.flightPlanService.setApproachVia(via.databaseId, forPlan, inAlternate);

              CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
            } catch (e) {
              console.error(e);
              mcdu.logTroubleshootingError(e);
              mcdu.setScratchpadMessage(NXFictionalMessages.internalError);

              mcdu.eraseTemporaryFlightPlan(() => {
                CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, false, forPlan, inAlternate);
              });
            }
          } else {
            mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);

            scratchpadCallback();
          }
        };
      }
    }

    // <RETURN
    mcdu.onLeftInput[5] = () => {
      CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
    };

    const titleCell =
      forPlan >= FlightPlanIndex.FirstSecondary ? 'SEC APPROACH VIAS\xa0\xa0\xa0\xa0\xa0\xa0\xa0' : 'APPROACH VIAS\xa0';

    mcdu.setTemplate([
      [titleCell],
      ['{sp}APPR', 'STAR{sp}', '{sp}VIA'],
      [
        `{${selectedApproachCellColor}}${selectedApproachCell.padEnd(10)}{end}{${selectedViasCellColor}}${selectedViasCell}{end}`,
        selectedStarCell + '[color]' + selectedStarCellColor,
      ],
      rows[0],
      rows[1],
      rows[2],
      rows[3],
      rows[4],
      rows[5],
      rows[6],
      rows[7],
      rows[8],
      ['<RETURN'],
    ]);

    let up = false;
    let down = false;

    if (pageCurrent < Math.ceil(vias.length / ArrivalPagination.VIA_PAGE) - 1) {
      mcdu.onUp = () => {
        pageCurrent++;
        if (pageCurrent < 0) {
          pageCurrent = 0;
        }
        CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, pageCurrent, forPlan, inAlternate);
      };
      up = true;
    }
    if (pageCurrent > 0) {
      mcdu.onDown = () => {
        pageCurrent--;
        if (pageCurrent < 0) {
          pageCurrent = 0;
        }
        CDUAvailableArrivalsPage.ShowViasPage(mcdu, airport, pageCurrent, forPlan, inAlternate);
      };
      down = true;
    }
    mcdu.setArrows(up, down, true, true);
    mcdu.onPrevPage = () => {
      CDUAvailableArrivalsPage.ShowPage(mcdu, airport, 0, true, forPlan, inAlternate);
    };
    mcdu.onNextPage = mcdu.onPrevPage;
  }

  /**
   * Gets the list of vias for the currently approach, and whether they are compatible with the selected STAR ("other" via if not).
   * @param mcdu The FMS.
   * @param forPlan The plan index to operate on.
   * @param inAlternate Whether to operate on the alternate plan.
   * @returns The list of vias.
   */
  private static getVias(
    mcdu: LegacyFmsPageInterface,
    forPlan = FlightPlanIndex.Active,
    inAlternate = false,
  ): { ident: string; databaseId: string | null; isOtherVia: boolean }[] {
    const targetPlan = inAlternate ? mcdu.getAlternateFlightPlan(forPlan) : mcdu.getFlightPlan(forPlan);

    const starFixes = [];
    if (targetPlan.arrivalEnrouteTransition?.legs.length > 0) {
      for (const leg of targetPlan.arrivalEnrouteTransition.legs) {
        if (leg.waypoint) {
          starFixes.push(leg.waypoint.databaseId);
        }
      }
    }
    if (targetPlan.arrival?.commonLegs.length > 0) {
      for (const leg of targetPlan.arrival.commonLegs) {
        if (leg.waypoint) {
          starFixes.push(leg.waypoint.databaseId);
        }
      }
    }
    if (targetPlan.arrivalRunwayTransition?.legs.length > 0) {
      for (const leg of targetPlan.arrivalRunwayTransition.legs) {
        if (leg.waypoint) {
          starFixes.push(leg.waypoint.databaseId);
        }
      }
    }

    const shouldFilterVias = starFixes.length > 0;
    const vias: { ident: string; databaseId: string | null; isOtherVia: boolean }[] =
      targetPlan.availableApproachVias.map((t) => ({
        ident: t.ident,
        databaseId: t.databaseId,
        isOtherVia: shouldFilterVias && !starFixes.find((id) => t.legs[0].waypoint?.databaseId === id),
      }));

    if (shouldFilterVias) {
      vias.sort((a, b) => (a.isOtherVia && !b.isOtherVia ? 1 : !a.isOtherVia && b.isOtherVia ? -1 : 0));
    }

    return vias;
  }

  /**
   * Automatically selects the approach via if there is exactly one for the selected arrival and approach.
   * @param mcdu The FMS.
   * @param forPlan The plan index to operate on.
   * @param inAlternate Whether to operate on the alternate plan.
   * @returns Whether a via was automatically selected.
   */
  private static async tryAutoSetApproachVia(
    mcdu: LegacyFmsPageInterface,
    forPlan = FlightPlanIndex.Active,
    inAlternate = false,
  ): Promise<boolean> {
    const targetPlan = inAlternate ? mcdu.getAlternateFlightPlan(forPlan) : mcdu.getFlightPlan(forPlan);
    if (targetPlan.approach !== undefined && targetPlan.arrival !== undefined) {
      const availableVias = CDUAvailableArrivalsPage.getVias(mcdu, forPlan, inAlternate).filter(
        (v) => v.isOtherVia === false,
      );
      if (availableVias.length === 1) {
        await mcdu.flightPlanService.setApproachVia(availableVias[0].databaseId, forPlan, inAlternate);
        return true;
      }
    }
    return false;
  }
}
