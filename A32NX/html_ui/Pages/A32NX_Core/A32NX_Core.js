class A32NX_Core {
    constructor() {
        this.modules = [
            new A32NX_ADIRS(),
            new A32NX_APU(),
            new A32NX_BrakeTemp(),
            new A32NX_Electricity(),
            new A32NX_LocalVarUpdater(),
            new A32NX_GPWS(),
        ];
    }

    init(startTime) {
        this.ACPowerStateChange = false;
        this.getDeltaTime = A32NX_Util.createDeltaTimeCalculator(startTime);
        this.modules.forEach(module => {
            if (typeof module.init === "function") {
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
        this.modules.forEach(module => {
            module.update(deltaTime, this);
        });
    }
    updateACPowerStateChange() {
        const engineOn = Simplane.getEngineActive(0) || Simplane.getEngineActive(1);
        const externalPowerOn = SimVar.GetSimVarValue("EXTERNAL POWER AVAILABLE:1", "Bool") === 1 && SimVar.GetSimVarValue("EXTERNAL POWER ON", "Bool") === 1;
        const apuOn = SimVar.GetSimVarValue("L:APU_GEN_ONLINE", "bool");
        const isACPowerAvailable = engineOn || apuOn || externalPowerOn;
        this.ACPowerStateChange = (isACPowerAvailable != this.ACPowerLastState);
    }
}
