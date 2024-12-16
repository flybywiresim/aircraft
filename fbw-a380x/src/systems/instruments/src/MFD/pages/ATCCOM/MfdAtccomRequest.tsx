import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdAtccomRequest.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { RequestMenuButton } from 'instruments/src/MFD/pages/common/RequestMenuButton';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';

import { RequestDepartureClearance } from 'instruments/src/MFD/pages/ATCCOM/Messages/Clearance/RequestDepartureClearance';

interface MfdAtccomRequestProps extends AbstractMfdPageProps {}

export class MfdAtccomRequest extends DisplayComponent<MfdAtccomRequestProps> {
  private dropdownMenuRef = FSComponent.createRef<DropdownMenu>();

  protected onNewData() {}

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <>
        <ActivePageTitleBar
          activePage={Subject.create('CONNECT')}
          offset={Subject.create('')}
          eoIsActive={Subject.create(false)}
          tmpyIsActive={Subject.create(false)}
        />
        {/* begin page content */}
        <div class="mfd-page-container">
          <div id="atccom-request-container">
            <div id="atccom-request-body">
              <RequestDepartureClearance bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
            </div>
            <div id="atccom-request-menu">
              <RequestMenuButton
                label="VERTICAL"
                idPrefix="Request_Vertical_Menu"
                onClick={() => {}}
                buttonStyle="width:180px;"
                menuItems={Subject.create([
                  { label: 'CLIMB TO', action: () => {} },
                  { label: 'DESCEND TO', action: () => {} },
                  { label: 'ALT/FL', action: () => {} },
                  { label: 'BLOCK ALT/FL', action: () => {} },
                  { label: 'CRUISE CLIMB', action: () => {} },
                  { label: 'ITP', action: () => {} },
                ])}
              />
              <RequestMenuButton
                label="LATERAL"
                idPrefix="Request_Lateral_Menu"
                onClick={() => {}}
                buttonStyle="width:180px;"
                menuItems={Subject.create([
                  { label: 'DIRECT TO', action: () => {} },
                  { label: 'OFFSET', action: () => {} },
                  { label: 'WX DEVIATION', action: () => {} },
                  { label: 'HEADING', action: () => {} },
                  { label: 'TRACK', action: () => {} },
                  { label: 'SID/STAR', action: () => {} },
                  { label: 'TAILORED ARRIVAL', action: () => {} },
                  { label: 'REROUTING', action: () => {} },
                ])}
              />
              <RequestMenuButton
                label="SPEED"
                idPrefix="Request_Speed_Menu"
                onClick={() => {}}
                buttonStyle="width:180px;"
                menuItems={Subject.create([
                  { label: 'SPEED', action: () => {} },
                  { label: 'SPEED RANGE', action: () => {} },
                ])}
              />
              <RequestMenuButton
                label="CLEARANCE"
                idPrefix="Request_Clearance_Menu"
                onClick={() => {}}
                buttonStyle="width:180px;"
                menuItems={Subject.create([
                  { label: 'DEPARTURE', action: () => {} },
                  { label: 'OCEANIC', action: () => {} },
                  { label: 'GENERIC', action: () => {} },
                ])}
              />
              <RequestMenuButton
                label="WHEN CAN<br />WE EXPECT"
                idPrefix="Request_WhenCanWeExpect_Menu"
                onClick={() => {}}
                buttonStyle="width:180px;"
                menuItems={Subject.create([
                  { label: 'HIGHER LEVEL', action: () => {} },
                  { label: 'LOWER LEVEL', action: () => {} },
                  { label: 'CLIMB TO', action: () => {} },
                  { label: 'DESCEND TO', action: () => {} },
                  { label: 'CRUISE CLIMB', action: () => {} },
                  { label: 'SPEED', action: () => {} },
                  { label: 'SPEED RANGE', action: () => {} },
                  { label: 'BACK ON ROUTE', action: () => {} },
                ])}
              />
              <RequestMenuButton
                label="OTHER"
                idPrefix="Request_Other_Menu"
                onClick={() => {}}
                buttonStyle="width:180px;"
                menuItems={Subject.create([
                  { label: 'FREETEXT', action: () => {} },
                  { label: 'VOICE CONTACT', action: () => {} },
                  { label: 'OWN SEPARATION & VMC', action: () => {} },
                  { label: 'VMC DES', action: () => {} },
                ])}
              />
              <br />
              <RequestMenuButton
                label="ADD TEXT"
                idPrefix="Request_AddText_Menu"
                onClick={() => {}}
                buttonStyle="width:180px;"
                menuItems={Subject.create([
                  { label: 'DUE TO WEATHER', action: () => {} },
                  { label: 'DUE TO A/C PERFORMANCE', action: () => {} },
                  { label: 'DUE TO TURBULENCE', action: () => {} },
                  { label: 'DUE TO TECHNICAL', action: () => {} },
                  { label: 'DUE TO MEDICAL', action: () => {} },
                  { label: 'AT PILOTS DISCRETION', action: () => {} },
                  { label: 'FREETEXT', action: () => {} },
                ])}
              />
            </div>
          </div>
          <div class="mfd-atccom-request-footer">
            <div>
              <Button
                label="CANCEL"
                disabled={Subject.create(false)}
                onClick={() => {}}
                buttonStyle="width: 190px; height:64px;"
              />
            </div>
            <div style="position:absolute; right:0px">
              <Button
                label="XFR<br /> TO MAILBOX"
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
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
