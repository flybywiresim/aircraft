// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  Unit,
  UnitFamily,
  UnitType,
  VNode,
} from '@microsoft/msfs-sdk';

import { GenericAdirsEvents } from '@flybywiresim/fbw-sdk';

import { clampAngle } from 'msfs-geo';
import { BtvRunwayInfo } from './shared/BtvRunwayInfo';
import { RwyAheadAdvisory } from './shared/RwyAheadAdvisory';
import { SelectedHeadingBug } from './pages/arc/SelectedHeadingBug';
import { VnavStatus } from './shared/VnavStatus';
import { LnavStatus } from './shared/LnavStatus';
import { CrossTrackError } from './shared/CrossTrackError';
import { RadioNeedle } from './shared/RadioNeedle';
import { GenericFmsEvents } from './types/GenericFmsEvents';
import { NDSimvars } from './NDSimvarPublisher';
import { ArcModePage } from './pages/arc';
import { Layer } from '../MsfsAvionicsCommon/Layer';
import { FmMessages } from './FmMessages';
import { Flag, FlagProps } from './shared/Flag';
import { CanvasMap } from './shared/map/CanvasMap';
import { NDPage } from './pages/NDPage';
import { PlanModePage } from './pages/plan';
import { RadioNavInfo } from './shared/RadioNavInfo';
import { RoseNavPage } from './pages/rose/RoseNavPage';
import { RoseLSPage } from './pages/rose/RoseLSPage';
import { RoseVorPage } from './pages/rose/RoseVorPage';
import { NDControlEvents } from './NDControlEvents';
import { Airplane } from './shared/Airplane';
import { TcasWxrMessages } from './TcasWxrMessages';
import { Chrono } from './Chrono';
import { WindIndicator } from './shared/WindIndicator';
import { TerrainMapThresholds } from './TerrainMapThresholds';
import { TrackLine } from './shared/TrackLine';
import { TrackBug } from './shared/TrackBug';
import { GenericFcuEvents } from './types/GenericFcuEvents';
import { ArincEventBus } from '../../../shared/src/ArincEventBus';
import { EfisNdMode, EfisSide } from '../NavigationDisplay';
import { Arinc429RegisterSubject } from '../../../shared/src/Arinc429RegisterSubject';
import { Arinc429ConsumerSubject } from '../../../shared/src/Arinc429ConsumerSubject';
import { FmsOansData } from '../../../shared/src/publishers/OansBtv/FmsOansPublisher';
import { MathUtils } from '../../../shared/src/MathUtils';
import { SimVarString } from '../../../shared/src/simvar';
import { GenericDisplayManagementEvents } from './types/GenericDisplayManagementEvents';
import { OansControlEvents } from '../OANC';
import { NXDataStore } from '@flybywiresim/fbw-sdk';

const PAGE_GENERATION_BASE_DELAY = 500;
const PAGE_GENERATION_RANDOM_DELAY = 70;

