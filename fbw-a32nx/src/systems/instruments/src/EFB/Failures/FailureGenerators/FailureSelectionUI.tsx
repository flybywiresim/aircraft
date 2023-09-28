// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Failure } from 'failures/src/failures-orchestrator';
import { FailureGenContext } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';

export const setSelectedFailure = (failure: Failure, genIDToChange: string, failureGenContext: FailureGenContext, value: boolean) => {
    const initialString = failureGenContext.generatorFailuresGetters.get(failure.identifier);
    const generatorsForFailure = initialString.split(',');
    let newSetting: string = '';
    const genIncludedInSetting = generatorsForFailure.includes(genIDToChange);
    if (genIncludedInSetting !== value) {
        if (value === true) {
            if (generatorsForFailure.length > 0) {
                newSetting = initialString.concat(`,${genIDToChange}`);
            } else {
                newSetting = genIDToChange;
            }
        } else
        if (generatorsForFailure.length > 0) {
            let first = true;
            for (const generatorID of generatorsForFailure) {
                const letterTable = generatorID.match(regexLetter);
                const numberTable = generatorID.match(regexNumber);
                if (letterTable && letterTable.length > 0 && numberTable && numberTable.length > 0 && generatorID === `${letterTable[0]}${numberTable[0]}`) {
                    // only keeps the well formated settings in case older formats are present
                    if (genIDToChange !== generatorID) {
                        if (first) {
                            newSetting = newSetting.concat(generatorID);
                            first = false;
                        } else {
                            newSetting = newSetting.concat(`,${generatorID}`);
                        }
                    }
                }
            }
        }
        failureGenContext.generatorFailuresSetters.get(failure.identifier)(newSetting);
    }
};

const regexLetter = /\D{1,2}/;
const regexNumber = /\d{1,2}/;

export function extractFirstLetter(generatorUniqueID: string) {
    const letterTable = generatorUniqueID.match(regexLetter);
    if (letterTable && letterTable.length > 0) return letterTable[0];
    return '';
}

export function extractFirstNumber(generatorUniqueID: string) {
    const numberTable = generatorUniqueID.match(regexNumber);
    if (numberTable && numberTable.length > 0) return parseInt(numberTable[0]);
    return undefined;
}
