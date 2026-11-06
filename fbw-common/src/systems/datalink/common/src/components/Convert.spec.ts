//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { describe, expect, it } from 'vitest';
import { wordWrap } from './Convert';

describe('wordWrap', () => {
  it('treats line breaks as spaces by default', () => {
    expect(wordWrap('ZFW 124.3\nTOW 140.8', 25)).toEqual(['ZFW 124.3 TOW 140.8']);
  });

  it('starts a new line at each line break when asked to keep them', () => {
    expect(wordWrap('AAL1548 LOADSHEET\nZFW 124.3 MAX 129.0\nTOW 140.8 MAX 145.5', 25, true)).toEqual([
      'AAL1548 LOADSHEET',
      'ZFW 124.3 MAX 129.0',
      'TOW 140.8 MAX 145.5',
    ]);
  });

  it('still wraps a kept line that is longer than the display', () => {
    expect(wordWrap('RTE YOSE3 NTELL DCT CABAB Q174 SKTCH\nDSP FDAL', 25, true)).toEqual([
      'RTE YOSE3 NTELL DCT',
      'CABAB Q174 SKTCH',
      'DSP FDAL',
    ]);
  });

  it('keeps slashes only when keeping line breaks', () => {
    expect(wordWrap('T/O DATA 1343 ACCEPTED', 25, true)).toEqual(['T/O DATA 1343 ACCEPTED']);
    expect(wordWrap('T/O DATA 1343 ACCEPTED', 25)).toEqual(['T O DATA 1343 ACCEPTED']);
  });

  it('skips empty lines', () => {
    expect(wordWrap('LINE ONE\n\nLINE TWO', 25, true)).toEqual(['LINE ONE', 'LINE TWO']);
  });
});
