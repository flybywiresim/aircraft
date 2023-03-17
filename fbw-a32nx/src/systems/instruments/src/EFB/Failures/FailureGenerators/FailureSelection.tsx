import { Failure } from 'failures/src/failures-orchestrator';
import { FailureGenContext } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';

export const setSelectedFailure = (failure : Failure, genIDToChange : string, failureGenContext :FailureGenContext, value : boolean) => {
    const initialString = failureGenContext.generatorFailuresGetters.get(failure.identifier);
    const generatorsForFailure = initialString.split(',');
    let newSetting : string = '';
    console.info(`setting ${genIDToChange} to ${value}`);
    console.info(`initial setting string ${initialString}`);
    if (value === true) {
        if (generatorsForFailure.length > 0) {
            newSetting = initialString.concat(`,${genIDToChange}`);
        } else {
            newSetting = genIDToChange;
        }
    } else if (generatorsForFailure.length > 0) {
        let first = true;
        generatorsForFailure.forEach((generatorID) => {
            if (genIDToChange !== generatorID) {
                if (first) {
                    newSetting = newSetting.concat(generatorID);
                } else {
                    first = false;
                    newSetting = newSetting.concat(`,${generatorID}`);
                }
            }
        });
    }
    console.info(`New setting string ${newSetting}`);
    failureGenContext.generatorFailuresSetters.get(failure.identifier)(newSetting);
};

export const deleteGeneratorFailures = (allFailures : readonly Readonly<Failure>[], generatorFailuresGetters : Map<number, string>,
    generatorFailuresSetters : Map<number, (value: string) => void>, generatorUniqueIDRemoved: string) => {
    // console.info('Looking for failures on generator %s', generatorUniqueID);
    const removedLetter = generatorUniqueIDRemoved.match(/\D{1-2}/)[0];
    const removedNumber = parseInt(generatorUniqueIDRemoved.match(/\D{1-2}/)[0]);
    if (allFailures.length > 0) {
        allFailures.forEach((failure) => {
            let first = true;
            const generatorSetting = generatorFailuresGetters.get(failure.identifier);
            console.info(generatorSetting);
            let newString = '';
            if (generatorSetting) {
                const failureGeneratorsTable = generatorSetting.split(',');
                if (failureGeneratorsTable.length > 0) {
                    failureGeneratorsTable.forEach((generator) => {
                        const generatorNumber = parseInt(generator.match(/\d{1-2}/)[0]);
                        const generatorLetter = generator.match(/\D{1-2}/)[0];
                        if (generatorLetter !== removedLetter || generatorNumber < removedNumber) {
                            newString = newString.concat(first ? `${generator}` : generator);
                            first = false;
                        } else if (generatorNumber > removedNumber) {
                            const offset = `${generatorLetter}${(generatorNumber - 1).toString()}`;
                            newString = newString.concat(first ? `${offset}` : offset);
                            first = false;
                        }
                    });
                    console.info(newString);
                    generatorFailuresSetters.get(failure.identifier)(newString);
                }
            }
        });
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
