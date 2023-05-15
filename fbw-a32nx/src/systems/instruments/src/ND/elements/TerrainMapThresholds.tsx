import React from 'react';
import { EfisSide } from '@shared/NavigationDisplay';
import { useSimVar } from '@instruments/common/simVars';

enum TerrainLevelMode {
    PeaksMode = 0,
    Warning = 1,
    Caution = 2,
}

export interface TerrainMapThresholdsProps {
    side: EfisSide,
}

export const TerrainMapThresholds: React.FC<TerrainMapThresholdsProps> = ({ side }) => {
    const [minElevation] = useSimVar(`L:A32NX_EGPWC_ND_${side}_TERRAIN_MIN_ELEVATION`, 'number', 200);
    const [minElevationMode] = useSimVar(`L:A32NX_EGPWC_ND_${side}_TERRAIN_MIN_ELEVATION_MODE`, 'number', 200);
    const [maxElevation] = useSimVar(`L:A32NX_EGPWC_ND_${side}_TERRAIN_MAX_ELEVATION`, 'number', 200);
    const [maxElevationMode] = useSimVar(`L:A32NX_EGPWC_ND_${side}_TERRAIN_MAX_ELEVATION_MODE`, 'number', 200);

    // terrain map is disabled
    if (minElevation < 0 && maxElevation < 0) return <></>;

    let lowerBorderColor = '';
    let upperBorderColor = '';
    let lowerBorder = '';
    let upperBorder = '';

    // calculate the lower border values
    if (minElevation >= 0) {
        lowerBorder = String(Math.floor(minElevation / 100)).padStart(3, '0');
    }
    switch (minElevationMode as TerrainLevelMode) {
    case TerrainLevelMode.Caution:
        lowerBorderColor = 'rgb(255, 0, 0)';
        break;
    case TerrainLevelMode.Warning:
        lowerBorderColor = 'rgb(255, 255, 0)';
        break;
    default:
        lowerBorderColor = 'rgb(0, 255, 0)';
        break;
    }

    // calculate the upper border values
    if (maxElevation !== 0) {
        upperBorder = String(Math.round(maxElevation / 100 + 0.5)).padStart(3, '0');
    } else {
        upperBorder = '000';
    }
    switch (maxElevationMode as TerrainLevelMode) {
    case TerrainLevelMode.Caution:
        upperBorderColor = 'rgb(255, 0, 0)';
        break;
    case TerrainLevelMode.Warning:
        upperBorderColor = 'rgb(255, 255, 0)';
        break;
    default:
        upperBorderColor = 'rgb(0, 255, 0)';
        break;
    }

    return (
        <>
            <text x={688} y={612} fontSize={23} fill="rgb(0,255,255)">
                TERR
            </text>
            <text x={709} y={639} fontSize={22} fill={upperBorderColor}>
                {upperBorder}
            </text>
            <rect x={700} y={619} width={54} height={24} strokeWidth={3} stroke="rgb(255,255,0)" fillOpacity={0} />
            <text x={709} y={663} fontSize={22} fill={lowerBorderColor}>
                {lowerBorder}
            </text>
            <rect x={700} y={643} width={54} height={24} strokeWidth={3} stroke="rgb(255,255,0)" fillOpacity={0} />
        </>
    );
};
