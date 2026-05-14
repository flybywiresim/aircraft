// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { describe, expect, it } from 'vitest';
import { isQnhInHg, qnhToMillibar } from './QnhUtils';

describe('QnhUtils', () => {
  it('treats values below the hPa range as inHg entries', () => {
    expect(isQnhInHg(29.92)).toBe(true);
    expect(isQnhInHg(745)).toBe(false);
    expect(isQnhInHg(1013)).toBe(false);
  });

  it('converts inHg entries to millibar for systems consumers', () => {
    expect(qnhToMillibar(29.92)).toBeCloseTo(1013.207489, 6);
  });

  it('keeps hPa entries unchanged for systems consumers', () => {
    expect(qnhToMillibar(1013)).toBe(1013);
  });
});
