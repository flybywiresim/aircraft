//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

export class FwcOutputBus {
    public activateAtcRing(): void {
        Coherent.call('PLAY_INSTRUMENT_SOUND', 'cpdlc_ring');
        // ensure that the timeout is longer than the sound
        setTimeout(() => SimVar.SetSimVarValue('W:cpdlc_ring', 'boolean', 0), 2000);
    }
}
