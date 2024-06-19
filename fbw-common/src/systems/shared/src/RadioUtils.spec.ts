// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { RadioUtils } from './RadioUtils';

describe('RadioUtils.packBcd16', () => {
  it('correctly packs bcd16', () => {
    expect(RadioUtils.packBcd16(113_200_000)).toBe(4_896);
  });
});

describe('RadioUtils.packBcd32', () => {
  it('correctly packs bcd32', () => {
    expect(RadioUtils.packBcd16(113_200_000)).toBe(18_030_592);
  });
});

describe('RadioUtils.unpackVhfComFrequencyFromArincToHz', () => {
  it('correctly unpacks arinc BCD to Hz', () => {
    expect(RadioUtils.unpackVhfComFrequencyFromArincToHz(1_126_912)).toBe(113_200_000);
  });
});
