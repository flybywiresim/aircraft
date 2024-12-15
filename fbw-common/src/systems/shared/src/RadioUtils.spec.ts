// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { RadioChannelType, RadioUtils } from './RadioUtils';

describe('RadioUtils.packBcd16', () => {
  it('correctly packs bcd16', () => {
    expect(RadioUtils.packBcd16(118_500_000)).toBe(0x1850);
    expect(RadioUtils.packBcd16(122_250_000)).toBe(0x2225);
    // note this is an 8.33 channel that can't be represented in bcd16
    expect(RadioUtils.packBcd16(136_975_000)).toBe(0x3697);
  });
});

describe('RadioUtils.packBcd32', () => {
  it('correctly packs bcd32', () => {
    expect(RadioUtils.packBcd32(118_500_000)).toBe(0x118_500_0);
    expect(RadioUtils.packBcd32(122_250_000)).toBe(0x122_250_0);
    expect(RadioUtils.packBcd32(136_975_000)).toBe(0x136_975_0);
  });
});

describe('RadioUtils.unpackBcd16', () => {
  it('correctly unpacks bcd16', () => {
    expect(RadioUtils.unpackBcd16(0x1850)).toBe(118_500_000);
    expect(RadioUtils.unpackBcd16(0x2225)).toBe(122_250_000);
    expect(RadioUtils.unpackBcd16(0x3697)).toBe(136_970_000);
  });
});

describe('RadioUtils.unpackBcd32', () => {
  it('correctly unpacks bcd32', () => {
    expect(RadioUtils.unpackBcd32(0x118_500_0)).toBe(118_500_000);
    expect(RadioUtils.unpackBcd32(0x122_250_0)).toBe(122_250_000);
    expect(RadioUtils.unpackBcd32(0x136_975_0)).toBe(136_975_000);
  });
});

describe('RadioUtils.unpackVhfComFrequencyFromArincToHz', () => {
  it('correctly unpacks arinc BCD to Hz', () => {
    expect(RadioUtils.unpackVhfComFrequencyFromArincToHz(0x18_500)).toBe(118_500_000);
    expect(RadioUtils.unpackVhfComFrequencyFromArincToHz(0x22_250)).toBe(122_250_000);
    expect(RadioUtils.unpackVhfComFrequencyFromArincToHz(0x26_425)).toBe(126_425_000);
    expect(RadioUtils.unpackVhfComFrequencyFromArincToHz(0x36_975)).toBe(136_975_000);
  });
});

describe('RadioUtils.packBcd32VhfComFrequencyToArinc', () => {
  it('correctly translates to ARINC VHF COM format', () => {
    expect(RadioUtils.packBcd32VhfComFrequencyToArinc(0x118_500_0)).toBe(0x18_500);
    expect(RadioUtils.packBcd32VhfComFrequencyToArinc(0x122_250_0)).toBe(0x22_250);
    expect(RadioUtils.packBcd32VhfComFrequencyToArinc(0x126_425_0)).toBe(0x26_425);
    expect(RadioUtils.packBcd32VhfComFrequencyToArinc(0x136_975_0)).toBe(0x36_975);
  });
});

describe('RadioUtils.packVhfComFrequencyToArinc', () => {
  it('correctly translates to ARINC VHF COM format', () => {
    expect(RadioUtils.packVhfComFrequencyToArinc(118_500_000)).toBe(0x18_500);
    expect(RadioUtils.packVhfComFrequencyToArinc(122_250_000)).toBe(0x22_250);
    expect(RadioUtils.packVhfComFrequencyToArinc(126_425_000)).toBe(0x26_425);
    expect(RadioUtils.packVhfComFrequencyToArinc(136_975_000)).toBe(0x36_975);
  });
});

describe('RadioUtils.packBcd16VhfComFrequencyToArinc', () => {
  it('correctly translates to ARINC VHF COM format', () => {
    expect(RadioUtils.packBcd16VhfComFrequencyToArinc(0x1850)).toBe(0x18_500);
    expect(RadioUtils.packBcd16VhfComFrequencyToArinc(0x2225)).toBe(0x22_250);
    // note this is an 8.33 channel (136.975) that can't be represented in bcd16
    expect(RadioUtils.packBcd16VhfComFrequencyToArinc(0x3697)).toBe(0x36_970);
  });
});

describe('RadioUtils.unpackVhfComFrequencyFromArincToBcd32', () => {
  it('correctly translates from ARINC VHF COM format', () => {
    expect(RadioUtils.unpackVhfComFrequencyFromArincToBcd32(0x18_500)).toBe(0x118_500_0);
    expect(RadioUtils.unpackVhfComFrequencyFromArincToBcd32(0x22_250)).toBe(0x122_250_0);
    expect(RadioUtils.unpackVhfComFrequencyFromArincToBcd32(0x26_425)).toBe(0x126_425_0);
    expect(RadioUtils.unpackVhfComFrequencyFromArincToBcd32(0x36_975)).toBe(0x136_975_0);
  });
});

