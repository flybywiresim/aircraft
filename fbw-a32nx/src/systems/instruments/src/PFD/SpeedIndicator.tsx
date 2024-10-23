// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  DisplayComponent,
  FSComponent,
  NodeReference,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429WordData } from '@flybywiresim/fbw-sdk';

import { FmsVars } from 'instruments/src/MsfsAvionicsCommon/providers/FmsDataPublisher';
import { PFDSimvars } from './shared/PFDSimvarPublisher';
import { VerticalTape } from './VerticalTape';
import { SimplaneValues } from './shared/SimplaneValueProvider';
import { Arinc429Values } from './shared/ArincValueProvider';

const ValueSpacing = 10;
const DistanceSpacing = 10;
const DisplayRange = 42;

class V1BugElement extends DisplayComponent<{ bus: ArincEventBus }> {
  private offsetSub = Subject.create('translate3d(0px, 0px, 0px)');

  private visibilitySub = Subject.create('hidden');

  private flightPhase = 0;

  private v1Speed = 0;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const pf = this.props.bus.getSubscriber<PFDSimvars>();

    pf.on('v1')
      .whenChanged()
      .handle((g) => {
        this.v1Speed = g;
        this.getV1Offset();
        this.getV1Visibility();
      });

    pf.on('fwcFlightPhase')
      .whenChanged()
      .handle((g) => {
        this.flightPhase = g;
        this.getV1Visibility();
      });
  }

  private getV1Offset() {
    const offset = (-this.v1Speed * DistanceSpacing) / ValueSpacing;
    this.offsetSub.set(`transform:translate3d(0px, ${offset}px, 0px)`);
  }

  private getV1Visibility() {
    if (this.flightPhase <= 4 && this.v1Speed !== 0) {
      this.visibilitySub.set('visible');
    } else {
      this.visibilitySub.set('hidden');
    }
  }

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
  private offsetSub = Subject.create('');

  private visibilitySub = Subject.create('hidden');

  private flightPhase = 0;

  private vrSpeed = 0;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const pf = this.props.bus.getSubscriber<PFDSimvars>();

    pf.on('vr')
      .whenChanged()
      .handle((g) => {
        this.vrSpeed = g;
        this.getVrOffset();
        this.getVrVisibility();
      });

    pf.on('fwcFlightPhase')
      .whenChanged()
      .handle((g) => {
        this.flightPhase = g;
        this.getVrVisibility();
      });
  }

  private getVrOffset() {
    const offset = (-this.vrSpeed * DistanceSpacing) / ValueSpacing;
    this.offsetSub.set(`translate(0 ${offset})`);
  }

  private getVrVisibility() {
    if (this.flightPhase <= 4 && this.vrSpeed !== 0) {
      this.visibilitySub.set('visible');
    } else {
      this.visibilitySub.set('hidden');
    }
  }

  render(): VNode {
    return (
      <path
        visibility={this.visibilitySub}
        transform={this.offsetSub}
        id="RotateSpeedMarker"
        class="NormalStroke Cyan"
        d="m21.549 80.82a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z"
      />
    );
  }
}

interface AirspeedIndicatorProps {
  airspeedAcc?: number;
  FWCFlightPhase?: number;
  altitude?: Arinc429WordData;
  VLs?: number;
  VMax?: number;
  showBars?: boolean;
  bus: ArincEventBus;
  instrument: BaseInstrument;
}

export class AirspeedIndicator extends DisplayComponent<AirspeedIndicatorProps> {
  private speedSub = Subject.create<number>(0);

  private speedTapeElements: NodeReference<SVGGElement> = FSComponent.createRef();

  private failedGroup: NodeReference<SVGGElement> = FSComponent.createRef();

  private showBarsRef = FSComponent.createRef<SVGGElement>();

  private vfeNext = FSComponent.createRef<SVGPathElement>();

  private barTimeout = 0;

  private onGround = Subject.create(true);

  private airSpeed = new Arinc429Word(0);

