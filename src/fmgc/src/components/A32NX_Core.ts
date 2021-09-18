/* eslint-disable camelcase */
import { UpdateThrottler, A32NX_Util } from '@fmgc/utils/A32NX_Util';
import { A32NX_ADIRS } from './A32NX_ADIRS';
import { A32NX_APU } from './A32NX_APU';
import { A32NX_BaroSelector } from './A32NX_BaroSelector';
import { A32NX_BrakeTemp } from './A32NX_BrakeTemp';
import { A32NX_FADEC } from './A32NX_FADEC';
import { A32NX_FWC } from './A32NX_FWC';
import { A32NX_GPWS } from './A32NX_GPWS';
import { A32NX_LocalVarUpdater } from './A32NX_LocalVarUpdater';
import { A32NX_Refuel } from './A32NX_Refuel';
import { A32NX_SoundManager } from './A32NX_SoundManager';
import { A32NX_Speeds } from './A32NX_Speeds';
import { A32NX_TipsManager } from './A32NX_TipsManager';

const ENABLE_TOTAL_UPDATE_TIME_TRACING = false;

export class A32NX_Core {
    modules: { name: string; module: any; updateInterval: number; }[];

    moduleThrottlers: {};

    soundManager: any;

    tipsManager: any;

    getDeltaTime: any;

    isInit: boolean;

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
                name: 'FWC',
                module: new A32NX_FWC(),
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
        this.tipsManager = new A32NX_TipsManager();
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
