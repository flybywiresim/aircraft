class A32NX_Core {
    constructor() {
        console.log('A32NX_Core constructed');
        this.apu = new A32NX_APU();
        this.autobrake = new A32NX_Autobrake();
    }
    init() {
        console.log('A32NX_Core init');
        this.apu.init();
    }
    update(_deltaTime) {
        this.apu.update(_deltaTime);
        this.autobrake.update();
    }
}
