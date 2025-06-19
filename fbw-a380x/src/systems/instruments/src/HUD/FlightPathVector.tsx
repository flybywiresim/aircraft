import {
  ConsumerSubject,
  CssTransformBuilder,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
  VNode,
  NodeReference,
  ClockEvents,
} from '@microsoft/msfs-sdk';
import {
  Arinc429ConsumerSubject,
  Arinc429WordData,
  Arinc429Register,
  Arinc429Word,
  ArincEventBus,
  Arinc429RegisterSubject,
  NXDataStore,
} from '@flybywiresim/fbw-sdk';
import { calculateHorizonOffsetFromPitch, HudElems, HudMode } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { getDisplayIndex } from './HUD';
import { FIVE_DEG, calculateVerticalOffsetFromRoll } from './HUDUtils';
import { SimplaneValues } from './shared/SimplaneValueProvide';
import { VerticalMode } from '@shared/autopilot';
const DistanceSpacing = FIVE_DEG;
const ValueSpacing = 5;

interface FlightPathVectorData {
  readonly roll: Subscribable<Arinc429WordData>;
  readonly pitch: Subscribable<Arinc429WordData>;
  readonly fpa: Subscribable<Arinc429WordData>;
  readonly da: Subscribable<Arinc429WordData>;
}

