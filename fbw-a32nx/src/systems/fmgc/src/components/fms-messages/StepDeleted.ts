import { FMMessage, FMMessageTypes } from '@shared/FmMessages';
import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';

export class StepDeleted implements FMMessageSelector {
    message: FMMessage = FMMessageTypes.StepDeleted;

    process(_: number): FMMessageUpdate {
        const newState = SimVar.GetSimVarValue('L:A32NX_FM_VNAV_TRIGGER_STEP_DELETED', 'Bool') === 1;

        if (newState) {
            SimVar.SetSimVarValue('L:A32NX_FM_VNAV_TRIGGER_STEP_DELETED', 'boolean', false);

            return FMMessageUpdate.SEND;
        }

        return FMMessageUpdate.NO_ACTION;
    }
}
