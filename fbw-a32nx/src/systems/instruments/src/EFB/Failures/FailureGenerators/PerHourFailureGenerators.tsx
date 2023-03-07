import React, { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, basicData, failureGeneratorCommonFunction, FailurePhases, findGeneratorFailures, flatten } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';
import { SimpleInput } from 'instruments/src/EFB/UtilComponents/Form/SimpleInput/SimpleInput';
import { Trash } from 'react-bootstrap-icons';

const numberOfSettingsPerGenerator = 2;
const uniqueGenPrefix = 'E';
const failureGeneratorArmed :boolean[] = [];

export const FailureGeneratorButtonsPerHour : (generatorSettings: any) => JSX.Element[] = (generatorSettings : any) => {
    const htmlReturn : JSX.Element[] = [];
    const setting = generatorSettings.settingsPerHour;
    if (setting) {
        const nbGenerator = Math.floor(setting.length / numberOfSettingsPerGenerator);
        for (let i = 0; i < nbGenerator; i++) {
            htmlReturn.push(failureGeneratorButtonPerHour(i, generatorSettings));
        }
    }
    return htmlReturn;
};

const eraseGenerator :(genID : number, generatorSettings : any) => void = (genID : number, generatorSettings : any) => {
    const settings : number[] = generatorSettings.settingsPerHour;
    settings.splice(genID * numberOfSettingsPerGenerator, numberOfSettingsPerGenerator);
    generatorSettings.setSettingPerHour(flatten(settings));
    // arming
    failureGeneratorArmed.splice(genID * numberOfSettingsPerGenerator, numberOfSettingsPerGenerator);
};