export const getDisplayIndex = () => {
  const url = document.querySelector('vcockpit-panel > *').getAttribute('url');
  return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

export interface NDProps<T extends number> {
  bus: ArincEventBus;

  side: EfisSide;

  rangeValues: T[];

  terrainThresholdPaddingText: string;

  rangeChangeMessage: string;

  modeChangeMessage: string;
}

export class NDComponent<T extends number> extends DisplayComponent<NDProps<T>> {
  private readonly pposLatWord = Arinc429RegisterSubject.createEmpty();

  private readonly pposLonWord = Arinc429RegisterSubject.createEmpty();

  private readonly isUsingTrackUpMode = Subject.create(false);

  private readonly trueHeadingWord = Arinc429RegisterSubject.createEmpty();

  private readonly trueTrackWord = Arinc429RegisterSubject.createEmpty();

  /** either magnetic or true heading depending on true ref mode */
  private readonly headingWord = Arinc429ConsumerSubject.create(null);

  /** either magnetic or true track depending on true ref mode */
  private readonly trackWord = Arinc429ConsumerSubject.create(null);

  private readonly trueRefActive = Subject.create(false);

  private readonly roseLSPage = FSComponent.createRef<RoseLSPage<T>>();

  private readonly roseVorPage = FSComponent.createRef<RoseVorPage<T>>();

  private readonly roseNavPage = FSComponent.createRef<RoseNavPage<T>>();

  private readonly arcPage = FSComponent.createRef<ArcModePage<T>>();

  private readonly planPage = FSComponent.createRef<PlanModePage<T>>();

  private currentPageMode = Subject.create(EfisNdMode.ARC);

  private currentPageInstance: NDPage;

  private readonly pageChangeInProgress = Subject.create(false);

  private pageChangeInvalidationTimeout = -1;

  private readonly rangeChangeInProgress = Subject.create(false);

  private rangeChangeInvalidationTimeout = -1;

  private readonly mapRecomputing = MappedSubject.create(
    ([pageChange, rangeChange]) => pageChange || rangeChange,
    this.pageChangeInProgress,
    this.rangeChangeInProgress,
  );

  private readonly trkFlagShown = MappedSubject.create(
    ([isUsingTrackUpMode, trackWord, currentPageMode]) => {
      if (currentPageMode === EfisNdMode.PLAN) {
        return false;
      }

      if (isUsingTrackUpMode) {
        return !trackWord.isNormalOperation();
      }

      return false;
    },
    this.isUsingTrackUpMode,
    this.trackWord,
    this.currentPageMode,
  );

  private readonly hdgFlagShown = MappedSubject.create(
    ([headingWord, currentPageMode]) => {
      if (currentPageMode === EfisNdMode.PLAN) {
        return false;
      }

      return !headingWord.isNormalOperation();
    },
    this.headingWord,
    this.currentPageMode,
  );

  private showOans = Subject.create<boolean>(false);

  private lengthUnit = Subject.create<Unit<UnitFamily.Distance>>(UnitType.METER);

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    this.currentPageInstance = this.arcPage.instance;

    this.currentPageInstance.isVisible.set(true);
    this.currentPageInstance.onShow();

    const sub = this.props.bus.getSubscriber<
      GenericFcuEvents &
        GenericDisplayManagementEvents &
        GenericFmsEvents &
        NDControlEvents &
        NDSimvars &
        OansControlEvents
    >();

    sub
      .on('trueHeadingRaw')
      .whenChanged()
      .handle((value) => {
        this.trueHeadingWord.setWord(value);
      });

    sub
      .on('trueTrackRaw')
      .whenChanged()
      .handle((value) => {
        this.trueTrackWord.setWord(value);
      });

    sub
      .on('latitude')
      .whenChanged()
      .handle((value) => {
        this.pposLatWord.setWord(value);
      });

    sub
      .on('longitude')
      .whenChanged()
      .handle((value) => {
        this.pposLonWord.setWord(value);
      });

    this.headingWord.setConsumer(sub.on('heading'));

    this.trackWord.setConsumer(sub.on('track'));

    sub
      .on('trueRefActive')
      .whenChanged()
      .handle((v) => this.trueRefActive.set(v));

    sub
      .on('ndRangeSetting')
      .whenChanged()
      .handle(() => {
        this.invalidateRange();
      });

    this.rangeChangeInProgress.sub((rangechange) => {
      this.props.bus.getPublisher<NDControlEvents>().pub('set_range_change', rangechange);
    });

    sub
      .on('ndMode')
      .whenChanged()
      .handle((mode) => {
        this.handleNewMapPage(mode);
      });

    this.mapRecomputing.sub((recomputing) => {
      this.props.bus.getPublisher<NDControlEvents>().pub('set_map_recomputing', recomputing);
    });

    sub
      .on('nd_show_oans')
      .whenChanged()
      .handle((data) => {
        if (data.side === this.props.side) {
          this.showOans.set(data.show);
          NXDataStore.getAndSubscribe('CONFIG_USING_METRIC_UNIT', (key, value) => {
            value === '1' ? this.lengthUnit.set(UnitType.METER) : this.lengthUnit.set(UnitType.FOOT);
          });
        }
      });
  }

  // eslint-disable-next-line arrow-body-style
  private readonly mapFlagShown = MappedSubject.create(
    ([headingWord, latWord, longWord, currentPageMode]) => {
      return (
        (!headingWord.isNormalOperation() || !latWord.isNormalOperation() || !longWord.isNormalOperation()) &&
        currentPageMode !== EfisNdMode.PLAN
      );
    },
    this.headingWord,
    this.pposLatWord,
    this.pposLonWord,
    this.currentPageMode,
  );

  private readonly planeRotation = MappedSubject.create(
    ([isUsingTrackUpMode, headingWord, trackWord]) => {
      if (isUsingTrackUpMode) {
        if (headingWord.isNormalOperation() && trackWord.isNormalOperation()) {
          // FIXME move that file to MsfsAvionicsCommon or another shared folder
          return MathUtils.getSmallestAngle(headingWord.value, trackWord.value);
        }
      }

      return 0;
    },
    this.isUsingTrackUpMode,
    this.headingWord,
    this.trackWord,
  );

  private handleNewMapPage(mode: EfisNdMode) {
    if (mode === this.currentPageMode.get()) {
      return;
    }

    this.currentPageInstance.isVisible.set(false);
    this.currentPageInstance.onHide();

    this.currentPageMode.set(mode);

    switch (mode) {
      case EfisNdMode.ROSE_ILS:
        this.currentPageInstance = this.roseLSPage.instance;
        break;
      case EfisNdMode.ROSE_VOR:
        this.currentPageInstance = this.roseVorPage.instance;
        break;
      case EfisNdMode.ROSE_NAV:
        this.currentPageInstance = this.roseNavPage.instance;
        break;
      case EfisNdMode.ARC:
        this.currentPageInstance = this.arcPage.instance;
        break;
      case EfisNdMode.PLAN:
        this.currentPageInstance = this.planPage.instance;
        break;
      default:
        console.warn(`Unknown ND page mode=${mode}`);
        break;
    }

    this.currentPageInstance.isVisible.set(true);
    this.currentPageInstance.onShow();

    this.invalidatePage();
  }

  private invalidateRange() {
    if (this.rangeChangeInvalidationTimeout !== -1) {
      window.clearTimeout(this.rangeChangeInvalidationTimeout);
    }

    if (
      this.currentPageMode.get() !== EfisNdMode.ROSE_ILS &&
      this.currentPageMode.get() !== EfisNdMode.ROSE_VOR &&
      !this.mapFlagShown.get()
    ) {
      // Range has priority over mode change
      this.pageChangeInProgress.set(false);
      this.rangeChangeInProgress.set(true);
      this.rangeChangeInvalidationTimeout = window.setTimeout(
        () => {
          this.rangeChangeInProgress.set(false);
        },
        Math.random() * PAGE_GENERATION_RANDOM_DELAY + PAGE_GENERATION_BASE_DELAY,
      );
    } else {
      this.rangeChangeInProgress.set(false);
    }
  }

  private invalidatePage() {
    if (this.pageChangeInvalidationTimeout !== -1) {
      window.clearTimeout(this.pageChangeInvalidationTimeout);
    }

    if (
      this.currentPageMode.get() !== EfisNdMode.ROSE_ILS &&
      this.currentPageMode.get() !== EfisNdMode.ROSE_VOR &&
      !this.rangeChangeInProgress.get() &&
      !this.mapFlagShown.get()
    ) {
      this.pageChangeInProgress.set(true);
      this.pageChangeInvalidationTimeout = window.setTimeout(
        () => {
          this.pageChangeInProgress.set(false);
        },
        Math.random() * PAGE_GENERATION_RANDOM_DELAY + PAGE_GENERATION_BASE_DELAY,
      );
    } else {
      this.pageChangeInProgress.set(false);
    }
  }

  render(): VNode | null {
    return (
      <>
        <div style={{ display: this.showOans.map((it) => (it ? 'block' : 'none')) }}>
          <div style={{ display: this.currentPageMode.map((it) => (it === EfisNdMode.PLAN ? 'none' : 'block')) }}>
            <svg class="nd-svg" viewBox="0 0 768 768" style="transform: rotateX(0deg);">
              <WindIndicator bus={this.props.bus} />
              <SpeedIndicator bus={this.props.bus} />
            </svg>
          </div>
          <div style={{ display: this.currentPageMode.map((it) => (it === EfisNdMode.PLAN ? 'block' : 'none')) }}>
            <svg class="nd-svg" viewBox="0 0 768 768" style="transform: rotateX(0deg);">
              <BtvRunwayInfo bus={this.props.bus} lengthUnit={this.lengthUnit} />
              <SpeedIndicator bus={this.props.bus} />
            </svg>
          </div>
          <svg class="nd-svg nd-top-layer" viewBox="0 0 768 768" style="transform: rotateX(0deg);">
            <TcasWxrMessages bus={this.props.bus} mode={this.currentPageMode} />
            <FmMessages bus={this.props.bus} mode={this.currentPageMode} />
            <RwyAheadAdvisory bus={this.props.bus} />
          </svg>
        </div>
        <div style={{ display: this.showOans.map((it) => (it ? 'none' : 'block')) }}>
          {/* ND Vector graphics - bottom layer */}
          <svg class="nd-svg" viewBox="0 0 768 768" style="transform: rotateX(0deg);">
            <RoseLSPage
              bus={this.props.bus}
              ref={this.roseLSPage}
              headingWord={this.headingWord}
              trueHeadingWord={this.trueHeadingWord}
              trackWord={this.trackWord}
              trueTrackWord={this.trueTrackWord}
              rangeValues={this.props.rangeValues}
              isUsingTrackUpMode={this.isUsingTrackUpMode}
              /* Capt ND shows ILS2  */
              index={this.props.side === 'L' ? 2 : 1}
            />
            <RoseVorPage
              bus={this.props.bus}
              ref={this.roseVorPage}
              headingWord={this.headingWord}
              trueHeadingWord={this.trueHeadingWord}
              trackWord={this.trackWord}
              trueTrackWord={this.trueTrackWord}
              rangeValues={this.props.rangeValues}
              isUsingTrackUpMode={this.isUsingTrackUpMode}
              /* Capt ND shows VOR1  */
              index={this.props.side === 'L' ? 1 : 2}
            />
            <RoseNavPage
              bus={this.props.bus}
              ref={this.roseNavPage}
              headingWord={this.headingWord}
              trueHeadingWord={this.trueHeadingWord}
              trackWord={this.trackWord}
              trueTrackWord={this.trueTrackWord}
              rangeValues={this.props.rangeValues}
              isUsingTrackUpMode={this.isUsingTrackUpMode}
            />
            <ArcModePage
              ref={this.arcPage}
              bus={this.props.bus}
              rangeValues={this.props.rangeValues}
              headingWord={this.headingWord}
              trueHeadingWord={this.trueHeadingWord}
              trackWord={this.trackWord}
              trueTrackWord={this.trueTrackWord}
              isUsingTrackUpMode={this.isUsingTrackUpMode}
            />
            <PlanModePage
              ref={this.planPage}
              bus={this.props.bus}
              rangeValues={this.props.rangeValues}
              aircraftTrueHeading={this.trueHeadingWord}
            />

            <SelectedHeadingBug bus={this.props.bus} rotationOffset={this.planeRotation} mode={this.currentPageMode} />

            <TrackLine bus={this.props.bus} isUsingTrackUpMode={this.isUsingTrackUpMode} />
            <TrackBug bus={this.props.bus} isUsingTrackUpMode={this.isUsingTrackUpMode} ndMode={this.currentPageMode} />

            <WindIndicator bus={this.props.bus} />
            <SpeedIndicator bus={this.props.bus} />
            <ToWaypointIndicator
              bus={this.props.bus}
              isNormalOperation={this.pposLatWord.map((it) => it.isNormalOperation())}
            />
            <TopMessages bus={this.props.bus} ndMode={this.currentPageMode} />

            {false && <LnavStatus />}
            {true && <VnavStatus />}

            <Flag visible={Subject.create(false)} x={350} y={84} class="Amber FontSmall">
              DISPLAY SYSTEM VERSION INCONSISTENCY
            </Flag>
            <Flag visible={Subject.create(false)} x={384} y={170} class="Amber FontMedium">
              CHECK HDG
            </Flag>
            <Flag visible={this.trkFlagShown} x={381} y={204} class="Red FontSmallest">
              TRK
            </Flag>
            <Flag visible={this.hdgFlagShown} x={384} y={241} class="Red FontLarge">
              HDG
            </Flag>

            <Flag visible={this.rangeChangeInProgress} x={384} y={320} class="Green FontIntermediate mode-range-change">
              {this.props.rangeChangeMessage}
            </Flag>
            <Flag
              visible={MappedSubject.create(
                ([rangeChange, pageChange]) => !rangeChange && pageChange,
                this.rangeChangeInProgress,
                this.pageChangeInProgress,
              )}
              x={384}
              y={320}
              class="Green mode-range-change"
            >
              {this.props.modeChangeMessage}
            </Flag>

            <TerrainMapThresholds bus={this.props.bus} paddingText={this.props.terrainThresholdPaddingText} />

            <RadioNavInfo bus={this.props.bus} index={1} mode={this.currentPageMode} />
            <RadioNavInfo bus={this.props.bus} index={2} mode={this.currentPageMode} />
          </svg>

          {/* ND Raster map - middle layer */}
          <CanvasMap bus={this.props.bus} x={Subject.create(384)} y={Subject.create(384)} />

          {/* ND Vector graphics - top layer */}
          <svg class="nd-svg nd-top-layer" viewBox="0 0 768 768" style="transform: rotateX(0deg);">
            <Airplane bus={this.props.bus} ndMode={this.currentPageMode} />

            <Chrono bus={this.props.bus} />

            <TcasWxrMessages bus={this.props.bus} mode={this.currentPageMode} />
            <FmMessages bus={this.props.bus} mode={this.currentPageMode} />
            <CrossTrackError
              bus={this.props.bus}
              currentPageMode={this.currentPageMode}
              isNormalOperation={this.mapFlagShown.map((it) => !it)}
            />

            <g
              id="radio_needles"
              clip-path={this.currentPageMode.map((m) => (m === EfisNdMode.ARC ? 'url(#arc-mode-map-clip)' : ''))}
            >
              <RadioNeedle
                bus={this.props.bus}
                headingWord={this.headingWord}
                trackWord={this.trackWord}
                isUsingTrackUpMode={this.isUsingTrackUpMode}
                index={1}
                mode={this.currentPageMode}
              />
              <RadioNeedle
                bus={this.props.bus}
                headingWord={this.headingWord}
                trackWord={this.trackWord}
                isUsingTrackUpMode={this.isUsingTrackUpMode}
                index={2}
                mode={this.currentPageMode}
              />
            </g>
          </svg>
        </div>
      </>
    );
  }
}

