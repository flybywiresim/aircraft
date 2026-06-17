// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { AircraftConfig } from '../../../flightplanning/AircraftConfigTypes';

export class SpeedMargin {
  private vmo: Knots = 350;

  private mmo: Mach = 0.82;

  constructor(
    private aircraftConfig: AircraftConfig,
    private observer: VerticalProfileComputationParametersObserver,
  ) {
    this.vmo = this.aircraftConfig.vnavConfig.VMO;
    this.mmo = this.aircraftConfig.vnavConfig.MMO;
  }

  getTarget(indicatedAirspeed: Knots, targetSpeed: Knots): Knots {
    const [lowerMargin, upperMargin] = this.getMargins(targetSpeed);

    return Math.max(Math.min(indicatedAirspeed, upperMargin), lowerMargin);
  }

  getMargins(currentTarget: Knots): [Knots, Knots] {
    const { managedDescentSpeed, managedDescentSpeedMach, approachSpeed } = this.observer.get();

    const vmax = SimVar.GetSimVarValue('L:A32NX_SPEEDS_VMAX', 'number');
    const vMan = this.getVman(approachSpeed);
    const vls = SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number');

    const maxMachAsIas = SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', this.mmo - 0.006);
    const isMachTarget =
      managedDescentSpeed - SimVar.GetGameVarValue('FROM MACH TO KIAS', 'number', managedDescentSpeedMach) > 1;

    const distanceToLowerMargin = 20;
    const distanceToUpperMargin = !isMachTarget && managedDescentSpeed - currentTarget > 1 ? 5 : 20;

    return [
      Math.max(vls, vMan, Math.min(currentTarget - distanceToLowerMargin, vmax, this.vmo - 3, maxMachAsIas)),
      Math.max(vls, vMan, Math.min(currentTarget + distanceToUpperMargin, vmax, this.vmo - 3, maxMachAsIas)),
    ];
  }

  private getVman(vApp: Knots): Knots {
    switch (SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number')) {
      case 0:
        return SimVar.GetSimVarValue('L:A32NX_SPEEDS_GD', 'number');
      case 1:
        return SimVar.GetSimVarValue('L:A32NX_SPEEDS_S', 'number');
      case 2:
        return SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number');
      case 3:
      case 4:
        return vApp;
      default:
        return SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number');
    }
  }
}
