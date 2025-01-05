// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Arinc429Word } from '../../../shared/src/index';
import { useSimVar } from './simVars';

export const useArinc429Var = (name: string, maxStaleness = 0): Arinc429Word => {
  const [value] = useSimVar(name, 'number', maxStaleness);
  return new Arinc429Word(value);
};
