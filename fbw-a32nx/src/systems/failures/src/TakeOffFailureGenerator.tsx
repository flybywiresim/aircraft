import { useEffect, useMemo } from 'react';
import { useSimVar, usePersistentProperty } from '@flybywiresim/fbw-sdk';
import {
    basicData, failureGeneratorCommonFunction,
    FailurePhases, flatten,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGenUI';

import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelectionUI';
import { ArmingIndex, FailuresAtOnceIndex, MaxFailuresIndex } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { activateRandomFailure } from 'failures/src/RandomFailureGen';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_TAKEOFF';
const numberOfSettingsPerGenerator = 10;
const uniqueGenPrefix = 'E';
const failureGeneratorArmed :boolean[] = [];
const failureTakeOffSpeedThreshold :number[] = [];
const failureTakeOffAltitudeThreshold :number[] = [];

const ChancePerTakeOffIndex = 3;
const ChanceLowIndex = 4;
const ChanceMediumIndex = 5;
const MinSpeedIndex = 6;
const MediumSpeedIndex = 7;
const MaxSpeedIndex = 8;
const AltitudeIndex = 9;

export const failureGeneratorTakeOff = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');

    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);

    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);
    const { failureFlightPhase } = basicData();

    const [altitude] = useSimVar('PLANE ALTITUDE', 'feet', 500);
    const [gs] = useSimVar('GPS GROUND SPEED', 'knots', 500);

    useEffect(() => {
        const tempSettings : number[] = Array.from(settings);
        let change = false;
        for (let i = 0; i < nbGenerator; i++) {
            if (failureGeneratorArmed[i]
                    && ((altitude >= failureTakeOffAltitudeThreshold[i] && failureTakeOffAltitudeThreshold[i] !== -1)
                    || (gs >= failureTakeOffSpeedThreshold[i] && failureTakeOffSpeedThreshold[i] !== -1))) {
                const numberOfFailureToActivate = Math.min(settings[i * numberOfSettingsPerGenerator + FailuresAtOnceIndex],
                    settings[i * numberOfSettingsPerGenerator + MaxFailuresIndex] - totalActiveFailures);
                if (numberOfFailureToActivate > 0) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, numberOfFailureToActivate);
                    failureGeneratorArmed[i] = false;
                    change = true;
                    if (tempSettings[i * numberOfSettingsPerGenerator + ArmingIndex] === 1) tempSettings[i * numberOfSettingsPerGenerator + ArmingIndex] = 0;
                }
            }
        }
        if (change) {
            setFailureGeneratorSetting(flatten(tempSettings));
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        for (let i = 0; i < nbGenerator; i++) {
            const minFailureTakeOffSpeed : number = settings[i * numberOfSettingsPerGenerator + MinSpeedIndex];
            if (!failureGeneratorArmed[i]) {
                if (settings[i * numberOfSettingsPerGenerator + ArmingIndex] > 0) {
                    if (gs < minFailureTakeOffSpeed && failureFlightPhase === FailurePhases.TAKEOFF) {
                        if (Math.random() < settings[i * numberOfSettingsPerGenerator + ChancePerTakeOffIndex]) {
                            const chanceFailureLowTakeOffRegime : number = settings[i * numberOfSettingsPerGenerator + ChanceLowIndex];
                            const chanceFailureMediumTakeOffRegime : number = settings[i * numberOfSettingsPerGenerator + ChanceMediumIndex];
                            const lowMedTakeOffSpeed : number = settings[i * numberOfSettingsPerGenerator + MediumSpeedIndex];
                            const medHighTakeOffSpeed : number = settings[i * numberOfSettingsPerGenerator + MaxSpeedIndex];
                            const takeOffDeltaAltitudeEnd : number = 100 * settings[i * numberOfSettingsPerGenerator + AltitudeIndex];
                            const rolledDice = Math.random();
                            if (rolledDice < chanceFailureLowTakeOffRegime) {
                            // Low Take Off speed regime
                                const temp = Math.random() * (lowMedTakeOffSpeed - minFailureTakeOffSpeed) + minFailureTakeOffSpeed;
                                failureTakeOffAltitudeThreshold[i] = -1;
                                failureTakeOffSpeedThreshold[i] = temp;
                            } else if (rolledDice < chanceFailureMediumTakeOffRegime + chanceFailureLowTakeOffRegime) {
                            // Medium Take Off speed regime
                                const temp = Math.random() * (medHighTakeOffSpeed - lowMedTakeOffSpeed) + lowMedTakeOffSpeed;
                                failureTakeOffAltitudeThreshold[i] = -1;
                                failureTakeOffSpeedThreshold[i] = temp;
                            } else {
                            // High Take Off speed regime
                                const temp = altitude + 10 + Math.random() * takeOffDeltaAltitudeEnd;
                                failureTakeOffAltitudeThreshold[i] = temp;
                                failureTakeOffSpeedThreshold[i] = -1;
                            }
                            failureGeneratorArmed[i] = true;
                        }
                    }
                }
            } else if (settings[i * numberOfSettingsPerGenerator + ArmingIndex] === 0)failureGeneratorArmed[i] = false;
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed.push(false);
    }, []);
};
