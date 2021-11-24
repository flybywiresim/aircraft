import { FMMessage, FMMessageTriggers } from '@shared/FmMessages';
import { FmgcComponent } from '../FmgcComponent';
import { GpsPrimary } from './GpsPrimary';
import { GpsPrimaryLost } from './GpsPrimaryLost';
import { MapPartlyDisplayedLeft, MapPartlyDisplayedRight } from './MapPartlyDisplayed';

/**
 * This class manages Type II messages sent from the FMGC.
 *
 * Since many of those are also sent to the EFIS, this class sets a bitfield signalling the active messages to the DMCs
 *
 * At the moment, other Type II messages which are not displayed on the EFIS are declared in the old JavaScript CDU/"FMC".
 *
 * **Note:** The plan is eventually to move them here as well - but since they can be triggered manually on pilot output as well, and it
 * is not currently convenient to use this class from the JS CDU, we will not do that at the moment
 *
 * -Benjamin
 */
export class FmsMessages implements FmgcComponent {
    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    private ndMessageFlags: Record<'L' | 'R', number> = {
        L: 0,
        R: 0,
    };

    private messageSelectors: FMMessageSelector[] = [
        new GpsPrimary(),
        new GpsPrimaryLost(),
        new MapPartlyDisplayedLeft(),
        new MapPartlyDisplayedRight(),
    ];

    init(): void {
        // Do nothing
    }

    update(_deltaTime: number): void {
        let didMutateNd = false;
        for (const selector of this.messageSelectors) {
            const newState = selector.process(_deltaTime);
            const message = selector.message;

            switch (newState) {
            case FMMessageUpdate.SEND:
                if (message.text) {
                    this.listener.triggerToAllSubscribers(FMMessageTriggers.SEND_TO_MCDU, message);
                }

                if (message.ndFlag > 0) {
                    if (selector.efisSide) {
                        this.ndMessageFlags[selector.efisSide] |= message.ndFlag;
                    } else {
                        for (const side in this.ndMessageFlags) {
                            if (Object.prototype.hasOwnProperty.call(this.ndMessageFlags, side)) {
                                this.ndMessageFlags[side] |= message.ndFlag;
                            }
                        }
                    }
                    didMutateNd = true;
                }
                break;
            case FMMessageUpdate.RECALL:
                if (message.text) {
                    this.listener.triggerToAllSubscribers(FMMessageTriggers.RECALL_FROM_MCDU_WITH_ID, message.text); // TODO id
                }

                if (message.ndFlag > 0) {
                    if (selector.efisSide) {
                        this.ndMessageFlags[selector.efisSide] &= ~message.ndFlag;
                    } else {
                        for (const side in this.ndMessageFlags) {
                            if (Object.prototype.hasOwnProperty.call(this.ndMessageFlags, side)) {
                                this.ndMessageFlags[side] &= ~message.ndFlag;
                            }
                        }
                    }
                    didMutateNd = true;
                }
                break;
            case FMMessageUpdate.NO_ACTION:
                break;
            default:
                throw new Error('Invalid FM message update state');
            }
        }
        if (didMutateNd) {
            for (const side in this.ndMessageFlags) {
                if (Object.prototype.hasOwnProperty.call(this.ndMessageFlags, side)) {
                    SimVar.SetSimVarValue(`L:A32NX_EFIS_${side}_ND_FM_MESSAGE_FLAGS`, 'number', this.ndMessageFlags[side]);
                }
            }
        }
    }

    public send(messageClass: { new(): FMMessageSelector }): void {
        const message = this.messageSelectors.find((it) => it instanceof messageClass).message;

        this.listener.triggerToAllSubscribers(FMMessageTriggers.SEND_TO_MCDU, message);

        if (message.ndFlag) {
            for (const side in this.ndMessageFlags) {
                if (Object.prototype.hasOwnProperty.call(this.ndMessageFlags, side)) {
                    this.ndMessageFlags[side] |= message.ndFlag;
                    SimVar.SetSimVarValue(`L:A32NX_EFIS_${side}_ND_FM_MESSAGE_FLAGS`, 'number', this.ndMessageFlags[side]);
                }
            }
        }
    }

    public recall(messageClass: { new(): FMMessageSelector }): void {
        const message = this.messageSelectors.find((it) => it instanceof messageClass).message;

        this.listener.triggerToAllSubscribers(FMMessageTriggers.RECALL_FROM_MCDU_WITH_ID, message.text); // TODO id

        if (message.ndFlag) {
            for (const side in this.ndMessageFlags) {
                if (Object.prototype.hasOwnProperty.call(this.ndMessageFlags, side)) {
                    this.ndMessageFlags[side] &= ~message.ndFlag;
                    SimVar.SetSimVarValue(`L:A32NX_EFIS_${side}_ND_FM_MESSAGE_FLAGS`, 'number', this.ndMessageFlags[side]);
                }
            }
        }
    }

    public recallId(id: number) {
        const message = this.messageSelectors.find((it) => it.message.id === id).message;

        this.listener.triggerToAllSubscribers(FMMessageTriggers.RECALL_FROM_MCDU_WITH_ID, message.text); // TODO id

        if (message.ndFlag) {
            for (const side in this.ndMessageFlags) {
                if (Object.prototype.hasOwnProperty.call(this.ndMessageFlags, side)) {
                    this.ndMessageFlags[side] &= ~message.ndFlag;
                    SimVar.SetSimVarValue(`L:A32NX_EFIS_${side}_ND_FM_MESSAGE_FLAGS`, 'number', this.ndMessageFlags[side]);
                }
            }
        }
    }
}

/**
 * Type II message update state.
 *
 * Used when a message selector implements the {@link FMMessageSelector.process `process`} method.
 */
export enum FMMessageUpdate {
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
export abstract class FMMessageSelector {
    abstract message: FMMessage;

    abstract efisSide?: 'L' | 'R';

    /**
     * This function allows per-tick processing of a message if implemented
     */
    process(_deltaTime: number): FMMessageUpdate {
        return FMMessageUpdate.NO_ACTION;
    }
}
