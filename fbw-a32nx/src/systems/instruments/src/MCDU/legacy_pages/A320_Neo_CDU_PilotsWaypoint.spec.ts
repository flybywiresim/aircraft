// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { describe, expect, it } from 'vitest';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { CDUPilotsWaypoint } from './A320_Neo_CDU_PilotsWaypoint';

describe('CDUPilotsWaypoint.formatLatLong', () => {
  const roundTrip = (input: string) => CDUPilotsWaypoint.formatLatLong(WaypointEntryUtils.parseLatLon(input));

  it.each([
    '1059.0N/09846.7E',
    '1058.1N/09847.0E',
    '1010.0N/00110.0E',
    '5130.0N/00030.0W',
    '3345.6S/15112.3E',
    '0030.0N/00000.0E',
    '4959.9N/17959.9W',
  ])('displays %s as it was entered', (input) => {
    expect(roundTrip(input)).toBe(input);
  });

  it('displays every 0.1 arcminute of latitude and longitude as it was entered', () => {
    for (let tenths = 0; tenths < 600; tenths++) {
      const minutes = (tenths / 10).toFixed(1).padStart(4, '0');
      const input = `59${minutes}N/123${minutes}E`;

      expect(roundTrip(input)).toBe(input);
    }
  });

  it('carries into the degrees when the minutes round up to 60', () => {
    // 10 degrees 59.96 minutes is closer to 11 degrees 00.0 minutes than to 10 degrees 59.9 minutes
    expect(CDUPilotsWaypoint.formatLatLong({ lat: 10 + 59.96 / 60, long: -(98 + 59.96 / 60) })).toBe(
      '1100.0N/09900.0W',
    );
  });
});
