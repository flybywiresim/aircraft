import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  VNode,
  NodeReference,
  ClockEvents,
  Subscribable,
  Subscription,
} from '@microsoft/msfs-sdk';
import {
  Arinc429ConsumerSubject,
  Arinc429Register,
  Arinc429Word,
  Arinc429RegisterSubject,
  NXDataStore,
  Arinc429LocalVarConsumerSubject,
} from '@flybywiresim/fbw-sdk';
import { calculateHorizonOffsetFromPitch, HudElems, HudMode, LagFilter, RateLimiter } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { getDisplayIndex } from './HUD';
import { FIVE_DEG, calculateVerticalOffsetFromRoll, OutlinedPath, setAttributes } from './HUDUtils';
import { PrimFeBusBaseEvents } from '@shared/publishers/PrimFePublisher';
import { FcuEfisCpBusEvents } from '@shared/publishers/EfisCpBusPublisher';
import { PrimFgBusBaseEvents } from '@shared/publishers/PrimFgPublisher';
import { SelectedFdEvents } from './shared/FdSelectionProvider';
import { ExtendedClockEvents } from '../MsfsAvionicsCommon/providers/ExtendedClockProvider';

const DistanceSpacing = FIVE_DEG;
const ValueSpacing = 5;

export class FlightPathVector extends DisplayComponent<{
  bus: EventBus;
  instrument: BaseInstrument;
  isAttExcessive: Subscribable<boolean>;
  filteredRadioAlt: Subscribable<number>;
}> {
  private birdGroup = FSComponent.createRef<SVGGElement>();
  private birdPathRef = FSComponent.createRef<SVGPathElement>();
  private birdPathBgRef = FSComponent.createRef<SVGPathElement>();
  private birdFreePath = FSComponent.createRef<SVGPathElement>();
  private birdFreePathBg = FSComponent.createRef<SVGPathElement>();
  private crosswindMode = false;
  private readonly sub = this.props.bus.getSubscriber<
    Arinc429Values & HUDSimvars & HudElems & PrimFgBusBaseEvents & FcuEfisCpBusEvents & SelectedFdEvents
  >();

  private readonly fpv = ConsumerSubject.create(this.sub.on('flightPathVector').whenChanged(), '');

  private readonly fcuEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(null);

  private readonly roll = Arinc429ConsumerSubject.create(this.sub.on('rollAr'));
  private readonly pitch = Arinc429ConsumerSubject.create(this.sub.on('pitchAr'));
  private readonly fpa = Arinc429ConsumerSubject.create(this.sub.on('fpa'));
  private readonly da = Arinc429ConsumerSubject.create(this.sub.on('da'));

  private primFgDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_1'));

  private readonly ap1Engaged = this.primFgDiscreteWord1.map((word) => word.bitValueOr(11, false));

  private readonly ap2Engaged = this.primFgDiscreteWord1.map((word) => word.bitValueOr(12, false));

  private readonly isAnyApEngaged = MappedSubject.create(
    ([ap1Engaged, ap2Engaged]) => {
      return ap1Engaged || ap2Engaged;
    },
    this.ap1Engaged,
    this.ap2Engaged,
  );
  private readonly isDaAndFpaValid = MappedSubject.create(
    ([da, fpa]) => da.isNormalOperation() && fpa.isNormalOperation(),
    this.da,
    this.fpa,
  );
  private readonly isRollAndPitchValid = MappedSubject.create(
    ([roll, pitch]) => roll.isNormalOperation() && pitch.isNormalOperation(),
    this.roll,
    this.pitch,
  );

  private readonly isBirdHidden = MappedSubject.create(
    ([isValid]) => !isValid,

    this.isDaAndFpaValid,
  );

  private readonly isFailureFlagHidden = MappedSubject.create(
    ([isDaAndFpaValid, isRollAndPitchValid]) => isDaAndFpaValid || !isRollAndPitchValid,

    this.isDaAndFpaValid,
    this.isRollAndPitchValid,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isFo = getDisplayIndex() === 2;

    this.fcuEisDiscreteWord2.setConsumer(
      this.sub.on(isFo ? 'fcu_efis_r_discrete_word_2' : 'fcu_efis_l_discrete_word_2'),
    );

    const moveBirdSub = MappedSubject.create(this.roll, this.pitch, this.fpa, this.da).sub(
      () => {
        this.moveBird.call(this);
      },
      true,
      true,
    );

    this.isBirdHidden.sub((isHidden) => {
      if (isHidden) {
        moveBirdSub.pause();
      } else {
        moveBirdSub.resume(true);
      }
    }, true);

    // Use The raw position of the cockpit switch instead of the hudProvider to avoid  the forced reversion on approach if declutter 2 is selected.
    this.sub
      .on(getDisplayIndex() === 1 ? 'crosswindModeL' : 'crosswindModeR')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
      });
  }

  private useLockedFreeFpv() {
    let birdOffRange = false;

    let xOffsetLim;
    const daLimConv = (this.da.get().value * DistanceSpacing) / ValueSpacing;
    const pitchSubFpaConv =
      calculateHorizonOffsetFromPitch(this.pitch.get().value) - calculateHorizonOffsetFromPitch(this.fpa.get().value);
    const rollCos = Math.cos((this.roll.get().value * Math.PI) / 180);
    const rollSin = Math.sin((-this.roll.get().value * Math.PI) / 180);

    const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    const yOffset = pitchSubFpaConv * rollCos + daLimConv * rollSin;

    //set lateral limit for fdCue
    if (this.crosswindMode === false) {
      this.birdFreePath.instance.style.display = 'none';
      this.birdFreePathBg.instance.style.display = 'none';
      if (xOffset < -378 || xOffset > 350) {
        birdOffRange = true;
      } else {
        birdOffRange = false;
      }
      if (birdOffRange) {
        this.birdPathRef.instance.setAttribute('stroke-dasharray', '3 6');
      } else {
        this.birdPathRef.instance.setAttribute('stroke-dasharray', '');
      }

      xOffsetLim = Math.max(Math.min(xOffset, 350), -378);
      this.birdGroup.instance.style.transform = `translate3d(${xOffsetLim}px, ${yOffset - FIVE_DEG}px, 0px)`;
    } else {
      this.birdFreePath.instance.style.display = 'block';
      this.birdFreePathBg.instance.style.display = 'block';
      this.birdPathRef.instance.setAttribute('stroke-dasharray', '');

      if (xOffset < -540 || xOffset > 540) {
        birdOffRange = true;
      } else {
        birdOffRange = false;
      }
      xOffsetLim = Math.max(Math.min(xOffset, 540), -540);
      this.birdGroup.instance.style.transform = `translate3d(0px, ${yOffset - FIVE_DEG}px, 0px)`;

      this.birdFreePath.instance.style.transform = `translate3d(${xOffsetLim}px, ${yOffset - FIVE_DEG}px, 0px)`;
      this.birdFreePathBg.instance.style.transform = `translate3d(${xOffsetLim}px, ${yOffset - FIVE_DEG}px, 0px)`;
    }

    if (this.crosswindMode) {
      this.isAnyApEngaged.get()
        ? setAttributes(
            'd',
            'M 627 512 l 13 13 l 13 -13 l -13 -13  l -13 13 Z M 627 512 l 13 13 l 13 -13 l -13 -13  l -13 13 Z M 592 512 h 35 m 13 -13 v -19z m 13 13 h 35 M 592 502 v20 M 688 502 v20',
            [this.birdPathBgRef, this.birdPathRef],
          )
        : setAttributes(
            'd',
            'M 627 512 C 627 519,  633 525, 640 525 S 653 519, 653 512 S 647 499, 640 499 S 627 505, 627 512 Z  M 627 512 C 627 519,  633 525, 640 525 S 653 519, 653 512 S 647 499, 640 499 S 627 505, 627 512 Z M 592 512 h 35 m 13 -13 v -13z m 13 13 h 35 M 592 502 v20 M 688 502 v20',
            [this.birdPathBgRef, this.birdPathRef],
          );
    } else {
      this.isAnyApEngaged.get()
        ? setAttributes(
            'd',
            'M 627 512 l 13 13 l 13 -13 l -13 -13  l -13 13 Z M 627 512 l 13 13 l 13 -13 l -13 -13  l -13 13 Z M 592 512 h 35 m 13 -13 v -19z m 13 13 h 35',
            [this.birdPathBgRef, this.birdPathRef],
          )
        : setAttributes(
            'd',
            'M 627 512 C 627 519,  633 525, 640 525 S 653 519, 653 512 S 647 499, 640 499 S 627 505, 627 512 Z  M 627 512 C 627 519,  633 525, 640 525 S 653 519, 653 512 S 647 499, 640 499 S 627 505, 627 512 Z M 592 512 h 35 m 13 -13 v -13z m 13 13 h 35',
            [this.birdPathBgRef, this.birdPathRef],
          );
    }
  }

  private useSingleFpv() {
    let birdOffRange = false;

    let xOffsetLim;
    const daLimConv = (this.da.get().value * DistanceSpacing) / ValueSpacing;
    const pitchSubFpaConv =
      calculateHorizonOffsetFromPitch(this.pitch.get().value) - calculateHorizonOffsetFromPitch(this.fpa.get().value);
    const rollCos = Math.cos((this.roll.get().value * Math.PI) / 180);
    const rollSin = Math.sin((-this.roll.get().value * Math.PI) / 180);

    const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    const yOffset = pitchSubFpaConv * rollCos + daLimConv * rollSin;

    //set lateral limit for fdCue
    if (this.crosswindMode === false) {
      if (xOffset < -378 || xOffset > 350) {
        birdOffRange = true;
      } else {
        birdOffRange = false;
      }

      xOffsetLim = Math.max(Math.min(xOffset, 350), -378);
    } else {
      if (xOffset < -540 || xOffset > 540) {
        birdOffRange = true;
      } else {
        birdOffRange = false;
      }
      xOffsetLim = Math.max(Math.min(xOffset, 540), -540);
    }

    this.birdGroup.instance.style.transform = `translate3d(${xOffsetLim}px, ${yOffset - FIVE_DEG}px, 0px)`;

    if (birdOffRange) {
      this.birdPathRef.instance.setAttribute('stroke-dasharray', '3 6');
    } else {
      this.birdPathRef.instance.setAttribute('stroke-dasharray', '');
    }
    this.isAnyApEngaged.get()
      ? setAttributes(
          'd',
          'M 627 512 l 13 13 l 13 -13 l -13 -13  l -13 13 Z M 627 512 l 13 13 l 13 -13 l -13 -13  l -13 13 Z M 592 512 h 35 m 13 -13 v -19z m 13 13 h 35',
          [this.birdPathBgRef, this.birdPathRef],
        )
      : setAttributes(
          'd',
          'M 627 512 C 627 519,  633 525, 640 525 S 653 519, 653 512 S 647 499, 640 499 S 627 505, 627 512 Z  M 627 512 C 627 519,  633 525, 640 525 S 653 519, 653 512 S 647 499, 640 499 S 627 505, 627 512 Z M 592 512 h 35 m 13 -13 v -13z m 13 13 h 35',
          [this.birdPathBgRef, this.birdPathRef],
        );

    this.birdFreePath.instance.style.display = 'none';
    this.birdFreePathBg.instance.style.display = 'none';
  }
  private moveBird() {
    const hudXwindFpvType = parseInt(NXDataStore.getLegacy('HUD_FPV_TYPE', '0'));
    hudXwindFpvType === 0 ? this.useLockedFreeFpv() : this.useSingleFpv();
  }

  render(): VNode {
    return (
      <>
        {OutlinedPath(
          'm 627 512 l 10.5 2.5 l 2.5 10.5 l 2.5 -10.5 l 10.5 -2.5 l -10.5 -2.5 l -2.5 -10.5 l -2.5 10.5 z',
          'NormalStroke InverseGreen',
          'NormalStroke Green',
          this.birdFreePathBg,
          this.birdFreePath,
        )}
        <g ref={this.birdGroup} id="bird">
          <g id="FlightPathVector">
            {OutlinedPath('', 'NormalStroke InverseGreen', 'NormalStroke Green', this.birdPathBgRef, this.birdPathRef)}
          </g>
          <text
            id="FPVFlag"
            x="315"
            y="450"
            class={{
              HiddenElement: this.isFailureFlagHidden,
              Blink9Seconds: true,
              FontLargest: true,
              Red: true,
              EndAlign: true,
            }}
          >
            FPV
          </text>
          <SpeedChevrons bus={this.props.bus} instrument={this.props.instrument} />

          <DeltaSpeed bus={this.props.bus} />
          <RadioAltAndDH
            bus={this.props.bus}
            filteredRadioAltitude={this.props.filteredRadioAlt}
            attExcessive={this.props.isAttExcessive}
          />
          <FlareIndicator bus={this.props.bus} />
          <SpoilersIndicator bus={this.props.bus} />
        </g>
      </>
    );
  }
}
interface SpeedChevronsProps {
  bus: EventBus;
  instrument: BaseInstrument;
}

