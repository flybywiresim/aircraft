// @ts-strict-ignore
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
import { AtisMessage, AtisType, AtsuStatusCodes } from '@datalink/common';
import { ATCCOMMessages } from '../../shared/NXSystemMessages';

interface DAtisBlockProps extends AtccomMfdPageProps {
  readonly index: 0 | 1 | 2;
  data: AirportAtis;
  atisType?: '' | 'ARR' | 'DEP';
  isAutoUpdateEnabled?: Subscribable<boolean>;
  isAutoPrintEnabled?: Subscribable<boolean>;
}

enum AtisStatus {
  EMPTY,
  SENT,
  RECEIVED,
}

const PredefinedMessages = {
  sending: 'SENDING',
  sent: 'SENT',
  useVoice: 'USE<br/>VOICE',
  sendFailed: 'SEND<br/>FAILED',
  noReply: 'NO REPLY',
  noAutoUpdate: 'NO AUTO<br/>UPDATE',
  endOfUpdate: 'END OF<br/>UPDATE',
  atisXRejected: 'ATIS X<br/>REJECTED',
  gndSysMsg: 'GND SYS<br/>MSG >>>',
};

// MESSAGES
// D-ATIS RECEIVED
// D-ATIS GROUND MSG
// D-ATIS NO REPLY
// D-ATIS SEND FAIL
// CHECK FMS MESSAGE
// IND

export class DAtisBlock extends DisplayComponent<DAtisBlockProps> {
  private readonly subs = [] as Subscription[];

  private dropdownMenuRef = FSComponent.createRef<DropdownMenu>();

  private datalink = this.props.atcService;

  private readonly atisIcao = Subject.create<string>(this.props.data.icao);

  private readonly atisType = Subject.create<number | null>(this.props.data.type);

  private readonly atisMessage = Subject.create<string>('');

  private readonly atisCode = Subject.create<string>('');

  private isAtisNew = Subject.create<boolean>(false);

  private readonly atisTimestamp = Subject.create<string>('');

  private readonly atisStatus = Subject.create<AtisStatus>(AtisStatus.EMPTY);

  private readonly messageStatusLabel = Subject.create<string>('');

  private isIcaoEmpty = this.atisIcao.map((icao) => {
    if (icao !== '' && icao !== '----') return false;
    return true;
  });

  private requestAtis(airport: AirportAtis): void {
    if (airport.icao !== '' && !airport.requested) {
      airport.requested = true;

      this.messageStatusLabel.set(PredefinedMessages.sending);

      this.datalink.receiveAtcAtis(airport.icao, airport.type).then((response) => {
        if (response !== AtsuStatusCodes.Ok) {
          // log error
        }

        switch (response) {
          case AtsuStatusCodes.ComFailed:
            this.messageStatusLabel.set(PredefinedMessages.sendFailed);
            break;
          case AtsuStatusCodes.NoAtisReceived:
            this.messageStatusLabel.set(PredefinedMessages.noReply);
            this.datalink.addMessageToQueue(ATCCOMMessages.datisNoReply, undefined, undefined);
            break;
          case AtsuStatusCodes.NewAtisReceived:
            this.updateAtisData(airport.icao);
            this.atisStatus.set(AtisStatus.RECEIVED);
            this.messageStatusLabel.set('');
            this.datalink.addMessageToQueue(ATCCOMMessages.datisReceived, undefined, undefined);
        }
        airport.requested = false;
      });
    }
  }

  private truncateAtis(string: string): string {
    if (string.length === 0) return '';
    const lineLengths: number[] = [44, 44, 44, 44, 32];
    const messageArray: string[] = ['', '', '', '', ''];
    const words: string[] = string.split(' ');
    let wordIndex: number = 0;
    messageArray.forEach((value, index) => {
      while (
        wordIndex < words.length &&
        messageArray[index].length + words[wordIndex].length <= lineLengths[index] - 1
      ) {
        messageArray[index] += words[wordIndex];
        messageArray[index] += ' ';
        wordIndex++;
      }
    });

    if (wordIndex === words.length) {
      return messageArray.join('');
    } else {
      // add ellipses for truncated message
      return messageArray.join('') + ' ......';
    }
  }

