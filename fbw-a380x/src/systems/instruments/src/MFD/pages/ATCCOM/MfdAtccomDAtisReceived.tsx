import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdAtccomDAtis.scss';
import { AtccomMfdPageProps } from 'instruments/src/MFD/MFD';
import { AtccomFooter } from './MfdAtccomFooter';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/TopTabNavigator';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
import { AtisType } from '@datalink/common';
import { AirportAtis } from '../../ATCCOM/AtcDatalinkSystem';

interface MfdAtccomDAtisReceivedProps extends AtccomMfdPageProps {}

export class MfdAtccomDAtisReceived extends DisplayComponent<MfdAtccomDAtisReceivedProps> {
  private readonly datalink = this.props.atcService;

  private atisIndex: number = Number(this.props.mfd.uiService.activeUri.get().extra);

  private atisData: AirportAtis = {
    icao: '',
    type: AtisType.Departure,
    requested: false,
    autoupdate: false,
    lastReadAtis: '',
  };

  protected onNewData() {}

  private readonly message = Subject.create<string>('');

  private readonly previousMessage = Subject.create<string>('');

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.atisIndex != undefined) {
      this.atisData = this.datalink.getAtisAirports()[this.atisIndex];
    }

    if (this.atisIndex != undefined) {
      const atisReport = this.datalink.atisReports(this.atisData.icao);
      this.message.set(atisReport[0].Reports[0].report);

      if (atisReport[1] !== undefined) {
        this.previousMessage.set(atisReport[1].Reports[0].report);
      }
    }
  }

  render(): VNode {
    return (
      <>
        <ActivePageTitleBar
          activePage={Subject.create('D-ATIS/RECEIVED')}
          offset={Subject.create('')}
          eoIsActive={Subject.create(false)}
          tmpyIsActive={Subject.create(false)}
        />
        {/* begin page content */}
        <div class="mfd-page-container">
          <TopTabNavigator
            pageTitles={Subject.create(['LAST', 'PREVIOUS'])}
            selectedPageIndex={Subject.create(0)}
            // pageChangeCallback={() => {}}
            selectedTabTextColor="white"
            tabBarSlantedEdgeAngle={27}
          >
            <TopTabNavigatorPage containerStyle="position:relative">
              {/* LAST */}
              <div class="mfd-label atis-message-full">{this.message}</div>
              <div id="datis-nav-buttons" style="position: absolute; top:37px; right:16px;">
                <IconButton
                  icon="double-up"
                  onClick={() => {}}
                  disabled={Subject.create(true)}
                  containerStyle="width: 40px; height: 40px; padding:4px"
                />
                <IconButton
                  icon="double-down"
                  onClick={() => {}}
                  containerStyle="width: 40px; height: 40px; padding:4px"
                />
              </div>
              <div
                id="datis-page-number"
                class="mfd-label"
                style="position:absolute; bottom:12px; right:17px; font-size:21px;"
              >
                <span>
                  PGE
                  <br />
                  1/2
                </span>
              </div>
            </TopTabNavigatorPage>
            <TopTabNavigatorPage containerStyle="position:relative">
              {/* PREVIOUS */}
              <div class="mfd-label atis-message-full">{this.previousMessage}</div>
              <div id="datis-nav-buttons" style="position: absolute; top:37px; right:16px;">
                <IconButton
                  icon="double-up"
                  onClick={() => {}}
                  disabled={Subject.create(true)}
                  containerStyle="width: 40px; height: 40px; padding:4px"
                />
                <IconButton
                  icon="double-down"
                  onClick={() => {}}
                  containerStyle="width: 40px; height: 40px; padding:4px"
                />
              </div>
              <div
                id="datis-page-number"
                class="mfd-label"
                style="position:absolute; bottom:12px; right:17px; font-size:21px;"
              >
                <span>
                  PGE
                  <br />
                  1/2
                </span>
              </div>
            </TopTabNavigatorPage>
          </TopTabNavigator>

          <div class="mfd-atccom-datis-footer">
            <Button
              label="RETURN<br />TO LIST"
              disabled={Subject.create(false)}
              onClick={() => this.props.mfd.uiService.navigateTo('atccom/d-atis/list')}
              buttonStyle="width: 190px; height:62px"
            />
            <Button
              label="PRINT"
              disabled={Subject.create(true)}
              onClick={() => {}}
              buttonStyle="width: 190px; height:62px"
              containerStyle="position:absolute; top:2px; right:0px"
            />
          </div>
        </div>
        <AtccomFooter bus={this.props.bus} mfd={this.props.mfd} atcService={this.props.atcService} />
      </>
    );
  }
}
