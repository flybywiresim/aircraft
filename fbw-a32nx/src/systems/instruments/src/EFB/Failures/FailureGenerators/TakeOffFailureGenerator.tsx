import { useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import {
    activateRandomFailure, basicData, FailureGenData, failureGeneratorCommonFunction,
    FailurePhases, findGeneratorFailures, flatten, setNewSetting,
} from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';
import { FailureGeneratorCardTemplateUI, FailureGeneratorFailureSetting } from 'instruments/src/EFB/Failures/FailureGenerators/FailureGeneratorsUI';
import { t } from 'instruments/src/EFB/translation';
import { ModalContextInterface } from 'instruments/src/EFB/UtilComponents/Modals/Modals';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_TAKEOFF';
const numberOfSettingsPerGenerator = 8;
const uniqueGenPrefix = 'G';
const additionalSetting = [0, 1, 0.33, 0.33, 30, 95, 140, 40];
const failureGeneratorArmed :boolean[] = [];
const failureTakeOffSpeedThreshold :number[] = [];
const failureTakeOffAltitudeThreshold :number[] = [];
const genName = 'TakeOff';
const alias = t('Failures.Generators.GenTakeOff');

export const failureGenConfigTakeOff : ()=>FailureGenData = () => {
    const [setting, setSetting] = usePersistentProperty(settingName);
    const settings = useMemo(() => {
        console.info(setting);
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
    };
};

const onErase = (genID : number) => {
    failureTakeOffSpeedThreshold.splice(genID, 1);
    failureTakeOffAltitudeThreshold.splice(genID, 1);
};

const FailureGeneratorCard : (genID : number, generatorSettings : FailureGenData, modal : ModalContextInterface)
=> JSX.Element = (genID : number, generatorSettings : FailureGenData, modal : ModalContextInterface) => {
    const settings = generatorSettings.settings;
    const settingTable = [FailureGeneratorFailureSetting('Failure per take-off:', 20, '%', 0, 100,
        settings[genID * numberOfSettingsPerGenerator + 1], 100, false,
        setNewSetting, generatorSettings, genID, 1, modal),
    FailureGeneratorFailureSetting('Low Speed chance:', 20, '%', 0,
        100 - settings[genID * numberOfSettingsPerGenerator + 3] * 100,
        settings[genID * numberOfSettingsPerGenerator + 2], 100, false,
        setNewSetting, generatorSettings, genID, 2, modal),
    FailureGeneratorFailureSetting('Medium Speed chance:', 20, '%', 0,
        100 - settings[genID * numberOfSettingsPerGenerator + 2] * 100,
        settings[genID * numberOfSettingsPerGenerator + 3], 100, false,
        setNewSetting, generatorSettings, genID, 3, modal),
    FailureGeneratorFailureSetting('Minimum speed:', 20, 'knots',
        0, settings[genID * numberOfSettingsPerGenerator + 5],
        settings[genID * numberOfSettingsPerGenerator + 4], 1, false,
        setNewSetting, generatorSettings, genID, 4, modal),
    FailureGeneratorFailureSetting('Speed transition low-med:', 20, 'knots',
        settings[genID * numberOfSettingsPerGenerator + 4],
        settings[genID * numberOfSettingsPerGenerator + 6],
        settings[genID * numberOfSettingsPerGenerator + 5], 1, false,
        setNewSetting, generatorSettings, genID, 5, modal),
    FailureGeneratorFailureSetting('Max speed:', 20, 'knots',
        settings[genID * numberOfSettingsPerGenerator + 4], 300,
        settings[genID * numberOfSettingsPerGenerator + 6], 1, false,
        setNewSetting, generatorSettings, genID, 6, modal),
    FailureGeneratorFailureSetting('Max altitude above runway:', 24, 'feet', 0, 10000,
        settings[genID * numberOfSettingsPerGenerator + 7], 100, true,
        setNewSetting, generatorSettings, genID, 7, modal)];
    return FailureGeneratorCardTemplateUI(genID, generatorSettings, settingTable);
};

export const failureGeneratorTakeOff = (generatorFailuresGetters : Map<number, string>) => {
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '');

    const settingsTakeOff : number[] = useMemo<number[]>(() => {
        console.info('ici');
        return failureGeneratorSetting.split(',').map(((it) => parseFloat(it)));
    }, [failureGeneratorSetting]);

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
