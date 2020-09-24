class A32NX_Core {
    constructor() {
        console.log('A32NX_Core constructed');
        this.apu = new A32NX_APU();
        this.brakeTemp = new A32NX_BrakeTemp();
        this.electricity = new A32NX_Electricity();
    }
    init() {
        console.log('A32NX_Core init');
        this.apu.init();
        this.brakeTemp.init();
        this.electricity.init();
        this.ACPowerStateChange = false;
    }
    update(_deltaTime) {
        this.updateACPowerStateChange();
        this.apu.update(_deltaTime, this);
        this.brakeTemp.update(_deltaTime, this);
        this.electricity.update(_deltaTime, this);
    }
    updateACPowerStateChange() {
        const engineOn = Simplane.getEngineActive(0) || Simplane.getEngineActive(1);
        const externalPowerOn = SimVar.GetSimVarValue("EXTERNAL POWER AVAILABLE:1", "Bool") === 1 && SimVar.GetSimVarValue("EXTERNAL POWER ON", "Bool") === 1;
        const apuOn = SimVar.GetSimVarValue("L:APU_GEN_ONLINE", "bool");
        const isACPowerAvailable = engineOn || apuOn || externalPowerOn;
        this.ACPowerStateChange = (isACPowerAvailable != this.ACPowerLastState);
    }
}
