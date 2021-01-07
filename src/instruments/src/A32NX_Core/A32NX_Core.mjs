import A32NX_ADIRS from './A32NX_ADIRS.mjs';
import A32NX_APU from './A32NX_APU.mjs';
import A32NX_BaroSelector from './A32NX_BaroSelector.mjs';
import A32NX_BrakeTemp from './A32NX_BrakeTemp.mjs';
import A32NX_Electricity from './A32NX_Electricity.mjs';
import A32NX_LocalVarUpdater from './A32NX_LocalVarUpdater.mjs';
import A32NX_FADEC from './A32NX_FADEC.mjs';
import A32NX_FWC from './A32NX_FWC.mjs';
import A32NX_GroundReference from './A32NX_GroundReference.mjs';
import A32NX_Speeds from './A32NX_Speeds.mjs';
import A32NX_GPWS from './A32NX_GPWS.mjs';
import { A32NX_Util } from '../A32NX_Utils/A32NX_Util.mjs';
import { A32NX_SoundManager } from './A32NX_SoundManager.mjs';

export default class A32NX_Core {
    constructor() {
        this.modules = [
            new A32NX_ADIRS(),
            new A32NX_APU(),
            new A32NX_BaroSelector(),
            new A32NX_BrakeTemp(),
            new A32NX_Electricity(),
            new A32NX_LocalVarUpdater(),
            new A32NX_FADEC(1),
            new A32NX_FADEC(2),
            new A32NX_FWC(),
            new A32NX_GPWS(this),
            new A32NX_GroundReference(),
            new A32NX_Speeds(),
        ];

        this.soundManager = new A32NX_SoundManager();
    }

    init(startTime) {
        this.ACPowerStateChange = false;
        this.getDeltaTime = A32NX_Util.createDeltaTimeCalculator(startTime);
        this.modules.forEach((module) => {
            if (typeof module.init === 'function') {
                module.init();
            }
        });
        this.isInit = true;
    }

    update() {
        if (!this.isInit) {
            return;
        }

        this.updateACPowerStateChange();

        const deltaTime = this.getDeltaTime();

        this.soundManager.update(deltaTime);
        this.modules.forEach((module) => {
            module.update(deltaTime, this);
        });
    }

    updateACPowerStateChange() {
        const engineOn = Simplane.getEngineActive(0) || Simplane.getEngineActive(1);
        const externalPowerOn = SimVar.GetSimVarValue('EXTERNAL POWER AVAILABLE:1', 'Bool') === 1 && SimVar.GetSimVarValue('EXTERNAL POWER ON', 'Bool') === 1;
        const apuOn = SimVar.GetSimVarValue('L:APU_GEN_ONLINE', 'bool');
        const isACPowerAvailable = engineOn || apuOn || externalPowerOn;
        this.ACPowerStateChange = (isACPowerAvailable !== this.ACPowerLastState);
    }
}
