// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ColorCode } from '../../Common/metarTypes';
import { parseMetar } from './parseMetar';

describe('parseMetar', () => {
    it('throws an error when provided with an undefined value', () => {
        // undefined metar string
        let undefString: string;
        expect(() => {
            parseMetar(undefString);
        }).toThrow(new Error('METAR not available'));
    });

    it('throws an error when provided with an empty value', () => {
        // empty metar string
        expect(() => {
            parseMetar('');
        }).toThrow(new Error('METAR data incomplete'));
    });

    it('throws an error when provided with an incomplete value', () => {
        // empty metar string
        expect(() => {
            parseMetar('EDDM 291250Z');
        }).toThrow(new Error('METAR data incomplete'));
    });

    it('throws an error when provided with an incorrect ICAO value', () => {
        // ICAO contain _
        expect(() => {
            parseMetar('E_DM 291350Z 26017KT 9999 DZ BKN027 09/00 Q1025 NOSIG');
        }).toThrow(/Invalid ICAO/);

        // ICAO too short
        expect(() => {
            parseMetar('EDD 291350Z 26017KT 9999 DZ BKN027 09/00 Q1025 NOSIG');
        }).toThrow(/Invalid ICAO/);

        // No ICAO
        expect(() => {
            parseMetar('291350Z 26017KT 9999 DZ BKN027 09/00 Q1025 NOSIG');
        }).toThrow(/Invalid ICAO/);
    });

    it('throws an error when provided with an incorrect date value', () => {
        // date too short
        expect(() => {
            parseMetar('EDDM 29350Z 26017KT 9999 DZ BKN027 09/00 Q1025 NOSIG');
        }).toThrow(/Invalid date/);

        // date with invalid character
        expect(() => {
            parseMetar('EDDM 29135xZ 26017KT 9999 DZ BKN027 09/00 Q1025 NOSIG');
        }).toThrow(/Invalid date/);

        // date without Z
        expect(() => {
            parseMetar('EDDM 291350 26017KT 9999 DZ BKN027 09/00 Q1025 NOSIG');
        }).toThrow(/Invalid date/);

        // date without U instead of Z
        expect(() => {
            parseMetar('EDDM 291350U 26017KT 9999 DZ BKN027 09/00 Q1025 NOSIG');
        }).toThrow(/Invalid date/);
    });

    it('throws an error when provided with an incorrect pressure value', () => {
        // pressure too short
        expect(() => {
            parseMetar('EDDM 291350Z 26017KT 9999 DZ BKN027 09/00 Qabc NOSIG');
        }).toThrow(/Invalid or missing pressure/);

        // pressure with decimal point
        expect(() => {
            parseMetar('KJFK 291451Z 34027G34KT M09/M11 A29.67');
        }).toThrow(/Invalid or missing pressure/);
    });
});

