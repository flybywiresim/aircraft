// @ts-strict-ignore
import { UpdateThrottler } from '@flybywiresim/fbw-sdk';
import { A32NX_Util } from '../../../../../shared/src/A32NX_Util';
import { A32NX_Refuel } from './A32NX_Refuel';
import { A32NX_Speeds } from './A32NX_Speeds';
import { A32NX_FADEC } from './A32NX_FADEC';
import { A32NX_FWC } from './A32NX_FWC';
import { A32NX_GPWS } from './A32NX_GPWS';
import { A32NX_SoundManager } from './A32NX_SoundManager';
import { A32NX_LocalVarUpdater } from './A32NX_LocalVarUpdater';
import { A32NX_TipsManager } from './A32NX_TipsManager';

const ENABLE_TOTAL_UPDATE_TIME_TRACING = false;

// FIXME move Speeds to somewhere nicer in the FMS, and the rest out to system or extras host
export class A32NX_Core {
  private readonly modules = [
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
  private readonly moduleThrottlers = new Map(this.modules.map((m) => [m.name, new UpdateThrottler(m.updateInterval)]));

  private readonly soundManager = new A32NX_SoundManager();
  private readonly tipsManager = A32NX_TipsManager.instance;

  private getDeltaTime: ReturnType<typeof A32NX_Util.createDeltaTimeCalculator>;

  private isInit = false;

  init() {
    this.getDeltaTime = A32NX_Util.createDeltaTimeCalculator();
    this.modules.forEach((moduleDefinition) => {
      if ('init' in moduleDefinition.module) {
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
      const moduleDeltaTime = this.moduleThrottlers.get(moduleDefinition.name).canUpdate(deltaTime);

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
