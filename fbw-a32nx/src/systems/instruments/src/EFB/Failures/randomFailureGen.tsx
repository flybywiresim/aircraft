import React, { useEffect, useMemo } from 'react';
import { Failure } from '@failures';
import { usePersistentNumberProperty, usePersistentProperty } from '@instruments/common/persistence';
import { failureGeneratorAddAltClimb, failureGeneratorAltClimb, FailureGeneratorCardsAltClimb } from 'instruments/src/EFB/Failures/FailureGenerators/AltitudeClimbFailureGenerator';
import { failureGeneratorAddAltDesc, failureGeneratorAltDesc, FailureGeneratorCardsAltDesc } from 'instruments/src/EFB/Failures/FailureGenerators/AltitudeDescentFailureGenerator';
import { failureGeneratorAddPerHour, FailureGeneratorCardsPerHour, failureGeneratorPerHour } from 'instruments/src/EFB/Failures/FailureGenerators/PerHourFailureGenerator';
import { failureGeneratorAddSpeedAccel, FailureGeneratorCardsSpeedAccel, failureGeneratorSpeedAccel } from 'instruments/src/EFB/Failures/FailureGenerators/SpeedAccelFailureGenerator';
import { failureGeneratorAddSpeedDecel, FailureGeneratorCardsSpeedDecel, failureGeneratorSpeedDecel } from 'instruments/src/EFB/Failures/FailureGenerators/SpeedDecelFailureGenerator';
import { failureGeneratorAddTakeOff, FailureGeneratorCardsTakeOff, failureGeneratorTakeOff } from 'instruments/src/EFB/Failures/FailureGenerators/TakeOffFailureGenerator';
import { t } from 'instruments/src/EFB/translation';
import { failureGeneratorAddTimer, FailureGeneratorCardsTimer, failureGeneratorTimer } from 'instruments/src/EFB/Failures/FailureGenerators/TimerFailureGenerator';
import { SimpleInput } from 'instruments/src/EFB/UtilComponents/Form/SimpleInput/SimpleInput';
import { useFailuresOrchestrator } from '../failures-orchestrator-provider';

export const failureGeneratorCommonFunction = () => {
    const [maxFailuresAtOnce, setMaxFailuresAtOnce] = usePersistentNumberProperty('EFB_MAX_FAILURES_AT_ONCE', 2);
    const { changingFailures, activeFailures, allFailures, activate } = useFailuresOrchestrator();
    const totalActiveFailures = useMemo(() => changingFailures.size + activeFailures.size, [changingFailures, activeFailures]);
    return { maxFailuresAtOnce, setMaxFailuresAtOnce, changingFailures, activeFailures, totalActiveFailures, allFailures, activate };
};

export const flatten = (settings : number[]) => {
    let settingString = '';
    for (let i = 0; i < settings.length; i++) {
        settingString += settings[i].toString();
        if (i < settings.length - 1) settingString += ',';
    }
    return settingString;
};

export enum FailurePhases {
    DORMANT= 0,
    TAKEOFF= 1,
    INITIALCLIMB= 2,
    FLIGHT= 3,
}

