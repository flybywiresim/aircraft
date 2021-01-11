import { VeryHighFrequency } from './RadioFrequencyMode.mjs';
import { HighFrequency } from './RadioFrequencyMode.mjs';
import { AcceleratedKnob } from "./AcceleratedKnob.mjs";
import { useInteractionEvent } from '../util.mjs';


const vhf1 = new VeryHighFrequency(1);
const vhf2 = new VeryHighFrequency(2);
const vhf3 = new VeryHighFrequency(3);
const hf1 = new HighFrequency(1);
const hf2 = new HighFrequency(2);

class RadioManagementPanel {
    constructor(side) {
        this.side = side;
        this.mode = side === 'L' ? vhf1 : vhf2;
        this.innerKnob = new AcceleratedKnob();
        this.outerKnob = new AcceleratedKnob();
        this.innerKnob.updateValue = (s) => this.mode.changeStandbyDecimalValue(s);
        this.outerKnob.updateValue = (s) => this.mode.changeStandbyIntegerValue(s);
    }

    frequencyKnobTurned(knob, direction) {
        if (direction === 'anticlockwise') knob.decrease();
        else if (direction === 'clockwise') knob.increase();
        if (this.requestRender) this.requestRender();
    }

    transferButtonPressed() {
        this.mode.transfer()
        if (this.requestRender) this.requestRender();
    }

    modeButtonPressed(mode) {
        this.mode = mode;
        if (this.requestRender) this.requestRender();
    }

    registerCallbacks(requestRender) {
        this.requestRender = requestRender;

        useInteractionEvent(`A32NX_RMP_${this.side}_INNER_KNOB_TURNED_CLOCKWISE`, () => this.frequencyKnobTurned(this.innerKnob, 'clockwise'));
        useInteractionEvent(`A32NX_RMP_${this.side}_INNER_KNOB_TURNED_ANTICLOCKWISE`, () => this.frequencyKnobTurned(this.innerKnob, 'anticlockwise'));
        useInteractionEvent(`A32NX_RMP_${this.side}_OUTER_KNOB_TURNED_CLOCKWISE`, () => this.frequencyKnobTurned(this.outerKnob, 'clockwise'));
        useInteractionEvent(`A32NX_RMP_${this.side}_OUTER_KNOB_TURNED_ANTICLOCKWISE`, () => this.frequencyKnobTurned(this.outerKnob, 'anticlockwise'));
        useInteractionEvent(`A32NX_RMP_${this.side}_TRANSFER_BUTTON_PRESSED`, () => this.transferButtonPressed());

        useInteractionEvent(`A320_Neo_FDW_BTN_${this.side}_VHF1`, () => this.modeButtonPressed(vhf1));
        useInteractionEvent(`A320_Neo_FDW_BTN_${this.side}_VHF2`, () => this.modeButtonPressed(vhf2));
        useInteractionEvent(`A320_Neo_FDW_BTN_${this.side}_VHF3`, () => this.modeButtonPressed(vhf3));
        useInteractionEvent(`A320_Neo_FDW_BTN_${this.side}_HF1`, () => this.modeButtonPressed(hf1));
        useInteractionEvent(`A320_Neo_FDW_BTN_${this.side}_HF2`, () => this.modeButtonPressed(hf2));
    }
}


export class RadioManagementPanelPair {
    constructor() {
        this.left = new RadioManagementPanel('L');
        this.right = new RadioManagementPanel('R');
    }

    registerCallbacks(renderCallback) {
        this.renderCallback = renderCallback;
        this.left.registerCallbacks(() => this.renderRequested());
        this.right.registerCallbacks(() => this.renderRequested());
    }

    renderRequested() {
        // We need to use setTimeout because SimVars do not update instantly, unfortunately...
        if (this.renderCallback) setTimeout(() => this.renderCallback(this.frequencies), 50);
    }

    get frequencies() {
        return {
            left: this.left.mode.frequencies,
            right: this.right.mode.frequencies,
        };
    }
}
