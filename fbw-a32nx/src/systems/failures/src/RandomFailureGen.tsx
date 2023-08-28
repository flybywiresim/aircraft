import { Failure, FailuresOrchestrator } from '@failures';
import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { FailureGeneratorAltitude } from 'failures/src/AltitudeFailureGenerator';
import { FailureGeneratorSpeed } from 'failures/src/SpeedFailureGenerator';
import { FailureGeneratorTimer } from 'failures/src/TimerFailureGenerator';
// import { failureGeneratorPerHour } from 'failures/src/PerHourFailureGenerator';
// import { failureGeneratorTimer } from 'failures/src/TimerFailureGenerator';
// import { failureGeneratorTakeOff } from 'failures/src/TakeOffFailureGenerator';
// import { failureGeneratorSpeed } from 'failures/src/SpeedFailureGenerator';

export const ArmingIndex = 0;
export const FailuresAtOnceIndex = 1;
export const MaxFailuresIndex = 2;

export enum FailurePhases {
    DORMANT= 0,
    TAKEOFF= 1,
    INITIALCLIMB= 2,
    FLIGHT= 3,
}
export class RandomFailureGen {
    static failureGeneratorsUpdaters : ((failureOrchestrator : FailuresOrchestrator) => void)[] = [
        FailureGeneratorAltitude.updateFailure,
        FailureGeneratorSpeed.updateFailure,
        // failureGeneratorPerHour,
        FailureGeneratorTimer.updateFailure,
        // failureGeneratorTakeOff,
    ];

    static absoluteTimePrev : number = Date.now();

    static flatten(settings : number[]) : string {
        let settingString = '';
        for (let i = 0; i < settings.length; i++) {
            settingString += settings[i].toString();
            if (i < settings.length - 1) settingString += ',';
        }
        return settingString;
    }

    static getSetOfGeneratorFailuresSettings(allFailures : readonly Readonly<Failure>[]) : Map<number, string> {
        const generatorFailuresGetters : Map<number, string> = new Map();
        if (allFailures.length > 0) {
            allFailures.forEach((failure) => {
                const generatorSetting = NXDataStore.get(`EFB_FAILURE_${failure.identifier.toString()}_GENERATORS`, '');
                generatorFailuresGetters.set(failure.identifier, generatorSetting);
            });
        }
        return generatorFailuresGetters;
    }

    static activateRandomFailure(failureList : readonly Readonly<Failure>[], failureOrchestrator : FailuresOrchestrator,
        activeFailures : Set<number>, failuresAtOnce : number) {
        let failuresOffMap = failureList.filter((failure) => !activeFailures.has(failure.identifier)).map((failure) => failure.identifier);
        const maxNumber = Math.min(failuresAtOnce, failuresOffMap.length);
        for (let i = 0; i < maxNumber; i++) {
            if (failuresOffMap.length > 0) {
                const pick = Math.floor(Math.random() * failuresOffMap.length);
                const failureIdentifierPicked = failuresOffMap[pick];
                const pickedFailure = failureList.find((failure) => failure.identifier === failureIdentifierPicked);
                if (pickedFailure) {
                    failureOrchestrator.activate(failureIdentifierPicked);
                    failuresOffMap = failuresOffMap.filter((identifier) => identifier !== failureIdentifierPicked);
                }
            }
        }
    }

    private static failureFlightPhase : FailurePhases;

    static getFailureFlightPhase() : FailurePhases {
        return this.failureFlightPhase;
    }

    static basicDataUpdate() : void {
        const isOnGround = Simplane.getIsGrounded();
        const maxThrottleMode = Math.max(Simplane.getEngineThrottleMode(0), Simplane.getEngineThrottleMode(1));
        const throttleTakeOff = maxThrottleMode === ThrottleMode.FLEX_MCT || maxThrottleMode === ThrottleMode.TOGA;
        if (isOnGround) {
            if (throttleTakeOff) this.failureFlightPhase = FailurePhases.TAKEOFF;
            this.failureFlightPhase = FailurePhases.DORMANT;
        } else if (throttleTakeOff) this.failureFlightPhase = FailurePhases.INITIALCLIMB;
        else this.failureFlightPhase = FailurePhases.FLIGHT;
    }

    static update(failureOrchestrator : FailuresOrchestrator) {
        const absoluteTime = Date.now();
        // console.info(`delta : ${(absoluteTime - this.absoluteTimePrev).toString()}`);
        if (absoluteTime - this.absoluteTimePrev >= 100.0) {
            // console.info('100ms');
            this.basicDataUpdate();
            for (let i = 0; i < this.failureGeneratorsUpdaters.length; i++) {
                // console.info('Gen');
                this.failureGeneratorsUpdaters[i](failureOrchestrator);
            }
            this.absoluteTimePrev = absoluteTime;
        }
    }

    static getGeneratorFailurePool(failureOrchestrator : FailuresOrchestrator, generatorUniqueID: string) : Failure[] {
        const failureIDs : Failure[] = [];
        const allFailures = failureOrchestrator.getAllFailures();
        const setOfGeneratorFailuresSettings = RandomFailureGen.getSetOfGeneratorFailuresSettings(allFailures);
        if (allFailures.length > 0) {
            allFailures.forEach((failure) => {
                const generatorSetting = setOfGeneratorFailuresSettings.get(failure.identifier);
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
    }
}
