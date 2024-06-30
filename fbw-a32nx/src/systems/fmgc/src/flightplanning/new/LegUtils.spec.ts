// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { mergeLegSets } from '@fmgc/flightplanning/new/LegUtils';

describe('Leg Utilities', () => {
    describe('downstream leg set merging', () => {
        it('should merge legs with a matching waypoint correctly', () => {
            const existing: { icaoCode: string }[] = [
                { icaoCode: 'Z' },
                { icaoCode: 'C' },
                { icaoCode: 'E' },
                { icaoCode: 'F' },
                { icaoCode: 'G' },
            ];

            const incoming: { icaoCode: string }[] = [
                { icaoCode: 'A' },
                { icaoCode: 'B' },
                { icaoCode: 'C' },
                { icaoCode: 'G' },
                { icaoCode: 'H' },
            ];

            const result = mergeLegSets(existing, incoming, true);

            expect(result).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ icaoCode: 'A' }),
                    expect.objectContaining({ icaoCode: 'B' }),
                    expect.objectContaining({ icaoCode: 'C' }),
                    expect.objectContaining({ icaoCode: 'E' }),
                    expect.objectContaining({ icaoCode: 'F' }),
                    expect.objectContaining({ icaoCode: 'G' }),
                ]),
            );
        });

        it('should not merge legs without a matching waypoint', () => {
            const existing: { icaoCode: string }[] = [
                { icaoCode: 'A' },
                { icaoCode: 'B' },
            ];

            const incoming: { icaoCode: string }[] = [
                { icaoCode: 'C' },
                { icaoCode: 'D' },
            ];

            const result = mergeLegSets(existing, incoming, true);

            expect(result).toBeUndefined();
        });
    });

    describe('upstream leg set merging', () => {
        it('should merge legs with a matching waypoint correctly', () => {
            const existing: { icaoCode: string }[] = [
                { icaoCode: 'A' },
                { icaoCode: 'B' },
                { icaoCode: 'C' },
                { icaoCode: 'D' },
            ];

            const incoming: { icaoCode: string }[] = [
                { icaoCode: 'B' },
                { icaoCode: 'E' },
                { icaoCode: 'F' },
            ];

            const result = mergeLegSets(existing, incoming, false);

            expect(result).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ icaoCode: 'A' }),
                    expect.objectContaining({ icaoCode: 'B' }),
                    expect.objectContaining({ icaoCode: 'E' }),
                    expect.objectContaining({ icaoCode: 'F' }),
                ]),
            );
        });

        it('should not merge legs without a matching waypoint', () => {
            const existing: { icaoCode: string }[] = [
                { icaoCode: 'A' },
                { icaoCode: 'B' },
            ];

            const incoming: { icaoCode: string }[] = [
                { icaoCode: 'C' },
                { icaoCode: 'D' },
            ];

            const result = mergeLegSets(existing, incoming, false);

            expect(result).toBeUndefined();
        });
    });
});
