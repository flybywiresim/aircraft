import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdAtccomRequest.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { RequestMenuButton } from 'instruments/src/MFD/pages/common/RequestMenuButton';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { DropdownMenu } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/DropdownMenu';
import { MaxRequestElements, MessageTable } from 'instruments/src/MFD/pages/ATCCOM/Messages/Registry';

interface MfdAtccomRequestProps extends AbstractMfdPageProps {}

export class MfdAtccomRequest extends DisplayComponent<MfdAtccomRequestProps> {
  private dropdownMenuRef = FSComponent.createRef<DropdownMenu>();

  private elements: { id: string; message: undefined; readyToSend: boolean }[] = [];
  private FanMode: string = 'A';

  protected onNewData() {}

  private elementDelete = (elementIndex: number) => {
    this.elements.splice(elementIndex, 1);
    this.renderElements();
  };

  private onSelect(frameName: string): void {
    if (!MessageTable[frameName]) {
      return console.log('Request frame not found: ' + frameName);
    }

    if (
      MessageTable[frameName].singleMessage ||
      (this.elements.length !== 0 && MessageTable[this.elements[0].id].singleMessage)
    ) {
      this.elements = [];
    }

    // check and swap frame is frames are to be exchanged
    if (MessageTable[frameName].exchanging !== undefined) {
      for (let i = 0; i < this.elements.length; i++) {
        if (MessageTable[frameName].exchanging === this.elements[i].id) {
          this.elements.splice(i, 1, { id: frameName, message: undefined, readyToSend: false });
          this.renderElements();
          return;
        }
      }
    }

    if (this.elements.length < MaxRequestElements) {
      this.elements.push({ id: frameName, message: undefined, readyToSend: false });
      this.renderElements();
    }
  }

  // Convert this to use a subscription when elements is changed
  private renderElements(): void {
    FSComponent.remove(document.getElementById('request-frame-0'));
    FSComponent.remove(document.getElementById('request-frame-1'));
    FSComponent.remove(document.getElementById('request-frame-2'));
    FSComponent.remove(document.getElementById('request-frame-3'));
    FSComponent.remove(document.getElementById('request-frame-4'));

    this.elements.forEach((element, index) => {
      if (MessageTable[element.id]) {
        FSComponent.render(
          <div id={`request-frame-${index}`} className="request-frame"></div>,
          document.getElementById('atccom-request-body'),
        );
        FSComponent.render(
          MessageTable[element.id].visualization(this.props, this.FanMode, index, this.elements, () =>
            this.elementDelete(index),
          ),
          document.getElementById(`request-frame-${index}`),
        );
      }
    });
  }

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
            <div id="atccom-request-body"></div>
            <div id="atccom-request-menu">
              <RequestMenuButton
                label="VERTICAL"
                idPrefix="Request_Vertical_Menu"
                onClick={() => {}}
                buttonStyle="width:180px;"
                menuItems={Subject.create([
                  { label: 'CLIMB TO', action: () => this.onSelect('RequestClimb') },
                  { label: 'DESCEND TO', action: () => this.onSelect('RequestDescend') },
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
                  { label: 'DIRECT TO', action: () => this.onSelect('RequestDirect') },
                  { label: 'OFFSET', action: () => {} },
                  { label: 'WX DEVIATION', action: () => {} },
                  { label: 'HEADING', action: () => this.onSelect('RequestHeading') },
                  { label: 'TRACK', action: () => this.onSelect('RequestGroundTrack') },
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
                  { label: 'DEPARTURE', action: () => this.onSelect('RequestDepartureClearance') },
                  { label: 'OCEANIC', action: () => this.onSelect('RequestOceanicClearance') },
                  { label: 'GENERIC', action: () => this.onSelect('RequestGenericClearance') },
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
                onClick={() => {
                  this.elements = [];
                  this.renderElements();
                }}
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
