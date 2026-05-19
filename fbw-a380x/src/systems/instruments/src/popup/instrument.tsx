// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FsBaseInstrument } from '@microsoft/msfs-sdk';
import { PopupFsInstrument } from '@flybywiresim/popup';

import '../../../../../../fbw-common/src/systems/instruments/src/popup/style.scss';

class A380X_POPUP extends FsBaseInstrument<PopupFsInstrument> {
  constructInstrument(): PopupFsInstrument {
    return new PopupFsInstrument(this);
  }

  get isInteractive(): boolean {
    return false;
  }

  get templateID(): string {
    return 'A380X_popup';
  }
}

registerInstrument('a380x-popup', A380X_POPUP);
