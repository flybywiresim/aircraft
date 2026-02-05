// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { describe, it, expect } from 'vitest';
import { SimVarString } from './simvar';

describe('SimVarString.pack', () => {
  it('correctly packs arbitrary strings with invalid chars', () => {
    expect(SimVarString.pack('A]c<C>d=:E4fGh5I j0K(l)^M%n$O"p!')).toEqual([
      0x7807e4740fa2, 0xa9602801599b, 0xfca009b11001, 0x800f01401ae,
    ]);
    expect(SimVarString.pack('A]b<C>d=:E4fGh5I j0K(l)^M%n$O"p!', 9)).toEqual([0x7807e4740fa2, 0x1b]);
  });
  it('correctly packs 9-char strings', () => {
    expect(SimVarString.pack('ILS22R', 9)).toEqual([0xcd34f4b6a, 0]);
    expect(SimVarString.pack('ILS22R   ', 9)).toEqual([0x41cd34f4b6a, 0x1]);
  });
});

describe('SimVarString.unpack', () => {
  it('correctly unpacks arbitrary strings', () => {
    expect(SimVarString.unpack([0x7807e4740fa2, 0xa9602801599b, 0xfca009b11001, 0x800f01401ae])).toEqual(
      'A]<C>=:E4G5I 0K()^M%$O"!',
    );
    expect(SimVarString.unpack([0x7807e4740fa2, 0x1b])).toEqual('A]<C>=:');
  });
  it('correctly unpacks 9-char strings', () => {
    expect(SimVarString.unpack([0xcd34f4b6a, 0])).toEqual('ILS22R');
    expect(SimVarString.unpack([0x41cd34f4b6a, 0x1])).toEqual('ILS22R   ');
  });
});