class SpeedIndicator extends DisplayComponent<{ bus: EventBus }> {
  private readonly groundSpeedRef = FSComponent.createRef<SVGTextElement>();

  private readonly trueAirSpeedRef = FSComponent.createRef<SVGTextElement>();

  private readonly groundSpeedRegister = Arinc429RegisterSubject.createEmpty();

  private readonly trueAirSpeedRegister = Arinc429RegisterSubject.createEmpty();

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<GenericAdirsEvents>();

    sub
      .on('groundSpeed')
      .atFrequency(2)
      .handle((value) => this.groundSpeedRegister.setWord(value));

    this.groundSpeedRegister.sub((data) => {
      const element = this.groundSpeedRef.instance;

      element.textContent = data.isNormalOperation() ? Math.round(data.value).toString() : '';
    }, true);

    sub
      .on('trueAirSpeed')
      .atFrequency(2)
      .handle((value) => this.trueAirSpeedRegister.setWord(value));

    this.trueAirSpeedRegister.sub((data) => {
      const element = this.trueAirSpeedRef.instance;

      element.textContent = data.isNormalOperation() ? Math.round(data.value).toString() : '';
    }, true);
  }

  render(): VNode | null {
    return (
      <Layer x={2} y={25}>
        <text x={0} y={0} class="White FontSmallest">
          GS
        </text>
        <text ref={this.groundSpeedRef} x={89} y={0} class="Green FontIntermediate EndAlign" />
        <text x={95} y={0} class="White FontSmallest">
          TAS
        </text>
        <text ref={this.trueAirSpeedRef} x={201} y={0} class="Green FontIntermediate EndAlign" />
      </Layer>
    );
  }
}

