import { SimVarType } from './types';
import { SimVarUnit } from './units';

export const getSimVarKey = (varType: SimVarType, name: string, unit: SimVarUnit) => `${varType}_${name}_${unit}`;
