import { Director } from '../directors/Director';

export interface Manager {
    director: Director;
    init: () => void;
    update: () => void;
}