export const allGeneratorFailures = (allFailures : readonly Readonly<Failure>[]) => {
    const generatorFailuresGetters : Map<number, string> = new Map();
    const generatorFailuresSetters : Map<number, (value: string) => void> = new Map();
    if (allFailures.length > 0) {
        allFailures.forEach((failure) => {
            const [generatorSetting, setGeneratorSetting] = usePersistentProperty(`EFB_FAILURE_${failure.identifier.toString()}_GENERATORS`, '');
            generatorFailuresGetters.set(failure.identifier, generatorSetting);
            generatorFailuresSetters.set(failure.identifier, setGeneratorSetting);
        });
    }
    return { generatorFailuresGetters, generatorFailuresSetters };
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
    // console.info('Looking for failures on generator %s', generatorUniqueID);
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

export const activateRandomFailure = (failureList : readonly Readonly<Failure>[], activate : ((identifier: number) => Promise<void>), activeFailures : Set<number>, _generatorID : string) => {
    const failuresOffMap = failureList.filter((failure) => !activeFailures.has(failure.identifier)).map((failure) => failure.identifier);
    console.info('list of #%d failures, only %d active', failureList.length, failuresOffMap.length);
    if (failuresOffMap.length > 0) {
        const pick = Math.floor(Math.random() * failuresOffMap.length);
        const pickedFailure = failureList.find((failure) => failure.identifier === failuresOffMap[pick]);
        if (pickedFailure) {
            console.info('Failure #%d triggered: %s', pickedFailure.identifier, pickedFailure.name);
            activate(failuresOffMap[pick]);
        }
    }
};

export const basicData = () => {
    const isOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'Bool');
    const maxThrottleMode = Math.max(Simplane.getEngineThrottleMode(0), Simplane.getEngineThrottleMode(1));
    const throttleTakeOff = useMemo(() => (maxThrottleMode === ThrottleMode.FLEX_MCT || maxThrottleMode === ThrottleMode.TOGA), [maxThrottleMode]);
    const failureFlightPhase = useMemo(() => {
        if (isOnGround) {
            if (throttleTakeOff) return FailurePhases.TAKEOFF;
            return FailurePhases.DORMANT;
        }
        if (throttleTakeOff) return FailurePhases.INITIALCLIMB;
        return FailurePhases.FLIGHT;
    }, [throttleTakeOff, isOnGround]);
    return { isOnGround, maxThrottleMode, throttleTakeOff, failureFlightPhase };
};

export function FailureGeneratorFailureSetting(title:string, width : number,
    unit : string, min:number, max:number,
    value: number, mult : number,
    last : boolean, setNewSetting : (newSetting: number, generatorSettings: any, genID: number, settingIndex: number) => void,
    generatorSettings : any, genIndex, settingIndex : number) {
    const multCheck = mult === 0 ? 1 : mult;
    return (
        <div className={`flex flex-col justify-between p-2 text-left ${last ? '' : 'border-r-2 border-r-theme-accent'}`}>
            <div className="break-keep">{title}</div>
            <div className="flex flex-row items-center">
                <SimpleInput
                    className={`my-2 w-${width} font-mono`}
                    fontSizeClassName="text-2xl"
                    number
                    min={min}
                    max={max}
                    value={value * multCheck}
                    onBlur={(x: string) => {
                        if (!Number.isNaN(parseFloat(x) || parseFloat(x) === 0)) {
                            setNewSetting(parseFloat(x) / multCheck, generatorSettings, genIndex, settingIndex);
                        }
                    }}
                />
                <div className="ml-2">{unit}</div>
            </div>
        </div>
    );
}