export class SpeedChevrons extends DisplayComponent<SpeedChevronsProps> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<
    PrimFeBusBaseEvents & Arinc429Values & HUDSimvars & ClockEvents & HudElems & ExtendedClockEvents
  >();

  private vCTrendWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_speed_trend').atFrequency(10));
  private refElement = FSComponent.createRef<SVGGElement>();
  private leftChevron = FSComponent.createRef<SVGPathElement>();
  private rightChevron = FSComponent.createRef<SVGPathElement>();
  private leftChevronBg = FSComponent.createRef<SVGPathElement>();
  private rightChevronBg = FSComponent.createRef<SVGPathElement>();
  private inRange = true;
  private merged = false;

  private readonly groundSpeed = Arinc429LocalVarConsumerSubject.create(this.sub.on('groundSpeed'), 0);
  private readonly hudmode = ConsumerSubject.create(this.sub.on('hudFlightPhaseMode'), 0);
  private readonly spdChevronsVis = ConsumerSubject.create(this.sub.on('spdChevrons'), 'block');

  private previousAirspeed = 0;
  private thresholdSpeed = 35;
  private lagFilter = new LagFilter(1.6);
  private airspeedAccRateLimiter = new RateLimiter(1.2, -1.2);

  private setOffset() {
    const sign =
      Math.abs(this.getAccel()) > Math.abs(this.vCTrendWord.get().value)
        ? Math.sign(this.getAccel())
        : Math.sign(this.vCTrendWord.get().value);
    const trend = sign * Math.max(Math.abs(this.getAccel()), Math.abs(this.vCTrendWord.get().value));
    if (this.vCTrendWord.get().isNormalOperation()) {
      this.refElement.instance.style.visibility = 'visible';
      const offset = (-trend * 28) / 5;
      const UsedOffset = Math.max(offset, -FIVE_DEG);
      offset <= -FIVE_DEG ? (this.inRange = false) : (this.inRange = true);
      if (UsedOffset === offset) {
        this.merged = true;
      } else {
        this.merged = false;
      }
      if (this.merged == false) {
        if (this.inRange) {
          this.leftChevron.instance.setAttribute('stroke-dasharray', '');
          this.rightChevron.instance.setAttribute('stroke-dasharray', '');
        } else {
          this.leftChevron.instance.setAttribute('stroke-dasharray', '2 3.5 2 3.5 2 3 2 3');
          this.rightChevron.instance.setAttribute('stroke-dasharray', '2 3.5 2 3.5 2 3 2 3');
        }
      } else {
        this.leftChevron.instance.setAttribute('stroke-dasharray', '');
        this.rightChevron.instance.setAttribute('stroke-dasharray', '');
      }

      this.refElement.instance.style.transform = `translate3d(0px, ${UsedOffset}px, 0px)`;
    } else {
      this.refElement.instance.style.visibility = 'hidden';
    }
  }

  private getAccel() {
    const { deltaTime } = this.props.instrument;
    const clamped = Math.min(this.groundSpeed.get().value, this.thresholdSpeed + 100);
    const airspeedAcc = ((clamped - this.previousAirspeed) / deltaTime) * 1000;
    this.previousAirspeed = clamped;

    let filteredAirspeedAcc = this.lagFilter.step(airspeedAcc, deltaTime / 1000);
    filteredAirspeedAcc = this.airspeedAccRateLimiter.step(filteredAirspeedAcc, deltaTime / 1000);

    const targetSpeed = filteredAirspeedAcc * 10;
    const offset = (targetSpeed * DistanceSpacing) / ValueSpacing / 30;
    return offset;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.groundSpeed, this.hudmode);

    this.subscriptions.push(
      this.groundSpeed.sub(() => {
        this.setOffset();
      }),
    );
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode | null {
    return (
      <g id="SpeedChevrons" ref={this.refElement} display={this.spdChevronsVis}>
        {OutlinedPath(
          'M 572 500 l 12 12 l -12 12 M 572 500 l 12 12 l-12 12',
          'NormalStroke InverseGreen',
          'NormalStroke Green',
          this.leftChevronBg,
          this.leftChevron,
        )}
        {OutlinedPath(
          'M 708 500 l -12 12 l 12 12 M 708 500 l -12 12 l 12 12',
          'NormalStroke InverseGreen',
          'NormalStroke Green',
          this.rightChevronBg,
          this.rightChevron,
        )}
      </g>
    );
  }
}

