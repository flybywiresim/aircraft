// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AircraftType } from '@flybywiresim/fbw-sdk';
import { EventBus } from '@microsoft/msfs-sdk';

/**
 * This class is used to check the airframe of the aircraft and set the LVar
 */
export class AircraftSync {
    public xmlConfig: Document

    constructor(private readonly bus: EventBus) {
        console.log('AircraftSync: Created');
    }

    public connectedCallback(): void {
        // empty
    }

    public parseXMLConfig(xmlConfig: Document): void {
        this.xmlConfig = xmlConfig;
    }

    public startPublish(): void {
        console.log('AicraftSync: startPublish()');

        const airframe = new URL(document.querySelectorAll('vcockpit-panel > *')[0].getAttribute('url')).searchParams.get('Airframe');
        let aircraftType: AircraftType;

        switch (airframe) {
        case 'A380_842':
            aircraftType = AircraftType.A380_842;
            break;
        case 'A320_251N':
            aircraftType = AircraftType.A320_251N;
            break;
        default:
            aircraftType = AircraftType.Unknown;
            break;
        }

        SimVar.SetSimVarValue('L:A32NX_AIRCRAFT_TYPE', 'enum', aircraftType);
        console.log(`AirframeCheck: set ${aircraftType}`);
    }

    public update(): void {
        // empty
    }
}
