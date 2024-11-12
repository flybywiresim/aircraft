import { ArraySubject, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdAtccomConnect.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
// import { InputField } from 'instruments/src/MFD/pages/common/InputField';
// import { AirportFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
// import { Arinc429Register, Arinc429RegisterSubject, Arinc429Word, coordinateToString } from '@flybywiresim/fbw-sdk';

interface MfdAtccomConnectProps extends AbstractMfdPageProps {}

export class MfdAtccomConnect extends FmsPage<MfdAtccomConnectProps> {
  private atcCenter = Subject.create<string | null>(null);

  private dropdownMenuRef = FSComponent.createRef<DropdownMenu>();

  private availableAtcCenters = ArraySubject.create<string>([]);
  private selectedAtcCenterIndex = Subject.create<number | null>(null);

  protected onNewData() {}

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-page-container">
          <div class="mfd-atccom-connect-row">
            <div class="mfd-atccom-connect-col-1">
              <div class="mfd-label">NOTIFY TO ATC :</div>
            </div>
            <div class="mfd-atccom-connect-col-2">
              <div class="mfd-fms-direct-to-dropdown-div">
                <DropdownMenu
                  ref={this.dropdownMenuRef}
                  idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_directToDropdown`}
                  selectedIndex={this.selectedAtcCenterIndex}
                  values={this.availableAtcCenters}
                  freeTextAllowed
                  containerStyle="width: 150px;"
                  alignLabels="center"
                  // onModified={(i, text) => {
                  //   if (i !== null) {
                  //     this.onDropdownModified(i, text);
                  //   }
                  // }}
                  numberOfDigitsForInputField={4}
                  tmpyActive={this.tmpyActive}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
            </div>
            <div class="mfd-atccom-connect-col-3">
              <div style="display: flex; justify-content: center">
                <Button
                  label="NOTIFY"
                  onClick={() => this.props.mfd.uiService.navigateTo('fms/data/status')}
                  buttonStyle="margin-right: 10px; width: 120px;"
                />
              </div>
            </div>
          </div>
          <div class="mfd-atccom-connect-row mfd-atccom-connect-section-1">
            <div style="width: 500px">
              <div class="mfd-atccom-connect-atc-row">
                <div class="mfd-atccom-connect-col-1">
                  <div class="mfd-label">ACTIVE ATC :</div>
                </div>
                <div class="mfd-atccom-connect-col-2">
                  <span class="mfd-value">WSSS</span>
                </div>
              </div>
              <div class="mfd-atccom-connect-atc-row">
                <div class="mfd-atccom-connect-col-1">
                  <div class="mfd-label">NEXT ATC :</div>
                </div>
                <div class="mfd-atccom-connect-col-2">
                  <span class="mfd-value">WMKK</span>
                </div>
              </div>
            </div>
            <div class="mfd-atccom-connect-col-3">
              <div>
                <Button
                  label="DISCONNECT ALL"
                  onClick={() => this.props.mfd.uiService.navigateTo('fms/data/status')}
                  buttonStyle="width: 260px; margin-top: 20px"
                />
              </div>
              <div>
                <Button
                  label="MODIFY<br /> MAX UPLINK DELAY"
                  onClick={() => this.props.mfd.uiService.navigateTo('fms/data/status')}
                  buttonStyle="width: 260px; margin-top: 30px"
                />
              </div>
            </div>
          </div>
          <div class="mfd-atccom-connect-row adsc">
            <div class="mfd-atccom-connect-adsc-block">
              <div class="mfd-label">ADS-C</div>
              <div>
                <Button
                  label="CONNECTED<br />OFF"
                  onClick={() => this.props.mfd.uiService.navigateTo('fms/data/status')}
                  buttonStyle="width: 180px; margin-top: 10px"
                />
              </div>
            </div>
            <div class="mfd-atccom-connect-adsc-block">
              <div class="mfd-label">ADS-C EMERGENCY</div>
              <div>
                <Button
                  label="ARMED<br />OFF"
                  onClick={() => this.props.mfd.uiService.navigateTo('fms/data/status')}
                  buttonStyle="width: 100px; margin-top: 10px"
                />
              </div>
            </div>
          </div>
          <div class="mfd-atccom-connect-row" style="justify-content: center">
            <div class="mfd-label">ADS-C CONNECTED GROUND STATIONS :</div>
            <div class="mfd-label">NONE</div>
          </div>
          <div class="mfd-atccom-connect-row" style="justify-content: center; margin-top: 10px">
            <div class="mfd-atccom-connect-connected-centers-list"></div>
          </div>
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