describe('RadioUtils.unpackVhfComFrequencyFromArincToBcd16', () => {
  it('correctly translates from ARINC VHF COM format', () => {
    expect(RadioUtils.unpackVhfComFrequencyFromArincToBcd16(0x18_500)).toBe(0x1850);
    expect(RadioUtils.unpackVhfComFrequencyFromArincToBcd16(0x22_250)).toBe(0x2225);
    // note this is an 8.33 channel (136.975) that can't be represented in bcd16
    expect(RadioUtils.unpackVhfComFrequencyFromArincToBcd16(0x36_975)).toBe(0x3697);
  });
});

describe('RadioUtils.formatBcd32', () => {
  it('correctly formats the frequency in MHz', () => {
    expect(RadioUtils.formatBcd32(0x118_500_0)).toBe('118.500');
    expect(RadioUtils.formatBcd32(0x122_250_0)).toBe('122.250');
    expect(RadioUtils.formatBcd32(0x136_975_0)).toBe('136.975');
  });
});

describe('RadioUtils.formatBcd16', () => {
  it('correctly formats the frequency in MHz', () => {
    expect(RadioUtils.formatBcd16(0x1850)).toBe('118.500');
    expect(RadioUtils.formatBcd16(0x2225)).toBe('122.250');
    // note this is an 8.33 channel (136.975) that can't be represented in bcd16
    expect(RadioUtils.formatBcd16(0x3697)).toBe('136.970');
  });
});

describe('RadioUtils.isValidSpacing', () => {
  it('validates valid frequencies', () => {
    expect(RadioUtils.isValidSpacing(0x118_005_0, RadioChannelType.VhfCom8_33)).toBeTruthy();
    expect(RadioUtils.isValidSpacing(0x118_750_0, RadioChannelType.VhfCom25)).toBeTruthy();
    expect(RadioUtils.isValidSpacing(0x118_005_0, RadioChannelType.VhfCom8_33_25)).toBeTruthy();
    expect(RadioUtils.isValidSpacing(0x118_750_0, RadioChannelType.VhfCom8_33_25)).toBeTruthy();
    expect(RadioUtils.isValidSpacing(0x109_900_0, RadioChannelType.VhfNavaid50)).toBeTruthy();
    expect(RadioUtils.isValidSpacing(0x109_950_0, RadioChannelType.VhfNavaid50)).toBeTruthy();
    expect(RadioUtils.isValidSpacing(0x2_800_0, RadioChannelType.Hf1)).toBeTruthy();
    expect(RadioUtils.isValidSpacing(0x23_999_0, RadioChannelType.Hf1)).toBeTruthy();
  });
  it('does not validate invalid frequencies', () => {
    expect(RadioUtils.isValidSpacing(0x118_005_0, RadioChannelType.VhfCom25)).toBeFalsy();
    expect(RadioUtils.isValidSpacing(0x118_750_0, RadioChannelType.VhfCom8_33)).toBeFalsy();
    expect(RadioUtils.isValidSpacing(0x118_002_0, RadioChannelType.VhfCom8_33_25)).toBeFalsy();
    expect(RadioUtils.isValidSpacing(0x118_005_0, RadioChannelType.VhfNavaid50)).toBeFalsy();
    expect(RadioUtils.isValidSpacing(0x2_800_5, RadioChannelType.Hf1)).toBeFalsy();
  });
});

describe('RadioUtils.isValidFrequency', () => {
  it('validates valid frequencies', () => {
    expect(RadioUtils.isValidFrequency(0x118_000_0)).toBeTruthy();
    expect(RadioUtils.isValidFrequency(0x118_500_0)).toBeTruthy();
    expect(RadioUtils.isValidFrequency(0x122_250_0)).toBeTruthy();
    expect(RadioUtils.isValidFrequency(0x136_975_0)).toBeTruthy();
    expect(RadioUtils.isValidFrequency(0x108_000_0, RadioChannelType.VhfNavaid50)).toBeTruthy();
    expect(RadioUtils.isValidFrequency(0x117_950_0, RadioChannelType.VhfNavaid50)).toBeTruthy();
    expect(RadioUtils.isValidFrequency(0x2_800_0, RadioChannelType.Hf1)).toBeTruthy();
    expect(RadioUtils.isValidFrequency(0x23_999_0, RadioChannelType.Hf1)).toBeTruthy();
  });
  it('does not validate invalid frequencies', () => {
    expect(RadioUtils.isValidFrequency(0x117_000_0)).toBeFalsy();
    expect(RadioUtils.isValidFrequency(0x118_999_0)).toBeFalsy();
    expect(RadioUtils.isValidFrequency(0x136_980_0)).toBeFalsy();
    expect(RadioUtils.isValidFrequency(0x149_975_0)).toBeFalsy();
    expect(RadioUtils.isValidFrequency(0x107_950_0, RadioChannelType.VhfNavaid50)).toBeFalsy();
    expect(RadioUtils.isValidFrequency(0x118_000_0, RadioChannelType.VhfNavaid50)).toBeFalsy();
    expect(RadioUtils.isValidFrequency(0x2_790_0, RadioChannelType.Hf1)).toBeFalsy();
    expect(RadioUtils.isValidFrequency(0x24_000_0, RadioChannelType.Hf1)).toBeFalsy();
  });
});
