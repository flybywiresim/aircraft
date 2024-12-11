import { DisplayComponent, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdAtccomDAtis.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';

interface MfdAtccomDAtisReceivedProps extends AbstractMfdPageProps {}

export class MfdAtccomDAtisReceived extends DisplayComponent<MfdAtccomDAtisReceivedProps> {
  protected onNewData() {}

  private readonly ATISMessage =
    'LFPG ARR DELTA -----\nLFPG ARR ATIS D\n1010Z\nEXPECT 5E 5N ILS 09L AND 5E 5N ILS 08R\nARR RWY 09L AND 08R DEP RWY 09R AND 08L\nSID 2G2H\n  TWY E CLSD BTN TWY F AND TWY TB3\n  RWY DAMP\n\nTRL 70\nWIND 030/11 KT\nWIS 3500 M\nBR\nCLD\n  BKN 600 FT\n  BKN 700 FT\nT=09 DP+07\nQNH 1013';

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
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
              <div class="mfd-label atis-message-full">{this.ATISMessage}</div>
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
              disabled={Subject.create(false)}
              onClick={() => {}}
              buttonStyle="width: 190px; height:62px"
              containerStyle="position:absolute; top:2px; right:0px"
            />
          </div>
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
