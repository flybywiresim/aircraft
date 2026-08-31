// @ts-strict-ignore
import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';

import { Arinc429LocalVarConsumerSubject, Arinc429Word, ArincEventBus } from '@flybywiresim/fbw-sdk';
import {
  calculateHorizonOffsetFromPitch,
  calculateVerticalOffsetFromRoll,
  LagFilter,
  getSmallestAngle,
  HudElems,
  HudMode,
} from './HUDUtils';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HorizontalTape } from './HorizontalTape';
import { getDisplayIndex } from './HUD';
import { ONE_DEG, FIVE_DEG, PitchscaleMode } from './HUDUtils';
import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { HeadingOfftape } from './HeadingIndicator';
import { SyntheticRunway } from './SyntheticRunway';
import { FmgcFlightPhase } from '@shared/flightphase';
import { PrimFgBusBaseEvents } from '@shared/publishers/PrimFgPublisher';
import { FcdcBusEvents } from '@shared/publishers/FcdcPublisher';
import { FcuEfisCpBusEvents } from '@shared/publishers/EfisCpBusPublisher';
import { asin } from 'msfs-geo';

const DisplayRange = 35;
const DistanceSpacing = FIVE_DEG;
const ValueSpacing = 5;

class HeadingBug extends DisplayComponent<{ bus: EventBus; isCaptainSide: boolean; yOffset: Subscribable<number> }> {
  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents & ClockEvents & Arinc429Values>();

  private fgDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_1'));

  private fgDiscreteWord5 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_5'));

  private selectedHdgTrk = Arinc429LocalVarConsumerSubject.create(null);

  private heading = ConsumerSubject.create(this.sub.on('headingAr'), new Arinc429Word(0));

  private readonly trkFpaModeActive = this.fgDiscreteWord5.map((word) => word.bitValueOr(11, true));

  private anyFdEngaged = this.fgDiscreteWord1.map((word) => word.bitValueOr(13, false) || word.bitValueOr(14, false));

  private headingDelta = MappedSubject.create(
    ([heading, selectedHeading]) => {
      return getSmallestAngle(selectedHeading.value, heading.value);
    },
    this.heading,
    this.selectedHdgTrk,
  );

  private readonly transform = MappedSubject.create(
    ([delta, yOffset]) => `translate3d(${(delta * DistanceSpacing) / ValueSpacing}px, ${yOffset}px, 0px)`,
    this.headingDelta,
    this.props.yOffset,
  );

  private readonly visible = MappedSubject.create(
    ([delta, selectedHdgTrk, anyFdEngaged]) =>
      !anyFdEngaged &&
      (selectedHdgTrk.isNormalOperation() || selectedHdgTrk.isFunctionalTest()) &&
      Math.abs(delta) <= DisplayRange + 10,
    this.headingDelta,
    this.selectedHdgTrk,
    this.anyFdEngaged,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.trkFpaModeActive.sub((trkFpaModeActive) => {
      this.selectedHdgTrk.setConsumer(this.sub.on(trkFpaModeActive ? 'prim_selected_track' : 'prim_selected_heading'));
    }, true);

    this.visible.sub((visible) => {
      if (visible) {
        this.transform.resume();
      } else {
        this.transform.pause();
      }
    }, true);
  }

  render(): VNode {
    return (
      <g
        style={{ transform: this.transform }}
        class={{ HiddenElement: this.visible.map(SubscribableMapFunctions.not()) }}
        id="HorizonHeadingBug"
      >
        <path class="ThickOutline" d="m68.906 80.823v-7" />
        <path class="ThickStroke Cyan" d="m68.906 80.823v-7" />
      </g>
    );
  }
}

interface HorizonProps {
  readonly bus: ArincEventBus;
  readonly instrument: BaseInstrument;
  readonly isAttExcessive: Subscribable<boolean>;
  readonly filteredRadioAlt: Subscribable<number>;
}

export class Horizon extends DisplayComponent<HorizonProps> {
  private readonly sub = this.props.bus.getArincSubscriber<Arinc429Values & HUDSimvars & FcdcBusEvents & HudElems>();