class DeltaSpeed extends DisplayComponent<{ bus: EventBus }> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<
    HUDSimvars & ClockEvents & Arinc429Values & HudElems & PrimFgBusBaseEvents
  >();
  private speedRefs: NodeReference<SVGPathElement>[] = [];
  private speedGroupRef = FSComponent.createRef<SVGGElement>();
  private needsUpdate = true;

  private isSpeedManaged = new Arinc429Word(0);
  private readonly speed = Arinc429ConsumerSubject.create(this.props.bus.getSubscriber<Arinc429Values>().on('speedAr'));
  private readonly fmgcFlightPhase = ConsumerSubject.create(this.sub.on('fmgcFlightPhase').whenChanged(), 0);
  private readonly pfdTargetSpeed = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_pfd_speed_target'));
  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudFlightPhaseMode').whenChanged(), 0);

  private readonly isVisible = MappedSubject.create(([hudMode]) => {
    return hudMode === 0 ? true : false;
  }, this.hudMode);

  private setDeltaSpeed() {
    const deltaSpeed = this.speed.get().value - this.pfdTargetSpeed.get().value;
    const sign = Math.sign(deltaSpeed);
    const deltaSpeedDraw = Math.abs(deltaSpeed) >= 15 ? sign * 15 : deltaSpeed;

    if (Math.abs(deltaSpeed) < 15) {
      this.speedRefs[0].instance.setAttribute('d', `m 596,512 v ${-deltaSpeedDraw * 5} h 9 v ${deltaSpeedDraw * 5}`);

      for (let i = 1; i < 8; i++) {
        i * 2 < Math.abs(deltaSpeed)
          ? (this.speedRefs[i].instance.style.display = 'block')
          : (this.speedRefs[i].instance.style.display = 'none');

        i === 5
          ? this.speedRefs[i].instance.setAttribute('d', `m 596 ${512 - i * 10 * sign} h 9`)
          : this.speedRefs[i].instance.setAttribute('d', `m 599.5 ${512 - i * 10 * sign} h 2`);
      }
    } else {
      this.speedRefs[0].instance.setAttribute('d', ``);
      for (let i = 1; i < 8; i++) {
        this.speedRefs[i].instance.style.display = 'block';
        this.speedRefs[i].instance.setAttribute('d', `m 596 ${512 - i * 10 * sign} h 9`);
      }
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.needsUpdate = true;
    this.subscriptions.push(this.fmgcFlightPhase, this.hudMode);

    this.speed.sub(this.setDeltaSpeed.bind(this));
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    for (let i = 0; i < 8; i++) {
      this.speedRefs.push(FSComponent.createRef<SVGPathElement>());
    }
    return (
      <>
        <g ref={this.speedGroupRef} id="DeltaSpeedGroup" display={this.isVisible.map((v) => (v ? 'block' : 'none'))}>
          <g class="NormalStroke CornerRound Green">
            <path ref={this.speedRefs[7]} d="m 599 582 h 3" />
            <path ref={this.speedRefs[6]} d="m 599 572 h 3" />
            <path ref={this.speedRefs[5]} d="m 596 562 h 9" />
            <path ref={this.speedRefs[4]} d="m 599 552 h 3" />
            <path ref={this.speedRefs[3]} d="m 599 542 h 3" />
            <path ref={this.speedRefs[2]} d="m 599 532 h 3" />
            <path ref={this.speedRefs[1]} d="m 599 522 h 3" />
          </g>

          <path ref={this.speedRefs[0]} d="" class="NormalStroke CornerRound Green GreenFill2" />
        </g>
      </>
    );
  }
}

