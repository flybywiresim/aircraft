import { useSimVar } from '@instruments/common/simVars';
import { Mode } from '@shared/NavigationDisplay';
import React from 'react';

interface WeatherRadarProps {
    side: 'L' | 'R';
    modeIndex: number;
}

export const WeatherRadarProvider: React.FC<WeatherRadarProps> = ({ side, modeIndex }) => {
    const [bingId] = useSimVar(`L:A32NX_WEATHER_BING_ID_${side}`, 'number', 5000);

    const className = (modeIndex === Mode.ROSE_ILS || modeIndex === Mode.ROSE_VOR || modeIndex === Mode.ROSE_NAV) ? 'rose' : 'arc';
    const [weatherEnabled] = useSimVar('L:XMLVAR_A320_WeatherRadar_Sys', 'number', 100);
    return (
        <>
            <div className="BingMap" style={{ display: (weatherEnabled !== 1 && modeIndex !== Mode.PLAN) ? 'inline' : 'none' }}>
                <div className="WeirdWrapper">
                    <img src={`JS_BINGMAP_A32NX_${side}_${bingId}`} style={{ position: 'absolute', left: 0 }} className={`weather ${className}`} />
                </div>
            </div>
        </>
    );
};