  private pitchGroupRef = FSComponent.createRef<SVGGElement>();

  private rollGroupRef = FSComponent.createRef<SVGGElement>();

  private GroupRef = FSComponent.createRef<SVGGElement>();

  private yOffset = Subject.create(0);

  private pitch = ConsumerSubject.create(this.sub.on('pitchAr'), null);

  private roll = ConsumerSubject.create(this.sub.on('rollAr'), null);

  private headingFailed = Subject.create(true);

  private crosswindMode = ConsumerSubject.create(this.sub.on('cWndMode'), false);

  private readonly fcdc1DiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_1_1'));

  private readonly fcdc2DiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_1_2'));

  private readonly isNormalLawActive = MappedSubject.create(
    ([fcdc1DiscreteWord1, fcdc2DiscreteWord1]) =>
      fcdc1DiscreteWord1.bitValueOr(11, false) || fcdc2DiscreteWord1.bitValueOr(11, false),
    this.fcdc1DiscreteWord1,
    this.fcdc2DiscreteWord1,
  );

  private readonly maskTransform = MappedSubject.create(
    ([pitch, roll]) => {
      const multiplier = 1000;
      const currentValueAtPrecision = Math.round(pitch.value * multiplier) / multiplier;
      const rollValueAtPrecision = Math.round(roll.value * multiplier) / multiplier;
      if (pitch.isNormalOperation()) {
        return `rotate(${-rollValueAtPrecision} 640 329.143) translate3d(0px, ${calculateHorizonOffsetFromPitch(currentValueAtPrecision) - FIVE_DEG}px, 0px) `;
      }
    },
    this.pitch,
    this.roll,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub.on('headingAr').handle((h) => {
      this.headingFailed.set(!h.isNormalOperation());
    });

    this.sub
      .on('pitchAr')
      .withArinc429Precision(3)
      .handle((pitch) => {
        const multiplier = 1000;
        const currentValueAtPrecision = Math.round(pitch.value * multiplier) / multiplier;
        if (pitch.isNormalOperation()) {
          this.pitchGroupRef.instance.style.display = 'block';

          this.pitchGroupRef.instance.style.transform = `translate3d(0px, ${calculateHorizonOffsetFromPitch(currentValueAtPrecision) - FIVE_DEG}px, 0px)`;
        } else {
          this.pitchGroupRef.instance.style.display = 'none';
        }
        const yOffset = Math.max(
          Math.min(calculateHorizonOffsetFromPitch(currentValueAtPrecision) - FIVE_DEG, 31.563),
          -31.563,
        );
        this.yOffset.set(yOffset);
        this.GroupRef.instance.style.clipPath = this.crosswindMode.get()
          ? 'url(#cwPitchScaleMask)'
          : 'url(#PitchScaleMask)';
      });

    this.sub
      .on('rollAr')
      .withArinc429Precision(2)
      .handle((roll) => {
        const multiplier = 100;
        const currentValueAtPrecision = Math.round(roll.value * multiplier) / multiplier;
        if (roll.isNormalOperation()) {
          this.rollGroupRef.instance.style.display = 'block';

          this.rollGroupRef.instance.setAttribute('transform', `rotate(${-currentValueAtPrecision} 640 329.143)`);
        } else {
          this.rollGroupRef.instance.style.display = 'none';
        }
        this.GroupRef.instance.style.clipPath = this.crosswindMode.get()
          ? 'url(#cwPitchScaleMask)'
          : 'url(#PitchScaleMask)';
      });
  }

