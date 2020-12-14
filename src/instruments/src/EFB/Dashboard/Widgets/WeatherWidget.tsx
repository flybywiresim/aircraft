/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, { useEffect, useState } from 'react';
import metarParser from 'aewx-metar-parser';
import { formatTime, dateFormat} from "../../StatusBar/StatusBar";
import { Metar } from '@flybywiresim/api-client';
import { IconWind } from '@tabler/icons';
import { IconGauge } from '@tabler/icons';
import { IconDroplet } from '@tabler/icons';
import { IconTemperature } from '@tabler/icons';
import { IconAccessPoint } from '@tabler/icons';
import { IconPoint } from '@tabler/icons';

declare type MetarParserType = {
    raw_text: string,
    raw_parts: [string],
    icao: string,
    observed: Date,
    wind: Wind,
    visibility: Visibility,
    conditions: [ConditionCode],
    clouds: [Cloud],
    ceiling: Ceiling,
    temperature: Temperature,
    dewpoint: Dewpoint,
    humidity_percent: number,
    barometer: Barometer,
    flight_category: string,
}

type Wind = {
    degrees: number,
    speed_kts: number,
    speed_mps: number,
    gust_kts: number,
    gust_mps: number,
};

type Visibility = {
    miles: string,
    miles_float: number,
    meters: string,
    meters_float: number,
};

type ConditionCode = {
    code: string,
};

type Cloud = {
    code: string,
    base_feet_agl: number,
    base_meters_agl: number,
};

type Ceiling = {
    code: string,
    feet_agl: number,
    meters_agl: number,
};

type Temperature = {
    celsius: number,
    fahrenheit: number,
};

type Dewpoint = {
    celsius: number,
    fahrenheit: number,
};

type Barometer = {
    hg: number,
    kpa: number,
    mb: number,
};

const MetarParserTypeWindState: Wind = {
    degrees:   0,
    speed_kts: 0,
    speed_mps: 0,
    gust_kts:  0,
    gust_mps:  0
};

const Visibility = {
    miles:        "",
    miles_float:  0.0,
    meters:       "",
    meters_float: 0.0,
};

const ConditionCode = {
    code: "",
};

const Cloud = {
    code:            "",
    base_feet_agl:   0,
    base_meters_agl: 0,
};

const Ceiling = {
    code:       "",
    feet_agl:   0,
    meters_agl: 0,
};

const Temperature = {
    celsius:    0,
    fahrenheit: 0,
};

const Dewpoint = {
    celsius:    0,
    fahrenheit: 0,
};

const Barometer = {
    hg:     0,
    kpa:    0,
    mb:     0,
};

const MetarParserTypeState: MetarParserType = {
    raw_text: "",
    raw_parts: [""],
    icao: "",
    observed: new Date,
    wind: MetarParserTypeWindState,
    visibility: Visibility,
    conditions: [ConditionCode],
    clouds: [Cloud],
    ceiling: Ceiling,
    temperature: Temperature,
    dewpoint: Dewpoint,
    humidity_percent: 0,
    barometer: Barometer,
    flight_category: "",
};

const MetarParserTypeProp: MetarParserType = {
    raw_text: "",
    raw_parts: [""],
    icao: "",
    observed: new Date(0),
    wind: MetarParserTypeWindState,
    visibility: Visibility,
    conditions: [ConditionCode],
    clouds: [Cloud],
    ceiling: Ceiling,
    temperature: Temperature,
    dewpoint: Dewpoint,
    humidity_percent: 0,
    barometer: Barometer,
    flight_category: "",
};

type WeatherWidgetProps = { name: string, editIcao: string, icao: string };

const WeatherWidget = (props: WeatherWidgetProps) => {

    const [metar, setMetar] = useState<MetarParserType>(MetarParserTypeProp);
    const [modalStatus, setModalStatus] = useState(false);
    const [icon, setIcon] = useState("wi wi-cloud");

    // This could be modified using the Settings tab perhaps?
    const source = "vatsim";

    const handleIcao = (event: { target: { value: React.SetStateAction<string>; }; }) => {
        if (event.target.value.length === 4) {
            getMetar(event.target.value, source);
        } else if (event.target.value.length === 0) {
            getMetar(props.icao, source);
        }
    };

    function getMetar(icao:any, source: any) {
        if (icao.length !== 4) {
            return new Promise(() => {
                setMetar(MetarParserTypeProp);
            });
        }
        return Metar.get(icao, source)
            .then(result => {
                const metarParse = metarParser(result.metar);
                console.info(metarParse);
                setMetar(metarParse);
            })
            .catch(() => {
                setMetar(MetarParserTypeProp);
            });
    }

    useEffect(() => {
        getMetar(props.icao, source);
    }, [props.icao]);

    function showModal() {
        setModalStatus(!modalStatus);
    }

    return (
        <div className='weather-card' id={'weather-card-' + props.name}>
            {metar === undefined ?
                <p>Loading ...</p>
                :
                <><div id="OneByTwo">
                    <div className="icao">
                        {props.editIcao == "yes" ?
                            <>
                                <input id="icaoInput"
                                    type="text"
                                    placeholder={props.icao}
                                    onChange={handleIcao} />
                            </>
                            :
                            metar.icao
                        }
                    </div>
                </div>
                {modalStatus ?
                    <div id="MetarModal">
                        <p>{metar.raw_text}</p>
                    </div>
                    :
                    <div id="TwoByTwo">
                        <div className="col">
                            <span className="big">
                                <IconGauge size={45} stroke={1.5} strokeLinejoin="miter" />
                            </span><br />{metar.barometer.mb.toFixed(0)}
                            <span className="unit">mb</span>
                        </div>
                        <div className="col">
                            <span className="big">
                                <IconWind size={45} stroke={1.5} strokeLinejoin="miter" />
                            </span><br />{metar.wind.degrees.toFixed(0)}<IconPoint size={20} stroke={1.5} strokeLinejoin="miter" />/{metar.wind.speed_kts.toFixed(0)}
                            <span className="unit">kts</span>
                        </div>
                        <div>
                            <span className="big">
                                <IconTemperature size={45} stroke={1.5} strokeLinejoin="miter" />
                            </span><br />{metar.temperature.celsius.toFixed(0)}<IconPoint size={20} stroke={1.5} strokeLinejoin="miter" />
                            <span className="unit">C</span>
                        </div>
                        <div>
                            <span className="big">
                                <IconDroplet size={45} stroke={1.5} strokeLinejoin="miter" />
                            </span><br />{metar.dewpoint.celsius.toFixed(0)}<IconPoint size={20} stroke={1.5} strokeLinejoin="miter" />
                            <span className="unit">C</span>
                        </div>
                    </div>
                }
                <div className="icao-ident">
                    <div className="icao-update">
                        <IconAccessPoint size={25} stroke={1.5} strokeLinejoin="miter" /> &nbsp; Last Updated {dateFormat(metar.observed.getUTCDate()) + " at " + formatTime(([metar.observed.getUTCHours(), metar.observed.getUTCMinutes()]))}z
                    </div>
                </div>
                </>
            }
        </div>
    );
};

export default WeatherWidget;