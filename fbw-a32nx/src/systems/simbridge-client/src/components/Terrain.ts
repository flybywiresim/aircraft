// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EfisSide } from 'fbw-a32nx/src/shared/src/NavigationDisplay';
import { getSimBridgeUrl } from '../common';
import { ClientState } from './ClientState';

export class Terrain {
    private static endpointsAvailable: boolean = false;

    public static async mapdataAvailable(): Promise<boolean> {
        if (!ClientState.getInstance().isAvailable()) {
            Terrain.endpointsAvailable = false;
            return false;
        }
        return fetch(`${getSimBridgeUrl()}/api/v1/terrain/available`).then((response) => {
            Terrain.endpointsAvailable = response.ok;
            return response.ok;
        }).catch((_ex) => {
            Terrain.endpointsAvailable = false;
            return false;
        });
    }

    public static async setCurrentPosition(latitude: number, longitude: number, heading: number, altitude: number, verticalSpeed: number): Promise<void> {
        if (Terrain.endpointsAvailable) {
            fetch(`${getSimBridgeUrl()}/api/v1/terrain/position`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude, heading, altitude, verticalSpeed }),
            });
        } else {
            throw new Error('Endpoints unavailable');
        }
    }

    public static async setDisplaySettings(side: EfisSide, settings: {
        active: boolean,
        mapWidth: number,
        mapHeight: number,
        meterPerPixel: number,
        mapTransitionTime: number,
        mapTransitionFps: number,
        arcMode: boolean,
        gearDown: boolean
    }): Promise<void> {
        if (Terrain.endpointsAvailable) {
            fetch(`${getSimBridgeUrl()}/api/v1/terrain/displaysettings?display=${side}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
        } else {
            throw new Error('Endpoints unavailable');
        }
    }

    public static async ndMapAvailable(side: EfisSide, timestamp: number): Promise<boolean> {
        if (Terrain.endpointsAvailable) {
            return fetch(`${getSimBridgeUrl()}/api/v1/terrain/ndMapAvailable?display=${side}&timestamp=${timestamp}`).then((response) => {
                if (response.ok) {
                    return response.text().then((text) => text === 'true');
                }
                return false;
            });
        }

        throw new Error('Endpoints unavailable');
    }

    public static async ndTransitionMaps(side: EfisSide, timestamp: number): Promise<string[]> {
        if (Terrain.endpointsAvailable) {
            return fetch(`${getSimBridgeUrl()}/api/v1/terrain/ndmaps?display=${side}&timestamp=${timestamp}`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
            }).then((response) => response.json().then((imageBase64) => imageBase64));
        }

        throw new Error('Endpoints unavailable');
    }

    public static async ndTerrainRange(side: EfisSide, timestamp: number):
    Promise<{
        minElevation: number,
        minElevationIsWarning: boolean,
        minElevationIsCaution: boolean,
        maxElevation: number,
        maxElevationIsWarning: boolean,
        maxElevationIsCaution: boolean
    }> {
        if (Terrain.endpointsAvailable) {
            return fetch(`${getSimBridgeUrl()}/api/v1/terrain/terrainRange?display=${side}&timestamp=${timestamp}`, {
                method: 'GET',
                headers: { Accept: 'application/json' },
            }).then((response) => response.json().then((data) => data));
        }

        throw new Error('Endpoints unavailable');
    }

    public static async renderNdMap(side: EfisSide): Promise<number> {
        if (Terrain.endpointsAvailable) {
            return fetch(`${getSimBridgeUrl()}/api/v1/terrain/renderMap?display=${side}`).then((response) => response.text().then((text) => parseInt(text)));
        }

        throw new Error('Endpoints unavailable');
    }
}
