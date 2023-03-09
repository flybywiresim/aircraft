// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from 'msfssdk';

export class VersionCheck {
    constructor(private readonly bus: EventBus) {
        console.debug('VersionCheck: constructor()');
    }

    public connectedCallback(): void {
        console.debug('VersionCheck: connectedCallback()');
    }

    public startPublish(): void {
        console.debug('VersionCheck: startPublish()');
    }

    public update(): void {
    }
}
