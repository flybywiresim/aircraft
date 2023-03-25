import { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    activateRandomFailure, basicData, FailureGenContext, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';
import { FailureGeneratorCardTemplateUI, FailureGeneratorSingleSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { t } from 'instruments/src/EFB/translation';
import { findGeneratorFailures } from 'instruments/src/EFB/Failures/FailureGenerators/FailureSelection';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_TAKEOFF';
const numberOfSettingsPerGenerator = 8;
const uniqueGenPrefix = 'G';
const additionalSetting = [0, 1, 0.33, 0.33, 30, 95, 140, 40];
const failureGeneratorArmed :boolean[] = [];
const failureTakeOffSpeedThreshold :number[] = [];
const failureTakeOffAltitudeThreshold :number[] = [];
const genName = 'TakeOff';
const alias = () => t('Failures.Generators.GenTakeOff');
const disableTakeOffRearm = true;

export const failureGenConfigTakeOff : ()=>FailureGenData = () => {
    const [setting, setSetting] = usePersistentProperty(settingName);
    const settings = useMemo(() => {
        const splitString = setting?.split(',');
        if (splitString) return splitString.map(((it : string) => parseFloat(it)));
        return [];
    }, [setting]);
    return {
        setting,
        setSetting,
        settings,
        numberOfSettingsPerGenerator,
        uniqueGenPrefix,
        additionalSetting,
        onErase,
        failureGeneratorArmed,
        genName,
        FailureGeneratorCard,
        alias,
        disableTakeOffRearm,
    };
};

const onErase = (genID : number) => {
    failureTakeOffSpeedThreshold.splice(genID, 1);
    failureTakeOffAltitudeThreshold.splice(genID, 1);
};

const FailureGeneratorCard : (genID : number, generatorSettings : FailureGenData, failureGenContext: FailureGenContext)
=> JSX.Element = (genID : number, generatorSettings : FailureGenData, failureGenContext: FailureGenContext) => {
    const settings = generatorSettings.settings;
    const settingTable = [FailureGeneratorSingleSetting(`${t('Failures.Generators.FailureChancePerTakeOff')}:`, 20, '%', 0, 100,
        settings[genID * numberOfSettingsPerGenerator + 1], 100, false,
        setNewSetting, generatorSettings, genID, 1, failureGenContext),
    FailureGeneratorSingleSetting(`${t('Failures.Generators.LowSpeedChance')}:`, 20, '%', 0,
        100 - settings[genID * numberOfSettingsPerGenerator + 3] * 100,
        settings[genID * numberOfSettingsPerGenerator + 2], 100, false,
        setNewSetting, generatorSettings, genID, 2, failureGenContext),
    FailureGeneratorSingleSetting(`${t('Failures.Generators.MedSpeedChance')}:`, 20, '%', 0,
        100 - settings[genID * numberOfSettingsPerGenerator + 2] * 100,
        settings[genID * numberOfSettingsPerGenerator + 3], 100, false,
        setNewSetting, generatorSettings, genID, 3, failureGenContext),
    FailureGeneratorSingleSetting(`${t('Failures.Generators.MinimumSpeed')}:`, 20, t('Failures.Generators.knots'),
        0, settings[genID * numberOfSettingsPerGenerator + 5],
        settings[genID * numberOfSettingsPerGenerator + 4], 1, false,
        setNewSetting, generatorSettings, genID, 4, failureGenContext),
    FailureGeneratorSingleSetting(`${t('Failures.Generators.SpeedTransLowMed')}:`, 20, t('Failures.Generators.knots'),
        settings[genID * numberOfSettingsPerGenerator + 4],
        settings[genID * numberOfSettingsPerGenerator + 6],
        settings[genID * numberOfSettingsPerGenerator + 5], 1, false,
        setNewSetting, generatorSettings, genID, 5, failureGenContext),
    FailureGeneratorSingleSetting(`${t('Failures.Generators.MaximumSpeed')}:`, 20, t('Failures.Generators.knots'),
        settings[genID * numberOfSettingsPerGenerator + 4], 300,
        settings[genID * numberOfSettingsPerGenerator + 6], 1, false,
        setNewSetting, generatorSettings, genID, 6, failureGenContext),
    FailureGeneratorSingleSetting(`${t('Failures.Generators.MaxAltAboveRunway')}:`, 24, t('Failures.Generators.feet'), 0, 10000,
        settings[genID * numberOfSettingsPerGenerator + 7], 100, true,
        setNewSetting, generatorSettings, genID, 7, failureGenContext)];
    return FailureGeneratorCardTemplateUI(genID, generatorSettings, settingTable, failureGenContext);
};

export const failureGeneratorTakeOff = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');

    const settings : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);

    const nbGenerator = useMemo(() => Math.floor(settings.length / numberOfSettingsPerGenerator), [settings]);
    const { failureFlightPhase } = basicData();

    const altitude = SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet');
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempSettings : number[] = Array.from(settings);
            let change = false;
            for (let i = 0; i < nbGenerator; i++) {
                if (failureGeneratorArmed[i]
                    && ((altitude >= failureTakeOffAltitudeThreshold[i] && failureTakeOffAltitudeThreshold[i] !== -1)
                    || (gs >= failureTakeOffSpeedThreshold[i] && failureTakeOffSpeedThreshold[i] !== -1))) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, uniqueGenPrefix + i.toString());
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
            for (let i = 0; i < nbGenerator; i++) {
                if (!failureGeneratorArmed[i] && settings[i * numberOfSettingsPerGenerator + 0] > 0) {
                    if (Math.random() < settings[i * numberOfSettingsPerGenerator + 1]) {
                        const chanceFailureLowTakeOffRegime : number = settings[i * numberOfSettingsPerGenerator + 2];
                        const chanceFailureMediumTakeOffRegime : number = settings[i * numberOfSettingsPerGenerator + 3];
                        const minFailureTakeOffSpeed : number = settings[i * numberOfSettingsPerGenerator + 4];
                        const mediumTakeOffRegimeSpeed : number = settings[i * numberOfSettingsPerGenerator + 5];
                        const maxFailureTakeOffSpeed : number = settings[i * numberOfSettingsPerGenerator + 6];
                        const takeOffDeltaAltitudeEnd : number = 100 * settings[i * numberOfSettingsPerGenerator + 7];
                        const rolledDice = Math.random();
                        if (rolledDice < chanceFailureLowTakeOffRegime) {
                            // Low Take Off speed regime
                            const temp = Math.random() * (mediumTakeOffRegimeSpeed - minFailureTakeOffSpeed) + minFailureTakeOffSpeed;
                            failureTakeOffAltitudeThreshold[i] = -1;
                            failureTakeOffSpeedThreshold[i] = temp;
                        } else if (rolledDice < chanceFailureMediumTakeOffRegime + chanceFailureLowTakeOffRegime) {
                            // Medium Take Off speed regime
                            const temp = Math.random() * (maxFailureTakeOffSpeed - mediumTakeOffRegimeSpeed) + mediumTakeOffRegimeSpeed;
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
                if (settings[i * numberOfSettingsPerGenerator + 0] === 0) failureGeneratorArmed[i] = false;
            }
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        for (let i = 0; i < generatorNumber; i++) failureGeneratorArmed.push(false);
    }, []);
};
