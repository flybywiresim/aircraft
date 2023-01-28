import { FMMessage, FMMessageTypes } from '@shared/FmMessages';
import { ConfirmationNode, Trigger } from '@shared/logic';
import { FMMessageSelector, FMMessageUpdate } from './FmsMessages';

/**
 * Since this happens when the simvar goes to zero, we need to use some CONF nodes to make sure we do not count the initial
 * first-frame value, as the ADIRS module might not have run yet.
 */
export class GpsPrimaryLost implements FMMessageSelector {
    message: FMMessage = FMMessageTypes.GpsPrimaryLost;

    private confLost = new ConfirmationNode(1_000);

    private trigLost = new Trigger(true);

    private confRegained = new ConfirmationNode(1_000);

    private trigRegained = new Trigger(true);

    process(deltaTime: number): FMMessageUpdate {
        const lostNow = SimVar.GetSimVarValue('L:A32NX_ADIRS_USES_GPS_AS_PRIMARY', 'Bool') === 0;

        this.confLost.input = lostNow;
        this.confLost.update(deltaTime);
        this.trigLost.input = this.confLost.output;
        this.trigLost.update(deltaTime);

        this.confRegained.input = !lostNow;
        this.confRegained.update(deltaTime);
        this.trigRegained.input = this.confRegained.output;
        this.trigRegained.update(deltaTime);

        if (this.trigLost.output) {
            return FMMessageUpdate.SEND;
        }

        if (this.trigRegained.output) {
            return FMMessageUpdate.RECALL;
        }

        return FMMessageUpdate.NO_ACTION;
    }
}
