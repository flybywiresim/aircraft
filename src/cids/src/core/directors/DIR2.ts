import { DIR1 } from './DIR1';
import { DirectorMemory } from './DirectorMemory';
import { Director } from './Director';

export class DIR2 extends Director {
    private dir1: DIR1;

    memory: DirectorMemory;

    init(_oppositeDirector: Director): void {
        throw new Error('Method not implemented.');
    }

    update(): void {
        throw new Error('Method not implemented.');
    }

    isFaulty(): boolean {
        throw new Error('Method not implemented.');
    }

    isActive(): boolean {
        throw new Error('Method not implemented.');
    }

    fail(): void {
        throw new Error('Method not implemented.');
    }

    private updateActiveState(): void {
        if (this.dir1.isActive()) {
            this.output('L:A32NX_CIDS_DIR_2_ACTIVE', 'Bool', false, null, true);
        } else if (!this.isFaulty()) {
            this.output('L:A32NX_CIDS_DIR_2_ACTIVE', 'Bool', true, null, true);
        } else {
            this.output('L:A32NX_CIDS_DIR_2_ACTIVE', 'Bool', false, null, true);
            this.output('L:A32NX_CIDS_DIR_1_ACTIVE', 'Bool', true, null, true);
        }
    }
}
