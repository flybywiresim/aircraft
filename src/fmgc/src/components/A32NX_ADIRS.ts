import { NXDataStore } from '@shared/persistence';

export class A32NX_ADIRS {
    init() {
        this.copyConfiguredAlignTimeToSimVar();
    }

    update(_) {
    }

    /**
     * Copies the configured align time to a SimVar for use by the systems code.
     */
    copyConfiguredAlignTimeToSimVar() {
        const configuredAlignTime = NXDataStore.get('CONFIG_ALIGN_TIME', 'REAL');
        let alignTime;
        switch (configuredAlignTime) {
        case 'INSTANT':
            alignTime = 1;
            break;
        case 'FAST':
            alignTime = 2;
            break;
        case 'REAL':
        default:
            alignTime = 0;
            break;
        }

        SimVar.SetSimVarValue('L:A32NX_CONFIG_ADIRS_IR_ALIGN_TIME', 'Enum', alignTime);
    }
}
