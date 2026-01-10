import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdAtccomMsgRecord.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { MessageElementMonitored } from 'instruments/src/MFD/pages/ATCCOM/Elements/MessageElementMonitored';
import { MessageRecordNav } from 'instruments/src/MFD/pages/ATCCOM/Elements/MessageRecordNav';

interface MfdAtccomMsgRecordMonitoredProps extends AbstractMfdPageProps {}

export class MfdAtccomMsgRecordMonitored extends DisplayComponent<MfdAtccomMsgRecordMonitoredProps> {
  protected onNewData() {}

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <>
        <ActivePageTitleBar activePage={Subject.create('MSG RECORD/MONITORED MSG')} offset={Subject.create('')} />
        {/* begin page content */}
        <div class="mfd-page-container">
          <div style="display:flex; flex: 1 1 auto; width:100%">
            <div id="msg-record-list">
              <MessageElementMonitored
                msgTime="1320Z"
                msgOriginDest="LFDG"
                msgStatus="WILCO"
                msgBody='AT <span class="msg-highlight-magenta">1400Z</span> CLB TO <span class="msg-highlight-cyan">FL350</span>'
                onClick={() => {
                  this.props.mfd.uiService.navigateTo('atccom/msg-record/all-msg-expand');
                }}
              />
              <MessageElementMonitored
                msgTime="1320Z"
                msgOriginDest="LFDG"
                msgStatus="WILCO"
                msgBody='AT <span class="msg-highlight-magenta">AAA/180&deg;/512KILOMETER</span> O'
                onClick={() => {
                  this.props.mfd.uiService.navigateTo('atccom/msg-record/all-msg-expand');
                }}
              />
              <div style="flex-grow: 1;" />
              {/* fill space vertically */}
            </div>
            <div id="msg-record-scrollbar"></div>
            <MessageRecordNav />
          </div>
          <div class="mfd-atccom-msg-record-footer"></div>
        </div>
        <div
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
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