class RadioAltAndDH extends DisplayComponent<{
  readonly bus: EventBus;
  readonly filteredRadioAltitude: Subscribable<number>;
  readonly attExcessive: Subscribable<boolean>;
}> {
  private sVisibility = Subject.create('none');
  private daRaGroup = FSComponent.createRef<SVGGElement>();

  private roll = new Arinc429Word(0);

  private readonly dh = Arinc429RegisterSubject.createEmpty();

  private filteredRadioAltitude = 0;

  private radioAltitude = new Arinc429Word(0);

  private transAltAr = Arinc429Register.empty();

  private transLvlAr = Arinc429Register.empty();

  private fwcFlightPhase = 0;

  private altitude = new Arinc429Word(0);

  private attDhText = FSComponent.createRef<SVGTextElement>();

  private radioAltText = Subject.create('0');

  private radioAlt = FSComponent.createRef<SVGTextElement>();

  private classSub = Subject.create('');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values>();

    sub
      .on('fmTransAltRaw')
      .whenChanged()
      .handle((ta) => {
        this.transAltAr.set(ta);
      });

    sub
      .on('fmTransLvlRaw')
      .whenChanged()
      .handle((tl) => {
        this.transLvlAr.set(tl);
      });

    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.fwcFlightPhase = fp;
        fp >= 4 && fp <= 11 ? this.sVisibility.set('block') : this.sVisibility.set('none');
      });

    sub.on('chosenRa').handle((ra) => {
      this.radioAltitude = ra;
      if (!this.props.attExcessive.get()) {
        const raFailed = !this.radioAltitude.isFailureWarning();
        const raHasData = !this.radioAltitude.isNoComputedData();
        const raValue = this.filteredRadioAltitude;
        const verticalOffset = calculateVerticalOffsetFromRoll(this.roll.value);
        const useTransAltVsLvl = this.fwcFlightPhase <= 3;
        const chosenTransalt = useTransAltVsLvl ? this.transAltAr : this.transLvlAr;
        const belowTransitionAltitude =
          chosenTransalt.isNormalOperation() &&
          !this.altitude.isNoComputedData() &&
          this.altitude.value < (useTransAltVsLvl ? chosenTransalt.value : chosenTransalt.value * 100);
        let size = 'FontMedium';
        const dh = this.dh.get();
        const DHValid = dh.value >= 0 && !dh.isNoComputedData() && !dh.isFailureWarning();

        let text = '';
        let color = 'Green';

        if (raHasData) {
          if (raFailed) {
            if (raValue < 2500) {
              if (raValue > 400 || (raValue > dh.value + 100 && DHValid)) {
                color = 'Green';
              }
              if (raValue < 400) {
                size = 'FontMedium';
              }
              if (raValue < 5) {
                text = Math.round(raValue).toString();
              } else if (raValue <= 50) {
                text = (Math.round(raValue / 5) * 5).toString();
              } else if (raValue > 50 || (raValue > dh.value + 100 && DHValid)) {
                text = (Math.round(raValue / 10) * 10).toString();
              }
            }
          } else {
            color = belowTransitionAltitude ? 'Green Blink9Seconds' : 'Green';
            text = 'RA';
          }

          raValue < 5 ? this.sVisibility.set('none') : this.sVisibility.set('block');
        }

        this.daRaGroup.instance.style.transform = `translate3d(0px, ${-verticalOffset}px, 0px)`;
        if (raFailed && DHValid && raValue <= dh.value) {
          this.attDhText.instance.style.visibility = 'visible';
        } else {
          this.attDhText.instance.style.visibility = 'hidden';
        }
        this.radioAltText.set(text);
        this.classSub.set(`${size} ${color} MiddleAlign TextOutline`);
      }
    });

    this.props.filteredRadioAltitude.sub((fra) => {
      this.filteredRadioAltitude = fra;
    }, true);

    this.props.attExcessive.sub((ae) => {
      if (ae) {
        this.radioAlt.instance.style.visibility = 'hidden';
      } else {
        this.radioAlt.instance.style.visibility = 'visible';
      }
    });

    sub.on('fmDhRaw').handle(this.dh.setWord.bind(this.dh));
  }

  render(): VNode {
    return (
      <g ref={this.daRaGroup} id="DHAndRAGroup" display={this.sVisibility}>
        <text
          ref={this.attDhText}
          id="AttDHText"
          x="0"
          y="0"
          class="FontMedium Green MiddleAlign Blink9Seconds TextOutline"
          transform="translate(640 630)"
        >
          DH
        </text>
        <text ref={this.radioAlt} id="RadioAlt" x="0" y="0" transform="translate(640 600)" class={this.classSub}>
          {this.radioAltText}
        </text>
      </g>
    );
  }
}

