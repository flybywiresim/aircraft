import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdAtccomMsgRecord.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { Button } from 'instruments/src/MFD/pages/common/Button';

interface MfdAtccomMsgRecordProps extends AbstractMfdPageProps {}

export class MfdAtccomMsgRecord extends DisplayComponent<MfdAtccomMsgRecordProps> {
  protected onNewData() {}

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <>
        <ActivePageTitleBar
          activePage={Subject.create('MSG RECORD')}
          offset={Subject.create('')}
          eoIsActive={Subject.create(false)}
          tmpyIsActive={Subject.create(false)}
        />
        {/* begin page content */}
        <div class="mfd-page-container" style="position:relative; width:100%">
          <div style="position:absolute; top:90px; width:100%; height:275px; border-top: 1px solid #fff; border-bottom: 1px solid #fff">
            <div style="position:absolute; top:50px; left:65px;">
              <Button
                label="ALL MSG"
                buttonStyle="width:205px; height:64px"
                onClick={() => {
                  this.props.mfd.uiService.navigateTo('atccom/msg-record/all-msg');
                }}
              />
            </div>
            <div style="position:absolute; top:165px; left:65px;">
              <Button
                label="MONITORED MSG"
                buttonStyle="width:205px; height:64px"
                onClick={() => {
                  this.props.mfd.uiService.navigateTo('atccom/msg-record/monitored-msg');
                }}
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
