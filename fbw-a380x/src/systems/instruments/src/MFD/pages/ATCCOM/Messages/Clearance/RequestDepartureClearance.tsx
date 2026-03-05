import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import {
  AircraftType,
  AirportFormat,
  AtisCode,
  LongAlphanumericFormat,
  ShortAlphanumericFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
import { MessageVisualizationProps } from 'instruments/src/MFD/pages/ATCCOM/Messages/Registry';

interface CPDLCDataBlock {
  from: string;
  to: string;
}

export interface RequestDepDataBlock extends CPDLCDataBlock {
  firstCall: boolean;
  callsign: string;
  station: string;
  stationManual: boolean;
  atis: string;
  gate: string;
  actype: string;
  freetext: string[];
}

export class RequestDepartureClearance extends DisplayComponent<MessageVisualizationProps> {
  private CreateDataBlock() {
    return {
      firstCall: true,
      callsign: 'FBW123',
      station: '',
      stationManual: false,
      from: '',
      to: '',
      atis: '',
      gate: '',
      actype: 'A388',
      freetext: ['', '', '', '', '', ''],
    };
  }

  private readonly originAirport = Subject.create<string>('');
  private readonly gate = Subject.create<string>('');
  private readonly atisCode = Subject.create<string>('');
  private readonly aircraftType = Subject.create<string>('A388');
  private readonly destAirport = Subject.create<string>('');
  private readonly freeText = Subject.create<string>('');

  private dataBlock = this.CreateDataBlock();

  private CanSendData(store: RequestDepDataBlock): boolean {
    return store.callsign !== '' && store.station !== '' && store.from !== '' && store.to !== '' && store.atis !== '';
  }

  private updateHandler(): void {
    if (this.CanSendData(this.dataBlock)) {
      this.props.messageElements.removeAt(this.props.index);
      this.props.messageElements.insert(
        {
          id: this.props.index,
          message: this.dataBlock,
          readyToSend: true,
        },
        this.props.index,
      );
    } else {
      this.props.messageElements.removeAt(this.props.index);
      this.props.messageElements.insert(
        {
          id: this.props.index,
          message: this.dataBlock,
          readyToSend: false,
        },
        this.props.index,
      );
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.originAirport.sub((value) => {
      this.dataBlock.from = value;
      this.dataBlock.station = value;
      this.updateHandler();
    });

    this.gate.sub((value) => {
      this.dataBlock.gate = value;
      this.updateHandler();
    });

    this.atisCode.sub((value) => {
      this.dataBlock.atis = value;
      this.updateHandler();
    });

    this.aircraftType.sub((value) => {
      this.dataBlock.actype = value;
      this.updateHandler();
    });

    this.destAirport.sub((value) => {
      this.dataBlock.to = value;
      this.updateHandler();
    });

    this.freeText.sub((value) => {
      this.dataBlock.freetext[0] = value;
      this.updateHandler();
    }); // TODO: check how A380 formatting works
  }

  render(): VNode {
    return (
      <div class="request-block request-block-single">
        <div class="request-block-header">
          <div class="left"></div>
          <div class="request-block-title">
            <span>DEPARTURE REQUEST</span>
          </div>
          <div class="right"></div>
        </div>

        <IconButton
          icon="trashbin"
          onClick={this.props.onDelete}
          disabled={Subject.create(false)}
          containerStyle="width: 40px; height: 40px; position: absolute; top: -15px; right: -15px;"
        />

        <div class="request-block-body">
          <div class="request-block-line">
            <span>REQUEST WILL BE SENT TO</span>
          </div>
          <div class="request-block-line">
            <div class="mfd-label request-block-input-label">DEPARTURE ARPT</div>
            <InputField<string>
              dataEntryFormat={new AirportFormat()}
              value={this.originAirport}
              containerStyle="width: 120px; margin-right: 5px;"
              alignText="center"
              errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
              hEventConsumer={this.props.mfd.hEventConsumer}
              interactionMode={this.props.mfd.interactionMode}
            />
          </div>
          <div class="request-block-line">
            <div class="mfd-label request-block-input-label">GATE</div>
            <InputField<string>
              dataEntryFormat={new ShortAlphanumericFormat()}
              value={this.gate}
              containerStyle="width: 120px; margin-right: 5px;"
              alignText="center"
              errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
              hEventConsumer={this.props.mfd.hEventConsumer}
              interactionMode={this.props.mfd.interactionMode}
            />
          </div>
          <div class="request-block-line">
            <div class="mfd-label request-block-input-label">D-ATIS CODE</div>
            <InputField<string>
              dataEntryFormat={new AtisCode()}
              value={this.atisCode}
              containerStyle="width: 120px; margin-right: 5px;"
              alignText="center"
              errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
              hEventConsumer={this.props.mfd.hEventConsumer}
              interactionMode={this.props.mfd.interactionMode}
            />
          </div>
          <br />
          <div class="request-block-line">
            <div class="mfd-label request-block-input-label">ACFT TYPE</div>
            <InputField<string>
              dataEntryFormat={new AircraftType()}
              value={this.aircraftType}
              containerStyle="width: 120px; margin-right: 5px;"
              alignText="center"
              errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
              hEventConsumer={this.props.mfd.hEventConsumer}
              interactionMode={this.props.mfd.interactionMode}
            />
          </div>
          <br />
          <div class="request-block-line">
            <div class="mfd-label request-block-input-label">DESTINATION</div>
            <InputField<string>
              dataEntryFormat={new AirportFormat()}
              value={this.destAirport}
              containerStyle="width: 120px; margin-right: 5px;"
              alignText="center"
              errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
              hEventConsumer={this.props.mfd.hEventConsumer}
              interactionMode={this.props.mfd.interactionMode}
            />
          </div>
          <div class="request-textbox-container">
            <div class="request-textbox-textarea">
              <InputField<string>
                dataEntryFormat={new LongAlphanumericFormat()}
                value={this.freeText}
                containerStyle="width: 100%;"
                alignText="flex-start"
                // errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
                canOverflow={true}
              />
            </div>
            <div class="request-textbox-nav">
              <IconButton
                icon="ecl-single-up"
                onClick={() => {}}
                disabled={Subject.create(true)}
                containerStyle="width: 40px; height: 40px;"
              />
              <IconButton
                icon="ecl-single-down"
                onClick={() => {}}
                disabled={Subject.create(true)}
                containerStyle="width: 40px; height: 40px;"
              />
            </div>
          </div>
          <div class="request-block-line" style="justify-content: center;">
            <span>{'(NO NOTIFICATION REQUIRED)'}</span>
          </div>
        </div>
      </div>
    );
  }
}
