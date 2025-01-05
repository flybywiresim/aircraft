// Copyright (c) 2022 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DatabaseItem, SectionCode } from '@flybywiresim/fbw-sdk';

export function iso8601CalendarDate(year: number, month: number, day: number, sep = '-'): string {
  return `${year.toFixed(0).padStart(4, '0')}${sep}${month.toFixed(0).padStart(2, '0')}${sep}${day.toFixed(0).padStart(2, '0')}`;
}

export class Icao {
  static getIdent(icao: string): string {
    return icao.substring(7);
  }

  static create(type: string, region: string, airport: string, ident: string): string {
    return type + region.padEnd(2, ' ') + airport.padEnd(4, ' ') + ident.padEnd(5, ' ');
  }
}

export function areDatabaseItemsEqual<T extends SectionCode>(a: DatabaseItem<T>, b: DatabaseItem<T>): boolean {
  if (!a || !b) {
    return false;
  }

  return (
    a.sectionCode === b.sectionCode &&
    a.subSectionCode === b.subSectionCode &&
    a.icaoCode === b.icaoCode &&
    a.ident === b.ident
  );
}
