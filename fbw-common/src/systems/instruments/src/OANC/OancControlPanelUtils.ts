// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ArraySubject, DmsFormatter2, Subject, UnitType } from '@microsoft/msfs-sdk';
import { AmdbAirportSearchResult } from '@shared/amdb';

export enum ControlPanelAirportSearchMode {
        Icao,
        Iata,
        City,
    }

export class ControlPanelUtils {
    static readonly LAT_FORMATTER = DmsFormatter2.create('{dd}°{mm}.{s}{+[N]-[S]}', UnitType.DEGREE, 0.1);

    static readonly LONG_FORMATTER = DmsFormatter2.create('{ddd}°{mm}.{s}{+[E]-[W]}', UnitType.DEGREE, 0.1);

    static readonly LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    static getSearchModeProp(mode: ControlPanelAirportSearchMode): keyof AmdbAirportSearchResult {
        let prop: keyof AmdbAirportSearchResult;
        switch (mode) {
        default:
        case ControlPanelAirportSearchMode.Icao:
            prop = 'idarpt';
            break;
        case ControlPanelAirportSearchMode.Iata:
            prop = 'iata';
            break;
        case ControlPanelAirportSearchMode.City:
            prop = 'name';
            break;
        }
        return prop;
    }
}

export class ControlPanelStore {
    public readonly airports = ArraySubject.create<AmdbAirportSearchResult>();

    public readonly sortedAirports = ArraySubject.create<AmdbAirportSearchResult>();

    public readonly airportSearchMode = Subject.create<number | null>(ControlPanelAirportSearchMode.Icao);

    public readonly airportSearchData = ArraySubject.create<string>();

    public readonly airportSearchSelectedSearchLetterIndex = Subject.create<number | null>(null);

    public readonly airportSearchSelectedAirportIndex = Subject.create<number | null>(null);

    public readonly selectedAirport = Subject.create<AmdbAirportSearchResult | null>(null);

    public readonly isAirportSelectionPending = Subject.create(false);
}