// FIXME should get smaller when FD is on
export class FlightPathVector extends DisplayComponent<{
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
  filteredRadioAlt: Subscribable<number>;
}> {
  private birdGroup = FSComponent.createRef<SVGGElement>();
  private birdPath = FSComponent.createRef<SVGPathElement>();
  private birdFreePath = FSComponent.createRef<SVGGElement>();
  private birdLockedPath = FSComponent.createRef<SVGPathElement>();
  private crosswindMode = false;
  private readonly sub = this.props.bus.getSubscriber<Arinc429Values & HUDSimvars & HudElems>();

  private refElement = FSComponent.createRef<SVGGElement>();
  private readonly isVelocityVectorActive = ConsumerSubject.create(
    this.sub.on(getDisplayIndex() === 2 ? 'fcuRightVelocityVectorOn' : 'fcuLeftVelocityVectorOn'),
    false,
  );

  private readonly data: FlightPathVectorData = {
    roll: Arinc429ConsumerSubject.create(this.sub.on('rollAr')),
    pitch: Arinc429ConsumerSubject.create(this.sub.on('pitchAr')),
    fpa: Arinc429ConsumerSubject.create(this.sub.on('fpa')),
    da: Arinc429ConsumerSubject.create(this.sub.on('da')),
  };

  private readonly ap1Active = ConsumerSubject.create(this.sub.on('ap1Active').whenChanged(), false);
  private readonly ap2Active = ConsumerSubject.create(this.sub.on('ap2Active').whenChanged(), false);

  private readonly isRequested = MappedSubject.create(SubscribableMapFunctions.or(), this.isVelocityVectorActive);

  private readonly isDaAndFpaValid = MappedSubject.create(
    ([da, fpa]) => da.isNormalOperation() && fpa.isNormalOperation(),
    this.data.da,
    this.data.fpa,
  );
  private readonly isRollAndPitchValid = MappedSubject.create(
    ([roll, pitch]) => roll.isNormalOperation() && pitch.isNormalOperation(),
    this.data.roll,
    this.data.pitch,
  );

  private readonly isBirdHidden = false;

  private readonly isFailureFlagHidden = MappedSubject.create(
    ([isRequested, isDaAndFpaValid, isRollAndPitchValid]) => !isRequested || isDaAndFpaValid || !isRollAndPitchValid,
    this.isRequested,
    this.isDaAndFpaValid,
    this.isRollAndPitchValid,
  );

  private readonly birdTransformBuilder = CssTransformBuilder.translate3d('px');
  private readonly birdTransform = Subject.create(this.birdTransformBuilder.resolve());

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const moveBirdSub = MappedSubject.create(this.data.roll, this.data.pitch, this.data.fpa, this.data.da).sub(
      this.moveBird.bind(this),
      true,
      true,
    );

    moveBirdSub.resume(true);

    // Use The raw position of the cockpit switch instead of the hudProvider to avoid  the forced reversion on approach if declutter 2 is selected.
    this.sub
      .on(getDisplayIndex() === 1 ? 'crosswindModeL' : 'crosswindModeR')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
      });
  }

  private moveBird() {
    const hudXwindFpvType = parseInt(NXDataStore.get('HUD_FPV_TYPE', '0'));
    hudXwindFpvType === 0 ? this.useLockedFreeFpv() : this.useSingleFpv();
  }
  private useLockedFreeFpv() {
    let birdOffRange = false;

    let xOffsetLim;
    const daLimConv = (this.data.da.get().value * DistanceSpacing) / ValueSpacing;
    const pitchSubFpaConv =
      calculateHorizonOffsetFromPitch(this.data.pitch.get().value) -
      calculateHorizonOffsetFromPitch(this.data.fpa.get().value);
    const rollCos = Math.cos((this.data.roll.get().value * Math.PI) / 180);
    const rollSin = Math.sin((-this.data.roll.get().value * Math.PI) / 180);

    const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    const yOffset = pitchSubFpaConv * rollCos + daLimConv * rollSin;

    //set lateral limit for fdCue
    if (this.crosswindMode === false) {
      this.birdFreePath.instance.style.display = 'none';
      this.birdLockedPath.instance.style.display = 'none';
      if (xOffset < -378 || xOffset > 350) {
        birdOffRange = true;
      } else {
        birdOffRange = false;
      }
      if (birdOffRange) {
        this.birdPath.instance.setAttribute('stroke-dasharray', '3 6');
      } else {
        this.birdPath.instance.setAttribute('stroke-dasharray', '');
      }

      xOffsetLim = Math.max(Math.min(xOffset, 350), -378);
      this.birdGroup.instance.style.transform = `translate3d(${xOffsetLim}px, ${yOffset - FIVE_DEG}px, 0px)`;
    } else {
      this.birdFreePath.instance.style.display = 'block';
      this.birdPath.instance.setAttribute('stroke-dasharray', '');
      this.birdLockedPath.instance.style.display = 'block';

      if (xOffset < -540 || xOffset > 540) {
        birdOffRange = true;
      } else {
        birdOffRange = false;
      }
      xOffsetLim = Math.max(Math.min(xOffset, 540), -540);
      this.birdGroup.instance.style.transform = `translate3d(0px, ${yOffset - FIVE_DEG}px, 0px)`;

      this.birdFreePath.instance.style.transform = `translate3d(${xOffsetLim}px, ${yOffset - FIVE_DEG}px, 0px)`;
    }

    this.ap1Active.get() || this.ap2Active.get()
      ? this.birdPath.instance.setAttribute(
          'd',
          'm 627 512 l 13 13 l 13 -13 l -13 -13 z M 590 512 h 37 m 13 -13 v -19z m 13 13 h 37',
        )
      : this.birdPath.instance.setAttribute(
          'd',
          'M 627 512 C 627 519,  633 525, 640 525 S 653 519, 653 512 S 647 499, 640 499 S 627 505, 627 512 Z M 590 512 h 37 m 13 -13 v -19z m 13 13 h 37',
        );
  }

  private useSingleFpv() {
    let birdOffRange = false;

    let xOffsetLim;
    const daLimConv = (this.data.da.get().value * DistanceSpacing) / ValueSpacing;
    const pitchSubFpaConv =
      calculateHorizonOffsetFromPitch(this.data.pitch.get().value) -
      calculateHorizonOffsetFromPitch(this.data.fpa.get().value);
    const rollCos = Math.cos((this.data.roll.get().value * Math.PI) / 180);
    const rollSin = Math.sin((-this.data.roll.get().value * Math.PI) / 180);

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
      this.birdPath.instance.setAttribute('stroke-dasharray', '3 6');
    } else {
      this.birdPath.instance.setAttribute('stroke-dasharray', '');
    }

    this.ap1Active.get() || this.ap2Active.get()
      ? this.birdPath.instance.setAttribute(
          'd',
          'm 627 512 l 13 13 l 13 -13 l -13 -13 z M 590 512 h 37 m 13 -13 v -19z m 13 13 h 37',
        )
      : this.birdPath.instance.setAttribute(
          'd',
          'M 627 512 C 627 519,  633 525, 640 525 S 653 519, 653 512 S 647 499, 640 499 S 627 505, 627 512 Z M 590 512 h 37 m 13 -13 v -19z m 13 13 h 37',
        );

    this.birdFreePath.instance.style.display = 'none';
    this.birdLockedPath.instance.style.display = 'none';
    this.birdPath.instance.style.display = 'block';
  }

  render(): VNode {
    return (
      <>
        <g ref={this.birdFreePath}>
          <path
            id="BirdFreePath"
            d="m 627 512 l 10.5 2.5 l 2.5 10.5 l 2.5 -10.5 l 10.5 -2.5 l -10.5 -2.5 l -2.5 -10.5 l -2.5 10.5 z"
            class="NormalStroke Green"
          />
        </g>
        <g ref={this.birdGroup} id="bird">
          <g id="FlightPathVector">
            <path ref={this.birdPath} d="" class="NormalStroke Green" stroke-dasharray="3 6" />

            <path ref={this.birdLockedPath} class="NormalStroke Green" d="m 590 502 v 20  m 100 0 v -20" />
          </g>
          <SpeedChevrons bus={this.props.bus} />

          <DeltaSpeed bus={this.props.bus} />
          <RadioAltAndDH
            bus={this.props.bus}
            filteredRadioAltitude={this.props.filteredRadioAlt}
            attExcessive={this.props.isAttExcessive}
          />
          <FlareIndicator bus={this.props.bus} />
          <SpoilersIndicator bus={this.props.bus} />
          <ReverserIndicator bus={this.props.bus} />
        </g>
      </>
    );
  }
}

