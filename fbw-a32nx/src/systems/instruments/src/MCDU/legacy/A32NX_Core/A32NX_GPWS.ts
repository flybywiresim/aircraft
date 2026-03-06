// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
// @ts-strict-ignore
import { soundList } from './A32NX_SoundManager';

// FIXME move GPWS logic to systems host, and ACOs to PseudoFWC
export class A32NX_GPWS {
  private prevAuralWarning = 0;

  constructor(private core) {
    console.log('A32NX_GPWS constructed');
  }

  init() {
    console.log('A32NX_GPWS init');
  }

  update(_deltaTime, _core) {
    this.GPWSComputeLightsAndCallouts();
  }

  GetWarningFromEnum(num: number) {
    switch (num) {
      case 1:
        return soundList.pull_up;
      case 2:
        return soundList.terrain;
      case 3:
        return soundList.too_low_terrain;
      case 4:
        return soundList.too_low_gear;
      case 5:
        return soundList.too_low_flaps;
      case 6:
        return soundList.sink_rate;
      case 7:
        return soundList.dont_sink;
      case 8:
        return soundList.glideslope_quiet;
      case 9:
        return soundList.glideslope_loud;
      case 10:
        return soundList.terrain_ahead;
      case 11:
        return soundList.obstacle_ahead;
      default:
        return '';
    }
  }

  GPWSComputeLightsAndCallouts() {
    const currentAuralWarning = SimVar.GetSimVarValue('L:A32NX_GPWS_AURAL_OUTPUT', 'number');
    if (currentAuralWarning !== this.prevAuralWarning) {
      if (currentAuralWarning !== 0) {
        this.core.soundManager.addPeriodicSound(this.GetWarningFromEnum(currentAuralWarning), 1.1);
      }
      this.core.soundManager.removePeriodicSound(this.GetWarningFromEnum(this.prevAuralWarning));

      this.prevAuralWarning = currentAuralWarning;
    }
  }
}
