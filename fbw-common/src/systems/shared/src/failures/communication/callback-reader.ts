import { Updatable } from '.';

export interface CallbackReader extends Updatable {
    /**
     * Registers a callback to be called when the given identifier is read.
     */
    register(identifier: number, callback: () => void): void;
}