  private readonly isAtisEmpty = MappedSubject.create(([status]) => {
    if (status === AtisStatus.EMPTY) {
      return true;
    }
    return false;
  }, this.atisStatus);

  private readonly showDropdownMenu = MappedSubject.create(
    ([status]) => {
      if (status === AtisStatus.EMPTY && this.messageStatusLabel.get() === '') {
        return true;
      }
      return false;
    },
    this.atisStatus,
    this.messageStatusLabel,
  );

  private readonly isStatusButtonVisible = MappedSubject.create(([status]) => {
    if (status !== '') {
      return true;
    }
    return false;
  }, this.messageStatusLabel);

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
      this.atisMessage.set(this.truncateAtis(atisReport.Reports[0].report));
    }
  }

  public toggleAtisAutoUpdate(icao: string): void {
    if (this.datalink.atisAutoUpdateActive(icao)) {
      // atis update is on
      this.datalink.deactivateAtisAutoUpdate(icao).then((status) => {
        // return status
        console.log(status);
      });
    } else {
      // atis update is off
      this.datalink.activateAtisAutoUpdate(icao, AtisType.Arrival).then((status) => {
        // return status
        console.log(status);
      });
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.data.icao !== '') {
      this.updateAtisData(this.props.data.icao);
      this.atisStatus.set(AtisStatus.RECEIVED);
      this.messageStatusLabel.set('');
    }

    this.subs.push(
      this.atisIcao.sub((value) => {
        this.props.data.icao = value;
        this.datalink.setAtisAirport(this.props.data, this.props.index);

        // clear existing data
        this.atisStatus.set(AtisStatus.EMPTY);
        this.atisCode.set('');
        this.atisTimestamp.set('');
        this.atisMessage.set('');
        this.messageStatusLabel.set('');
      }),
    );

    this.subs.push(
      this.atisType.sub((value) => {
        if (value !== null) {
          this.props.data.type = value;
          this.datalink.setAtisAirport(this.props.data, this.props.index);
        }
      }),
    );

    this.subs.push(
      this.atisCode.sub((value) => {
        if (this.props.data.lastReadAtis !== value && value !== '') {
          this.isAtisNew.set(true);
        } else {
          this.isAtisNew.set(false);
        }
      }),
    );
  }

  destroy(): void {}

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
          <AutoUpdateIcon visible={Subject.create(false)} />
          <AutoPrintIcon visible={Subject.create(false)} />
          <div>
            {/* FSM Status Message Button */}
            <Button
              label={this.messageStatusLabel.map((s) => (
                <>{s}</>
              ))}
              disabled={Subject.create(false)}
              onClick={() => {}}
              visible={this.isStatusButtonVisible}
              highlighted={Subject.create(true)}
              buttonStyle="width: 131px; padding-top: 3px; padding-bottom: 3px; height: 54px;"
              containerStyle="position: absolute; left: 469px; top: 7px;"
            />
            <Button
              label="UPDATE<br/>OR PRINT"
              disabled={Subject.create(false)}
              onClick={() => {}}
              visible={this.showDropdownMenu.map(SubscribableMapFunctions.not())}
              buttonStyle="width: 159px; padding-left: 5px; padding-top: 3px; padding-bottom: 3px;"
              containerStyle="position: absolute; left: 600px; top: 7px;"
              idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_datisblock_btn_${this.props.index}`}
              menuItems={Subject.create<ButtonMenuItem[]>([
                {
                  label: 'UPDATE',
                  action: () => {
                    this.requestAtis(this.props.data);
                  },
                },
                {
                  label: 'AUTO UPDATE',
                  disabled: true,
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
                this.requestAtis(this.props.data);
              }}
              visible={this.showDropdownMenu}
              buttonStyle="width: 159px; padding-left: 5px; padding-top: 3px; padding-bottom: 3px;"
              containerStyle="position: absolute; left: 600px; top: 7px;"
            />
            <Button
              label="AUTO<br/>UPDATE"
              disabled={this.isIcaoEmpty}
              onClick={() => {}}
              visible={this.showDropdownMenu}
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
            visible={this.isAtisEmpty.map(SubscribableMapFunctions.not())}
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
