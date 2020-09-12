class A32NX_Core {
    constructor() {
        console.log('A32NX_Core constructed');
        this.apu = new A32NX_APU();
    }
    init() {
        console.log('A32NX_Core init');
        this.apu.init();
    }
    update(_deltaTime) {
        this.apu.update(_deltaTime);
    }
}