  render(): VNode {
    return (
      <g id="HorizonGroup">
        <defs>
          <clipPath id="PitchScaleMask" transform={this.maskTransform}>
            <path
              d=" m 0 125 L 1280 125
                    L 1280 712 L 1140 712 L 1140 329 L 1029 329 L 1029 712 L 1280 712
                    L 1280 800   L 900 800  L 900 925  L 330 925 L 330 800 L 0 800 L 0 420
                    L 0 712 L 219 712 L 219 329 L 95 329 L 95 712 L 0 712 Z"
            />
          </clipPath>
          <clipPath id="cwPitchScaleMask" transform={this.maskTransform}>
            <path
              d=" m 0 125 L 1280 125
                L 1280 255 L 1040 255 L 1040 405 L 1139 405L 1139 255 L 1280 255 L 1280 712
                L 1280 800   L 900 800  L 900 925  L 330 925 L 330 800 L 0 800 L 0 420
                L 209 420 L 209 238 L 111 238 L 111 420 L 0 420 z "
            />
          </clipPath>
        </defs>

        <g ref={this.GroupRef}>
          <g id="RollGroup" ref={this.rollGroupRef} style="display:none">
            <g id="PitchGroup" ref={this.pitchGroupRef}>
              <PitchScale
                bus={this.props.bus}
                filteredRadioAlt={this.props.filteredRadioAlt}
                isAttExcessive={this.props.isAttExcessive}
              />

              {/* horizon */}
              <path id="HorizonLine" d="m -100 512 h 1480" class="NormalStroke Green" />

              <HorizontalTape
                type="headingTape"
                bus={this.props.bus}
                displayRange={DisplayRange}
                valueSpacing={ValueSpacing}
                distanceSpacing={DistanceSpacing}
                yOffset={Subject.create(0)}
              />

              <HeadingOfftape bus={this.props.bus} failed={this.headingFailed} />

              <TailstrikeIndicator bus={this.props.bus} />

              <SyntheticRunway bus={this.props.bus} filteredRadioAlt={this.props.filteredRadioAlt} />
            </g>

            <SideslipIndicator bus={this.props.bus} instrument={this.props.instrument} />

            <HeadingBug bus={this.props.bus} isCaptainSide={getDisplayIndex() === 1} yOffset={this.yOffset} />
          </g>
        </g>
      </g>
    );
  }
}

class TailstrikeIndicator extends DisplayComponent<{ bus: EventBus }> {
  private tailStrike = FSComponent.createRef<SVGPathElement>();

  private needsUpdate = false;

  private tailStrikeConditions = {
    altitude: new Arinc429Word(0),
    speed: 0,
    tla1: 0,
    tla2: 0,
    tla3: 0,
    tla4: 0,
    leftGearCompressed: true,
    rightGearCompressed: true,
    approachPhase: false,
  };

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents>();

    sub.on('chosenRa').handle((ra) => {
      this.tailStrikeConditions.altitude = ra;
      this.needsUpdate = true;
    });

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((lg) => {
        this.tailStrikeConditions.leftGearCompressed = lg;
        this.needsUpdate = true;
      });

    sub
      .on('rightMainGearCompressed')
      .whenChanged()
      .handle((rg) => {
        this.tailStrikeConditions.rightGearCompressed = rg;
        this.needsUpdate = true;
      });

    sub
      .on('fmgcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.tailStrikeConditions.approachPhase = fp === 5;
        this.needsUpdate = true;
      });

    sub
      .on('tla1')
      .whenChanged()
      .handle((tla) => {
        this.tailStrikeConditions.tla1 = tla;
        this.needsUpdate = true;
      });
    sub
      .on('tla2')
      .whenChanged()
      .handle((tla) => {
        this.tailStrikeConditions.tla2 = tla;
        this.needsUpdate = true;
      });

    sub
      .on('tla3')
      .whenChanged()
      .handle((tla) => {
        this.tailStrikeConditions.tla3 = tla;
        this.needsUpdate = true;
      });
    sub
      .on('tla4')
      .whenChanged()
      .handle((tla) => {
        this.tailStrikeConditions.tla4 = tla;
        this.needsUpdate = true;
      });

    sub
      .on('speedAr')
      .whenChanged()
      .handle((speed) => {
        this.tailStrikeConditions.speed = speed.value;
        this.needsUpdate = true;
      });

    sub.on('realTime').onlyAfter(2).handle(this.hideShow.bind(this));
  }

  private hideShow(_time: number) {
    if (this.needsUpdate) {
      this.needsUpdate = false;

      // FIX ME indicatior should disappear 3 seconds after takeoff and 4 seconds after go aroud initaition. Use better logic without FM flight phase?
      if (
        ((this.tailStrikeConditions.tla1 >= 35 ||
          this.tailStrikeConditions.tla2 >= 35 ||
          this.tailStrikeConditions.tla3 >= 35 ||
          this.tailStrikeConditions.tla4 >= 35) &&
          this.tailStrikeConditions.leftGearCompressed &&
          this.tailStrikeConditions.rightGearCompressed) ||
        (this.tailStrikeConditions.approachPhase &&
          this.tailStrikeConditions.altitude.value < 400 &&
          this.tailStrikeConditions.speed > 50)
      ) {
        this.tailStrike.instance.style.display = 'inline';
      } else {
        this.tailStrike.instance.style.display = 'none';
      }
    }
  }

  render(): VNode {
    return (
      <path
        ref={this.tailStrike}
        id="TailstrikeWarning"
        d="m 658.88 40 h 14.684 l-33.564 40 -33.564 -40 h 14.684 l 18.88  22.5 z"
        class="NormalStroke Green"
      />
    );
  }
}

