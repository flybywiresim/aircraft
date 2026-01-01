// Copyright (c) 2025-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subscription, Subject, VNode } from '@microsoft/msfs-sdk';

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
  private readonly subs = [] as Subscription[];

  private readonly datalink = this.props.atcService;

  private readonly atisIndex: number = Number(this.props.mfd.uiService.activeUri.get().extra);

  private atisData: AirportAtis = {
    icao: '',
    type: AtisType.Departure,
    requested: false,
    autoupdate: false,
    lastReadAtis: '',
    status: '',
  };

  protected onNewData() {}

  private rowsPerPage = 18;

  private readonly messageArray = Subject.create<string[]>(['']);
  private readonly message = Subject.create<string>('');
  private readonly currentPageNumber = Subject.create<number>(1);
  private readonly numberOfPages = Subject.create<number>(0);

  private readonly previousMessageArray = Subject.create<string[]>(['']);
  private readonly previousMessage = Subject.create<string>('');
  private readonly previousMessageCurrentPageNumber = Subject.create<number>(1);
  private readonly previousMessageNumberOfPages = Subject.create<number>(0);

  private readonly currentAtisNavVisibility = this.numberOfPages.map((v) => (v > 1 ? 'visible' : 'hidden'));
  private readonly prevAtisNavVisibility = this.previousMessageNumberOfPages.map((v) => (v > 1 ? 'visible' : 'hidden'));

  private formatAtis(messageArray: string[], page: number = 1): string {
    return messageArray.slice(this.rowsPerPage * (page - 1), this.rowsPerPage * page).join(' ');
  }

  private processAtisToArray(string: string, numberOfPages: Subject<number>): string[] {
    if (string.length === 0) return [''];
    const charPerRow = 39;
    const messageArray: string[] = [''];
    const words: string[] = string.split(' ');
    let lineIndex: number = 0;
    words.forEach((word) => {
      if (messageArray[lineIndex].length + word.length > charPerRow) {
        lineIndex++;
        messageArray.push('');
      }
      if (messageArray[lineIndex] != '') messageArray[lineIndex] += ' ';
      messageArray[lineIndex] += word;
    });
    numberOfPages.set(Math.ceil(messageArray.length / this.rowsPerPage));
    return messageArray;
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.currentPageNumber.sub((value) => {
        this.message.set(this.formatAtis(this.messageArray.get(), value));
      }),
    );

    this.subs.push(
      this.messageArray.sub((array) => {
        this.message.set(this.formatAtis(array, this.currentPageNumber.get()));
      }),
    );

    this.subs.push(
      this.previousMessageCurrentPageNumber.sub((value) => {
        this.previousMessage.set(this.formatAtis(this.previousMessageArray.get(), value));
      }),
    );

    this.subs.push(
      this.previousMessageArray.sub((array) => {
        this.previousMessage.set(this.formatAtis(array, this.previousMessageCurrentPageNumber.get()));
      }),
    );

    if (this.atisIndex != undefined) {
      this.atisData = this.datalink.getAtisAirports()[this.atisIndex];
    }

    if (this.atisIndex != undefined) {
      const atisReport = this.datalink.atisReports(this.atisData.icao);
      this.messageArray.set(this.processAtisToArray(atisReport[0].Reports[0].report, this.numberOfPages));

      if (atisReport[1] !== undefined) {
        this.previousMessageArray.set(
          this.processAtisToArray(atisReport[1].Reports[0].report, this.previousMessageNumberOfPages),
        );
      }
    }

    this.subs.push(this.currentAtisNavVisibility, this.prevAtisNavVisibility);
  }

  public destroy(): void {
    this.subs.forEach((x) => x.destroy());
    super.destroy();
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
              <div
                id="datis-nav-buttons"
                style={{
                  position: 'absolute',
                  top: '37px',
                  right: '16px',
                  visibility: this.currentAtisNavVisibility,
                }}
              >
                <IconButton
                  icon="double-up"
                  onClick={() => {
                    if (this.currentPageNumber.get() > 1) {
                      this.currentPageNumber.set(this.currentPageNumber.get() - 1);
                    }
                  }}
                  disabled={this.currentPageNumber.map((v) => (v === 1 ? true : false))}
                  containerStyle="width: 40px; height: 40px; padding:4px"
                />
                <IconButton
                  icon="double-down"
                  onClick={() => {
                    if (this.currentPageNumber.get() < this.numberOfPages.get()) {
                      this.currentPageNumber.set(this.currentPageNumber.get() + 1);
                    }
                  }}
                  disabled={this.currentPageNumber.map((v) => (v === this.numberOfPages.get() ? true : false))}
                  containerStyle="width: 40px; height: 40px; padding:4px"
                />
              </div>
              <div
                id="datis-page-number"
                class="mfd-label"
                style="position:absolute; bottom:12px; right:17px; font-size:21px;"
              >
                <span style={{ visibility: this.currentAtisNavVisibility }}>
                  PGE
                  <br />
                  {this.currentPageNumber}/{this.numberOfPages}
                </span>
              </div>
            </TopTabNavigatorPage>
            <TopTabNavigatorPage containerStyle="position:relative">
              {/* PREVIOUS */}
              <div class="mfd-label atis-message-full">{this.previousMessage}</div>
              <div
                id="datis-nav-buttons"
                style={{
                  position: 'absolute',
                  top: '37px',
                  right: '16px',
                  visibility: this.prevAtisNavVisibility,
                }}
              >
                <IconButton
                  icon="double-up"
                  onClick={() => {
                    if (this.previousMessageCurrentPageNumber.get() > 1) {
                      this.previousMessageCurrentPageNumber.set(this.previousMessageCurrentPageNumber.get() - 1);
                    }
                  }}
                  disabled={this.previousMessageCurrentPageNumber.map((v) => (v === 1 ? true : false))}
                  containerStyle="width: 40px; height: 40px; padding:4px"
                />
                <IconButton
                  icon="double-down"
                  onClick={() => {
                    if (this.previousMessageCurrentPageNumber.get() < this.previousMessageNumberOfPages.get()) {
                      this.previousMessageCurrentPageNumber.set(this.previousMessageCurrentPageNumber.get() + 1);
                    }
                  }}
                  disabled={this.previousMessageCurrentPageNumber.map((v) =>
                    v === this.previousMessageNumberOfPages.get() ? true : false,
                  )}
                  containerStyle="width: 40px; height: 40px; padding:4px"
                />
              </div>
              <div
                id="datis-page-number"
                class="mfd-label"
                style="position:absolute; bottom:12px; right:17px; font-size:21px;"
              >
                <span style={{ visibility: this.prevAtisNavVisibility }}>
                  PGE
                  <br />
                  {this.previousMessageCurrentPageNumber}/{this.previousMessageNumberOfPages}
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
