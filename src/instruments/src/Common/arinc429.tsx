import { Arinc429Word, Arinc429WordSsmParseError } from '@shared/arinc429';
import { useSimVar } from './simVars';

export const useArinc429Var = (
    name: string,
    maxStaleness = 0,
): Arinc429Word => {
    const [value] = useSimVar(name, 'number', maxStaleness);
    try {
        return new Arinc429Word(value);
    } catch (e) {
        if (e instanceof Arinc429WordSsmParseError) {
            throw new Error(`SimVar "${name}" has an ARINC 429 SSM value ${e.ssm}, which is outside of the valid range.`);
        }

        throw e;
    }
};
