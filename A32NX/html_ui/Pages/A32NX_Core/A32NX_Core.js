class A32NX_Core {
    constructor() {
        this.getDeltaTime = null;
        this.modules = [
            new A32NX_ADIRS(),
            new A32NX_APU(),
            new A32NX_BrakeTemp(),
            new A32NX_LocalVarUpdater(),
        ];
    }

    init(startTime) {
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

        const deltaTime = this.getDeltaTime();
        this.modules.forEach(module => {
            module.update(deltaTime);
        });
    }
}
