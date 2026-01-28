// @ts-strict-ignore
// Copyright (c) 2021-2023, 2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { CDUFlightPlanPage } from './A320_Neo_CDU_FlightPlanPage';
import { CDULateralRevisionPage } from './A320_Neo_CDU_LateralRevisionPage';
import { NXSystemMessages } from '../messages/NXSystemMessages';
import { WaypointArea } from '@flybywiresim/fbw-sdk';
import { LegacyFmsPageInterface } from '../legacy/LegacyFmsPageInterface';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

const TurnDirection = Object.freeze({
  Unknown: 'U',
  Left: 'L',
  Right: 'R',
  Either: 'E',
});

const HoldType = Object.freeze({
  Computed: 0,
  Database: 1,
  Modified: 2,
});

export class CDUHoldAtPage {
  static ShowPage(mcdu: LegacyFmsPageInterface, waypointIndexFP, forPlan, inAlternate) {
    const targetPlan = inAlternate ? mcdu.getAlternateFlightPlan(forPlan) : mcdu.getFlightPlan(forPlan);
    const waypoint = targetPlan.legElementAt(waypointIndexFP);

    if (!waypoint) {
      return CDUFlightPlanPage.ShowPage(mcdu);
    }

    const editingHm = waypoint.type === 'HM'; // HM

    if (editingHm) {
      CDUHoldAtPage.DrawPage(mcdu, waypointIndexFP, waypointIndexFP, forPlan, inAlternate);
    } else {
      const editingHx = waypoint.isHX();
      const alt = waypoint.definition.altitude1
        ? waypoint.definition.altitude1
        : SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');

      let defaultHold;
      let modifiedHold;
      if (editingHx) {
        defaultHold = waypoint.defaultHold;
        modifiedHold = waypoint.modifiedHold;
      } else {
        const previousLeg = targetPlan.maybeElementAt(waypointIndexFP - 1);

        let inboundMagneticCourse = 100;
        if (previousLeg && previousLeg.isDiscontinuity === false && previousLeg.isXF()) {
          inboundMagneticCourse = Avionics.Utils.computeGreatCircleHeading(
            previousLeg.terminationWaypoint().location,
            waypoint.terminationWaypoint().location,
          );
        }

        defaultHold = {
          inboundMagneticCourse,
          turnDirection: TurnDirection.Right,
          time: alt <= 14000 ? 1 : 1.5,
          type: HoldType.Computed,
        };
        modifiedHold = {};

        const fix = waypoint.terminationWaypoint();
        const promises = [];
        // Due to the way MSFS stores holds, we have to try all these possibilities.
        if (targetPlan.originAirport) {
          promises.push(NavigationDatabaseService.activeDatabase.getHolds(fix.ident, targetPlan.originAirport.ident));
        }
        if (targetPlan.destinationAirport) {
          promises.push(
            NavigationDatabaseService.activeDatabase.getHolds(fix.ident, targetPlan.destinationAirport.ident),
          );
        }
        if (fix && fix.area === WaypointArea.Terminal && 'airportIdent' in fix && fix.airportIdent.length > 0) {
          promises.push(NavigationDatabaseService.activeDatabase.getHolds(fix.ident, fix.airportIdent));
        }
        Promise.all(promises)
          .then((resolvedPromises) => {
            // Pick a hold based on altitude suitability and inbound course
            // Missing in the navdata is the duplicate indicator that would help us pick the right area/airspace type.
            const holds = resolvedPromises
              .reduce((allHolds, holds) => {
                allHolds.push(...holds);
                return allHolds;
              })
              .filter((v) => v.waypoint.databaseId === fix.databaseId)
              .sort((a, b) => {
                let ret =
                  CDUHoldAtPage.holdVerticalDistanceFromAlt(alt, a) - CDUHoldAtPage.holdVerticalDistanceFromAlt(alt, b);
                if (ret === 0) {
                  ret =
                    Math.abs(a.magneticCourse - inboundMagneticCourse) -
                    Math.abs(b.magneticCourse - inboundMagneticCourse);
                }
                return ret;
              });

            if (holds[0]) {
              defaultHold = {
                inboundMagneticCourse: holds[0].magneticCourse,
                turnDirection: holds[0].turnDirection,
                time: holds[0].lengthTime ? holds[0].lengthTime : undefined,
                distance: holds[0].length ? holds[0].length : undefined,
                type: HoldType.Database,
              };
            }

            CDUHoldAtPage.addOrEditManualHold(
              mcdu,
              waypointIndexFP,
              // eslint-disable-next-line prefer-object-spread
              Object.assign({}, defaultHold),
              modifiedHold,
              defaultHold,
              forPlan,
              inAlternate,
            );
          })
          .catch(() => {
            CDUHoldAtPage.addOrEditManualHold(
              mcdu,
              waypointIndexFP,
              // eslint-disable-next-line prefer-object-spread
              Object.assign({}, defaultHold),
              modifiedHold,
              defaultHold,
              forPlan,
              inAlternate,
            );
          });
        return;
      }

      CDUHoldAtPage.addOrEditManualHold(
        mcdu,
        waypointIndexFP,
        // eslint-disable-next-line prefer-object-spread
        Object.assign({}, defaultHold),
        modifiedHold,
        defaultHold,
        forPlan,
        inAlternate,
      );
    }
  }

