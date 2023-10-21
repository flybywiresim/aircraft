// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { Failure } from 'failures/src/failures-orchestrator';
import { FailureGenContext } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';

export const getGeneratorFailurePool = (genUniqueID : string, allFailures:Readonly<Failure>[]): string => {
    let failureIDs: string = '';
    let first = true;
    const setOfGeneratorFailuresSettings = getSetOfGeneratorFailuresSettings(allFailures);

    if (allFailures.length > 0) {
        for (const failure of allFailures) {
            const generatorSetting = setOfGeneratorFailuresSettings.get(failure.identifier);
            if (generatorSetting) {
                const failureGeneratorsTable = generatorSetting.split(',');
                if (failureGeneratorsTable.length > 0) {
                    for (const generator of failureGeneratorsTable) {
                        if (generator === genUniqueID) {
                            if (first) {
                                failureIDs += failure.identifier.toString();
                                first = false;
                            } else failureIDs += `,${failure.identifier.toString()}`;
                        }
                    }
                }
            }
        }
    }
    return failureIDs;
};

const getSetOfGeneratorFailuresSettings: (allFailures: readonly Readonly<Failure>[]) => Map<number, string> = (allFailures: readonly Readonly<Failure>[]) => {
    const generatorFailuresGetters: Map<number, string> = new Map();
    if (allFailures.length > 0) {
        for (const failure of allFailures) {
            // TODO
            // Another way of storing settings on the EFB tablet will need to be used when tablet will not be part of the sim
            const generatorSetting = NXDataStore.get(`EFB_FAILURE_${failure.identifier.toString()}_GENERATORS`, '');
            generatorFailuresGetters.set(failure.identifier, generatorSetting);
        }
    }
    return generatorFailuresGetters;
};

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
