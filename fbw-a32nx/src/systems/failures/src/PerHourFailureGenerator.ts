import { GenericGenerator } from 'failures/src/GenericGenerator';
import { ReadyDisplayIndex } from './RandomFailureGen';

export class FailureGeneratorPerHour extends GenericGenerator {
    settingName = 'EFB_FAILURE_GENERATOR_SETTING_PERHOUR';

    numberOfSettingsPerGenerator = 5;

    uniqueGenPrefix = 'C';

    private timePrev: number = Date.now();

    private currentTime: number = 0;

    private failurePerHourIndex = 4;

    loopStartAction(): void {
        this.currentTime = Date.now();
    }

    generatorSpecificActions(genNumber: number): void {
        console.info(`${this.failureGeneratorArmed[genNumber] ? 'Armed' : 'NotArmed'} - ${
            this.settings[genNumber * this.numberOfSettingsPerGenerator + ReadyDisplayIndex].toString()} - waitstop: ${
            this.waitForStopped[genNumber]} - waittakeoff: ${
            this.waitForTakeOff[genNumber]}`);
    }

    conditionToTriggerFailure(genNumber: number): boolean {
        const chanceSetting = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.failurePerHourIndex];
        const chancePerSecond = chanceSetting / 3600;
        const rollDice = Math.random();
        return (rollDice < chancePerSecond * (this.currentTime - this.timePrev) / 1000);
    }

    conditionToArm(_genNumber: number): boolean {
        return (true);
    }

    loopEndAction(): void {
        this.timePrev = this.currentTime;
    }
}