describe('Test real life METARs:', () => {
    test('EDDM 291350Z 26017KT 9999 DZ BKN027 09/00 Q1025 NOSIG', () => {
        const metarObject = parseMetar('EDDM 281350Z 26017KT 9999 DZ BKN027 09/00 Q1025 NOSIG');
        expect(metarObject.icao).toBe('EDDM');
        expect(metarObject.observed.getUTCDate()).toBe(28);
        expect(metarObject.observed.getUTCHours()).toBe(13);
        expect(metarObject.observed.getUTCMinutes()).toBe(50);
        expect(metarObject.wind.speed_kts).toBe(17);
        expect(metarObject.wind.gust_kts).toBe(17);
        expect(metarObject.wind.degrees).toBe(260);
        expect(metarObject.wind.degrees_from).toBe(260);
        expect(metarObject.wind.degrees_to).toBe(260);
        expect(metarObject.visibility.meters_float).toBe(9999);
        expect(metarObject.visibility.meters).toBe('10000');
        expect(metarObject.visibility.miles_float).toBe(6.213090551181102);
        expect(metarObject.visibility.miles).toBe('6');
        expect(metarObject.conditions).toHaveLength(1);
        expect(metarObject.conditions[0].code).toBe('DZ');
        expect(metarObject.clouds).toHaveLength(1);
        expect(metarObject.clouds[0].code).toBe('BKN');
        expect(metarObject.clouds[0].base_feet_agl).toBe(2700);
        expect(metarObject.temperature.celsius).toBe(9);
        expect(metarObject.dewpoint.celsius).toBe(0);
        expect(metarObject.barometer.mb).toBe(1025);
        expect(metarObject.barometer.hg).toBe(30.2682377);
        expect(metarObject.barometer.kpa).toBe(102.5);
        expect(metarObject.color_codes).toEqual(
            [ColorCode.Highlight, // EDDM
                ColorCode.None, // 291350Z
                ColorCode.None, // 26017KT
                ColorCode.None, // 9999
                ColorCode.None, // DZ
                ColorCode.None, // BKN027
                ColorCode.None, // 09/00
                ColorCode.None, // Q1025
                ColorCode.None], // NOSIG
        );
    });

    test('KJFK 291451Z 34027G34KT 300V020 1/4SM R04R/1600V2800FT +SN BLSN FZFG VV007 M09/M11 A2967 RMK AO2 PK WND 34035/1420 SLP046 SNINCR 1/8 P0000 60002 T10941111 51001', () => {
        // eslint-disable-next-line max-len
        const metarObject = parseMetar('KJFK 281451Z 34027G34KT 300V020 1/4SM R04R/1600V2800FT +SN BLSN FZFG VV007 M09/M11 A2967 RMK AO2 PK WND 34035/1420 SLP046 SNINCR 1/8 P0000 60002 T10941111 51001');
        expect(metarObject.icao).toBe('KJFK');
        expect(metarObject.observed.getUTCDate()).toBe(28);
        expect(metarObject.observed.getUTCHours()).toBe(14);
        expect(metarObject.observed.getUTCMinutes()).toBe(51);
        expect(metarObject.wind.speed_kts).toBe(27);
        expect(metarObject.wind.gust_kts).toBe(34);
        expect(metarObject.wind.degrees).toBe(340);
        expect(metarObject.wind.degrees_from).toBe(300);
        expect(metarObject.wind.degrees_to).toBe(20);
        expect(metarObject.visibility.miles).toBe('0.5');
        expect(metarObject.visibility.miles_float).toBe(0.25);
        expect(metarObject.visibility.meters).toBe('500');
        expect(metarObject.visibility.meters_float).toBe(402.336);
        expect(metarObject.conditions).toHaveLength(3);
        expect(metarObject.conditions[0].code).toBe('+SN');
        // @ts-ignore
        expect(metarObject.conditions[1].code).toBe('BLSN');
        // @ts-ignore
        expect(metarObject.conditions[2].code).toBe('FZFG');
        expect(metarObject.clouds).toHaveLength(1);
        expect(metarObject.clouds[0].code).toBe('VV');
        expect(metarObject.clouds[0].base_feet_agl).toBe(700);
        expect(metarObject.temperature.celsius).toBe(-9);
        expect(metarObject.dewpoint.celsius).toBe(-11);
        expect(metarObject.barometer.mb).toBe(1004.741349708642);
        expect(metarObject.barometer.hg).toBe(29.67);
        expect(metarObject.barometer.kpa).toBe(100.4741349708642);
        expect(metarObject.color_codes).toHaveLength(metarObject.raw_parts.length);
        expect(metarObject.color_codes).toEqual(
            [
                ColorCode.Highlight, // KJFK
                ColorCode.None, // 291451Z
                ColorCode.Warning, // 34027G34KT
                ColorCode.None, // 300V020
                ColorCode.Warning, // 1/4SM
                ColorCode.None, // R04R/1600V2800FT
                ColorCode.Warning, // +SN
                ColorCode.Caution, // BLSN
                ColorCode.Warning, // FZFG
                ColorCode.Caution, // VV007
                ColorCode.Caution, // M09/M11
                ColorCode.None, // A2967
                ColorCode.Info, // RMK
                ColorCode.Info, // AO2
                ColorCode.Info, // PK
                ColorCode.Info, // WND
                ColorCode.Info, // 34035/1420
                ColorCode.Info, // SLP046
                ColorCode.Info, // SNINCR
                ColorCode.Info, // 1/8
                ColorCode.Info, // P0000
                ColorCode.Info, // 60002
                ColorCode.Info, // T10941111
                ColorCode.Info], // 51001
        );
    });

    test('EKCH 301350Z AUTO 32020G36KT 290V350 9999 NCD 07/M03 Q1011 TEMPO 31025G40KT 2500', () => {
        // eslint-disable-next-line max-len
        const metarObject = parseMetar('EKCH 251350Z AUTO 32020G36KT 290V350 9999 NCD 07/M03 Q1011 TEMPO 31025G40KT 2500');
        expect(metarObject.icao).toBe('EKCH');
        expect(metarObject.observed.getUTCDate()).toBe(25);
        expect(metarObject.observed.getUTCHours()).toBe(13);
        expect(metarObject.observed.getUTCMinutes()).toBe(50);
        expect(metarObject.wind.speed_kts).toBe(20);
        expect(metarObject.wind.gust_kts).toBe(36);
        expect(metarObject.wind.degrees).toBe(320);
        expect(metarObject.wind.degrees_from).toBe(290);
        expect(metarObject.wind.degrees_to).toBe(350);
        expect(metarObject.visibility.meters_float).toBe(9999);
        expect(metarObject.visibility.meters).toBe('10000');
        expect(metarObject.visibility.miles_float).toBe(6.213090551181102);
        expect(metarObject.visibility.miles).toBe('6');
        expect(metarObject.conditions).toHaveLength(0);
        expect(metarObject.clouds).toHaveLength(0);
        expect(metarObject.temperature.celsius).toBe(7);
        expect(metarObject.dewpoint.celsius).toBe(-3);
        expect(metarObject.barometer.mb).toBe(1011);
        expect(metarObject.barometer.hg).toBe(29.854817868);
        expect(metarObject.barometer.kpa).toBe(101.1);
        expect(metarObject.color_codes).toHaveLength(metarObject.raw_parts.length);
        expect(metarObject.color_codes).toEqual(
            [
                ColorCode.Highlight, // EKCH
                ColorCode.None, // 301350Z
                ColorCode.None, // AUTO
                ColorCode.Warning, // 32020G36KT
                ColorCode.None, // 290V350
                ColorCode.None, // 9999
                ColorCode.None, // NCD
                ColorCode.Caution, // 07/M03
                ColorCode.None, // Q1011
                ColorCode.TrendMarker, // TEMPO
                ColorCode.Warning, // 31025G40KT
                ColorCode.Caution, // 2500
            ],
        );
    });

    test('K1U7 301420Z AUTO 00000KT 1/4SM FZFG OVC002 M23/M24 A3024 TEMPO 18040KT 1/4SM FZFG OVC004 M23/M24 A3024', () => {
        // eslint-disable-next-line max-len
        const metarObject = parseMetar('K1U7 011420Z AUTO 00000KT 1/4SM FZFG OVC002 M23/M24 A3024 TEMPO 18040KT 1/4SM FZFG OVC004 M23/M24 A3024');
        expect(metarObject.icao).toBe('K1U7');
        expect(metarObject.observed.getUTCDate()).toBe(1);
        expect(metarObject.observed.getUTCHours()).toBe(14);
        expect(metarObject.observed.getUTCMinutes()).toBe(20);
        expect(metarObject.wind.speed_kts).toBe(0);
        expect(metarObject.wind.gust_kts).toBe(0);
        expect(metarObject.wind.degrees).toBe(0);
        expect(metarObject.wind.degrees_from).toBe(0);
        expect(metarObject.wind.degrees_to).toBe(0);
        expect(metarObject.visibility.miles).toBe('0.5');
        expect(metarObject.visibility.miles_float).toBe(0.25);
        expect(metarObject.visibility.meters).toBe('500');
        expect(metarObject.visibility.meters_float).toBe(402.336);
        expect(metarObject.conditions).toHaveLength(1);
        expect(metarObject.conditions[0].code).toBe('FZFG');
        expect(metarObject.clouds).toHaveLength(1);
        expect(metarObject.clouds[0].code).toBe('OVC');
        expect(metarObject.clouds[0].base_feet_agl).toBe(200);
        expect(metarObject.ceiling.code).toBe('OVC');
        expect(metarObject.ceiling.feet_agl).toBe(200);
        expect(metarObject.temperature.celsius).toBe(-23);
        expect(metarObject.dewpoint.celsius).toBe(-24);
        expect(metarObject.barometer.mb).toBe(1024.0437618870687);
        expect(metarObject.barometer.hg).toBe(30.24);
        expect(metarObject.barometer.kpa).toBe(102.40437618870688);
        expect(metarObject.color_codes).toHaveLength(metarObject.raw_parts.length);
        expect(metarObject.color_codes).toEqual(
            [
                ColorCode.Highlight, // K1U7
                ColorCode.None, // 301420Z
                ColorCode.None, // AUTO
                ColorCode.None, // 00000KT
                ColorCode.Warning, // 1/4SM
                ColorCode.Warning, // FZFG
                ColorCode.Warning, // OVC002
                ColorCode.Warning, // M23/M24
                ColorCode.None, // A3024
                ColorCode.TrendMarker, // TREND
                ColorCode.Warning, // 18040KT
                ColorCode.Warning, // 1/4SM
                ColorCode.Warning, // FZFG
                ColorCode.Caution, // OVC004
                ColorCode.Warning, // M23/M24
                ColorCode.None, // A3024
            ],
        );
    });
});

