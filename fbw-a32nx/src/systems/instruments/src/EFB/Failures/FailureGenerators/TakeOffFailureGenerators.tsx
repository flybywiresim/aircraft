import React, { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, basicData, failureGeneratorCommonFunction, FailurePhases, findGeneratorFailures, flatten } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';
import { SimpleInput } from 'instruments/src/EFB/UtilComponents/Form/SimpleInput/SimpleInput';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_TAKEOFF';
const numberOfSettingsPerGenerator = 8;
const uniqueGenPrefix = 'G';
const failureGeneratorArmed :boolean[] = [];
const failureTakeOffSpeedThreshold :number[] = [];
const failureTakeOffAltitudeThreshold :number[] = [];

export const FailureGeneratorButtonsTakeOff : (generatorSettings: any) => JSX.Element[] = (generatorSettings : any) => {
    const htmlReturn : JSX.Element[] = [];
    const setting = generatorSettings.settingTakeOff;
    if (setting) {
        const nbGenerator = Math.floor(setting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < nbGenerator; i++) {
            htmlReturn.push(failureGeneratorButtonTakeOff(i, generatorSettings));
        }
    }
    return htmlReturn;
};

const eraseGenerator :(genID : number, generatorSettings : any) => void = (genID : number, generatorSettings : any) => {
    const settings : number[] = generatorSettings.settingTakeOff.split(',').map(((it : string) => parseFloat(it)));
    settings.splice(genID * numberOfSettingsPerGenerator, numberOfSettingsPerGenerator);
    generatorSettings.setSettingTakeOff(flatten(settings));
    // arming
    failureGeneratorArmed.splice(genID * numberOfSettingsPerGenerator, numberOfSettingsPerGenerator);
    failureTakeOffSpeedThreshold.splice(genID, 1);
    failureTakeOffAltitudeThreshold.splice(genID, 1);
};

const failureGeneratorButtonTakeOff : (genID : number, generatorSettings : any) => JSX.Element = (genID : number, generatorSettings : any) => {
    const settings = generatorSettings.settingsTakeOff;
    return (
        <div className="relative flex-col py-2 px-2 my-2 text-center rounded-md border-white mx-x black border-1">
            <div className="flex-row">
                <h2 className="text-left">
                    {`${uniqueGenPrefix}${genID.toString()} : Take-Off`}
                </h2>
                <button
                    type="button"
                    onClick={() => eraseGenerator(genID, generatorSettings)}
                    className="absolute right-2 flex-1 py-2 px-2 mr-4 text-center rounded-md bg-theme-accent blue"
                >
                    <h2>X</h2>
                </button>
            </div>
            <div className="flex-row text-left">
                Failure per take-off:
                <SimpleInput
                    className="my-2 w-full font-mono"
                    fontSizeClassName="text-2xl"
                    number
                    min={0}
                    max={100}
                    value={settings[genID * numberOfSettingsPerGenerator + 1] * 100}
                    onBlur={(x) => {
                        if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                            setNewSetting(parseFloat(x) / 100, generatorSettings, genID, 1);
                        }
                    }}
                />
                %
            </div>
            <div className="text-left">
                Low Speed chance:
                <SimpleInput
                    className="my-2 w-full font-mono"
                    fontSizeClassName="text-2xl"
                    number
                    min={0}
                    max={100 - settings[genID * numberOfSettingsPerGenerator + 3] * 100}
                    value={settings[genID * numberOfSettingsPerGenerator + 2] * 100}
                    onBlur={(x) => {
                        if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                            setNewSetting(parseFloat(x) / 100, generatorSettings, genID, 2);
                        }
                    }}
                />
                %
            </div>
            <div className="text-left">
                Medium Speed chance:
                <SimpleInput
                    className="my-2 w-full font-mono"
                    fontSizeClassName="text-2xl"
                    number
                    min={0}
                    max={100 - settings[genID * numberOfSettingsPerGenerator + 2] * 100}
                    value={settings[genID * numberOfSettingsPerGenerator + 3] * 100}
                    onBlur={(x) => {
                        if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                            setNewSetting(parseFloat(x) / 100, generatorSettings, genID, 3);
                        }
                    }}
                />
                %
            </div>
            <div className="text-left">
                Minimum speed:
                <SimpleInput
                    className="my-2 w-full font-mono"
                    fontSizeClassName="text-2xl"
                    number
                    min={0}
                    max={300}
                    value={settings[genID * numberOfSettingsPerGenerator + 4]}
                    onBlur={(x) => {
                        if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                            setNewSetting(parseFloat(x), generatorSettings, genID, 4);
                        }
                    }}
                />
                knots
            </div>
            <div className="text-left">
                Speed transition low-med:
                <SimpleInput
                    className="my-2 w-full font-mono"
                    fontSizeClassName="text-2xl"
                    number
                    min={0}
                    max={300}
                    value={settings[genID * numberOfSettingsPerGenerator + 5]}
                    onBlur={(x) => {
                        if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                            setNewSetting(parseFloat(x), generatorSettings, genID, 5);
                        }
                    }}
                />
                knots
            </div>
            <div className="text-left">
                Max speed:
                <SimpleInput
                    className="my-2 w-full font-mono"
                    fontSizeClassName="text-2xl"
                    number
                    min={0}
                    max={300}
                    value={settings[genID * numberOfSettingsPerGenerator + 6]}
                    onBlur={(x) => {
                        if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                            setNewSetting(parseFloat(x), generatorSettings, genID, 6);
                        }
                    }}
                />
                knots
            </div>
            <div className="text-left">
                Max altitude above runway:
                <SimpleInput
                    className="my-2 w-full font-mono"
                    fontSizeClassName="text-2xl"
                    number
                    min={0}
                    max={10000}
                    value={settings[genID * numberOfSettingsPerGenerator + 7] * 100}
                    onBlur={(x) => {
                        if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                            setNewSetting(Math.round(parseFloat(x) / 100), generatorSettings, genID, 7);
                        }
                    }}
                />
                feet
            </div>
        </div>
    );
};

export const failureGeneratorTakeOff = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '2,1,0.33,0.40,30,100,140,5000,2,1,0.33,0.40,30,100,140,5000');

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
    const settings = generatorSettings.settingTakeOff.split(',').map(((it : string) => parseFloat(it)));
    settings[genID * numberOfSettingsPerGenerator + settingIndex] = newSetting;
    generatorSettings.setSettingTakeOff(flatten(settings));
}

export const failureGeneratorAddTakeOff = (generatorsSettings : any) => {
    let tempSettings : string = generatorsSettings.settingTakeOff;
    const additionalSetting = '2,1,0.33,0.33,30,95,140,40';
    if (tempSettings === undefined) {
        console.warn('Undefined generator setting, resetting');
        tempSettings = '';
    }
    if (tempSettings.length > 0) generatorsSettings.setSettingTakeOff(`${tempSettings},${additionalSetting}`);
    else generatorsSettings.setSettingTakeOff(additionalSetting);
};
