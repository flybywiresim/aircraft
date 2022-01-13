import React, { useEffect, useState } from 'react';
import metarParser from 'aewx-metar-parser';
import { Metar } from '@flybywiresim/api-client';
import { IconWind, IconGauge, IconDroplet, IconTemperature, IconPoint, IconCloud } from '@tabler/icons';
import { MetarParserType, Wind } from '../../../Common/metarTypes';
import { usePersistentProperty } from '../../../Common/persistence';

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

        const getBaroTypeForAirport = (icao: string) => (['K', 'C', 'M', 'P', 'RJ', 'RO', 'TI', 'TJ'].some((r) => icao.startsWith(r)) ? 'IN HG' : 'HPA');


    const BaroValue = () => {
        if (baroType === 'IN HG') {
            return (
                <>
                    {metar.barometer.hg.toFixed(2)}
                    {' '}
                    inHg
                </>
            );
        }

        return (
            <>
                {metar.barometer.mb.toFixed(0)}
                {' '}
                mb
            </>
        );
    };

    let [baroType] = usePersistentProperty('CONFIG_INIT_BARO_UNIT', 'HPA');
    let [metarSource] = usePersistentProperty('CONFIG_METAR_SRC', 'MSFS');

    if (metarSource === 'MSFS') {
        metarSource = 'MS';
    }

    const source = metarSource;

    const handleIcao = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        if (event.target.value.length === 4) {
            getMetar(event.target.value, source);
        } else if (event.target.value.length === 0) {
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

    if (baroType === 'AUTO') {
        baroType = getBaroTypeForAirport(props.icao);
    }

    useEffect(() => {
        getMetar(props.icao, source);
    }, [props.icao, source]);

    return (
        <div>
            {metar === undefined
                ? <p>Loading ...</p>
                : (
                    <>
                        <div className="mb-6">
                            <div className="inline-flex overflow-hidden items-center w-64">
                                <div className="ml-8">
                                    <IconCloud size={35} stroke={1.5} strokeLinejoin="miter" />
                                </div>
                                <input
                                    className="ml-4 text-2xl font-medium text-left uppercase bg-transparent border-none focus:outline-none"
                                    type="text"
                                    placeholder={props.icao}
                                    onChange={handleIcao}
                                    maxLength={4}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2">
                            <div className="text-lg text-center">
                                <div className="flex justify-center">
                                    <IconGauge className="mb-2" size={35} stroke={1.5} strokeLinejoin="miter" />
                                </div>
                                {metar.barometer ? <BaroValue /> : 'N/A'}
                            </div>
                            <div className="text-lg text-center">
                                <div className="flex justify-center">
                                    <IconWind className="mb-2" size={35} stroke={1.5} strokeLinejoin="miter" />
                                </div>
                                {metar.wind
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
                            <div className="mt-6 text-lg text-center">
                                <div className="flex justify-center">
                                    <IconTemperature className="mb-2" size={35} stroke={1.5} strokeLinejoin="miter" />
                                </div>
                                {metar.temperature
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
                            <div className="mt-6 text-lg text-center">
                                <div className="flex justify-center">
                                    <IconDroplet className="mb-2" size={35} stroke={1.5} strokeLinejoin="miter" />
                                </div>
                                {metar.dewpoint
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
                )}
        </div>
    );
};

export default WeatherWidget;
