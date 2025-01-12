// Copyright (c) 2023-2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';
import { coordinateToString, VhfNavaid } from '@flybywiresim/fbw-sdk';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { NavaidIdentFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { NavigationDatabaseService } from '@fmgc/index';
import './MfdFmsDataNavaid.scss';
import { NAVAID_TYPE_STRINGS } from 'instruments/src/MFD/pages/FMS/POSITION/MfdFmsPositionNavaids';

interface MfdFmsDataAirportProps extends AbstractMfdPageProps {}

interface NavaidInformation {
  airportIdent: string;
  ident: string;
  class: string;
  latLong: string;
  elevation: string;
  stationDeclination: string;
  declinationCardinalDir: string;
  rwyIdent: string | RegExpMatchArray | null;
  freq: string;
  cat: string;
  crs: string | number;
  fom: string;
}

export class MfdFmsDataNavaid extends FmsPage<MfdFmsDataAirportProps> {
  private readonly selectedPageIndex = Subject.create<number>(0);

  private readonly storedNavaids = Subject.create('00');

  private readonly deleteStoredElementsDisabled = Subject.create(true);

  private readonly isSwapConfirmVisible = Subject.create(false);

  private readonly selectedNavaid = Subject.create<string | null>(null);

  private readonly freq = Subject.create<string | null>(null);

  private readonly db = NavigationDatabaseService.activeDatabase.backendDatabase;

  private readonly lsContainerRef = Array.from({ length: 2 }, () => FSComponent.createRef<HTMLDivElement>());
  private readonly vorContainerRef = Array.from({ length: 2 }, () => FSComponent.createRef<HTMLDivElement>());

  static defaultNavaidData: NavaidInformation = {
    airportIdent: '',
    ident: '',
    class: '',
    latLong: '',
    elevation: '',
    stationDeclination: '',
    declinationCardinalDir: '',
    rwyIdent: '',
    freq: '',
    cat: '',
    crs: '',
    fom: '',
  };

  private readonly navaidData = Subject.create<NavaidInformation>(MfdFmsDataNavaid.defaultNavaidData);

  private getNavaidType(navaid: VhfNavaid): string {
    const typeMapping = {
      [1 << 1]: NAVAID_TYPE_STRINGS[2],
      [1 << 2]: NAVAID_TYPE_STRINGS[3],
      [1 << 3]: NAVAID_TYPE_STRINGS[1],
      [1 << 4]: NAVAID_TYPE_STRINGS[5],
      [1 << 5]: NAVAID_TYPE_STRINGS[4],
      [1 << 7]: NAVAID_TYPE_STRINGS[6],
    };
    return typeMapping[navaid.type] || 'N/A';
  }

  private getILSCategory(navaid: VhfNavaid): string {
    const catStr = navaid.name?.match(/CAT\s+(I{1,3})/)?.[1];

    switch (catStr) {
      case 'I':
        return '1';
      case 'II':
        return '2';
      case 'III':
        return '3';
      default:
        return 'N/A';
    }
  }

  private async getLocBearing(navaid: VhfNavaid): Promise<number | null> {
    if (navaid.type === 1 << 7) {
      const ilsData = await this.db.getILSs([navaid.ident]);
      const selectedILS = await this.props.mfd.deduplicateFacilities(ilsData);

      if (selectedILS) {
        return selectedILS.locBearing;
      }
    }
    return null;
  }

  private async loadNavaid(ident: string | null): Promise<void> {
    if (!ident) return;

    try {
      const navaids = await this.db.getNavaids([ident]);
      const selectedNavaid = await this.props.mfd.deduplicateFacilities(navaids);

      if (!selectedNavaid) {
        throw new Error(`[FMS/FPM] Can't find navaid with ICAO '${ident}'`);
      }

      const locBearing = await this.getLocBearing(selectedNavaid);
      const frequency = selectedNavaid.frequency.toFixed(2).endsWith('0')
        ? selectedNavaid.frequency.toFixed(1)
        : selectedNavaid.frequency.toFixed(2);

      this.freq.set(frequency);

      const navaidInfo: NavaidInformation = {
        airportIdent: selectedNavaid.airportIdent,
        ident: selectedNavaid.ident,
        class: this.getNavaidType(selectedNavaid),
        latLong: coordinateToString(selectedNavaid.location.lat, selectedNavaid.location.long, false),
        elevation: 'N/A',
        stationDeclination: selectedNavaid.stationDeclination.toFixed(1).replace('-', ''),
        declinationCardinalDir: selectedNavaid.stationDeclination > 0 ? 'E' : 'W',
        rwyIdent: selectedNavaid.name?.includes('RW')
          ? `${selectedNavaid.airportIdent}${selectedNavaid.name.split('RW')[1]}`
          : 'N/A',
        freq: this.freq.get() ?? 'N/A',
        cat: this.getILSCategory(selectedNavaid),
        crs: locBearing ?? 'N/A',
        fom: selectedNavaid.figureOfMerit.toFixed(0),
      };

      if (navaidInfo.rwyIdent !== 'N/A') {
        this.lsContainerRef.forEach((ref) => (ref.instance.style.display = 'flex'));
        this.vorContainerRef.forEach((ref) => (ref.instance.style.display = 'none'));
      } else {
        this.lsContainerRef.forEach((ref) => (ref.instance.style.display = 'none'));
        this.vorContainerRef.forEach((ref) => (ref.instance.style.display = 'flex'));
      }

      this.navaidData.set(navaidInfo);
    } catch (e) {
      console.error(`[FMS/FPM] Error loading navaid: ${e}`);
    }
  }

  protected onNewData() {
    const storedElements = this.props.fmcService.master?.getDataManager()?.numberOfStoredElements();
    if (storedElements) {
      this.storedNavaids.set(storedElements.navaids.toFixed(0).padStart(2, '0'));
      this.deleteStoredElementsDisabled.set(storedElements.total === 0);
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.selectedNavaid.sub((icao: string | null) => {
      this.loadNavaid(icao);
    });

    this.subs.push(
      this.props.mfd.uiService.activeUri.sub((val) => {
        if (val.extra === 'acft-status') {
          this.selectedPageIndex.set(0);
        } else if (val.extra === 'fms-pn') {
          this.selectedPageIndex.set(1);
        }
      }, true),
    );

    const sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();
    this.subs.push(
      sub
        .on('realTime')
        .atFrequency(1)
        .handle((_t) => {
          this.onNewData();
        }),
    );
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  renderNavaidInformationRow(type: 'ls' | 'vor', refIndex: number): VNode {
    return (
      <div
        class={`mfd-data-navaid-information-row right ${type}`}
        ref={this[`${type}ContainerRef`][refIndex]}
        style={{ display: 'none' }}
      >
        <div class="mfd-value">{this.navaidData.map((data) => data.class)}</div>
        <div class="mfd-value">{this.navaidData.map((data) => data.latLong)}</div>
        <div class="mfd-value">{this.navaidData.map((data) => data.elevation)}</div>
        {type === 'ls' ? (
          <>
            <div class="mfd-value">{this.navaidData.map((data) => data.rwyIdent)}</div>
            <div class="mfd-value">{this.navaidData.map((data) => data.freq)}</div>
            <div class="mfd-value">{this.navaidData.map((data) => data.cat)}</div>
            <div class="mfd-value">
              {this.navaidData.map((data) => data.crs)}
              <span class="mfd-label-unit mfd-unit-trailing">°</span>
            </div>
            <div class="mfd-value">{this.navaidData.map((data) => data.fom)}</div>
          </>
        ) : (
          <>
            <div class="mfd-value">
              {this.navaidData.map((data) => data.stationDeclination)}
              <span class="mfd-label-unit mfd-unit-trailing">
                {this.navaidData.map((data) => `°${data.declinationCardinalDir}`)}
              </span>
            </div>
            <div class="mfd-value">{this.navaidData.map((data) => data.freq)}</div>
            <div class="mfd-value">{this.navaidData.map((data) => data.fom)}</div>
          </>
        )}
      </div>
    );
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        <div class="mfd-page-container">
          <TopTabNavigator
            pageTitles={Subject.create(['DATABASE NAVAIDS', 'PILOT STORED NAVAIDS'])}
            selectedPageIndex={this.selectedPageIndex}
            pageChangeCallback={(val) => {
              this.selectedPageIndex.set(val);
              this.isSwapConfirmVisible.set(false);
            }}
            selectedTabTextColor="white"
            tabBarSlantedEdgeAngle={25}
          >
            <TopTabNavigatorPage containerStyle="height: 680px;">
              <div class="mfd-data-navaid-input-container">
                <div class="mfd-label" style={'position: relative; right: 90px;'}>
                  NAVAID IDENT
                </div>
                <div>
                  <InputField<string>
                    dataEntryFormat={new NavaidIdentFormat()}
                    dataHandlerDuringValidation={async (v) => {
                      this.selectedNavaid.set(v);
                    }}
                    mandatory={Subject.create(true)}
                    canBeCleared={Subject.create(false)}
                    value={this.selectedNavaid}
                    alignText="center"
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                    containerStyle="position: relative; right: 60px;"
                  />
                </div>
              </div>
              {/* DATABASE ARPTs */}
              <div class="mfd-data-navaid-information-container">
                <div class="mfd-data-navaid-information-row ls" ref={this.lsContainerRef[0]} style={'display: none;'}>
                  <div class="mfd-data-navaid-information-cell">CLASS</div>
                  <div class="mfd-data-navaid-information-cell">LAT/LONG</div>
                  <div class="mfd-data-navaid-information-cell">ELEVATION</div>
                  <div class="mfd-data-navaid-information-cell">RWY IDENT</div>
                  <div class="mfd-data-navaid-information-cell">FREQ</div>
                  <div class="mfd-data-navaid-information-cell">CAT</div>
                  <div class="mfd-data-navaid-information-cell">CRS</div>
                  <div class="mfd-data-navaid-information-cell">FIG OF MERIT</div>
                </div>
                <div class="mfd-data-navaid-information-row vor" ref={this.vorContainerRef[0]} style={'display: none;'}>
                  <div class="mfd-data-navaid-information-cell">CLASS</div>
                  <div class="mfd-data-navaid-information-cell">LAT/LONG</div>
                  <div class="mfd-data-navaid-information-cell">ELEVATION</div>
                  <div class="mfd-data-navaid-information-cell">STATION DEC</div>
                  <div class="mfd-data-navaid-information-cell">FREQ</div>
                  <div class="mfd-data-navaid-information-cell">FIG OF MERIT</div>
                </div>
                {this.renderNavaidInformationRow('ls', 1)}
                {this.renderNavaidInformationRow('vor', 1)}
              </div>
            </TopTabNavigatorPage>
            <TopTabNavigatorPage>{/* FMS P/N */}</TopTabNavigatorPage>
          </TopTabNavigator>
          <div style="flex-grow: 1;" />
          {/* fill space vertically */}
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
