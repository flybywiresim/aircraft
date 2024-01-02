// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FsBaseInstrument } from '@microsoft/msfs-sdk';
import { EfbV4FsInstrument } from '@flybywiresim/EFBv4';

// eslint-disable-next-line camelcase
class A32NX_EFBv4 extends FsBaseInstrument<EfbV4FsInstrument> {
    constructInstrument(): EfbV4FsInstrument {
        return new EfbV4FsInstrument(this);
    }

    get isInteractive(): boolean {
        return true;
    }

    get templateID(): string {
        return 'A32NX_EFBv4';
    }
}

registerInstrument('a32nx-efbv4', A32NX_EFBv4);
