import { FailureGenFeedbackEvent, GenericGenerator } from 'failures/src/GenericGenerator';

export interface FailureGenTakeOffFeedbackEvent extends FailureGenFeedbackEvent{

  }

export class FailureGeneratorTakeOff extends GenericGenerator {
    settingName = 'EFB_FAILURE_GENERATOR_SETTING_TAKEOFF';

    numberOfSettingsPerGenerator = 10;

    uniqueGenPrefix = 'E';

    private failureTakeOffSpeedThreshold: number[] = [];

    private failureTakeOffAltitudeThreshold: number[] = [];

    private failureTakeOffAltitudeEnd: number[] = [];

    private rolledDiceTakeOff = 0;

    private chancePerTakeOffIndex = 3;

    private chanceLowIndex = 4;

    private chanceMediumIndex = 5;

    private minSpeedIndex = 6;

    private mediumSpeedIndex = 7;

    private maxSpeedIndex = 8;

    private altitudeIndex = 9;

    private altitude: number = 0;

    sendFeedback(): void {
        this.eventBus.getPublisher<FailureGenTakeOffFeedbackEvent>().pub('expectedMode', this.requestedMode, true);
        this.eventBus.getPublisher<FailureGenTakeOffFeedbackEvent>().pub('armingDisplayStatus', this.failureGeneratorArmed, true);
    }

    loopStartAction(): void {
        this.altitude = Simplane.getAltitude();
    }

    generatorSpecificActions(genNumber: number): void {
        console.info(`${this.failureGeneratorArmed[genNumber] ? 'Armed' : 'NotArmed'} - ${
            this.requestedMode[genNumber].toString()} - waitstop: ${
            this.waitForStopped[genNumber]} - waittakeoff: ${
            this.waitForTakeOff[genNumber]} - altThd: ${
            this.failureTakeOffAltitudeThreshold[genNumber]} - spdThd: ${
            this.failureTakeOffSpeedThreshold[genNumber]}`);

        const medHighTakeOffSpeed: number = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.maxSpeedIndex];
        if (this.failureGeneratorArmed[genNumber]
            && ((this.altitude >= this.failureTakeOffAltitudeEnd[genNumber] && this.gs >= medHighTakeOffSpeed)
            || (this.gs < 1))) {
            this.reset(genNumber);
        }
    }

    conditionToTriggerFailure(genNumber: number): boolean {
        return (this.rolledDiceTakeOff < this.settings[genNumber * this.numberOfSettingsPerGenerator + this.chancePerTakeOffIndex]
            && (((this.altitude >= this.failureTakeOffAltitudeThreshold[genNumber] && this.failureTakeOffAltitudeThreshold[genNumber] !== -1)
        || (this.gs >= this.failureTakeOffSpeedThreshold[genNumber] && this.failureTakeOffSpeedThreshold[genNumber] !== -1))));
    }

    conditionToArm(genNumber: number): boolean {
        return !this.waitForTakeOff[genNumber];
    }

    additionalArmingActions(genNumber: number): void {
        const minFailureTakeOffSpeed: number = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.minSpeedIndex];
        const medHighTakeOffSpeed: number = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.maxSpeedIndex];
        const chanceFailureLowTakeOffRegime: number = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.chanceLowIndex];
        const chanceFailureMediumTakeOffRegime: number = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.chanceMediumIndex];
        const takeOffDeltaAltitudeEnd: number = 100 * this.settings[genNumber * this.numberOfSettingsPerGenerator + this.altitudeIndex];
        const lowMedTakeOffSpeed: number = this.settings[genNumber * this.numberOfSettingsPerGenerator + this.mediumSpeedIndex];
        this.rolledDiceTakeOff = Math.random();
        const rolledDicePhase = Math.random();
        if (rolledDicePhase < chanceFailureLowTakeOffRegime) {
            // Low Speed Take Off
            const temp = Math.random() * (lowMedTakeOffSpeed - minFailureTakeOffSpeed) + minFailureTakeOffSpeed;
            this.failureTakeOffAltitudeThreshold[genNumber] = -1;
            this.failureTakeOffSpeedThreshold[genNumber] = temp;
        } else if (rolledDicePhase < chanceFailureMediumTakeOffRegime + chanceFailureLowTakeOffRegime) {
            // Medium Speed Take Off
            const temp = Math.random() * (medHighTakeOffSpeed - lowMedTakeOffSpeed) + lowMedTakeOffSpeed;
            this.failureTakeOffAltitudeThreshold[genNumber] = -1;
            this.failureTakeOffSpeedThreshold[genNumber] = temp;
        } else {
            // High Speed Take Off
            const temp = this.altitude + 10 + Math.random() * takeOffDeltaAltitudeEnd;
            this.failureTakeOffAltitudeThreshold[genNumber] = temp;
            this.failureTakeOffSpeedThreshold[genNumber] = -1;
        }
        this.failureTakeOffAltitudeEnd[genNumber] = this.altitude + takeOffDeltaAltitudeEnd;
    }
}
