// Copyright (c) 2022 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export function iso8601CalendarDate(year: number, month: number, day: number, sep = '-'): string {
    return `${year.toFixed(0).padStart(4, '0')}${sep}${month.toFixed(0).padStart(2, '0')}${sep}${day.toFixed(0).padStart(2, '0')}`;
}