class FlareIndicator extends DisplayComponent<{
  bus: EventBus;
}> {
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & PrimFgBusBaseEvents>();
  private sVisibility = Subject.create('none');
  private flareVis = Subject.create('');
  private flareGroup = FSComponent.createRef<SVGGElement>();
  private verticalMode = 0;
  private readonly primFgDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_3'));
  private readonly flareModeActive = this.primFgDiscreteWord3.map((word) => word.bitValueOr(24, false));
  private readonly leftMainGearCompressed = ConsumerSubject.create(this.sub.on('leftMainGearCompressed'), true);

  private readonly rightMainGearCompressed = ConsumerSubject.create(this.sub.on('leftMainGearCompressed'), true);

  private readonly flareModeVis = MappedSubject.create(
    ([leftMainGearCompressed, rightMainGearCompressed, flareModeActive]) => {
      return flareModeActive && !(leftMainGearCompressed || rightMainGearCompressed) ? 'block' : 'none';
    },
    this.leftMainGearCompressed,
    this.rightMainGearCompressed,
    this.flareModeActive,
  );

  render(): VNode {
    return (
      <g ref={this.flareGroup} id="FlareArrows" display={this.flareModeVis}>
        <path class="NormalStroke Green" d="m 615,512 v -32" />
        <path class="NormalStroke Green" d="m 609,496 l 6 -16  l 6 16" />
        <path class="NormalStroke Green" d="m 665,512 v -32" />
        <path class="NormalStroke Green" d="m 659,496 l 6 -16  l 6 16" />
      </g>
    );
  }
}

export class SpoilersIndicator extends DisplayComponent<{ bus: EventBus }> {
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();
  private refElement = FSComponent.createRef<SVGGElement>();
  private leftSpoilers = FSComponent.createRef<SVGGElement>();
  private rightSpoliers = FSComponent.createRef<SVGGElement>();

  private readonly spCommanded = ConsumerSubject.create(this.sub.on('spoilersCommanded').whenChanged(), 0);
  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudFlightPhaseMode').whenChanged(), 0);

  private readonly isDeployed = MappedSubject.create(
    ([spCommanded, hudMode]) => {
      return spCommanded > 25 && hudMode === HudMode.ROLLOUT_OR_RTO ? 'block' : 'none';
    },
    this.spCommanded,
    this.hudMode,
  );
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }
  render(): VNode | null {
    return (
      <g id="SpoilersIndicator" display={this.isDeployed}>
        <path ref={this.leftSpoilers} class="NormalStroke Green Fill" d="m 593 512 v -17 h 17 v 17" />
        <path ref={this.rightSpoliers} class="NormalStroke Green Fill" d="m 670 512 v -17 h 17 v 17" />
      </g>
    );
  }
}