  private leftMainGearCompressed: boolean;

  private rightMainGearCompressed: boolean;

  private pathSub = Subject.create('');

  private setOutline() {
    let airspeedValue: number;
    if (this.airSpeed.isFailureWarning() || (this.airSpeed.isNoComputedData() && !this.onGround.get())) {
      airspeedValue = NaN;
    } else if (this.airSpeed.isNoComputedData()) {
      airspeedValue = 30;
    } else {
      airspeedValue = this.airSpeed.value;
    }
    this.speedSub.set(airspeedValue);

    if (Number.isNaN(airspeedValue)) {
      this.speedTapeElements.instance.classList.add('HiddenElement');
      this.failedGroup.instance.classList.remove('HiddenElement');
    } else {
      this.speedTapeElements.instance.classList.remove('HiddenElement');
      this.failedGroup.instance.classList.add('HiddenElement');
    }

    const length =
      42.9 + Math.max(Math.max(Math.min(Number.isNaN(airspeedValue) ? 100 : airspeedValue, 72.1), 30) - 30, 0);
    this.pathSub.set(`m19.031 38.086v${length}`);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const pf = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values>();

    pf.on('vFeNext')
      .withArinc429Precision(2)
      .handle((vfe) => {
        if (vfe.isNormalOperation()) {
          const offset = (-vfe.value * DistanceSpacing) / ValueSpacing;
          this.vfeNext.instance.classList.remove('HiddenElement');
          this.vfeNext.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
        } else {
          this.vfeNext.instance.classList.add('HiddenElement');
        }
      });

    pf.on('speedAr')
      .withArinc429Precision(3)
      .handle((airSpeed) => {
        this.airSpeed = airSpeed;
        this.setOutline();
      });

    pf.on('leftMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.leftMainGearCompressed = g;
        this.onGround.set(this.rightMainGearCompressed || g);
        this.setOutline();
      });

    pf.on('rightMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.rightMainGearCompressed = g;
        this.onGround.set(this.leftMainGearCompressed || g);
        this.setOutline();
      });

    // showBars replacement
    this.onGround.sub((g) => {
      if (g) {
        this.showBarsRef.instance.style.display = 'none';
        clearTimeout(this.barTimeout);
      } else {
        this.barTimeout = setTimeout(() => {
          this.showBarsRef.instance.style.display = 'block';
        }, 10000) as unknown as number;
      }
      this.setOutline();
    });
  }

  render(): VNode {
    return (
      <>
        <g id="FailedGroup" ref={this.failedGroup} class="HiddenElement">
          <path id="SpeedTapeBackground" class="TapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" />
          <text id="SpeedFailText" class="Blink9Seconds FontLargest EndAlign Red" x="17.756115" y="83.386398">
            SPD
          </text>
          <path id="SpeedTapeOutlineRight" class="NormalStroke Red" d={this.pathSub} />
        </g>

        <g id="SpeedTapeElementsGroup" ref={this.speedTapeElements}>
          <path id="SpeedTapeBackground" class="TapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" />
          {/* Outline */}
          <path id="SpeedTapeOutlineRight" class="NormalStroke White" d={this.pathSub} />
          <VerticalTape
            tapeValue={this.speedSub}
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
            <path
              id="VFeNextMarker"
              ref={this.vfeNext}
              class="NormalStroke Amber"
              d="m19.031 81.34h-2.8709m0-1.0079h2.8709"
            />
            <VProtBug bus={this.props.bus} />
          </VerticalTape>

          <VMaxBar bus={this.props.bus} />
          <VAlphaProtBar bus={this.props.bus} />
          <VStallWarnBar bus={this.props.bus} />
          <g ref={this.showBarsRef}>
            <VLsBar bus={this.props.bus} />
          </g>
          <VAlphaLimBar bus={this.props.bus} />
          <SpeedTrendArrow airspeed={this.speedSub} instrument={this.props.instrument} bus={this.props.bus} />

          <V1Offtape bus={this.props.bus} />
        </g>
      </>
    );
  }
}

