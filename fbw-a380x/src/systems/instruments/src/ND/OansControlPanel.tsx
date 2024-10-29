// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import './oans-style.scss';
import './OansControlPanel.scss';

import {
  ArraySubject,
  ClockEvents,
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MapSubject,
  MappedSubject,
  MappedSubscribable,
  SimVarValueType,
  Subject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import {
  BrakeToVacateUtils,
  ControlPanelAirportSearchMode,
  ControlPanelStore,
  ControlPanelUtils,
  FmsDataStore,
  NavigraphAmdbClient,
  Oanc,
  OansControlEvents,
  globalToAirportCoordinates,
} from '@flybywiresim/oanc';
import {
  AmdbAirportSearchResult,
  Arinc429LocalVarConsumerSubject,
  Arinc429RegisterSubject,
  BtvData,
  EfisSide,
  FeatureType,
  FeatureTypeString,
  FmsOansData,
  MathUtils,
  NXDataStore,
  Runway,
} from '@flybywiresim/fbw-sdk';

import { Button } from 'instruments/src/MFD/pages/common/Button';
import { OansRunwayInfoBox } from './OANSRunwayInfoBox';
import { DropdownMenu } from 'instruments/src/MFD/pages/common/DropdownMenu';
import { RadioButtonGroup } from 'instruments/src/MFD/pages/common/RadioButtonGroup';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import { LengthFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { IconButton } from 'instruments/src/MFD/pages/common/IconButton';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';
import { Coordinates, distanceTo, placeBearingDistance } from 'msfs-geo';
import { AdirsSimVars } from 'instruments/src/MsfsAvionicsCommon/SimVarTypes';
import { NavigationDatabase, NavigationDatabaseBackend, NavigationDatabaseService } from '@fmgc/index';
import { InternalKccuKeyEvent } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { NDSimvars } from 'instruments/src/ND/NDSimvarPublisher';
import { InteractionMode } from 'instruments/src/MFD/MFD';
import { Position } from '@turf/turf';

export interface OansProps extends ComponentProps {
  bus: EventBus;
  side: EfisSide;
  isVisible: Subscribable<boolean>;
  togglePanel: () => void;
}

export enum EntityTypes {
  RWY,
  TWY,
  STAND,
  OTHER,
}

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export class OansControlPanel extends DisplayComponent<OansProps> {
  private readonly subs: (Subscription | MappedSubscribable<any>)[] = [];

  private readonly sub = this.props.bus.getSubscriber<ClockEvents & FmsOansData & AdirsSimVars & NDSimvars & BtvData>();

  /** If navigraph not available, this class will compute BTV features */
  private readonly navigraphAvailable = Subject.create(false);

  private amdbClient = new NavigraphAmdbClient();

  private readonly oansMenuRef = FSComponent.createRef<HTMLDivElement>();

  private readonly airportSearchAirportDropdownRef = FSComponent.createRef<DropdownMenu>();

  private readonly displayAirportButtonRef = FSComponent.createRef<Button>();

  private readonly closePanelButtonRef = FSComponent.createRef<HTMLButtonElement>();

  private readonly mapDataLdgShiftPanelRef = FSComponent.createRef<HTMLDivElement>();

  private readonly mapDataMainRef = FSComponent.createRef<HTMLDivElement>();

  private readonly mapDataBtvFallback = FSComponent.createRef<HTMLDivElement>();

  private readonly store = new ControlPanelStore();

  private readonly style = MapSubject.create<string, string>();

  private readonly activeTabIndex = Subject.create<number>(2);

  private readonly availableEntityTypes = Object.values(EntityTypes).filter((v) => typeof v === 'string') as string[];

  private readonly thresholdShift = Subject.create<number | null>(null);

  private readonly endShift = Subject.create<number | null>(null);

  private readonly selectedEntityType = Subject.create<EntityTypes | null>(EntityTypes.RWY);

  private readonly availableEntityList = ArraySubject.create(['']);

  private readonly selectedEntityIndex = Subject.create<number | null>(0);

  private readonly selectedEntityString = Subject.create<string | null>(null);

  private manualAirportSelection = false;

  private readonly pposLatWord = Arinc429RegisterSubject.createEmpty();

  private readonly pposLonWord = Arinc429RegisterSubject.createEmpty();

  private presentPos = MappedSubject.create(
    ([lat, lon]) => {
      return { lat: lat.value, long: lon.value } as Coordinates;
    },
    this.pposLatWord,
    this.pposLonWord,
  );

  private readonly fmsDataStore = new FmsDataStore(this.props.bus);

  private readonly runwayTora = Subject.create<string | null>(null);

  private readonly runwayLda = Subject.create<string | null>(null);

  private readonly oansRequestedStoppingDistance = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('oansRequestedStoppingDistance'),
  );

  private readonly reqStoppingDistance = this.oansRequestedStoppingDistance.map((it) =>
    it.isNormalOperation() ? it.value : 0,
  );

  private readonly fmsLandingRunwayVisibility = this.fmsDataStore.landingRunway.map((rwy) =>
    rwy ? 'inherit' : 'hidden',
  );

  private arpCoordinates: Coordinates | undefined;

  private localPpos: Position = [];

  private landingRunwayNavdata: Runway | undefined;

  private btvUtils = new BrakeToVacateUtils(this.props.bus);

  private readonly airportDatabase = this.navigraphAvailable.map((a) => (a ? 'FBW9027250BB04' : 'N/A'));

  private readonly activeDatabase = Subject.create('30DEC-27JAN');

  public hEventConsumer = this.props.bus.getSubscriber<InternalKccuKeyEvent>().on('kccuKeyEvent');

  public interactionMode = Subject.create<InteractionMode>(InteractionMode.Touchscreen);

  private readonly radioAltitude1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('radioAltitude_1'));
  private readonly radioAltitude2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('radioAltitude_2'));
  private readonly radioAltitude3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('radioAltitude_3'));

  private readonly fwsFlightPhase = ConsumerSubject.create(this.sub.on('fwcFlightPhase'), 0);

  private showLdgShiftPanel() {
    if (this.mapDataLdgShiftPanelRef.getOrDefault() && this.mapDataMainRef.getOrDefault()) {
      this.mapDataLdgShiftPanelRef.instance.style.display = 'flex';
      this.mapDataMainRef.instance.style.display = 'none';
    }
  }

  private hideLdgShiftPanel() {
    if (this.mapDataLdgShiftPanelRef.getOrDefault() && this.mapDataMainRef.getOrDefault()) {
      this.mapDataLdgShiftPanelRef.instance.style.display = 'none';
      this.mapDataMainRef.instance.style.display = 'flex';
    }
  }

  private loadOansDb() {
    this.amdbClient
      .searchForAirports('')
      .then((airports) => {
        this.store.airports.set(airports);
        this.navigraphAvailable.set(true);
      })
      .catch(() => {
        this.store.airports.set([]);
        this.navigraphAvailable.set(false);
      });
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    new Promise((resolve) => setTimeout(resolve, 5000)).then(() => {});

    NavigationDatabaseService.activeDatabase = new NavigationDatabase(NavigationDatabaseBackend.Msfs);

    NavigationDatabaseService.activeDatabase.getDatabaseIdent().then((db) => {
      const from = new Date(db.effectiveFrom);
      const to = new Date(db.effectiveTo);
      this.activeDatabase.set(`${from.getDay()}${months[from.getMonth()]}-${to.getDay()}${months[to.getMonth()]}`);
    });

    NXDataStore.getAndSubscribe('NAVIGRAPH_ACCESS_TOKEN', () => this.loadOansDb());

    this.subs.push(
      this.props.isVisible.sub((it) => this.style.setValue('visibility', it ? 'visible' : 'hidden'), true),
    );

    this.subs.push(
      this.store.airports.sub(() =>
        this.sortAirports(this.store.airportSearchMode.get() ?? ControlPanelAirportSearchMode.Icao),
      ),
    );

    this.subs.push(
      this.store.airportSearchMode.sub((mode) => this.sortAirports(mode ?? ControlPanelAirportSearchMode.Icao)),
    );

    this.subs.push(
      this.store.airportSearchMode.sub(() => this.updateAirportSearchData(), true),
      this.store.sortedAirports.sub(() => this.updateAirportSearchData(), true),
    );

    // unfocus input fields on tab change
    this.subs.push(this.activeTabIndex.sub((_index) => Coherent.trigger('UNFOCUS_INPUT_FIELD')));

    this.subs.push(
      this.navigraphAvailable.sub((v) => {
        if (this.mapDataMainRef.getOrDefault() && this.mapDataBtvFallback.getOrDefault()) {
          this.mapDataMainRef.instance.style.display = v ? 'block' : 'none';
          this.mapDataBtvFallback.instance.style.display = v ? 'none' : 'block';
        }
        SimVar.SetSimVarValue('L:A32NX_OANS_AVAILABLE', SimVarValueType.Bool, v);
        this.props.bus.getPublisher<OansControlEvents>().pub('oansNotAvail', !v, true);
      }, true),
    );

    this.sub
      .on('latitude')
      .whenChanged()
      .handle((value) => {
        this.pposLatWord.setWord(value);
      });

    this.sub
      .on('longitude')
      .whenChanged()
      .handle((value) => {
        this.pposLonWord.setWord(value);
      });

    // This lead to BTV being disarmed at 300ft. We'll have to investigate and then fix FIXME
    /* this.btvUtils.below300ftRaAndLanding.sub((v) => {
      if (this.navigraphAvailable.get() === false && v && !this.btvUtils.runwayIsSet()) {
        this.setBtvRunwayFromFmsRunway();
      }
    });*/

    this.fmsDataStore.landingRunway.sub(async (it) => {
      // Set control panel display
      if (it) {
        this.availableEntityList.set([it.substring(4)]);
        this.selectedEntityType.set(EntityTypes.RWY);
        this.selectedEntityIndex.set(0);
        this.selectedEntityString.set(it.substring(4));

        // Load runway data
        const destination = this.fmsDataStore.destination.get();
        if (destination && this.navigraphAvailable.get() === true) {
          const data = await this.amdbClient.getAirportData(destination, [FeatureTypeString.RunwayThreshold]);
          const thresholdFeature = data.runwaythreshold?.features.filter(
            (td) => td.properties.feattype === FeatureType.RunwayThreshold && td.properties?.idthr === it.substring(4),
          );
          if (thresholdFeature && thresholdFeature[0]?.properties.lda && thresholdFeature[0]?.properties.tora) {
            this.runwayLda.set(
              (thresholdFeature[0].properties.lda > 0 ? thresholdFeature[0].properties.lda : 0).toFixed(0),
            );
            this.runwayTora.set(
              (thresholdFeature[0]?.properties.tora > 0 ? thresholdFeature[0].properties.tora : 0).toFixed(0),
            );
          } else {
            this.runwayLda.set('N/A');
            this.runwayTora.set('N/A');
          }
        } else if (destination && this.navigraphAvailable.get() === false) {
          this.setBtvRunwayFromFmsRunway();
        }
      }
    });

    this.sub
      .on('realTime')
      .atFrequency(1)
      .handle((_) => this.autoLoadAirport());

    this.sub
      .on('realTime')
      .atFrequency(5)
      .handle((_) => {
        const ppos: Coordinates = { lat: 0, long: 0 };
        ppos.lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'Degrees');
        ppos.long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'Degrees');

        if (this.arpCoordinates && ppos.lat && this.navigraphAvailable.get() === false) {
          globalToAirportCoordinates(this.arpCoordinates, ppos, this.localPpos);
          this.btvUtils.updateRemainingDistances(this.localPpos);
        }
      });

    this.selectedEntityIndex.sub((val) => this.selectedEntityString.set(this.availableEntityList.get(val ?? 0)));

    this.sub
      .on(this.props.side === 'L' ? 'kccuOnL' : 'kccuOnR')
      .whenChanged()
      .handle((it) => this.interactionMode.set(it ? InteractionMode.Kccu : InteractionMode.Touchscreen));
  }

  public updateAirportSearchData() {
    const searchMode = this.store.airportSearchMode.get();
    const sortedAirports = this.store.sortedAirports.getArray();

    const prop = ControlPanelUtils.getSearchModeProp(searchMode ?? ControlPanelAirportSearchMode.Icao);

    this.store.airportSearchData.set(sortedAirports.map((it) => (it[prop] as string).toUpperCase()));
  }

  public setSelectedAirport(airport: AmdbAirportSearchResult) {
    this.store.selectedAirport.set(airport);
    const foundIndex = this.store.sortedAirports.getArray().findIndex((it) => it.idarpt === airport.idarpt);
    this.store.airportSearchSelectedAirportIndex.set(foundIndex === -1 ? null : foundIndex);
  }

  private sortAirports(mode: ControlPanelAirportSearchMode) {
    const array = this.store.airports.getArray().slice();

    const prop = ControlPanelUtils.getSearchModeProp(mode);

    array.sort((a, b) => {
      if (a[prop] == null || b[prop] == null) {
        return 0;
      }

      if (a[prop] < b[prop]) {
        return -1;
      }
      if (a[prop] > b[prop]) {
        return 1;
      }
      return 0;
    });

    this.store.sortedAirports.set(array.filter((it) => it[prop] !== null));
  }

  private handleSelectAirport = (icao: string, indexInSearchData?: number) => {
    const airport = this.store.airports.getArray().find((it) => it.idarpt === icao);
    const prop = ControlPanelUtils.getSearchModeProp(
      this.store.airportSearchMode.get() ?? ControlPanelAirportSearchMode.Icao,
    );

    if (!airport || typeof airport[prop] !== 'string') {
      throw new Error('');
    }

    const firstLetter = airport[prop][0];
    this.store.airportSearchSelectedSearchLetterIndex.set(
      ControlPanelUtils.LETTERS.findIndex((it) => it === firstLetter),
    );

    const airportIndexInSearchData =
      indexInSearchData ?? this.store.sortedAirports.getArray().findIndex((it) => it.idarpt === icao);

    this.store.airportSearchSelectedAirportIndex.set(airportIndexInSearchData);
    this.store.selectedAirport.set(airport);
    this.store.isAirportSelectionPending.set(true);
  };

  private handleSelectSearchMode = (newSearchMode: ControlPanelAirportSearchMode) => {
    const selectedAirport = this.store.selectedAirport.get();

    this.store.airportSearchMode.set(newSearchMode);
    const prop = ControlPanelUtils.getSearchModeProp(newSearchMode);

    if (selectedAirport !== null && typeof selectedAirport[prop] === 'string') {
      const firstLetter = selectedAirport[prop][0];
      const airportIndexInSearchData = this.store.sortedAirports
        .getArray()
        .findIndex((it) => it.idarpt === selectedAirport.idarpt);

      this.store.airportSearchSelectedSearchLetterIndex.set(
        ControlPanelUtils.LETTERS.findIndex((it) => it === firstLetter),
      );
      this.store.airportSearchSelectedAirportIndex.set(airportIndexInSearchData);
    }
  };

  private handleDisplayAirport = () => {
    const selectedArpt = this.store.selectedAirport.get();
    if (!selectedArpt || !selectedArpt.idarpt) {
      throw new Error('[OANS] Empty airport selected for display.');
    }

    this.manualAirportSelection = true;
    this.props.bus.getPublisher<OansControlEvents>().pub('oansDisplayAirport', selectedArpt.idarpt, true);
    this.store.loadedAirport.set(selectedArpt);
    this.store.isAirportSelectionPending.set(false); // TODO should be done when airport is fully loaded
  };

  private autoLoadAirport() {
    // If airport has been manually selected, do not auto load.
    if (
      this.manualAirportSelection === true ||
      this.store.loadedAirport.get() !== this.store.selectedAirport.get() ||
      this.store.airports.length === 0
    ) {
      return;
    }
    // If on ground, and no airport is loaded, find current airport.
    if (![6, 7, 8, 9].includes(SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', SimVarValueType.Number))) {
      // Go through all airports, load if distance <20NM
      const nearestAirports = this.store.airports
        .getArray()
        .filter((ap) => distanceTo(this.presentPos.get(), { lat: ap.coordinates.lat, long: ap.coordinates.lon }) < 20);
      const sortedAirports = nearestAirports.sort(
        (a, b) =>
          distanceTo(this.presentPos.get(), { lat: a.coordinates.lat, long: a.coordinates.lon }) -
          distanceTo(this.presentPos.get(), { lat: b.coordinates.lat, long: b.coordinates.lon }),
      );
      if (sortedAirports.length > 0) {
        const ap = sortedAirports[0];
        if (ap.idarpt !== this.store.loadedAirport.get()?.idarpt) {
          this.handleSelectAirport(ap.idarpt);
          this.props.bus.getPublisher<OansControlEvents>().pub('oansDisplayAirport', ap.idarpt, true);
          this.store.loadedAirport.set(ap);
          this.store.isAirportSelectionPending.set(false); // TODO should be done when airport is fully loaded
        }
        return;
      }
    }
    // If in flight, load destination airport if distance is <50NM. This could cause stutters, consider deactivating.
    else {
      const destArpt = this.store.airports.getArray().find((it) => it.idarpt === this.fmsDataStore.destination.get());
      if (destArpt && destArpt.idarpt !== this.store.loadedAirport.get()?.idarpt) {
        if (distanceTo(this.presentPos.get(), { lat: destArpt.coordinates.lat, long: destArpt.coordinates.lon }) < 50) {
          this.handleSelectAirport(destArpt.idarpt);
          this.props.bus.getPublisher<OansControlEvents>().pub('oansDisplayAirport', destArpt.idarpt, true);
          this.store.loadedAirport.set(destArpt);
          this.store.isAirportSelectionPending.set(false); // TODO should be done when airport is fully loaded
          return;
        }
      }
    }
  }

  private async setBtvRunwayFromFmsRunway() {
    [this.landingRunwayNavdata, this.arpCoordinates] = await Oanc.setBtvRunwayFromFmsRunway(
      this.fmsDataStore,
      this.btvUtils,
    );

    if (this.landingRunwayNavdata) {
      this.runwayLda.set(this.landingRunwayNavdata.length.toFixed(0));
      this.runwayTora.set(this.landingRunwayNavdata.length.toFixed(0));
    }
  }

  render(): VNode {
    return (
      <>
        <IconButton
          ref={this.closePanelButtonRef}
          onClick={() => this.props.togglePanel()}
          icon="double-up"
          containerStyle="z-index: 10; width: 49px; height: 45px; position: absolute; right: 2px; top: 768px;"
        />
        <div class="oans-control-panel-background">
          <div ref={this.oansMenuRef} class="oans-control-panel" style={this.style}>
            <TopTabNavigator
              pageTitles={Subject.create(['MAP DATA', 'ARPT SEL', 'STATUS'])}
              selectedPageIndex={this.activeTabIndex}
              tabBarHeight={45}
              tabBarSlantedEdgeAngle={30}
              selectedTabTextColor="cyan"
              additionalRightSpace={50}
            >
              <TopTabNavigatorPage>
                <div class="oans-cp-map-data-tab">
                  <div class="oans-cp-map-data-left">
                    <DropdownMenu
                      values={this.availableEntityList}
                      selectedIndex={this.selectedEntityIndex}
                      idPrefix="oanc-search-letter"
                      freeTextAllowed={false}
                      onModified={(i) => this.selectedEntityIndex.set(i)}
                      inactive={Subject.create(true)}
                      hEventConsumer={this.hEventConsumer}
                      interactionMode={this.interactionMode}
                    />
                    <div class="oans-cp-map-data-entitytype">
                      <RadioButtonGroup
                        values={this.availableEntityTypes}
                        valuesDisabled={Subject.create(Array(4).fill(true))}
                        selectedIndex={this.selectedEntityType}
                        idPrefix="entityTypesRadio"
                      />
                    </div>
                  </div>
                  <div ref={this.mapDataLdgShiftPanelRef} class="oans-cp-map-data-ldg-shift">
                    <div class="oans-cp-map-data-ldg-shift-rwy">
                      <div class="mfd-label-value-container" style="padding: 15px;">
                        <span class="mfd-label mfd-spacing-right">RWY</span>
                        <span class="mfd-value">{this.selectedEntityString}</span>
                      </div>
                    </div>
                    <div class="oans-cp-map-data-ldg-shift-1">
                      <div class="oans-cp-map-data-ldg-shift-2">
                        <div class="oans-cp-map-data-ldg-shift-3">
                          <span class="mfd-label mfd-spacing-right bigger" style="justify-self: flex-end">
                            THRESHOLD SHIFT
                          </span>
                          <InputField<number>
                            dataEntryFormat={new LengthFormat(Subject.create(0), Subject.create(4000))}
                            value={this.thresholdShift}
                            mandatory={Subject.create(false)}
                            hEventConsumer={this.hEventConsumer}
                            interactionMode={this.interactionMode}
                          />
                          <span class="mfd-label mfd-spacing-right bigger" style="justify-self: flex-end">
                            END SHIFT
                          </span>
                          <InputField<number>
                            dataEntryFormat={new LengthFormat(Subject.create(0), Subject.create(4000))}
                            value={this.endShift}
                            mandatory={Subject.create(false)}
                            hEventConsumer={this.hEventConsumer}
                            interactionMode={this.interactionMode}
                          />
                        </div>
                        <div class="oans-cp-map-data-ldg-shift-return-button">
                          <Button
                            label="RETURN"
                            buttonStyle="padding: 7px 15px 5px 15px;"
                            onClick={() => this.hideLdgShiftPanel()}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div ref={this.mapDataMainRef} class="oans-cp-map-data-main">
                    <div class="oans-cp-map-data-main-2">
                      <Button
                        label="ADD CROSS"
                        onClick={() => console.log('ADD CROSS')}
                        buttonStyle="flex: 1"
                        disabled={Subject.create(true)}
                      />
                      <Button
                        label="ADD FLAG"
                        onClick={() => console.log('ADD FLAG')}
                        buttonStyle="flex: 1; margin-left: 10px; margin-right: 10px"
                        disabled={Subject.create(true)}
                      />
                      <Button
                        label="LDG SHIFT"
                        onClick={() => this.showLdgShiftPanel()}
                        buttonStyle="flex: 1"
                        disabled={Subject.create(true)}
                      />
                    </div>
                    <div class="oans-cp-map-data-main-center">
                      <Button
                        label={`CENTER MAP ON ${this.availableEntityList.get(this.selectedEntityIndex.get() ?? 0)}`}
                        onClick={() =>
                          console.log(
                            `CENTER MAP ON ${this.availableEntityList.get(this.selectedEntityIndex.get() ?? 0)}`,
                          )
                        }
                        disabled={Subject.create(true)}
                      />
                    </div>
                    <OansRunwayInfoBox
                      rwyOrStand={this.selectedEntityType}
                      selectedEntity={this.selectedEntityString}
                      tora={this.runwayTora}
                      lda={this.runwayLda}
                      ldaIsReduced={Subject.create(false)}
                      coordinate={Subject.create('----')}
                    />
                  </div>
                  <div ref={this.mapDataBtvFallback} class="oans-cp-map-data-btv-fallback">
                    <div class="oans-cp-map-data-btv-button">
                      <div class="mfd-label" style="margin-right: 10px;">
                        BTV MANUAL CONTROL / FALLBACK
                      </div>
                    </div>
                    <div
                      class="oans-cp-map-data-btv-rwy-length"
                      style={{ visibility: this.fmsLandingRunwayVisibility }}
                    >
                      <div class="mfd-label" style="margin-right: 10px;">
                        RUNWAY LENGTH
                      </div>
                      <span class="mfd-value smaller">
                        {this.runwayLda}
                        <span style="color: rgb(33, 33, 255)">M</span>
                      </span>
                    </div>
                    <div
                      class="oans-cp-map-data-btv-rwy-length"
                      style={{ visibility: this.fmsLandingRunwayVisibility }}
                    >
                      <div class="mfd-label" style="margin-right: 10px;">
                        BTV STOP DISTANCE
                      </div>
                      <div>
                        <InputField<number>
                          dataEntryFormat={new LengthFormat(Subject.create(0), Subject.create(4000))}
                          dataHandlerDuringValidation={async (val) => {
                            if (this.navigraphAvailable.get() === false) {
                              SimVar.SetSimVarValue(
                                'L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE',
                                SimVarValueType.Number,
                                val,
                              );

                              if (val && this.landingRunwayNavdata && this.arpCoordinates) {
                                const exitLocation = placeBearingDistance(
                                  this.landingRunwayNavdata.thresholdLocation,
                                  this.landingRunwayNavdata.bearing,
                                  val / MathUtils.METRES_TO_NAUTICAL_MILES,
                                );
                                const localExitPos: Position = [0, 9];
                                globalToAirportCoordinates(this.arpCoordinates, exitLocation, localExitPos);

                                this.btvUtils.selectExitFromManualEntry(val, localExitPos);
                              }
                            }
                          }}
                          value={this.reqStoppingDistance}
                          mandatory={Subject.create(false)}
                          inactive={this.selectedEntityString.map((it) => !it)}
                          hEventConsumer={this.hEventConsumer}
                          interactionMode={this.interactionMode}
                        />
                      </div>
                    </div>
                    <div
                      class="oans-cp-map-data-btv-rwy-length"
                      style={{ visibility: this.fmsLandingRunwayVisibility }}
                    >
                      <div class="mfd-label amber" style="margin-right: 10px;">
                        SELECT LANDING RUNWAY IN FMS
                      </div>
                    </div>
                  </div>
                </div>
              </TopTabNavigatorPage>
              <TopTabNavigatorPage>
                <div class="oans-cp-arpt-sel">
                  <div class="oans-cp-arpt-sel-2">
                    <div style="display: flex;">
                      <DropdownMenu
                        ref={this.airportSearchAirportDropdownRef}
                        values={this.store.airportSearchData}
                        selectedIndex={this.store.airportSearchSelectedAirportIndex}
                        onModified={(newSelectedIndex) => {
                          this.handleSelectAirport(
                            this.store.sortedAirports.get(newSelectedIndex ?? 0).idarpt,
                            newSelectedIndex ?? undefined,
                          );
                        }}
                        freeTextAllowed={false}
                        numberOfDigitsForInputField={7}
                        alignLabels={this.store.airportSearchMode.map((it) =>
                          it === ControlPanelAirportSearchMode.City ? 'flex-start' : 'center',
                        )}
                        idPrefix="oanc-search-airport"
                        hEventConsumer={this.hEventConsumer}
                        interactionMode={this.interactionMode}
                      />
                    </div>
                    <div class="oans-cp-arpt-sel-radio">
                      <RadioButtonGroup
                        values={['ICAO', 'IATA', 'CITY NAME']}
                        selectedIndex={this.store.airportSearchMode}
                        onModified={(newSelectedIndex) => {
                          switch (newSelectedIndex) {
                            case 0:
                              this.handleSelectSearchMode(ControlPanelAirportSearchMode.Icao);
                              break;
                            case 1:
                              this.handleSelectSearchMode(ControlPanelAirportSearchMode.Iata);
                              break;
                            default:
                              this.handleSelectSearchMode(ControlPanelAirportSearchMode.City);
                              break;
                          }
                        }}
                        idPrefix="oanc-search"
                      />
                    </div>
                  </div>
                  <div id="ArptSelMiddle" class="oans-cp-arpt-sel-middle">
                    <div class="oans-cp-arpt-sel-middle-1">
                      <span class="mfd-value">
                        {this.store.selectedAirport.map((it) => it?.name?.substring(0, 18).toUpperCase() ?? '')}
                      </span>
                      <span class="mfd-value">
                        {this.store.selectedAirport.map((it) => {
                          if (!it) {
                            return '';
                          }

                          return `${it.idarpt}       ${it.iata}`;
                        })}
                      </span>
                      <span class="mfd-value">
                        {this.store.selectedAirport.map((it) => {
                          if (!it) {
                            return '';
                          }

                          return `${ControlPanelUtils.LAT_FORMATTER(it.coordinates.lat)}/${ControlPanelUtils.LONG_FORMATTER(it.coordinates.lon)}`;
                        })}
                      </span>
                    </div>
                    <div style="flex-grow: 1;" />
                    <div class="oans-cp-arpt-sel-display-arpt">
                      <Button
                        ref={this.displayAirportButtonRef}
                        label="DISPLAY AIRPORT"
                        onClick={() => this.handleDisplayAirport()}
                        buttonStyle="width: 100%"
                      />
                    </div>
                  </div>
                  <div class="oans-cp-arpt-sel-fms">
                    <Button
                      label={this.fmsDataStore.origin.map((it) => (it ? <>{it}</> : <>ORIGIN</>))}
                      onClick={() => {
                        const airport = this.fmsDataStore.origin.get();
                        if (airport) {
                          this.handleSelectAirport(airport);
                        }
                      }}
                      disabled={this.fmsDataStore.origin.map((it) => !it)}
                      buttonStyle="width: 100px;"
                    />
                    <Button
                      label={this.fmsDataStore.destination.map((it) => (it ? <>{it}</> : <>DEST</>))}
                      onClick={() => {
                        const airport = this.fmsDataStore.destination.get();
                        if (airport) {
                          this.handleSelectAirport(airport);
                        }
                      }}
                      disabled={this.fmsDataStore.destination.map((it) => !it)}
                      buttonStyle="width: 100px;"
                    />
                    <Button
                      label={this.fmsDataStore.alternate.map((it) => (it ? <>{it}</> : <>ALTN</>))}
                      onClick={() => {
                        const airport = this.fmsDataStore.alternate.get();
                        if (airport) {
                          this.handleSelectAirport(airport);
                        }
                      }}
                      disabled={this.fmsDataStore.alternate.map((it) => !it)}
                      buttonStyle="width: 100px;"
                    />
                  </div>
                </div>
              </TopTabNavigatorPage>
              <TopTabNavigatorPage containerStyle="justify-content: space-between; align-content: space-between; justify-items: space-between;">
                <div class="oans-cp-status">
                  <div class="oans-cp-status-active">
                    <span class="mfd-label" style="margin-bottom: 10px;">
                      ACTIVE
                    </span>
                    <span class="mfd-value bigger">{this.activeDatabase}</span>
                  </div>
                  <div class="oans-cp-status-2">
                    <Button
                      label="SWAP"
                      disabled={this.navigraphAvailable}
                      onClick={() => this.loadOansDb()}
                      buttonStyle="padding: 20px 30px 20px 30px;"
                    />
                  </div>
                  <div class="oans-cp-status-second">
                    <span class="mfd-label" style="margin-bottom: 10px;">
                      SECOND
                    </span>
                    <span class="mfd-value smaller">{this.activeDatabase}</span>
                  </div>
                </div>
                <div class="oans-cp-status-db">
                  <span class="mfd-label">AIRPORT DATABASE</span>
                  <span class="mfd-value">{this.airportDatabase}</span>
                </div>
                <div class="oans-cp-status-1">
                  <span class="mfd-label bigger" />
                </div>
              </TopTabNavigatorPage>
            </TopTabNavigator>
          </div>
        </div>
      </>
    );
  }
}
