import { ColorCode, MetarParserType, Visibility, Wind } from '../../Common/metarTypes';

/**
 * Convert METAR string into structured object.
 * Extension to the original library:  hints and functions for
 * creating a colored METAR string.
 *
 * This is based on the work of Frank Boës and his aewx-metar-parser library.
 * @see       https://github.com/fboes/metar-parser.git
 *
 * @see       https://api.checkwx.com/#31-single
 * @see       https://www.skybrary.aero/index.php/Meteorological_Terminal_Air_Report_(METAR)
 * @param     {String}  metarString raw
 * @returns   MetarParserType with structured information from src/instruments/src/Common/metarTypes.ts
 * @author    Original library: Frank Boës, Extensions: FlyByWire Simulations
 * @copyright Original library: Copyright (c) 2019 Frank Boës, Extensions: (c) 2022 FlyByWire Simulations
 * @licence   Original library: MIT License, Extensions: https://github.com/flybywiresim/a32nx/blob/master/LICENSE
 */
export function parseMetar(metarString: string): MetarParserType {
    const metarArray = metarString
        .trim()
        .replace(/^METAR\S*?\s/, '')
        // convert visibility range like `1 1/2 SM`
        .replace(/(\s)(\d)\s(\d)\/(\d)(SM)/, (all, a, b, c, d, e) => `${a + (Number(b) * Number(d) + Number(c))}/${d}${e}`)
        .split(' ');

    if (metarArray.length < 3) {
        throw new Error('Not enough METAR information found');
    }

    const metarObject: MetarParserType = {
        raw_text: metarString,
        raw_parts: metarArray,
        color_codes: Array(metarArray.length).fill(ColorCode.None),

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
        conditions: [{ code: '' }],
        clouds: [{
            code: '',
            base_feet_agl: 0,
            base_meters_agl: 0,
        }],
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

    // remove the empty initialed entries
    // this should not be necessary - how to initialize an empty nested array of a specific type?
    metarObject.conditions.pop();
    metarObject.clouds.pop();

    const calcHumidity = (temp, dew) => Math.exp((17.625 * dew) / (243.04 + dew))
        / Math.exp((17.625 * temp) / (243.04 + temp));

    const round = (value, toNext = 500) => Math.round(value / toNext) * toNext;

    // mode describes which metar part are we expecting next
    enum Mode {
        ICAO,
        DATE,
        WIND,
        VISIBILITY,
        COND,
        CLOUD,
        TEMP,
        PRESS,
        TREND,
        RMK,
        MISC,
    }
    let mode = Mode.ICAO;

    // as trend can be a complete new metar section we have this mode to not
    // store into the main object but still use coloring.
    let trendMode = false;
    metarArray.forEach((metarPart, index) => {
        let match;
        if (mode < Mode.VISIBILITY && metarPart.match(/^(\d+)(?:\/(\d+))?(SM)?$/)) {
            mode = Mode.VISIBILITY; // no wind reported
        }
        if (mode < Mode.CLOUD && metarPart.match(/^(FEW|SCT|BKN|OVC|VV)(\d+)?/)) {
            mode = Mode.CLOUD; // no visibility / conditions reported
        }
        if (mode < Mode.TEMP && metarPart.match(/^M?\d+\/M?\d+$/)) {
            mode = Mode.TEMP; // end of clouds
        }
        switch (mode) {
        case Mode.ICAO:
            // ICAO Code
            metarObject.icao = metarPart;
            metarObject.color_codes[index] = ColorCode.Highlight;
            mode = Mode.DATE;
            break;
        case Mode.DATE:
            // Observed Date
            match = metarPart.match(/^(\d\d)(\d\d)(\d\d)Z$/);
            if (match) {
                metarObject.observed = new Date();
                metarObject.observed.setUTCDate(Number(match[1]));
                metarObject.observed.setUTCHours(Number(match[2]));
                metarObject.observed.setUTCMinutes(Number(match[3]));
                mode = Mode.WIND;
            }
            break;
        case Mode.WIND:
            // Wind
            match = metarPart.match(/^(\d\d\d|VRB)P?(\d+)(?:G(\d+))?(KT|MPS|KPH)/);
            if (match) {
                match[2] = Number(match[2]);
                match[3] = match[3] ? Number(match[3]) : match[2];
                if (match[4] === 'KPH') {
                    match[2] = convert.kphToMps(match[2]);
                    match[3] = convert.kphToMps(match[3]);
                    match[4] = 'MPS';
                }

                const tmpWind: Wind = {
                    degrees: (match[1] === 'VRB') ? 180 : Number(match[1]),
                    degrees_from: (match[1] === 'VRB') ? 0 : Number(match[1]),
                    degrees_to: (match[1] === 'VRB') ? 359 : Number(match[1]),
                    speed_kts: (match[4] === 'MPS') ? convert.mpsToKts(match[2]) : match[2],
                    speed_mps: (match[4] === 'MPS') ? match[2] : convert.ktsToMps(match[2]),
                    gust_kts: (match[4] === 'MPS') ? convert.mpsToKts(match[3]) : match[3],
                    gust_mps: (match[4] === 'MPS') ? match[3] : convert.ktsToMps(match[3]),
                };

                // coloring
                if (tmpWind.gust_kts > 30) {
                    metarObject.color_codes[index] = ColorCode.Warning;
                } else if (metarObject.wind.gust_kts > 20) {
                    metarObject.color_codes[index] = ColorCode.Caution;
                }

                // only write to the object for the main section
                if (!trendMode) {
                    metarObject.wind = tmpWind;
                }
                mode = Mode.VISIBILITY;
            }
            break;
        case Mode.VISIBILITY:
            // Visibility
            match = metarPart.match(/^(\d+)(?:\/(\d+))?(SM)?$/);
            if (match) {
                const speed: number = (match[2])
                    ? Number(match[1]) / Number(match[2])
                    : Number(match[1]);

                const tmpVisibility: Visibility = {
                    miles: (match[3] && match[3] === 'SM') ? speed.toString() : convert.metersToMiles(speed).toString(),
                    miles_float: (match[3] && match[3] === 'SM') ? speed : convert.metersToMiles(speed),
                    meters: (match[3] && match[3] === 'SM') ? convert.milesToMeters(speed).toString() : speed.toString(),
                    meters_float: (match[3] && match[3] === 'SM') ? convert.milesToMeters(speed) : speed,
                };

                // coloring
                if (tmpVisibility.meters_float < 1000.0) {
                    metarObject.color_codes[index] = ColorCode.Warning;
                } else if (tmpVisibility.meters_float < 5000.0) {
                    metarObject.color_codes[index] = ColorCode.Caution;
                }

                // only write to the object for the main section
                if (!trendMode) {
                    metarObject.visibility = tmpVisibility;
                }

                mode = Mode.COND;
            } else if (metarPart === 'CAVOK'
                || metarPart === 'CLR'
                || metarPart === 'NCD') {
                // only write to the object for the main section
                if (!trendMode) {
                    metarObject.visibility = {
                        miles: '10',
                        miles_float: 10,
                        meters: convert.milesToMeters(10).toString(),
                        meters_float: convert.milesToMeters(10),
                    };
                }
                mode = Mode.CLOUD; // no clouds & conditions reported
            } else if (metarObject.wind) {
                // Variable wind direction
                match = metarPart.match(/^(\d+)V(\d+)$/);
                // only write to the object for the main section
                if (match && !trendMode) {
                    metarObject.wind.degrees_from = Number(match[1]);
                    metarObject.wind.degrees_to = Number(match[2]);
                }
            }
            break;
        case Mode.COND:
            // Conditions
            match = metarPart.match(/^(\+|-|VC|RE)?([A-Z][A-Z])([A-Z][A-Z])?([A-Z][A-Z])?$/);
            if (match) {
                // only write to the object for the main section
                if (!trendMode) {
                    // may occur multiple times
                    match.filter((m, index) => (index !== 0 && m))
                        .forEach((m) => {
                            metarObject.conditions.push({ code: m });
                        });
                }

                // coloring
                // TODO: think of a more correct and efficient way
                if (
                    match[1] === '+'
                        || match[2] === 'FZ' || match[2] === 'TS' || match[2] === 'ST' || match[2] === 'SQ' || match[2] === 'SS' || match[2] === 'DS'
                        || match[3] === 'FZ' || match[3] === 'TS' || match[3] === 'ST' || match[3] === 'SQ' || match[3] === 'SS' || match[3] === 'DS'
                        || match[4] === 'FZ' || match[4] === 'TS' || match[4] === 'ST' || match[4] === 'SQ' || match[4] === 'SS' || match[4] === 'DS'
                ) {
                    metarObject.color_codes[index] = ColorCode.Warning;
                } else if (
                    match[2] === 'RA' || match[2] === 'SN' || match[2] === 'FG' || match[2] === 'VA'
                        || match[3] === 'RA' || match[3] === 'SN' || match[3] === 'FG' || match[3] === 'VA'
                        || match[4] === 'RA' || match[4] === 'SN' || match[4] === 'FG' || match[4] === 'VA'
                        || (match[2] === 'VC' && match[3] === 'SH')
                ) {
                    metarObject.color_codes[index] = ColorCode.Caution;
                }
            }
            break;
        case Mode.CLOUD:
            // Clouds
            match = metarPart.match(/^(FEW|SCT|BKN|OVC|VV)(\d+)/);
            if (match) {
                match[2] = Number(match[2]) * 100;
                const cloud = {
                    code: match[1],
                    base_feet_agl: match[2],
                    base_meters_agl: convert.feetToMeters(match[2]),
                };

                // only write to the object for the main section
                if (!trendMode) metarObject.clouds.push(cloud);

                if (match[2] <= 300) {
                    metarObject.color_codes[index] = ColorCode.Warning;
                } else if (match[3] || match[2] < 800) {
                    metarObject.color_codes[index] = ColorCode.Caution;
                }
            }
            break;
        case Mode.TEMP:
            // Temperature
            match = metarPart.match(/^(M?\d+)\/(M?\d+)$/);
            if (match) {
                match[1] = Number(match[1].replace('M', '-'));
                match[2] = Number(match[2].replace('M', '-'));
                const tmpTemperature = {
                    celsius: match[1],
                    fahrenheit: convert.celsiusToFahrenheit(match[1]),
                };
                const tmpDewpoint = {
                    celsius: match[2],
                    fahrenheit: convert.celsiusToFahrenheit(match[2]),
                };
                const tmpHumidityPercent = calcHumidity(match[1], match[2]) * 100;

                // only write to the object for the main section
                if (!trendMode) {
                    metarObject.temperature = tmpTemperature;
                    metarObject.dewpoint = tmpDewpoint;
                    metarObject.humidity_percent = tmpHumidityPercent;
                }

                if (tmpTemperature.celsius < -20) {
                    metarObject.color_codes[index] = ColorCode.Warning;
                } else if (tmpTemperature.celsius < 8) {
                    metarObject.color_codes[index] = ColorCode.Caution;
                }
                mode = Mode.PRESS;
            }
            break;
        case Mode.PRESS:
            // Pressure
            match = metarPart.match(/^(Q|A)(\d+)/);
            if (match && !trendMode) {
                match[2] = Number(match[2]);
                match[2] /= (match[1] === 'Q') ? 10 : 100;
                metarObject.barometer = {
                    hg: (match[1] === 'Q') ? convert.kpaToInhg(match[2]) : match[2],
                    kpa: (match[1] === 'Q') ? match[2] : convert.inhgToKpa(match[2]),
                    mb: (match[1] === 'Q') ? match[2] * 10 : convert.inhgToKpa(match[2] * 10),
                };
                mode = Mode.TREND;
            }
            break;
        case Mode.TREND:
            // TREND
            match = metarPart.match(/^(RMK|NOISG|BECMG|TEMPO)(.*)/);
            if (match) {
                switch (match[1]) {
                case 'TEMPO':
                    metarObject.color_codes[index] = ColorCode.TrendMarker;
                    trendMode = true;
                    mode = Mode.WIND;
                    break;
                case 'BECMG':
                    metarObject.color_codes[index] = ColorCode.TrendMarker;
                    trendMode = true;
                    break;
                case 'RMK':
                    metarObject.color_codes[index] = ColorCode.Info;
                    mode = Mode.RMK;
                    break;
                default:
                    break;
                }
            }
            break;
        default:
            // Rest
            match = metarPart.match(/^(.*)$/);
            if (match) {
                metarObject.color_codes[index] = ColorCode.Info;
            }
            break;
        }
    });

    if (!metarObject.visibility) {
        metarObject.visibility = {
            miles: '10',
            miles_float: 10,
            meters: convert.milesToMeters(10).toString(),
            meters_float: convert.milesToMeters(10),
        };
    }

    // Finishing touches

    metarObject.visibility.miles = String(round(metarObject.visibility.miles, 0.5));
    metarObject.visibility.meters = String(round(metarObject.visibility.meters));

    if (metarObject.clouds.length) {
        const highestCloud = metarObject.clouds[metarObject.clouds.length - 1];
        metarObject.ceiling = {
            code: highestCloud.code,
            feet_agl: highestCloud.base_feet_agl,
            meters_agl: highestCloud.base_meters_agl,
        };
    }

    metarObject.flight_category = '';
    if (metarObject.visibility.miles_float > 5
        && (!metarObject.ceiling || metarObject.ceiling.feet_agl > 3000)
    ) {
        metarObject.flight_category = 'VFR';
    } else if (metarObject.visibility.miles_float >= 3
        && (!metarObject.ceiling || metarObject.ceiling.feet_agl >= 1000)
    ) {
        metarObject.flight_category = 'MVFR';
    } else if (metarObject.visibility.miles_float >= 1
        && (!metarObject.ceiling || metarObject.ceiling.feet_agl >= 500)
    ) {
        metarObject.flight_category = 'IFR';
    } else {
        metarObject.flight_category = 'LIFR';
    }

    return metarObject;
}

/**
 * Returns a preformatted HTML string with coloring for METAR parts marked with
 * coloring hints.
 * ColorCode: src/instruments/src/Common/metarTypes.ts
 * @param metar
 */
export function getColoredMetar(metar: MetarParserType): string {
    let coloredMetar: string = '';
    metar.raw_parts.forEach((metarPart, index) => {
        switch (metar.color_codes[index]) {
        case ColorCode.Highlight:
            coloredMetar += `<span class='text-teal-regular'>${metar.raw_parts[index]}</span> `;
            break;
        case ColorCode.Info:
            coloredMetar += `<span class='text-gray-500'>${metar.raw_parts[index]}</span> `;
            break;
        case ColorCode.Caution:
            coloredMetar += `<span class='text-yellow-500'>${metar.raw_parts[index]}</span> `;
            break;
        case ColorCode.Warning:
            coloredMetar += `<span class='text-red-600'>${metar.raw_parts[index]}</span> `;
            break;
        case ColorCode.TrendMarker:
            coloredMetar += `<span class='underline font-bold text-gray-500'>${metar.raw_parts[index]}</span> `;
            break;
        case ColorCode.None:
        default:
            coloredMetar += `${metar.raw_parts[index]} `;
        }
    });
    return coloredMetar;
}

const convert = {
    celsiusToFahrenheit(celsius) {
        return celsius * 1.8 + 32;
    },

    feetToMeters(feet) {
        return feet * 0.3048;
    },

    milesToMeters(miles) {
        return miles * 1609.344;
    },

    metersToMiles(meters) {
        return meters / 1609.344;
    },

    inhgToKpa(inHg) {
        return inHg / 0.29529988;
    },

    kpaToInhg(kpa) {
        return kpa * 0.29529988;
    },

    kphToMps(kph) {
        return kph / 3600 * 1000;
    },

    mpsToKts(mps) {
        return mps * 1.9438445;
    },

    ktsToMps(kts) {
        return kts / 1.9438445;
    },
};
