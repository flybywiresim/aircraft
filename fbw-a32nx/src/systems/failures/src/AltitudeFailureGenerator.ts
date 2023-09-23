import { GenericGenerator } from 'failures/src/GenericGenerator';
import { ReadyDisplayIndex } from './RandomFailureGen';

export class FailureGeneratorAltitude extends GenericGenerator {
    settingName = 'EFB_FAILURE_GENERATOR_SETTING_ALTITUDE';

    numberOfSettingsPerGenerator = 7;

    uniqueGenPrefix = 'A';

    private rolledDice: number[] = [];

    private previousAltitudeCondition: number[] = [];

    private altitudeConditionIndex = 4;

    private altitudeMinIndex = 5;

    private altitudeMaxIndex = 6;

    private resetMargin = 100;

    private altitude: number;

    loopStartAction(): void {
        this.altitude = Simplane.getAltitude();
    }

    additionalInitActions(genNumber: number): void {
        this.previousAltitudeCondition[genNumber] = this.newSettings[genNumber * this.numberOfSettingsPerGenerator
                + this.altitudeConditionIndex];
    }

    generatorSpecificActions(genNumber: number): void {
        console.info(`${this.failureGeneratorArmed[genNumber] ? 'Armed' : 'NotArmed'} - ${
            this.settings[genNumber * this.numberOfSettingsPerGenerator + ReadyDisplayIndex].toString()} - waitstop: ${
            this.waitForStopped[genNumber]} - waittakeoff: ${
            this.waitForTakeOff[genNumber]} - altOK: ${
            this.conditionToArm(genNumber)}`);
        const altitudeCondition = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeConditionIndex];

        if (this.previousAltitudeCondition[genNumber] !== altitudeCondition) {
            this.disarm(genNumber);
        }
    }

    conditionToTriggerFailure(genNumber: number): boolean {
        const altitudeMax = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeMaxIndex] * 100;
        const altitudeMin = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeMinIndex] * 100;
        const altitudeCondition = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeConditionIndex];
        const failureAltitude = (altitudeMin + this.rolledDice[genNumber] * (altitudeMax - altitudeMin));

        return ((this.altitude > failureAltitude && altitudeCondition === 0)
        || (this.altitude < failureAltitude && altitudeCondition === 1));
    }

    conditionToArm(genNumber: number): boolean {
        const altitudeMax = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeMaxIndex] * 100;
        const altitudeMin = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeMinIndex] * 100;
        const altitudeCondition = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeConditionIndex];
        return ((this.altitude < altitudeMin - this.resetMargin && altitudeCondition === 0)
        || (this.altitude > altitudeMax + this.resetMargin && altitudeCondition === 1));
    }

    additionalArmingActions(genNumber: number): void {
        this.rolledDice[genNumber] = Math.random();
    }

    additionalGenEndActions(genNumber: number): void {
        this.previousAltitudeCondition[genNumber] = this.newSettings[genNumber * this.numberOfSettingsPerGenerator
            + this.altitudeConditionIndex];
    }
}
