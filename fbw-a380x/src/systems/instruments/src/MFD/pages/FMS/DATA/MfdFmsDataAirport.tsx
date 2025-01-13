// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { coordinateToString, MathUtils } from '@flybywiresim/fbw-sdk';

import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { AirportFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { loadAirport, loadAllRunways } from '@fmgc/flightplanning/DataLoading';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';

import './MfdFmsDataAirport.scss';

interface MfdFmsDataAirportProps extends AbstractMfdPageProps {}

interface SimplifiedRunway {
  label: string;
  length: string;
  lsIdent: string;
  elevation: string;
  course: string;
  coords: string;
  runwayIdent: string;
}

export class MfdFmsDataAirport extends FmsPage<MfdFmsDataAirportProps> {
  private readonly selectedPageIndex = Subject.create<number>(0);
  private readonly runwayButtonListRef = FSComponent.createRef<HTMLDivElement>();

  private readonly airportName = Subject.create('');
  private readonly airportCoords = Subject.create('');
  private readonly airportRunways = Subject.create<SimplifiedRunway[]>([]);

  private readonly airportIcao = Subject.create<string | null>(null);

  private readonly runwayDataRef = FSComponent.createRef<HTMLDivElement>();

  private readonly runwayIdent = Subject.create<string | null>(null);
  private readonly runwayCoords = Subject.create<string | null>(null);
  private readonly runwayElevation = Subject.create<string | null>(null);
  private readonly runwayLength = Subject.create<string | null>(null);
  private readonly runwayCourse = Subject.create<string | null>(null);
  private readonly runwayLsIdent = Subject.create<string | null>(null);

  private readonly selectedRunwayIndex = Subject.create<number | null>(null);

  private readonly disabledScrollLeft = Subject.create(true);
  private readonly disabledScrollRight = Subject.create(false);

  private readonly currentIndex = Subject.create(0);

  private currentIndexRef = FSComponent.createRef<HTMLSpanElement>();
  private totalRunwaysRef = FSComponent.createRef<HTMLSpanElement>();

  private containerRef = FSComponent.createRef<HTMLDivElement>();

  private renderRunwayButtons(): void {
    this.runwayButtonListRef.instance.innerHTML = '';
    this.airportRunways.get().forEach((runway, index) => {
      if (runway.label.includes('ILS')) {
        runway.label = runway.label.replace('ILS', 'LS');
      }

      FSComponent.render(
        <Button
          label={runway.label}
          onClick={() => this.selectedRunwayIndex.set(index)}
          buttonStyle="width: 220px; margin-bottom: 5px; height: 40px; margin-left: 10px;"
        />,
        this.runwayButtonListRef.instance,
      );
    });
  }

  private scrollRunwayButtons(direction: 'left' | 'right'): void {
    const currentIndex = this.selectedRunwayIndex.get() ?? 0;

    this.selectedRunwayIndex.set(currentIndex + (direction === 'left' ? -1 : 1));
  }

  private renderRunwayData(runwayData: SimplifiedRunway): void {
    this.runwayIdent.set(runwayData.runwayIdent);
    this.runwayCoords.set(runwayData.coords);
    this.runwayElevation.set(runwayData.elevation);
    this.runwayLength.set(runwayData.length);
    this.runwayCourse.set(runwayData.course);
    this.runwayLsIdent.set(runwayData.lsIdent);

    this.runwayDataRef.instance.style.display = 'block';
  }

  private async loadAirportRunways(icao: string | null) {
    if (icao) {
      const airport = await loadAirport(icao);

      console.log(airport);

      if (airport) {
        const runways = await loadAllRunways(airport);

        const airportCoords = coordinateToString(airport.location.lat, airport.location.long, false);

        const simplifiedRunways = runways.map((runway) => {
          const length = MathUtils.round(runway.length, 10).toFixed(0).padStart(5, '\xa0');
          // TODO: add alt to location coming from Airport types
          // @ts-ignore
          const elevation = MathUtils.round(runway.location.alt, 10).toFixed(0).padStart(5, '\xa0');

          return {
            label: `${runway.ident.substring(4).padEnd(3, ' ')} ${length}M ${runway.lsIdent ? 'ILS' : ''}`,
            length,
            lsIdent: runway.lsIdent ?? '\xa0',
            elevation,
            coords: coordinateToString(runway.location.lat, runway.location.long, false),
            runwayIdent: runway.ident.substring(4).padEnd(3, ' '),
            course: runway.bearing.toFixed(0).padStart(3, '0'),
          };
        });

        this.airportRunways.set(simplifiedRunways);

        if (airport.name && airport.location) {
          this.airportName.set(airport.name.toUpperCase());
          this.airportCoords.set(airportCoords);
        }

        this.renderRunwayButtons();
      }
    }
  }

  private checkScrollButtons() {
    const currentIndex = this.selectedRunwayIndex.get() ?? 0;
    const totalRunways = this.airportRunways.get().length;

    this.currentIndexRef.instance.innerHTML = (currentIndex + 1).toFixed(0);
    this.totalRunwaysRef.instance.innerHTML = totalRunways.toFixed(0);

    this.disabledScrollLeft.set(currentIndex === 0);
    this.disabledScrollRight.set(currentIndex === totalRunways - 1);
  }

  protected onNewData() {}

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.airportIcao.sub((icao: string | null) => {
      if (icao && icao.length === 4) {
        this.loadAirportRunways(icao);

        // hide runway data and show runway buttons
        this.runwayDataRef.instance.style.display = 'none';
        this.runwayButtonListRef.instance.style.display = 'block';
        this.containerRef.instance.style.border = '1px solid #444';
      } else {
        this.containerRef.instance.style.border = 'none';
        this.runwayDataRef.instance.style.display = 'none';
        this.runwayButtonListRef.instance.style.display = 'none';
      }
    });

    this.selectedRunwayIndex.sub((index: number | null) => {
      if (index === null) {
        this.runwayDataRef.instance.style.display = 'none';
        this.runwayButtonListRef.instance.style.display = 'block';
      } else {
        this.checkScrollButtons();
        this.currentIndex.set(index + 1);

        const runwayData = this.airportRunways.get()[index];

        this.renderRunwayData(runwayData);
        this.runwayButtonListRef.instance.style.display = 'none';
      }
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

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-page-container">
          <TopTabNavigator
            pageTitles={Subject.create(['DATABASE ARPTs', 'PILOT STORED RWYs'])}
            selectedPageIndex={this.selectedPageIndex}
            pageChangeCallback={(val) => {
              this.selectedPageIndex.set(val);
            }}
            selectedTabTextColor="white"
            tabBarSlantedEdgeAngle={25}
          >
            <TopTabNavigatorPage>
              <div class="mfd-data-airport-input">
                <div class="mfd-label" style={'position: relative; right: 90px;'}>
                  ARPT IDENT
                </div>
                <div>
                  <InputField<string>
                    dataEntryFormat={new AirportFormat()}
                    dataHandlerDuringValidation={async (v) => {
                      this.airportIcao.set(v);
                    }}
                    mandatory={Subject.create(true)}
                    canBeCleared={Subject.create(false)}
                    value={this.airportIcao}
                    alignText="center"
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                    containerStyle="position: relative; right: 60px;"
                  />
                </div>
              </div>
              {/* DATABASE ARPTs */}
              <div class="mfd-data-airport-info">
                <div class="mfd-value bigger" style={'margin-bottom: 20px;'}>
                  {this.airportName || '\u00A0'}
                </div>
                <div class="mfd-value bigger mfd-data-airport-coords">{this.airportCoords || '\u00A0'}</div>
              </div>
              <div class="mfd-data-airport-container" ref={this.containerRef}>
                <div ref={this.runwayButtonListRef} class="mfd-data-airport-list" />
                <div ref={this.runwayDataRef} style="display: none;">
                  <div class="mfd-data-airport-runway">
                    <div class="mfd-label mfd-data-airport-runway-field" data-label="RWY" style="min-width: 120px;">
                      <div>
                        <span class="mfd-value bigger">{this.runwayIdent}</span>
                      </div>
                    </div>

                    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; margin-top: -25px; margin-bottom: 20px;">
                      <div>
                        <span class="mfd-label" ref={this.currentIndexRef}></span>
                        <span class="mfd-label">/</span>
                        <span class="mfd-label" ref={this.totalRunwaysRef}></span>
                      </div>
                      <div class="mfd-data-airport-runway-scroll-buttons">
                        <IconButton
                          icon="double-left"
                          onClick={() => this.scrollRunwayButtons('left')}
                          disabled={this.disabledScrollLeft}
                          containerStyle="width: 50px; height: 50px; margin-right: 5px;"
                        />
                        <IconButton
                          icon="double-right"
                          onClick={() => this.scrollRunwayButtons('right')}
                          containerStyle="width: 50px; height: 50px;"
                          disabled={this.disabledScrollRight}
                        />
                      </div>
                    </div>

                    <div
                      class="mfd-label mfd-data-airport-runway-field"
                      data-label="LAT/LONG"
                      style="min-width: 120px;"
                    >
                      <div>
                        <span class="mfd-value bigger">{this.runwayCoords}</span>
                      </div>
                    </div>
                    <div
                      class="mfd-label mfd-data-airport-runway-field"
                      data-label="ELEVATION"
                      style="min-width: 120px;"
                    >
                      <div>
                        <span class="mfd-value bigger">{this.runwayElevation}</span>
                        <span class="mfd-label-unit mfd-unit-trailing">{'FT'}</span>
                      </div>
                    </div>
                    <div class="mfd-label mfd-data-airport-runway-field" data-label="LENGTH" style="min-width: 120px;">
                      <div>
                        <span class="mfd-value bigger"> {this.runwayLength}</span>
                        <span class="mfd-label-unit mfd-unit-trailing">{'M'}</span>
                      </div>
                      <div class="mfd-label mfd-data-airport-runway-field-course">
                        <span class="mfd-value bigger">{this.runwayCourse}</span>
                        <span class="mfd-label-unit mfd-unit-trailing">°</span>
                      </div>
                    </div>
                    <div
                      class="mfd-label mfd-data-airport-runway-field"
                      data-label="LS IDENT"
                      style="min-width: 120px;"
                    >
                      <div>
                        <span class="mfd-value bigger">{this.runwayLsIdent}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    label="RWY LIST"
                    onClick={() => this.selectedRunwayIndex.set(null)}
                    buttonStyle="width: 220px; margin-bottom: 10px; margin-left: 10px; height: 40px;"
                  />
                </div>
              </div>
            </TopTabNavigatorPage>
            <TopTabNavigatorPage>
              <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <span class="mfd-label">NOT IMPLEMENTED</span>
              </div>
            </TopTabNavigatorPage>
          </TopTabNavigator>
          <div style="flex-grow: 1;" />
          {/* fill space vertically */}
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
