import { DIR1 } from './DIR1';
import { DirectorMemory } from './DirectorMemory';
import { Director } from './Director';
import { Cids } from '../CidsConstants';

export class DIR2 extends Director {
    private dir1: DIR1;

    memory: DirectorMemory;

    init(_oppositeDirector: Director): void {
        throw new Error('Method not implemented.');
    }

    update(): void {
        throw new Error('Method not implemented.');
    }

    startup(): void {
        throw new Error('Method not implemented.');
    }

    shutdown(): void {
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
            this.output(Cids.SimVar.DIR2.ACTIVE, 'Bool', false, null, true);
        } else if (!this.isFaulty()) {
            this.output(Cids.SimVar.DIR2.ACTIVE, 'Bool', true, null, true);
        } else {
            this.output(Cids.SimVar.DIR2.ACTIVE, 'Bool', false, null, true);
            this.output(Cids.SimVar.DIR1.ACTIVE, 'Bool', true, null, true);
        }
    }
}
