// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { EventBus, EventSubscriber } from '@microsoft/msfs-sdk';
import { ExtrasSimVarEvents } from '../common/ExtrasSimVarPublisher';

export const fetchGsxMenu = () => fetch('../../../ingamepanels/fsdt_gsx_panel/menu')
    .then((response) => response.text())
    .then((text) => text.split(/\r?\n/))
    .catch((error) => console.error(`Failed to open GSX Menu due to ${error}`));

export const setGsxMenuChoice = (choice: number) => {
    SimVar.SetSimVarValue('L:FSDT_GSX_MENU_CHOICE', 'number', choice).then(() => console.log(`GSXInterceptor: Menu choice set to: ${choice}`));
};

export const payLoadSyncEnabled = NXDataStore.get('GSX_FUEL_SYNC', '0') === '1';

export const refuelSyncEnabled = NXDataStore.get('GSX_PAYLOAD_SYNC', '0') === '1';

export class GsxInterceptor {
    private eventBus: EventBus

    constructor(private readonly bus: EventBus) {
        this.eventBus = this.bus
        this.registerSubscriptions()
        console.log('GsxInterceptor: Created')
    }

    public connectedCallback(): void {
        // empty
    }

    public startPublish(): void {
        console.log('GsxInterceptor: startPublish()');
    }

    public update(): void {
        // empty
    }

    private registerSubscriptions() {
        const subscriber = this.eventBus.getSubscriber<ExtrasSimVarEvents>()

        subscriber
            .on('gsx_external_toggle')
            .whenChanged()
            .handle(value => {
                console.log('GsxInterceptor: GSX Toggled')
                console.log(`GsxInterceptor: Toggle Value ${value}`)
                this.handleGsxToggle()
            })
    }

    private handleGsxToggle() {
        fetchGsxMenu().then((lines) => {
            if (lines[0] === 'Select handling operator' || lines[0] === 'Select catering operator') {
                console.log('GsxInterceptor: setting menu choice to -1');
                setGsxMenuChoice(-1);
                return;
            }
            console.log('GsxInterceptor: operator/caterer menu is not active, moving on');
        });

        if (SimVar.GetSimVarValue('L:A32NX_GSX_MENU_CHOICE_MADE', 'boolean') === 1) {
            console.log('GsxInterceptor: GSX Toggled, setting choice');
            setGsxMenuChoice(SimVar.GetSimVarValue('L:A32NX_GSX_MENU_CHOICE', 'number'))
            SimVar.SetSimVarValue('L:A32NX_GSX_MENU_CHOICE_MADE', 'boolean', 0).then(() => console.log("GsxInterceptor: Choice reverted to false"))
        }
    }
}