class FlapsSpeedPointBugs extends DisplayComponent<{ bus: ArincEventBus }> {
  private greenDotBug = FSComponent.createRef<SVGGElement>();

  private flapsBug = FSComponent.createRef<SVGGElement>();

  private slatBug = FSComponent.createRef<SVGGElement>();

  render(): VNode {
    return (
      <>
        <g id="GreenDotSpeedMarker" ref={this.greenDotBug} style="transform:translate3d(0px, 0px,0px)">
          <path class="ThickOutline" d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" />
          <path class="ThickStroke Green" d="m20.29 80.85a1.2592 1.2599 0 1 0-2.5184 0 1.2592 1.2599 0 1 0 2.5184 0z" />
        </g>
        <g id="FlapsSlatsBug" ref={this.flapsBug} style="transform: translate3d(0px, 0px,0px)">
          <path class="NormalStroke Green" d="m19.031 80.82h3.8279" />
          <text class="FontLarge MiddleAlign Green" x="27.536509" y="83.327988">
            F
          </text>
        </g>
        <g id="FlapsSlatsBug" ref={this.slatBug} style="transform: translate3d(0px, 0px,0px)">
          <path class="NormalStroke Green" d="m19.031 80.82h3.8279" />
          <text class="FontLarge MiddleAlign Green" x="27.536509" y="83.327988">
            S
          </text>
        </g>
      </>
    );
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values>();

    sub
      .on('vMan')
      .withArinc429Precision(2)
      .handle((gd) => {
        if (gd.isNormalOperation()) {
          this.greenDotBug.instance.style.visibility = 'visible';
          this.greenDotBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(gd.value)}px, 0px`;
        } else {
          this.greenDotBug.instance.style.visibility = 'hidden';
        }
      });
    sub
      .on('v4')
      .withArinc429Precision(2)
      .handle((sls) => {
        if (sls.isNormalOperation()) {
          this.slatBug.instance.style.visibility = 'visible';
          this.slatBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(sls.value)}px, 0px`;
        } else {
          this.slatBug.instance.style.visibility = 'hidden';
        }
      });
    sub
      .on('v3')
      .withArinc429Precision(2)
      .handle((fs) => {
        if (fs.isNormalOperation()) {
          this.flapsBug.instance.style.visibility = 'visible';
          this.flapsBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(fs.value)}px, 0px`;
        } else {
          this.flapsBug.instance.style.visibility = 'hidden';
        }
      });
  }
}

const getSpeedTapeOffset = (speed: number): number => (-speed * DistanceSpacing) / ValueSpacing;

export class AirspeedIndicatorOfftape extends DisplayComponent<{ bus: ArincEventBus }> {
  private lowerRef = FSComponent.createRef<SVGGElement>();

  private offTapeRef = FSComponent.createRef<SVGGElement>();

  private offTapeFailedRef = FSComponent.createRef<SVGGElement>();

  private decelRef = FSComponent.createRef<SVGTextElement>();

  private spdLimFlagRef = FSComponent.createRef<SVGTextElement>();

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
          this.spdLimFlagRef.instance.style.visibility = 'visible';
        } else {
          this.spdLimFlagRef.instance.style.visibility = 'hidden';
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
          <g ref={this.spdLimFlagRef}>
            <text id="SpdLimFailTextUpper" x="32.077583" y="116.57941" class="FontMedium EndAlign Red Blink9Seconds">
              SPD
            </text>
            <text id="SpdLimFailTextLower" x="32.107349" y="122.14585" class="FontMedium EndAlign Red Blink9Seconds">
              LIM
            </text>
          </g>
        </g>
      </>
    );
  }
}

class SpeedTrendArrow extends DisplayComponent<{
  airspeed: Subscribable<number>;
  instrument: BaseInstrument;
  bus: ArincEventBus;
}> {
  private refElement = FSComponent.createRef<SVGGElement>();

  private arrowBaseRef = FSComponent.createRef<SVGPathElement>();

  private arrowHeadRef = FSComponent.createRef<SVGPathElement>();

  private offset = Subject.create<string>('');

  private pathString = Subject.create<string>('');

  private vCTrend = new Arinc429Word(0);

  private vCTrendHysteresis = false;

  private handleVCTrend(): void {
    if (Math.abs(this.vCTrend.value) < 1) {
      this.vCTrendHysteresis = false;
    } else if (Math.abs(this.vCTrend.value) > 2) {
      this.vCTrendHysteresis = true;
    }

    if (!this.vCTrendHysteresis || !this.vCTrend.isNormalOperation()) {
      this.refElement.instance.style.visibility = 'hidden';
    } else {
      this.refElement.instance.style.visibility = 'visible';
      let pathString;
      const sign = Math.sign(this.vCTrend.value);

      const offset = (-this.vCTrend.value * DistanceSpacing) / ValueSpacing;
      const neutralPos = 80.823;
      if (sign > 0) {
        pathString = `m15.455 ${neutralPos + offset} l -1.2531 2.4607 M15.455 ${neutralPos + offset} l 1.2531 2.4607`;
      } else {
        pathString = `m15.455 ${neutralPos + offset} l 1.2531 -2.4607 M15.455 ${neutralPos + offset} l -1.2531 -2.4607`;
      }

      this.offset.set(`m15.455 80.823v${offset.toFixed(10)}`);

      this.pathString.set(pathString);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<Arinc429Values>();

    sub
      .on('vCTrend')
      .withArinc429Precision(2)
      .handle((word) => {
        this.vCTrend = word;

        this.handleVCTrend();
      });
  }

  render(): VNode | null {
    return (
      <g id="SpeedTrendArrow" ref={this.refElement}>
        <path id="SpeedTrendArrowBase" ref={this.arrowBaseRef} class="NormalStroke Yellow" d={this.offset} />
        <path id="SpeedTrendArrowHead" ref={this.arrowHeadRef} class="NormalStroke Yellow" d={this.pathString} />
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
      this.VAlimIndicator.instance.style.visibility = 'visible';

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
      this.VAprotIndicator.instance.style.visibility = 'visible';

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
      this.VMaxIndicator.instance.style.visibility = 'visible';

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
      this.VStallWarnIndicator.instance.style.visibility = 'visible';

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
  private v1TextRef = FSComponent.createRef<SVGTextElement>();

  private v1Speed = 0;

  onAfterRender() {
    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub.on('speed').handle((s) => {
      const speed = new Arinc429Word(s);
      if (this.v1Speed - speed.value > DisplayRange) {
        this.v1TextRef.instance.style.visibility = 'visible';
      } else {
        this.v1TextRef.instance.style.visibility = 'hidden';
      }
    });

    sub
      .on('v1')
      .whenChanged()
      .handle((v1) => {
        this.v1Speed = v1;
        this.v1TextRef.instance.textContent = Math.round(v1).toString();
      });

    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((p) => {
        if (p <= 4) {
          this.v1TextRef.instance.style.visibility = 'visible';
        } else {
          this.v1TextRef.instance.style.visibility = 'hidden';
        }
      });
  }

  render() {
    return (
      <text ref={this.v1TextRef} id="V1SpeedText" class="FontTiny Cyan" x="21.271021" y="43.23">
        0
      </text>
    );
  }
}

interface SpeedStateInfo {
  targetSpeed: number;
  managedTargetSpeed: number;
  holdValue: number;
  isSpeedManaged: boolean;
  isMach: boolean;
  speed: Arinc429WordData;
}

class SpeedTarget extends DisplayComponent<{ bus: ArincEventBus }> {
  private upperBoundRef = FSComponent.createRef<SVGTextElement>();

  private lowerBoundRef = FSComponent.createRef<SVGTextElement>();

  private speedTargetRef = FSComponent.createRef<SVGPathElement>();

  private currentVisible: NodeReference<SVGElement> = this.upperBoundRef;

  private textSub = Subject.create('0');

  private decelActive = false;

  private needsUpdate = true;

  private speedState: SpeedStateInfo = {
    speed: new Arinc429Word(0),
    targetSpeed: 100,
    managedTargetSpeed: 100,
    holdValue: 100,
    isSpeedManaged: false,
    isMach: false,
  };

  private handleManagedSpeed() {
    if (this.speedState.isSpeedManaged) {
      this.currentVisible.instance.classList.replace('Cyan', 'Magenta');
      const text = Math.round(this.speedState.managedTargetSpeed).toString().padStart(3, '0');
      this.textSub.set(text);
    } else {
      this.currentVisible.instance.classList.replace('Magenta', 'Cyan');
      const text = Math.round(this.speedState.managedTargetSpeed).toString().padStart(3, '0');
      this.textSub.set(text);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.needsUpdate = true;

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & SimplaneValues & ClockEvents & Arinc429Values>();

    sub
      .on('isSelectedSpeed')
      .whenChanged()
      .handle((s) => {
        this.speedState.isSpeedManaged = !s;
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
      .on('holdValue')
      .whenChanged()
      .handle((s) => {
        this.speedState.holdValue = s;
        this.needsUpdate = true;
      });

    sub
      .on('machActive')
      .whenChanged()
      .handle((s) => {
        this.speedState.isMach = s;
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

      this.determineTargetSpeed();
      const inRange = this.handleLowerUpperBound();
      this.handleManagedSpeed();

      if (inRange) {
        const multiplier = 100;
        const currentValueAtPrecision = Math.round(this.speedState.speed.value * multiplier) / multiplier;
        const offset =
          ((currentValueAtPrecision -
            (this.speedState.isSpeedManaged ? this.speedState.managedTargetSpeed : this.speedState.targetSpeed)) *
            DistanceSpacing) /
          ValueSpacing;
        this.speedTargetRef.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
      } else {
        const text = Math.round(
          this.speedState.isSpeedManaged ? this.speedState.managedTargetSpeed : this.speedState.targetSpeed,
        )
          .toString()
          .padStart(3, '0');
        this.textSub.set(text);
      }
    }
  }

  private determineTargetSpeed() {
    const isSelected = !this.speedState.isSpeedManaged;
    if (isSelected) {
      if (this.speedState.isMach) {
        const holdValue = this.speedState.holdValue;
        this.speedState.targetSpeed = SimVar.GetGameVarValue(
          'FROM MACH TO KIAS',
          'number',
          holdValue === null ? undefined : holdValue,
        );
      } else {
        this.speedState.targetSpeed = this.speedState.holdValue;
      }
    }
  }

  private handleLowerUpperBound(): boolean {
    let inRange = false;

    const currentTargetSpeed = this.speedState.isSpeedManaged
      ? this.speedState.managedTargetSpeed
      : this.speedState.targetSpeed;
    if (this.speedState.speed.value - currentTargetSpeed > DisplayRange) {
      this.upperBoundRef.instance.style.visibility = 'visible';
      this.lowerBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
      this.currentVisible = this.upperBoundRef;
    } else if (this.speedState.speed.value - currentTargetSpeed < -DisplayRange && !this.decelActive) {
      this.lowerBoundRef.instance.style.visibility = 'visible';
      this.upperBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
      this.currentVisible = this.lowerBoundRef;
    } else if (Math.abs(this.speedState.speed.value - currentTargetSpeed) < DisplayRange) {
      this.lowerBoundRef.instance.style.visibility = 'hidden';
      this.upperBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'visible';
      this.currentVisible = this.speedTargetRef;
      inRange = true;
    } else {
      this.lowerBoundRef.instance.style.visibility = 'hidden';
      this.upperBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
    }
    return inRange;
  }

  render(): VNode {
    return (
      <>
        <text
          ref={this.upperBoundRef}
          id="SelectedSpeedLowerText"
          class="FontSmallest EndAlign Cyan"
          x="24.078989"
          y="128.27917"
        >
          {this.textSub}
        </text>
        <text
          ref={this.lowerBoundRef}
          id="SelectedSpeedLowerText"
          class="FontSmallest EndAlign Cyan"
          x="24.113895"
          y="36.670692"
        >
          {this.textSub}
        </text>
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
  private shouldShowMargins = false;

  private currentSpeed = Subject.create(Arinc429Word.empty());

  private upperSpeedMarginVisibility = Subject.create<'visible' | 'hidden'>('hidden');

  private lowerSpeedMarginVisibility = Subject.create<'visible' | 'hidden'>('hidden');

  private upperMarginTransform = Subject.create('translate(0 0)');

  private lowerMarginTransform = Subject.create('translate(0 0)');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const sub = this.props.bus.getArincSubscriber<Arinc429Values & FmsVars>();

    sub
      .on('showSpeedMargins')
      .whenChanged()
      .handle((active) => (this.shouldShowMargins = active));

    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((s) => this.currentSpeed.set(s));

    sub.on('upperSpeedMargin').handle(this.updateMargin(this.upperSpeedMarginVisibility, this.upperMarginTransform));
    sub.on('lowerSpeedMargin').handle(this.updateMargin(this.lowerSpeedMarginVisibility, this.lowerMarginTransform));
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

  private updateMargin(visibility: Subject<'visible' | 'hidden'>, transform: Subject<string>) {
    return (speed: number) => {
      const shouldForceHideMargins = !this.shouldShowMargins || !this.currentSpeed.get().isNormalOperation();
      const marginIsVisible = visibility.get() === 'visible';

      if (shouldForceHideMargins) {
        if (marginIsVisible) {
          visibility.set('hidden');
        }

        return;
      }

      const isInRange = Math.abs(this.currentSpeed.get().value - speed) < DisplayRange;
      if (isInRange) {
        const offset = (
          Math.round((100 * (this.currentSpeed.get().value - speed) * DistanceSpacing) / ValueSpacing) / 100
        ).toFixed(2);
        transform.set(`translate(0 ${offset})`);
      }

      if (isInRange !== marginIsVisible) {
        visibility.set(isInRange ? 'visible' : 'hidden');
      }
    };
  }
}

export class MachNumber extends DisplayComponent<{ bus: ArincEventBus }> {
  private machTextSub = Subject.create('');

  private failedRef = FSComponent.createRef<SVGTextElement>();

  private showMach = false;

  private onGround = false;

  private leftMainGearCompressed = true;

  private rightMainGearCompressed = true;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & PFDSimvars>();

    sub.on('machAr').handle((mach) => {
      if (!mach.isNormalOperation() && !this.onGround) {
        this.machTextSub.set('');
        this.failedRef.instance.style.display = 'inline';
        return;
      }
      this.failedRef.instance.style.display = 'none';
      const machPermille = Math.round(mach.valueOr(0) * 1000);
      if (this.showMach && machPermille < 450) {
        this.showMach = false;
        this.machTextSub.set('');
      } else if (!this.showMach && machPermille > 500) {
        this.showMach = true;
      }
      if (this.showMach) {
        this.machTextSub.set(`.${machPermille}`);
      }
    });

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.leftMainGearCompressed = g;
        this.onGround = this.rightMainGearCompressed || g;
      });

    sub
      .on('rightMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.rightMainGearCompressed = g;
        this.onGround = this.leftMainGearCompressed || g;
      });
  }

  render(): VNode {
    return (
      <>
        <text
          ref={this.failedRef}
          id="MachFailText"
          class="Blink9Seconds FontLargest StartAlign Red"
          x="5.4257932"
          y="136.88908"
        >
          MACH
        </text>
        <text id="CurrentMachText" class="FontLargest StartAlign Green" x="5.566751" y="137.03004">
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