export class SpeedChevrons extends DisplayComponent<{ bus: ArincEventBus }> {
  private refElement = FSComponent.createRef<SVGGElement>();
  private leftChevron = FSComponent.createRef<SVGGElement>();
  private rightChevron = FSComponent.createRef<SVGGElement>();
  private inRange = true;
  private onGround = true;
  private merged = false;
  private onTakeoff = true;
  private vCTrend = new Arinc429Word(0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<Arinc429Values & HUDSimvars & ClockEvents>();

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((value) => {
        value ? (this.onGround = true) : (this.onGround = false);
      });

    sub
      .on('fmgcFlightPhase')
      .whenChanged()
      .handle((value) => {
        value == 1 ? (this.onTakeoff = true) : (this.onTakeoff = false);
      });

    sub
      .on('vCTrend')
      .withArinc429Precision(2)
      .whenChanged()
      .handle((word) => {
        this.vCTrend = word;

        if (this.vCTrend.isNormalOperation()) {
          this.refElement.instance.style.visibility = 'visible';
          const offset = (-this.vCTrend.value * 28) / 5;
          let UsedOffset = offset;
          if (this.merged == false) {
            if (this.onTakeoff) {
              offset <= -FIVE_DEG ? (this.inRange = false) : (this.inRange = true);
              UsedOffset = Math.max((-this.vCTrend.value * 28) / 5, -FIVE_DEG);
              if (UsedOffset === offset) {
                UsedOffset = (-this.vCTrend.value * 28) / 5;
                if (this.onGround == false) {
                  this.merged = true;
                  this.inRange = true;
                }
              }
            } else {
              UsedOffset = (-this.vCTrend.value * 28) / 5;
            }
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
      });
  }

  render(): VNode | null {
    return (
      <g id="SpeedChevrons" ref={this.refElement}>
        <path ref={this.leftChevron} class="NormalStroke Green" d="m 574,500 12,12 -12,12" />
        <path ref={this.rightChevron} class="NormalStroke Green" d="m 706,500 -12,12 12,12" />
      </g>
    );
  }
}

interface SpeedStateInfo {
  targetSpeed: number;
  managedTargetSpeed: number;
  isSpeedManaged: boolean;
  speed: Arinc429WordData;
}

class DeltaSpeed extends DisplayComponent<{ bus: ArincEventBus }> {
  private flightPhase = -1;
  private declutterMode = 0;
  private crosswindMode = false;
  private sVisibility = Subject.create<String>('');
  private outOfRange = Subject.create<String>('');
  private speedRefs: NodeReference<SVGPathElement>[] = [];
  private speedGroupRef = FSComponent.createRef<SVGGElement>();
  private currentTargetSpeed = 0;
  private needsUpdate = true;
  private inFlight = false;
  private hudMode = -1;
  private speedState: SpeedStateInfo = {
    targetSpeed: 100,
    managedTargetSpeed: 100,
    isSpeedManaged: false,
    speed: new Arinc429Word(0),
  };

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.needsUpdate = true;

    const sub = this.props.bus.getArincSubscriber<
      HUDSimvars & SimplaneValues & ClockEvents & Arinc429Values & HudElems
    >();

    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.flightPhase = fp;
      });

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((value) => {
        if (value) {
          this.sVisibility.set('none');
        } else {
          this.sVisibility.set('block');
        }
      });

    sub
      .on('isSelectedSpeed')
      .whenChanged()
      .handle((s) => {
        this.speedState.isSpeedManaged = !s;
        this.needsUpdate = true;
      });
    sub
      .on('targetSpeedManaged')
      .whenChanged()
      .handle((s) => {
        this.speedState.managedTargetSpeed = s;
        this.needsUpdate = true;
      });

    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((s) => {
        this.speedState.speed = s;
        this.needsUpdate = true;
      });

