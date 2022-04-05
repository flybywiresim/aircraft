import React, { useEffect, useRef, useState } from 'react';

interface BingMapProps {
    configFolder: string;
    mapId: string;
    centerLla: { lat: number; long: number };
    range?: number;
    rotation?: number;
}

const RANGE_CONSTANT = 1852;
const DEFAULT_RANGE = 80;

export const BingMap: React.FC<BingMapProps> = ({ configFolder, mapId, range = DEFAULT_RANGE, centerLla, rotation = 0 }) => {
    const mapRef = useRef<BingMapElement>();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [mapSize, setMapSize] = useState(100);

    useEffect(() => {
        const svgMapConfig = new SvgMapConfig();

        svgMapConfig.load(configFolder, () => {
            console.log(`[ReactBingMap (${mapId})] NetBingMap config loaded`);
            if (!mapRef.current) return;

            svgMapConfig.generateBingMap(mapRef.current);
            mapRef.current.setConfig(0);

            mapRef.current.setBingId(mapId);
            mapRef.current.setVisible(true);

            const lla = new LatLongAlt(centerLla.lat, centerLla.long);
            const radius = range * RANGE_CONSTANT;

            mapRef.current.setParams({ lla, radius });

            console.log(`[ReactBingMap (${mapId})] NetBingMap initialized and configured with config id # ${mapRef.current.m_configId} out of ${mapRef.current.m_configs.length} configs`);
        });
    }, [mapRef]);

    useEffect(() => {
        if (mapRef.current) {
            const lla = new LatLongAlt(centerLla.lat, centerLla.long);
            const radius = range * RANGE_CONSTANT;

            mapRef.current.setParams({ lla, radius });
        }
    }, [range, centerLla]);

    useEffect(() => {
        if (mapContainerRef.current) {
            const newSize = mapContainerRef.current.clientWidth * Math.sqrt(2);
            setMapSize(newSize);
        }
    }, [mapContainerRef.current]);

    return (
        <div ref={mapContainerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div
                style={{
                    transform: `rotateZ(${rotation}deg) translateX(-50%) translateY(-50%)`,
                    transformOrigin: '0 0',
                    width: mapSize,
                    height: mapSize,
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                }}
            >
                {/* @ts-ignore */}
                <bing-map ref={mapRef} />
            </div>
        </div>
    );
};