  static holdVerticalDistanceFromAlt(altitude, hold) {
    switch (hold.altitudeDescriptor) {
      case 'B':
        if (altitude <= hold.altitude1 && altitude >= hold.altitude2) {
          return 0;
        }
        if (altitude > hold.altitude1) {
          return altitude - hold.altitude1;
        }
        return hold.altitude2 - altitude;
      case '+':
        return Math.max(0, hold.altitude1 - altitude);
      case '-':
        return Math.max(0, altitude - hold.altitude1);
      default:
        // no restriction, so always suitable
        return 0;
    }
  }

  static addOrEditManualHold(
    mcdu: LegacyFmsPageInterface,
    atIndex,
    desiredHold,
    modifiedHold,
    defaultHold,
    planIndex,
    alternate,
  ) {
    mcdu.flightPlanService
      .addOrEditManualHold(atIndex, desiredHold, modifiedHold, defaultHold, planIndex, alternate)
      .then((holdIndex) => {
        CDUHoldAtPage.DrawPage(mcdu, holdIndex, atIndex, planIndex, alternate);
      });
  }

  static DrawPage(mcdu: LegacyFmsPageInterface, waypointIndexFP, originalFpIndex, forPlan, inAlternate) {
    mcdu.clearDisplay();
    mcdu.page.Current = mcdu.page.HoldAtPage;

    const tmpy = forPlan === FlightPlanIndex.Active && mcdu.flightPlanService.hasTemporary;
    const targetPlan = inAlternate ? mcdu.getAlternateFlightPlan(forPlan) : mcdu.getFlightPlan(forPlan);

    const leg = targetPlan.legElementAt(waypointIndexFP);

    const speed = waypointIndexFP === mcdu.holdIndex && mcdu.holdSpeedTarget > 0 ? mcdu.holdSpeedTarget : 180;

    const modifiedHold = leg.modifiedHold;
    const defaultHold = leg.defaultHold;
    const currentHold = CDUHoldAtPage.computeDesiredHold(leg);

    // TODO this doesn't account for wind... we really need to access the actual hold leg once the ts/js barrier is broken
    const displayTime = currentHold.time === undefined ? (currentHold.distance * 60) / speed : currentHold.time;
    const displayDistance = currentHold.distance === undefined ? (speed * currentHold.time) / 60 : currentHold.distance;

    const defaultType = defaultHold.type === HoldType.Database ? 'DATABASE' : 'COMPUTED';
    const defaultTitle = `${defaultType}\xa0`;
    const defaultRevert = `${defaultType}}`;

    const ident = leg.ident.replace('T-P', 'PPOS').padEnd(7, '\xa0');
    const rows = [];
    rows.push([
      `${currentHold.type !== HoldType.Modified ? defaultTitle : ''}HOLD\xa0{small}AT{end}\xa0{green}${ident}{end}`,
    ]);
    rows.push(['INB CRS', '', '']);
    rows.push([
      `{${tmpy ? 'yellow' : 'cyan'}}${modifiedHold && modifiedHold.inboundMagneticCourse !== undefined ? '{big}' : '{small}'}${currentHold.inboundMagneticCourse.toFixed(0).padStart(3, '0')}°{end}{end}`,
    ]);
    rows.push(['TURN', currentHold.type === HoldType.Modified ? 'REVERT TO' : '']);
    rows.push([
      `{${tmpy ? 'yellow' : 'cyan'}}${modifiedHold && modifiedHold.turnDirection !== undefined ? '{big}' : '{small}'}${currentHold.turnDirection === TurnDirection.Left ? 'L' : 'R'}{end}`,
      `{cyan}${currentHold.type === HoldType.Modified ? defaultRevert : ''}{end}`,
    ]);
    rows.push(['TIME/DIST']);
    rows.push([
      `{${tmpy ? 'yellow' : 'cyan'}}${modifiedHold && modifiedHold.time !== undefined ? '{big}' : '{small}'}${displayTime.toFixed(1).padStart(4, '\xa0')}{end}/${modifiedHold && modifiedHold.distance !== undefined ? '{big}' : '{small}'}${displayDistance.toFixed(1)}{end}{end}`,
    ]);
    rows.push(['', '', '\xa0LAST EXIT']);
    rows.push(['', '', '{small}UTC\xa0\xa0\xa0FUEL{end}']);
    rows.push(['', '', '----\xa0\xa0----']);
    rows.push(['']);
    rows.push(['']);
    rows.push([tmpy ? '{amber}{ERASE{end}' : '{RETURN', tmpy ? '{amber}INSERT*{end}' : '', '']);

    mcdu.setTemplate([...rows]);

    // TODO what happens if CLR attemped?
    // change course
    mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
      if (value.match(/^[0-9]{1,3}$/) === null) {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
        return;
      }
      const magCourse = parseInt(value);
      if (magCourse > 360) {
        mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
        scratchpadCallback();
        return;
      }

      CDUHoldAtPage.modifyHold(
        mcdu,
        waypointIndexFP,
        leg,
        'inboundMagneticCourse',
        magCourse,
        forPlan,
        inAlternate,
      ).then(() => {
        CDUHoldAtPage.DrawPage(mcdu, waypointIndexFP, originalFpIndex, forPlan, inAlternate);
      });
    };

