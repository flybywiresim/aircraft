import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { useSimVar } from './simVars';

export const useArinc429Var = (name: string, maxStaleness = 0): Arinc429Word => {
  const [value] = useSimVar(name, 'number', maxStaleness);
  return new Arinc429Word(value);
};
