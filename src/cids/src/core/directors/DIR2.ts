import { DirectorMemory } from './DirectorMemory';
import { Director } from './Director';

export class DIR2 extends Director {
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
}
