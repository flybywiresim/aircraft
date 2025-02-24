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
  SimVarValueType,
  Subject,
  Subscribable,
  Subscription,
  Unit,
  UnitFamily,
  UnitType,
  VNode,
} from '@microsoft/msfs-sdk';
import {
  ControlPanelAirportSearchMode,
  ControlPanelMapDataSearchMode,
  ControlPanelStore,
  ControlPanelUtils,
  FmsDataStore,
  MIN_TOUCHDOWN_ZONE_DISTANCE,
  NavigraphAmdbClient,
  OansBrakeToVacateSelection,
  OansControlEvents,
  globalToAirportCoordinates,
} from '@flybywiresim/oanc';
import {
  AmdbAirportSearchResult,
  AmdbProperties,
  Arinc429LocalVarConsumerSubject,
  BtvData,
  EfisSide,
  FeatureType,
  FeatureTypeString,
  FmsOansData,
  MathUtils,
  NXDataStore,
  NXLogicConfirmNode,
  Runway,
} from '@flybywiresim/fbw-sdk';

import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { OansRunwayInfoBox } from './OANSRunwayInfoBox';
import { DropdownMenu } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/DropdownMenu';
import { RadioButtonGroup } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/RadioButtonGroup';
import { InputField, InteractionMode } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { LengthFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { IconButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/IconButton';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/TopTabNavigator';
import { Coordinates, distanceTo, placeBearingDistance } from 'msfs-geo';
import { AdirsSimVars } from 'instruments/src/MsfsAvionicsCommon/SimVarTypes';
import { InternalKccuKeyEvent } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { NDSimvars } from 'instruments/src/ND/NDSimvarPublisher';
import { Feature, Geometry, LineString, Point, Position } from '@turf/turf';
import { NavigationDatabaseService } from '@fmgc/flightplanning/NavigationDatabaseService';
import { NavigationDatabase, NavigationDatabaseBackend } from '@fmgc/NavigationDatabase';
import { ResetPanelSimvars } from 'instruments/src/MsfsAvionicsCommon/providers/ResetPanelPublisher';

export interface OansProps extends ComponentProps {
  bus: EventBus;
  side: EfisSide;
  isVisible: Subscribable<boolean>;
  togglePanel: () => void;
}

const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export class OansControlPanel extends DisplayComponent<OansProps> {
  private readonly subs: Subscription[] = [];

  private readonly sub = this.props.bus.getSubscriber<
    ClockEvents & FmsOansData & AdirsSimVars & NDSimvars & BtvData & OansControlEvents & ResetPanelSimvars
  >();

  /** If navigraph not available, this class will compute BTV features */
  private readonly navigraphAvailable = Subject.create(false);
  private readonly oansResetPulled = ConsumerSubject.create(this.sub.on('a380x_reset_panel_arpt_nav'), false);

  private oansPerformanceModeSettingSub = () => {};
  private readonly oansPerformanceMode = Subject.create(false);
  private showOans = false;
  private lastUpdateTime: number | null = null;
  private readonly oansPerformanceModeAndMovedOutOfZoomRange = new NXLogicConfirmNode(60, true);

  private readonly oansAvailable = MappedSubject.create(
    ([ng, reset]) => ng && !reset,
    this.navigraphAvailable,
    this.oansResetPulled,
  );

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

  private readonly availableEntityTypes = ['RWY', 'TWY', 'STAND', 'OTHER'];

  private mapDataFeatures: Feature<Geometry, AmdbProperties>[] | undefined = undefined;

  private readonly thresholdShift = Subject.create<number | null>(null);

  private readonly endShift = Subject.create<number | null>(null);

  private readonly selectedEntityType = Subject.create<ControlPanelMapDataSearchMode | null>(
    ControlPanelMapDataSearchMode.Runway,
  );

  private readonly availableEntityList = ArraySubject.create(['']);

  private readonly selectedEntityIndex = Subject.create<number | null>(0);

  private readonly selectedEntityString = Subject.create<string | null>(null);

  private readonly entityIsNotSelected = this.selectedEntityIndex.map((i) => i === null);

  private selectedEntityPosition: Position = [];

  private readonly selectedFeatureId = Subject.create<number | null>(null);
  private readonly selectedFeatureType = Subject.create<FeatureType | null>(null);

  private readonly symbolsForFeatureIds = ConsumerSubject.create(this.sub.on('oans_symbols_for_feature_ids'), {
    featureIdsWithCrosses: [],
    featureIdsWithFlags: [],
  });

  private readonly flagExistsForEntity = MappedSubject.create(
    ([symbols, id]) => symbols.featureIdsWithFlags.some((f) => f === id),
    this.symbolsForFeatureIds,
    this.selectedFeatureId,
  );

  private readonly crossExistsForEntity = MappedSubject.create(
    ([symbols, id]) => symbols.featureIdsWithCrosses.some((f) => f === id),
    this.symbolsForFeatureIds,
    this.selectedFeatureId,
  );

  private manualAirportSelection = false;

  // TODO: Should be using GPS position interpolated with IRS velocity data
  private readonly pposLatWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('latitude'));

  private readonly pposLongWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('longitude'));

  private readonly presentPos = MappedSubject.create(
    ([lat, lon]) => {
      return { lat: lat.value, long: lon.value } as Coordinates;
    },
    this.pposLatWord,
    this.pposLongWord,
  );

  private readonly presentPosNotAvailable = MappedSubject.create(
    ([lat, long]) => !lat.isNormalOperation() || !long.isNormalOperation(),
    this.pposLatWord,
    this.pposLongWord,
  );

  private readonly setPlanModeConsumer = ConsumerSubject.create(this.sub.on('oans_show_set_plan_mode'), false);
  private readonly setPlanModeDisplay = this.setPlanModeConsumer.map((it) => (it ? 'inherit' : 'none'));

  private readonly fmsDataStore = new FmsDataStore(this.props.bus);

  private readonly runwayTora = Subject.create<string | null>(null);

  private readonly runwayLda = Subject.create<string | null>(null);

  private readonly standCoordinateString = Subject.create<string>('');

  private readonly oansRequestedStoppingDistance = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('oansRequestedStoppingDistance'),
  );

  // Need to add touchdown zone distance to displayed value. BTV computes from TDZ internally,
  // but users enter LDA from threshold
  private readonly reqStoppingDistance = this.oansRequestedStoppingDistance.map((it) =>
    it.isNormalOperation() ? Math.round(it.value + MIN_TOUCHDOWN_ZONE_DISTANCE) : null,
  );

  private readonly fmsLandingRunwayNotSelectedInFallback = MappedSubject.create(
    ([ldgRwy, avail]) => !avail && ldgRwy === null,
    this.fmsDataStore.landingRunway,
    this.oansAvailable,
  );
  private readonly fmsLandingRunwayVisibility = this.fmsLandingRunwayNotSelectedInFallback.map((notSelected) =>
    !notSelected ? 'inherit' : 'hidden',
  );

  private arpCoordinates: Coordinates | undefined;

  private localPpos: Position = [];

  private landingRunwayNavdata: Runway | undefined;

  private btvUtils = new OansBrakeToVacateSelection(this.props.bus);

  private readonly airportDatabase = this.navigraphAvailable.map((a) => (a ? 'FBW9027250BB04' : 'N/A'));

  private readonly activeDatabase = Subject.create('30DEC-27JAN');

  public hEventConsumer = this.props.bus.getSubscriber<InternalKccuKeyEvent>().on('kccuKeyEvent');

  public interactionMode = Subject.create<InteractionMode>(InteractionMode.Touchscreen);

  private lengthUnit = Subject.create<Unit<UnitFamily.Distance>>(UnitType.METER);

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
      this.activeDatabase.set(`${from.getDate()}${months[from.getMonth()]}-${to.getDate()}${months[to.getMonth()]}`);
    });

    NXDataStore.getAndSubscribe('NAVIGRAPH_ACCESS_TOKEN', () => this.loadOansDb());

    NXDataStore.getAndSubscribe(
      'CONFIG_USING_METRIC_UNIT',
      (key, value) => {
        this.lengthUnit.set(value === '0' ? UnitType.FOOT : UnitType.METER);
      },
      '1',
    );

    this.subs.push(
      this.props.isVisible.sub((it) => this.style.setValue('visibility', it ? 'inherit' : 'hidden'), true),
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
      this.oansAvailable.sub((v) => {
        if (this.mapDataMainRef.getOrDefault() && this.mapDataBtvFallback.getOrDefault()) {
          this.mapDataMainRef.instance.style.display = v ? 'block' : 'none';
          this.mapDataBtvFallback.instance.style.display = v ? 'none' : 'block';
        }
        SimVar.SetSimVarValue('L:A32NX_OANS_AVAILABLE', SimVarValueType.Bool, v);
        this.props.bus.getPublisher<OansControlEvents>().pub('oans_not_avail', !v, true, false);
      }, true),
    );

    this.subs.push(
      this.oansResetPulled.sub((v) => {
        if (v) {
          this.unloadCurrentAirport();
        }
      }, true),
    );

    this.oansPerformanceModeSettingSub = NXDataStore.getAndSubscribe(
      'CONFIG_A380X_OANS_PERFORMANCE_MODE',
      (_, v) => this.oansPerformanceMode.set(v === '1'),
      '0',
    );

    this.subs.push(
      this.fmsDataStore.landingRunway.sub(async (it) => {
        // Set control panel display
        if (it) {
          // Load runway data
          const destination = this.fmsDataStore.destination.get();
          if (destination && this.oansAvailable.get() === false) {
            this.setBtvRunwayFromFmsRunway();
          }
        }
      }),
    );

    this.subs.push(
      this.sub
        .on('nd_show_oans')
        .whenChanged()
        .handle((showOans) => {
          if (this.props.side === showOans.side) {
            this.showOans = showOans.show;
          }
        }),
    );

    this.subs.push(
      this.sub
        .on('realTime')
        .atFrequency(0.5)
        .handle((time) => {
          this.oansPerformanceModeAndMovedOutOfZoomRange.write(
            this.oansPerformanceMode.get() && !this.showOans,
            this.lastUpdateTime === null ? 0 : time - this.lastUpdateTime,
          );
          this.props.bus.getPublisher<OansControlEvents>().pub(
            'oans_performance_mode_hide',
            {
              side: this.props.side,
              hide: this.oansPerformanceModeAndMovedOutOfZoomRange.read(),
            },
            true,
          );
          this.autoLoadAirport();

          this.lastUpdateTime = time;
        }),
    );

    this.subs.push(
      this.sub
        .on('realTime')
        .atFrequency(5)
        .handle((_) => {
          if (this.arpCoordinates && !this.oansAvailable.get()) {
            globalToAirportCoordinates(this.arpCoordinates, this.presentPos.get(), this.localPpos);
            this.props.bus.getPublisher<FmsOansData>().pub('oansAirportLocalCoordinates', this.localPpos, true);
          }
        }),
    );

    this.subs.push(this.sub.on('oans_display_airport').handle((arpt) => this.handleSelectAirport(arpt)));

    this.subs.push(
      this.selectedEntityIndex.sub((val) => {
        const searchMode = this.selectedEntityType.get();
        if (searchMode !== null && this.mapDataFeatures && val !== null) {
          const prop = ControlPanelUtils.getMapDataSearchModeProp(searchMode);
          const idx = this.mapDataFeatures.findIndex((f) => f.properties[prop] === this.availableEntityList.get(val));
          this.selectedEntityString.set(
            idx !== -1 ? this.mapDataFeatures[idx]?.properties[prop]?.toString() ?? '' : '',
          );

          if (
            (idx !== -1 && searchMode === ControlPanelMapDataSearchMode.Runway) ||
            searchMode === ControlPanelMapDataSearchMode.Stand
          ) {
            const feature = this.mapDataFeatures[idx] as Feature<Point>;
            this.selectedEntityPosition = feature.geometry.coordinates;
            this.selectedFeatureId.set(feature.properties?.id);
            this.selectedFeatureType.set(feature.properties?.feattype);
          } else if (
            idx !== -1 &&
            (searchMode === ControlPanelMapDataSearchMode.Taxiway || searchMode === ControlPanelMapDataSearchMode.Other)
          ) {
            const taxiway = this.mapDataFeatures[idx] as Feature<LineString, AmdbProperties>;
            this.selectedEntityPosition = taxiway.properties.midpoint?.coordinates ?? [0, 0];
            this.selectedFeatureId.set(taxiway.properties?.id);
            this.selectedFeatureType.set(taxiway.properties?.feattype);
          }

          if (idx !== -1 && this.selectedEntityType.get() === ControlPanelMapDataSearchMode.Runway) {
            this.runwayLda.set(this.mapDataFeatures[idx].properties.lda?.toFixed(0) ?? '');
            this.runwayTora.set(this.mapDataFeatures[idx].properties.tora?.toFixed(0) ?? '');
          }
        } else if (this.oansAvailable.get()) {
          this.selectedEntityString.set('');
          this.runwayLda.set('');
          this.runwayTora.set('');
        }
      }, true),
    );
    this.subs.push(
      this.selectedEntityType.sub((v) => this.handleSelectMapDataSearchMode(v ?? ControlPanelMapDataSearchMode.Runway)),
    );

    this.subs.push(
      this.sub
        .on(this.props.side === 'L' ? 'kccuOnL' : 'kccuOnR')
        .whenChanged()
        .handle((it) => this.interactionMode.set(it ? InteractionMode.Kccu : InteractionMode.Touchscreen)),
    );

    this.subs.push(
      this.setPlanModeConsumer,
      this.setPlanModeDisplay,
      this.oansResetPulled,
      this.oansAvailable,
      this.entityIsNotSelected,
      this.symbolsForFeatureIds,
      this.flagExistsForEntity,
      this.crossExistsForEntity,
      this.pposLatWord,
      this.pposLongWord,
      this.presentPos,
      this.presentPosNotAvailable,
      this.oansRequestedStoppingDistance,
      this.reqStoppingDistance,
      this.fmsLandingRunwayVisibility,
      this.airportDatabase,
    );
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

  private handleSelectAirport = async (icao: string, indexInSearchData?: number) => {
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

    this.handleSelectMapDataSearchMode(ControlPanelMapDataSearchMode.Runway);

    this.store.isAirportSelectionPending.set(true);
  };

  private handleSelectMapDataSearchMode = async (newSearchMode: ControlPanelMapDataSearchMode) => {
    const selectedAirport = this.store.selectedAirport.get();
    this.selectedEntityIndex.set(null);

    if (selectedAirport !== null) {
      let featureType: FeatureTypeString = FeatureTypeString.RunwayThreshold;
      switch (newSearchMode) {
        case ControlPanelMapDataSearchMode.Runway:
          featureType = FeatureTypeString.RunwayThreshold;
          break;
        case ControlPanelMapDataSearchMode.Taxiway:
          featureType = FeatureTypeString.TaxiwayGuidanceLine;
          break;
        case ControlPanelMapDataSearchMode.Stand:
          featureType = FeatureTypeString.ParkingStandLocation;
          break;
        case ControlPanelMapDataSearchMode.Other:
          featureType = FeatureTypeString.DeicingArea;
          break;
        default:
          break;
      }
      // Populate MAP DATA
      const data = await this.amdbClient.getAirportData(selectedAirport.idarpt, [featureType]);
      this.mapDataFeatures = data[featureType]?.features;
      if (this.mapDataFeatures) {
        const prop = ControlPanelUtils.getMapDataSearchModeProp(newSearchMode);
        const entityData = this.mapDataFeatures
          .map((f) => f.properties[prop]?.toString().trim().substring(0, 6) ?? '')
          .filter((it) => it);
        this.availableEntityList.set([...new Set(entityData)].sort());
      }
    }
  };

  private handleSelectAirportSearchMode = (newSearchMode: ControlPanelAirportSearchMode) => {
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
    this.props.bus.getPublisher<OansControlEvents>().pub('oans_display_airport', selectedArpt.idarpt, true);
    this.store.loadedAirport.set(selectedArpt);
    this.store.isAirportSelectionPending.set(false); // TODO should be done when airport is fully loaded
  };

  private handleCrossButton() {
    {
      const selId = this.selectedFeatureId.get();
      const selFeatType = this.selectedFeatureType.get();
      if (selId !== null && selFeatType !== null) {
        this.props.bus
          .getPublisher<OansControlEvents>()
          .pub(
            this.crossExistsForEntity.get() ? 'oans_remove_cross_at_feature' : 'oans_add_cross_at_feature',
            { id: selId, feattype: selFeatType },
            true,
          );
      }
    }
  }

  private handleFlagButton() {
    {
      const selId = this.selectedFeatureId.get();
      const selFeatType = this.selectedFeatureType.get();
      if (selId !== null && selFeatType !== null) {
        this.props.bus
          .getPublisher<OansControlEvents>()
          .pub(
            this.flagExistsForEntity.get() ? 'oans_remove_flag_at_feature' : 'oans_add_flag_at_feature',
            { id: selId, feattype: selFeatType },
            true,
          );
      }
    }
  }

  private unloadCurrentAirport() {
    if (this.store.loadedAirport.get()) {
      this.props.bus.getPublisher<OansControlEvents>().pub('oans_display_airport', '', true);
      this.store.loadedAirport.set(null);
      this.store.isAirportSelectionPending.set(false);
    }
  }

  private autoLoadAirport() {
    // If we don't have ppos or airport unloaded due to performance reasons, do not try to auto load
    // If airport has been manually selected, do not auto load.
    // FIXME reset manualAirportSelection after a while, to enable auto-load for destination even if departure was selected manually
    if (
      this.presentPosNotAvailable.get() ||
      this.oansPerformanceModeAndMovedOutOfZoomRange.read() ||
      this.manualAirportSelection === true ||
      this.store.loadedAirport.get() !== this.store.selectedAirport.get() ||
      this.store.airports.length === 0 ||
      this.oansResetPulled.get()
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
          this.props.bus.getPublisher<OansControlEvents>().pub('oans_display_airport', ap.idarpt, true);
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
          this.props.bus.getPublisher<OansControlEvents>().pub('oans_display_airport', destArpt.idarpt, true);
          this.store.loadedAirport.set(destArpt);
          this.store.isAirportSelectionPending.set(false); // TODO should be done when airport is fully loaded
          return;
        }
      }
    }
  }

  private async setBtvRunwayFromFmsRunway() {
    const destination = this.fmsDataStore.destination.get();
    const rwyIdent = this.fmsDataStore.landingRunway.get();

    if (destination && rwyIdent) {
      [this.landingRunwayNavdata, this.arpCoordinates] = await this.btvUtils.setBtvRunwayFromFmsRunway(
        destination,
        rwyIdent,
      );
      this.runwayLda.set(this.landingRunwayNavdata.length.toFixed(0));
      this.runwayTora.set(this.landingRunwayNavdata.length.toFixed(0));
    }
  }

  private async btvFallbackSetDistance(distance: number | null) {
    if (!this.oansAvailable.get()) {
      if (distance && distance > MIN_TOUCHDOWN_ZONE_DISTANCE && this.landingRunwayNavdata && this.arpCoordinates) {
        const exitLocation = placeBearingDistance(
          this.landingRunwayNavdata.thresholdLocation,
          this.landingRunwayNavdata.bearing,
          distance / MathUtils.METRES_TO_NAUTICAL_MILES,
        );
        const localExitPos: Position = [0, 0];
        globalToAirportCoordinates(this.arpCoordinates, exitLocation, localExitPos);

        this.btvUtils.selectExitFromManualEntry(distance, localExitPos);
      }
    }
  }

  destroy(): void {
    for (const s of this.subs) {
      s.destroy();
    }
    this.oansPerformanceModeSettingSub();
    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <div style={{ display: this.props.isVisible.map((v) => (v ? 'inherit' : 'none')) }}>
          <IconButton
            ref={this.closePanelButtonRef}
            onClick={() => this.props.togglePanel()}
            icon="double-up"
            containerStyle="z-index: 10; width: 49px; height: 45px; position: absolute; right: 2px; top: 768px;"
          />
        </div>
        <div style={{ display: this.props.isVisible.map((v) => (v ? 'none' : 'inherit')) }}>
          <IconButton
            ref={this.closePanelButtonRef}
            onClick={() => this.props.togglePanel()}
            icon="double-down"
            containerStyle="z-index: 10; width: 49px; height: 45px; position: absolute; right: 2px; top: 768px;"
          />
        </div>
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
                      inactive={this.fmsLandingRunwayNotSelectedInFallback}
                      hEventConsumer={this.hEventConsumer}
                      interactionMode={this.interactionMode}
                    />
                    <div class="oans-cp-map-data-entitytype">
                      <RadioButtonGroup
                        values={this.availableEntityTypes}
                        valuesDisabled={Subject.create(Array(4).fill(false))}
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
                        label={this.crossExistsForEntity.map((e) => (e ? <>DEL CROSS</> : <>ADD CROSS</>))}
                        onClick={() => this.handleCrossButton()}
                        buttonStyle="flex: 1"
                        disabled={this.entityIsNotSelected}
                      />
                      <Button
                        label={this.flagExistsForEntity.map((e) => (e ? <>DEL FLAG</> : <>ADD FLAG</>))}
                        onClick={() => this.handleFlagButton()}
                        buttonStyle="flex: 1; margin-left: 10px; margin-right: 10px"
                        disabled={this.entityIsNotSelected}
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
                        label={this.selectedEntityString.map((s) => (
                          <>`CENTER MAP ON ${s}`</>
                        ))}
                        onClick={() => {
                          if (this.selectedEntityPosition) {
                            this.props.bus
                              .getPublisher<OansControlEvents>()
                              .pub('oans_center_map_on', this.selectedEntityPosition, true);
                          }
                        }}
                        disabled={this.entityIsNotSelected}
                      />
                    </div>
                    <OansRunwayInfoBox
                      rwyOrStand={this.selectedEntityType}
                      selectedEntity={this.selectedEntityString}
                      tora={this.runwayTora}
                      lda={this.runwayLda}
                      ldaIsReduced={Subject.create(false)}
                      coordinate={Subject.create('----')}
                      lengthUnit={this.lengthUnit}
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
                        <InputField<number, number, false>
                          dataEntryFormat={new LengthFormat(Subject.create(0), Subject.create(4000))}
                          dataHandlerDuringValidation={async (val) => this.btvFallbackSetDistance(val)}
                          readonlyValue={this.reqStoppingDistance}
                          mandatory={Subject.create(false)}
                          inactive={this.fmsLandingRunwayNotSelectedInFallback}
                          hEventConsumer={this.hEventConsumer}
                          interactionMode={this.interactionMode}
                        />
                      </div>
                    </div>
                    <div
                      class="oans-cp-map-data-btv-rwy-length"
                      style={{
                        visibility: this.fmsLandingRunwayVisibility.map((it) =>
                          it === 'hidden' ? 'inherit' : 'hidden',
                        ),
                      }}
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
                              this.handleSelectAirportSearchMode(ControlPanelAirportSearchMode.Icao);
                              break;
                            case 1:
                              this.handleSelectAirportSearchMode(ControlPanelAirportSearchMode.Iata);
                              break;
                            default:
                              this.handleSelectAirportSearchMode(ControlPanelAirportSearchMode.City);
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
                      <span class="mfd-label bigger" style={{ display: this.setPlanModeDisplay }}>
                        SET PLAN MODE
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
                      disabled={this.oansAvailable}
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

interface EraseSymbolsDialogProps extends ComponentProps {
  visible: Subscribable<boolean>;
  confirmAction: () => void;
  hideDialog: () => void;
  /** True: Cross, false: flag */
  isCross: boolean;
}

/*
 * ERASE ALL xxx dialog
 */
export class EraseSymbolsDialog extends DisplayComponent<EraseSymbolsDialogProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  private topRef = FSComponent.createRef<HTMLDivElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.visible.sub((val) => {
        if (this.topRef.getOrDefault()) {
          this.topRef.instance.style.display = val ? 'block' : 'none';
        }
      }, true),
    );
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    for (const x of this.subs) {
      x.destroy();
    }
    super.destroy();
  }

  render(): VNode {
    return (
      <div ref={this.topRef}>
        <div class="mfd-dialog" style="left: 209px; top: 350px; width: 350px;">
          <div class="mfd-dialog-title" style="margin-bottom: 20px;">
            <span class="mfd-label">{`ERASE ALL ${this.props.isCross ? 'CROSSES' : 'FLAGS'}`}</span>
            <span>
              <img
                style="position: relative; top: -5px; left: 10px"
                width="25px"
                src={`/Images/fbw-a380x/oans/oans-${this.props.isCross ? 'cross' : 'flag'}.svg`}
              />
            </span>
          </div>
          <div class="mfd-dialog-buttons">
            <Button label="CANCEL" onClick={() => this.props.hideDialog()} />
            <Button
              label="CONFIRM"
              onClick={() => {
                this.props.confirmAction();
                this.props.hideDialog();
              }}
              buttonStyle="padding-right: 6px;"
            />
          </div>
        </div>
      </div>
    );
  }
}
