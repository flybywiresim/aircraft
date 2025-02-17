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

export class RequestDepartureClearance extends DisplayComponent<MessageVisualizationProps> {
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
              value={Subject.create('')}
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
              value={Subject.create('')}
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
              value={Subject.create('')}
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
              value={Subject.create('A388')}
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
              value={Subject.create('')}
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
                value={Subject.create('')}
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
