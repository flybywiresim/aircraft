import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import {
  AircraftType,
  AirportFormat,
  AtisCode,
  ShortAlphanumericFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';

interface RequestDepartureClearanceProps extends AbstractMfdPageProps {}

export class RequestDepartureClearance extends DisplayComponent<RequestDepartureClearanceProps> {
  render(): VNode {
    return (
      <div class="request-block">
        <div class="request-block-header">
          <div class="left"></div>
          <div class="request-block-title">
            <span>DEPARTURE REQUEST</span>
          </div>
          <div class="right"></div>
        </div>

        <IconButton
          icon="trashbin"
          onClick={() => {}}
          disabled={Subject.create(true)}
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
              value={Subject.create('WSSS')}
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
              value={Subject.create('A2')}
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
              value={Subject.create('H')}
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
              value={Subject.create('WMKK')}
              containerStyle="width: 120px; margin-right: 5px;"
              alignText="center"
              errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
              hEventConsumer={this.props.mfd.hEventConsumer}
              interactionMode={this.props.mfd.interactionMode}
            />
          </div>
          <div></div>
          <div class="request-block-line" style="justify-content: center;">
            <span>{'(NO NOTIFICATION REQUIRED)'}</span>
          </div>
        </div>
      </div>
    );
  }
}
