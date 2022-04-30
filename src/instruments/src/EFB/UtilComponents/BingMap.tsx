import React, { useEffect, useRef } from 'react';

interface BingMapProps {
    configFolder: string;
    mapId: string;
    centerLla: { lat: number; long: number };
    range?: number;
}

const RANGE_CONSTANT = 1852;
const DEFAULT_RANGE = 80;

export const BingMap: React.FC<BingMapProps> = ({ configFolder, mapId, range = DEFAULT_RANGE, centerLla }) => {
    const mapRef = useRef<NetBingMap>();

    useEffect(() => {
        if (mapRef.current) {
            const svgMapConfig = new SvgMapConfig();

            svgMapConfig.load(configFolder, () => {
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

    return (
        <>
            {/* @ts-ignore */}
            <bing-map ref={mapRef} />
        </>
    );
};
