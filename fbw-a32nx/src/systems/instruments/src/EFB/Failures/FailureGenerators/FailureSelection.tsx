import { Failure } from 'failures/src/failures-orchestrator';
import { FailureGenContext, FailureGenData } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';

export function selectAllFailureChapter(chapter: number, failureGenContext : FailureGenContext, genIDToChange : string, value : boolean): void {
    failureGenContext.allFailures.forEach((failure) => {
        if (failure.ata === chapter) {
            setSelectedFailure(failure, genIDToChange, failureGenContext, value);
        }
    });
}

export function selectAllFailures(failureGenContext : FailureGenContext, genIDToChange : string, value : boolean): void {
    failureGenContext.allFailures.forEach((failure) => {
        setSelectedFailure(failure, genIDToChange, failureGenContext, value);
    });
}

export const setSelectedFailure = (failure : Failure, genIDToChange : string, failureGenContext :FailureGenContext, value : boolean) => {
    const initialString = failureGenContext.generatorFailuresGetters.get(failure.identifier);
    const generatorsForFailure = initialString.split(',');
    let newSetting : string = '';
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
            generatorsForFailure.forEach((generatorID) => {
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
            });
        }
        failureGenContext.generatorFailuresSetters.get(failure.identifier)(newSetting);
    }
};

const regexLetter = /\D{1,2}/;
const regexNumber = /\d{1,2}/;

export function ExtractFirstLetter(generatorUniqueID : string) {
    const letterTable = generatorUniqueID.match(regexLetter);
    if (letterTable && letterTable.length > 0) return letterTable[0];
    return '';
}

export function ExtractFirstNumber(generatorUniqueID : string) {
    const numberTable = generatorUniqueID.match(regexNumber);
    if (numberTable && numberTable.length > 0) return parseInt(numberTable[0]);
    return undefined;
}

export const deleteGeneratorFailures = (generatorSettings : FailureGenData, failureGenContext:FailureGenContext, generatorUniqueIDRemoved: string) => {
    const letterTable = generatorUniqueIDRemoved.match(regexLetter);
    const numberTable = generatorUniqueIDRemoved.match(regexNumber);
    if (letterTable && letterTable.length > 0 && numberTable && numberTable.length > 0) {
        const removedLetter = letterTable[0];
        const removedNumber = parseInt(numberTable[0]);
        if (failureGenContext.allFailures.length > 0) {
            failureGenContext.allFailures.forEach((failure) => {
                let first = true;
                const generatorSetting = failureGenContext.generatorFailuresGetters.get(failure.identifier);
                let newString = '';
                if (generatorSetting) {
                    const failureGeneratorsTable = generatorSetting.split(',');
                    if (failureGeneratorsTable.length > 0) {
                        failureGeneratorsTable.forEach((generator) => {
                            const genLetterTable = generator.match(regexLetter);
                            const genNumberTable = generator.match(regexNumber);
                            if (genLetterTable && genLetterTable.length > 0 && genNumberTable && genNumberTable.length > 0) {
                                const generatorNumber = parseInt(genNumberTable[0]);
                                const generatorLetter = genLetterTable[0];
                                if (generatorLetter !== removedLetter || generatorNumber < removedNumber) {
                                    newString = newString.concat(first ? `${generator}` : generator);
                                    first = false;
                                } else if (generatorNumber > removedNumber) {
                                    const offset = `${generatorLetter}${(generatorNumber - 1).toString()}`;
                                    newString = newString.concat(first ? `${offset}` : offset);
                                    first = false;
                                }
                            }
                        });
                        failureGenContext.generatorFailuresSetters.get(failure.identifier)(newString);
                    }
                }
            });
        }
    }
};

export const findGeneratorFailures = (allFailures : readonly Readonly<Failure>[], generatorFailuresGetters : Map<number, string>, generatorUniqueID: string) => {
    const failureIDs : Failure[] = [];
    if (allFailures.length > 0) {
        allFailures.forEach((failure) => {
            const generatorSetting = generatorFailuresGetters.get(failure.identifier);
            if (generatorSetting) {
                const failureGeneratorsTable = generatorSetting.split(',');
                if (failureGeneratorsTable.length > 0) {
                    failureGeneratorsTable.forEach((generator) => {
                        if (generator === generatorUniqueID) failureIDs.push(failure);
                    });
                }
            }
        });
    }
    return failureIDs;
};
