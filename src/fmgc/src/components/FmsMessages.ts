import { FmgcComponent } from '@fmgc/lib/FmgcComponent';
import { FMMessage, FMMessageTriggers, FMMessageTypes } from '@shared/FmMessages';
import { ConfirmationNode, Trigger } from '@shared/logic';

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
    private static mInstance?: FmsMessages;

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
    ]

    // singleton
    /* eslint-disable no-useless-constructor,no-empty-function */
    private constructor() {
    }
    /* eslint-enable no-useless-constructor,no-empty-function */

    public static get instance(): FmsMessages {
        if (!this.mInstance) {
            this.mInstance = new FmsMessages();
        }
        return this.mInstance;
    }

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

    abstract efisSide?: 'L' | 'R';

    /**
     * This function allows per-tick processing of a message if implemented
     */
    process(_deltaTime: number): FMMessageUpdate {
        return FMMessageUpdate.NO_ACTION;
    }
}

class GpsPrimary implements FMMessageSelector {
    message: FMMessage = FMMessageTypes.GpsPrimary;

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
    message: FMMessage = FMMessageTypes.GpsPrimaryLost;

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

// TODO right side
abstract class MapPartlyDisplayed implements FMMessageSelector {
    message: FMMessage = FMMessageTypes.MapPartlyDisplayed;

    abstract efisSide: 'L' | 'R';

    trigRising = new Trigger(true);

    trigFalling = new Trigger(true);

    process(deltaTime: number): FMMessageUpdate {
        const partlyDisplayed = SimVar.GetSimVarValue(`L:A32NX_EFIS_${this.efisSide}_MAP_PARTLY_DISPLAYED`, 'boolean');
        this.trigRising.input = partlyDisplayed === 1;
        this.trigRising.update(deltaTime);
        this.trigFalling.input = partlyDisplayed === 0;
        this.trigFalling.update(deltaTime);
        if (this.trigRising.output) {
            return FMMessageUpdate.SEND;
        }
        if (this.trigFalling.output) {
            return FMMessageUpdate.RECALL;
        }
        return FMMessageUpdate.NO_ACTION;
    }
}

class MapPartlyDisplayedLeft extends MapPartlyDisplayed {
    efisSide: 'L' | 'R' = 'L';
}

class MapPartlyDisplayedRight extends MapPartlyDisplayed {
    efisSide: 'L' | 'R' = 'R';
}