export const failureGeneratorsSettings = () => {
    const [settingTakeOff, setSettingTakeOff] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_TAKEOFF');
    const [settingPerHour, setSettingPerHour] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_PERHOUR');
    const [settingTimer, setSettingTimer] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_TIMER');
    const [settingSpeedAccel, setSettingSpeedAccel] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_SPEEDACCEL');
    const [settingSpeedDecel, setSettingSpeedDecel] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_SPEEDDECEL');
    const [settingAltClimb, setSettingAltClimb] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_ALTCLIMB');
    const [settingAltDesc, setSettingAltDesc] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_ALTDESC');
    const settingsTakeOff = useMemo(() => {
        console.info(settingTakeOff);
        const splitString = settingTakeOff?.split(',');
        if (splitString) return splitString.map(((it : string) => parseFloat(it)));
        return [];
    }, [settingTakeOff]);
    const settingsPerHour = useMemo(() => {
        console.info(settingPerHour);
        const splitString = settingPerHour?.split(',');
        if (splitString) return splitString.map(((it : string) => parseFloat(it)));
        return [];
    }, [settingPerHour]);
    const settingsTimer = useMemo(() => {
        console.info(settingTimer);
        const splitString = settingTimer?.split(',');
        if (splitString) return splitString.map(((it : string) => parseFloat(it)));
        return [];
    }, [settingTimer]);
    const settingsSpeedAccel = useMemo(() => {
        console.info(settingSpeedAccel);
        const splitString = settingSpeedAccel?.split(',');
        if (splitString) return splitString.map(((it : string) => parseFloat(it)));
        return [];
    }, [settingSpeedAccel]);
    const settingsSpeedDecel = useMemo(() => {
        console.info(settingSpeedDecel);
        const splitString = settingSpeedDecel?.split(',');
        if (splitString) return splitString.map(((it : string) => parseFloat(it)));
        return [];
    }, [settingSpeedDecel]);
    const settingsAltClimb = useMemo(() => {
        console.info(settingAltClimb);
        const splitString = settingAltClimb?.split(',');
        if (splitString) return splitString.map(((it : string) => parseFloat(it)));
        return [];
    }, [settingAltClimb]);
    const settingsAltDesc = useMemo(() => {
        console.info(settingAltDesc);
        const splitString = settingAltDesc?.split(',');
        if (splitString) return splitString.map(((it : string) => parseFloat(it)));
        return [];
    }, [settingAltDesc]);
    const { maxFailuresAtOnce, setMaxFailuresAtOnce } = failureGeneratorCommonFunction();

    return {
        maxFailuresAtOnce,
        setMaxFailuresAtOnce,
        settingsTakeOff,
        setSettingTakeOff,
        settingsPerHour,
        setSettingPerHour,
        settingsTimer,
        setSettingTimer,
        settingsSpeedAccel,
        setSettingSpeedAccel,
        settingsSpeedDecel,
        setSettingSpeedDecel,
        settingsAltClimb,
        setSettingAltClimb,
        settingsAltDesc,
        setSettingAltDesc,
    };
};

export const failureGeneratorNames: GeneratorOption[] = [
    { name: 'PerHour', alias: t('Failures.Generators.GenPerHour') },
    { name: 'TakeOff', alias: t('Failures.Generators.GenTakeOff') },
    { name: 'Timer', alias: t('Failures.Generators.GenTimer') },
    { name: 'AltClimb', alias: t('Failures.Generators.GenAltClimb') },
    { name: 'AltDescent', alias: t('Failures.Generators.GenAltDesc') },
    { name: 'SpeedAccel', alias: t('Failures.Generators.GenSpeedAccel') },
    { name: 'SpeedDecel', alias: t('Failures.Generators.GenSpeedDecel') },
];

export const addGenerator = (chosenGen : string, settings : any) => {
    switch (chosenGen) {
    case 'PerHour': return () => failureGeneratorAddPerHour(settings);
    case 'TakeOff': return () => failureGeneratorAddTakeOff(settings);
    case 'Timer': return () => failureGeneratorAddTimer(settings);
    case 'AltClimb': return () => failureGeneratorAddAltClimb(settings);
    case 'AltDescent': return () => failureGeneratorAddAltDesc(settings);
    case 'SpeedAccel': return () => failureGeneratorAddSpeedAccel(settings);
    case 'SpeedDecel': return () => failureGeneratorAddSpeedDecel(settings);
    default: return () => {};
    }
};

interface GeneratorOption {
    name: string;
    alias: string;
}

export const failureGeneratorCards: ((generatorSettings: any) => JSX.Element[])[] = [
    FailureGeneratorCardsAltClimb,
    FailureGeneratorCardsAltDesc,
    FailureGeneratorCardsSpeedAccel,
    FailureGeneratorCardsSpeedDecel,
    FailureGeneratorCardsPerHour,
    FailureGeneratorCardsTimer,
    FailureGeneratorCardsTakeOff,
];

