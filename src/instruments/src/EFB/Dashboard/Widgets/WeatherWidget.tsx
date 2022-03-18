// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState } from 'react';
import { Metar } from '@flybywiresim/api-client';
import { IconCloud, IconDroplet, IconGauge, IconPoint, IconTemperature, IconWind } from '@tabler/icons';
import { parseMetar } from '../../Utils/parseMetar';
import { MetarParserType } from '../../../Common/metarTypes';
import { usePersistentNumberProperty, usePersistentProperty } from '../../../Common/persistence';
import SimpleInput from '../../Components/Form/SimpleInput/SimpleInput';
import { ColoredMetar } from './ColorMetar';

const MetarParserTypeProp: MetarParserType = {
    raw_text: '',
    raw_parts: [],
    color_codes: [],
    icao: '',
    observed: new Date(0),
    wind: {
        degrees: 0,
        degrees_from: 0,
        degrees_to: 0,
        speed_kts: 0,
        speed_mps: 0,
        gust_kts: 0,
        gust_mps: 0,
    },
    visibility: {
        miles: '',
        miles_float: 0.0,
        meters: '',
        meters_float: 0.0,
    },
    conditions: [],
    clouds: [],
    ceiling: {
        code: '',
        feet_agl: 0,
        meters_agl: 0,
    },
    temperature: {
        celsius: 0,
        fahrenheit: 0,
    },
    dewpoint: {
        celsius: 0,
        fahrenheit: 0,
    },
    humidity_percent: 0,
    barometer: {
        hg: 0,
        kpa: 0,
        mb: 0,
    },
    flight_category: '',
};

type WeatherWidgetProps = { name: string, editIcao: string, icao: string };

const WeatherWidget = (props: WeatherWidgetProps) => {
    const [metar, setMetar] = useState<MetarParserType>(MetarParserTypeProp);
    const [showMetar, setShowMetar] = usePersistentProperty(`CONFIG_SHOW_METAR_${props.name}`, 'DISABLED');
    const [baroType] = usePersistentProperty('CONFIG_INIT_BARO_UNIT', 'HPA');
    const [metarSource] = usePersistentProperty('CONFIG_METAR_SRC', 'MSFS');
    const source = metarSource === 'MSFS' ? 'MS' : metarSource;
    const [metarError, setErrorMetar] = useState('NO ICAO PROVIDED');
    const [usingColoredMetar] = usePersistentNumberProperty('EFB_USING_COLOREDMETAR', 1);

    const getBaroTypeForAirport = (icao: string) => (['K', 'C', 'M', 'P', 'RJ', 'RO', 'TI', 'TJ']
        .some((r) => icao.toUpperCase().startsWith(r)) ? 'IN HG' : 'HPA');

    const BaroValue = () => {
        const displayedBaroType = baroType === 'AUTO' ? getBaroTypeForAirport(metar.icao) : baroType;
        if (displayedBaroType === 'IN HG') {
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

    const handleIcao = (icao: string) => {
        if (icao.length > 0) {
            getMetar(icao, source);
        } else if (icao.length === 0) {
            getMetar(props.icao, source);
        }
    };

    function getMetar(icao: any, source: any) {
        if (icao.length !== 4 || icao === '----') {
            return new Promise(() => {
                setErrorMetar('NO ICAO PROVIDED');
                setMetar(MetarParserTypeProp);
            });
        }

        return Metar.get(icao, source)
            .then((result) => {
                // For METAR source Microsoft result.metar is undefined without throwing an error.
                // For the other METAR sources an error is thrown (Request failed with status code 404)
                // and caught in the catch clause.
                if (!result.metar) {
                    setErrorMetar('ICAO INVALID OR NO METAR AVAILABLE');
                    setMetar(MetarParserTypeProp);
                    return;
                }
                // Catch parsing error separately
                try {
                    const metarParse = parseMetar(result.metar);
                    setMetar(metarParse);
                } catch (err) {
                    console.log(`Error while parsing Metar ("${result.metar}"): ${err}`);
                    setErrorMetar(`RECEIVED METAR COULD NOT BE PARSED: ${err.toString().replace(/^Error: /, '').toUpperCase()}`);
                    setMetar(MetarParserTypeProp);
                }
            })
            // catch retrieving metar errors
            .catch((err) => {
                console.log(`Error while retrieving Metar: ${err}`);
                if (err.toString().match(/^Error:/)) {
                    setErrorMetar('ICAO INVALID OR NO METAR AVAILABLE');
                } else {
                    setErrorMetar(`${err.toString().replace(/^Error: /, '')}`);
                }
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
                                className="text-center w-32 ml-4 text-2xl font-medium uppercase"
                                placeholder={props.icao}
                                value={props.icao === '----' ? '' : props.icao}
                                onChange={(value) => handleIcao(value)}
                                maxLength={4}
                            />
                            <div className="ml-6">
                                <button
                                    type="button"
                                    className="mr-1 w-24 bg-gray-600 p-2 flex items-center justify-center rounded-lg focus:outline-none text-lg"
                                    onClick={() => setShowMetar(showMetar === 'ENABLED' ? 'DISABLED' : 'ENABLED')}
                                >
                                    {showMetar === 'ENABLED' ? 'Metar' : 'Summary'}
                                </button>
                            </div>
                        </div>
                        {showMetar === 'DISABLED'
                            ? (
                                <>
                                    <div className="grid grid-cols-2 h-40">
                                        <div className="justify-left text-center text-lg">
                                            <div className="flex justify-center">
                                                <IconGauge
                                                    className="mb-2"
                                                    size={35}
                                                    stroke={1.5}
                                                    strokeLinejoin="miter"
                                                />
                                            </div>
                                            {metar.raw_text ? (
                                                <>
                                                    {metar.barometer ? <BaroValue /> : 'N/A'}
                                                </>
                                            ) : (
                                                <>
                                                    N/A
                                                </>
                                            )}
                                        </div>
                                        <div className="justify-left text-center text-lg">
                                            <div className="flex justify-center">
                                                <IconWind
                                                    className="mb-2"
                                                    size={35}
                                                    stroke={1.5}
                                                    strokeLinejoin="miter"
                                                />
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
                                                <IconTemperature
                                                    className="mb-2"
                                                    size={35}
                                                    stroke={1.5}
                                                    strokeLinejoin="miter"
                                                />
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
                                                <IconDroplet
                                                    className="mb-2"
                                                    size={35}
                                                    stroke={1.5}
                                                    strokeLinejoin="miter"
                                                />
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
                                    <div className="font-mono scrollbar text-left ml-8 mr-4 h-40 text-xl">
                                        {metar.raw_text
                                            ? (
                                                <>
                                                    {usingColoredMetar
                                                        ? (
                                                            <>
                                                                <ColoredMetar metar={metar} />
                                                            </>
                                                        ) : (
                                                            <>
                                                                {metar.raw_text}
                                                            </>
                                                        )}
                                                </>
                                            ) : (
                                                <>
                                                    {metarError}
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
