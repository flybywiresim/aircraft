import React, { useEffect, useState } from 'react';
import metarParser from 'aewx-metar-parser';
import { Metar } from '@flybywiresim/api-client';
import { IconCloud, IconDroplet, IconGauge, IconPoint, IconTemperature, IconWind } from '@tabler/icons';
import { MetarParserType, Wind } from '../../../Common/metarTypes';
import { usePersistentProperty } from '../../../Common/persistence';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';

const MetarParserTypeWindState: Wind = {
    degrees: 0,
    speed_kts: 0,
    speed_mps: 0,
    gust_kts: 0,
    gust_mps: 0,
};

const VisibilityType = {
    miles: '',
    miles_float: 0.0,
    meters: '',
    meters_float: 0.0,
};

const conditionCode = { code: '' };

const cloud = {
    code: '',
    base_feet_agl: 0,
    base_meters_agl: 0,
};

const ceiling = {
    code: '',
    feet_agl: 0,
    meters_agl: 0,
};

const temperature = {
    celsius: 0,
    fahrenheit: 0,
};

const dewpoint = {
    celsius: 0,
    fahrenheit: 0,
};

const barometer = {
    hg: 0,
    kpa: 0,
    mb: 0,
};

const MetarParserTypeProp: MetarParserType = {
    raw_text: '',
    raw_parts: [''],
    icao: '',
    observed: new Date(0),
    wind: MetarParserTypeWindState,
    visibility: VisibilityType,
    conditions: [conditionCode],
    clouds: [cloud],
    ceiling,
    temperature,
    dewpoint,
    humidity_percent: 0,
    barometer,
    flight_category: '',
};

type WeatherWidgetProps = { name: string, editIcao: string, icao: string};

const WeatherWidget = (props: WeatherWidgetProps) => {
    const [metar, setMetar] = useState<MetarParserType>(MetarParserTypeProp);
    const [showMetar, setShowMetar] = usePersistentProperty(`CONFIG_SHOW_METAR_${props.name}`, 'DISABLED');
    let [metarSource] = usePersistentProperty('CONFIG_METAR_SRC', 'MSFS');

    if (metarSource === 'MSFS') {
        metarSource = 'MS';
    }

    const source = metarSource;

    const handleIcao = (icao: string) => {
        if (icao.length === 4) {
            getMetar(icao, source);
        } else if (icao.length === 0) {
            getMetar(props.icao, source);
        }
    };

    function getMetar(icao:any, source: any) {
        if (icao.length !== 4 || icao === '----') {
            return new Promise(() => {
                setMetar(MetarParserTypeProp);
            });
        }
        return Metar.get(icao, source)
            .then((result) => {
                const metarParse = metarParser(result.metar);
                setMetar(metarParse);
            })
            .catch(() => {
                setMetar(MetarParserTypeProp);
            });
    }

    useEffect(() => {
        getMetar(props.icao, source);
    }, [props.icao, source]);

    return (
        <div className="text-white">
            {metar === undefined
                ? <p>Loading ...</p>
                : (
                    <>
                        <div className="mb-8 inline-flex items-center w-80">
                            <div className="ml-6">
                                <IconCloud size={35} stroke={1.5} strokeLinejoin="miter" />
                            </div>
                            <SimpleInput
                                noLabel
                                className="text-center w-24 ml-4 text-2xl font-medium uppercase"
                                placeholder={props.icao}
                                value={props.icao === '----' ? '' : props.icao}
                                onChange={(value) => handleIcao(value)}
                                maxLength={4}
                            />
                            <div className="ml-6">
                                <button
                                    type="button"
                                    className="mr-1 w-24 text- bg-gray-600 p-2 flex items-center justify-center rounded-lg focus:outline-none text-lg"
                                    onClick={() => setShowMetar(showMetar === 'ENABLED' ? 'DISABLED' : 'ENABLED')}
                                >
                                    {showMetar === 'ENABLED' ? 'TEXT' : 'ICONS'}
                                </button>
                            </div>
                        </div>
                        {showMetar === 'DISABLED'
                            ? (
                                <>
                                    <div className="grid grid-cols-2 h-40">
                                        <div className="justify-left text-center text-lg">
                                            <div className="flex justify-center">
                                                <IconGauge className="mb-2" size={35} stroke={1.5} strokeLinejoin="miter" />
                                            </div>
                                            {metar.raw_text ? (
                                                <>
                                                    {metar.barometer.mb.toFixed(0)}
                                                    {' '}
                                                    mb
                                                </>
                                            ) : (
                                                <>
                                                    N/A
                                                </>
                                            )}
                                        </div>
                                        <div className="justify-left text-center text-lg">
                                            <div className="flex justify-center">
                                                <IconWind className="mb-2" size={35} stroke={1.5} strokeLinejoin="miter" />
                                            </div>
                                            {metar.raw_text
                                                ? (
                                                    <>
                                                        {metar.wind.degrees.toFixed(0)}
                                                        {' '}
                                                        <IconPoint
                                                            className="inline-block -mx-1 -mt-3"
                                                            size={20}
                                                            stroke={2}
                                                            strokeLinejoin="miter"
                                                        />
                                                        {' '}
                                                        /
                                                        {' '}
                                                        {metar.wind.speed_kts.toFixed(0)}
                                                        {' '}
                                                        kts
                                                    </>
                                                ) : 'N/A'}
                                        </div>
                                        <div className="text-center text-lg mt-6">
                                            <div className="flex justify-center">
                                                <IconTemperature className="mb-2" size={35} stroke={1.5} strokeLinejoin="miter" />
                                            </div>
                                            {metar.raw_text
                                                ? (
                                                    <>
                                                        {metar.temperature.celsius.toFixed(0)}
                                                        {' '}
                                                        <IconPoint
                                                            className="inline-block -mx-1 -mt-3"
                                                            size={20}
                                                            stroke={2}
                                                            strokeLinejoin="miter"
                                                        />
                                                        {' '}
                                                        {' '}
                                                        C
                                                    </>
                                                ) : 'N/A'}
                                        </div>
                                        <div className="overflow-y-scroll text-center text-lg mt-6">
                                            <div className="flex justify-center">
                                                <IconDroplet className="mb-2" size={35} stroke={1.5} strokeLinejoin="miter" />
                                            </div>
                                            {metar.raw_text
                                                ? (
                                                    <>
                                                        {metar.dewpoint.celsius.toFixed(0)}
                                                        {' '}
                                                        <IconPoint
                                                            className="inline-block -mx-1 -mt-3"
                                                            size={20}
                                                            stroke={2}
                                                            strokeLinejoin="miter"
                                                        />
                                                        {' '}
                                                        {' '}
                                                        C
                                                    </>
                                                ) : 'N/A'}
                                        </div>
                                    </div>
                                </>
                            )
                            : (
                                <>
                                    <div className="scrollbar text-left ml-8 mr-4 h-40 text-xl font-medium">
                                        {metar.raw_text
                                            ? (
                                                <>
                                                    {metar.raw_text}
                                                </>
                                            ) : (
                                                <>
                                                    NO VALID ICAO CHOSEN
                                                    {' '}
                                                    {' '}
                                                </>
                                            )}
                                    </div>
                                </>
                            )}
                    </>
                )}
        </div>
    );
};

export default WeatherWidget;
