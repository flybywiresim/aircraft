// @ts-strict-ignore
// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  MathUtils,
  NodeReference,
  Subject,
  VNode,
} from '@microsoft/msfs-sdk';
import {
  ArincEventBus,
  Arinc429Word,
  Arinc429WordData,
  Arinc429Register,
  Arinc429LocalVarConsumerSubject,
  Arinc429ConsumerSubject,
} from '@flybywiresim/fbw-sdk';

import { FgBus } from './shared/FgBusProvider';
import { FcuBus } from './shared/FcuBusProvider';
import { PFDSimvars } from './shared/PFDSimvarPublisher';
import { VerticalTape } from './VerticalTape';
import { Arinc429Values } from './shared/ArincValueProvider';
import { FlashOneHertz } from '../MsfsAvionicsCommon/FlashingElementUtils';
import { RateLimiter } from './PFDUtils';

const ValueSpacing = 10;
const DistanceSpacing = 10;
const DisplayRange = 42;

const getSpeedTapeOffset = (speed: number): number => (-speed * DistanceSpacing) / ValueSpacing;

class V1BugElement extends DisplayComponent<{ bus: ArincEventBus }> {
  private flightPhase = ConsumerSubject.create(this.props.bus.getSubscriber<PFDSimvars>().on('fwcFlightPhase'), 0);

  private v1Speed = ConsumerSubject.create(this.props.bus.getSubscriber<PFDSimvars>().on('v1'), 0);

  private visibilitySub = MappedSubject.create(
    ([v1Speed, flightPhase]) => (flightPhase <= 4 && v1Speed !== 0 ? 'inherit' : 'hidden'),
    this.v1Speed,
    this.flightPhase,
  );

  private offsetSub = this.v1Speed.map((v1) => `transform:translate3d(0px, ${getSpeedTapeOffset(v1)}px, 0px)`);

  render(): VNode {
    return (
      <g id="V1BugGroup" style={this.offsetSub} visibility={this.visibilitySub}>
        <path class="NormalStroke Cyan" d="m16.613 80.82h5.4899" />
        <text class="FontLarge MiddleAlign Cyan" x="26.205544" y="82.96">
          1
        </text>
      </g>
    );
  }
}

class VRBugElement extends DisplayComponent<{ bus: ArincEventBus }> {
  private flightPhase = ConsumerSubject.create(this.props.bus.getSubscriber<PFDSimvars>().on('fwcFlightPhase'), 0);

  private vrSpeed = ConsumerSubject.create(this.props.bus.getSubscriber<PFDSimvars>().on('vr'), 0);

  private visibilitySub = MappedSubject.create(
    ([vrSpeed, flightPhase]) => (flightPhase <= 4 && vrSpeed !== 0 ? 'inherit' : 'hidden'),
    this.vrSpeed,
    this.flightPhase,
  );

  private offsetSub = this.vrSpeed.map((v1) => `transform:translate3d(0px, ${getSpeedTapeOffset(v1)}px, 0px)`);

  render(): VNode {
    return (
      <path
        visibility={this.visibilitySub}
        style={this.offsetSub}
        id="RotateSpeedMarker"
        class="NormalStroke Cyan"
        d="m21.549 80.82a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z"
      />
    );
  }
}

export class AirspeedIndicator extends DisplayComponent<{
  instrument: BaseInstrument;
  bus: ArincEventBus;
}> {
  private readonly airSpeedWord = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('speedAr').withArinc429Precision(2),
  );

  private readonly leftMainGearCompressed = ConsumerSubject.create(
    this.props.bus.getSubscriber<PFDSimvars>().on('leftMainGearCompressed'),
    false,
  );

  private readonly rightMainGearCompressed = ConsumerSubject.create(
    this.props.bus.getSubscriber<PFDSimvars>().on('rightMainGearCompressed'),
    false,
  );

  private readonly onGround = MappedSubject.create(
    ([leftMainGearCompressed, rightMainGearCompressed]) => leftMainGearCompressed || rightMainGearCompressed,
    this.leftMainGearCompressed,
    this.rightMainGearCompressed,
  );

  private readonly spdInvalid = MappedSubject.create(
    ([word, onGround]) => word.isFailureWarning() || (word.isNoComputedData() && !onGround),
    this.airSpeedWord,
    this.onGround,
  );

  private readonly spdValue = MappedSubject.create(
    ([word, onGround]) => {
      const value = word.valueOr(0);

      if (word.isNoComputedData() && onGround) {
        return 30;
      } else {
        return value;
      }
    },
    this.airSpeedWord,
    this.onGround,
  );

  private readonly outlinePath = MappedSubject.create(
    ([spdInvalid, spdValue]) => {
      const length = 42.9 + Math.max(Math.max(Math.min(spdInvalid ? 100 : spdValue, 72.1), 30) - 30, 0);
      return `m19.031 38.086v${length}`;
    },
    this.spdInvalid,
    this.spdValue,
  );

  render(): VNode {
    return (
      <>
        <g id="FailedGroup" visibility={this.spdInvalid.map((invalid) => (invalid ? 'inherit' : 'hidden'))}>
          <path id="SpeedTapeBackground" class="TapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" />
          <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.spdInvalid.map((invalid) => invalid)}>
            <text id="SpeedFailText" class="FontLargest EndAlign Red" x="17.756115" y="83.386398">
              SPD
            </text>
          </FlashOneHertz>

          <path id="SpeedTapeOutlineRight" class="NormalStroke Red" d={this.outlinePath} />
        </g>

        <g id="SpeedTapeElementsGroup" visibility={this.spdInvalid.map((invalid) => (!invalid ? 'inherit' : 'hidden'))}>
          <path id="SpeedTapeBackground" class="TapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" />
          {/* Outline */}
          <path id="SpeedTapeOutlineRight" class="NormalStroke White" d={this.outlinePath} />
          <VerticalTape
            tapeValue={this.spdValue}
            lowerLimit={30}
            upperLimit={660}
            valueSpacing={ValueSpacing}
            displayRange={DisplayRange + 6}
            distanceSpacing={DistanceSpacing}
            type="speed"
          >
            <V1BugElement bus={this.props.bus} />
            <VRBugElement bus={this.props.bus} />
            <FlapsSpeedPointBugs bus={this.props.bus} />
            <VFeNextBugMarker bus={this.props.bus} />
            <VProtBug bus={this.props.bus} />
          </VerticalTape>

          <VMaxBar bus={this.props.bus} />
          <VAlphaProtBar bus={this.props.bus} />
          <VStallWarnBar bus={this.props.bus} />
          <VLsBar bus={this.props.bus} />
          <VAlphaLimBar bus={this.props.bus} />
          <SpeedTrendArrow instrument={this.props.instrument} bus={this.props.bus} />

          <V1Offtape bus={this.props.bus} />
        </g>
      </>
    );
  }
}

