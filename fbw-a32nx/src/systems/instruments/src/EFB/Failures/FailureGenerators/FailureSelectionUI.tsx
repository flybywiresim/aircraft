import { Failure } from 'failures/src/failures-orchestrator';
import { FailureGenContext, FailureGenData } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenEFB';

export function selectAllFailureChapter(chapter: number, failureGenContext: FailureGenContext, genIDToChange: string, value: boolean): void {
    for (const failure of failureGenContext.allFailures) {
        if (failure.ata === chapter) {
            setSelectedFailure(failure, genIDToChange, failureGenContext, value);
        }
    }
}

export function selectAllFailures(failureGenContext: FailureGenContext, genIDToChange: string, value: boolean): void {
    for (const failure of failureGenContext.allFailures) {
        setSelectedFailure(failure, genIDToChange, failureGenContext, value);
    }
}

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

export const deleteGeneratorFailures = (generatorSettings: FailureGenData, failureGenContext: FailureGenContext, generatorUniqueIDRemoved: string) => {
    const letterTable = generatorUniqueIDRemoved.match(regexLetter);
    const numberTable = generatorUniqueIDRemoved.match(regexNumber);
    if (letterTable && letterTable.length > 0 && numberTable && numberTable.length > 0) {
        const removedLetter = letterTable[0];
        const removedNumber = parseInt(numberTable[0]);
        if (failureGenContext.allFailures.length > 0) {
            for (const failure of failureGenContext.allFailures) {
                let first = true;
                const generatorListString = failureGenContext.generatorFailuresGetters.get(failure.identifier);
                let newString = '';
                if (generatorListString) {
                    const failureGeneratorsTable = generatorListString.split(',');
                    if (failureGeneratorsTable.length > 0) {
                        for (const generator of failureGeneratorsTable) {
                            const genLetterTable = generator.match(regexLetter);
                            const genNumberTable = generator.match(regexNumber);
                            if (genLetterTable && genLetterTable.length === 1 && genNumberTable && genNumberTable.length === 1) {
                                const formatIsValid = `${genLetterTable[0]}${genNumberTable[0]}` === generator;
                                const generatorNumber = parseInt(genNumberTable[0]);
                                const generatorLetter = genLetterTable[0];
                                if (formatIsValid) {
                                    if (generatorLetter !== removedLetter || generatorNumber < removedNumber) {
                                        newString = newString.concat(first ? `${generator}` : `,${generator}`);
                                        first = false;
                                    } else if (generatorNumber > removedNumber) {
                                        const offset = `${generatorLetter}${(generatorNumber - 1).toString()}`;
                                        newString = newString.concat(first ? `${offset}` : `,${offset}`);
                                        first = false;
                                    }
                                }
                            }
                        }
                        failureGenContext.generatorFailuresSetters.get(failure.identifier)(newString);
                    }
                }
            }
        }
    }
};
