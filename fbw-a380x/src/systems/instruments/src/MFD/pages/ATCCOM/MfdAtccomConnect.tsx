import { ArraySubject, DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdAtccomConnect.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { Button } from 'instruments/src/MFD/pages/common/Button';
// import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';

import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { AdscButton } from 'instruments/src/MFD/pages/common/AdscButton';

interface MfdAtccomConnectProps extends AbstractMfdPageProps {}

export class MfdAtccomConnect extends DisplayComponent<MfdAtccomConnectProps> {
  private atcCenter = Subject.create<string | null>(null);

  private dropdownMenuRef = FSComponent.createRef<DropdownMenu>();

  private availableAtcCenters = ArraySubject.create<string>([]);
  private selectedAtcCenterIndex = Subject.create<number | null>(null);

  private readonly adscButtonOn = Subject.create<boolean>(false);
  private readonly adscEmerButtonOn = Subject.create<boolean>(false);

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
          <div class="mfd-atccom-connect-row">
            <div class="mfd-atccom-connect-col-1">
              <div class="mfd-atccom-connect mfd-label">NOTIFY TO ATC :</div>
            </div>
            <div class="mfd-atccom-connect-col-2">
              <DropdownMenu
                ref={this.dropdownMenuRef}
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_notifyToAtcDropdown`}
                selectedIndex={this.selectedAtcCenterIndex}
                values={this.availableAtcCenters}
                freeTextAllowed={false}
                containerStyle="width: 150px;"
                alignLabels="center"
                numberOfDigitsForInputField={4}
                tmpyActive={Subject.create(false)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
            </div>
            <div class="mfd-atccom-connect-col-3">
              <div style="display: flex; justify-content: center">
                <Button
                  label="NOTIFY"
                  disabled={Subject.create(true)}
                  onClick={() => this.props.mfd.uiService.navigateTo('fms/data/status')}
                  buttonStyle="margin-right: 10px; width: 120px;"
                />
              </div>
            </div>
          </div>
          <div class="mfd-atccom-connect-row" style="margin-top: 10px">
            <div class="mfd-atccom-connect-col-1"></div>
            <div class="mfd-atccom-connect-col-2">
              <div class="mfd-atccom-connect mfd-label">NOTIFY</div>
            </div>
          </div>
          <div class="mfd-atccom-connect-row mfd-atccom-connect-section-1">
            <div style="width: 500px">
              <div class="mfd-atccom-connect-atc-row">
                <div class="mfd-atccom-connect-col-1">
                  <div class="mfd-atccom-connect mfd-label">ACTIVE ATC :</div>
                </div>
                <div class="mfd-atccom-connect-col-2">
                  <span class="mfd-atccom-connect mfd-value">XXXX</span>
                </div>
              </div>
              <div class="mfd-atccom-connect-atc-row">
                <div class="mfd-atccom-connect-col-1">
                  <div class="mfd-atccom-connect mfd-label">NEXT ATC :</div>
                </div>
                <div class="mfd-atccom-connect-col-2">
                  <span class="mfd-atccom-connect mfd-value">XXXX</span>
                </div>
              </div>
            </div>
            <div class="mfd-atccom-connect-col-3">
              <div>
                <Button
                  label="DISCONNECT ALL"
                  disabled={Subject.create(true)}
                  onClick={() => this.props.mfd.uiService.navigateTo('fms/data/status')}
                  buttonStyle="width: 260px; margin-top: 20px"
                />
              </div>
              <div>
                <Button
                  label="MODIFY<br /> MAX UPLINK DELAY"
                  disabled={Subject.create(true)}
                  onClick={() => this.props.mfd.uiService.navigateTo('fms/data/status')}
                  buttonStyle="width: 260px; margin-top: 30px"
                />
              </div>
            </div>
          </div>
          <div class="mfd-atccom-connect-row adsc">
            <div class="mfd-atccom-connect-adsc-block">
              <div class="mfd-atccom-connect mfd-label">ADS-C</div>
              <div class="mfd-atccom-connect-adscbutton">
                <AdscButton
                  state={this.adscButtonOn}
                  labelFalse={'OFF'}
                  labelTrue={'ARMED'}
                  onChanged={() => {
                    this.adscButtonOn.set(!this.adscButtonOn.get());
                  }}
                />
              </div>
            </div>
            <div class="mfd-atccom-connect-adsc-block">
              <div class="mfd-atccom-connect mfd-label">ADS-C EMERGENCY</div>
              <div class="mfd-atccom-connect-adscEmerbutton">
                <AdscButton
                  state={this.adscEmerButtonOn}
                  labelFalse={'OFF'}
                  labelTrue={'ARMED'}
                  onChanged={() => {
                    this.adscEmerButtonOn.set(!this.adscEmerButtonOn.get());
                  }}
                />
              </div>
            </div>
          </div>
          <div class="mfd-atccom-connect-row">
            <div class="mfd-atccom-connect mfd-label" style="margin-left: 110px">
              ADS-C CONNECTED GROUND STATIONS :
            </div>
            <div class="mfd-label" style="margin-left: 23px">
              NONE
            </div>
          </div>
          <div class="mfd-atccom-connect-row" style="justify-content: center; margin-top: 10px">
            <div class="mfd-atccom-connect-connected-centers-list"></div>
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
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