class VFeNextBugMarker extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly vFeNextWord = Arinc429LocalVarConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('vFeNext'),
  );

  private readonly visibility = this.vFeNextWord.map((word) => (word.isNormalOperation() ? 'inherit' : 'hidden'));

  private readonly offset = this.vFeNextWord.map(
    (word) => `transform:translate3d(0px,${getSpeedTapeOffset(word.value)}px, 0px`,
  );

  render(): VNode {
    return (
      <path
        id="VFeNextMarker"
        visibility={this.visibility}
        style={this.offset}
        class="NormalStroke Amber"
        d="m19.031 81.34h-2.8709m0-1.0079h2.8709"
      />
    );
  }
}

class FlapsSpeedPointBugs extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly vMan = Arinc429LocalVarConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('vMan'),
  );

  private readonly v4 = Arinc429LocalVarConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('v4'),
  );

  private readonly v3 = Arinc429LocalVarConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('v3'),
  );

  private readonly greenDotVisibility = this.vMan.map((word) => (word.isNormalOperation() ? 'inherit' : 'hidden'));

  private readonly greenDotOffset = this.vMan.map(
    (word) => `transform:translate3d(0px,${MathUtils.round(getSpeedTapeOffset(word.value), 1e-2)}px, 0px`,
  );

  private readonly flapsSpeedVisibility = this.v3.map((word) => (word.isNormalOperation() ? 'inherit' : 'hidden'));

  private readonly flapsSpeedOffset = this.v3.map(
    (word) => `transform:translate3d(0px,${MathUtils.round(getSpeedTapeOffset(word.value), 1e-2)}px, 0px`,
  );

  private readonly slatsSpeedVisibility = this.v4.map((word) => (word.isNormalOperation() ? 'inherit' : 'hidden'));

  private readonly slatsSpeedOffset = this.v4.map(
    (word) => `transform:translate3d(0px,${MathUtils.round(getSpeedTapeOffset(word.value), 1e-2)}px, 0px`,
  );

  render(): VNode {
    return (
      <>
        <g id="GreenDotSpeedMarker" visibility={this.greenDotVisibility} style={this.greenDotOffset}>
          <path class="ThickOutline" d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" />
          <path class="ThickStroke Green" d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" />
        </g>
        <g id="FlapsSlatsBug" visibility={this.flapsSpeedVisibility} style={this.flapsSpeedOffset}>
          <path class="NormalStroke Green" d="m19.031 80.82h3.8279" />
          <text class="FontLarge MiddleAlign Green" x="27.536509" y="83.327988">
            F
          </text>
        </g>
        <g id="FlapsSlatsBug" visibility={this.slatsSpeedVisibility} style={this.slatsSpeedOffset}>
          <path class="NormalStroke Green" d="m19.031 80.82h3.8279" />
          <text class="FontLarge MiddleAlign Green" x="27.536509" y="83.327988">
            S
          </text>
        </g>
      </>
    );
  }
}

export class AirspeedIndicatorOfftape extends DisplayComponent<{ bus: ArincEventBus }> {
  private lowerRef = FSComponent.createRef<SVGGElement>();

  private offTapeRef = FSComponent.createRef<SVGGElement>();

  private offTapeFailedRef = FSComponent.createRef<SVGGElement>();

  private decelRef = FSComponent.createRef<SVGTextElement>();

  private readonly spdLimFlagVisible = Subject.create(false);

  private onGround = true;

  private leftMainGearCompressed = true;

  private rightMainGearCompressed = true;

  private airSpeed = Arinc429Word.empty();

