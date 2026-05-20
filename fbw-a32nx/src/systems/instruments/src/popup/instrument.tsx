// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FsBaseInstrument } from '@microsoft/msfs-sdk';
import { PopupFsInstrument } from '@flybywiresim/popup';

import '../../../../../../fbw-common/src/systems/instruments/src/popup/style.scss';
class A32NX_POPUP extends FsBaseInstrument<PopupFsInstrument> {
  constructInstrument(): PopupFsInstrument {
    return new PopupFsInstrument(this);
  }

  get isInteractive(): boolean {
    return false;
  }

  get templateID(): string {
    return 'A32NX_popup';
  }
}

registerInstrument('a32nx-popup', A32NX_POPUP);
