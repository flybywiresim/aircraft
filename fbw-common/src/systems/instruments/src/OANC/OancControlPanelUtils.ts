// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ArraySubject, DmsFormatter2, Subject, UnitType } from '@microsoft/msfs-sdk';
import { AmdbAirportSearchResult, AmdbProperties } from '@flybywiresim/fbw-sdk';

export enum ControlPanelAirportSearchMode {
  Icao,
  Iata,
  City,
}

export enum ControlPanelMapDataSearchMode {
  Runway,
  Taxiway,
  Stand,
  Other,
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

  static getMapDataSearchModeProp(mode: ControlPanelMapDataSearchMode): keyof AmdbProperties {
    let prop: keyof AmdbProperties;
    switch (mode) {
      default:
      case ControlPanelMapDataSearchMode.Runway:
        prop = 'idthr';
        break;
      case ControlPanelMapDataSearchMode.Taxiway:
        prop = 'idlin';
        break;
      case ControlPanelMapDataSearchMode.Stand:
        prop = 'idstd';
        break;
      case ControlPanelMapDataSearchMode.Other:
        prop = 'ident';
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

  public readonly mapDataSearchMode = Subject.create<number | null>(ControlPanelMapDataSearchMode.Runway);

  public readonly mapDataSearchData = ArraySubject.create<string>();

  public readonly selectedAirport = Subject.create<AmdbAirportSearchResult | null>(null);

  public readonly loadedAirport = Subject.create<AmdbAirportSearchResult | null>(null);

  public readonly isAirportSelectionPending = Subject.create(false);
}
