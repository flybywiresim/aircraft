// @ts-strict-ignore
// Copyright (c) 2025-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ArraySubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { AtccomMfdPageProps } from 'instruments/src/MFD/MFD';

import { AirportFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Button, ButtonMenuItem } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { DropdownMenu } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/DropdownMenu';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { NewAtisIcon } from 'instruments/src/MFD/pages/ATCCOM/Elements/NewAtisIcon';
import { AutoUpdateIcon } from 'instruments/src/MFD/pages/ATCCOM/Elements/AutoUpdateIcon';
import { AutoPrintIcon } from 'instruments/src/MFD/pages/ATCCOM/Elements/AutoPrintIcon';
import { AirportAtis } from '../../ATCCOM/AtcDatalinkSystem';
import { AtisMessage, AtisType } from '@datalink/common';
import { AtcDatalinkMessages } from '../../ATCCOM/AtcDatalinkPublisher';

interface DAtisBlockProps extends AtccomMfdPageProps {
  readonly index: number;
  data: AirportAtis;
  atisType?: '' | 'ARR' | 'DEP';
  isAutoUpdateEnabled?: Subscribable<boolean>;
  isAutoPrintEnabled?: Subscribable<boolean>;
}

export class DAtisBlock extends DisplayComponent<DAtisBlockProps> {
  private readonly subs = [] as Subscription[];

  private readonly subscriber = this.props.bus.getSubscriber<AtcDatalinkMessages>();

  private readonly dropdownMenuRef = FSComponent.createRef<DropdownMenu>();

  private readonly datalink = this.props.atcService;

  private readonly atisIcao = Subject.create<string>(this.props.data.icao);

  private readonly atisType = Subject.create<number | null>(this.props.data.type);

  private readonly atisMessage = Subject.create<string>(null);

  private readonly atisCode = Subject.create<string>(null);

  private readonly isAtisNew = Subject.create<boolean>(false);

  private readonly isAutoUpdate = Subject.create<boolean>(false);

  private readonly atisTimestamp = Subject.create<string>(null);

  private readonly messageStatusLabel = Subject.create<string>(null);

  private static readonly datisBlocklineLengths: number[] = [44, 44, 44, 44, 29];

  private readonly isIcaoEmpty = this.atisIcao.map((icao) => {
    return icao == null || icao == '----';
  });

  private readonly messageStatusSpan = this.messageStatusLabel.map((s) => <>{s}</>);

  private readonly isAutoUpdateNotAllowed = MappedSubject.create(
    ([atisType, isIcaoEmpty]) => {
      return atisType === AtisType.Departure || isIcaoEmpty;
    },
    this.atisType,
    this.isIcaoEmpty,
  );

  private truncateAtis(string: string): string {
    if (string.length === 0) return '';
    const messageArray: string[] = ['', '', '', '', ''];
    const words: string[] = string.split(' ');
    let wordIndex: number = 0;
    messageArray.forEach((value, index) => {
      while (
        wordIndex < words.length &&
        messageArray[index].length + words[wordIndex].length <= DAtisBlock.datisBlocklineLengths[index] - 1
      ) {
        if (messageArray[index].length !== 0) {
          messageArray[index] += ' ';
        }
        messageArray[index] += words[wordIndex];
        wordIndex++;
      }
    });

    if (wordIndex === words.length) {
      return messageArray.join(' ');
    } else {
      // add ellipses for truncated message
      return messageArray.join(' ') + '  ......';
    }
  }

  private readonly readMoreVisible = this.atisMessage.map((message) => message !== null);

  private readonly dropdownMenuVisible = MappedSubject.create(
    ([messageStatus, atisMessage]) => {
      if (messageStatus === null && atisMessage === null) {
        return true;
      }
      return false;
    },
    this.messageStatusLabel,
    this.atisMessage,
  );

  private readonly combinedMenuVisible = this.dropdownMenuVisible.map(SubscribableMapFunctions.not());

  private readonly statusButtonVisible = this.messageStatusLabel.map((status) => status != null && status.length !== 0);

  private updateAtisData(airportIcao: string): void {
    const atisReport: AtisMessage = this.datalink.atisReports(airportIcao)[0];
    if (atisReport === undefined) return;
    if (atisReport.Information) {
      this.atisCode.set(atisReport.Information);
    }
    if (atisReport.Timestamp) {
      this.atisTimestamp.set(atisReport.Timestamp.mailboxTimestamp());
    }
    if (atisReport.Reports[0].report) {
      this.atisMessage.set(this.truncateAtis(atisReport.Reports[0].report).toUpperCase());
    }
  }

  public toggleAtisAutoUpdate(icao: string): void {
    if (this.datalink.atisAutoUpdateActive(icao)) {
      // could check FCOM if some error handling could be added
      this.datalink.deactivateAtisAutoUpdate(this.props.index).then(() => {});
    } else {
      // could check FCOM if some error handling could be added
      this.datalink.activateAtisAutoUpdate(this.props.index).then(() => {});
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.data.icao !== null) {
      this.updateAtisData(this.props.data.icao);
      this.messageStatusLabel.set(null);
    }

    this.atisIcao.sub((value) => {
      this.props.data.icao = value;
      this.datalink.setAtisAirport(this.props.data, this.props.index);

      // clear existing data
      this.atisCode.set(null);
      this.atisTimestamp.set(null);
      this.atisMessage.set(null);
      this.messageStatusLabel.set(null);
    });

    this.atisType.sub((value) => {
      if (value !== null) {
        this.props.data.type = value;
        this.datalink.setAtisAirport(this.props.data, this.props.index);
      }
    });

    this.atisCode.sub((value) => {
      if (this.props.data.lastReadAtis !== value && value !== null) {
        this.isAtisNew.set(true);
      } else {
        this.isAtisNew.set(false);
      }
    });

    this.subs.push(
      this.subscriber.on(`atcAtis_${this.props.index}`).handle((atisData) => {
        this.atisIcao.set(atisData.icao);
        this.isAutoUpdate.set(atisData.autoupdate);
        this.updateAtisData(atisData.icao);
        this.messageStatusLabel.set(atisData.status);
      }),
    );

    this.subs.push(
      this.isIcaoEmpty,
      this.readMoreVisible,
      this.dropdownMenuVisible,
      this.combinedMenuVisible,
      this.statusButtonVisible,
      this.messageStatusSpan,
      this.isAutoUpdateNotAllowed,
    );
  }