    // change turn direction
    mcdu.onLeftInput[1] = async (value, scratchpadCallback) => {
      if (value !== 'L' && value !== 'R') {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
        return;
      }

      await CDUHoldAtPage.modifyHold(
        mcdu,
        waypointIndexFP,
        leg,
        'turnDirection',
        value === 'L' ? TurnDirection.Left : TurnDirection.Right,
        forPlan,
        inAlternate,
      );

      CDUHoldAtPage.DrawPage(mcdu, waypointIndexFP, originalFpIndex, forPlan, inAlternate);
    };

    // change time or distance
    mcdu.onLeftInput[2] = (value, scratchpadCallback) => {
      const m = value.match(/^(([0-9]{0,1}(\.[0-9])?)\/?|\/([0-9]{0,2}(\.[0-9])?))$/);
      if (m === null || m[0].length === 0 || m[0] === '/') {
        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
        scratchpadCallback();
        return;
      }

      const time = m[2];
      const dist = m[4];

      const param = dist ? 'distance' : 'time';
      const newValue = dist ? parseFloat(dist) : parseFloat(time);

      CDUHoldAtPage.modifyHold(mcdu, waypointIndexFP, leg, param, newValue, forPlan, inAlternate).then(() => {
        CDUHoldAtPage.DrawPage(mcdu, waypointIndexFP, originalFpIndex, forPlan, inAlternate);
      });
    };

    // revert to computed/database
    if (currentHold.type === HoldType.Modified) {
      mcdu.onRightInput[1] = async () => {
        mcdu.flightPlanService.revertHoldToComputed(waypointIndexFP);

        CDUHoldAtPage.DrawPage(mcdu, waypointIndexFP, originalFpIndex, forPlan, inAlternate);
      };
    }

    // erase/return
    mcdu.onLeftInput[5] = () => {
      if (tmpy) {
        mcdu.eraseTemporaryFlightPlan(() => {
          CDULateralRevisionPage.ShowPage(
            mcdu,
            targetPlan.maybeElementAt(originalFpIndex),
            originalFpIndex,
            forPlan,
            inAlternate,
          );
        });
      } else {
        CDULateralRevisionPage.ShowPage(
          mcdu,
          targetPlan.maybeElementAt(originalFpIndex),
          originalFpIndex,
          forPlan,
          inAlternate,
        );
      }
    };

    // insert
    mcdu.onRightInput[5] = () => {
      if (tmpy) {
        mcdu.insertTemporaryFlightPlan(() => {
          CDUFlightPlanPage.ShowPage(mcdu, waypointIndexFP, false, forPlan);
        });
      }
    };
  }

  static computeDesiredHold(/** @type {FlightPlanLeg} */ leg) {
    const modifiedHold = leg.modifiedHold;
    const defaultHold = leg.defaultHold;

    const pilotTimeOrDistance =
      modifiedHold && (modifiedHold.time !== undefined || modifiedHold.distance !== undefined);

    return {
      inboundMagneticCourse:
        modifiedHold && modifiedHold.inboundMagneticCourse !== undefined
          ? modifiedHold.inboundMagneticCourse
          : defaultHold.inboundMagneticCourse,
      turnDirection:
        modifiedHold && modifiedHold.turnDirection !== undefined
          ? modifiedHold.turnDirection
          : defaultHold.turnDirection,
      distance: pilotTimeOrDistance ? modifiedHold.distance : defaultHold.distance,
      time: pilotTimeOrDistance ? modifiedHold.time : defaultHold.time,
      type: modifiedHold !== undefined ? modifiedHold.type : defaultHold.type,
    };
  }

  static async modifyHold(
    mcdu: LegacyFmsPageInterface,
    waypointIndexFP,
    /** @type {FlightPlanLeg} */ waypointData,
    param,
    value,
    forPlan,
    inAlternate,
  ) {
    if (waypointData.modifiedHold === undefined) {
      waypointData.modifiedHold = {};
    }

    waypointData.modifiedHold.type = HoldType.Modified;

    if (param === 'time') {
      waypointData.modifiedHold.distance = undefined;
    } else if (param === 'distance') {
      waypointData.modifiedHold.time = undefined;
    }

    waypointData.modifiedHold[param] = value;

    await mcdu.flightPlanService.addOrEditManualHold(
      waypointIndexFP,
      CDUHoldAtPage.computeDesiredHold(waypointData),
      waypointData.modifiedHold,
      waypointData.defaultHold,
      forPlan,
      inAlternate,
    );
  }
}