export const generatorsCardList : (generatorSettings : any) => JSX.Element[] = (generatorSettings : any) => {
    let temp : JSX.Element[] = [];
    for (let i = 0; i < failureGeneratorCards.length; i++) {
        temp = temp.concat(failureGeneratorCards[i](generatorSettings));
    }
    return temp;
};

const failureGenerators : ((generatorFailuresGetters : Map<number, string>) => void)[] = [
    failureGeneratorAltClimb,
    failureGeneratorAltDesc,
    failureGeneratorSpeedAccel,
    failureGeneratorSpeedDecel,
    failureGeneratorPerHour,
    failureGeneratorTimer,
    failureGeneratorTakeOff,

];

export const randomFailureGenerator = () => {
    const { failureFlightPhase } = basicData();
    const { allFailures } = failureGeneratorCommonFunction();
    const { generatorFailuresGetters, generatorFailuresSetters } = allGeneratorFailures(allFailures);

    // TODO: to be improved, changing doesn't mean active but this is not critical

    for (let i = 0; i < failureGenerators.length; i++) {
        failureGenerators[i](generatorFailuresGetters);
    }

    useEffect(() => {
        console.info('Failure phase: %d', failureFlightPhase);
    }, [failureFlightPhase]);

    useEffect(() => {
        generatorFailuresSetters.get(22000)('');
        generatorFailuresSetters.get(22001)('');
        generatorFailuresSetters.get(24000)('');
        generatorFailuresSetters.get(24001)('');
        generatorFailuresSetters.get(24002)('');
        generatorFailuresSetters.get(27000)('');
        generatorFailuresSetters.get(27001)('');
        generatorFailuresSetters.get(27002)('G0');
        generatorFailuresSetters.get(27003)('G1');
        generatorFailuresSetters.get(27004)('');
        generatorFailuresSetters.get(27005)('');
        generatorFailuresSetters.get(27006)('');
        generatorFailuresSetters.get(29000)('');
        generatorFailuresSetters.get(29001)('');
        generatorFailuresSetters.get(29002)('');
        generatorFailuresSetters.get(29003)('');
        generatorFailuresSetters.get(29004)('');
        generatorFailuresSetters.get(29005)('');
        generatorFailuresSetters.get(29006)('');
        generatorFailuresSetters.get(29007)('');
        generatorFailuresSetters.get(29008)('');
        generatorFailuresSetters.get(29009)('');
        generatorFailuresSetters.get(29010)('');
        generatorFailuresSetters.get(29011)('');
        generatorFailuresSetters.get(29012)('');
        generatorFailuresSetters.get(31000)('');
        generatorFailuresSetters.get(31001)('');
        generatorFailuresSetters.get(32000)('');
        generatorFailuresSetters.get(32001)('');
        generatorFailuresSetters.get(32002)('');
        generatorFailuresSetters.get(32003)('');
        generatorFailuresSetters.get(32004)('');
        generatorFailuresSetters.get(32005)('');
        generatorFailuresSetters.get(32006)('');
        generatorFailuresSetters.get(32007)('');
        generatorFailuresSetters.get(32008)('');
        generatorFailuresSetters.get(32009)('');
        generatorFailuresSetters.get(32010)('');
        generatorFailuresSetters.get(32011)('');
        generatorFailuresSetters.get(32012)('');
        generatorFailuresSetters.get(32013)('');
        generatorFailuresSetters.get(32014)('');
        generatorFailuresSetters.get(32015)('');
        generatorFailuresSetters.get(32020)('');
        generatorFailuresSetters.get(32021)('');
        generatorFailuresSetters.get(32022)('');
        generatorFailuresSetters.get(32023)('');
        generatorFailuresSetters.get(32024)('');
        generatorFailuresSetters.get(32025)('');
        generatorFailuresSetters.get(32100)('');
        generatorFailuresSetters.get(32101)('');
        generatorFailuresSetters.get(32150)('');
        generatorFailuresSetters.get(34000)('');
        generatorFailuresSetters.get(34001)('');
    }, []);
};
