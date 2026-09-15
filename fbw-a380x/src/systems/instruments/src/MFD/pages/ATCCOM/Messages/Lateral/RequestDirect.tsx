import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { InputField } from '../../../../../MsfsAvionicsCommon/UiWidgets/InputField';
import { WaypointFormat } from '../../../common/DataEntryFormats';
import { IconButton } from '../../../../../MsfsAvionicsCommon/UiWidgets/IconButton';
import { MessageVisualizationProps } from '../Registry';

export class RequestDirect extends DisplayComponent<MessageVisualizationProps> {
  render(): VNode {
    return (
      <div class="request-block request-block-stackable">
        <IconButton icon="trashbin" onClick={this.props.onDelete} disabled={Subject.create(false)} />

        <div class="request-block-body">
          <div class="request-block-line">
            <div class="mfd-label request-block-input-label" style="position:relative;">
              REQUEST DIR TO
            </div>
          </div>
          <div class="request-block-line">
            <InputField<string>
              dataEntryFormat={new WaypointFormat()}
              mandatory={Subject.create(true)}
              value={Subject.create('')}
              containerStyle="width: 353px; position:relative; left:200px;"
              alignText="center"
              errorHandler={(e) => this.props.atcService.showAtcErrorMessage(e.type, e.details)}
              hEventConsumer={this.props.mfd.hEventConsumer}
              interactionMode={this.props.mfd.interactionMode}
            />
          </div>
          <div class="request-block-line"></div>
        </div>
      </div>
    );
  }
}
