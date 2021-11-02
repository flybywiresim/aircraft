/* eslint-disable max-classes-per-file */
import { useSimVarValue } from './simVars';
import { Arinc429Word, Arinc429WordSsmParseError } from '@shared/arinc429';

export const useArinc429Var = (
    name: string,
    maxStaleness = 0,
): Arinc429Word => {
    const value = useSimVarValue(name, 'number', maxStaleness);
    try {
        return new Arinc429Word(value);
    } catch (e) {
        if (e instanceof Arinc429WordSsmParseError) {
            throw new Error(`SimVar "${name}" has an ARINC 429 SSM value ${e.ssm}, which is outside of the valid range.`);
        }

        throw e;
    }
};