test('KSFO 301456Z 17004KT 10SM FEW008 SCT011 SCT200 07/06 A3021 RMK AO2 SLP230 T00720056 50002', () => {
    const metarObject = parseMetar('KSFO 021456Z 17004KT 10SM FEW008 SCT011 SCT200 07/06 A3021 RMK AO2 SLP230 T00720056 50002');
    expect(metarObject.icao).toBe('KSFO');
    expect(metarObject.observed.getUTCDate()).toBe(2);
    expect(metarObject.observed.getUTCHours()).toBe(14);
    expect(metarObject.observed.getUTCMinutes()).toBe(56);
    expect(metarObject.wind.speed_kts).toBe(4);
    expect(metarObject.wind.gust_kts).toBe(4);
    expect(metarObject.wind.degrees).toBe(170);
    expect(metarObject.wind.degrees_from).toBe(170);
    expect(metarObject.wind.degrees_to).toBe(170);
    expect(metarObject.visibility.meters_float).toBe(16093.44);
    expect(metarObject.visibility.meters).toBe('16000');
    expect(metarObject.visibility.miles_float).toBe(10.0);
    expect(metarObject.visibility.miles).toBe('10');
    expect(metarObject.conditions).toHaveLength(0);
    expect(metarObject.clouds).toHaveLength(3);
    expect(metarObject.clouds[0].code).toBe('FEW');
    expect(metarObject.clouds[0].base_feet_agl).toBe(800);
    // @ts-ignore
    expect(metarObject.clouds[1].code).toBe('SCT');
    // @ts-ignore
    expect(metarObject.clouds[2].code).toBe('SCT');
    expect(metarObject.ceiling.code).toBe('SCT');
    expect(metarObject.ceiling.feet_agl).toBe(20000);
    expect(metarObject.temperature.celsius).toBe(7);
    expect(metarObject.dewpoint.celsius).toBe(6);
    expect(metarObject.barometer.mb).toBe(1023.0278454566253);
    expect(metarObject.barometer.hg).toBe(30.21);
    expect(metarObject.color_codes).toEqual(
        [
            ColorCode.Highlight, // KSFO
            ColorCode.None, // 301456Z
            ColorCode.None, // 17004KT
            ColorCode.None, // 10SM
            ColorCode.None, // FEW008
            ColorCode.None, // SCT011
            ColorCode.None, // SCT200
            ColorCode.Caution, // 07/06
            ColorCode.None, // A3021
            ColorCode.Info, // RMK
            ColorCode.Info, // AO2
            ColorCode.Info, // SLP230
            ColorCode.Info, // T00720056
            ColorCode.Info], // 50002
    );
});

