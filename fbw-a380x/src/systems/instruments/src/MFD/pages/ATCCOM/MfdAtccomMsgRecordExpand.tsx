import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdAtccomMsgRecord.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';

interface MfdAtccomMsgRecordExpandProps extends AbstractMfdPageProps {}

export class MfdAtccomMsgRecordExpand extends DisplayComponent<MfdAtccomMsgRecordExpandProps> {
  render(): VNode {
    return (
      <>
        <ActivePageTitleBar activePage={Subject.create('MSG RECORD/ALL MSG/EXPAND')} offset={Subject.create('')} />
        {/* begin page content */}
        <div class="mfd-page-container">
          <div style="display:flex; flex: 1 1 auto; width:100%">
            <div class="msg-record-msg-element mfd-label green">
              <div>
                <span class="msg-time">0107Z</span>
                <span class="msg-origin-dest">FROM KZWY</span>
                <span class="msg-status">WILCO</span>
              </div>
              <div class="msg-body-expand">
                {`WSXX99 EBBR 092010 SIGA0M KZWY SIGMET
                FOXTROT 13 VALID 092100/100300 KKCI - NEW //
                  YORK OCEANIC FIR TC GABRIELLE OBS AT
                  2100Z NR N4042 W04524 MOV NE 18KT. NC. //
                  EMBED TS TOP FL470 WI N4500 W04100 -
                  N4230 W04145 - N3930 W04615 - N4145
                  W04900 //
                  - N4500 W04715 - N4500 W04100. FCST 0300Z
                  TC CENTER N4158 W04324.//`}
              </div>
            </div>
            <div style="flex-grow: 1;" />
            {/* fill space vertically */}
          </div>
          <div class="mfd-atccom-msg-record-footer">
            <div>
              <Button
                label="RETURN<br />TO LIST"
                disabled={Subject.create(false)}
                onClick={() => {
                  this.props.mfd.uiService.navigateTo('atccom/msg-record/all-msg');
                }}
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
        <Footer
          bus={this.props.bus}
          mfd={this.props.mfd}
          fmcService={this.props.fmcService}
          flightPlanInterface={this.props.fmcService.master.flightPlanInterface}
        />
      </>
    );
  }
}
