//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  AtsuMessageComStatus,
  AtsuMessageDirection,
  CpdlcMessage,
  CpdlcMessageExpectedResponseType,
  MailboxStatusMessage,
} from '@datalink/common';

/** Actions offered by the soft keys on the right side of the ATC mailbox */
export enum MailboxAction {
  Send,
  Cancel,
  Wilco,
  Unable,
  Standby,
  Roger,
  Affirm,
  Negative,
  Close,
}

/** Label shown on the soft key of each action */
export const MailboxActionLabel: Record<MailboxAction, string> = {
  [MailboxAction.Send]: 'SEND',
  [MailboxAction.Cancel]: 'CANCEL',
  [MailboxAction.Wilco]: 'WILCO',
  [MailboxAction.Unable]: 'UNABLE',
  [MailboxAction.Standby]: 'STANDBY',
  [MailboxAction.Roger]: 'ROGER',
  [MailboxAction.Affirm]: 'AFFIRM',
  [MailboxAction.Negative]: 'NEGATIVE',
  [MailboxAction.Close]: 'CLOSE',
};

/**
 * Response identifiers understood by the ATC system (`uplinkResponse`), the response is sent as downlink message DM<id>
 */
export const MailboxResponseId: Partial<Record<MailboxAction, number>> = {
  [MailboxAction.Wilco]: 0,
  [MailboxAction.Unable]: 1,
  [MailboxAction.Standby]: 2,
  [MailboxAction.Roger]: 3,
  [MailboxAction.Affirm]: 4,
  [MailboxAction.Negative]: 5,
};

const ResponseText: Record<number, string> = {
  0: 'WILCO',
  1: 'UNABLE',
  2: 'STANDBY',
  3: 'ROGER',
  4: 'AFFIRM',
  5: 'NEGATIVE',
};

/**
 * Returns the text of a response identifier
 * @param responseId the response identifier (DM<id>)
 * @returns the response text or an empty string if unknown
 */
export function mailboxResponseText(responseId: number): string {
  return ResponseText[responseId] ?? '';
}

/**
 * Returns the response identifier of a downlink response message
 * @param message the uplink message
 * @returns the identifier of the response sent for the message or -1 if no response exists
 */
export function sentResponseId(message: CpdlcMessage): number {
  const typeId = message.Response?.Content[0]?.TypeId;
  if (typeId === undefined || !/^DM\d+$/.test(typeId)) {
    return -1;
  }
  return parseInt(typeId.substring(2));
}

/**
 * Checks if an uplink message requires a response by the crew
 * @param message the uplink message
 * @returns true if a response is required
 */
export function responseRequired(message: CpdlcMessage): boolean {
  const expected = message.Content[0]?.ExpectedResponse;
  return (
    expected === CpdlcMessageExpectedResponseType.WilcoUnable ||
    expected === CpdlcMessageExpectedResponseType.AffirmNegative ||
    expected === CpdlcMessageExpectedResponseType.Roger
  );
}

export interface MailboxActions {
  /** The actions to show, from top to bottom */
  actions: MailboxAction[];
  /** True if the actions cannot be used at the moment, e.g. while a transmission is in progress */
  blocked: boolean;
}

/**
 * Defines the soft keys of the mailbox for the visible message, follows the rules of the A32NX DCDU
 * @param message the first message of the visible block or undefined if no message is shown
 * @param selectedResponse the response selected by the crew but not sent yet, -1 if none
 * @param status the mailbox status of the visible block
 * @returns the actions to offer
 */
export function mailboxActions(
  message: CpdlcMessage | undefined,
  selectedResponse: number,
  status: MailboxStatusMessage,
): MailboxActions {
  if (message === undefined) {
    return { actions: [], blocked: true };
  }

  const sending = status === MailboxStatusMessage.Sending;

  if (message.Direction === AtsuMessageDirection.Downlink) {
    const sent = status === MailboxStatusMessage.Sent || message.ComStatus === AtsuMessageComStatus.Sent;
    if (sent) {
      return { actions: [MailboxAction.Close], blocked: false };
    }
    return { actions: [MailboxAction.Send], blocked: sending || message.ComStatus === AtsuMessageComStatus.Sending };
  }

  const blocked = sending || message.Response?.ComStatus === AtsuMessageComStatus.Sending;

  // a response is selected and waits for the transmission
  if (selectedResponse !== -1) {
    return { actions: [MailboxAction.Send, MailboxAction.Cancel], blocked };
  }

  // the answer can be given as long as nothing or only STANDBY was sent
  const previousResponse = sentResponseId(message);
  if (
    !responseRequired(message) ||
    (previousResponse !== -1 && previousResponse !== MailboxResponseId[MailboxAction.Standby])
  ) {
    return { actions: [MailboxAction.Close], blocked };
  }

  const standby = previousResponse === -1 ? [MailboxAction.Standby] : [];
  switch (message.Content[0]?.ExpectedResponse) {
    case CpdlcMessageExpectedResponseType.WilcoUnable:
      return { actions: [MailboxAction.Wilco, MailboxAction.Unable, ...standby], blocked };
    case CpdlcMessageExpectedResponseType.AffirmNegative:
      return { actions: [MailboxAction.Affirm, MailboxAction.Negative, ...standby], blocked };
    case CpdlcMessageExpectedResponseType.Roger:
      return { actions: [MailboxAction.Roger], blocked };
    default:
      return { actions: [MailboxAction.Close], blocked };
  }
}
