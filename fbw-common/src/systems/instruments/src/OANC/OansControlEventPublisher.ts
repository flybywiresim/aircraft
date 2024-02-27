// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { EfisSide } from '@flybywiresim/fbw-sdk';

export interface OansRunwayInfo {
    ident: string,
    length: number,
}

export interface OansControlEvents {
    ndShowOans: boolean,
    ndSetContextMenu: { x: number, y: number },
    oansDisplayAirport: string,
    oansZoomIn: number,
    oansZoomOut: number,
    oansRunwayInfo: OansRunwayInfo | null,
}

export class FmsOansPublisher extends SimVarPublisher<OansControlEvents> {
    constructor(bus: EventBus, efisSide: EfisSide) {
        super(new Map([
            ['ndShowOans', { name: `A380X_OANS_${efisSide}_SHOW_OANS`, type: SimVarValueType.Bool }],
            ['ndSetContextMenu', { name: `A380X_OANS_${efisSide}_SET_CONTEXT_MENU`, type: SimVarValueType.String }], // would this work?
            ['oansDisplayAirport', { name: `A380X_OANS_${efisSide}_DISPLAY_AIRPORT`, type: SimVarValueType.String }],
            ['oansZoomIn', { name: `A380X_OANS_${efisSide}_ZOOM_IN`, type: SimVarValueType.Number }],
            ['oansZoomOut', { name: `A380X_OANS_${efisSide}_ZOOM_OUT`, type: SimVarValueType.Number }],
            ['oansRunwayInfo', { name: `A380X_OANS_${efisSide}_RUNWAY_INFO`, type: SimVarValueType.String }],
        ]), bus);
    }
}