interface TrueFlagProps extends FlagProps {
  x: Subscribable<number>;
  y: Subscribable<number>;
  boxed: Subscribable<boolean>;
}

// FIXME add a generic box to Flag
class TrueFlag extends DisplayComponent<TrueFlagProps> {
  private readonly boxRef = FSComponent.createRef<SVGTextElement>();

  private readonly boxVisible = MappedSubject.create(
    ([visible, boxed]) => visible && boxed,
    this.props.visible,
    this.props.boxed,
  );

  private readonly boxX = MappedSubject.create(([x]) => x - 34, this.props.x);

  private readonly boxY = MappedSubject.create(([y]) => y - 20, this.props.y);

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    this.boxVisible.sub((visible) => {
      this.boxRef.instance.style.visibility = visible ? 'inherit' : 'hidden';
    }, true);
  }

  render(): VNode | null {
    return (
      <>
        <Flag x={this.props.x} y={this.props.y} class={this.props.class} visible={this.props.visible}>
          TRUE
        </Flag>
        <rect
          x={this.boxX}
          y={this.boxY}
          width={68}
          height={23}
          class={this.props.class}
          strokeWidth={1.5}
          ref={this.boxRef}
        />
      </>
    );
  }
}

interface GridTrackProps {
  x: Subscribable<number>;
  y: Subscribable<number>;
  gridTrack: Subscribable<number>;
  visible: Subscribable<boolean>;
}

