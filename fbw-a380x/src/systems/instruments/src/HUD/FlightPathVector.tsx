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
} from '@flybywiresim/fbw-sdk';
import { calculateHorizonOffsetFromPitch, HudElems } from './HUDUtils';
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
  private bird = FSComponent.createRef<SVGGElement>();
  private birdPathCircle = FSComponent.createRef<SVGPathElement>();
  private birdPath1 = FSComponent.createRef<SVGPathElement>();
  private birdPath2 = FSComponent.createRef<SVGPathElement>();
  private birdPath3 = FSComponent.createRef<SVGPathElement>();
  private birdOffRange;
  private crosswindMode;

  private readonly sub = this.props.bus.getSubscriber<Arinc429Values & HUDSimvars>();

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

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & HudElems>();
    const moveBirdSub = MappedSubject.create(this.data.roll, this.data.pitch, this.data.fpa, this.data.da).sub(
      this.moveBird.bind(this),
      true,
      true,
    );

    moveBirdSub.resume(true);

    sub
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value.get();
      });
  }

  private moveBird() {
    // const daLimConv = (Math.max(Math.min(this.data.da.get().value, 21), -21) * DistanceSpacing) / ValueSpacing;
    // const pitchSubFpaConv =
    //   calculateHorizonOffsetFromPitch(this.data.pitch.get().value) -
    //   calculateHorizonOffsetFromPitch(this.data.fpa.get().value);
    // const rollCos = Math.cos((this.data.roll.get().value * Math.PI) / 180);
    // const rollSin = Math.sin((-this.data.roll.get().value * Math.PI) / 180);

    // const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    // const yOffset = pitchSubFpaConv * rollCos + daLimConv * rollSin;

    // this.birdTransformBuilder.set(xOffset, yOffset, 0, 0.01, 0.01);
    // this.birdTransform.set(this.birdTransformBuilder.resolve());

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
    if (this.crosswindMode == 0) {
      if (xOffset < -428 || xOffset > 360) {
        this.birdOffRange = true;
      } else {
        this.birdOffRange = false;
      }

      xOffsetLim = Math.max(Math.min(xOffset, 360), -428);
    } else {
      if (xOffset < -540 || xOffset > 540) {
        this.birdOffRange = true;
      } else {
        this.birdOffRange = false;
      }
      xOffsetLim = Math.max(Math.min(xOffset, 540), -540);
    }

    this.bird.instance.style.transform = `translate3d(${xOffsetLim}px, ${yOffset - FIVE_DEG}px, 0px)`;

    if (this.birdOffRange) {
      this.birdPathCircle.instance.setAttribute('stroke-dasharray', '3 6');
      this.birdPath1.instance.setAttribute('stroke-dasharray', '3 6');
      this.birdPath2.instance.setAttribute('stroke-dasharray', '3 6');
      this.birdPath3.instance.setAttribute('stroke-dasharray', '3 6');
    } else {
      this.birdPathCircle.instance.setAttribute('stroke-dasharray', '');
      this.birdPath1.instance.setAttribute('stroke-dasharray', '');
      this.birdPath2.instance.setAttribute('stroke-dasharray', '');
      this.birdPath3.instance.setAttribute('stroke-dasharray', '');
    }
  }

  render(): VNode {
    return (
      <>
        <g ref={this.bird} id="bird">
          <g id="FlightPathVector">
            <path
              ref={this.birdPathCircle}
              d="M 627 512 C 627 519,  633 525,      640 525
              S 653 519,      653 512
              S 647 499,      640 499
              S 627 505,      627 512 Z"
              class="NormalStroke Green"
              stroke-dasharray="3 6"
            />

            <path ref={this.birdPath1} class="NormalStroke Green" d="m 590,512 h 37" stroke-dasharray="3 6" />
            <path ref={this.birdPath2} class="NormalStroke Green" d="m 653,512 h 37" stroke-dasharray="3 6" />
            <path ref={this.birdPath3} class="NormalStroke Green" d="M 640,499 v -19" stroke-dasharray="3 6" />
          </g>
          <SpeedChevrons bus={this.props.bus} />

          <DeltaSpeed bus={this.props.bus} />
          <RadioAltAndDH
            bus={this.props.bus}
            filteredRadioAltitude={this.props.filteredRadioAlt}
            attExcessive={this.props.isAttExcessive}
          />
          <FlareIndicator bus={this.props.bus} />
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
  private speedRefs: NodeReference<SVGElement>[] = [];
  private currentTargetSpeed = 0;
  private needsUpdate = true;

  private speedState: SpeedStateInfo = {
    targetSpeed: 100,
    managedTargetSpeed: 100,
    isSpeedManaged: false,
    speed: new Arinc429Word(0),
  };

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.needsUpdate = true;

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & SimplaneValues & ClockEvents & Arinc429Values>();

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
    sub.on('realTime').handle(this.onFrameUpdate.bind(this));
  }

  private setVisible(refNum: number[]) {
    for (let i = 0; i < 6; i++) {
      if (refNum.includes(i)) {
        this.speedRefs[i].instance.style.visibility = 'visible';
      } else {
        this.speedRefs[i].instance.style.visibility = 'visible';
      }
    }
  }

  private onFrameUpdate(_realTime: number): void {
    if (this.needsUpdate === true) {
      this.needsUpdate = false;

      const chosenTargetSpeed = Simplane.getAutoPilotAirspeedHoldValue();

      const deltaSpeed = this.speedState.speed.value - chosenTargetSpeed;
      const sign = Math.sign(deltaSpeed);
      this.speedRefs[1].instance.setAttribute('d', `m 595,512 v ${-deltaSpeed * 3.33} h 12 v ${deltaSpeed * 3.33}`);

      if (Math.abs(deltaSpeed) >= 27) {
        this.speedRefs[0].instance.style.visibility = 'visible';
        sign == 1
          ? this.speedRefs[0].instance.setAttribute('transform', 'translate(0 -90)')
          : this.speedRefs[0].instance.setAttribute('transform', 'translate(0 0)');
        //this.outOfRange.set('')
      } else {
        this.speedRefs[0].instance.style.visibility = 'hidden';
      }

      if (Math.abs(deltaSpeed) > 1 && Math.abs(deltaSpeed) < 27) {
        this.speedRefs[1].instance.style.visibility = 'visible';
      } else {
        this.speedRefs[1].instance.style.visibility = 'hidden';
      }
    }
  }

  render(): VNode {
    for (let i = 0; i < 6; i++) {
      this.speedRefs.push(FSComponent.createRef<SVGPathElement>());
    }
    return (
      <>
        <g id="DeltaSpeedGroup" display={this.sVisibility}>
          <g ref={this.speedRefs[0]} transform={this.outOfRange} class="NormalStroke CornerRound Green" stroke="red">
            <path class="NormalStroke CornerRound Green" d="m 595,602 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,592 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,582 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,572 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,562 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,552 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,542 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,532 h 11" stroke="green" />
            <path class="NormalStroke CornerRound Green" d="m 595,522 h 11" stroke="green" />
            {/* <path class="NormalStroke CornerRound Green" d="m 595,512 h 11" stroke="green" /> */}
          </g>

          <path ref={this.speedRefs[1]} d="" class="NormalStroke CornerRound Green GreenFill2" stroke="red" />
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
