import { LegacySoundManager } from 'systems-host/systems/LegacySoundManager';

export interface TcasComponent {

    init(): void;

    update(deltaTime: number): void;

}
