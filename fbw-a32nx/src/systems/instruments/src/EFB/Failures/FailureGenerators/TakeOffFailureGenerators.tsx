import React, { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, basicData, failureGeneratorCommonFunction, FailurePhases, findGeneratorFailures, flatten } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';

const settingName = 'EFB_FAILURE_GENERATOR_SETTING_TAKEOFF';
const numberOfSettingsPerGenerator = 8;
const uniqueGenPrefix = 'G';

export const FailureGeneratorButtonsTakeOff : (generatorSettings: any) => JSX.Element[] = (generatorSettings : any) => {
    const htmlReturn : JSX.Element[] = [];
    const setting = generatorSettings.settingTakeOff;
    const nbGenerator = Math.floor(setting.split(',').length / numberOfSettingsPerGenerator);
    for (let i = 0; i < nbGenerator; i++) {
        htmlReturn.push(failureGeneratorButtonTakeOff(i, generatorSettings));
    }
    return htmlReturn;
};

const eraseGenerator :(genID : number, generatorSettings : any) => void = (genID : number, generatorSettings : any) => {
    const settings : number[] = generatorSettings.settingTakeOff.split(',').map(((it : string) => parseFloat(it)));
    generatorSettings.setSettingTakeOff(flatten(settings.splice(genID * numberOfSettingsPerGenerator, numberOfSettingsPerGenerator)));
    // arming
    // specific tunings
};

const failureGeneratorButtonTakeOff : (genID : number, generatorSettings : any) => JSX.Element = (genID : number, generatorSettings : any) => (
    <div className="flex-1 py-2 px-2 my-2 text-center rounded-md mx-x bg-theme-accent blue">
        <h2>
            {`${uniqueGenPrefix}${genID.toString()} : Take-Off`}
        </h2>
        <button
            type="button"
            onClick={() => eraseGenerator(genID, generatorSettings)}
            className="flex-1 py-2 px-2 mr-4 text-center rounded-md bg-theme-accent blue"
        >
            <h2>X</h2>
        </button>
    </div>
);

// keep this template for new failureGenerators
export const failureGeneratorTakeOff = (generatorFailuresGetters : Map<number, string>) => {
    // FAILURE GENERATOR DESCRIPTION
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate, activeFailures } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting, setFailureGeneratorSetting] = usePersistentProperty(settingName, '2,1,0.33,0.40,30,100,140,5000,2,1,0.33,0.40,30,100,140,5000');

    const [failureGeneratorArmedTakeOff, setFailureGeneratorArmedTakeOff] = useState<boolean[]>([false, false]);
    const settingsTakeOff : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const [failureTakeOffSpeedThreshold, setFailureTakeOffSpeedThreshold] = useState<number[]>([-1, -1]);
    const [failureTakeOffAltitudeThreshold, setFailureTakeOffAltitudeThreshold] = useState<number[]>([-1, -1]);
    const nbGeneratorTakeOff = useMemo(() => Math.floor(settingsTakeOff.length / numberOfSettingsPerGenerator), [settingsTakeOff]);
    const { failureFlightPhase } = basicData();

    const altitude = Simplane.getAltitudeAboveGround();
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedTakeOff);
            const tempSettings : number[] = Array.from(settingsTakeOff);
            let change = false;
            for (let i = 0; i < nbGeneratorTakeOff; i++) {
                // console.info(failureTakeOffSpeedThreshold[i], failureTakeOffAltitudeThreshold[i], tempFailureGeneratorArmed[i]);
                if (tempFailureGeneratorArmed[i]
                    && ((altitude >= failureTakeOffAltitudeThreshold[i] && failureTakeOffAltitudeThreshold[i] !== -1)
                    || (gs >= failureTakeOffSpeedThreshold[i] && failureTakeOffSpeedThreshold[i] !== -1))) {
                    activateRandomFailure(findGeneratorFailures(allFailures, generatorFailuresGetters, uniqueGenPrefix + i.toString()),
                        activate, activeFailures, uniqueGenPrefix + i.toString());
                    console.info('Take-off failure triggered');
                    tempFailureGeneratorArmed[i] = false;
                    change = true;
                    if (tempSettings[i * numberOfSettingsPerGenerator + 0] === 1) tempSettings[i * numberOfSettingsPerGenerator + 0] = 0;
                }
            }
            if (change) {
                setFailureGeneratorArmedTakeOff(tempFailureGeneratorArmed);
                setFailureGeneratorSetting(flatten(tempSettings));
            }
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        if (failureFlightPhase === FailurePhases.TAKEOFF && gs < 1.0) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedTakeOff);
            const tempFailureTakeOffSpeedThreshold : number[] = Array.from(failureTakeOffSpeedThreshold);
            const tempFailureTakeOffAltitudeThreshold : number[] = Array.from(failureTakeOffAltitudeThreshold);
            let changed = false;
            for (let i = 0; i < nbGeneratorTakeOff; i++) {
                if (!tempFailureGeneratorArmed[i] && settingsTakeOff[i * numberOfSettingsPerGenerator + 0] > 0) {
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
                            tempFailureTakeOffAltitudeThreshold[i] = -1;
                            tempFailureTakeOffSpeedThreshold[i] = temp;
                            console.info('A failure will occur during this Take-Off at the speed of %d knots', temp);
                        } else if (rolledDice < chanceFailureMediumTakeOffRegime + chanceFailureLowTakeOffRegime) {
                            // Medium Take Off speed regime
                            const temp = Math.random() * (maxFailureTakeOffSpeed - mediumTakeOffRegimeSpeed) + mediumTakeOffRegimeSpeed;
                            tempFailureTakeOffAltitudeThreshold[i] = -1;
                            tempFailureTakeOffSpeedThreshold[i] = temp;
                            console.info('A failure will occur during this Take-Off at the speed of %d knots', temp);
                        } else {
                            // High Take Off speed regime
                            const temp = altitude + 10 + Math.random() * takeOffDeltaAltitudeEnd;
                            tempFailureTakeOffAltitudeThreshold[i] = temp;
                            tempFailureTakeOffSpeedThreshold[i] = -1;
                            console.info('A failure will occur during this Take-Off at altitude %d', temp);
                        }
                        tempFailureGeneratorArmed[i] = true;
                        changed = true;
                    }
                }
            }
            if (changed) {
                setFailureTakeOffSpeedThreshold(tempFailureTakeOffSpeedThreshold);
                setFailureTakeOffAltitudeThreshold(tempFailureTakeOffAltitudeThreshold);
                setFailureGeneratorArmedTakeOff(tempFailureGeneratorArmed);
            }
        }
    }, [absoluteTime500ms]); // specific update conditions

    useEffect(() => {
        const generatorNumber = Math.floor(failureGeneratorSetting.split(',').length / numberOfSettingsPerGenerator);
        const tempArmed : boolean[] = [];
        for (let i = 0; i < generatorNumber; i++) tempArmed.push(false);
        setFailureGeneratorArmedTakeOff(tempArmed);
    }, []);
};
