// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, EventBus, Instrument, MappedSubject, Subject } from '@microsoft/msfs-sdk';
import { Arinc429LocalVarConsumerSubject, BtvData, FmsOansData } from '@flybywiresim/fbw-sdk';
import { pointDistance } from '@flybywiresim/oanc';
import { Arinc429Register, Arinc429SignStatusMatrix, MathUtils } from '@flybywiresim/fbw-sdk';

const MIN_TOUCHDOWN_ZONE_DISTANCE = 400; // Minimum distance from threshold to touch down zone

/**
 * Utility class for brake to vacate (BTV) functions on the A380
 */

export class BrakeToVacateDistanceUpdater implements Instrument {
  private readonly sub = this.bus.getSubscriber<BtvData & FmsOansData>();

  private readonly airportLocalPos = ConsumerSubject.create(this.sub.on('oansAirportLocalCoordinates'), []);

  private readonly remainingDistToExitArinc = Arinc429Register.empty();

  private readonly remaininingDistToRwyEndArinc = Arinc429Register.empty();

  private readonly requestedStoppingDistArinc = Arinc429Register.empty();

  constructor(private readonly bus: EventBus) {
    this.remainingDistToExit.sub((v) => {
      this.remainingDistToExitArinc.setValue(v < 0 ? 0 : v);
      this.remainingDistToExitArinc.setSsm(
        v < 0 ? Arinc429SignStatusMatrix.NoComputedData : Arinc429SignStatusMatrix.NormalOperation,
      );
      this.remainingDistToExitArinc.writeToSimVar('L:A32NX_OANS_BTV_REMAINING_DIST_TO_EXIT');
    });

    this.remaininingDistToRwyEnd.sub((v) => {
      this.remaininingDistToRwyEndArinc.setValue(v < 0 ? 0 : v);
      this.remaininingDistToRwyEndArinc.setSsm(
        v < 0 ? Arinc429SignStatusMatrix.NoComputedData : Arinc429SignStatusMatrix.NormalOperation,
      );
      this.remaininingDistToRwyEndArinc.writeToSimVar('L:A32NX_OANS_BTV_REMAINING_DIST_TO_RWY_END');
    });

    this.thresholdPositions.sub((tPos) => {
      if (tPos.length > 0) {
        const lda = pointDistance(tPos[0][0], tPos[0][1], tPos[1][0], tPos[1][1]);
        this.remaininingDistToRwyEnd.set(lda - MIN_TOUCHDOWN_ZONE_DISTANCE);
        this.remainingDistToExit.set(lda - MIN_TOUCHDOWN_ZONE_DISTANCE);
      }
    }, true);

    this.exitPosition.sub((ePos) => {
      const tPos = this.thresholdPositions.get()[0];
      if (tPos && ePos) {
        const exitDistance = pointDistance(tPos[0], tPos[1], ePos[0], ePos[1]) - MIN_TOUCHDOWN_ZONE_DISTANCE;
        this.requestedStoppingDistArinc.setValue(exitDistance);
        this.requestedStoppingDistArinc.setSsm(Arinc429SignStatusMatrix.NormalOperation);
        this.requestedStoppingDistArinc.writeToSimVar('L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE');
      }
    }, true);
  }

  init() {
    this.clearSelection();
  }

  /** Updated during deceleration on the ground. Counted from touchdown distance (min. 400m).  */
  private readonly remainingDistToExit = Subject.create<number>(0);

  /** Updated during deceleration on the ground. Counted from touchdown distance (min. 400m).  */
  private readonly remaininingDistToRwyEnd = Subject.create<number>(0);

  private readonly thresholdPositions = ConsumerSubject.create(this.sub.on('oansThresholdPositions'), []);

  private readonly exitPosition = ConsumerSubject.create(this.sub.on('oansExitPosition'), []);

  private readonly radioAltitude1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('radioAltitude_1'));
  private readonly radioAltitude2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('radioAltitude_2'));
  private readonly radioAltitude3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('radioAltitude_3'));

  private readonly fwsFlightPhase = ConsumerSubject.create(this.sub.on('fwcFlightPhase'), 0);

  public readonly below300ftRaAndLanding = MappedSubject.create(
    ([ra1, ra2, ra3, fp]) =>
      fp > 8 && fp < 11 && (ra1.valueOr(2500) <= 300 || ra2.valueOr(2500) <= 300 || ra3.valueOr(2500) <= 300),
    this.radioAltitude1,
    this.radioAltitude2,
    this.radioAltitude3,
    this.fwsFlightPhase,
  );

  private runwayIsSet() {
    return this.thresholdPositions.get()[0].length !== 0 && this.thresholdPositions.get()[1].length !== 0;
  }

  private clearSelection() {
    this.remainingDistToExit.set(-1);
    this.remaininingDistToRwyEnd.set(-1);
  }

  private updateRemainingDistances() {
    // Only update below 600ft AGL, and in landing FMGC phase
    const ra1 = this.radioAltitude1.get();
    const ra2 = this.radioAltitude2.get();
    const ra3 = this.radioAltitude3.get();

    if (
      !(ra1.valueOr(2500) < 600 || ra2.valueOr(2500) < 600 || ra3.valueOr(2500) < 600) ||
      this.fwsFlightPhase.get() < 9 ||
      this.fwsFlightPhase.get() > 11
    ) {
      this.remaininingDistToRwyEnd.set(-1);
      this.remainingDistToExit.set(-1);
      return;
    }

    const thresholdPos = this.thresholdPositions.get()[0];
    const oppositeThresholdPos = this.thresholdPositions.get()[1];
    const airportLocalPos = this.airportLocalPos.get();

    if (thresholdPos && thresholdPos.length > 0) {
      if (oppositeThresholdPos && oppositeThresholdPos.length > 0) {
        const rwyEndDistanceFromTdz =
          pointDistance(thresholdPos[0], thresholdPos[1], oppositeThresholdPos[0], oppositeThresholdPos[1]) -
          MIN_TOUCHDOWN_ZONE_DISTANCE;

        const rwyEndDistance = pointDistance(
          airportLocalPos[0],
          airportLocalPos[1],
          oppositeThresholdPos[0],
          oppositeThresholdPos[1],
        );

        this.remaininingDistToRwyEnd.set(MathUtils.round(Math.min(rwyEndDistanceFromTdz, rwyEndDistance), 0.1));
      }

      const exitPos = this.exitPosition.get();

      if (exitPos && exitPos.length > 0) {
        const exitDistanceFromTdz =
          pointDistance(thresholdPos[0], thresholdPos[1], exitPos[0], exitPos[1]) - MIN_TOUCHDOWN_ZONE_DISTANCE;

        const exitDistance = pointDistance(airportLocalPos[0], airportLocalPos[1], exitPos[0], exitPos[1]);

        this.remainingDistToExit.set(MathUtils.round(Math.min(exitDistanceFromTdz, exitDistance), 0.1));
      }
    }
  }

  public onUpdate(): void {
    this.updateRemainingDistances();
  }
}
