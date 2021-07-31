import { FmgcComponent } from '@fmgc/lib/FmgcComponent';
import { FMMessage, FMMessageEfisTarget, FMMessageTriggers } from '@shared/FmMessages';
import { ConfirmationNode, Trigger } from '@shared/logic';

/**
 * This class manages Type II messages sent from the FMGC.
 *
 * Since many of those are also sent to the EFIS, this class calls the relevant Coherent triggers for sending commands to the DMC.
 *
 * At the moment, other Type II messages which are not displayed on the EFIS are declared in the old JavaScript CDU/"FMC".
 *
 * **Note:** The plan is eventually to move them here as well - but since they can be triggered manually on pilot output as well, and it
 * is not currently convenient to use this class from the JS CDU, we will not do that at the moment
 *
 * -Benjamin
 */
export class FmsMessages implements FmgcComponent {
    listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    messageSelectors: FMMessageSelector[] = [
        new GpsPrimary(),
        new GpsPrimaryLost(),
    ]

    init(): void {

    }

    update(_deltaTime: number): void {
        for (const selector of this.messageSelectors) {
            const newState = selector.process(_deltaTime);
            const message = selector.message;

            switch (newState) {
            case FMMessageUpdate.SEND:
                this.listener.triggerToAllSubscribers(FMMessageTriggers.SEND_TO_MCDU, message);

                if (message.efisTarget) {
                    this.listener.triggerToAllSubscribers(FMMessageTriggers.SEND_TO_EFIS, message);
                }
                break;
            case FMMessageUpdate.RECALL:
                this.listener.triggerToAllSubscribers(FMMessageTriggers.RECALL_FROM_MCDU_WITH_ID, message.text);

                if (message.efisTarget) {
                    this.listener.triggerToAllSubscribers(FMMessageTriggers.RECALL_FROM_EFIS_WITH_ID, message.id);
                }
                break;
            case FMMessageUpdate.NO_ACTION:
                break;
            default:
                throw new Error('Invalid FM message update state');
            }
        }
    }

    public send(messageClass: { new(): FMMessageSelector }): void {
        const message = this.messageSelectors.find((it) => it instanceof messageClass).message;

        this.listener.triggerToAllSubscribers(FMMessageTriggers.SEND_TO_MCDU, message);

        if (message.efisTarget) {
            this.listener.triggerToAllSubscribers(FMMessageTriggers.SEND_TO_EFIS, message);
        }
    }

    public recall(messageClass: { new(): FMMessageSelector }): void {
        const message = this.messageSelectors.find((it) => it instanceof messageClass).message;

        this.listener.triggerToAllSubscribers(FMMessageTriggers.RECALL_FROM_MCDU_WITH_ID, message.id);

        if (message.efisTarget) {
            this.listener.triggerToAllSubscribers(FMMessageTriggers.RECALL_FROM_EFIS_WITH_ID, message.id);
        }
    }
}

/**
 * Type II message update state.
 *
 * Used when a message selector implements the {@link FMMessageSelector.process `process`} method.
 */
enum FMMessageUpdate {
    /**
     * Self-explanatory
     */
    NO_ACTION,

    /**
     * Send the message to the MCDU, and EFIS target if applicable
     */
    SEND,

    /**
     * Recall the message from the MCDU, and EFIS target if applicable
     */
    RECALL,
}

/**
 * This class defines a selector for a Type II message.
 *
 * It can optionally implement a {@link FMMessageSelector.process `process`} method that runs on every FMGC tick, if the
 * message is not manually triggered by any system or Redux update.
 */
abstract class FMMessageSelector {
    abstract message: FMMessage;

    /**
     * This function allows per-tick processing of a message if implemented
     */
    process(_deltaTime: number): FMMessageUpdate {
        return FMMessageUpdate.NO_ACTION;
    }
}

class GpsPrimary implements FMMessageSelector {
    message: FMMessage = {
        id: 0,
        text: 'GPS PRIMARY',
        efisTarget: FMMessageEfisTarget.ND,
        color: 'White',
    };

    lastState = false;

    process(_deltaTime: number): FMMessageUpdate {
        const newState = SimVar.GetSimVarValue('L:A32NX_ADIRS_USES_GPS_AS_PRIMARY', 'Bool') === 1;

        if (newState !== this.lastState) {
            this.lastState = newState;

            return newState ? FMMessageUpdate.SEND : FMMessageUpdate.RECALL;
        }

        return FMMessageUpdate.NO_ACTION;
    }
}

/**
 * Since this happens when the simvar goes to zero, we need to use some CONF nodes to make sure we do not count the initial
 * first-frame value, as the ADIRS module might not have run yet.
 */
class GpsPrimaryLost implements FMMessageSelector {
    message: FMMessage = {
        id: 1,
        text: 'GPS PRIMARY LOST',
        efisTarget: FMMessageEfisTarget.ND,
        color: 'Amber',
    };

    confLost = new ConfirmationNode(1_000);

    trigLost = new Trigger(true);

    confRegained = new ConfirmationNode(1_000);

    trigRegained = new Trigger(true);

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