  destroy(): void {
    for (const s of this.subs) {
      s.destroy();
    }
  }

  render(): VNode {
    return (
      <div class="mfd-atccom-datis-block">
        <div class="mfd-atccom-datis-block-header-row">
          <InputField<string>
            dataEntryFormat={new AirportFormat()}
            mandatory={Subject.create(false)}
            value={this.atisIcao}
            containerStyle="width: 106px; margin-left: 5px; position: absolute; top: 12px; height:40px"
            alignText="center"
            errorHandler={(e) => this.props.atcService.showAtcErrorMessage(e)}
            hEventConsumer={this.props.mfd.hEventConsumer}
            interactionMode={this.props.mfd.interactionMode}
          />
          <DropdownMenu
            ref={this.dropdownMenuRef}
            idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_atisTypeList_${this.props.index}`}
            selectedIndex={this.atisType}
            values={ArraySubject.create<string>(['DEP', 'ARR'])}
            freeTextAllowed={false}
            containerStyle="width: 106px; top: 5px; left: 115px;"
            alignLabels="flex-start"
            numberOfDigitsForInputField={3}
            tmpyActive={Subject.create(false)}
            hEventConsumer={this.props.mfd.hEventConsumer}
            interactionMode={this.props.mfd.interactionMode}
          />
          <div class="mfd-label atis-version">
            <span>{this.atisCode}</span>
          </div>
          <div class="mfd-label atis-time">
            <span>{this.atisTimestamp}</span>
          </div>
          <NewAtisIcon visible={this.isAtisNew} />
          <AutoUpdateIcon visible={this.isAutoUpdate} />
          <AutoPrintIcon visible={Subject.create(false)} />
          <div>
            {/* FSM Status Message Button */}
            <Button
              label={this.messageStatusSpan}
              disabled={Subject.create(false)}
              onClick={() => {}}
              visible={this.statusButtonVisible}
              highlighted={Subject.create(true)}
              buttonStyle="width: 131px; padding-top: 3px; padding-bottom: 3px; height: 54px;"
              containerStyle="position: absolute; left: 469px; top: 7px;"
            />
            <Button
              label="UPDATE<br/>OR PRINT"
              disabled={Subject.create(false)}
              onClick={() => {}}
              visible={this.combinedMenuVisible}
              buttonStyle="width: 159px; padding-left: 5px; padding-top: 3px; padding-bottom: 3px;"
              containerStyle="position: absolute; left: 600px; top: 7px;"
              idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_datisblock_btn_${this.props.index}`}
              dropdownMenuRightAligned={true}
              menuItems={Subject.create<ButtonMenuItem[]>([
                {
                  label: 'UPDATE',
                  disabled: this.isIcaoEmpty,
                  action: () => {
                    this.datalink.requestAtis(this.props.index);
                  },
                },
                {
                  label: 'AUTO UPDATE',
                  disabled: this.isAutoUpdateNotAllowed,
                  action: () => {
                    this.toggleAtisAutoUpdate(this.atisIcao.get());
                  },
                },
                { label: 'PRINT', disabled: true, action: () => {} },
                { label: 'AUTO PRINT', disabled: true, action: () => {} },
              ])}
            />
          </div>
          <div>
            <Button
              label="SEND<br/>REQUEST"
              disabled={this.isIcaoEmpty}
              onClick={() => {
                this.datalink.requestAtis(this.props.index);
              }}
              visible={this.dropdownMenuVisible}
              buttonStyle="width: 159px; padding-left: 5px; padding-top: 3px; padding-bottom: 3px;"
              containerStyle="position: absolute; left: 600px; top: 7px;"
            />
            <Button
              label="AUTO<br/>UPDATE"
              disabled={this.isAutoUpdateNotAllowed}
              onClick={() => {
                this.toggleAtisAutoUpdate(this.atisIcao.get());
              }}
              visible={this.dropdownMenuVisible}
              buttonStyle="width: 159px; padding-left: 5px; padding-top: 3px; padding-bottom: 3px;"
              containerStyle="position: absolute; left: 600px; top: 61px;"
            />
          </div>
        </div>
        <div class="mfd-atccom-datis-block-msgarea">{this.atisMessage}</div>
        <div>
          <Button
            label=">>>"
            disabled={Subject.create(false)}
            visible={this.readMoreVisible}
            onClick={() => {
              this.props.data.lastReadAtis = this.atisCode.get();
              this.props.mfd.uiService.navigateTo('atccom/d-atis/received/' + this.props.index);
            }}
            buttonStyle="width: 61px; height:33px; padding-left: 16px; position: absolute; right: 55px; top: 213px;"
            containerStyle="position: absolute; top: 0px; width: 100%;"
          />
        </div>
      </div>
    );
  }
}
