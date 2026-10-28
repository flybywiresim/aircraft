// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AtccomMfdPageProps } from '../../MFD';
import { AtsuStatusCodes } from '@datalink/common';
import { Button } from '../../../MsfsAvionicsCommon/UiWidgets/Button';
import { InputField } from '../../../MsfsAvionicsCommon/UiWidgets/InputField';
import { ShortAlphanumericFormat } from '../common/DataEntryFormats';
import { A380FmsError } from '../../shared/A380FmsError';
import { ActivePageTitleBar } from '../common/ActivePageTitleBar';
import { AtccomFooter } from './MfdAtccomFooter';
import './MfdAtccomConnect.scss';

export class MfdAtccomConnectLive extends DisplayComponent<AtccomMfdPageProps> {
  private readonly station = Subject.create('');
  private readonly status = this.props.atcService.stationStatus;
  private readonly current = this.status.map((value) => value.current || '----');
  private readonly next = this.status.map((value) => value.next || '----');
  private readonly logonDisabled = this.station.map((value) => !/^[A-Z]{4}$/i.test(value));
  private readonly logoffDisabled = this.status.map((value) => !value.current);
  private readonly requestStatus = Subject.create('');

  private async notifyAtc(): Promise<void> {
    this.requestStatus.set('CONNECTING');
    const code = await this.props.atcService.logon(this.station.get());
    this.requestStatus.set(code === AtsuStatusCodes.Ok ? 'LOGON REQUESTED' : `LOGON FAILED: ${AtsuStatusCodes[code]}`);
  }

  public destroy(): void {
    this.current.destroy();
    this.next.destroy();
    this.logonDisabled.destroy();
    this.logoffDisabled.destroy();
    super.destroy();
  }

  public render(): VNode {
    return (
      <>
        <ActivePageTitleBar activePage={Subject.create('CONNECT')} offset={Subject.create('')} />
        <div class="mfd-page-container" style="padding: 45px 60px;">
          <div class="mfd-atccom-connect-row">
            <span class="mfd-label" style="width: 250px;">
              NOTIFY TO ATC
            </span>
            <InputField<string>
              dataEntryFormat={new ShortAlphanumericFormat()}
              value={this.station}
              containerStyle="width: 150px;"
              hEventConsumer={this.props.mfd.hEventConsumer}
              interactionMode={this.props.mfd.interactionMode}
              errorHandler={(error: A380FmsError) =>
                this.props.atcService.showAtcErrorMessage(error.type, error.details)
              }
            />
            <Button
              label="NOTIFY"
              disabled={this.logonDisabled}
              onClick={() => this.notifyAtc()}
              buttonStyle="width: 160px; margin-left: 20px;"
            />
          </div>
          <div class="mfd-atccom-connect-row mfd-label">ACTIVE ATC: {this.current}</div>
          <div class="mfd-atccom-connect-row mfd-label">NEXT ATC: {this.next}</div>
          <div class="mfd-atccom-connect-row mfd-label">{this.requestStatus}</div>
          <div class="mfd-atccom-connect-row">
            <Button
              label="DISCONNECT ALL"
              disabled={this.logoffDisabled}
              onClick={() => this.props.atcService.logoff()}
              buttonStyle="width: 260px;"
            />
          </div>
        </div>
        <AtccomFooter bus={this.props.bus} mfd={this.props.mfd} atcService={this.props.atcService} />
      </>
    );
  }
}
