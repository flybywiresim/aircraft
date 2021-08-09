/* eslint-disable camelcase, max-classes-per-file, lines-between-class-members */
import React, { useEffect, useRef } from 'react';

declare class BingMapConfig {}

declare class NetBingMap extends HTMLElement {
    m_configs: BingMapConfig[];
    m_configId: number;
    m_params: Record<string, unknown>;
    addConfig(config: BingMapConfig): void;
    setConfig(id: number): void;
    setParams(params: Record<string, unknown>);
    setBingId(id: string): void;
    setVisible(visible: boolean): void;
    showWeather(mode: BingMapWeatherMode, cone: number): void;
}

declare class SvgMapConfig {
    generateBingMap(bingMap: NetBingMap): void;
    load(path: string, callback): BingMapConfig;
}

declare class LatLongAlt {
    lat: number;
    long: number;
    constructor(lat: number, long: number);
}

export enum BingMapWeatherMode {
    OFF = 'Off',
    TOPVIEW = 'Topview',
    HORIZONTAL = 'Horizontal',
    VERTICAL = 'Vertical'
}

export interface BingMapWeatherParams {
    mode: BingMapWeatherMode,
    cone: number,
}

export type BingMapProps = {
    configFolder: string,
    mapId: string,
    centerLla: { lat: number; long: number },
    range?: number,
    weatherMode?: BingMapWeatherMode,
    weatherCone?: number,
};

const RANGE_CONSTANT = 1852;
const DEFAULT_RANGE = 80;

export const BingMap: React.FC<BingMapProps> = ({ configFolder, mapId, centerLla, range = DEFAULT_RANGE, weatherMode, weatherCone }) => {
    const mapRef = useRef<NetBingMap>();

    useEffect(() => {
        if (mapRef.current) {
            const svgMapConfig = new SvgMapConfig();

            svgMapConfig.load(configFolder, () => {
                if (!mapRef.current) {
                    console.log(`[ReactBingMap (${mapId})] NetBingMap config loaded, but map is undefined. Aborting.`);
                    return;
                }
                console.log(`[ReactBingMap (${mapId})] NetBingMap config loaded`);

                svgMapConfig.generateBingMap(mapRef.current);
                mapRef.current.setConfig(0);

                mapRef.current.setBingId(mapId);
                mapRef.current.setVisible(true);

                const lla = new LatLongAlt(centerLla.lat, centerLla.long);
                const radius = range * RANGE_CONSTANT;

                mapRef.current.setParams({ lla, radius });

                console.log(`[ReactBingMap (${mapId})] NetBingMap initialized and configured with config id # ${mapRef.current.m_configId} out of ${mapRef.current.m_configs.length} configs`);
            });
        }
    }, [mapRef]);

    useEffect(() => {
        if (mapRef.current) {
            const lla = new LatLongAlt(centerLla.lat, centerLla.long);
            const radius = range * RANGE_CONSTANT;

            mapRef.current.setParams({ lla, radius });
        }
    }, [range, centerLla]);

    useEffect(() => {
        if (weatherMode && weatherCone && mapRef.current) {
            mapRef.current.showWeather(BingMapWeatherMode.OFF, weatherCone);
            mapRef.current.showWeather(weatherMode, weatherCone);
        }
    }, [weatherMode, weatherCone]);

    return (
        <>
            {/* @ts-ignore */}
            <bing-map ref={mapRef} />
        </>
    );
};
