const ENABLE_TOTAL_UPDATE_TIME_TRACING = false;

class A32NX_Core {
    constructor() {
        this.modules = [
            {
                name: 'ADIRS',
                module: new A32NX_ADIRS(),
                updateInterval: 100,
            },
            {
                name: 'APU',
                module: new A32NX_APU(),
                updateInterval: 100,
            },
            {
                name: 'BaroSelector',
                module: new A32NX_BaroSelector(),
                updateInterval: 300,
            },
            {
                name: 'BrakeTemp',
                module: new A32NX_BrakeTemp(),
                updateInterval: 150,
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
                name: 'GPWS',
                module: new A32NX_GPWS(this),
                updateInterval: 75,
            },
            {
                name: 'Speeds',
                module: new A32NX_Speeds(),
                updateInterval: 500,
            }
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
        this.modules.forEach(moduleDefinition => {
            if (typeof moduleDefinition.module.init === "function") {
                moduleDefinition.module.init();
            }
        });
        this.initLighting();

        this.isInit = true;
    }

    initLighting() {
        /** automatic brightness based on ambient light, [0, 1] scale */
        const autoBrightness = Math.max(15, Math.min(85, SimVar.GetSimVarValue('GLASSCOCKPIT AUTOMATIC BRIGHTNESS', 'percent')));

        // DOME
        this.setPotentiometer(7, 0);
        // MAIN FLOOD
        this.setPotentiometer(83, autoBrightness < 50 ? 20 : 0);
        // FCU INTEG
        this.setPotentiometer(84, autoBrightness < 50 ? 1.5 * autoBrightness : 0);
        // MAIN & PED INTEG
        this.setPotentiometer(85, autoBrightness < 50 ? 1.5 * autoBrightness : 0);
        // OVHD INTEG
        this.setPotentiometer(86, autoBrightness < 50 ? 1.5 * autoBrightness : 0);
        // FCU Displays
        this.setPotentiometer(87, autoBrightness);
        // CAPT PFD DU
        this.setPotentiometer(88, autoBrightness);
        // CAPT ND DU
        this.setPotentiometer(89, autoBrightness);
        // F/O PFD DU
        this.setPotentiometer(90, autoBrightness);
        // F/O ND DU
        this.setPotentiometer(91, autoBrightness);
        // Upper ECAM DU
        this.setPotentiometer(92, autoBrightness);
        // Lower ECAM DU
        this.setPotentiometer(93, autoBrightness);
        // CAPT MCDU
        SimVar.SetSimVarValue('L:A32NX_MCDU_L_BRIGHTNESS', 'number', 8 * autoBrightness / 100);
        // FO MCDU
        SimVar.SetSimVarValue('L:A32NX_MCDU_R_BRIGHTNESS', 'number', 8 * autoBrightness / 100);
        // CAPT DCDU
        SimVar.SetSimVarValue('L:A32NX_PANEL_DCDU_L_BRIGHTNESS', 'number', autoBrightness / 100);
        // FO DCDU
        SimVar.SetSimVarValue('L:A32NX_PANEL_DCDU_R_BRIGHTNESS', 'number', autoBrightness / 100);
    }

    setPotentiometer(potentiometer, brightness) {
        Coherent.call('TRIGGER_KEY_EVENT', 'LIGHT_POTENTIOMETER_SET', false, potentiometer, brightness, 0, 0);
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
        this.modules.forEach(moduleDefinition => {
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
