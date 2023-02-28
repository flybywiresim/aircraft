import { useState, useEffect, useMemo } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { activateRandomFailure, basicData, failureGeneratorCommonFunction, FailurePhases } from 'instruments/src/EFB/Failures/RandomFailureGen';
import { usePersistentProperty } from '@instruments/common/persistence';

// keep this template for new failureGenerators
export const failureGeneratorTakeOff = () => {
    // FAILURE GENERATOR DESCRIPTION
    const [absoluteTime500ms] = useSimVar('E:ABSOLUTE TIME', 'seconds', 500);
    const { maxFailuresAtOnce, totalActiveFailures, allFailures, activate } = failureGeneratorCommonFunction();
    const [failureGeneratorSetting] = usePersistentProperty('EFB_FAILURE_GENERATOR_SETTING_TAKEOFF', '1,0.33,0.40,30,100,140,5000,1,0.33,0.40,30,100,140,5000');

    const [failureGeneratorArmedTakeOff, setFailureGeneratorArmedTakeOff] = useState<boolean[]>([false, false]);
    const settingsTakeOff : number[] = useMemo<number[]>(() => failureGeneratorSetting.split(',').map(((it) => parseFloat(it))), [failureGeneratorSetting]);
    const [failureTakeOffSpeedThreshold, setFailureTakeOffSpeedThreshold] = useState<number[]>([-1, -1]);
    const [failureTakeOffAltitudeThreshold, setFailureTakeOffAltitudeThreshold] = useState<number[]>([-1, -1]);
    const numberOfSettingsPerGenerator = 7;
    const nbGeneratorTakeOff = useMemo(() => Math.floor(settingsTakeOff.length / numberOfSettingsPerGenerator), [settingsTakeOff]);
    const { failureFlightPhase } = basicData();
    const uniqueGenPrefix = 'G';

    const altitude = Simplane.getAltitudeAboveGround();
    const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

    useEffect(() => {
        // FAILURETYPE failures
        if (totalActiveFailures < maxFailuresAtOnce) {
            const tempFailureGeneratorArmed : boolean[] = Array.from(failureGeneratorArmedTakeOff);
            for (let i = 0; i < nbGeneratorTakeOff; i++) {
                const failureConditionTakeOff = ((altitude >= failureTakeOffAltitudeThreshold[i] && failureTakeOffAltitudeThreshold[i] !== -1)
                || (gs >= failureTakeOffSpeedThreshold[i] && failureTakeOffSpeedThreshold[i] !== -1));
                if (tempFailureGeneratorArmed[i] && failureConditionTakeOff && totalActiveFailures < maxFailuresAtOnce) {
                    activateRandomFailure(allFailures, activate, uniqueGenPrefix + i.toString());
                    console.info('Take-off failure triggered');
                    tempFailureGeneratorArmed[i] = false;
                }
            }
            setFailureGeneratorArmedTakeOff(tempFailureGeneratorArmed);
        }
    }, [absoluteTime500ms]);

    useEffect(() => {
        // failureSettings once per start of takeoff
        if (failureFlightPhase === FailurePhases.TAKEOFF) {
            const tempFailureGeneratorArmed : boolean[] = [];
            const tempFailureTakeOffSpeedThreshold : number[] = [];
            const tempFailureTakeOffAltitudeThreshold : number[] = [];
            for (let i = 0; i < nbGeneratorTakeOff; i++) {
                if (!tempFailureGeneratorArmed[i]) {
                    if (Math.random() < settingsTakeOff[i * numberOfSettingsPerGenerator + 0]) {
                        const chanceFailureHighTakeOffRegime : number = settingsTakeOff[i * numberOfSettingsPerGenerator + 1];
                        const chanceFailureMediumTakeOffRegime : number = settingsTakeOff[i * numberOfSettingsPerGenerator + 2];
                        const minFailureTakeOffSpeed : number = settingsTakeOff[i * numberOfSettingsPerGenerator + 3];
                        const mediumTakeOffRegimeSpeed : number = settingsTakeOff[i * numberOfSettingsPerGenerator + 4];
                        const maxFailureTakeOffSpeed : number = settingsTakeOff[i * numberOfSettingsPerGenerator + 5];
                        const takeOffDeltaAltitudeEnd : number = settingsTakeOff[i * numberOfSettingsPerGenerator + 6];
                        const rolledDice = Math.random();
                        if (rolledDice < chanceFailureMediumTakeOffRegime) {
                            // Low Take Off speed regime
                            const temp = Math.random() * (mediumTakeOffRegimeSpeed - minFailureTakeOffSpeed) + minFailureTakeOffSpeed;
                            tempFailureTakeOffAltitudeThreshold.push(-1);
                            tempFailureTakeOffSpeedThreshold.push(temp);
                            console.info('A failure will occur during this Take-Off at the speed of %d knots', temp);
                        } else if (rolledDice < chanceFailureMediumTakeOffRegime + chanceFailureHighTakeOffRegime) {
                            // Medium Take Off speed regime
                            const temp = Math.random() * (maxFailureTakeOffSpeed - mediumTakeOffRegimeSpeed) + mediumTakeOffRegimeSpeed;
                            tempFailureTakeOffAltitudeThreshold.push(-1);
                            tempFailureTakeOffSpeedThreshold.push(temp);
                            console.info('A failure will occur during this Take-Off at the speed of %d knots', temp);
                        } else {
                            // High Take Off speed regime
                            const temp = altitude + 10 + Math.random() * takeOffDeltaAltitudeEnd;
                            tempFailureTakeOffAltitudeThreshold.push(temp);
                            tempFailureTakeOffSpeedThreshold.push(-1);
                            console.info('A failure will occur during this Take-Off at altitude %d', temp);
                        }
                    }
                    tempFailureGeneratorArmed.push(true);
                }
            }
            setFailureTakeOffSpeedThreshold(tempFailureTakeOffSpeedThreshold);
            setFailureTakeOffAltitudeThreshold(tempFailureTakeOffAltitudeThreshold);
            setFailureGeneratorArmedTakeOff(tempFailureGeneratorArmed);
        }
    }, [failureFlightPhase]); // specific update conditions
};