const failureGeneratorButtonPerHour : (genID : number, generatorSettings : any) => JSX.Element = (genID : number, generatorSettings : any) => {
    const settings = generatorSettings.settingsPerHour;
    const colorArmMode :string[] = [];
    for (let i = 0; i < 4; i++) {
        colorArmMode.push(settings[genID * numberOfSettingsPerGenerator + 0] === i ? 'bg-theme-highlight' : 'bg-theme-accent');
    }
    return (
        <div className="flex flex-col flex-1 py-2 px-2 my-2 text-center rounded-md border-2 border-solid border-theme-accent mx-x">
            <div className="flex flex-row justify-between item-center">
                <div className="mr-4 align-left">
                    <h2>
                        {`${uniqueGenPrefix}${genID.toString()} : Chance per hour`}
                    </h2>
                </div>
                <div className="flex flex-col text-center">
                    <h2>Rearming</h2>
                    <div className="flex flex-row">
                        <button
                            type="button"
                            onClick={() => setNewSetting(0, generatorSettings, genID, 0)}
                            className={`py-2 px-2 mx-0 text-center border-r-2 border-solid border-theme-highlight rounded-l-md hover:bg-theme-highlight ${colorArmMode[0]}`}
                        >
                            <h2>OFF</h2>
                        </button>
                        <button
                            type="button"
                            onClick={() => setNewSetting(1, generatorSettings, genID, 0)}
                            className={`py-2 px-2 mx-0 text-center border-r-2 border-solid border-theme-highlight hover:bg-theme-highlight ${colorArmMode[1]}`}
                        >
                            <h2>Once</h2>
                        </button>
                        <button
                            type="button"
                            onClick={() => setNewSetting(2, generatorSettings, genID, 0)}
                            className={`py-2 px-2 mx-0 text-center border-r-2 border-solid border-theme-highlight hover:bg-theme-highlight ${colorArmMode[2]}`}
                        >
                            <h2>Take-Off</h2>
                        </button>
                        <button
                            type="button"
                            onClick={() => setNewSetting(3, generatorSettings, genID, 0)}
                            className={`py-2 px-2 mx-0 text-center rounded-r-md hover:bg-theme-highlight ${colorArmMode[3]}`}
                        >
                            <h2>Always</h2>
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => eraseGenerator(genID, generatorSettings)}
                    className="flex-none mr-4 w-10 h-10 rounded-md bg-theme-accent hover:bg-utility-red"
                >
                    <Trash size={26} />
                </button>
            </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-col justify-between p-2 text-left border-r-2 border-r-theme-accent">
                    <div className="break-keep">Failure per hour:</div>
                    <div className="flex flex-row items-center">
                        <SimpleInput
                            className="my-2 w-40 font-mono"
                            fontSizeClassName="text-2xl"
                            number
                            min={0}
                            max={60}
                            value={settings[genID * numberOfSettingsPerGenerator + 1]}
                            onBlur={(x: string) => {
                                if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                                    setNewSetting(parseFloat(x), generatorSettings, genID, 1);
                                }
                            }}
                        />
                        <div className="ml-2">per hour</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const failureGeneratorPerHour = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime5s] = useSimVar('E:ABSOLUTE TIME', 'seconds', 5000);
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_PERHOUR', '');
    const settingsPerHour : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const { failureFlightPhase } = basicData();
    const nbGeneratorPerHour = useMemo(() => Math.floor(settingsPerHour.length / numberOfSettingsPerGenerator), [settingsPerHour]);

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settingsPerHour);
            let change = false;
            for (let i = 0; i < nbGeneratorPerHour; i++) {
                const tempSetting = settingsPerHour[i * numberOfSettingsPerGenerator + 1];
                if (failureGeneratorArmed[i] && tempSetting > 0) {
                    const chancePerSecond = tempSetting / 3600;
                    const rollDice = Math.random();
                    // console.info('dice: %.4f / %.4f', rollDice, chancePerSecond * 5);
                    if (rollDice < chancePerSecond * 5) {
                        console.info('PerHour Failure triggered');
                        activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                            activate, activeFailures, uniqueGenPrefix + i.toString());
                        failureGeneratorArmed[i] = false;
                        change = true;
                        if (tempSettings[i * numberOfSettingsPerGenerator + 0] === 1) tempSettings[i * numberOfSettingsPerGenerator + 0] = 0;
                    }
                }
            }
            if (change) {
                setFailureGeneratorSetting(flatten(tempSettings));
            }
        }
    }, [absoluteTime5s]);

    useEffect(() => {
        for (let i = 0; i < nbGeneratorPerHour; i++) {
            if (!failureGeneratorArmed[i]
                && (settingsPerHour[i * numberOfSettingsPerGenerator + 0] === 1
                    || (settingsPerHour[i * numberOfSettingsPerGenerator + 0] === 2 && failureFlightPhase === FailurePhases.FLIGHT)
                    || settingsPerHour[i * numberOfSettingsPerGenerator + 0] === 3)) {
                failureGeneratorArmed[i] = true;
                console.info('Failure set at %.4f per hour ', settingsPerHour[i * numberOfSettingsPerGenerator + 1]);
            }
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed[i] = false;
    }, []);
};

function setNewSetting(newSetting: number, generatorSettings : any, genID : number, settingIndex : number) {
    const settings = generatorSettings.settingsPerHour;
    settings[genID * numberOfSettingsPerGenerator + settingIndex] = newSetting;
    generatorSettings.setSettingPerHour(flatten(settings));
}

export const failureGeneratorAddPerHour = (generatorsSettings : any) => {
    const additionalSetting = [0, 0.1];
    if (generatorsSettings.settingsPerHour === undefined || generatorsSettings.settingsPerHour.length % numberOfSettingsPerGenerator !== 0 || generatorsSettings.settingsPerHour.length === 0) {
        // console.warn('Undefined generator setting, resetting');
        generatorsSettings.setSettingPerHour(flatten(additionalSetting));
    } else generatorsSettings.setSettingPerHour(flatten(generatorsSettings.settingsPerHour.concat(additionalSetting)));
};
