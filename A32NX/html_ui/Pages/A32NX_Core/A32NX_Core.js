class A32NX_Core {
    constructor() {
        console.log('A32NX_Core constructed');
        this.apu = new A32NX_APU();
        this.brakeTemp = new A32NX_BrakeTemp();
    }
    init() {
        console.log('A32NX_Core init');
        this.apu.init();
        this.brakeTemp.init();
    }
    update(_deltaTime) {
        this.apu.update(_deltaTime);
        this.brakeTemp.update(_deltaTime);
    }
}
