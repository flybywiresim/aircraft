// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export interface OansRunwayInfo {
    ident: string,
    length: number,
}

export interface BtvExitInfo {
    exit: string,
    stoppingDistance: number,
}

export interface OansControlEvents {
    ndShowOans: boolean,
    ndSetContextMenu: { x: number, y: number },
    oansDisplayAirport: string,
    oansZoomIn: number,
    oansZoomOut: number,
    btvRunwayInfo: OansRunwayInfo | null,
}