class GridTrack extends DisplayComponent<GridTrackProps> {
  private gridTrackText = MappedSubject.create(
    ([gridTrack]) => gridTrack.toFixed(0).padStart(3, '0'),
    this.props.gridTrack,
  );

  render(): VNode | null {
    return (
      <Layer x={this.props.x} y={this.props.y} visible={this.props.visible}>
        <rect x={0} width={94} y={-20} height={23} class="White" strokeWidth={1.5} />
        <text x={45} class="FontSmallest MiddleAlign">
          <tspan class="Green">◇{this.gridTrackText}</tspan>
          <tspan class="Cyan">
            <tspan dx="-5" dy="8" class="FontIntermediate">
              °
            </tspan>
            <tspan dy="-8">G</tspan>
          </tspan>
        </text>
      </Layer>
    );
  }
}

class TopMessages extends DisplayComponent<{ bus: EventBus; ndMode: Subscribable<EfisNdMode> }> {
  private readonly sub = this.props.bus.getSubscriber<
    ClockEvents & GenericDisplayManagementEvents & NDSimvars & GenericFmsEvents & FmsOansData
  >();

  private readonly trueRefActive = Subject.create(false);

  private readonly pposLatWord = Arinc429RegisterSubject.createEmpty();

  private readonly pposLonWord = Arinc429RegisterSubject.createEmpty();

