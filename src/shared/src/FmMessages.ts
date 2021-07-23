export type FMMessageColor = 'White' | 'Amber'

export enum FMMessageEfisTarget {
    PFD,
    ND
}

export interface FMMessage {
    /**
     * Unique ID for this message type
     */
    id: number,

    /**
     * Text on the MCDU scratchpad
     */
    text: string,

    /**
     * EFIS display target, if applicable
     */
    efisTarget?: FMMessageEfisTarget,

    /**
     * EFIS display text, if different than MCDU scratchpad text
     */
    efisText?: string,

    /**
     * Display color for both MCDU and EFIS
     */
    color: FMMessageColor,
}

/** See a320-coherent-triggers.md */
export const FMMessageTriggers = {
    SEND_TO_MCDU: 'A32NX_FMGC_SEND_MESSAGE_TO_MCDU',

    SEND_TO_EFIS: 'A32NX_FMGC_SEND_MESSAGE_TO_ND',

    RECALL_FROM_MCDU_WITH_ID: 'A32NX_FMGC_RECALL_MESSAGE_FROM_MCDU_WITH_ID',

    RECALL_FROM_EFIS_WITH_ID: 'A32NX_FMGC_RECALL_MESSAGE_FROM_EFIS_WITH_ID',

    POP_FROM_STACK: 'A32NX_FMGC_POP_MESSAGE',
};

// export const FMRequestedMessages: FMRequestedMessagesType = [
//     {
//         message: 'SELECT TRUE',
//         efisTarget: FMMessageEfisTarget.ND,
//         efisMessage: 'SELECT TRUE REF',
//         color: 'Amber',
//     },
//     { message: 'CHECK NORTH REF', color: 'Amber' },
//     { message: 'NAV ACCUR DOWNGRAD', color: 'Amber' },
//     { message: 'NAV ACCUR UPGRAD', color: 'Amber' },
//     { message: 'SPECIF VOR/D UNAVAIL', color: 'Amber' },
//     { message: 'NAV ACCUR UPGRAD', color: 'White' },
//     { message: 'GPS PRIMARY', color: 'White' },
// ];
