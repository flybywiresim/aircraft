// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FsBaseInstrument } from '@microsoft/msfs-sdk';
import { PopupInstrument } from '@flybywiresim/fbw-sdk';

import '../../../../../../fbw-common/src/systems/instruments/src/popup/style.scss';

class A380X_POPUP extends FsBaseInstrument<PopupInstrument> {
  constructInstrument(): PopupInstrument {
    return new PopupInstrument();
  }

  get isInteractive(): boolean {
    return false;
  }

  get templateID(): string {
    return 'A380X_popup';
  }
}

registerInstrument('a380x-popup', A380X_POPUP);