  private setOutline(): void {
    let airspeedValue: number;
    if (this.airSpeed.isFailureWarning() || (this.airSpeed.isNoComputedData() && !this.onGround)) {
      airspeedValue = NaN;
    } else if (this.airSpeed.isNoComputedData()) {
      airspeedValue = 30;
    } else {
      airspeedValue = this.airSpeed.value;
    }
    if (Number.isNaN(airspeedValue)) {
      this.offTapeRef.instance.classList.add('HiddenElement');
      this.offTapeFailedRef.instance.classList.remove('HiddenElement');
    } else {
      this.offTapeRef.instance.classList.remove('HiddenElement');
      this.offTapeFailedRef.instance.classList.add('HiddenElement');

      const clampedSpeed = Math.max(Math.min(airspeedValue, 660), 30);
      const showLower = clampedSpeed > 72;

      if (showLower) {
        this.lowerRef.instance.setAttribute('visibility', 'visible');
      } else {
        this.lowerRef.instance.setAttribute('visibility', 'hidden');
      }
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values>();

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.leftMainGearCompressed = g;
        this.onGround = this.rightMainGearCompressed || g;
        this.setOutline();
      });

    sub
      .on('rightMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.rightMainGearCompressed = g;
        this.onGround = this.leftMainGearCompressed || g;
        this.setOutline();
      });

    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((speed) => {
        this.airSpeed = speed;
        this.setOutline();
      });

    sub
      .on('autoBrakeDecel')
      .whenChanged()
      .handle((a) => {
        if (a) {
          this.decelRef.instance.style.visibility = 'visible';
        } else {
          this.decelRef.instance.style.visibility = 'hidden';
        }
      });

    sub
      .on('facToUse')
      .whenChanged()
      .handle((a) => {
        if (a === 0) {
          this.spdLimFlagVisible.set(true);
        } else {
          this.spdLimFlagVisible.set(false);
        }
      });
  }

  render(): VNode {
    return (
      <>
        <g id="OfftapeFailedGroup" ref={this.offTapeFailedRef}>
          <path id="SpeedTapeOutlineUpper" class="NormalStroke Red" d="m1.9058 38.086h21.859" />
          <path id="SpeedTapeOutlineLower" class="NormalStroke Red" d="m1.9058 123.56h21.859" />
        </g>
        <g id="SpeedOfftapeGroup" ref={this.offTapeRef}>
          <path id="SpeedTapeOutlineUpper" class="NormalStroke White" d="m1.9058 38.086h21.859" />
          <SpeedTarget bus={this.props.bus} />
          <text id="AutoBrkDecel" ref={this.decelRef} class="FontMedium EndAlign Green" x="20.53927" y="129.06996">
            DECEL
          </text>
          <path
            class="Fill Yellow SmallOutline"
            d="m13.994 80.46v0.7257h6.5478l3.1228 1.1491v-3.0238l-3.1228 1.1491z"
          />
          <path class="Fill Yellow SmallOutline" d="m0.092604 81.185v-0.7257h2.0147v0.7257z" />
          <path id="SpeedTapeOutlineLower" ref={this.lowerRef} class="NormalStroke White" d="m1.9058 123.56h21.859" />
          <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.spdLimFlagVisible}>
            <text id="SpdLimFailTextUpper" x="32.077583" y="116.57941" class="FontMedium EndAlign Red">
              SPD
            </text>
            <text id="SpdLimFailTextLower" x="32.107349" y="122.14585" class="FontMedium EndAlign Red">
              LIM
            </text>
          </FlashOneHertz>
        </g>
      </>
    );
  }
}

class SpeedTrendArrow extends DisplayComponent<{
  instrument: BaseInstrument;
  bus: ArincEventBus;
}> {
  private readonly sub = this.props.bus.getArincSubscriber<Arinc429Values & ClockEvents>();

  private vCTrendWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('vCTrend').atFrequency(10));

  private vCTrendInvalid = this.vCTrendWord.map((input) => {
    return input.isFailureWarning() || input.isNoComputedData();
  });

  private vCTrendRateLimit = new RateLimiter(12, -12);

  private vCTrendRateLimited = Subject.create(0);

  private vCTrendSign = this.vCTrendRateLimited.map((input) => {
    return input > 0;
  });

  private offset = this.vCTrendRateLimited.map((value) => (-value * DistanceSpacing) / ValueSpacing);

  private offsetString = this.offset.map((offset) => `m15.455 80.823v${offset.toFixed(3)}`);

  private pathString = MappedSubject.create(
    ([vCTrendSign, offset]) => {
      const neutralPos = 80.823;
      if (vCTrendSign) {
        return `m15.455 ${neutralPos + offset} l -1.2531 2.4607 M15.455 ${neutralPos + offset} l 1.2531 2.4607`;
      } else {
        return `m15.455 ${neutralPos + offset} l 1.2531 -2.4607 M15.455 ${neutralPos + offset} l -1.2531 -2.4607`;
      }
    },
    this.vCTrendSign,
    this.offset,
  );

  private vCTrendHysteresis = Subject.create(false);

  private vCTrendVisible = MappedSubject.create(
    ([vCTrendInvalid, vCTrendHysteresis]) => {
      return !vCTrendInvalid && vCTrendHysteresis;
    },
    this.vCTrendInvalid,
    this.vCTrendHysteresis,
  );

  private handleVCTrend(word: Arinc429WordData): void {
    if (Math.abs(word.value) < 1) {
      this.vCTrendHysteresis.set(false);
    } else if (Math.abs(word.value) > 2) {
      this.vCTrendHysteresis.set(true);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.vCTrendWord.sub((word) => this.handleVCTrend(word), true);

    this.sub.on('realTime').handle((_) => {
      const { deltaTime } = this.props.instrument;
      this.vCTrendRateLimited.set(this.vCTrendRateLimit.step(this.vCTrendWord.get().value, deltaTime / 1000));
    });
  }

  render(): VNode | null {
    return (
      <g id="SpeedTrendArrow" visibility={this.vCTrendVisible.map((visible) => (visible ? 'inherit' : 'hidden'))}>
        <path id="SpeedTrendArrowBase" class="NormalStroke Yellow" d={this.offsetString} />
        <path id="SpeedTrendArrowHead" class="NormalStroke Yellow" d={this.pathString} />
      </g>
    );
  }
}

class VLsBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private vlsPath = Subject.create<string>('');

  private vlsVisbility = Subject.create<string>('hidden');

  private vAlphaProt = new Arinc429Word(0);

  private vStallWarn = new Arinc429Word(0);

  private airSpeed = new Arinc429Word(0);

  private vls = new Arinc429Word(0);

  private fcdc1DiscreteWord1 = new Arinc429Word(0);

  private fcdc2DiscreteWord1 = new Arinc429Word(0);

  private setVlsPath() {
    if (this.vls.isNormalOperation()) {
      this.vlsVisbility.set('visible');

      const normalLawActive =
        this.fcdc1DiscreteWord1.bitValueOr(11, false) || this.fcdc2DiscreteWord1.bitValueOr(11, false);

      const VLsPos = ((this.airSpeed.value - this.vls.value) * DistanceSpacing) / ValueSpacing + 80.818;
      const offset =
        ((this.vls.value - (normalLawActive ? this.vAlphaProt.valueOr(0) : this.vStallWarn.valueOr(0))) *
          DistanceSpacing) /
        ValueSpacing;

      this.vlsPath.set(`m19.031 ${VLsPos}h 1.9748v${offset}`);
    } else {
      this.vlsVisbility.set('hidden');
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<Arinc429Values & PFDSimvars & ClockEvents>();

    sub
      .on('vAlphaProt')
      .withArinc429Precision(2)
      .handle((a) => {
        this.vAlphaProt = a;
        this.setVlsPath();
      });

    sub
      .on('vStallWarn')
      .withArinc429Precision(2)
      .handle((a) => {
        this.vStallWarn = a;
        this.setVlsPath();
      });

    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((s) => {
        this.airSpeed = s;
        this.setVlsPath();
      });

    sub
      .on('vLs')
      .withArinc429Precision(2)
      .handle((vls) => {
        this.vls = vls;
        this.setVlsPath();
      });

    sub.on('fcdc1DiscreteWord1').handle((word) => {
      this.fcdc1DiscreteWord1 = word;
      this.setVlsPath();
    });

    sub.on('fcdc2DiscreteWord1').handle((word) => {
      this.fcdc2DiscreteWord1 = word;
      this.setVlsPath();
    });
  }

  render(): VNode {
    return <path id="VLsIndicator" class="NormalStroke Amber" d={this.vlsPath} visibility={this.vlsVisbility} />;
  }
}

class VAlphaLimBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private VAlimIndicator = FSComponent.createRef<SVGPathElement>();

  private airSpeed = new Arinc429Word(0);

  private vAlphaLim = new Arinc429Word(0);

  private fcdc1DiscreteWord1 = new Arinc429Word(0);

  private fcdc2DiscreteWord1 = new Arinc429Word(0);

  private setAlphaLimBarPath() {
    const normalLawActive =
      this.fcdc1DiscreteWord1.bitValueOr(11, false) || this.fcdc2DiscreteWord1.bitValueOr(11, false);
    if (
      this.vAlphaLim.value - this.airSpeed.value < -DisplayRange ||
      this.vAlphaLim.isFailureWarning() ||
      this.vAlphaLim.isNoComputedData() ||
      !normalLawActive
    ) {
      this.VAlimIndicator.instance.style.visibility = 'hidden';
    } else {
      this.VAlimIndicator.instance.style.visibility = 'inherit';

      const delta = this.airSpeed.value - DisplayRange - this.vAlphaLim.value;
      const offset = (delta * DistanceSpacing) / ValueSpacing;

      this.VAlimIndicator.instance.setAttribute('d', `m19.031 123.56h3.425v${offset}h-3.425z`);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values>();

    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((s) => {
        this.airSpeed = s;
        this.setAlphaLimBarPath();
      });

    sub.on('vAlphaMax').handle((al) => {
      this.vAlphaLim = al;
      this.setAlphaLimBarPath();
    });

    sub.on('fcdc1DiscreteWord1').handle((word) => {
      this.fcdc1DiscreteWord1 = word;
      this.setAlphaLimBarPath();
    });

    sub.on('fcdc2DiscreteWord1').handle((word) => {
      this.fcdc2DiscreteWord1 = word;
      this.setAlphaLimBarPath();
    });
  }

  render(): VNode {
    return <path ref={this.VAlimIndicator} id="VAlimIndicator" class="Fill Red" />;
  }
}

class VAlphaProtBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private VAprotIndicator = FSComponent.createRef<SVGPathElement>();

  private airSpeed = new Arinc429Word(0);

  private vAlphaProt = new Arinc429Word(0);

  private fcdc1DiscreteWord1 = new Arinc429Word(0);

  private fcdc2DiscreteWord1 = new Arinc429Word(0);

  private setAlphaProtBarPath() {
    const normalLawActive =
      this.fcdc1DiscreteWord1.bitValueOr(11, false) || this.fcdc2DiscreteWord1.bitValueOr(11, false);
    if (
      this.airSpeed.value - this.vAlphaProt.value > DisplayRange ||
      this.vAlphaProt.isFailureWarning() ||
      this.vAlphaProt.isNoComputedData() ||
      !normalLawActive
    ) {
      this.VAprotIndicator.instance.style.visibility = 'hidden';
    } else {
      this.VAprotIndicator.instance.style.visibility = 'inherit';

      const delta = Math.max(this.airSpeed.value - this.vAlphaProt.value, -DisplayRange);
      const offset = (delta * DistanceSpacing) / ValueSpacing;

      this.VAprotIndicator.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values>();

    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((s) => {
        this.airSpeed = s;
        this.setAlphaProtBarPath();
      });

    sub
      .on('vAlphaProt')
      .withArinc429Precision(2)
      .handle((word) => {
        this.vAlphaProt = word;
        this.setAlphaProtBarPath();
      });

    sub.on('fcdc1DiscreteWord1').handle((word) => {
      this.fcdc1DiscreteWord1 = word;
      this.setAlphaProtBarPath();
    });

    sub.on('fcdc2DiscreteWord1').handle((word) => {
      this.fcdc2DiscreteWord1 = word;
      this.setAlphaProtBarPath();
    });
  }

  render(): VNode {
    return (
      <path
        id="VAlphaProtBarberpole"
        ref={this.VAprotIndicator}
        class="BarAmber"
        // eslint-disable-next-line max-len
        d="m19.031 169.9v-1.4111h2.9213v1.4111zm2.9213-2.923v1.5119m0-4.4349v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-10.18h2.9213v1.4111h-2.9213zm2.9213 4.3341v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.846v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-5.846v-1.4111h2.9213v1.4111zm2.9213 0v1.5119m0-4.4349v1.5119m0-4.4349v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-10.18h2.9213v1.4111h-2.9213zm2.9213 4.3341v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.846v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-5.846v-1.4111h2.9213v1.4111zm2.9213 0v1.5119m0-4.4349v1.5119m0-4.4349v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-10.18h2.9213v1.4111h-2.9213zm2.9213 4.3341v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.846v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-5.846v-1.4111h2.9213v1.4111zm2.9213 0v1.5119m0-4.4349v1.5119m0-4.4349v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-10.18h2.9213v1.4111h-2.9213zm2.9213 4.3341v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.846v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-5.846v-1.4111h2.9213v1.4111zm2.9213 0v1.5119m0-4.4349v1.5119m0-4.4349v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm1.9748-4.3341h0.94654v1.4111h-2.9213v-1.4111z"
      />
    );
  }
}

class VMaxBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private VMaxIndicator = FSComponent.createRef<SVGPathElement>();

  private airSpeed = new Arinc429Word(0);

  private vMax = new Arinc429Word(0);

  private setVMaxBarPath() {
    if (this.airSpeed.value - this.vMax.value < -DisplayRange || !this.vMax.isNormalOperation()) {
      this.VMaxIndicator.instance.style.visibility = 'hidden';
    } else {
      this.VMaxIndicator.instance.style.visibility = 'inherit';

      const delta = Math.min(this.airSpeed.value - this.vMax.value, DisplayRange);
      const offset = (delta * DistanceSpacing) / ValueSpacing;

      this.VMaxIndicator.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values>();

    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((s) => {
        this.airSpeed = s;
        this.setVMaxBarPath();
      });

    sub
      .on('vMax')
      .withArinc429Precision(2)
      .handle((v) => {
        this.vMax = v;
        this.setVMaxBarPath();
      });
  }

  render(): VNode {
    return (
      <path
        id="OverspeedBarberpole"
        ref={this.VMaxIndicator}
        class="BarRed"
        // eslint-disable-next-line max-len
        d="m22.053-2.2648v-2.6206m-3.022-2.419v2.419h3.022v-2.419zm3.022 10.079v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0-12.498h-3.022v2.4191h3.022zm0 12.498v-2.4191h-3.022v2.4191zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419zm3.022 25.198v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0-12.498h-3.022v2.4191h3.022zm0 12.498v-2.4191h-3.022v2.4191zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419zm3.022 25.198v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0-12.498h-3.022v2.4191h3.022zm0 12.498v-2.4191h-3.022v2.4191zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419zm3.022 25.198v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m-3.022 5.0397h3.022v-2.4191h-3.022zm3.022-17.538h-3.022v2.4191h3.022zm0 12.498v-2.4191h-3.022v2.4191zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419z"
      />
    );
  }
}

class VStallWarnBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private VStallWarnIndicator = FSComponent.createRef<SVGPathElement>();

  private airSpeed = new Arinc429Word(0);

  private vStallWarn = new Arinc429Word(0);

  private fcdc1DiscreteWord1 = new Arinc429Word(0);

  private fcdc2DiscreteWord1 = new Arinc429Word(0);

  private setVStallWarnBarPath() {
    const normalLawActive =
      this.fcdc1DiscreteWord1.bitValueOr(11, false) || this.fcdc2DiscreteWord1.bitValueOr(11, false);
    if (
      this.airSpeed.value - this.vStallWarn.value > DisplayRange ||
      this.vStallWarn.isFailureWarning() ||
      this.vStallWarn.isNoComputedData() ||
      normalLawActive
    ) {
      this.VStallWarnIndicator.instance.style.visibility = 'hidden';
    } else {
      this.VStallWarnIndicator.instance.style.visibility = 'inherit';

      const delta = Math.max(this.airSpeed.value - this.vStallWarn.value, -DisplayRange);
      const offset = (delta * DistanceSpacing) / ValueSpacing;

      this.VStallWarnIndicator.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values>();

    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((s) => {
        this.airSpeed = s;
        this.setVStallWarnBarPath();
      });

    sub
      .on('vStallWarn')
      .withArinc429Precision(2)
      .handle((v) => {
        this.vStallWarn = v;
        this.setVStallWarnBarPath();
      });

    sub.on('fcdc1DiscreteWord1').handle((word) => {
      this.fcdc1DiscreteWord1 = word;
      this.setVStallWarnBarPath();
    });

    sub.on('fcdc2DiscreteWord1').handle((word) => {
      this.fcdc2DiscreteWord1 = word;
      this.setVStallWarnBarPath();
    });
  }

  render(): VNode {
    return (
      <path
        id="StallWarnBarberpole"
        ref={this.VStallWarnIndicator}
        class="BarRed"
        // eslint-disable-next-line max-len
        d="m22.053 85.835v-2.6206m-3.022-2.419v2.419h3.022v-2.419zm3.022 10.079v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0-12.498h-3.022v2.4191h3.022zm0 12.498v-2.419h-3.022v2.419zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419zm3.022 25.198v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0-12.498h-3.022v2.419h3.022zm0 12.498v-2.4191h-3.022v2.4191zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419zm3.022 25.198v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0-12.498h-3.022v2.4191h3.022zm0 12.498v-2.4191h-3.022v2.4191zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419zm3.022 25.198v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m-3.022 5.0397h3.022v-2.4191h-3.022zm3.022-17.538h-3.022v2.419h3.022zm0 12.498v-2.419h-3.022v2.419zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419z"
      />
    );
  }
}

class V1Offtape extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly airSpeedWord = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('speedAr'),
  );

  private readonly v1Speed = ConsumerSubject.create(this.props.bus.getSubscriber<PFDSimvars>().on('v1'), 0);

  private readonly fwcFlightPhase = ConsumerSubject.create(
    this.props.bus.getSubscriber<PFDSimvars>().on('fwcFlightPhase'),
    0,
  );

  private readonly v1TextVisibility = MappedSubject.create(
    ([airSpeedWord, v1Speed, phase]) => {
      if (v1Speed - airSpeedWord.value > DisplayRange && !airSpeedWord.isFailureWarning() && phase <= 4) {
        return 'inherit';
      } else {
        return 'hidden';
      }
    },
    this.airSpeedWord,
    this.v1Speed,
    this.fwcFlightPhase,
  );

  private readonly v1Text = this.v1Speed.map((v1) => Math.round(v1).toString());

  render() {
    return (
      <text id="V1SpeedText" visibility={this.v1TextVisibility} class="FontTiny Cyan" x="21.271021" y="43.23">
        {this.v1Text}
      </text>
    );
  }
}

interface SpeedStateInfo {
  pfdTargetSpeed: Arinc429WordData;
  fcuSelectedSpeed: Arinc429WordData;
  speed: Arinc429WordData;
  fmgcDiscreteWord5: Arinc429Word;
}

