export enum TuningMode {
    Auto = 0,
    Manual,
    Remote
}

/**
 * This is a placeholder for the new radio nav tuning logic... coming soon to an A32NX near you
 */
export class NavRadioManager {
    tuningMode: TuningMode = TuningMode.Auto;

    manualTuned: boolean;

    rmpTuned: boolean;

    constructor(public _parentInstrument: BaseInstrument) {
        SimVar.SetSimVarValue('L:A32NX_FMGC_RADIONAV_TUNING_MODE', 'Enum', TuningMode.Auto);
    }

    public update(deltaTime: number, manualTuned: boolean, rmpTuned: boolean): void {
        if (this.manualTuned !== manualTuned || this.rmpTuned !== rmpTuned) {
            // too avoid SetSimVar too often
            this.manualTuned = manualTuned;
            this.rmpTuned = rmpTuned;

            if (manualTuned) {
                this.tuningMode = TuningMode.Manual;
            } else if (rmpTuned) {
                this.tuningMode = TuningMode.Remote;
            } else {
                if (this.tuningMode === TuningMode.Remote) {
                    // Happens when NAV push button is pushed back
                    // It resets all the frequencies (real life behavior)
                    SimVar.SetSimVarValue('K:ADF_ACTIVE_SET', 'Frequency ADF BCD32', 0);
                    SimVar.SetSimVarValue('K:ADF2_ACTIVE_SET', 'Frequency ADF BCD32', 0);
                    SimVar.SetSimVarValue('K:NAV1_RADIO_SET_HZ', 'Hz', 0);
                    SimVar.SetSimVarValue('K:NAV2_RADIO_SET_HZ', 'Hz', 0);
                    SimVar.SetSimVarValue('K:NAV3_RADIO_SET_HZ', 'Hz', 0);
                }

                this.tuningMode = TuningMode.Auto;
            }
            SimVar.SetSimVarValue('L:A32NX_FMGC_RADIONAV_TUNING_MODE', 'Enum', this.tuningMode);
        }
    }
}
