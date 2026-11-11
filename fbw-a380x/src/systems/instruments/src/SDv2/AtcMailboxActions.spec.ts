//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { describe, expect, it } from 'vitest';
import {
  AtsuMessageComStatus,
  AtsuMessageDirection,
  CpdlcMessage,
  CpdlcMessageElement,
  CpdlcMessageExpectedResponseType,
  DclMessage,
  FansMode,
  MailboxStatusMessage,
} from '@datalink/common';
import { MailboxAction, mailboxActions, mailboxResponseText, sentResponseId } from './AtcMailboxActions';

/**
 * Creates an uplink message for the tests
 * @param expected the expected response type of the message
 * @param responseTypeId the type of the response which was already sent, if any
 * @returns the uplink message
 */
function uplink(expected: CpdlcMessageExpectedResponseType, responseTypeId?: string): CpdlcMessage {
  const message = new CpdlcMessage();
  message.UniqueMessageID = 1;
  message.Direction = AtsuMessageDirection.Uplink;
  message.Content.push(new CpdlcMessageElement('UM169', [FansMode.FansA], expected));

  if (responseTypeId !== undefined) {
    const response = new CpdlcMessage();
    response.Direction = AtsuMessageDirection.Downlink;
    response.ComStatus = AtsuMessageComStatus.Sent;
    response.Content.push(new CpdlcMessageElement(responseTypeId, [FansMode.FansA]));
    message.Response = response;
  }

  return message;
}

describe('ATC mailbox actions', () => {
  it('offers nothing without a message', () => {
    expect(mailboxActions(undefined, -1, MailboxStatusMessage.NoMessage).actions).toEqual([]);
  });

  describe('departure clearance request (downlink)', () => {
    it('offers SEND before the transmission', () => {
      const result = mailboxActions(new DclMessage(), -1, MailboxStatusMessage.NoMessage);
      expect(result.actions).toEqual([MailboxAction.Send]);
      expect(result.blocked).toBe(false);
    });

    it('blocks SEND while sending', () => {
      expect(mailboxActions(new DclMessage(), -1, MailboxStatusMessage.Sending).blocked).toBe(true);
    });

    it('offers CLOSE once sent', () => {
      expect(mailboxActions(new DclMessage(), -1, MailboxStatusMessage.Sent).actions).toEqual([MailboxAction.Close]);
    });
  });

  describe('clearance (uplink)', () => {
    it('offers WILCO, UNABLE and STANDBY for a WILCO/UNABLE message', () => {
      expect(
        mailboxActions(uplink(CpdlcMessageExpectedResponseType.WilcoUnable), -1, MailboxStatusMessage.NoMessage)
          .actions,
      ).toEqual([MailboxAction.Wilco, MailboxAction.Unable, MailboxAction.Standby]);
    });

    it('offers WILCO and UNABLE again after STANDBY was sent', () => {
      expect(
        mailboxActions(uplink(CpdlcMessageExpectedResponseType.WilcoUnable, 'DM2'), -1, MailboxStatusMessage.NoMessage)
          .actions,
      ).toEqual([MailboxAction.Wilco, MailboxAction.Unable]);
    });

    it('offers SEND and CANCEL once a response is selected', () => {
      expect(
        mailboxActions(uplink(CpdlcMessageExpectedResponseType.WilcoUnable), 0, MailboxStatusMessage.NoMessage).actions,
      ).toEqual([MailboxAction.Send, MailboxAction.Cancel]);
    });

    it('offers CLOSE after WILCO was sent', () => {
      expect(
        mailboxActions(uplink(CpdlcMessageExpectedResponseType.WilcoUnable, 'DM0'), -1, MailboxStatusMessage.NoMessage)
          .actions,
      ).toEqual([MailboxAction.Close]);
    });

    it('offers AFFIRM and NEGATIVE for an AFFIRM/NEGATIVE message', () => {
      expect(
        mailboxActions(uplink(CpdlcMessageExpectedResponseType.AffirmNegative), -1, MailboxStatusMessage.NoMessage)
          .actions,
      ).toEqual([MailboxAction.Affirm, MailboxAction.Negative, MailboxAction.Standby]);
    });

    it('offers ROGER for a ROGER message', () => {
      expect(
        mailboxActions(uplink(CpdlcMessageExpectedResponseType.Roger), -1, MailboxStatusMessage.NoMessage).actions,
      ).toEqual([MailboxAction.Roger]);
    });

    it('offers CLOSE when no response is required', () => {
      expect(
        mailboxActions(uplink(CpdlcMessageExpectedResponseType.NotRequired), -1, MailboxStatusMessage.NoMessage)
          .actions,
      ).toEqual([MailboxAction.Close]);
    });

    it('blocks the actions while the response is sent', () => {
      expect(
        mailboxActions(uplink(CpdlcMessageExpectedResponseType.WilcoUnable), 0, MailboxStatusMessage.Sending).blocked,
      ).toBe(true);
    });
  });

  it('decodes the sent response', () => {
    expect(sentResponseId(uplink(CpdlcMessageExpectedResponseType.WilcoUnable))).toBe(-1);
    expect(sentResponseId(uplink(CpdlcMessageExpectedResponseType.WilcoUnable, 'DM0'))).toBe(0);
    expect(mailboxResponseText(0)).toBe('WILCO');
    expect(mailboxResponseText(42)).toBe('');
  });
});
