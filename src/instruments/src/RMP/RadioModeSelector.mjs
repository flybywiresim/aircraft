import { RadioFrequency } from './RadioFrequency.mjs';
import { useInteractionEvent } from '../util.mjs';


class VeryHighFrequencyRadio {
    constructor (index) {
        this.minimum = 118000;
        this.maximum = 136900;
        this.supports833 = true;

        this.active = new RadioFrequency(
            `COM ACTIVE FREQUENCY:${index}`,
            index === 1 ? "K:COM_RADIO_SET_HZ" : `K:COM${index}_RADIO_SET_HZ`
        );

        this.standby = new RadioFrequency(
            `COM STANDBY FREQUENCY:${index}`,
            index === 1 ? "K:COM_STBY_RADIO_SET_HZ" : `K:COM${index}_STBY_RADIO_SET_HZ`
        );
    }
}


export class RadioModeSelector {
    /**
     *
     * @param {RadioManagementPanel} radioManagementPanel
     */
    constructor(radioManagementPanel) {
        this.radioManagementPanel = radioManagementPanel;

        this.vhf1 = new VeryHighFrequencyRadio(1);
        this.vhf2 = new VeryHighFrequencyRadio(2);
        this.vhf3 = new VeryHighFrequencyRadio(3);

        this.radioManagementPanel.setRadioMode(this.vhf1);
    }

    registerCallbacks() {
        useInteractionEvent('A320_Neo_FDW_BTN_L_VHF1', () => this.radioManagementPanel.setRadioMode(this.vhf1));
        useInteractionEvent('A320_Neo_FDW_BTN_L_VHF2', () => this.radioManagementPanel.setRadioMode(this.vhf2));
        useInteractionEvent('A320_Neo_FDW_BTN_L_VHF3', () => this.radioManagementPanel.setRadioMode(this.vhf3));
    }
}
