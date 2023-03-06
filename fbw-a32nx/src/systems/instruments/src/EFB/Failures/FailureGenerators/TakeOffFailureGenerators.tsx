import React, { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, basicData, failureGeneratorCommonFunction, FailurePhases, findGeneratorFailures, flatten } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';
import { SimpleInput } from 'instruments/src/EFB/UtilComponents/Form/SimpleInput/SimpleInput';
import { Trash } from 'react-bootstrap-icons/dist';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_TAKEOFF';
const numberOfSettingsPerGenerator = 8;
const uniqueGenPrefix = 'G';
const failureGeneratorArmed :boolean[] = [];
const failureTakeOffSpeedThreshold :number[] = [];
const failureTakeOffAltitudeThreshold :number[] = [];

export const FailureGeneratorButtonsTakeOff : (generatorSettings: any) => JSX.Element[] = (generatorSettings : any) => {
    const htmlReturn : JSX.Element[] = [];
    const setting = generatorSettings.settingsTakeOff;
    if (setting) {
        const nbGenerator = Math.floor(setting.length / numberOfSettingsPerGenerator);
        for (let i = 0; i < nbGenerator; i++) {
            htmlReturn.push(failureGeneratorButtonTakeOff(i, generatorSettings));
        }
    }
    return htmlReturn;
};

const eraseGenerator :(genID : number, generatorSettings : any) => void = (genID : number, generatorSettings : any) => {
    const settings : number[] = generatorSettings.settingsTakeOff;
    settings.splice(genID * numberOfSettingsPerGenerator, numberOfSettingsPerGenerator);
    generatorSettings.setSettingTakeOff(flatten(settings));
    // arming
    failureGeneratorArmed.splice(genID * numberOfSettingsPerGenerator, numberOfSettingsPerGenerator);
    failureTakeOffSpeedThreshold.splice(genID, 1);
    failureTakeOffAltitudeThreshold.splice(genID, 1);
};

