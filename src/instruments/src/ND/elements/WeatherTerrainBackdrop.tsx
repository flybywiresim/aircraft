import React, { FC, memo, useEffect, useState } from 'react';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { useSimVar } from '@instruments/common/simVars';
import { EfisSide, RangeSetting, rangeSettings } from '../index';
import { BingMap, BingMapWeatherMode } from '../BingMap';

export interface WeatherTerrainBackdropProps {
    side: EfisSide,
    range: RangeSetting,
    ppos: Coordinates,
}

export const WeatherTerrainBackdrop: FC<WeatherTerrainBackdropProps> = memo(({ side, range, ppos }) => {
    const [wxrSysSwitch] = useSimVar('L:XMLVAR_A320_WeatherRadar_Sys', 'Enum', 300);

    const [wxr, setWxr] = useState<BingMapWeatherMode>(BingMapWeatherMode.OFF);

    /*
     * 0 = SYS 1
     * 1 = OFF
     * 2 = SYS 2
     */
    useEffect(() => {
        if (wxrSysSwitch === 1) {
            setWxr(BingMapWeatherMode.OFF);
        } else {
            setWxr(BingMapWeatherMode.HORIZONTAL);
        }
    }, [wxrSysSwitch]);

    return (
        <div className="BingMap" style={{ width: '1650px', position: 'absolute', left: '-185px', top: '210px', zIndex: 90 }}>
            <BingMap
                configFolder="/Pages/VCockpit/Instruments/Airliners/A320_Neo/MFD/"
                mapId={`a320-nd-${side}`}
                range={range}
                centerLla={ppos}
                weatherMode={wxr}
                weatherCone={Math.PI}
            />
        </div>
    );
});
