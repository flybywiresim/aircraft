import React, { useEffect, useState } from 'react';
import metarParser from 'aewx-metar-parser';
import { Metar } from '@flybywiresim/api-client';
import { IconCloud, IconDroplet, IconGauge, IconPoint, IconTemperature, IconWind } from '@tabler/icons';
import { MetarParserType, Wind } from '@instruments/common/metarTypes';
import { usePersistentProperty } from '@instruments/common/persistence';
import { SimpleInput } from '../../UtilComponents/Form/SimpleInput/SimpleInput';

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

export const WeatherWidget = (props: WeatherWidgetProps) => {
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
                        <div className="inline-flex items-center mb-8 w-80">
                            <div className="ml-6">
                                <IconCloud size={35} stroke={1.5} strokeLinejoin="miter" />
                            </div>
                            <SimpleInput
                                noLabel
                                className="ml-4 w-24 text-2xl font-medium text-center uppercase"
                                placeholder={props.icao}
                                value={props.icao === '----' ? '' : props.icao}
                                onChange={(value) => handleIcao(value)}
                                maxLength={4}
                            />
                            <div className="ml-6">
                                <button
                                    type="button"
                                    className="flex justify-center items-center p-2 mr-1 w-24 text-lg bg-gray-600 rounded-lg focus:outline-none"
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
                                        <div className="text-lg text-center justify-left">
                                            <div className="flex justify-center">
                                                <IconGauge className="mb-2" size={35} stroke={1.5} strokeLinejoin="miter" />
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
                                        <div className="text-lg text-center justify-left">
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
                                        <div className="mt-6 text-lg text-center">
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
                                        <div className="overflow-y-scroll mt-6 text-lg text-center">
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
                                    <div className="mr-4 ml-8 h-40 text-xl font-medium text-left scrollbar">
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
