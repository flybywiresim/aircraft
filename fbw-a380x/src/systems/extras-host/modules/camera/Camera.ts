// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export class Camera {
  private inFoSeat: boolean | null = null;
  public onUpdate(): void {
    const cameraPos = SimVar.GetGameVarValue('CAMERA_POS_IN_PLANE', 'xyz');
    const inFoSeat = cameraPos.x < 0;

    if (inFoSeat !== this.inFoSeat) {
      this.inFoSeat = inFoSeat;
      SimVar.SetSimVarValue('L:A380X_PILOT_IN_FO_SEAT', 'bool', inFoSeat);
    }
  }
}
