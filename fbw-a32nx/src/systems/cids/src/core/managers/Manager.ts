import { Director } from '../directors/Director';

export interface Manager {
    director: Director;
    /**
     * **DO NOT USE FOR DIRECTOR DIFFERENTIATION!** Use inheritance to differentiate between directors.
     */
    directorId: DirectorId;
    init: () => void;
    update: () => void;
}