interface SideslipIndicatorProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
}

class SideslipIndicator extends DisplayComponent<SideslipIndicatorProps> {
  private sideslipIndicatorFilter = new LagFilter(0.8);

  private classNameSub = Subject.create('Yellow');

  private rollTriangleRef = FSComponent.createRef<SVGGElement>();

  private slideSlip = FSComponent.createRef<SVGPathElement>();

  private onGround = true;

  private leftMainGearCompressed = true;

  private rightMainGearCompressed = true;

  private roll = new Arinc429Word(0);

  private betaTargetActive = 0;

  private beta = 0;

  private betaTarget = 0;

  private latAcc = 0;

  private attitudeIndicator = '';

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & HudElems>();

    sub
      .on('attitudeIndicator')
      .whenChanged()
      .handle((v) => {
        this.attitudeIndicator = v;
        this.rollTriangleRef.instance.style.display = `${this.attitudeIndicator}`;
      });
    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((og) => {
        this.leftMainGearCompressed = og;
        this.onGround = this.rightMainGearCompressed || og;
        this.determineSlideSlip();
      });

    sub
      .on('rightMainGearCompressed')
      .whenChanged()
      .handle((og) => {
        this.rightMainGearCompressed = og;
        this.onGround = this.leftMainGearCompressed || og;
        this.determineSlideSlip();
      });

    sub
      .on('rollAr')
      .withArinc429Precision(2)
      .handle((roll) => {
        this.roll = roll;
        this.determineSlideSlip();
      });

    sub
      .on('beta')
      .withPrecision(2)
      .handle((beta) => {
        this.beta = beta;
        this.determineSlideSlip();
      });

    sub
      .on('betaTargetActive')
      .whenChanged()
      .handle((betaTargetActive) => {
        this.betaTargetActive = betaTargetActive;
        this.determineSlideSlip();
      });

    sub
      .on('betaTarget')
      .withPrecision(2)
      .handle((betaTarget) => {
        this.betaTarget = betaTarget;
        this.determineSlideSlip();
      });

