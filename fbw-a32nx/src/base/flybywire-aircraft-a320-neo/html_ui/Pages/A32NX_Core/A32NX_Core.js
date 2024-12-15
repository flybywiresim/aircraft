const ENABLE_TOTAL_UPDATE_TIME_TRACING = false;

class A32NX_Core {
    constructor() {
        this.modules = [
            {
                name: 'BaroSelector',
                module: new A32NX_BaroSelector(),
                updateInterval: 300,
            },
            {
                name: 'Refuel',
                module: new A32NX_Refuel(),
                updateInterval: 150,
            },
            {
                name: 'LocalVars',
                module: new A32NX_LocalVarUpdater(),
                updateInterval: 50,
            },
            {
                name: 'FADEC #1',
                module: new A32NX_FADEC(1),
                updateInterval: 100,
            },
            {
                name: 'FADEC #2',
                module: new A32NX_FADEC(2),
                updateInterval: 100,
            },
            {
                name: 'FWC',
                module: new A32NX_FWC(2),
                updateInterval: 50,
            },
            {
                name: 'GPWS',
                module: new A32NX_GPWS(this),
                updateInterval: 75,
            },
            {
                name: 'Speeds',
                module: new A32NX_Speeds(),
                updateInterval: 500,
            },
        ];
        this.moduleThrottlers = {};
        for (const moduleDefinition of this.modules) {
            this.moduleThrottlers[moduleDefinition.name] = new UpdateThrottler(moduleDefinition.updateInterval);
        }

        this.soundManager = new A32NX_SoundManager();
        this.tipsManager = A32NX_TipsManager.instance;
    }

    init(startTime) {
        this.getDeltaTime = A32NX_Util.createDeltaTimeCalculator(startTime);
        this.modules.forEach((moduleDefinition) => {
            if (typeof moduleDefinition.module.init === 'function') {
                moduleDefinition.module.init();
            }
        });

        this.isInit = true;
    }

    update() {
        if (!this.isInit) {
            return;
        }

        const startTime = ENABLE_TOTAL_UPDATE_TIME_TRACING ? Date.now() : 0;

        const deltaTime = this.getDeltaTime();

        this.soundManager.update(deltaTime);
        this.tipsManager.update(deltaTime);

        let updatedModules = 0;
        this.modules.forEach((moduleDefinition) => {
            const moduleDeltaTime = this.moduleThrottlers[moduleDefinition.name].canUpdate(deltaTime);

            if (moduleDeltaTime !== -1) {
                moduleDefinition.module.update(moduleDeltaTime, this);
                updatedModules++;
            }
        });

        if (ENABLE_TOTAL_UPDATE_TIME_TRACING) {
            const endTime = Date.now();

            const updateTime = endTime - startTime;

            console.warn(`NXCore update took: ${updateTime.toFixed(2)}ms (${updatedModules} modules updated)`);
        }
    }
}