  private readonly trueTrackWord = Arinc429RegisterSubject.createEmpty();

  private needApprMessageUpdate = true;

  private apprMessage0: number;

  private apprMessage1: number;

  private readonly approachMessageValue = Subject.create('');

  private readonly btvMessageValue = Subject.create('');

  private readonly isPlanMode = this.props.ndMode.map((mode) => mode === EfisNdMode.PLAN);

  private readonly gridTrack = MappedSubject.create(
    ([lat, lon, trueTrack]) => clampAngle(Math.round(trueTrack.value - Math.sign(lat.value) * lon.value)),
    this.pposLatWord,
    this.pposLonWord,
    this.trueTrackWord,
  );

  private readonly trueRefVisible = MappedSubject.create(
    ([isTrueRef, isPlanMode]) => isTrueRef && !isPlanMode,
    this.trueRefActive,
    this.isPlanMode,
  );

  private readonly gridTrackVisible = MappedSubject.create(
    ([lat, lon, trueTrack, apprMsg, trueRef]) =>
      trueRef &&
      apprMsg.length === 0 &&
      lon.isNormalOperation() &&
      trueTrack.isNormalOperation() &&
      Math.abs(lat.valueOr(0)) > 65,
    this.pposLatWord,
    this.pposLonWord,
    this.trueTrackWord,
    this.approachMessageValue,
    this.trueRefVisible,
  );

  private readonly trueFlagX = MappedSubject.create(
    ([gridTrack]) => 384 + (gridTrack ? -50 : 4),
    this.gridTrackVisible,
  );

  private readonly trueFlagY = MappedSubject.create(
    ([apprMsg]) => (apprMsg === null ? 36 : 56),
    this.approachMessageValue,
  );

  private readonly trueFlagBoxed = MappedSubject.create(([apprMsg]) => apprMsg.length === 0, this.approachMessageValue);

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    this.sub
      .on('apprMessage0')
      .whenChanged()
      .handle((value) => {
        this.apprMessage0 = value;
        this.needApprMessageUpdate = true;
      });

    this.sub
      .on('apprMessage1')
      .whenChanged()
      .handle((value) => {
        this.apprMessage1 = value;
        this.needApprMessageUpdate = true;
      });

    this.sub
      .on('ndBtvMessage')
      .whenChanged()
      .handle((value) => {
        this.btvMessageValue.set(value);
      });

    this.sub.on('simTime').whenChangedBy(100).handle(this.refreshToWptIdent.bind(this));

    this.sub.on('trueTrackRaw').handle((v) => this.trueTrackWord.setWord(v));

    this.sub.on('latitude').handle((v) => this.pposLatWord.setWord(v));

    this.sub.on('longitude').handle((v) => this.pposLonWord.setWord(v));

