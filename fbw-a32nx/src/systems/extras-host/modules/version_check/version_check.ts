// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from 'msfssdk';
import { AircraftVersionChecker } from '@shared/AircraftVersionChecker';

export class VersionCheck {
    constructor(private readonly bus: EventBus) {
        console.log('VersionCheck: constructor()');
    }

    public connectedCallback(): void {
        console.debug('VersionCheck: connectedCallback()');
    }

    public startPublish(): void {
        console.log('VersionCheck: startPublish()');
        AircraftVersionChecker.checkVersion();
    }

    public update(): void {
        // empty
    }
}
