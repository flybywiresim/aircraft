import { GenericGenerator } from 'failures/src/GenericGenerator';
import { ReadyDisplayIndex } from './RandomFailureGen';

export class FailureGeneratorSpeed extends GenericGenerator {
    settingName = 'EFB_FAILURE_GENERATOR_SETTING_SPEED';

    numberOfSettingsPerGenerator = 7;

    uniqueGenPrefix = 'B';

    private rolledDice: number[] = [];

    private previousSpeedCondition: number[] = [];

    private speedConditionIndex = 4;

    private speedMinIndex = 5;

    private speedMaxIndex = 6;

    private resetMargin = 5;

    additionalInitActions(genNumber: number): void {
        this.previousSpeedCondition[genNumber] = this.newSettings[genNumber * this.numberOfSettingsPerGenerator
                + this.speedConditionIndex];
    }

    generatorSpecificActions(genNumber: number): void {
        console.info(`${this.failureGeneratorArmed[genNumber] ? 'Armed' : 'NotArmed'} - ${
            this.settings[genNumber * this.numberOfSettingsPerGenerator + ReadyDisplayIndex].toString()} - waitstop: ${
            this.waitForStopped[genNumber]} - waittakeoff: ${
            this.waitForTakeOff[genNumber]} - altOK: ${
            this.conditionToArm(genNumber)}`);
        const speedCondition = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.speedConditionIndex];

        if (this.previousSpeedCondition[genNumber] !== speedCondition) {
            this.disarm(genNumber);
        }
    }

    conditionToTriggerFailure(genNumber: number): boolean {
        const speedMax = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.speedMaxIndex];
        const speedMin = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.speedMinIndex];
        const speedCondition = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.speedConditionIndex];
        const failureAltitude = (speedMin + this.rolledDice[genNumber] * (speedMax - speedMin));

        return ((this.gs > failureAltitude && speedCondition === 0)
        || (this.gs < failureAltitude && speedCondition === 1));
    }

    conditionToArm(genNumber: number): boolean {
        const speedMax = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.speedMaxIndex];
        const speedMin = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.speedMinIndex];
        const speedCondition = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.speedConditionIndex];
        return ((this.gs < speedMin - this.resetMargin && speedCondition === 0)
        || (this.gs > speedMax + this.resetMargin && speedCondition === 1));
    }

    additionalArmingActions(genNumber: number): void {
        this.rolledDice[genNumber] = Math.random();
    }

    additionalGenEndActions(genNumber: number): void {
        this.previousSpeedCondition[genNumber] = this.newSettings[genNumber * this.numberOfSettingsPerGenerator
            + this.speedConditionIndex];
    }
}
