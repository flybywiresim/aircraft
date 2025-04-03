import { ComponentProps, DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';

interface MessageElementMonitoredProps extends ComponentProps {
  msgTime?: string;
  msgOriginDest?: string;
  msgStatus: string;
  msgBody?: string;
  onClick?: () => void;
}

export class MessageElementMonitored extends DisplayComponent<MessageElementMonitoredProps> {
  private divRef = FSComponent.createRef<HTMLDivElement>();

  private onClick() {
    if (this.props.onClick !== undefined) {
      this.props.onClick();
    }
  }

  private onClickHandler = this.onClick.bind(this);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.divRef.instance.addEventListener('click', this.onClickHandler);
  }

  render(): VNode {
    return (
      <div ref={this.divRef} class="msg-record-msg-element monitored-msg mfd-label green">
        <div>
          <span class="msg-time">{this.props.msgTime}</span>
          <span class="msg-origin-dest">FROM {this.props.msgOriginDest}</span>
          <span class="msg-status">{this.props.msgStatus}</span>
        </div>

        <div style="position:absolute; top:19px; right:10px">
          <Button
            label={'CANCEL<br />MONITORING'}
            onClick={() => {}}
            buttonStyle="height: 55px; width: 160px; line-height: 22px"
          />
        </div>

        <div class="msg-body">{this.props.msgBody}</div>
        <div>
          <span class="msg-expand-button">&gt;&gt;&gt;</span>
        </div>
      </div>
    );
  }
}
