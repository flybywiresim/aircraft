import { ColorCode, MetarParserType } from '../../Common/metarTypes';

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

    const calcHumidity = (temp, dew) => Math.exp((17.625 * dew) / (243.04 + dew))
        / Math.exp((17.625 * temp) / (243.04 + temp));

    const round = (value, toNext = 500) => Math.round(value / toNext) * toNext;

    let mode = 0;
    let index = 0;
    metarArray.forEach((metarPart) => {
        let match;
        if (mode < 3 && metarPart.match(/^(\d+)(?:\/(\d+))?(SM)?$/)) {
            mode = 3; // no wind reported
        }
        if (mode < 5 && metarPart.match(/^(FEW|SCT|BKN|OVC|VV)(\d+)?/)) {
            mode = 5; // no visibility / conditions reported
        }
        if (mode < 6 && metarPart.match(/^M?\d+\/M?\d+$/)) {
            mode = 6; // end of clouds
        }
        switch (mode) {
        case 0:
            // ICAO Code
            metarObject.icao = metarPart;
            metarObject.color_codes[index] = ColorCode.Highlight;
            mode = 1;
            break;
        case 1:
            // Observed Date
            match = metarPart.match(/^(\d\d)(\d\d)(\d\d)Z$/);
            if (match) {
                metarObject.observed = new Date();
                metarObject.observed.setUTCDate(Number(match[1]));
                metarObject.observed.setUTCHours(Number(match[2]));
                metarObject.observed.setUTCMinutes(Number(match[3]));
                mode = 2;
            }
            break;
        case 2:
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
                metarObject.wind = {
                    degrees: (match[1] === 'VRB') ? 180 : Number(match[1]),
                    degrees_from: (match[1] === 'VRB') ? 0 : Number(match[1]),
                    degrees_to: (match[1] === 'VRB') ? 359 : Number(match[1]),
                    speed_kts: (match[4] === 'MPS') ? convert.mpsToKts(match[2]) : match[2],
                    speed_mps: (match[4] === 'MPS') ? match[2] : convert.ktsToMps(match[2]),
                    gust_kts: (match[4] === 'MPS') ? convert.mpsToKts(match[3]) : match[3],
                    gust_mps: (match[4] === 'MPS') ? match[3] : convert.ktsToMps(match[3]),
                };
                if (metarObject.wind.gust_kts > 30) {
                    metarObject.color_codes[index] = ColorCode.Warning;
                } else if (metarObject.wind.gust_kts > 20) {
                    metarObject.color_codes[index] = ColorCode.Caution;
                }
                mode = 3;
            }
            break;
        case 3:
            // Visibility
            match = metarPart.match(/^(\d+)(?:\/(\d+))?(SM)?$/);
            if (match) {
                const speed: number = (match[2])
                    ? Number(match[1]) / Number(match[2])
                    : Number(match[1]);
                metarObject.visibility = {
                    miles: (match[3] && match[3] === 'SM') ? speed.toString() : convert.metersToMiles(speed).toString(),
                    miles_float: (match[3] && match[3] === 'SM') ? speed : convert.metersToMiles(speed),
                    meters: (match[3] && match[3] === 'SM') ? convert.milesToMeters(speed).toString() : speed.toString(),
                    meters_float: (match[3] && match[3] === 'SM') ? convert.milesToMeters(speed) : speed,
                };
                if (metarObject.visibility.meters_float < 1000.0) {
                    metarObject.color_codes[index] = ColorCode.Warning;
                } else if (metarObject.visibility.meters_float < 5000.0) {
                    metarObject.color_codes[index] = ColorCode.Caution;
                }
                mode = 4;
            } else if (metarPart === 'CAVOK' || metarPart === 'CLR') {
                metarObject.visibility = {
                    miles: '10',
                    miles_float: 10,
                    meters: convert.milesToMeters(10).toString(),
                    meters_float: convert.milesToMeters(10),
                };
                mode = 5; // no clouds & conditions reported
            } else if (metarObject.wind) {
                // Variable wind direction
                match = metarPart.match(/^(\d+)V(\d+)$/);
                if (match) {
                    metarObject.wind.degrees_from = Number(match[1]);
                    metarObject.wind.degrees_to = Number(match[2]);
                }
            }
            break;
        case 4:
            // Conditions
            // remove the empty initialed entry
            if (metarObject.conditions.length === 1 && metarObject.conditions[0].code === '') {
                metarObject.conditions.pop();
            }
            match = metarPart.match(/^(\+|-|VC|RE)?([A-Z][A-Z])([A-Z][A-Z])?([A-Z][A-Z])?$/);
            if (match) {
                // may occur multiple times
                match.filter((m, index) => (index !== 0 && m))
                    .forEach((m) => {
                        metarObject.conditions.push({ code: m });
                    });
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
        case 5:
            // Clouds
            // remove the empty initialed entry
            if (metarObject.clouds.length === 1 && metarObject.clouds[0].code === '') {
                metarObject.clouds.pop();
            }
            match = metarPart.match(/^(FEW|SCT|BKN|OVC|VV)(\d+)/);
            if (match) {
                match[2] = Number(match[2]) * 100;
                const cloud = {
                    code: match[1],
                    base_feet_agl: match[2],
                    base_meters_agl: convert.feetToMeters(match[2]),
                };
                metarObject.clouds.push(cloud);

                if (match[2] <= 300) {
                    metarObject.color_codes[index] = ColorCode.Warning;
                } else if (match[3] || match[2] < 800) {
                    metarObject.color_codes[index] = ColorCode.Caution;
                }
            }
            break;
        case 6:
            // Temperature
            match = metarPart.match(/^(M?\d+)\/(M?\d+)$/);
            if (match) {
                match[1] = Number(match[1].replace('M', '-'));
                match[2] = Number(match[2].replace('M', '-'));
                metarObject.temperature = {
                    celsius: match[1],
                    fahrenheit: convert.celsiusToFahrenheit(match[1]),
                };
                metarObject.dewpoint = {
                    celsius: match[2],
                    fahrenheit: convert.celsiusToFahrenheit(match[2]),
                };
                metarObject.humidity_percent = calcHumidity(match[1], match[2]) * 100;
                if (metarObject.temperature.celsius < -20) {
                    metarObject.color_codes[index] = ColorCode.Warning;
                } else if (metarObject.temperature.celsius < 8) {
                    metarObject.color_codes[index] = ColorCode.Caution;
                }
                mode = 7;
            }
            break;
        case 7:
            // Pressure
            match = metarPart.match(/^(Q|A)(\d+)/);
            if (match) {
                match[2] = Number(match[2]);
                match[2] /= (match[1] === 'Q') ? 10 : 100;
                metarObject.barometer = {
                    hg: (match[1] === 'Q') ? convert.kpaToInhg(match[2]) : match[2],
                    kpa: (match[1] === 'Q') ? match[2] : convert.inhgToKpa(match[2]),
                    mb: (match[1] === 'Q') ? match[2] * 10 : convert.inhgToKpa(match[2] * 10),
                };
                mode = 8;
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
        index++;
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

    if (metarObject.clouds) {
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
            coloredMetar += `<span class='text-theme-highlight'>${metar.raw_parts[index]}</span> `;
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
