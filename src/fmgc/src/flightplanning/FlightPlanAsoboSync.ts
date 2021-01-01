/* eslint-disable no-underscore-dangle */
/* eslint-disable require-yield */
/*
 * MIT License
 *
 * Copyright (c) 2020-2021 Working Title, FlyByWire Simulations
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { FlightPlanManager } from './FlightPlanManager';

/** A class for syncing a flight plan with the game */
export class FlightPlanAsoboSync {
  static fpChecksum = 0;

  static fpListenerInitialized = false;

  public static init() {
      if (!this.fpListenerInitialized) {
          RegisterViewListener('JS_LISTENER_FLIGHTPLAN');
          this.fpListenerInitialized = true;
      }
  }

  public static async LoadFromGame(fpln: FlightPlanManager): Promise<void> {
      return new Promise((resolve) => {
          this.init();
          setTimeout(() => {
              Coherent.call('LOAD_CURRENT_GAME_FLIGHT').catch(console.error);
              Coherent.call('LOAD_CURRENT_ATC_FLIGHTPLAN').catch(console.error);
              setTimeout(() => {
                  Coherent.call('GET_FLIGHTPLAN').then(async (data: Record<string, any>) => {
                      console.log('COHERENT GET_FLIGHTPLAN received');
                      const { isDirectTo } = data;

                      // TODO: talk to matt about dirto
                      if (!isDirectTo) {
                          // TODO FIXME: better handling of mid-air spawning and syncing fpln
                          if (data.waypoints.length === 0 || data.waypoints[0].icao[0] !== 'A') {
                              fpln.resumeSync();
                              resolve();
                              return;
                          }

                          await fpln._parentInstrument.facilityLoader.getFacilityRaw(data.waypoints[0].icao, 10000).catch((e) => {
                              console.error('[FP LOAD] Error getting first wp data');
                              console.error(e);
                          });

                          // set origin
                          await fpln.setOrigin(data.waypoints[0].icao).catch((e) => {
                              console.error('[FP LOAD] Error setting origin');
                              console.error(e);
                          });

                          // set dest
                          await fpln.setDestination(data.waypoints[data.waypoints.length - 1].icao).catch((e) => {
                              console.error('[FP LOAD] Error setting Destination');
                              console.error(e);
                          });

                          // set route

                          const enrouteStart = (data.departureWaypointsSize === -1) ? 1 : data.departureWaypointsSize;
                          // Find out first approach waypoint, - 1 to skip destination
                          const enrouteEnd = data.waypoints.length - ((data.arrivalWaypointsSize === -1) ? 1 : data.arrivalWaypointsSize) - 1;
                          const enroute = data.waypoints.slice(enrouteStart, enrouteEnd - 1);
                          for (let i = 0; i < enroute.length - 1; i++) {
                              const wpt = enroute[i];
                              if (wpt.icao.trim() !== '') {
                                  fpln.addWaypoint(wpt.icao, Infinity, () => console.log(`[FP LOAD] Adding [${wpt.icao}]... SUCCESS`)).catch(console.error);
                              }
                          }

                          // set departure
                          //  rwy index
                          await fpln.setOriginRunwayIndex(data.originRunwayIndex)
                              // .then(() => console.log(`[FP LOAD] Setting Origin  ${data.originRunwayIndex} ... SUCCESS`))
                              .catch((e) => {
                                  console.error(`[FP LOAD] Setting Origin ${data.originRunwayIndex} ... FAILED`);
                                  console.error(e);
                              });
                          await fpln.setDepartureRunwayIndex(data.departureRunwayIndex)
                              // .then(() => console.log(`[FP LOAD] Setting Departure Runway ${data.departureRunwayIndex} ... SUCCESS`))
                              .catch((e) => {
                                  console.error(`[FP LOAD] Setting Departure Runway ${data.departureRunwayIndex} ... FAILED`);
                                  console.error(e);
                              });
                          //  proc index
                          await fpln.setDepartureProcIndex(data.departureProcIndex)
                              // .then(() => console.log(`[FP LOAD] Setting Departure Procedure  ${data.departureProcIndex} ... SUCCESS`))
                              .catch((e) => {
                                  console.error(`[FP LOAD] Setting Departure Procedure ${data.departureProcIndex} ... FAILED`);
                                  console.error(e);
                              });
                          //  enroutetrans index
                          await fpln.setDepartureEnRouteTransitionIndex(data.departureEnRouteTransitionIndex)
                              // .then(() => console.log(`[FP LOAD] Setting Departure En Route Transition ${data.departureEnRouteTransitionIndex} ... SUCCESS`))
                              .catch((e) => {
                                  console.error(`[FP LOAD] Setting Departure En Route Transition ${data.departureEnRouteTransitionIndex} ... FAILED`);
                                  console.error(e);
                              });
                          // set arrival
                          //  arrivalproc index
                          await fpln.setArrivalProcIndex(data.arrivalProcIndex)
                              // .then(() => console.log(`[FP LOAD] Setting Arrival Procedure ${data.arrivalProcIndex} ... SUCCESS`))
                              .catch((e) => {
                                  console.error(`[FP LOAD] Setting Arrival Procedure ${data.arrivalProcIndex} ... FAILED`);
                                  console.error(e);
                              });
                          //  arrivaltrans index
                          await fpln.setArrivalEnRouteTransitionIndex(data.arrivalEnRouteTransitionIndex)
                              // .then(() => console.log(`[FP LOAD] Setting En Route Transition ${data.arrivalEnRouteTransitionIndex} ... SUCCESS`))
                              .catch((e) => {
                                  console.error(`[FP LOAD] Setting En Route Transition ${data.arrivalEnRouteTransitionIndex} ... FAILED`);
                                  console.error(e);
                              });
                          // set approach
                          //  rwy index
                          /*
                           * FIXME this is obviously bogus...
                           * should be an index into the destination airport runway array...
                           * but arrivalRunwayIndex is an index into the STAR runwayTransitions array
                           */
                          /*await fpln.setDestinationRunwayIndex(data.arrivalRunwayIndex)
                              // .then(() => console.log(`[FP LOAD] Setting Destination Runway ${data.arrivalRunwayIndex} ... SUCCESS`))
                              .catch((e) => {
                                  console.error(`[FP LOAD] Setting Destination Runway ${data.arrivalRunwayIndex} ... FAILED`);
                                  console.error(e);
                              });*/
                          await fpln.setArrivalRunwayIndex(data.arrivalRunwayIndex)
                              // .then(() => console.log(`[FP LOAD] Setting Arrival Runway ${data.arrivalRunwayIndex} ... SUCCESS`))
                              .catch((e) => {
                                  console.error(`[FP LOAD] Setting Arrival Runway ${data.arrivalRunwayIndex} ... FAILED`);
                                  console.error(e);
                              });
                          //  approach index
                          await fpln.setApproachIndex(data.approachIndex)
                              .catch((e) => {
                                  console.error(`[FP LOAD] Setting Approach ${data.approachIndex} ... FAILED`);
                                  console.error(e);
                              });
                          // .then(() => console.log(`[FP LOAD] Setting Approach ${data.approachIndex} ... SUCCESS`));
                          //  approachtrans index
                          await fpln.setApproachTransitionIndex(data.approachTransitionIndex)
                              .catch((e) => {
                                  console.error(`[FP LOAD] Setting Approach Transition ${data.approachTransitionIndex} ... FAILED`);
                                  console.error(e);
                              });
                          // .then(() => console.log(`[FP LOAD] Setting Approach Transition ${data.approachTransitionIndex} ... SUCCESS`));

                          fpln.resumeSync();

                          this.fpChecksum = fpln.getCurrentFlightPlan().checksum;
                          // Potential CTD source?
                          Coherent.call('SET_ACTIVE_WAYPOINT_INDEX', 0)
                              .catch((e) => console.error('[FP LOAD] Error when setting Active WP'));
                          Coherent.call('RECOMPUTE_ACTIVE_WAYPOINT_INDEX')
                              .catch((e) => console.error('[FP LOAD] Error when recomputing Active WP'));
                          resolve();
                      }
                  }).catch(console.error);
              }, 500);
          }, 200);
      });
  }