    this.sub
      .on('trueRefActive')
      .whenChanged()
      .handle((v) => this.trueRefActive.set(!!v));
  }

  private refreshToWptIdent(): void {
    if (this.needApprMessageUpdate) {
      const ident = SimVarString.unpack([this.apprMessage0, this.apprMessage1]);

      this.approachMessageValue.set(ident);
      this.needApprMessageUpdate = false;
    }
  }

  render(): VNode | null {
    return (
      <>
        <Layer x={384} y={28}>
          {/* TODO verify */}
          <text class="Green FontIntermediate MiddleAlign">{this.approachMessageValue}</text>
        </Layer>
        <Layer
          x={384}
          y={56}
          visible={MappedSubject.create(
            ([btv, trueRef]) => btv !== '' && !trueRef,
            this.btvMessageValue,
            this.trueRefVisible,
          )}
        >
          {/* TODO verify */}
          <text class="Green FontSmallest MiddleAlign">{this.btvMessageValue}</text>
        </Layer>
        <TrueFlag
          x={this.trueFlagX}
          y={this.trueFlagY}
          class="Cyan FontSmallest"
          boxed={this.trueFlagBoxed}
          visible={this.trueRefVisible}
        />
        <GridTrack
          x={Subject.create(384)}
          y={this.trueFlagY}
          visible={this.gridTrackVisible}
          gridTrack={this.gridTrack}
        />
      </>
    );
  }
}

interface ToWaypointIndicatorProps {
  bus: EventBus;
  isNormalOperation: Subscribable<boolean>; // TODO replace with ARINC429 word
}

class ToWaypointIndicator extends DisplayComponent<ToWaypointIndicatorProps> {
  private readonly sub = this.props.bus.getSubscriber<
    ClockEvents & GenericDisplayManagementEvents & GenericFcuEvents & NDSimvars & GenericFmsEvents
  >();

  private readonly trueRefActive = ConsumerSubject.create(null, false);

  private readonly bearing = ConsumerSubject.create(null, NaN);

  private readonly trueBearing = ConsumerSubject.create(null, NaN);

  private readonly efisMode = ConsumerSubject.create(null, EfisNdMode.ARC);

  private readonly toWptIdent0 = ConsumerSubject.create(null, -1);

  private readonly toWptIdent1 = ConsumerSubject.create(null, -1);

  private readonly toWptDistance = ConsumerSubject.create(null, -1);

  private readonly toWptEta = ConsumerSubject.create(null, -1);

  private readonly largeDistanceNumberRef = FSComponent.createRef<SVGTextElement>();

  private readonly smallDistanceIntegerPartRef = FSComponent.createRef<SVGTextElement>();

  private readonly smallDistanceDecimalPartRef = FSComponent.createRef<SVGTextElement>();

  private readonly visibleSub = Subject.create(false);

  private readonly bearingContainerVisible = MappedSubject.create(
    ([trueRef, bearing, trueBearing, isNormalOperation]) => {
      const activeBearing = trueRef ? trueBearing : bearing;
      return isNormalOperation && Number.isFinite(activeBearing) && activeBearing !== -1;
    },
    this.trueRefActive,
    this.bearing,
    this.trueBearing,
    this.props.isNormalOperation,
  );

  private readonly bearingText = MappedSubject.create(
    ([trueRef, bearing, trueBearing]) =>
      Number.isFinite(trueRef ? trueBearing : bearing)
        ? Math.round(trueRef ? trueBearing : bearing)
            .toString()
            .padStart(3, '0')
        : '',
    this.trueRefActive,
    this.bearing,
    this.trueBearing,
  );

  private readonly toWptIdentValue = Subject.create('');

  private readonly distanceSmallContainerVisible = Subject.create(false);

  private readonly distanceLargeContainerVisible = Subject.create(false);

  private readonly distanceNmUnitVisible = Subject.create(false);

  private readonly etaValue = Subject.create('');

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    this.efisMode.setConsumer(this.sub.on('ndMode').whenChanged());

    this.efisMode.sub(() => this.handleVisibility(), true);

    this.toWptIdent0.setConsumer(this.sub.on('toWptIdent0').whenChanged());

    this.toWptIdent1.setConsumer(this.sub.on('toWptIdent1').whenChanged());

    this.toWptDistance.setConsumer(this.sub.on('toWptDistance').whenChanged());

    this.toWptDistance.sub(() => this.handleToWptDistance(), true);
    this.props.isNormalOperation.sub(() => this.handleToWptDistance(), true);

    this.toWptEta.setConsumer(this.sub.on('toWptEta').whenChanged());

    this.toWptEta.sub(() => this.handleToWptEta(), true);
    this.props.isNormalOperation.sub(() => this.handleToWptEta(), true);

    this.bearing.setConsumer(this.sub.on('toWptBearing'));