    sub
      .on('latAcc')
      .atFrequency(2)
      .handle((latAcc) => {
        this.latAcc = latAcc;
        this.determineSlideSlip();
      });
  }

  private determineSlideSlip() {
    const multiplier = 100;
    const currentValueAtPrecision = Math.round(this.roll.value * multiplier) / multiplier;
    const verticalOffset = calculateVerticalOffsetFromRoll(currentValueAtPrecision);
    let offset = 0;

    if (this.onGround) {
      // on ground, lateral g is indicated. max 0.3g, max deflection is 15mm
      const latAcc = Math.round(this.latAcc * multiplier) / multiplier; // SimVar.GetSimVarValue('ACCELERATION BODY X', 'G Force');
      const accInG = Math.min(0.3, Math.max(-0.3, latAcc));
      offset = (-accInG * 15) / 0.3;
    } else {
      const beta = this.beta;
      const betaTarget = this.betaTarget;
      offset = Math.max(Math.min((beta - betaTarget) * 5, 75), -75);
    }

    const betaTargetActive = this.betaTargetActive === 1;
    const SIIndexOffset = Math.max(
      0.00001,
      this.sideslipIndicatorFilter.step(offset, this.props.instrument.deltaTime / 1000),
    );

    this.rollTriangleRef.instance.style.transform = `translate3d(0px, ${verticalOffset.toFixed(2)}px, 0px)`;
    this.classNameSub.set(`${betaTargetActive ? 'Green' : 'Green'}`);
    this.slideSlip.instance.style.transform = `translate3d(${SIIndexOffset}px, 0px, 0px)`;
  }

  render(): VNode {
    return (
      <g id="RollTriangleGroup" ref={this.rollTriangleRef} class="NormalStroke Green CornerRound">
        <g transform="translate(295 -60)">
          <path d="m330.37 219.915 14.302 -21.166 14.302 21.166z" />
          <path id="SideSlipIndicator" ref={this.slideSlip} d="m369.87 236.04 -7.492 -11.087h-35.414l-7.492 11.087z" />
        </g>
      </g>
    );
  }
}

