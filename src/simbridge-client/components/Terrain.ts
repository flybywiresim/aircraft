import { EfisSide } from '@shared/NavigationDisplay';
import { simbridgeUrl } from '../common';
import { NavigationDisplayTerrainData } from '../dto/Terrain/NavigationDisplayTerrainData';

/**
 * Class pertaining to retrieving terrain data from SimBridge
 */
export class Terrain {
    public static async mapdataAvailable(): Promise<boolean> {
        return fetch(`${simbridgeUrl}/api/v1/terrain/available`).then((response) => response.ok);
    }

    public static async setCurrentPosition(latitude: number, longitude: number, heading: number, altitude: number, verticalSpeed: number): Promise<void> {
        fetch(`${simbridgeUrl}/api/v1/terrain/position`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude, heading, altitude, verticalSpeed }),
        });
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
        fetch(`${simbridgeUrl}/api/v1/terrain/displaysettings?display=${side}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings),
        });
    }

    public static async ndMapAvailable(side: EfisSide, timestamp: number): Promise<boolean> {
        return fetch(`${simbridgeUrl}/api/v1/terrain/ndMapAvailable?display=${side}&timestamp=${timestamp}`).then((response) => {
            if (response.ok) {
                return response.text().then((text) => text === 'true');
            }
            return false;
        });
    }

    public static async ndTransitionMaps(side: EfisSide, timestamp: number): Promise<string[]> {
        return fetch(`${simbridgeUrl}/api/v1/terrain/ndmaps?display=${side}&timestamp=${timestamp}`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
        }).then((response) => response.json().then((imageBase64) => imageBase64));
    }

    public static async ndTerrainRange(side: EfisSide, timestamp: number):
    Promise<NavigationDisplayTerrainData> {
        return fetch(`${simbridgeUrl}/api/v1/terrain/terrainRange?display=${side}&timestamp=${timestamp}`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
        }).then((response) => response.json().then((data) => data));
    }

    public static async renderNdMap(side: EfisSide): Promise<number> {
        return fetch(`${simbridgeUrl}/api/v1/terrain/renderMap?display=${side}`).then((response) => response.text().then((text) => parseInt(text)));
    }
}