    this.trueBearing.setConsumer(this.sub.on('toWptTrueBearing'));

    this.trueRefActive.setConsumer(this.sub.on('trueRefActive').whenChanged());

    this.sub
      .on('simTime')
      .whenChangedBy(100)
      .handle(() => {
        this.refreshToWptIdent();
      });
  }

  private handleVisibility() {
    const efisMode = this.efisMode.get();

    const visible = efisMode === EfisNdMode.ROSE_NAV || efisMode === EfisNdMode.ARC || efisMode === EfisNdMode.PLAN;

    this.visibleSub.set(visible);
  }

  // FIXME distance, eta and bearing are currently not transmitted as arinc429 labels which would be needed for proper visibility determination
  private handleToWptDistance() {
    const value = this.toWptDistance.get();

    if (!value || value < 0 || !this.props.isNormalOperation.get()) {
      this.distanceSmallContainerVisible.set(false);
      this.distanceLargeContainerVisible.set(false);
      this.distanceNmUnitVisible.set(false);
      return;
    }

    this.distanceNmUnitVisible.set(true);

    if (value > 20) {
      this.distanceSmallContainerVisible.set(false);
      this.distanceLargeContainerVisible.set(true);

      this.largeDistanceNumberRef.instance.textContent = Math.round(value).toString();
    } else {
      this.distanceSmallContainerVisible.set(true);
      this.distanceLargeContainerVisible.set(false);

      const distanceFixed = value.toFixed(1);
      const [distanceIntegralPart, distanceDecimalPart] = distanceFixed.split('.');

      this.smallDistanceIntegerPartRef.instance.textContent = distanceIntegralPart.toString();
      this.smallDistanceDecimalPartRef.instance.textContent = distanceDecimalPart;
    }
  }

  private handleToWptEta() {
    const eta = this.toWptEta.get();

    if (eta === -1 || !this.props.isNormalOperation.get()) {
      this.etaValue.set('');
      return;
    }

    const hh = Math.floor(eta / 3600);
    const mm = Math.floor((eta % 3600) / 60);

    const utc = `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;

    this.etaValue.set(utc);
  }

  private refreshToWptIdent(): void {
    const ident = SimVarString.unpack([this.toWptIdent0.get(), this.toWptIdent1.get()]);

    this.toWptIdentValue.set(ident);
  }

  private readonly visibilityFn = (v: boolean) => (v ? 'inherit' : 'hidden');

  private readonly inverseVisibilityFn = (v: boolean) => (v ? 'hidden' : 'inherit');

  render(): VNode | null {
    return (
      <Layer x={690} y={25} visible={this.visibleSub}>
        {/* This is always visible */}
        <text class="White FontIntermediate EndAlign WaypointIndicator" transform="translate(-13, 0)">
          {this.toWptIdentValue}
        </text>

        <g visibility={this.bearingContainerVisible.map(this.visibilityFn)}>
          <text x={57} y={0} class="Green FontIntermediate EndAlign">
            {this.bearingText}
          </text>
          <text
            x={73}
            y={2}
            class="Cyan FontIntermediate EndAlign"
            visibility={this.trueRefActive.map(this.inverseVisibilityFn)}
          >
            &deg;
          </text>
          <text
            x={71}
            y={-3}
            class="Cyan FontIntermediate EndAlign"
            visibility={this.trueRefActive.map(this.visibilityFn)}
          >
            T
          </text>
        </g>

        <g visibility={this.distanceLargeContainerVisible.map(this.visibilityFn)}>
          <text ref={this.largeDistanceNumberRef} x={39} y={32} class="Green FontIntermediate EndAlign" />
        </g>

        <g visibility={this.distanceSmallContainerVisible.map(this.visibilityFn)}>
          <text ref={this.smallDistanceIntegerPartRef} x={6} y={32} class="Green FontIntermediate EndAlign" />
          <text x={3} y={32} class="Green FontSmallest StartAlign">
            .
          </text>
          <text ref={this.smallDistanceDecimalPartRef} x={20} y={32} class="Green FontSmallest StartAlign" />
        </g>

        <text
          x={72}
          y={32}
          class="Cyan FontSmallest EndAlign"
          visibility={this.distanceNmUnitVisible.map(this.visibilityFn)}
        >
          NM
        </text>

        <text x={72} y={66} class="Green FontIntermediate EndAlign">
          {this.etaValue}
        </text>
      </Layer>
    );
  }
}
