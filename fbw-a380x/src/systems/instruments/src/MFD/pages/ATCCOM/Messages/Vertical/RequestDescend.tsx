import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import {
  AirportFormat,
  LongAlphanumericFormat,
  ShortAlphanumericFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { MessageVisualizationProps } from 'instruments/src/MFD/pages/ATCCOM/Messages/Registry';

export class RequestDescend extends DisplayComponent<MessageVisualizationProps> {
  render(): VNode {
    return (
      <div class="request-block">
        <IconButton
          icon="trashbin"
          onClick={this.props.onDelete}
          disabled={Subject.create(false)}
          containerStyle="width: 40px; height: 40px; position: absolute; top: -15px; right: -15px;"
        />

        <div class="request-block-body">
          <div class="request-block-line">
            <div class="mfd-label request-block-input-label">REQUEST DES TO</div>
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
            <div class="mfd-label request-block-input-label">AT</div>
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
        </div>
      </div>
    );
  }
}