class PitchScale extends DisplayComponent<{
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
  filteredRadioAlt: Subscribable<number>;
}> {
  private forcedFma = false;
  private declutterMode = 0;
  private crosswindMode = false;

  private sVisibility = Subject.create<String>('');
  private sVisibilityDeclutterMode2 = Subject.create<String>('');
  private sVisibilitySwitch = Subject.create<String>('block');

  private sub = this.props.bus.getArincSubscriber<
    Arinc429Values & DmcLogicEvents & HUDSimvars & ClockEvents & HudElems & PrimFgBusBaseEvents & FcuEfisCpBusEvents
  >();
  private needsUpdate = false;

  private threeDegLine = FSComponent.createRef<SVGGElement>();
  private pitchScaleMode = PitchscaleMode.FULL;
  private activeVerticalModeSub = Subject.create(0);
  private threeDegPath = FSComponent.createRef<SVGPathElement>();
  private threeDegTxtRef = FSComponent.createRef<SVGTextElement>();
  private threeDegTxtBgRef = FSComponent.createRef<SVGPathElement>();

  private roll = new Arinc429Word(0);
  private pitch = new Arinc429Word(0);
  private fpa = new Arinc429Word(0);
  private da = new Arinc429Word(0);

  private readonly fcuEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(null);
  private readonly lsButtonPressed = this.fcuEisDiscreteWord2.map((word) => word.bitValueOr(14, true));

  private readonly primFgDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_1'));
  private readonly landModeActive = this.primFgDiscreteWord1.map((word) => word.bitValueOr(13, true));

  private readonly primFgDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_2'));
  private readonly gsArmed = this.primFgDiscreteWord2.map((word) => word.bitValueOr(13, true));

  private readonly primFgDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_3'));
  private readonly gsCapt = this.primFgDiscreteWord3.map((word) => word.bitValueOr(21, true));
  private readonly gsTrk = this.primFgDiscreteWord3.map((word) => word.bitValueOr(22, true));
  private readonly isFlareMode = this.primFgDiscreteWord3.map((word) => word.bitValueOr(24, true));
  private readonly isVsModeActive = this.primFgDiscreteWord3.map((word) => word.bitValueOr(17, true));
  private readonly isFpaModeActive = this.primFgDiscreteWord3.map((word) => word.bitValueOr(18, true));
  private readonly isAppDesModeActive = this.primFgDiscreteWord3.map((word) => word.bitValueOr(23, true));

  private readonly selectedVs = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_selected_vertical_speed'));
  private readonly selectedFpa = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_selected_flight_path_angle'));

  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudMode'), 0);
  private readonly decMode = ConsumerSubject.create(this.sub.on('decMode'), 0);
  private readonly flightPhase = ConsumerSubject.create(this.sub.on('fmgcFlightPhase'), 0);
  private readonly gndSpeed = Arinc429LocalVarConsumerSubject.create(this.sub.on('groundSpeed'), 0);

  private readonly isVsOrFpaActive = MappedSubject.create(
    ([isVsModeActive, isFpaModeActive]) => {
      return isVsModeActive || isFpaModeActive;
    },
    this.isVsModeActive,
    this.isFpaModeActive,
  );
  private readonly activeVsFpaAngle = MappedSubject.create(
    ([gndSpeed, selectedVs, selectedFpa, isVsModeActive, isFpaModeActive]) => {
      if (isVsModeActive) {
        return asin(selectedVs.value / (gndSpeed.value * 101.269));
      } else if (isFpaModeActive) {
        return selectedFpa.value;
      } else {
        return -3;
      }
    },
    this.gndSpeed,
    this.selectedVs,
    this.selectedFpa,
    this.isVsModeActive,
    this.isFpaModeActive,
  );

  private readonly isThreeDegLineDashed = MappedSubject.create(
    ([isVsOrFpaActive, lsButtonPressed]) => {
      if (lsButtonPressed) {
        if (isVsOrFpaActive) {
          return true;
        } else {
          return false;
        }
      } else {
        return true;
      }
    },
    this.isVsOrFpaActive,
    this.lsButtonPressed,
  );

  private readonly threeDegLineVis = MappedSubject.create(
    ([
      lsButtonPressed,
      decMode,
      flightPhase,
      isFlareMode,
      hudMode,
      isVsModeActive,
      isFpaModeActive,
      isAppDesModeActive,
    ]) => {
      if (hudMode === HudMode.NORMAL) {
        if (flightPhase === FmgcFlightPhase.Approach) {
          if (lsButtonPressed) {
            return isFlareMode || decMode === 2 ? 'none' : 'block';
          } else {
            if (isVsModeActive || isFpaModeActive || isAppDesModeActive) {
              return isFlareMode || decMode === 2 ? 'none' : 'block';
            } else {
              return 'none';
            }
          }
        } else {
          if (isVsModeActive || isFpaModeActive) {
            return isFlareMode || decMode === 2 ? 'none' : 'block';
          } else {
            return 'none';
          }
        }
      } else {
        return 'none';
      }
    },
    this.lsButtonPressed,
    this.decMode,
    this.flightPhase,
    this.isFlareMode,
    this.hudMode,
    this.isVsModeActive,
    this.isFpaModeActive,
    this.isAppDesModeActive,
  );

  private setPitchScale() {
    if (this.pitchScaleMode === PitchscaleMode.OFF) {
      this.sVisibility.set('none');
      this.sVisibilityDeclutterMode2.set('none');
    } else if (this.pitchScaleMode === PitchscaleMode.FULL) {
      this.sVisibility.set('block');
      this.sVisibilityDeclutterMode2.set('block');
    } else {
      this.sVisibility.set('none');
      this.sVisibilityDeclutterMode2.set('block');
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const isFo = getDisplayIndex() === 2;
    this.fcuEisDiscreteWord2.setConsumer(
      this.sub.on(isFo ? 'fcu_efis_r_discrete_word_2' : 'fcu_efis_l_discrete_word_2'),
    );

    this.sub
      .on('pitchScaleMode')
      .whenChanged()
      .handle((v) => {
        this.pitchScaleMode = v;
        this.setPitchScale();
      });

    this.sub
      .on('decMode')
      .whenChanged()
      .handle((value) => {
        this.declutterMode = value;
        this.setPitchScale();
      });

    this.sub.on('fpa').handle((fpa) => {
      this.fpa = fpa;
      this.needsUpdate = true;
    });
    this.sub.on('da').handle((da) => {
      this.da = da;
      this.needsUpdate = true;
    });
    this.sub.on('rollAr').handle((r) => {
      this.roll = r;
      this.needsUpdate = true;
    });
    this.sub.on('pitchAr').handle((p) => {
      this.pitch = p;
      this.needsUpdate = true;
    });
    this.sub.on('realTime').handle((_t) => {
      if (this.needsUpdate) {
        this.needsUpdate = false;
        const daAndFpaValid = this.fpa.isNormalOperation() && this.da.isNormalOperation();
        if (daAndFpaValid) {
          // this.threeDegRef.instance.classList.remove('HiddenElement');
          this.MoveThreeDegreeMark();
        } else {
          // this.threeDegRef.instance.classList.add('HiddenElement');
        }
      }
    });
  }

  private MoveThreeDegreeMark() {
    const lsSlope = parseFloat(SimVar.GetSimVarValue('NAV RAW GLIDE SLOPE:3', 'degrees'));
    const daLimConv = (this.da.value * DistanceSpacing) / ValueSpacing;
    const pitchSubFpaConv =
      calculateHorizonOffsetFromPitch(this.pitch.value) - calculateHorizonOffsetFromPitch(this.fpa.value);
    const rollCos = Math.cos((this.roll.value * Math.PI) / 180);
    const rollSin = Math.sin((-this.roll.value * Math.PI) / 180);

    const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    this.threeDegLine.instance.style.transform = `translate3d(${xOffset}px, 0px, 0px)`;

    const fpaTxt = this.isFpaModeActive.get()
      ? `${this.selectedFpa.get().value.toFixed(1)}`
      : `${this.selectedVs.get().value.toFixed(0)}`;

    //atan2(selectedVs.value * 0.51444, gndSpeed * 0.00508)
    if (
      this.flightPhase.get() === FmgcFlightPhase.Approach &&
      this.lsButtonPressed.get() &&
      !this.isVsOrFpaActive.get()
    ) {
      const slope = lsSlope == 0 ? 3 : lsSlope;
      this.threeDegPath.instance.setAttribute(
        'd',
        `M 565,${512 + (slope / 5) * FIVE_DEG} h -80  M 713,${512 + (slope / 5) * FIVE_DEG} h 80  `,
      );
      this.threeDegTxtRef.instance.setAttribute('y', `${512 + (slope / 5) * FIVE_DEG + 6.5}`);
      this.threeDegTxtRef.instance.textContent = `-${slope.toFixed(1)}°`;
      this.threeDegTxtRef.instance.classList.remove('Green');
      this.threeDegTxtRef.instance.classList.add('InverseGreen');
      this.threeDegTxtRef.instance.classList.add('FontTinyer');
      this.threeDegTxtRef.instance.classList.remove('FontTiny');
      this.threeDegTxtRef.instance.classList.remove('Fill');
      this.threeDegTxtBgRef.instance.style.display = `block`;
      this.threeDegTxtBgRef.instance.classList.add('GreenFill3');
      this.threeDegTxtBgRef.instance.setAttribute('y', `${512 + (slope / 5) * FIVE_DEG}`);
      this.threeDegTxtBgRef.instance.setAttribute(
        'd',
        `m 800 ${512 + (slope / 5) * FIVE_DEG - 13.5} h 45 v 27 h -45 z `,
      );
    } else if (this.isVsOrFpaActive.get()) {
      this.threeDegPath.instance.setAttribute(
        'd',
        `M 565,${512 - (this.activeVsFpaAngle.get() / 5) * FIVE_DEG} h -80  M 713,${512 - (this.activeVsFpaAngle.get() / 5) * FIVE_DEG} h 80  `,
      );

      this.threeDegTxtRef.instance.setAttribute('y', `${512 - (this.activeVsFpaAngle.get() / 5) * FIVE_DEG + 6.5}`);
      this.threeDegTxtRef.instance.textContent = fpaTxt;
      this.threeDegTxtRef.instance.classList.remove('InverseGreen');
      this.threeDegTxtRef.instance.classList.add('Green');
      this.threeDegTxtRef.instance.classList.add('Fill');
      this.threeDegTxtRef.instance.classList.remove('FontTinyer');
      this.threeDegTxtRef.instance.classList.add('FontTiny');
      this.threeDegTxtBgRef.instance.style.display = `none`;
      this.threeDegTxtBgRef.instance.classList.remove('GreenFill3');
      this.threeDegTxtBgRef.instance.setAttribute('y', `${512 - (this.activeVsFpaAngle.get() / 5) * FIVE_DEG}`);
      this.threeDegTxtBgRef.instance.setAttribute('d', ``);
    } else {
      this.threeDegPath.instance.setAttribute(
        'd',
        `M 565,${512 - (this.activeVsFpaAngle.get() / 5) * FIVE_DEG} h -80  M 713,${512 - (this.activeVsFpaAngle.get() / 5) * FIVE_DEG} h 80  `,
      );
      this.threeDegTxtBgRef.instance.style.display = `none`;
    }

    this.isThreeDegLineDashed.get()
      ? this.threeDegPath.instance.setAttribute('stroke-dasharray', '10 7')
      : this.threeDegPath.instance.setAttribute('stroke-dasharray', '');
  }

  render(): VNode {
    const result = [] as SVGTextElement[];

    // positive pitch, right dotted lines
    for (let i = 1; i < 7; i++) {
      result.push(<path d={`M 518.26,${512 - i * FIVE_DEG} h -71.1 v 11`} display={this.sVisibility} />);
      result.push(<path d={`M 761.74,${512 - i * FIVE_DEG} h 71.1 v 11`} display={this.sVisibility} />);
    }

    for (let i = 1; i < 5; i++) {
      // negative pitch, right dotted lines
      i == 1 ? (this.sVisibilitySwitch = this.sVisibilityDeclutterMode2) : (this.sVisibilitySwitch = this.sVisibility);
      result.push(
        <path class="NormalStroke Green" d={`m 761.74,${512 + i * FIVE_DEG} h 12`} display={this.sVisibilitySwitch} />,
        <path class="NormalStroke Green" d={`m 781.44,${512 + i * FIVE_DEG} h 12`} display={this.sVisibilitySwitch} />,
        <path class="NormalStroke Green" d={`m 801.14,${512 + i * FIVE_DEG} h 12`} display={this.sVisibilitySwitch} />,
        <path
          class="NormalStroke Green"
          d={`m 820.84,${512 + i * FIVE_DEG} h 12 v -11 `}
          display={this.sVisibilitySwitch}
        />,
      );
      // negative pitch, left dotted lines
      result.push(
        <path class="NormalStroke Green" d={`m 518.26,${512 + i * FIVE_DEG} h -12`} display={this.sVisibilitySwitch} />,
        <path class="NormalStroke Green" d={`m 498.56,${512 + i * FIVE_DEG} h -12`} display={this.sVisibilitySwitch} />,
        <path class="NormalStroke Green" d={`m 478.86,${512 + i * FIVE_DEG} h -12`} display={this.sVisibilitySwitch} />,
        <path
          class="NormalStroke Green"
          d={`m 459.16,${512 + i * FIVE_DEG} h -12 v -11`}
          display={this.sVisibilitySwitch}
        />,
      );
    }

    // //3° line
    result.push(
      <g id="ThreeDegreeLine" ref={this.threeDegLine} display={this.threeDegLineVis}>
        <path ref={this.threeDegPath} d="" stroke-dasharray="" />
        <g id="SlopeTxt">
          <path ref={this.threeDegTxtBgRef} d="m835 348.5 h45v27h-45z"></path>
          <text x="822.5" ref={this.threeDegTxtRef} class="FontTinyer MiddleAlign InverseGreen"></text>
        </g>
      </g>,
    );

    for (let i = -4; i < 7; i++) {
      if (i === 0) {
        continue;
      }
      i == -1 ? (this.sVisibilitySwitch = this.sVisibilityDeclutterMode2) : (this.sVisibilitySwitch = this.sVisibility);

      const value: number = i * 5;
      const str: string = value.toString();
      result.push(
        <text
          class="FontSmall Green Fill EndAlign"
          x="445"
          y={512 - i * FIVE_DEG + 8.35}
          display={this.sVisibilitySwitch}
        >
          {str}
        </text>,
      );
      result.push(
        <text
          class="FontSmall Green Fill StartAlign"
          x="835"
          y={512 - i * FIVE_DEG + 8.35}
          display={this.sVisibilitySwitch}
        >
          {str}
        </text>,
      );
    }
    return (
      <g id="pitchScale" class="NormalStroke Green">
        {result}
      </g>
    );
  }
}
