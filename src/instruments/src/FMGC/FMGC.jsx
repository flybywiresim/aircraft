import A32NX_Core from '../A32NX_Core/A32NX_Core.mjs';

export default class FMGC {
    constructor() {
        this.activeSystem = 'FMGC';
    }

    Init(_deltaTime) {
        this.A32NXCore = new A32NX_Core();
        this.A32NXCore.init(_deltaTime);
    }
}
