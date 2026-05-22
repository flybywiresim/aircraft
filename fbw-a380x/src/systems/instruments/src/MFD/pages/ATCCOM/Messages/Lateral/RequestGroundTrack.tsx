import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { InputField } from '../../../../../MsfsAvionicsCommon/UiWidgets/InputField';
import { HeadingFormat } from '../../../common/DataEntryFormats';
import { IconButton } from '../../../../../MsfsAvionicsCommon/UiWidgets/IconButton';
import { MessageVisualizationProps } from '../Registry';

export class RequestGroundTrack extends DisplayComponent<MessageVisualizationProps> {
  render(): VNode {
    return (
      <div class="request-block request-block-stackable">
        <IconButton icon="trashbin" onClick={this.props.onDelete} disabled={Subject.create(false)} />

        <div class="request-block-body">
          <div class="request-block-line">
            <div class="mfd-label request-block-input-label" style="position:relative;">
              REQUEST GROUND TRACK
            </div>
            <InputField<number>
              dataEntryFormat={new HeadingFormat()}
              mandatory={Subject.create(true)}
              value={Subject.create(null)}
              containerStyle="width: 150px; position:relative;"
              alignText="center"
              errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
              hEventConsumer={this.props.mfd.hEventConsumer}
              interactionMode={this.props.mfd.interactionMode}
            />
          </div>
          <div class="request-block-line"></div>
          <div class="request-block-line"></div>
        </div>
      </div>
    );
  }
}