test('SCTE 070400Z VRB02KT CAVOK 13/12 Q1016 NOSIG', () => {
    const metarObject = parseMetar('SCTE 070400Z VRB02KT CAVOK 13/12 Q1016 NOSIG');
    expect(metarObject.icao).toBe('SCTE');
    expect(metarObject.observed.getUTCDate()).toBe(7);
    expect(metarObject.observed.getUTCHours()).toBe(4);
    expect(metarObject.observed.getUTCMinutes()).toBe(0);
    expect(metarObject.wind.speed_kts).toBe(2);
    expect(metarObject.wind.gust_kts).toBe(2);
    expect(metarObject.wind.degrees).toBe(180);
    expect(metarObject.wind.degrees_from).toBe(0);
    expect(metarObject.wind.degrees_to).toBe(359);
    expect(metarObject.visibility.meters_float).toBe(16093.44);
    expect(metarObject.visibility.meters).toBe('16000');
    expect(metarObject.visibility.miles_float).toBe(10.0);
    expect(metarObject.visibility.miles).toBe('10');
    expect(metarObject.conditions).toHaveLength(0);
    expect(metarObject.clouds).toHaveLength(0);
    expect(metarObject.temperature.celsius).toBe(13);
    expect(metarObject.dewpoint.celsius).toBe(12);
    expect(metarObject.barometer.mb).toBe(1016);
    expect(metarObject.barometer.hg).toBe(30.002467808);
    expect(metarObject.color_codes).toEqual(
        [
            ColorCode.Highlight, // SCTE
            ColorCode.None, // 070400ZZ
            ColorCode.None, // VRB02KTT
            ColorCode.None, // CAVOK
            ColorCode.None, // 13/12
            ColorCode.None, // Q1016
            ColorCode.None, // NOSIG
        ],
    );
});