    sub
      .on('hudFlightPhaseMode')
      .whenChanged()
      .handle((v) => {
        this.hudMode = v;
        v === 0 ? (this.inFlight = true) : (this.inFlight = false);
      });
    sub.on('realTime').handle(this.onFrameUpdate.bind(this));
  }

  private setVisible(refNum: boolean) {
    if (refNum) {
      this.speedGroupRef.instance.style.display = 'block';
    } else {
      this.speedGroupRef.instance.style.display = 'none';
    }
  }

  private onFrameUpdate(_realTime: number): void {
    if (this.needsUpdate === true) {
      this.needsUpdate = false;

      this.setVisible(this.inFlight);
      const chosenTargetSpeed = Simplane.getAutoPilotAirspeedHoldValue();

      const deltaSpeed = this.speedState.speed.value - chosenTargetSpeed;
      const sign = Math.sign(deltaSpeed);
      const deltaSpeedDraw = Math.abs(deltaSpeed) >= 15 ? sign * 15 : deltaSpeed;
      this.speedRefs[0].instance.setAttribute('d', `m 596,512 v ${-deltaSpeedDraw * 5} h 9 v ${deltaSpeedDraw * 5}`);

      for (let i = 1; i < 8; i++) {
        i * 2 < Math.abs(deltaSpeed)
          ? (this.speedRefs[i].instance.style.display = 'block')
          : (this.speedRefs[i].instance.style.display = 'none');

        i === 5
          ? this.speedRefs[i].instance.setAttribute('d', `m 596 ${512 - i * 10 * sign} h 9`)
          : this.speedRefs[i].instance.setAttribute('d', `m 599.5 ${512 - i * 10 * sign} h 2`);
      }
    }
  }

  render(): VNode {
    for (let i = 0; i < 8; i++) {
      this.speedRefs.push(FSComponent.createRef<SVGPathElement>());
    }
    return (
      <>
        <g ref={this.speedGroupRef} id="DeltaSpeedGroup">
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
  bus: ArincEventBus;
  filteredRadioAltitude: Subscribable<number>;
  attExcessive: Subscribable<boolean>;
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
          transform="translate(640 600)"
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
  bus: ArincEventBus;
}> {
  private sVisibility = Subject.create('none');
  private flareGroup = FSComponent.createRef<SVGGElement>();
  private verticalMode = 0;
  private setVisibility() {
    if (this.verticalMode === VerticalMode.FLARE) {
      this.sVisibility.set('block');
    } else {
      this.sVisibility.set('none');
    }
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & VerticalMode>();

    sub
      .on('activeVerticalMode')
      .whenChanged()
      .handle((word) => {
        this.verticalMode = word;
        this.setVisibility();
      });
  }

  render(): VNode {
    return (
      <g ref={this.flareGroup} id="FlareArrows" display={this.sVisibility}>
        <path class="NormalStroke Green" d="m 615,512 v -32" />
        <path class="NormalStroke Green" d="m 609,496 l 6 -16  l 6 16" />
        <path class="NormalStroke Green" d="m 665,512 v -32" />
        <path class="NormalStroke Green" d="m 659,496 l 6 -16  l 6 16" />
      </g>
    );
  }
}

export class SpoilersIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getArincSubscriber<HUDSimvars & HudElems>();
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

export class ReverserIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getArincSubscriber<HUDSimvars & HudElems & ClockEvents>();
  private revGroupRef = FSComponent.createRef<SVGGElement>();
  private rev2Ref = FSComponent.createRef<SVGGElement>();
  private rev3Ref = FSComponent.createRef<SVGGElement>();
  private rev2TxtRef = FSComponent.createRef<SVGTextElement>();
  private rev3TxtRef = FSComponent.createRef<SVGTextElement>();

  private readonly eng2State = ConsumerSubject.create(this.sub.on('eng2State').whenChanged(), 0); // no rev failure implemented  using on/off state instead
  private readonly eng3State = ConsumerSubject.create(this.sub.on('eng3State').whenChanged(), 0); // no rev failure implemented  using on/off state instead
  private readonly rev2 = ConsumerSubject.create(this.sub.on('rev2').whenChanged(), 0);
  private readonly rev3 = ConsumerSubject.create(this.sub.on('rev3').whenChanged(), 0);
  private readonly tla2 = ConsumerSubject.create(this.sub.on('tla2').whenChanged(), 0);
  private readonly tla3 = ConsumerSubject.create(this.sub.on('tla3').whenChanged(), 0);
  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudFlightPhaseMode').whenChanged(), 0);

  private readonly reverser2State = MappedSubject.create(
    ([rev2, tla2, eng2State, hudMode]) => {
      if (hudMode !== 0) {
        if (rev2 === 1) {
          if (eng2State === 1) {
            if (tla2 > -7) {
              return 1; // rev deployement in progress  display dash
            } else if (tla2 <= -7) {
              return 2; // rev on  display R
            }
          } else {
            return 3; // not opperative  display cross
          }
        } else {
          return 0; // show nothing
        }
      } else {
        return 0; // show nothing
      }
    },
    this.rev2,
    this.tla2,
    this.eng2State,
    this.hudMode,
  );
  private readonly reverser3State = MappedSubject.create(
    ([rev3, tla3, eng3State, hudMode]) => {
      if (hudMode !== 0) {
        if (rev3 === 1) {
          if (eng3State === 1) {
            if (tla3 > -7) {
              return 1; // rev deployement in progress  display dash
            } else if (tla3 <= -7) {
              return 2; // rev on  display R
            }
          } else {
            return 3; // not opperative  display cross
          }
        } else {
          return 0; // show nothing
        }
      } else {
        return 0; // show nothing
      }
    },
    this.rev3,
    this.tla3,
    this.eng3State,
    this.hudMode,
  );

  private setState() {
    if (this.reverser2State.get() === 1) {
      this.rev2Ref.instance.setAttribute('d', 'm 615 482 v -17 h 17 v 17 z');
      this.rev2Ref.instance.setAttribute('stroke-dasharray', '3 6');
      this.rev2TxtRef.instance.textContent = '';
    } else if (this.reverser2State.get() === 2) {
      this.rev2Ref.instance.setAttribute('d', 'm 615 482 v -17 h 17 v 17 z');
      this.rev2Ref.instance.setAttribute('stroke-dasharray', '');
      this.rev2TxtRef.instance.textContent = 'R';
    } else if (this.reverser2State.get() === 3) {
      this.rev2Ref.instance.setAttribute('d', 'm 615 482 v -17 h 17 v 17 z  m 0 0 l 17 -17   m -17 0 l 17 17 ');
      this.rev2Ref.instance.setAttribute('stroke-dasharray', '');
      this.rev2TxtRef.instance.textContent = '';
    } else {
      this.rev2Ref.instance.setAttribute('d', '');
      this.rev2TxtRef.instance.textContent = '';
    }

    if (this.reverser3State.get() === 1) {
      this.rev3Ref.instance.setAttribute('d', 'm 648 482 v -17 h 17 v 17 z');
      this.rev3Ref.instance.setAttribute('stroke-dasharray', '3 6');
      this.rev3TxtRef.instance.textContent = '';
    } else if (this.reverser3State.get() === 2) {
      this.rev3Ref.instance.setAttribute('d', 'm 648 482 v -17 h 17 v 17 z');
      this.rev3Ref.instance.setAttribute('stroke-dasharray', '');
      this.rev3TxtRef.instance.textContent = 'R';
    } else if (this.reverser3State.get() === 3) {
      this.rev3Ref.instance.setAttribute('d', 'm 648 482 v -17 h 17 v 17 z  m 0 0 l 17 -17   m -17 0 l 17 17 ');
      this.rev3Ref.instance.setAttribute('stroke-dasharray', '');
      this.rev3TxtRef.instance.textContent = '';
    } else {
      this.rev3Ref.instance.setAttribute('d', '');
      this.rev3TxtRef.instance.textContent = '';
    }
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub.on('realTime').handle(() => {
      if (this.reverser2State.get() !== 0 && this.reverser3State.get() !== 0) {
        this.revGroupRef.instance.style.display = 'block';
        this.setState();
      } else {
        this.revGroupRef.instance.style.display = 'none';
      }
    });
  }
  //>
  render(): VNode | null {
    return (
      <g id="ReverseIndicator" ref={this.revGroupRef}>
        <path ref={this.rev2Ref} class="NormalStroke Green " d="" />
        <text ref={this.rev2TxtRef} x="623.5" y="480 " class="FontForAnts MiddleAlign Green ">
          R
        </text>
        <path ref={this.rev3Ref} class="NormalStroke Green " d="" />
        <text ref={this.rev3TxtRef} x="656.5" y="480 " class="FontForAnts MiddleAlign Green ">
          R
        </text>
      </g>
    );
  }
}
