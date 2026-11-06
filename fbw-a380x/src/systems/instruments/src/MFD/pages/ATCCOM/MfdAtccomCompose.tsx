// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { CpdlcMessage, CpdlcMessagesDownlink } from '@datalink/common';
import { AtccomMfdPageProps } from '../../MFD';
import { Button } from '../../../MsfsAvionicsCommon/UiWidgets/Button';
import { InputField } from '../../../MsfsAvionicsCommon/UiWidgets/InputField';
import { LongAlphanumericFormat } from '../common/DataEntryFormats';
import { A380FmsError } from '../../shared/A380FmsError';
import { ActivePageTitleBar } from '../common/ActivePageTitleBar';
import { AtccomFooter } from './MfdAtccomFooter';

interface MfdAtccomComposeProps extends AtccomMfdPageProps {
  emergency: boolean;
}

export class MfdAtccomCompose extends DisplayComponent<MfdAtccomComposeProps> {
  private readonly text = Subject.create('');
  private readonly status = Subject.create('');
  private readonly transferDisabled = this.text.map((value) => !value.trim());

  private transfer(type: 'DM55' | 'DM56' | 'DM67'): void {
    const station = this.props.atcService.stationStatus.get().current;
    if (!station || (type === 'DM67' && !this.text.get().trim())) {
      this.status.set('NO ACTIVE ATC');
      return;
    }
    const message = new CpdlcMessage();
    message.Station = station;
    const element = CpdlcMessagesDownlink[type][1].deepCopy();
    if (type === 'DM67') element.Content[0].Value = this.text.get().trim().toUpperCase();
    message.Content.push(element);
    this.props.atcService.registerCpdlcMessage(message);
    this.status.set('TRANSFERRED TO MAILBOX');
  }

  public destroy(): void {
    this.transferDisabled.destroy();
    super.destroy();
  }

  public render(): VNode {
    return (
      <>
        <ActivePageTitleBar
          activePage={Subject.create(this.props.emergency ? 'EMER' : 'REPORT & NOTIFY')}
          offset={Subject.create('')}
        />
        <div class="mfd-page-container" style="padding: 45px 60px;">
          {this.props.emergency ? (
            <div style="display: flex; gap: 20px;">
              <Button label="MAYDAY" onClick={() => this.transfer('DM56')} buttonStyle="width: 220px;" />
              <Button label="PAN PAN" onClick={() => this.transfer('DM55')} buttonStyle="width: 220px;" />
            </div>
          ) : (
            <div class="mfd-atccom-dcl-row">
              <span>MESSAGE</span>
              <InputField<string>
                dataEntryFormat={new LongAlphanumericFormat()}
                value={this.text}
                containerStyle="width: 350px;"
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
                errorHandler={(error: A380FmsError) =>
                  this.props.atcService.showAtcErrorMessage(error.type, error.details)
                }
              />
              <Button
                label="XFR TO MAILBOX"
                disabled={this.transferDisabled}
                onClick={() => this.transfer('DM67')}
                buttonStyle="width: 200px;"
              />
            </div>
          )}
          <div class="mfd-atccom-dcl-status">{this.status}</div>
        </div>
        <AtccomFooter bus={this.props.bus} mfd={this.props.mfd} atcService={this.props.atcService} />
      </>
    );
  }
}