const failureGeneratorButtonTakeOff : (genID : number, generatorSettings : any) => JSX.Element = (genID : number, generatorSettings : any) => {
    const settings = generatorSettings.settingsTakeOff;
    const colorArmMode :string[] = [];
    for (let i = 0; i < 4; i++) {
        colorArmMode.push(settings[genID * numberOfSettingsPerGenerator + 0] === i ? 'bg-theme-highlight' : 'bg-theme-accent');
    }
    return (
        <div className="flex flex-col flex-1 py-2 px-2 my-2 text-center rounded-md border-2 border-solid border-theme-accent mx-x">
            <div className="flex flex-row justify-between item-center">
                <div className="mr-4 align-left">
                    <h2>
                        {`${uniqueGenPrefix}${genID.toString()} : Take-Off`}
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
                    className="flex-none mr-4 w-10 h-10 rounded-md bg-theme-accent item-center hover:bg-utility-red"
                >
                    <Trash size={26} />
                </button>
            </div>
            <div className="flex flex-row justify-between">
                <div className="flex flex-col justify-between p-2 text-left border-r-2 border-r-theme-accent">
                    <div className="break-keep">Failure per take-off:</div>
                    <div className="flex flex-row items-center">
                        <SimpleInput
                            className="my-2 w-20 font-mono"
                            fontSizeClassName="text-2xl"
                            number
                            min={0}
                            max={100}
                            value={settings[genID * numberOfSettingsPerGenerator + 1] * 100}
                            onBlur={(x: string) => {
                                if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                                    setNewSetting(parseFloat(x) / 100, generatorSettings, genID, 1);
                                }
                            }}
                        />
                        <div className="ml-2">%</div>
                    </div>
                </div>
                <div className="flex flex-col justify-between p-2 text-left border-r-2 border-r-theme-accent">
                    <div className="break-keep">Low Speed chance:</div>
                    <div className="flex flex-row items-center">
                        <SimpleInput
                            className="my-2 w-20 font-mono"
                            fontSizeClassName="text-2xl"
                            number
                            min={0}
                            max={100 - settings[genID * numberOfSettingsPerGenerator + 3] * 100}
                            value={settings[genID * numberOfSettingsPerGenerator + 2] * 100}
                            onBlur={(x: string) => {
                                if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                                    setNewSetting(parseFloat(x) / 100, generatorSettings, genID, 2);
                                }
                            }}
                        />
                        <div className="ml-2">%</div>
                    </div>
                </div>
                <div className="flex flex-col justify-between p-2 text-left border-r-2 border-r-theme-accent">
                    <div className="break-keep">Medium Speed chance:</div>
                    <div className="flex flex-row items-center">
                        <SimpleInput
                            className="my-2 w-20 font-mono"
                            fontSizeClassName="text-2xl"
                            number
                            min={0}
                            max={100 - settings[genID * numberOfSettingsPerGenerator + 2] * 100}
                            value={settings[genID * numberOfSettingsPerGenerator + 3] * 100}
                            onBlur={(x: string) => {
                                if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                                    setNewSetting(parseFloat(x) / 100, generatorSettings, genID, 3);
                                }
                            }}
                        />
                        <div className="ml-2">%</div>
                    </div>
                </div>
                <div className="flex flex-col justify-between p-2 text-left border-r-2 border-r-theme-accent">
                    <div className="break-keep">Minimum speed:</div>
                    <div className="flex flex-row items-center">
                        <SimpleInput
                            className="my-2 w-20 font-mono"
                            fontSizeClassName="text-2xl"
                            number
                            min={0}
                            max={300}
                            value={settings[genID * numberOfSettingsPerGenerator + 4]}
                            onBlur={(x: string) => {
                                if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                                    setNewSetting(parseFloat(x), generatorSettings, genID, 4);
                                }
                            }}
                        />
                        <div className="ml-2">knots</div>
                    </div>
                </div>
                <div className="flex flex-col justify-between p-2 text-left border-r-2 border-r-theme-accent">
                    <div className="break-keep">Speed transition low-med:</div>
                    <div className="flex flex-row items-center">
                        <SimpleInput
                            className="my-2 w-20 font-mono"
                            fontSizeClassName="text-2xl"
                            number
                            min={0}
                            max={300}
                            value={settings[genID * numberOfSettingsPerGenerator + 5]}
                            onBlur={(x: string) => {
                                if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                                    setNewSetting(parseFloat(x), generatorSettings, genID, 5);
                                }
                            }}
                        />
                        <div className="ml-2">knots</div>
                    </div>
                </div>
                <div className="flex flex-col justify-between p-2 text-left border-r-2 border-r-theme-accent">
                    <div className="break-keep">Max speed:</div>
                    <div className="flex flex-row items-center">
                        <SimpleInput
                            className="my-2 w-20 font-mono"
                            fontSizeClassName="text-2xl"
                            number
                            min={0}
                            max={300}
                            value={settings[genID * numberOfSettingsPerGenerator + 6]}
                            onBlur={(x : string) => {
                                if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                                    setNewSetting(parseFloat(x), generatorSettings, genID, 6);
                                }
                            }}
                        />
                        <div className="ml-2">knots</div>
                    </div>
                </div>
                <div className="flex flex-col justify-between p-2 text-left">
                    <div className="break-keep">Max altitude above runway:</div>
                    <div className="flex flex-row items-center">
                        <SimpleInput
                            className="my-2 w-24 font-mono"
                            fontSizeClassName="text-2xl"
                            number
                            min={0}
                            max={10000}
                            value={settings[genID * numberOfSettingsPerGenerator + 7] * 100}
                            onBlur={(x: string) => {
                                if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                                    setNewSetting(Math.round(parseFloat(x) / 100), generatorSettings, genID, 7);
                                }
                            }}
                        />
                        <div className="ml-2">feet</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const failureGeneratorTakeOff = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');

    const settingsTakeOff : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);

    const nbGeneratorTakeOff = useMemo(() => Math.floor(settingsTakeOff.length / numberOfSettingsPerGenerator), [settingsTakeOff]);
    const { failureFlightPhase } = basicData();

    const altitude = Simplane.getAltitudeAboveGround();
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settingsTakeOff);
            let change = false;
            for (let i = 0; i < nbGeneratorTakeOff; i++) {
                // console.info(failureTakeOffSpeedThreshold[i], failureTakeOffAltitudeThreshold[i], tempFailureGeneratorArmed[i]);
                if (failureGeneratorArmed[i]
                    && ((altitude >= failureTakeOffAltitudeThreshold[i] && failureTakeOffAltitudeThreshold[i] !== -1)
                    || (gs >= failureTakeOffSpeedThreshold[i] && failureTakeOffSpeedThreshold[i] !== -1))) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, uniqueGenPrefix + i.toString());
                    console.info('Take-off failure triggered');
                    failureGeneratorArmed[i] = false;
                    change = true;
                    if (tempSettings[i * numberOfSettingsPerGenerator + 0] === 1) tempSettings[i * numberOfSettingsPerGenerator + 0] = 0;
                }
            }
            if (change) {
                setFailureGeneratorSetting(flatten(tempSettings));
            }
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        if (failureFlightPhase === FailurePhases.TAKEOFF && gs < 1.0) {
            for (let i = 0; i < nbGeneratorTakeOff; i++) {
                if (!failureGeneratorArmed[i] && settingsTakeOff[i * numberOfSettingsPerGenerator + 0] > 0) {
                    if (Math.random() < settingsTakeOff[i * numberOfSettingsPerGenerator + 1]) {
                        const chanceFailureLowTakeOffRegime : number = settingsTakeOff[i * numberOfSettingsPerGenerator + 2];
                        const chanceFailureMediumTakeOffRegime : number = settingsTakeOff[i * numberOfSettingsPerGenerator + 3];
                        const minFailureTakeOffSpeed : number = settingsTakeOff[i * numberOfSettingsPerGenerator + 4];
                        const mediumTakeOffRegimeSpeed : number = settingsTakeOff[i * numberOfSettingsPerGenerator + 5];
                        const maxFailureTakeOffSpeed : number = settingsTakeOff[i * numberOfSettingsPerGenerator + 6];
                        const takeOffDeltaAltitudeEnd : number = 100 * settingsTakeOff[i * numberOfSettingsPerGenerator + 7];
                        const rolledDice = Math.random();
                        if (rolledDice < chanceFailureLowTakeOffRegime) {
                            // Low Take Off speed regime
                            const temp = Math.random() * (mediumTakeOffRegimeSpeed - minFailureTakeOffSpeed) + minFailureTakeOffSpeed;
                            failureTakeOffAltitudeThreshold[i] = -1;
                            failureTakeOffSpeedThreshold[i] = temp;
                            console.info('A failure will occur during this Take-Off at the speed of %d knots', temp);
                        } else if (rolledDice < chanceFailureMediumTakeOffRegime + chanceFailureLowTakeOffRegime) {
                            // Medium Take Off speed regime
                            const temp = Math.random() * (maxFailureTakeOffSpeed - mediumTakeOffRegimeSpeed) + mediumTakeOffRegimeSpeed;
                            failureTakeOffAltitudeThreshold[i] = -1;
                            failureTakeOffSpeedThreshold[i] = temp;
                            console.info('A failure will occur during this Take-Off at the speed of %d knots', temp);
                        } else {
                            // High Take Off speed regime
                            const temp = altitude + 10 + Math.random() * takeOffDeltaAltitudeEnd;
                            failureTakeOffAltitudeThreshold[i] = temp;
                            failureTakeOffSpeedThreshold[i] = -1;
                            console.info('A failure will occur during this Take-Off at altitude %d', temp);
                        }
                        failureGeneratorArmed[i] = true;
                    }
                }
            }
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed.push(false);
    }, []);
};

function setNewSetting(newSetting: number, generatorSettings : any, genID : number, settingIndex : number) {
    const settings = generatorSettings.settingsTakeOff;
    settings[genID * numberOfSettingsPerGenerator + settingIndex] = newSetting;
    generatorSettings.setSettingTakeOff(flatten(settings));
}

export const failureGeneratorAddTakeOff = (generatorsSettings : any) => {
    const additionalSetting = [0, 1, 0.33, 0.33, 30, 95, 140, 40];
    if (generatorsSettings.settingsTakeOff === undefined) {
        console.warn('Undefined generator setting, resetting');
        generatorsSettings.settingsTakeOff = [];
    }
    if (generatorsSettings.settingsTakeOff.length > 0) generatorsSettings.setSettingTakeOff(`${flatten(generatorsSettings.settingsTakeOff)},${additionalSetting}`);
    else generatorsSettings.setSettingTakeOff(additionalSetting);
};
