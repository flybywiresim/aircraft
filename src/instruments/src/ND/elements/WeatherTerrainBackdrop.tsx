import React, { FC, memo, useEffect, useState } from 'react';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { useSimVar } from '@instruments/common/simVars';
import { EfisSide, Mode, RangeSetting, rangeSettings } from '../index';
import { BingMap, BingMapWeatherMode } from '../BingMap';

export interface WeatherTerrainBackdropProps {
    mode: number,
    side: EfisSide,
    range: RangeSetting,
    ppos: Coordinates,
}

export const WeatherTerrainBackdrop: FC<WeatherTerrainBackdropProps> = memo(({ mode, side, range, ppos }) => {
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

    if (mode === Mode.ARC) {
        return (
            <>
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
            </>
        );
    // TODO FIXME: better clipping mask and refactor
    } if (mode === Mode.ROSE_NAV) {
        return (
            <>
                <div className="BingMap" style={{ clip: 'rect(410px, 1650px, 1500px, 0px)', width: '1650px', position: 'absolute', left: '-185px', top: '-188px', zIndex: 90 }}>
                    <BingMap
                        configFolder="/Pages/VCockpit/Instruments/Airliners/A320_Neo/MFD/"
                        mapId={`a320-nd-${side}`}
                        range={range}
                        centerLla={ppos}
                        weatherMode={wxr}
                        weatherCone={Math.PI}
                    />
                </div>
            </>
        );
    }

    return (
        <>
        </>
    );
});