test('ENSF 071750Z AUTO 20048KT 2200NDV -SHRA BR OVC011/// ///// Q//// W///S5', () => {
    const metarObject = parseMetar('ENSF 071750Z AUTO 20048KT 2200NDV -SHRA BR OVC011/// ///// Q//// W///S5');
    expect(metarObject.icao).toBe('ENSF');
    expect(metarObject.observed.getUTCDate()).toBe(7);
    expect(metarObject.observed.getUTCHours()).toBe(17);
    expect(metarObject.observed.getUTCMinutes()).toBe(50);
    expect(metarObject.wind.speed_kts).toBe(48);
    expect(metarObject.wind.gust_kts).toBe(48);
    expect(metarObject.wind.degrees).toBe(200);
    expect(metarObject.wind.degrees_from).toBe(200);
    expect(metarObject.wind.degrees_to).toBe(200);
    expect(metarObject.visibility.meters_float).toBe(2200);
    expect(metarObject.visibility.meters).toBe('2000');
    expect(metarObject.visibility.miles_float).toBe(1.3670166229221348);
    expect(metarObject.visibility.miles).toBe('1.5');
    expect(metarObject.conditions).toHaveLength(2);
    expect(metarObject.conditions[0].code).toBe('-SHRA');
    // @ts-ignore
    expect(metarObject.conditions[1].code).toBe('BR');
    expect(metarObject.clouds).toHaveLength(1);
    expect(metarObject.clouds[0].code).toBe('OVC');
    expect(metarObject.clouds[0].base_feet_agl).toBe(1100);
    expect(metarObject.temperature.celsius).toBe(0);
    expect(metarObject.dewpoint.celsius).toBe(0);
    expect(metarObject.barometer.mb).toBe(0);
    expect(metarObject.barometer.hg).toBe(0);
    expect(metarObject.color_codes).toEqual(
        [
            ColorCode.Highlight, // ENSF
            ColorCode.None, // 071750Z
            ColorCode.None, // AUTO
            ColorCode.Warning, // 20048KT
            ColorCode.Caution, // 2200NDV
            ColorCode.Caution, // -SHRA
            ColorCode.None, // BR
            ColorCode.None, // OVC011///
            ColorCode.None, // ////
            ColorCode.None, // Q////
            ColorCode.None, // W///S5
        ],
    );
});

