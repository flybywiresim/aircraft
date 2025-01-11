// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { coordinateToString } from '@flybywiresim/fbw-sdk';

import './MfdFmsDataAirport.scss';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { AirportFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { loadAirport, loadAllRunways } from '@fmgc/flightplanning/DataLoading';

interface MfdFmsDataAirportProps extends AbstractMfdPageProps {}

interface SimplifiedRunway {
  label: string;
  length: string;
}

export class MfdFmsDataAirport extends FmsPage<MfdFmsDataAirportProps> {
  private selectedPageIndex = Subject.create<number>(0);

  private runwayButtonRef = FSComponent.createRef<HTMLDivElement>();

  private navDatabase = Subject.create('');

  private activeDatabase = Subject.create('');

  private secondDatabase = Subject.create('');

  private storedWaypoints = Subject.create('00');

  private storedRoutes = Subject.create('00');

  private storedNavaids = Subject.create('00');

  private storedRunways = Subject.create('00');

  private airportName = Subject.create('');

  private airportCoords = Subject.create('');

  private airportRunways = Subject.create<SimplifiedRunway[]>([]);

  private deleteStoredElementsDisabled = Subject.create(true);

  private readonly isSwapConfirmVisible = Subject.create(false);

  private airportIcao = Subject.create<string | null>(null);

  private renderRunwayButtons(): void {
    if (this.runwayButtonRef.getOrDefault()) {
      const runwayButtons = this.airportRunways.get().forEach((element) => {
        return <Button label={element.label} onClick={() => console.log('POS MONITOR')} />;
      });
      FSComponent.render(<>{runwayButtons}</>, this.runwayButtonRef.instance);
    }
  }

  private async loadAirportRunways() {
    const airportIcao = this.airportIcao.get();

    if (airportIcao) {
      const airport = await loadAirport(airportIcao);

      if (airport) {
        const runways = await loadAllRunways(airport);

        const simplifiedRunways = runways.map((runway) => ({
          label: `${runway.ident.substring(4).padEnd(3, ' ')} ${runway.length.toFixed(0).padStart(5, ' ')}M ${runway.lsIdent ? 'ILS' : ''}`,
          length: runway.length.toFixed(0),
        }));

        this.airportRunways.set(simplifiedRunways);

        if (airport.name && airport.location) {
          this.airportName.set(airport.name.toUpperCase());
          this.airportCoords.set(coordinateToString(airport.location.lat, airport.location.long, false));
        }
      }
    }
  }

  protected onNewData() {
    this.loadAirportRunways();

    const storedElements = this.props.fmcService.master?.getDataManager()?.numberOfStoredElements();
    if (storedElements) {
      this.storedWaypoints.set(storedElements.waypoints.toFixed(0).padStart(2, '0'));
      this.storedRoutes.set(storedElements.routes.toFixed(0).padStart(2, '0'));
      this.storedNavaids.set(storedElements.navaids.toFixed(0).padStart(2, '0'));
      this.storedRunways.set(storedElements.runways.toFixed(0).padStart(2, '0'));
      this.deleteStoredElementsDisabled.set(storedElements.total === 0);
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.renderRunwayButtons();

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
    this.airportRunways.get();
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
              this.isSwapConfirmVisible.set(false);
            }}
            selectedTabTextColor="white"
            tabBarSlantedEdgeAngle={25}
          >
            <TopTabNavigatorPage>
              <div class="mfd-data-airport-input-container">
                <div class="mfd-label">ARPT IDENT</div>
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
                  />
                </div>
              </div>
              {/* DATABASE ARPTs */}
              <div class="mfd-data-airport-information-container">
                <div class="mfd-value bigger">{this.airportName}</div>
                <div class="mfd-value bigger mfd-data-airport-coords-label">{this.airportCoords}</div>
              </div>
              <div ref={this.runwayButtonRef} class="mfd-fms-fpln-awy-awy-container" />
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
