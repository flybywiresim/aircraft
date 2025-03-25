import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { WaypointFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
import { MessageVisualizationProps } from 'instruments/src/MFD/pages/ATCCOM/Messages/Registry';

export class RequestDirect extends DisplayComponent<MessageVisualizationProps> {
  render(): VNode {
    return (
      <div class="request-block request-block-stackable">
        <IconButton icon="trashbin" onClick={this.props.onDelete} disabled={Subject.create(false)} />

        <div class="request-block-body">
          <div class="request-block-line">
            <div class="mfd-label request-block-input-label" style="position:relative; left:-20px;">
              REQUEST DIR TO
            </div>
            <InputField<string>
              dataEntryFormat={new WaypointFormat()}
              mandatory={Subject.create(true)}
              value={Subject.create('')}
              containerStyle="width: 338px; position:relative; left:190px;"
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
