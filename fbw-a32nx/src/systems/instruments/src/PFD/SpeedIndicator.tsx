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
            tapeValue={this.spdValue.map((value) => MathUtils.round(value, 1e-2))}
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

  private readonly airSpeedWord = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('speedAr').withArinc429Precision(2),
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

  private readonly facToUse = ConsumerSubject.create(this.props.bus.getSubscriber<Arinc429Values>().on('facToUse'), 0);

  private readonly spdLimFlagVisible = this.facToUse.map((facToUse) => facToUse === 0);

  private readonly decelActive = ConsumerSubject.create(
    this.props.bus.getSubscriber<PFDSimvars>().on('autoBrakeDecel'),
    false,
  );

  private readonly lowerLineVisible = MappedSubject.create(
    ([spdInvalid, spdValue]) => {
      const clampedSpeed = Math.max(Math.min(spdValue, 660), 30);
      return clampedSpeed > 72 && !spdInvalid;
    },
    this.spdInvalid,
    this.spdValue,
  );

  render(): VNode {
    return (
      <>
        <g id="OfftapeFailedGroup" visibility={this.spdInvalid.map((invalid) => (invalid ? 'inherit' : 'hidden'))}>
          <path id="SpeedTapeOutlineUpper" class="NormalStroke Red" d="m1.9058 38.086h21.859" />
          <path id="SpeedTapeOutlineLower" class="NormalStroke Red" d="m1.9058 123.56h21.859" />
        </g>
        <g id="SpeedOfftapeGroup" visibility={this.spdInvalid.map((invalid) => (invalid ? 'hidden' : 'inherit'))}>
          <path id="SpeedTapeOutlineUpper" class="NormalStroke White" d="m1.9058 38.086h21.859" />
          <SpeedTarget bus={this.props.bus} />
          <text
            id="AutoBrkDecel"
            visibility={this.decelActive.map((decel) => (decel ? 'inherit' : 'hidden'))}
            class="FontMedium EndAlign Green"
            x="20.53927"
            y="129.06996"
          >
            DECEL
          </text>
          <path
            class="Fill Yellow SmallOutline"
            d="m13.994 80.46v0.7257h6.5478l3.1228 1.1491v-3.0238l-3.1228 1.1491z"
          />
          <path class="Fill Yellow SmallOutline" d="m0.092604 81.185v-0.7257h2.0147v0.7257z" />
          <path
            id="SpeedTapeOutlineLower"
            visibility={this.lowerLineVisible.map((visible) => (visible ? 'inherit' : 'hidden'))}
            class="NormalStroke White"
            d="m1.9058 123.56h21.859"
          />
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
  private readonly sub = this.props.bus.getArincSubscriber<Arinc429Values>();

  private readonly vAlphaProt = Arinc429LocalVarConsumerSubject.create(this.sub.on('vAlphaProt'));

  private readonly vStallWarn = Arinc429LocalVarConsumerSubject.create(this.sub.on('vStallWarn'));

  private readonly airSpeed = Arinc429ConsumerSubject.create(this.sub.on('speedAr').withArinc429Precision(2));

  private readonly vls = Arinc429LocalVarConsumerSubject.create(this.sub.on('vLs'));

  private readonly fcdc1DiscreteWord1 = Arinc429ConsumerSubject.create(this.sub.on('fcdc1DiscreteWord1'));

  private readonly fcdc2DiscreteWord1 = Arinc429ConsumerSubject.create(this.sub.on('fcdc2DiscreteWord1'));

  private readonly normalLawActive = MappedSubject.create(
    ([fcdc1DiscreteWord1, fcdc2DiscreteWord1]) =>
      fcdc1DiscreteWord1.bitValueOr(11, false) || fcdc2DiscreteWord1.bitValueOr(11, false),
    this.fcdc1DiscreteWord1,
    this.fcdc2DiscreteWord1,
  );

  private vlsPath = MappedSubject.create(
    ([airSpeed, vls, vAlphaProt, vStallWarn, normalLawActive]) => {
      const VLsPos = ((airSpeed.value - vls.value) * DistanceSpacing) / ValueSpacing + 80.818;
      const offset =
        ((vls.value - (normalLawActive ? vAlphaProt.valueOr(0) : vStallWarn.valueOr(0))) * DistanceSpacing) /
        ValueSpacing;

      return `m19.031 ${MathUtils.round(VLsPos, 1e-2)}h 1.9748v${MathUtils.round(offset, 1e-2)}`;
    },
    this.airSpeed,
    this.vls,
    this.vAlphaProt,
    this.vStallWarn,
    this.normalLawActive,
  );

  private vlsVisible = MappedSubject.create(
    ([vls, vAlphaProt, vStallWarn, normalLawActive]) => {
      const lowerBorder = normalLawActive ? vAlphaProt : vStallWarn;

      return (
        !(vls.isNoComputedData() || vls.isFailureWarning()) &&
        !(lowerBorder.isNoComputedData() || lowerBorder.isFailureWarning()) &&
        vls.value - lowerBorder.value > 0
      );
    },
    this.vls,
    this.vAlphaProt,
    this.vStallWarn,
    this.normalLawActive,
  );

  render(): VNode {
    return (
      <path
        id="VLsIndicator"
        class="NormalStroke Amber"
        d={this.vlsPath}
        visibility={this.vlsVisible.map((visible) => (visible ? 'inherit' : ' hidden'))}
      />
    );
  }
}

class VAlphaLimBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getArincSubscriber<Arinc429Values>();

  private readonly vAlphaMax = Arinc429LocalVarConsumerSubject.create(this.sub.on('vAlphaMax'));

  private readonly airSpeed = Arinc429ConsumerSubject.create(this.sub.on('speedAr').withArinc429Precision(2));

  private readonly fcdc1DiscreteWord1 = Arinc429ConsumerSubject.create(this.sub.on('fcdc1DiscreteWord1'));

  private readonly fcdc2DiscreteWord1 = Arinc429ConsumerSubject.create(this.sub.on('fcdc2DiscreteWord1'));

  private readonly normalLawActive = MappedSubject.create(
    ([fcdc1DiscreteWord1, fcdc2DiscreteWord1]) =>
      fcdc1DiscreteWord1.bitValueOr(11, false) || fcdc2DiscreteWord1.bitValueOr(11, false),
    this.fcdc1DiscreteWord1,
    this.fcdc2DiscreteWord1,
  );

  private vAlphaMaxPath = MappedSubject.create(
    ([airSpeed, vAlphaMax]) => {
      const delta = airSpeed.value - DisplayRange - vAlphaMax.value;
      const offset = (delta * DistanceSpacing) / ValueSpacing;
      this;

      return `m19.031 123.56h3.425v${MathUtils.round(offset, 1e-2)}h-3.425z`;
    },
    this.airSpeed,
    this.vAlphaMax,
  );

  private vAlphaMaxHidden = MappedSubject.create(
    ([airSpeed, vAlphaMax, normalLawActive]) =>
      vAlphaMax.value - airSpeed.value < -DisplayRange ||
      vAlphaMax.isFailureWarning() ||
      vAlphaMax.isNoComputedData() ||
      !normalLawActive,
    this.airSpeed,
    this.vAlphaMax,
    this.normalLawActive,
  );

  render(): VNode {
    return (
      <path
        d={this.vAlphaMaxPath}
        visibility={this.vAlphaMaxHidden.map((hidden) => (hidden ? 'hidden' : 'inherit'))}
        id="VAlimIndicator"
        class="Fill Red"
      />
    );
  }
}

class VAlphaProtBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getArincSubscriber<Arinc429Values>();

  private readonly airSpeed = Arinc429ConsumerSubject.create(this.sub.on('speedAr').withArinc429Precision(2));

  private readonly vAlphaProt = Arinc429LocalVarConsumerSubject.create(this.sub.on('vAlphaProt'));

  private readonly fcdc1DiscreteWord1 = Arinc429ConsumerSubject.create(this.sub.on('fcdc1DiscreteWord1'));

  private readonly fcdc2DiscreteWord1 = Arinc429ConsumerSubject.create(this.sub.on('fcdc2DiscreteWord1'));

  private readonly normalLawActive = MappedSubject.create(
    ([fcdc1DiscreteWord1, fcdc2DiscreteWord1]) =>
      fcdc1DiscreteWord1.bitValueOr(11, false) || fcdc2DiscreteWord1.bitValueOr(11, false),
    this.fcdc1DiscreteWord1,
    this.fcdc2DiscreteWord1,
  );

  private vAlphaProtOffset = MappedSubject.create(
    ([airSpeed, vAlphaProt]) => {
      const delta = Math.max(airSpeed.value - vAlphaProt.value, -DisplayRange);
      const offset = (delta * DistanceSpacing) / ValueSpacing;

      return `transform:translate3d(0px, ${MathUtils.round(offset, 1e-2)}px, 0px)`;
    },
    this.airSpeed,
    this.vAlphaProt,
  );

  private vAlphaProtHidden = MappedSubject.create(
    ([airSpeed, vAlphaProt, normalLawActive]) =>
      airSpeed.value - vAlphaProt.value > DisplayRange ||
      vAlphaProt.isFailureWarning() ||
      vAlphaProt.isNoComputedData() ||
      !normalLawActive,
    this.airSpeed,
    this.vAlphaProt,
    this.normalLawActive,
  );

  render(): VNode {
    return (
      <path
        id="VAlphaProtBarberpole"
        style={this.vAlphaProtOffset}
        visibility={this.vAlphaProtHidden.map((hidden) => (hidden ? 'hidden' : 'inherit'))}
        class="BarAmber"
        // eslint-disable-next-line max-len
        d="m19.031 169.9v-1.4111h2.9213v1.4111zm2.9213-2.923v1.5119m0-4.4349v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-10.18h2.9213v1.4111h-2.9213zm2.9213 4.3341v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.846v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-5.846v-1.4111h2.9213v1.4111zm2.9213 0v1.5119m0-4.4349v1.5119m0-4.4349v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-10.18h2.9213v1.4111h-2.9213zm2.9213 4.3341v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.846v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-5.846v-1.4111h2.9213v1.4111zm2.9213 0v1.5119m0-4.4349v1.5119m0-4.4349v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-10.18h2.9213v1.4111h-2.9213zm2.9213 4.3341v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.846v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-5.846v-1.4111h2.9213v1.4111zm2.9213 0v1.5119m0-4.4349v1.5119m0-4.4349v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.8461v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-10.18h2.9213v1.4111h-2.9213zm2.9213 4.3341v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm2.9213-5.846v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm0-5.846v-1.4111h2.9213v1.4111zm2.9213 0v1.5119m0-4.4349v1.5119m0-4.4349v1.5119m-2.9213 1.4111v-1.4111h2.9213v1.4111zm1.9748-4.3341h0.94654v1.4111h-2.9213v-1.4111z"
      />
    );
  }
}

class VMaxBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getArincSubscriber<Arinc429Values>();

  private readonly airSpeed = Arinc429ConsumerSubject.create(this.sub.on('speedAr').withArinc429Precision(2));

  private readonly vMax = Arinc429LocalVarConsumerSubject.create(this.sub.on('vMax'));

  private vMaxOffset = MappedSubject.create(
    ([airSpeed, vMax]) => {
      const delta = Math.min(airSpeed.value - vMax.value, DisplayRange);
      const offset = (delta * DistanceSpacing) / ValueSpacing;

      return `transform:translate3d(0px, ${MathUtils.round(offset, 1e-2)}px, 0px)`;
    },
    this.airSpeed,
    this.vMax,
  );

  private vMaxHidden = MappedSubject.create(
    ([airSpeed, vMax]) => airSpeed.value - vMax.value < -DisplayRange || !vMax.isNormalOperation(),
    this.airSpeed,
    this.vMax,
  );

  render(): VNode {
    return (
      <path
        id="OverspeedBarberpole"
        style={this.vMaxOffset}
        visibility={this.vMaxHidden.map((hidden) => (hidden ? 'hidden' : 'inherit'))}
        class="BarRed"
        // eslint-disable-next-line max-len
        d="m22.053-2.2648v-2.6206m-3.022-2.419v2.419h3.022v-2.419zm3.022 10.079v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0-12.498h-3.022v2.4191h3.022zm0 12.498v-2.4191h-3.022v2.4191zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419zm3.022 25.198v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0-12.498h-3.022v2.4191h3.022zm0 12.498v-2.4191h-3.022v2.4191zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419zm3.022 25.198v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0-12.498h-3.022v2.4191h3.022zm0 12.498v-2.4191h-3.022v2.4191zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419zm3.022 25.198v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m-3.022 5.0397h3.022v-2.4191h-3.022zm3.022-17.538h-3.022v2.4191h3.022zm0 12.498v-2.4191h-3.022v2.4191zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419z"
      />
    );
  }
}

class VStallWarnBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getArincSubscriber<Arinc429Values>();

  private readonly airSpeed = Arinc429ConsumerSubject.create(this.sub.on('speedAr').withArinc429Precision(2));

  private readonly vStallWarn = Arinc429LocalVarConsumerSubject.create(this.sub.on('vStallWarn'));

  private readonly fcdc1DiscreteWord1 = Arinc429ConsumerSubject.create(this.sub.on('fcdc1DiscreteWord1'));

  private readonly fcdc2DiscreteWord1 = Arinc429ConsumerSubject.create(this.sub.on('fcdc2DiscreteWord1'));

  private readonly normalLawActive = MappedSubject.create(
    ([fcdc1DiscreteWord1, fcdc2DiscreteWord1]) =>
      fcdc1DiscreteWord1.bitValueOr(11, false) || fcdc2DiscreteWord1.bitValueOr(11, false),
    this.fcdc1DiscreteWord1,
    this.fcdc2DiscreteWord1,
  );

  private vStallWarnOffset = MappedSubject.create(
    ([airSpeed, vStallWarn]) => {
      const delta = Math.max(airSpeed.value - vStallWarn.value, -DisplayRange);
      const offset = (delta * DistanceSpacing) / ValueSpacing;

      return `transform:translate3d(0px, ${MathUtils.round(offset, 1e-2)}px, 0px)`;
    },
    this.airSpeed,
    this.vStallWarn,
  );

  private vStallWarnHidden = MappedSubject.create(
    ([airSpeed, vStallWarn, normalLawActive]) =>
      airSpeed.value - vStallWarn.value > DisplayRange ||
      vStallWarn.isFailureWarning() ||
      vStallWarn.isNoComputedData() ||
      normalLawActive,
    this.airSpeed,
    this.vStallWarn,
    this.normalLawActive,
  );

  render(): VNode {
    return (
      <path
        id="StallWarnBarberpole"
        style={this.vStallWarnOffset}
        visibility={this.vStallWarnHidden.map((hidden) => (hidden ? 'hidden' : 'inherit'))}
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

class SpeedTarget extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly airSpeedWord = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('speedAr').withArinc429Precision(2),
  );

  private readonly pfdTargetSpeed = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<FgBus>().on('pfdSelectedSpeed').withArinc429Precision(2),
  );

  private readonly fcuSelectedSpeed = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<FcuBus>().on('fcuSelectedAirspeed').withArinc429Precision(2),
  );

  private readonly fmgcDiscreteWord5 = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<FgBus>().on('fmgcDiscreteWord5').withArinc429Precision(2),
  );

  private readonly fmgcPfdSelectedSpeedValid = this.pfdTargetSpeed.map(
    (word) => !(word.isNoComputedData() || word.isFailureWarning()),
  );

  private readonly decelActive = ConsumerSubject.create(
    this.props.bus.getSubscriber<PFDSimvars>().on('autoBrakeDecel'),
    false,
  );

  private readonly isSpeedManaged = MappedSubject.create(
    ([fmgcDiscreteWord5, fmgcPfdSelectedSpeedValid]) =>
      fmgcDiscreteWord5.bitValueOr(19, false) &&
      !(fmgcDiscreteWord5.bitValueOr(20, false) || !fmgcPfdSelectedSpeedValid),
    this.fmgcDiscreteWord5,
    this.fmgcPfdSelectedSpeedValid,
  );

  private readonly chosenTargetSpeed = Arinc429ConsumerSubject.create(null);

  private readonly chosenTargetSpeedFailed = this.chosenTargetSpeed.map((word) => word.isFailureWarning());

  private readonly chosenTargetSpeedNcd = this.chosenTargetSpeed.map((word) => word.isNoComputedData());

  private readonly textSub = this.chosenTargetSpeed.map((word) => Math.round(word.value).toString().padStart(3, '0'));

  private readonly transform = MappedSubject.create(
    ([chosenTargetSpeed, airSpeedWord]) => {
      const multiplier = 100;
      const currentValueAtPrecision = Math.round(airSpeedWord.value * multiplier) / multiplier;
      const offset = ((currentValueAtPrecision - chosenTargetSpeed.value) * DistanceSpacing) / ValueSpacing;
      return `transform:translate3d(0px, ${MathUtils.round(offset, 1e-2)}px, 0px)`;
    },
    this.chosenTargetSpeed,
    this.airSpeedWord,
  );

  private readonly upperTextVisible = MappedSubject.create(
    ([chosenTargetSpeedFailed, chosenTargetSpeedNcd, chosenTargetSpeed, airSpeedWord]) =>
      !chosenTargetSpeedFailed && !chosenTargetSpeedNcd && airSpeedWord.value - chosenTargetSpeed.value < -DisplayRange,
    this.chosenTargetSpeedFailed,
    this.chosenTargetSpeedNcd,
    this.chosenTargetSpeed,
    this.airSpeedWord,
  );

  private readonly lowerTextVisible = MappedSubject.create(
    ([chosenTargetSpeedFailed, chosenTargetSpeedNcd, chosenTargetSpeed, airSpeedWord, decelActive]) =>
      !chosenTargetSpeedFailed &&
      !chosenTargetSpeedNcd &&
      airSpeedWord.value - chosenTargetSpeed.value > DisplayRange &&
      !decelActive,
    this.chosenTargetSpeedFailed,
    this.chosenTargetSpeedNcd,
    this.chosenTargetSpeed,
    this.airSpeedWord,
    this.decelActive,
  );

  private readonly triangleVisible = MappedSubject.create(
    ([chosenTargetSpeedFailed, chosenTargetSpeedNcd, chosenTargetSpeed, airSpeedWord]) =>
      !chosenTargetSpeedFailed &&
      !chosenTargetSpeedNcd &&
      Math.abs(airSpeedWord.value - chosenTargetSpeed.value) < DisplayRange,
    this.chosenTargetSpeedFailed,
    this.chosenTargetSpeedNcd,
    this.chosenTargetSpeed,
    this.airSpeedWord,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<ClockEvents & Arinc429Values & FgBus & FcuBus>();

    this.fmgcPfdSelectedSpeedValid.sub(
      (valid) => this.chosenTargetSpeed.setConsumer(sub.on(valid ? 'pfdSelectedSpeed' : 'fcuSelectedAirspeed')),
      true,
    );

    sub.on('realTime').handle(() => {
      this.airSpeedWord.get();
    });
  }

  render(): VNode {
    return (
      <>
        <text
          id="SelectedSpeedLowerText"
          class={this.isSpeedManaged
            .map((managed) => (managed ? 'Magenta' : 'Cyan'))
            .map((className) => `FontSmallest EndAlign ${className}`)}
          visibility={this.lowerTextVisible.map((visible) => (visible ? 'inherit' : 'hidden'))}
          x="24.078989"
          y="128.27917"
        >
          {this.textSub}
        </text>
        <text
          id="SelectedSpeedUpperText"
          class={this.isSpeedManaged
            .map((managed) => (managed ? 'Magenta' : 'Cyan'))
            .map((className) => `FontSmallest EndAlign ${className}`)}
          visibility={this.upperTextVisible.map((visible) => (visible ? 'inherit' : 'hidden'))}
          x="24.113895"
          y="36.670692"
        >
          {this.textSub}
        </text>
        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.chosenTargetSpeedFailed}>
          <text id="SelectedSpeedFailText" class="FontSmall EndAlign Red" x="24.078989" y="36.670692">
            SPD SEL
          </text>
        </FlashOneHertz>

        <path
          class={this.isSpeedManaged
            .map((managed) => (managed ? 'Magenta' : 'Cyan'))
            .map((className) => `NormalStroke CornerRound ${className}`)}
          visibility={this.triangleVisible.map((visible) => (visible ? 'inherit' : 'hidden'))}
          style={this.transform}
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
      if ((mach.isFailureWarning() || mach.isNoComputedData()) && !onGround) {
        return 2;
      } else if (!(mach.isFailureWarning() || mach.isNoComputedData()) && machHysteresis) {
        return 3;
      } else {
        return 1;
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
  private readonly sub = this.props.bus.getArincSubscriber<Arinc429Values>();

  private vProtBug = FSComponent.createRef<SVGGElement>();

  private readonly fcdc1DiscreteWord1 = Arinc429ConsumerSubject.create(this.sub.on('fcdc1DiscreteWord1'));

  private readonly fcdc2DiscreteWord1 = Arinc429ConsumerSubject.create(this.sub.on('fcdc2DiscreteWord1'));

  private readonly normalLawActive = MappedSubject.create(
    ([fcdc1DiscreteWord1, fcdc2DiscreteWord1]) =>
      fcdc1DiscreteWord1.bitValueOr(11, false) || fcdc2DiscreteWord1.bitValueOr(11, false),
    this.fcdc1DiscreteWord1,
    this.fcdc2DiscreteWord1,
  );

  private readonly vMax = Arinc429LocalVarConsumerSubject.create(this.sub.on('vMax'));

  private vProtOffset = MappedSubject.create(([vMax]) => {
    const offset = (-(vMax.value + 6) * DistanceSpacing) / ValueSpacing;

    return `transform:translate3d(0px, ${MathUtils.round(offset, 1e-2)}px, 0px)`;
  }, this.vMax);

  private vProtVisible = MappedSubject.create(
    ([vMax, normalLawActive]) => {
      const showVProt = vMax.value > 240 && vMax.isNormalOperation();

      return showVProt && normalLawActive;
    },
    this.vMax,
    this.normalLawActive,
  );

  render(): VNode {
    return (
      <g
        id="SpeedProtSymbol"
        style={this.vProtOffset}
        visibility={this.vProtVisible.map((visible) => (visible ? 'inherit' : 'hidden'))}
      >
        <path class="NormalOutline" d="m13.994 81.289h3.022m-3.022-1.0079h3.022" />
        <path class="NormalStroke Green" d="m13.994 81.289h3.022m-3.022-1.0079h3.022" />
      </g>
    );
  }
}