  public static async SaveToGame(fpln) {
      return __awaiter(this, 0, 0, function* () {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          return new Promise((resolve, reject) => __awaiter(this, 0, 0, function* () {
              FlightPlanAsoboSync.init();
              const plan = fpln.getCurrentFlightPlan();
              if ((plan.checksum !== this.fpChecksum)) {
                  // await Coherent.call("CREATE_NEW_FLIGHTPLAN").catch(console.error);
                  yield Coherent.call('SET_CURRENT_FLIGHTPLAN_INDEX', 0).catch(console.error);
                  yield Coherent.call('CLEAR_CURRENT_FLIGHT_PLAN').catch(console.error);
                  if (plan.hasPersistentOrigin && plan.hasDestination) {
                      yield Coherent.call('SET_ORIGIN', plan.persistentOriginAirfield.icao, false).catch(console.error);
                      // .then(() => console.log('[FP SAVE] Setting Origin Airfield... SUCCESS'));
                      yield Coherent.call('SET_DESTINATION', plan.destinationAirfield.icao, false).catch(console.error);
                      // .then(() => console.log('[FP SAVE] Setting Destination Airfield... SUCCESS'));
                      let coIndex = 1;
                      for (let i = 0; i < plan.enroute.waypoints.length; i++) {
                          const wpt = plan.enroute.waypoints[i];
                          if (wpt.icao.trim() !== '') {
                              yield Coherent.call('ADD_WAYPOINT', wpt.icao, coIndex, false).catch(console.error);
                              // .then(() => console.log(`[FP SAVE] Adding Waypoint [${wpt.icao}]... SUCCESS`));
                              coIndex++;
                          }
                      }
                      yield Coherent.call('SET_ORIGIN_RUNWAY_INDEX', plan.procedureDetails.originRunwayIndex)
                          // .then(() => console.log(`[FP SAVE] Setting Origin Runway ${plan.procedureDetails.originRunwayIndex} ... SUCCESS`))
                          .catch((e) => {
                              console.error(`[FP SAVE] Setting Origin Runway ${plan.procedureDetails.originRunwayIndex} ... FAILED`);
                              console.error(e);
                          });
                      yield Coherent.call('SET_DEPARTURE_RUNWAY_INDEX', plan.procedureDetails.departureRunwayIndex)
                          // .then(() => console.log(`[FP SAVE] Setting Departure Runway ${plan.procedureDetails.departureRunwayIndex} ... SUCCESS`))
                          .catch((e) => {
                              console.error(`[FP SAVE] Setting Departure Runway ${plan.procedureDetails.departureRunwayIndex} ... FAILED`);
                              console.error(e);
                          });
                      yield Coherent.call('SET_DEPARTURE_PROC_INDEX', plan.procedureDetails.departureIndex)
                          // .then(() => console.log(`[FP SAVE] Setting Departure Procedure ${plan.procedureDetails.departureIndex} ... SUCCESS`))
                          .catch((e) => {
                              console.error(`[FP SAVE] Setting Departure Procedure ${plan.procedureDetails.departureIndex} ... FAILED`);
                              console.error(e);
                          });
                      yield Coherent.call('SET_DEPARTURE_ENROUTE_TRANSITION_INDEX', plan.procedureDetails.departureTransitionIndex)
                          // .then(() => console.log(`[FP SAVE] Setting Departure Transition ${plan.procedureDetails.departureTransitionIndex} ... SUCCESS`))
                          .catch((e) => {
                              console.error(`[FP SAVE] Setting Departure Transition ${plan.procedureDetails.departureTransitionIndex} ... FAILED`);
                              console.error(e);
                          });
                      yield Coherent.call('SET_ARRIVAL_RUNWAY_INDEX', plan.procedureDetails.arrivalRunwayIndex)
                          // .then(() => console.log(`[FP SAVE] Setting Arrival Runway ${plan.procedureDetails.arrivalRunwayIndex} ... SUCCESS`))
                          .catch((e) => {
                              console.error(`[FP SAVE] Setting  Arrival Runway ${plan.procedureDetails.arrivalRunwayIndex} ... FAILED`);
                              console.error(e);
                          });
                      yield Coherent.call('SET_ARRIVAL_PROC_INDEX', plan.procedureDetails.arrivalIndex)
                          // .then(() => console.log(`[FP SAVE] Setting Arrival Procedure ${plan.procedureDetails.arrivalIndex} ... SUCCESS`))
                          .catch((e) => {
                              console.error(`[FP SAVE] Setting Arrival Procedure ${plan.procedureDetails.arrivalIndex} ... FAILED`);
                              console.error(e);
                          });
                      yield Coherent.call('SET_ARRIVAL_ENROUTE_TRANSITION_INDEX', plan.procedureDetails.arrivalTransitionIndex)
                          // .then(() => console.log(`[FP SAVE] Setting Arrival En Route Transition ${plan.procedureDetails.arrivalTransitionIndex} ... SUCCESS`))
                          .catch((e) => {
                              console.error(`[FP SAVE] Setting Arrival En Route Transition ${plan.procedureDetails.arrivalTransitionIndex} ... FAILED`);
                              console.error(e);
                          });
                      yield Coherent.call('SET_APPROACH_INDEX', plan.procedureDetails.approachIndex)
                          .then(() => {
                              // console.log(`[FP SAVE] Setting Approach ${plan.procedureDetails.approachIndex} ... SUCCESS`);
                              Coherent.call('SET_APPROACH_TRANSITION_INDEX', plan.procedureDetails.approachTransitionIndex)
                                  // .then(() => console.log(`[FP SAVE] Setting Approach Transition ${plan.procedureDetails.approachTransitionIndex} ... SUCCESS`))
                                  .catch((e) => {
                                      console.error(`[FP SAVE] Setting Approach Transition ${plan.procedureDetails.approachTransitionIndex} ... FAILED`);
                                      console.error(e);
                                  });
                          })
                          .catch((e) => {
                              console.error(`[FP SAVE] Setting Approach ${plan.procedureDetails.approachIndex} ... FAILED`);
                              console.error(e);
                          });
                  }
                  this.fpChecksum = plan.checksum;
              }
              Coherent.call('RECOMPUTE_ACTIVE_WAYPOINT_INDEX')
                  .catch((e) => console.log('[FP SAVE] Setting Active Waypoint... FAILED'))
                  .then(() => console.log('[FP SAVE] Setting Active Waypoint... SUCCESS'));
          }));
      });
  }
}

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) {
        return value instanceof P ? value : new P((resolve) => {
            resolve(value);
        });
    }
    return new (P || (P = Promise))((resolve, reject) => {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator.throw(value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            // eslint-disable-next-line no-unused-expressions
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}