test('PATC 141647Z AUTO 23017G29KT 1/4SM FZFG VV002 M30/M33 A3045 RMK AO2 SLP328', () => {
    const metarObject = parseMetar('PATC 141647Z AUTO 23017G29KT 1/4SM FZFG VV002 M30/M33 A3045 RMK AO2 SLP328');
    expect(metarObject.icao).toBe('PATC');
    expect(metarObject.wind.speed_kts).toBe(17);
    expect(metarObject.wind.gust_kts).toBe(29);
    expect(metarObject.wind.degrees).toBe(230);
    expect(metarObject.wind.degrees_from).toBe(230);
    expect(metarObject.wind.degrees_to).toBe(230);
    expect(metarObject.visibility.meters_float).toBe(402.336);
    expect(metarObject.visibility.meters).toBe('500');
    expect(metarObject.visibility.miles_float).toBe(0.25);
    expect(metarObject.visibility.miles).toBe('0.5');
    expect(metarObject.conditions).toHaveLength(1);
    expect(metarObject.conditions[0].code).toBe('FZFG');
    expect(metarObject.clouds).toHaveLength(1);
    expect(metarObject.clouds[0].code).toBe('VV');
    expect(metarObject.clouds[0].base_feet_agl).toBe(200);
    expect(metarObject.temperature.celsius).toBe(-30);
    expect(metarObject.dewpoint.celsius).toBe(-33);
    expect(metarObject.barometer.mb).toBe(1031.1551769001735);
    expect(metarObject.barometer.hg).toBe(30.45);
    expect(metarObject.color_codes).toEqual(
        [
            ColorCode.Highlight, // PATC
            ColorCode.None, // 141647Z
            ColorCode.None, // AUTO
            ColorCode.Caution, // 23017G29KT
            ColorCode.Warning, // 1/4SM
            ColorCode.Warning, // FZFG
            ColorCode.Caution, // VV002
            ColorCode.Warning, // M30/M33
            ColorCode.None, // A3045
            ColorCode.Info, // RMK
            ColorCode.Info, // AO2
            ColorCode.Info, // SLP328
        ],
    );
});

test('ULMM 141800Z 26007G13MPS 8000 -SHSN BLSN BKN021CB M02/M04 Q0984 R31/490332 NOSIG RMK QFE731', () => {
    const metarObject = parseMetar('ULMM 141800Z 26007G13MPS 8000 -SHSN BLSN BKN021CB M02/M04 Q0984 R31/490332 NOSIG RMK QFE731');
    expect(metarObject.icao).toBe('ULMM');
    expect(metarObject.wind.speed_kts).toBe(13.606911499999999);
    expect(metarObject.wind.gust_kts).toBe(25.2699785);
    expect(metarObject.wind.degrees).toBe(260);
    expect(metarObject.wind.degrees_from).toBe(260);
    expect(metarObject.wind.degrees_to).toBe(260);
    expect(metarObject.visibility.meters_float).toBe(8000);
    expect(metarObject.visibility.meters).toBe('8000');
    expect(metarObject.visibility.miles_float).toBe(4.970969537898672);
    expect(metarObject.visibility.miles).toBe('5');
    expect(metarObject.conditions).toHaveLength(2);
    expect(metarObject.conditions[0].code).toBe('-SHSN');
    expect(metarObject.conditions[1].code).toBe('BLSN');
    expect(metarObject.clouds).toHaveLength(1);
    expect(metarObject.clouds[0].code).toBe('BKN');
    expect(metarObject.clouds[0].base_feet_agl).toBe(2100);
    expect(metarObject.temperature.celsius).toBe(-2);
    expect(metarObject.dewpoint.celsius).toBe(-4);
    expect(metarObject.barometer.mb).toBe(984);
    expect(metarObject.barometer.hg).toBe(29.057508192000004);
    expect(metarObject.color_codes).toEqual(
        [
            ColorCode.Highlight, //   ULMM
            ColorCode.None, //        141800Z
            ColorCode.Caution, //        26007G13MPS
            ColorCode.None, //     8000
            ColorCode.Caution, //     -SHSN
            ColorCode.Caution, //     BLSN
            ColorCode.Caution, //     BKN021CB
            ColorCode.Caution, //     M02/M04
            ColorCode.None, //        Q0984
            ColorCode.None, //        R31/490332
            ColorCode.None, //        NOSIG
            ColorCode.Info, //        RMK
            ColorCode.Info, //        QFE731
        ],
    );
});
