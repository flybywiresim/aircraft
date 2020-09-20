class A32NX_Core {
    constructor() {
        this.lastTime = 0;
        this.modules = [
            new A32NX_APU(),
            new A32NX_BrakeTemp(),
            new LocalVarUpdater(),
        ];
    }

    init(startTime) {
        this.lastTime = startTime;
        this.modules.forEach(module => {
            if (typeof module.init === "function") {
                module.init();
            }
        });
    }

    beforeUpdate() {
        const now = Date.now();
        this.deltaTime = now - this.lastTime;
        this.lastTime = now;
    }
    update() {
        this.beforeUpdate();
        this.modules.forEach(module => {
            module.update(this.deltaTime);
        });
    }
}
