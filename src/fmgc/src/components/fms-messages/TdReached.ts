import { FMMessage, FMMessageTypes } from '@shared/FmMessages';
import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';

export class TdReached implements FMMessageSelector {
    message: FMMessage = FMMessageTypes.TdReached;

    private lastState = false;

    process(_: number): FMMessageUpdate {
        const newState = SimVar.GetSimVarValue('L:A32NX_PFD_MSG_TD_REACHED', 'Bool') === 1;

        if (newState !== this.lastState) {
            this.lastState = newState;

            return newState ? FMMessageUpdate.SEND : FMMessageUpdate.RECALL;
        }

        return FMMessageUpdate.NO_ACTION;
    }
}
