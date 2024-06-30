// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NdSymbol, NdTraffic, PathVector } from '@flybywiresim/fbw-sdk';

export interface FmsSymbolsData {
  symbols: NdSymbol[];
  vectorsActive: PathVector[];
  vectorsDashed: PathVector[];
  vectorsTemporary: PathVector[];
  vectorsMissed: PathVector[];
  vectorsAlternate: PathVector[];
  vectorsSecondary: PathVector[];
  traffic: NdTraffic[];
}