class SpeedTarget extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly spdSelFlagVisible = Subject.create(false);

  private upperBoundRef = FSComponent.createRef<SVGTextElement>();

  private lowerBoundRef = FSComponent.createRef<SVGTextElement>();

  private speedTargetRef = FSComponent.createRef<SVGPathElement>();

  private currentVisible: NodeReference<SVGElement> = this.upperBoundRef;

  private textSub = Subject.create('0');

  private decelActive = false;

  private needsUpdate = true;

  private speedState: SpeedStateInfo = {
    speed: new Arinc429Word(0),
    pfdTargetSpeed: new Arinc429Word(0),
    fcuSelectedSpeed: new Arinc429Word(0),
    fmgcDiscreteWord5: new Arinc429Word(0),
  };

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.needsUpdate = true;

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & ClockEvents & Arinc429Values & FgBus & FcuBus>();

    sub
      .on('pfdSelectedSpeed')
      .withArinc429Precision(2)
      .handle((s) => {
        this.speedState.pfdTargetSpeed = s;
        this.needsUpdate = true;
      });

    sub
      .on('fmgcDiscreteWord5')
      .whenChanged()
      .handle((s) => {
        this.speedState.fmgcDiscreteWord5 = s;
        this.needsUpdate = true;
      });

    sub
      .on('fcuSelectedAirspeed')
      .withArinc429Precision(2)
      .handle((s) => {
        this.speedState.fcuSelectedSpeed = s;
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
      .on('autoBrakeDecel')
      .whenChanged()
      .handle((a) => {
        this.decelActive = a;
        this.needsUpdate = true;
      });

    sub.on('realTime').handle(this.onFrameUpdate.bind(this));
  }

  private onFrameUpdate(_realTime: number): void {
    if (this.needsUpdate === true) {
      this.needsUpdate = false;

      const fmgcPfdSelectedSpeedValid = !(
        this.speedState.pfdTargetSpeed.isNoComputedData() || this.speedState.pfdTargetSpeed.isFailureWarning()
      );
      const isSpeedManaged =
        this.speedState.fmgcDiscreteWord5.bitValueOr(19, false) &&
        !(this.speedState.fmgcDiscreteWord5.bitValueOr(20, false) || !fmgcPfdSelectedSpeedValid);

      const chosenTargetSpeed = fmgcPfdSelectedSpeedValid
        ? this.speedState.pfdTargetSpeed
        : this.speedState.fcuSelectedSpeed;

      const chosenTargetSpeedFailed = chosenTargetSpeed.isFailureWarning();
      const chosenTargetSpeedNcd = chosenTargetSpeed.isNoComputedData();

      const inRange = this.handleVisibility(chosenTargetSpeed.value, chosenTargetSpeedFailed, chosenTargetSpeedNcd);

      if (isSpeedManaged) {
        this.currentVisible.instance.classList.replace('Cyan', 'Magenta');
      } else {
        this.currentVisible.instance.classList.replace('Magenta', 'Cyan');
      }

      if (inRange) {
        const multiplier = 100;
        const currentValueAtPrecision = Math.round(this.speedState.speed.value * multiplier) / multiplier;
        const offset = ((currentValueAtPrecision - chosenTargetSpeed.value) * DistanceSpacing) / ValueSpacing;
        this.speedTargetRef.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
      } else {
        const text = Math.round(chosenTargetSpeed.value).toString().padStart(3, '0');
        this.textSub.set(text);
      }
    }
  }

  private handleVisibility(currentTargetSpeed: number, spdSelFail: boolean, spdSelNcd: boolean): boolean {
    let inRange = false;

    if (spdSelFail) {
      this.lowerBoundRef.instance.style.visibility = 'hidden';
      this.upperBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
      this.spdSelFlagVisible.set(true);
    } else if (spdSelNcd) {
      this.lowerBoundRef.instance.style.visibility = 'hidden';
      this.upperBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
      this.spdSelFlagVisible.set(false);
    } else if (this.speedState.speed.value - currentTargetSpeed < -DisplayRange) {
      this.upperBoundRef.instance.style.visibility = 'visible';
      this.lowerBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
      this.spdSelFlagVisible.set(false);
      this.currentVisible = this.upperBoundRef;
    } else if (this.speedState.speed.value - currentTargetSpeed > DisplayRange && !this.decelActive) {
      this.lowerBoundRef.instance.style.visibility = 'visible';
      this.upperBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
      this.spdSelFlagVisible.set(false);
      this.currentVisible = this.lowerBoundRef;
    } else if (Math.abs(this.speedState.speed.value - currentTargetSpeed) < DisplayRange) {
      this.lowerBoundRef.instance.style.visibility = 'hidden';
      this.upperBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'visible';
      this.spdSelFlagVisible.set(false);
      this.currentVisible = this.speedTargetRef;
      inRange = true;
    } else {
      this.lowerBoundRef.instance.style.visibility = 'hidden';
      this.upperBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
      this.spdSelFlagVisible.set(false);
    }
    return inRange;
  }

  render(): VNode {
    return (
      <>
        <text
          ref={this.lowerBoundRef}
          id="SelectedSpeedLowerText"
          class="FontSmallest EndAlign Cyan"
          x="24.078989"
          y="128.27917"
        >
          {this.textSub}
        </text>
        <text
          ref={this.upperBoundRef}
          id="SelectedSpeedUpperText"
          class="FontSmallest EndAlign Cyan"
          x="24.113895"
          y="36.670692"
        >
          {this.textSub}
        </text>
        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.spdSelFlagVisible}>
          <text id="SelectedSpeedFailText" class="FontSmall EndAlign Red" x="24.078989" y="36.670692">
            SPD SEL
          </text>
        </FlashOneHertz>

        <path
          ref={this.speedTargetRef}
          class="NormalStroke CornerRound Cyan"
          style="transform: translate3d(0px, 0px, 0px)"
          d="m19.274 81.895 5.3577 1.9512v-6.0476l-5.3577 1.9512"
        />
        <SpeedMargins bus={this.props.bus} />
      </>
    );
  }
}

class SpeedMargins extends DisplayComponent<{ bus: ArincEventBus }> {
  private currentSpeed = Subject.create(Arinc429Word.empty());

  private speedMarginHigh = Subject.create(Arinc429Word.empty());

  private speedMarginLow = Subject.create(Arinc429Word.empty());

  private upperSpeedMarginVisibility = MappedSubject.create(
    ([currentSpeed, speedMargin]) => this.computeVisibility(currentSpeed, speedMargin),
    this.currentSpeed,
    this.speedMarginHigh,
  );

  private lowerSpeedMarginVisibility = MappedSubject.create(
    ([currentSpeed, speedMargin]) => this.computeVisibility(currentSpeed, speedMargin),
    this.currentSpeed,
    this.speedMarginLow,
  );

  private upperMarginTransform = MappedSubject.create(
    ([currentSpeed, speedMargin]) => `translate(0 ${this.computeOffset(currentSpeed, speedMargin).toFixed(2)})`,
    this.currentSpeed,
    this.speedMarginHigh,
  );

