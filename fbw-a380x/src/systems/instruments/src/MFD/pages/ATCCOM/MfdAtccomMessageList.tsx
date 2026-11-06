// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import {
  AtsuMessageComStatus,
  AtsuMessageDirection,
  AtsuMessageSerializationFormat,
  CpdlcMessage,
} from '@datalink/common';
import { AtccomMfdPageProps } from '../../MFD';
import { Button } from '../../../MsfsAvionicsCommon/UiWidgets/Button';
import { ActivePageTitleBar } from '../common/ActivePageTitleBar';
import { AtccomFooter } from './MfdAtccomFooter';
import { MessageElement } from './Elements/MessageElement';
import './MfdAtccomMsgRecord.scss';

interface MfdAtccomMessageListProps extends AtccomMfdPageProps {
  mode: 'all' | 'monitored' | 'detail';
}

const statusText = (message: CpdlcMessage): string => {
  switch (message.ComStatus) {
    case AtsuMessageComStatus.Sending:
      return 'SENDING';
    case AtsuMessageComStatus.Sent:
      return 'SENT';
    case AtsuMessageComStatus.Failed:
      return 'FAILED';
    case AtsuMessageComStatus.Received:
      return 'RECEIVED';
    default:
      return 'OPEN';
  }
};

export class MfdAtccomMessageList extends DisplayComponent<MfdAtccomMessageListProps> {
  private messageBody(message: CpdlcMessage): string {
    return message.serialize(AtsuMessageSerializationFormat.Mailbox);
  }

  private messageRow(message: CpdlcMessage): VNode {
    return (
      <MessageElement
        msgTime={message.Timestamp?.mailboxTimestamp() ?? ''}
        msgOriginDest={`${message.Direction === AtsuMessageDirection.Uplink ? 'FROM' : 'TO'} ${message.Station}`}
        msgStatus={statusText(message)}
        msgBody={this.messageBody(message)}
        onClick={() => {
          this.props.atcService.selectedMessage = message;
          this.props.mfd.uiService.navigateTo('atccom/msg-record/all-msg-expand');
        }}
      />
    );
  }

  public render(): VNode {
    const { mode, atcService } = this.props;
    const messages =
      mode === 'detail'
        ? atcService.selectedMessage
          ? [atcService.selectedMessage]
          : []
        : atcService.getMessages(mode === 'monitored');
    const title =
      mode === 'detail'
        ? 'MSG RECORD/EXPAND'
        : mode === 'monitored'
          ? 'MSG RECORD/MONITORED MSG'
          : 'MSG RECORD/ALL MSG';
    return (
      <>
        <ActivePageTitleBar activePage={Subject.create(title)} offset={Subject.create('')} />
        <div class="mfd-page-container">
          <div id="msg-record-list" style="overflow-y: auto; max-height: 650px;">
            {messages.length === 0 ? (
              <div class="mfd-label" style="padding: 25px;">
                NO MESSAGES
              </div>
            ) : (
              messages.map((message) => this.messageRow(message))
            )}
          </div>
          {mode !== 'detail' && (
            <div class="mfd-atccom-msg-record-footer">
              <Button
                label="REFRESH"
                onClick={() =>
                  this.props.mfd.uiService.navigateTo(
                    `atccom/msg-record/${mode === 'all' ? 'all-msg' : 'monitored-msg'}`,
                  )
                }
                buttonStyle="width: 190px; height: 64px;"
              />
            </div>
          )}
          {mode === 'detail' && (
            <div class="mfd-atccom-msg-record-footer">
              <Button
                label="RETURN TO LIST"
                onClick={() => this.props.mfd.uiService.navigateTo('atccom/msg-record/all-msg')}
                buttonStyle="width: 190px; height: 64px;"
              />
            </div>
          )}
        </div>
        <AtccomFooter bus={this.props.bus} mfd={this.props.mfd} atcService={atcService} />
      </>
    );
  }
}
