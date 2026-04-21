import { ComponentProps, DisplayComponent, FSComponent, VNode } from '@microsoft/msfs-sdk';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';

interface MessageRecordNavProps extends ComponentProps {}

export class MessageRecordNav extends DisplayComponent<MessageRecordNavProps> {
  render(): VNode {
    return (
      <div id="msg-record-nav">
        <IconButton icon={'double-up'} containerStyle="width:42px; height:42px; padding:6px;" />
        <IconButton icon={'single-up'} containerStyle="width:42px; height:42px; padding:10px;" />
        <IconButton icon={'single-down'} containerStyle="width:42px; height:42px; padding:10px;" />
        <IconButton icon={'double-down'} containerStyle="width:42px; height:42px; padding:6px;" />
      </div>
    );
  }
}