  private lowerMarginTransform = MappedSubject.create(
    ([currentSpeed, speedMargin]) => `translate(0 ${this.computeOffset(currentSpeed, speedMargin).toFixed(2)})`,
    this.currentSpeed,
    this.speedMarginLow,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const sub = this.props.bus.getArincSubscriber<Arinc429Values & FgBus>();

    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((s) => this.currentSpeed.set(s));

    sub
      .on('fmgcSpeedMarginHigh')
      .withArinc429Precision(2)
      .handle((s) => this.speedMarginHigh.set(s));
    sub
      .on('fmgcSpeedMarginLow')
      .withArinc429Precision(2)
      .handle((s) => this.speedMarginLow.set(s));
  }

  render(): VNode {
    return (
      <g id="SpeedMargins">
        <path
          id="UpperSpeedMargin"
          class="Fill Magenta"
          d="m19.7 80.5 h 5.3577 v 0.7 h-5.3577 z"
          visibility={this.upperSpeedMarginVisibility}
          transform={this.upperMarginTransform}
        />
        <path
          id="LowerSpeedMargin"
          class="Fill Magenta"
          d="m19.7 80.5 h 5.3577 v 0.7 h-5.3577 z"
          visibility={this.lowerSpeedMarginVisibility}
          transform={this.lowerMarginTransform}
        />
      </g>
    );
  }

  private computeVisibility(currentSpeed: Arinc429Word, speedMargin: Arinc429Word) {
    if (
      Math.abs(currentSpeed.value - speedMargin.value) < DisplayRange &&
      !(speedMargin.isFailureWarning() || speedMargin.isNoComputedData())
    ) {
      return 'visible';
    } else {
      return 'hidden';
    }
  }

  private computeOffset(currentSpeed: Arinc429Word, speedMargin: Arinc429Word) {
    return Math.round((100 * (currentSpeed.value - speedMargin.value) * DistanceSpacing) / ValueSpacing) / 100;
  }
}

export class MachNumber extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getArincSubscriber<PFDSimvars>();

  private readonly mach = Arinc429LocalVarConsumerSubject.create(this.sub.on('mach'), Arinc429Register.empty().rawWord);

  private machHysteresis = Subject.create(false);

  private readonly leftMainGearCompressed = ConsumerSubject.create(
    this.props.bus.getSubscriber<PFDSimvars>().on('leftMainGearCompressed'),
    false,
  );

  private readonly rightMainGearCompressed = ConsumerSubject.create(
    this.props.bus.getSubscriber<PFDSimvars>().on('rightMainGearCompressed'),
    false,
  );

  private readonly onGround = MappedSubject.create(
    ([leftMainGearCompressed, rightMainGearCompressed]) => leftMainGearCompressed || rightMainGearCompressed,
    this.leftMainGearCompressed,
    this.rightMainGearCompressed,
  );

  private machStatus = MappedSubject.create(
    ([mach, machHysteresis, onGround]) => {
      if ((!mach.isFailureWarning() && !machHysteresis) || (mach.isFailureWarning() && onGround)) {
        return 1;
      } else if (mach.isFailureWarning()) {
        return 2;
      } else {
        return 3;
      }
    },
    this.mach,
    this.machHysteresis,
    this.onGround,
  );

  private readonly machPermille = this.mach.map((w) => Math.round(w.value * 1000));

  private readonly machTextSub = this.machPermille.map((machPerMille) => `.${machPerMille}`);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.mach.sub((mach) => {
      if (mach.value > 0.5) {
        this.machHysteresis.set(true);
      } else if (mach.value < 0.45) {
        this.machHysteresis.set(false);
      }
    }, true);
  }

  render(): VNode {
    return (
      <>
        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.machStatus.map((status) => status === 2)}>
          <text id="MachFailText" class="FontLargest StartAlign Red" x="5.4257932" y="136.88908">
            MACH
          </text>
        </FlashOneHertz>

        <text
          id="CurrentMachText"
          visibility={this.machStatus.map((status) => (status !== 3 ? 'hidden' : 'inherit'))}
          class="FontLargest StartAlign Green"
          x="5.566751"
          y="137.03004"
        >
          {this.machTextSub}
        </text>
      </>
    );
  }
}

class VProtBug extends DisplayComponent<{ bus: ArincEventBus }> {
  private vProtBug = FSComponent.createRef<SVGGElement>();

  private fcdcWord1 = new Arinc429Word(0);

  private Vmax = new Arinc429Word(0);

  private handleVProtBugDisplay() {
    const showVProt = this.Vmax.value > 240 && this.Vmax.isNormalOperation();
    const offset = (-(this.Vmax.value + 6) * DistanceSpacing) / ValueSpacing;

    const isNormalLawActive = this.fcdcWord1.bitValue(11) && !this.fcdcWord1.isFailureWarning();

    if (showVProt && isNormalLawActive) {
      this.vProtBug.instance.style.display = 'block';
      this.vProtBug.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
    } else {
      this.vProtBug.instance.style.display = 'none';
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values>();

    sub
      .on('vMax')
      .whenChanged()
      .handle((vm) => {
        this.Vmax = vm;

        this.handleVProtBugDisplay();
      });

    sub
      .on('fcdcDiscreteWord1')
      .whenChanged()
      .handle((word) => {
        this.fcdcWord1 = word;

        this.handleVProtBugDisplay();
      });
  }

  render(): VNode {
    return (
      <g id="SpeedProtSymbol" ref={this.vProtBug} style="display: none">
        <path class="NormalOutline" d="m13.994 81.289h3.022m-3.022-1.0079h3.022" />
        <path class="NormalStroke Green" d="m13.994 81.289h3.022m-3.022-1.0079h3.022" />
      </g>
    );
  }
}
