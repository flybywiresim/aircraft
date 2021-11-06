export enum TuningMode {
    Auto = 0,
    Manual,
    Remote
}

/**
 * This is a placeholder for the new radio nav tuning logic... coming soon to an A32NX near you
 */
export class NavRadioManager {
    tuningMode1: TuningMode = TuningMode.Auto;

    tuningMode2: TuningMode = TuningMode.Auto;

    tuningMode3: TuningMode = TuningMode.Auto;

    constructor(public _parentInstrument: BaseInstrument) {
        SimVar.SetSimVarValue('L:A32NX_FMGC_RADIONAV_1_TUNING_MODE', 'enum', TuningMode.Manual);
        SimVar.SetSimVarValue('L:A32NX_FMGC_RADIONAV_2_TUNING_MODE', 'enum', TuningMode.Manual);
        SimVar.SetSimVarValue('L:A32NX_FMGC_RADIONAV_3_TUNING_MODE', 'enum', TuningMode.Manual);
    }

    public update(_deltaTime: number): void {
        // Do nothing
    }
}
