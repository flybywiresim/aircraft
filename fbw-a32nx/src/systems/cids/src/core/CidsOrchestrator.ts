import { UpdateThrottler } from '@shared/UpdateThrottler';
import { DIR1 } from './directors/DIR1';
import { DIR2 } from './directors/DIR2';

export class CidsOrchestrator {
    public static DEBUG = true; // TODO: revert to false

    private readonly dir1: DIR1;

    private readonly dir2: DIR2;

    private readonly dir1UpdateThrottler: UpdateThrottler;

    private readonly dir2UpdateThrottler: UpdateThrottler;

    private lastPowerStateOn: boolean;

    constructor() {
        this.dir1 = new DIR1();
        this.dir2 = new DIR2();
        this.dir1UpdateThrottler = new UpdateThrottler(100);
        this.dir2UpdateThrottler = new UpdateThrottler(100);
        this.lastPowerStateOn = false;
    }

    public init(): void {
        this.dir1.init(this.dir2);
        this.dir2.init(this.dir1);

        console.log('[CIDS] Initialization complete.');
    }

    public update(deltaTime: number): void {
        if (!SimVar.GetSimVarValue('L:A32NX_IS_READY', 'Bool')) return;

        /* eslint-disable @typescript-eslint/no-unused-vars */
        const GND_FLT_BUS_POWERED = SimVar.GetSimVarValue('L:A32NX_ELEC_DC_GND_FLT_SVC_BUS_IS_POWERED', 'Bool');
        const DC_ESS_BUS_POWERED = SimVar.GetSimVarValue('L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', 'Bool');
        /* eslint-enable @typescript-eslint/no-unused-vars */

        if (GND_FLT_BUS_POWERED && DC_ESS_BUS_POWERED) {
            if (!this.lastPowerStateOn) {
                this.dir1.startup();
                this.dir2.startup();
            }
            this.lastPowerStateOn = true;

            if (this.dir1UpdateThrottler.canUpdate(deltaTime) !== -1) {
                this.dir1.update();
            }
            if (this.dir2UpdateThrottler.canUpdate(deltaTime) !== -1) {
                this.dir2.update();
            }
        } else if (this.lastPowerStateOn) {
            this.dir1.shutdown();
            this.dir2.shutdown();
            this.lastPowerStateOn = false;
        }
    }
}
