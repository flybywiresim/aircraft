import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdAtccomMsgRecord.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { MessageElement } from 'instruments/src/MFD/pages/ATCCOM/Elements/MessageElement';

interface MfdAtccomMsgRecordAllProps extends AbstractMfdPageProps {}

export class MfdAtccomMsgRecordAll extends DisplayComponent<MfdAtccomMsgRecordAllProps> {
  protected onNewData() {}

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <>
        <ActivePageTitleBar
          activePage={Subject.create('MSG RECORD/ALL MSG')}
          offset={Subject.create('')}
          eoIsActive={Subject.create(false)}
          tmpyIsActive={Subject.create(false)}
        />
        {/* begin page content */}
        <div class="mfd-page-container">
          <div style="display:flex; flex: 1 1 auto; width:100%">
            <div id="msg-record-list">
              <MessageElement
                msgTime="1323Z"
                msgOriginDest="LFBO"
                msgStatus="UNABLE"
                msgBody="MAINTAIN M.77"
                onClick={() => {
                  this.props.mfd.uiService.navigateTo('atccom/msg-record/all-msg-expand');
                }}
              />
              <MessageElement
                msgTime="1320Z"
                msgOriginDest="LFDG"
                msgStatus="WILCO"
                msgBody='AT <span class="msg-highlight-magenta">1400Z</span> CLB TO FL350'
                onClick={() => {
                  this.props.mfd.uiService.navigateTo('atccom/msg-record/all-msg-expand');
                }}
              />
              <MessageElement
                msgTime="1319Z"
                msgOriginDest="LFDG"
                msgStatus="WILCO"
                msgBody='AT <span class="msg-highlight-magenta">AAA/180&deg;/512KILOMETER</span> OFFSET 64NM LEFT OF ROUTE'
                onClick={() => {
                  this.props.mfd.uiService.navigateTo('atccom/msg-record/all-msg-expand');
                }}
              />
              <div style="flex-grow: 1;" />
              {/* fill space vertically */}
            </div>
            <div id="msg-record-scrollbar"></div>
            <div id="msg-record-nav">
              <IconButton icon={'double-up'} containerStyle="width:42px; height:42px;" />
              <IconButton icon={'single-up'} containerStyle="width:42px; height:42px; padding:8px;" />
              <IconButton icon={'single-down'} containerStyle="width:42px; height:42px; padding:8px;" />
              <IconButton icon={'double-down'} containerStyle="width:42px; height:42px;" />
            </div>
          </div>
          <div class="mfd-atccom-msg-record-footer">
            <div>
              <Button
                label="ERASE ALL"
                disabled={Subject.create(false)}
                onClick={() => {}}
                buttonStyle="width: 190px; height:64px;"
              />
            </div>
            <div style="position:absolute; top: 0px; right:0px">
              <Button
                label="PRINT"
                disabled={Subject.create(false)}
                onClick={() => {}}
                buttonStyle="width: 190px; height:64px;"
              />
            </div>
          </div>
        </div>
        {/* <div
          id="atccom-inop"
          style="
    position: absolute;
    top: 132px;
    width: 768px;
    height: 818px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 35px;
    background-color: rgba(0, 0, 0, 0.7);
    color: #e68000"
        >
          <span>NOT YET IMPLEMENTED</span>
        </div> */}
        <div style="position: absolute; top: 36px; opacity: 0.3; visibility: hidden;">
          <img src="/Images/fbw-a380x/msg-record-all-msg.png" alt="" />
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
