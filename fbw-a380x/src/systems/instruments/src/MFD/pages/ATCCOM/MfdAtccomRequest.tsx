// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { DclMessage } from '@datalink/common';
import { FmsData } from '@flybywiresim/fbw-sdk';
import { AtccomMfdPageProps } from '../../MFD';
import { Button } from '../../../MsfsAvionicsCommon/UiWidgets/Button';
import { InputField } from '../../../MsfsAvionicsCommon/UiWidgets/InputField';
import { A380FmsError } from '../../shared/A380FmsError';
import { ActivePageTitleBar } from '../common/ActivePageTitleBar';
import { AirportFormat, AtisCode, LongAlphanumericFormat, ShortAlphanumericFormat } from '../common/DataEntryFormats';
import { AtccomFooter } from './MfdAtccomFooter';

import './MfdAtccomRequest.scss';

interface MfdAtccomRequestProps extends AtccomMfdPageProps {
  callsign: Subscribable<string | null>;
}

export class MfdAtccomRequest extends DisplayComponent<MfdAtccomRequestProps> {
  private readonly callsign = Subject.create('');
  private readonly origin = Subject.create('');
  private readonly destination = Subject.create('');
  private readonly gate = Subject.create('');
  private readonly atis = Subject.create('');
  private readonly freeText = Subject.create('');
  private readonly transferred = Subject.create(false);
  private readonly status = Subject.create('');
  private readonly subscriptions: Subscription[] = [];

  private readonly canTransfer = MappedSubject.create(
    ([callsign, origin, destination, transferred]) =>
      !transferred &&
      /^[A-Z0-9]{2,10}$/i.test(callsign) &&
      /^[A-Z]{4}$/i.test(origin) &&
      /^[A-Z]{4}$/i.test(destination),
    this.callsign,
    this.origin,
    this.destination,
    this.transferred,
  );

  private readonly transferDisabled = this.canTransfer.map((canTransfer) => !canTransfer);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const fms = this.props.bus.getSubscriber<FmsData>();
    this.subscriptions.push(
      this.props.callsign.sub((callsign) => {
        if (callsign && !this.callsign.get()) this.callsign.set(callsign);
      }, true),
      fms.on('fmsOrigin').handle((origin) => {
        if (!this.origin.get() && origin) this.origin.set(origin);
      }),
      fms.on('fmsDestination').handle((destination) => {
        if (!this.destination.get() && destination) this.destination.set(destination);
      }),
    );
    for (const field of [this.callsign, this.origin, this.destination, this.gate, this.atis, this.freeText]) {
      this.subscriptions.push(
        field.sub(() => {
          this.transferred.set(false);
          this.status.set('');
        }),
      );
    }
  }

  private transferToMailbox(): void {
    if (!this.canTransfer.get()) return;
    const message = new DclMessage();
    message.Callsign = this.callsign.get().toUpperCase();
    message.Origin = this.origin.get().toUpperCase();
    message.Destination = this.destination.get().toUpperCase();
    message.Station = message.Origin;
    message.AcType = 'A388';
    message.Gate = this.gate.get().toUpperCase();
    message.Atis = this.atis.get().toUpperCase();
    message.Freetext = this.freeText.get() ? [this.freeText.get()] : [];
    this.props.atcService.registerMessages([message]);
    this.transferred.set(true);
    this.status.set('TRANSFERRED TO MAILBOX');
  }

  public destroy(): void {
    this.subscriptions.forEach((subscription) => subscription.destroy());
    this.canTransfer.destroy();
    this.transferDisabled.destroy();
    super.destroy();
  }

  public render(): VNode {
    const inputProps = {
      hEventConsumer: this.props.mfd.hEventConsumer,
      interactionMode: this.props.mfd.interactionMode,
      containerStyle: 'width: 180px;',
      alignText: 'center' as const,
      errorHandler: (error: A380FmsError) => this.props.atcService.showAtcErrorMessage(error.type, error.details),
    };
    return (
      <>
        <ActivePageTitleBar activePage={Subject.create('REQUEST')} offset={Subject.create('')} />
        <div class="mfd-page-container">
          <div class="mfd-atccom-dcl-form">
            <div class="mfd-atccom-dcl-title">DEPARTURE CLEARANCE</div>
            <div class="mfd-atccom-dcl-row">
              <span>CALLSIGN</span>
              <InputField<string>
                dataEntryFormat={new LongAlphanumericFormat()}
                value={this.callsign}
                {...inputProps}
              />
            </div>
            <div class="mfd-atccom-dcl-row">
              <span>DEPARTURE ARPT</span>
              <InputField<string> dataEntryFormat={new AirportFormat()} value={this.origin} {...inputProps} />
            </div>
            <div class="mfd-atccom-dcl-row">
              <span>DESTINATION</span>
              <InputField<string> dataEntryFormat={new AirportFormat()} value={this.destination} {...inputProps} />
            </div>
            <div class="mfd-atccom-dcl-row">
              <span>GATE</span>
              <InputField<string> dataEntryFormat={new ShortAlphanumericFormat()} value={this.gate} {...inputProps} />
            </div>
            <div class="mfd-atccom-dcl-row">
              <span>D-ATIS CODE</span>
              <InputField<string> dataEntryFormat={new AtisCode()} value={this.atis} {...inputProps} />
            </div>
            <div class="mfd-atccom-dcl-row">
              <span>FREE TEXT</span>
              <InputField<string>
                dataEntryFormat={new LongAlphanumericFormat()}
                value={this.freeText}
                {...inputProps}
              />
            </div>
            <div class="mfd-atccom-dcl-status">{this.status}</div>
          </div>
          <div class="mfd-atccom-request-footer">
            <Button
              label="CLEAR"
              onClick={() => {
                this.callsign.set('');
                this.origin.set('');
                this.destination.set('');
                this.gate.set('');
                this.atis.set('');
                this.freeText.set('');
                this.transferred.set(false);
                this.status.set('');
              }}
              buttonStyle="width: 190px; height: 64px;"
            />
            <Button
              label={
                <span>
                  XFR TO
                  <br />
                  MAILBOX
                </span>
              }
              disabled={this.transferDisabled}
              onClick={() => this.transferToMailbox()}
              buttonStyle="width: 190px; height: 64px;"
            />
          </div>
        </div>
        <AtccomFooter bus={this.props.bus} mfd={this.props.mfd} atcService={this.props.atcService} />
      </>
    );
  }
}
