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
  EventBus,
  MappedSubject,
  Subscription,
  ConsumerSubject,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429WordData, Arinc429RegisterSubject } from '@flybywiresim/fbw-sdk';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { VerticalTape } from './VerticalTape';
import { SimplaneValues } from './shared/SimplaneValueProvider';
import { Arinc429Values } from './shared/ArincValueProvider';

import { CrosswindDigitalSpeedReadout } from './CrosswindDigitalSpeedReadout';

import { FgBus } from 'instruments/src/HUD/shared/FgBusProvider';
import { FcuBus } from 'instruments/src/HUD/shared/FcuBusProvider';
import { Layer } from '../MsfsAvionicsCommon/Layer';
import { WindMode, HudElems, FIVE_DEG, XWIND_TO_AIR_REF_OFFSET } from './HUDUtils';

const ValueSpacing = 10;
const DistanceSpacing = 42.5;
let DisplayRange = 42;

const decelValueSpacing = 10;
const decelDistanceSpacing = 21.25;

const neutralPos = 343.5;
export class AirspeedIndicator extends DisplayComponent<{
  bus: ArincEventBus;
  instrument: BaseInstrument;
}> {
  private readonly subscriptions: Subscription[] = [];

  private handleXwindMode() {
    this.crosswindMode.get() ? (DisplayRange = 20) : (DisplayRange = 42);
  }
  private readonly sub = this.props.bus.getArincSubscriber<
    EventBus & HUDSimvars & Arinc429Values & ClockEvents & HudElems
  >();
  private readonly crosswindMode = ConsumerSubject.create(this.sub.on('cWndMode').whenChanged(), false);
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.crosswindMode);

    this.subscriptions.push(
      this.crosswindMode.sub(() => {
        this.handleXwindMode();
      }, true),
    );
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <AirspeedIndicatorBase bus={this.props.bus} instrument={this.props.instrument} />
      </>
    );
  }
}

class V1BugElement extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly subscriptions: Subscription[] = [];
  private sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();
  private offsetSub = Subject.create('translate3d(0px, 0px, 0px)');

  private readonly speedAr = ConsumerSubject.create(this.sub.on('speedAr'), new Arinc429Word(0));
  private readonly flightPhase = ConsumerSubject.create(this.sub.on('fwcFlightPhase'), 0);
  private readonly v1Speed = ConsumerSubject.create(this.sub.on('v1'), 0);

  private readonly isV1BugVisible = MappedSubject.create(
    ([speed, flightPhase, v1Spd]) => {
      this.getV1Offset();
      return flightPhase <= 4 && v1Spd !== 0 && Math.abs(speed.value - v1Spd) < DisplayRange ? 'visible' : 'hidden';
    },
    this.speedAr,
    this.flightPhase,
    this.v1Speed,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.speedAr, this.flightPhase, this.v1Speed);
  }

  private getV1Offset() {
    const offset = (-this.v1Speed.get() * DistanceSpacing) / ValueSpacing;
    this.offsetSub.set(`transform:translate3d(0px, ${offset}px, 0px)`);
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }
    super.destroy();
  }

  render(): VNode {
    return (
      <g id="V1BugGroup" style={this.offsetSub} visibility={this.isV1BugVisible}>
        <path class="NormalStroke Green" d="m70.605 343.485h23.332" />
        <text class="FontSmall MiddleAlign Green" x="111.37356199999999" y="352.58">
          1
        </text>
      </g>
    );
  }
}

class VRBugElement extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly subscriptions: Subscription[] = [];
  private sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();
  private offsetSub = Subject.create('');

  private readonly speedAr = ConsumerSubject.create(this.sub.on('speedAr'), new Arinc429Word(0));
  private readonly flightPhase = ConsumerSubject.create(this.sub.on('fwcFlightPhase'), 0);
  private readonly vrSpeed = ConsumerSubject.create(this.sub.on('vr'), 0);

  private readonly isVrBugVisible = MappedSubject.create(
    ([speed, flightPhase, vrSpeed]) => {
      this.getVrOffset();
      return flightPhase <= 4 && vrSpeed !== 0 && Math.abs(speed.value - vrSpeed) < DisplayRange ? 'visible' : 'hidden';
    },
    this.speedAr,
    this.flightPhase,
    this.vrSpeed,
  );
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.speedAr, this.flightPhase, this.vrSpeed);
  }

  private getVrOffset() {
    const offset = (-this.vrSpeed.get() * DistanceSpacing) / ValueSpacing;
    this.offsetSub.set(`translate(0 ${offset})`);
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }
    super.destroy();
  }

  render(): VNode {
    return (
      <path
        visibility={this.isVrBugVisible}
        transform={this.offsetSub}
        id="RotateSpeedMarker"
        class="NormalStroke Green"
        d="m91.583 343.485a5.352 5.355 0 1 0 -10.703 0 5.352 5.355 0 1 0 10.703 0z"
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

class AirspeedIndicatorBase extends DisplayComponent<AirspeedIndicatorProps> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getArincSubscriber<
    EventBus & HUDSimvars & Arinc429Values & ClockEvents & HudElems
  >();

  private groundSpeed = '';
  private sDecelVis = Subject.create<String>('none');

  private speedSub = Subject.create<number>(0);

  private speedTapeElements: NodeReference<SVGGElement> = FSComponent.createRef();

  private failedGroup: NodeReference<SVGGElement> = FSComponent.createRef();

  private showBarsRef = FSComponent.createRef<SVGGElement>();

  private vfeNext = FSComponent.createRef<SVGPathElement>();
  private vfeNextXwnd = FSComponent.createRef<SVGPathElement>();

  private barTimeout = 0;

  private onGround = Subject.create(true);

  private airSpeed = new Arinc429Word(0);
  private vfe = new Arinc429Word(0);

  private leftMainGearCompressed: boolean = false;

  private rightMainGearCompressed: boolean = false;

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
      FIVE_DEG + Math.max(Math.max(Math.min(Number.isNaN(airspeedValue) ? 100 : airspeedValue, 72.1), 30) - 30, 0);
    this.pathSub.set(`m80.882 161.865v${length}`);
  }

  private readonly spdTape = ConsumerSubject.create(this.sub.on('spdTape').whenChanged(), '');
  private readonly xWindSpdTape = ConsumerSubject.create(this.sub.on('xWindSpdTape').whenChanged(), '');
  private readonly decMode = ConsumerSubject.create(this.sub.on('decMode').whenChanged(), 0);
  private readonly crosswindMode = ConsumerSubject.create(this.sub.on('cWndMode').whenChanged(), false);
  private readonly gndSpeed = ConsumerSubject.create(this.sub.on('gndSpeed').whenChanged(), false);

  private setVfeMarker() {
    if (this.vfe.isNormalOperation() && Math.abs(this.airSpeed.value - this.vfe.value) < DisplayRange) {
      const offset = (-this.vfe.value * DistanceSpacing) / ValueSpacing;
      this.vfeNext.instance.classList.remove('HiddenElement');
      this.vfeNextXwnd.instance.classList.remove('HiddenElement');
      this.vfeNext.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
      this.vfeNextXwnd.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
    } else {
      this.vfeNext.instance.classList.add('HiddenElement');
      this.vfeNextXwnd.instance.classList.add('HiddenElement');
    }
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.spdTape, this.xWindSpdTape, this.decMode, this.crosswindMode);

    this.subscriptions.push(
      this.gndSpeed.sub((vis) => {
        vis ? (this.groundSpeed = 'block') : (this.groundSpeed = 'none');
      }),
    );

    this.subscriptions.push(
      this.sub
        .on('leftMainGearCompressed')
        .whenChanged()
        .handle((value) => {
          this.onGround.set(value);
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('autoBrakeDecel')
        .whenChanged()
        .handle((value) => {
          value ? this.sDecelVis.set('block') : this.sDecelVis.set('none');
        }),
    );
    this.subscriptions.push(
      this.sub
        .on('vFeNext')
        .withArinc429Precision(2)
        .handle((vfe) => {
          this.vfe = vfe;
          this.setVfeMarker();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('speedAr')
        .withArinc429Precision(3)
        .handle((airSpeed) => {
          this.airSpeed = airSpeed;
          this.setOutline();
          this.setVfeMarker();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('leftMainGearCompressed')
        .whenChanged()
        .handle((g) => {
          this.leftMainGearCompressed = g;
          this.onGround.set(this.rightMainGearCompressed || g);
          this.setOutline();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('rightMainGearCompressed')
        .whenChanged()
        .handle((g) => {
          this.rightMainGearCompressed = g;
          this.onGround.set(this.leftMainGearCompressed || g);
          this.setOutline();
        }),
    );

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

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <g id="FailedGroup" ref={this.failedGroup} class="HiddenElement" transform="translate(60 167)">
          {/* <path id="SpeedTapeBackground" class="TapeBackground" d="m1.9058 123.56v-85.473h17.125v85.473z" /> */}
          <text id="SpeedFailText" class="Blink9Seconds FontLarge EndAlign Red" x="70" y="355">
            SPD
          </text>
          <path id="SpeedTapeOutlineRight" class="NormalStroke Red" d="m80.882 161.865v363" />
        </g>

        <g id="SpeedTapeElementsGroup" ref={this.speedTapeElements} transform="translate(60 167)">
          {/* transform="translate( -120 -66.5)" */}
          <g id="CrosswindSpeedTape" transform="translate( 0 -181.5)" display={this.xWindSpdTape}>
            <g id="CrosswindSpeedTapeTest">
              <path id="SpeedTapeOutlineRight" class="NormalStroke Green" d="m80.882 257.125v170" />
              <path id="SpeedTapeBelowForty" class="NormalStroke Green" d="m80.882 344.25v85" />
              <VerticalTape
                tapeValue={this.speedSub}
                lowerLimit={30}
                upperLimit={660}
                valueSpacing={ValueSpacing}
                displayRange={21 + 3}
                distanceSpacing={DistanceSpacing}
                type="speed"
                bus={this.props.bus}
              >
                <V1BugElement bus={this.props.bus} />
                <VRBugElement bus={this.props.bus} />
                <FlapsSpeedPointBugs bus={this.props.bus} />
                <path
                  id="VFeNextMarker"
                  ref={this.vfeNextXwnd}
                  class="NormalStroke Green"
                  d="m80.882 345.695h-12.201m0 -4.284h12.201"
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
              <SpeedTrendArrow
                mode={'normal'}
                airspeed={this.speedSub}
                instrument={this.props.instrument}
                bus={this.props.bus}
                distanceSpacing={DistanceSpacing}
                valueSpacing={ValueSpacing}
              />

              <V1Offtape bus={this.props.bus} />
            </g>
            <CrosswindDigitalSpeedReadout bus={this.props.bus} />
          </g>

          <g id="NormalSpeedTape" display={this.spdTape}>
            <path id="SpeedTapeOutlineRight" class="NormalStroke Green" d={this.pathSub} />
            <path id="SpeedTapeBelowForty" class="NormalStroke Green" d="m80.882 344.25v182.75" />

            <VerticalTape
              tapeValue={this.speedSub}
              lowerLimit={30}
              upperLimit={660}
              valueSpacing={ValueSpacing}
              displayRange={42 + 3}
              distanceSpacing={DistanceSpacing}
              type="speed"
              bus={this.props.bus}
            >
              <V1BugElement bus={this.props.bus} />
              <VRBugElement bus={this.props.bus} />
              <FlapsSpeedPointBugs bus={this.props.bus} />
              <path
                id="VFeNextMarker"
                ref={this.vfeNext}
                class="NormalStroke Green"
                d="m80.882 345.695h-12.201m0 -4.284h12.201"
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
            <SpeedTrendArrow
              mode={'normal'}
              airspeed={this.speedSub}
              instrument={this.props.instrument}
              bus={this.props.bus}
              distanceSpacing={DistanceSpacing}
              valueSpacing={ValueSpacing}
            />

            <V1Offtape bus={this.props.bus} />
          </g>

          <g id="decelSpeedTrend" transform="translate(50 0)" display={this.sDecelVis}>
            <SpeedTrendArrow
              mode={'decel'}
              airspeed={this.speedSub}
              instrument={this.props.instrument}
              bus={this.props.bus}
              distanceSpacing={decelDistanceSpacing}
              valueSpacing={decelValueSpacing}
            />
            <DecelMode bus={this.props.bus} />
            <text class="NormalStroke Green FontMedium" transform="translate(100 427)">
              MIN
            </text>
            <text class="NormalStroke Green FontMedium" transform="translate(100 487)">
              MED
            </text>
            <text class="NormalStroke Green FontMedium" transform="translate(100 527)">
              MAX
            </text>
          </g>

          <g display={this.groundSpeed} id="GroundSpeedIndicator" transform="translate(128 180) ">
            <GroundSpeedIndicator bus={this.props.bus} />
          </g>
        </g>
      </>
    );
  }
}

class FlapsSpeedPointBugs extends DisplayComponent<{ bus: ArincEventBus }> {
  private greenDotBug = FSComponent.createRef<SVGGElement>();

  private flapsBug = FSComponent.createRef<SVGGElement>();

  private slatBug = FSComponent.createRef<SVGGElement>();

  private airSpeed = new Arinc429Word(0);
  private gdSpd = new Arinc429Word(0);
  private sSpd = new Arinc429Word(0);
  private fSpd = new Arinc429Word(0);
  render(): VNode {
    return (
      <>
        <g id="GreenDotSpeedMarker" ref={this.greenDotBug} style="transform:translate3d(0px, 0px,0px)">
          <path class="ThickOutline" d="m86.233 343.612a5.352 5.355 0 1 0 -10.703 0 5.352 5.355 0 1 0 10.703 0z" />
          <path class="ThickStroke Green" d="m86.233 343.612a5.352 5.355 0 1 0 -10.703 0 5.352 5.355 0 1 0 10.703 0z" />
        </g>
        <g id="FlapsSlatsBug" ref={this.flapsBug} style="transform: translate3d(0px, 0px,0px)">
          <path class="NormalStroke Green" d="m80.882 343.485h16.269" />
          <text class="FontMedium MiddleAlign Green" x="117.03016325" y="354.143949">
            F
          </text>
        </g>
        <g id="FlapsSlatsBug" ref={this.slatBug} style="transform: translate3d(0px, 0px,0px)">
          <path class="NormalStroke Green" d="m80.882 343.485h16.269" />
          <text class="FontMedium MiddleAlign Green" x="117.03016325" y="354.143949">
            S
          </text>
        </g>
      </>
    );
  }
  private setVis() {
    if (this.gdSpd.isNormalOperation() && Math.abs(this.airSpeed.value - this.gdSpd.value) < DisplayRange) {
      this.greenDotBug.instance.style.visibility = 'visible';
      this.greenDotBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(this.gdSpd.value)}px, 0px`;
    } else {
      this.greenDotBug.instance.style.visibility = 'hidden';
    }

    if (this.sSpd.isNormalOperation() && Math.abs(this.airSpeed.value - this.sSpd.value) < DisplayRange) {
      this.slatBug.instance.style.visibility = 'visible';
      this.slatBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(this.sSpd.value)}px, 0px`;
    } else {
      this.slatBug.instance.style.visibility = 'hidden';
    }

    if (this.fSpd.isNormalOperation() && Math.abs(this.airSpeed.value - this.fSpd.value) < DisplayRange) {
      this.flapsBug.instance.style.visibility = 'visible';
      this.flapsBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(this.fSpd.value)}px, 0px`;
    } else {
      this.flapsBug.instance.style.visibility = 'hidden';
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();
    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((speed) => {
        this.airSpeed = speed;
        this.setVis();
      });
    sub
      .on('vMan')
      .withArinc429Precision(2)
      .handle((gd) => {
        this.gdSpd = gd;
      });
    sub
      .on('v4')
      .withArinc429Precision(2)
      .handle((sls) => {
        this.sSpd = sls;
      });
    sub
      .on('v3')
      .withArinc429Precision(2)
      .handle((fs) => {
        this.fSpd = fs;
      });
  }
}

const getSpeedTapeOffset = (speed: number): number => (-speed * DistanceSpacing) / ValueSpacing;

export class AirspeedIndicatorOfftape extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getArincSubscriber<HUDSimvars & HudElems & Arinc429Values>();

  private lowerRef = FSComponent.createRef<SVGGElement>();

  private offTapeRef = FSComponent.createRef<SVGGElement>();

  private offTapeFailedRef = FSComponent.createRef<SVGGElement>();

  private decelRef = FSComponent.createRef<SVGTextElement>();
  private decelXwndRef = FSComponent.createRef<SVGTextElement>();

  private spdLimFlagRef = FSComponent.createRef<SVGTextElement>();
  private spdLimFlagXwndRef = FSComponent.createRef<SVGTextElement>();

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

  private readonly spdTape = ConsumerSubject.create(this.sub.on('spdTape').whenChanged(), '');
  private readonly xWindSpdTape = ConsumerSubject.create(this.sub.on('xWindSpdTape').whenChanged(), '');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.spdTape, this.xWindSpdTape);

    this.subscriptions.push(
      this.sub
        .on('leftMainGearCompressed')
        .whenChanged()
        .handle((g) => {
          this.leftMainGearCompressed = g;
          this.onGround = this.rightMainGearCompressed || g;
          this.setOutline();
          this.onGround = g;
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('rightMainGearCompressed')
        .whenChanged()
        .handle((g) => {
          this.rightMainGearCompressed = g;
          this.onGround = this.leftMainGearCompressed || g;
          this.setOutline();
          this.onGround = g;
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('speedAr')
        .withArinc429Precision(2)
        .handle((speed) => {
          this.airSpeed = speed;
          this.setOutline();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('autoBrakeDecel')
        .whenChanged()
        .handle((a) => {
          if (a) {
            this.decelRef.instance.style.visibility = 'visible';
            this.decelXwndRef.instance.style.visibility = 'visible';
          } else {
            this.decelRef.instance.style.visibility = 'hidden';
            this.decelXwndRef.instance.style.visibility = 'hidden';
          }
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('facToUse')
        .whenChanged()
        .handle((a) => {
          if (a === 0) {
            this.spdLimFlagRef.instance.style.visibility = 'visible';
            this.spdLimFlagXwndRef.instance.style.visibility = 'visible';
          } else {
            this.spdLimFlagRef.instance.style.visibility = 'hidden';
            this.spdLimFlagXwndRef.instance.style.visibility = 'hidden';
          }
        }),
    );
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <g id="offTapeSpeedGroup">
          <g id="crosswind" display={this.xWindSpdTape}>
            <g id="SpeedOfftapeGroup" ref={this.offTapeRef} transform="translate(62 -15)">
              <path id="SpeedTapeOutlineUpper" class="NormalStroke Green" d="m8.1 256 h92.901" />
              <SpeedTarget bus={this.props.bus} mode={WindMode.CrossWind} />
              <text id="AutoBrkDecel" ref={this.decelXwndRef} class="FontSmall  EndAlign Green" x="87.3" y="161.5">
                DECEL
              </text>
              <path
                class="Fill Green SmallOutline"
                d="m59.474 342.5 v3.084h27.828l13.272 4.884v-12.851l-13.272 4.884z"
              />
              {/* <path class="Fill Green SmallOutline" d="m0.092604 12.55 v-0.7257h2.0147v0.7257z" /> */}
              <path id="SpeedTapeOutlineLower" ref={this.lowerRef} class="NormalStroke Green" d="m8.1 432 h 92.901" />
              <g ref={this.spdLimFlagXwndRef}>
                <text
                  id="SpdLimFailTextUpper"
                  x="136.32972775"
                  y="495.4624925"
                  class="FontSmall EndAlign Green Blink9Seconds"
                >
                  SPD
                </text>
                <text
                  id="SpdLimFailTextLower"
                  x="136.45623325"
                  y="519.1198625"
                  class="FontSmall EndAlign Green Blink9Seconds"
                >
                  LIM
                </text>
              </g>
            </g>
          </g>

          <g id="normal" display={this.spdTape}>
            <g id="OfftapeFailedGroup" ref={this.offTapeFailedRef} transform="translate(60 167)">
              <path id="SpeedTapeOutlineUpper" class="NormalStroke Red" d="m8.1 161.865h92.901" />
              <path id="SpeedTapeOutlineLower" class="NormalStroke Red" d="m8.1 525.13h92.901" />
            </g>
            <g id="SpeedOfftapeGroup" ref={this.offTapeRef} transform="translate(60 167)">
              <path id="SpeedTapeOutlineUpper" class="NormalStroke Green" d="m8.1 161.865h92.901" />
              <SpeedTarget bus={this.props.bus} mode={WindMode.Normal} />
              <text
                id="AutoBrkDecel"
                ref={this.decelRef}
                class="FontSmall  EndAlign Green"
                x="87.29189749999999"
                y="548.54733"
              >
                DECEL
              </text>
              <path
                class="Fill Green SmallOutline"
                d="m59.474 341.955v3.084h27.828l13.272 4.884v-12.851l-13.272 4.884z"
              />
              <path class="Fill Green SmallOutline" d="m0.394 345.036v-3.084h8.562v3.084z" />
              <path id="SpeedTapeOutlineLower" ref={this.lowerRef} class="NormalStroke Green" d="m8.1 525.13h92.901" />
              <g ref={this.spdLimFlagRef}>
                <text
                  id="SpdLimFailTextUpper"
                  x="136.32972775"
                  y="495.4624925"
                  class="FontSmall EndAlign Green Blink9Seconds"
                >
                  SPD
                </text>
                <text
                  id="SpdLimFailTextLower"
                  x="136.45623325"
                  y="519.1198625"
                  class="FontSmall EndAlign Green Blink9Seconds"
                >
                  LIM
                </text>
              </g>
            </g>
          </g>
        </g>
      </>
    );
  }
}

class DecelMode extends DisplayComponent<{
  bus: ArincEventBus;
}> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();
  private decelRef = FSComponent.createRef<SVGGElement>();
  private yOffset = Subject.create(0);

  private readonly autoBrakeMode = ConsumerSubject.create(this.sub.on('autoBrakeMode').whenChanged(), 0);
  private readonly decelTapeVis = ConsumerSubject.create(this.sub.on('autoBrakeDecel').whenChanged(), false);

  private setPath(mode: number) {
    switch (mode) {
      case 0:
        //none
        this.yOffset.set(0);

        break;
      case 1:
        //MIN
        this.yOffset.set(0);
        this.decelRef.instance.setAttribute('d', `m93 ${427 + this.yOffset.get()} h 55.25 v -25.5 h -55.25 z`);

        break;
      case 2:
        //MED
        this.yOffset.set(60);
        this.decelRef.instance.setAttribute('d', `m93 ${427 + this.yOffset.get()} h 55.25 v -25.5 h -55.25 z`);

        break;
      case 3:
        // MAX
        this.yOffset.set(100);
        this.decelRef.instance.setAttribute('d', `m93 ${427 + this.yOffset.get()} h 55.25 v -25.5 h -55.25 z`);
        break;
      default:
        break;
    }
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.autoBrakeMode, this.decelTapeVis);

    this.subscriptions.push(this.autoBrakeMode.sub((mode) => this.setPath(mode)));
    this.subscriptions.push(
      this.decelTapeVis.sub((vis) => {
        vis
          ? (this.decelRef.instance.style.visibility = 'visible')
          : (this.decelRef.instance.style.visibility = 'hidden');
      }),
    );
  }

  render(): VNode {
    return (
      <g id="decelModeChanged">
        <path ref={this.decelRef} class="NormalStroke Green" d="" />
      </g>
    );
  }
}

class SpeedTrendArrow extends DisplayComponent<{
  airspeed: Subscribable<number>;
  instrument: BaseInstrument;
  bus: ArincEventBus;
  valueSpacing: number;
  distanceSpacing: number;
  mode: string;
}> {
  private decelArrowBase = Subject.create<string>('');
  private decelArrowRange = Subject.create<string>('');
  private decelRefElement = FSComponent.createRef<SVGGElement>();

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
      let decelArrowBase;
      let decelArrowRange;
      const sign = Math.sign(this.vCTrend.value);

      const offset =
        -sign *
        Math.min(
          (DisplayRange * this.props.distanceSpacing) / this.props.valueSpacing + 3,
          Math.abs((-this.vCTrend.value * this.props.distanceSpacing) / this.props.valueSpacing),
        );

      if (
        Math.abs(offset) < (DisplayRange * this.props.distanceSpacing) / this.props.valueSpacing + 3 ||
        this.props.mode === 'decel'
      ) {
        if (sign > 0) {
          pathString = `m65.684  ${neutralPos + offset} l -5.326 10.458 M 65.684 ${neutralPos + offset}l 5.326 10.458`;
        } else {
          pathString = `m65.684  ${neutralPos + offset} l 5.326 -10.458 M 65.684 ${neutralPos + offset} l -5.326 -10.458`;
        }
      } else {
        pathString = '';
      }

      this.offset.set(`m65.684 ${neutralPos}v${offset.toFixed(10)}`);

      this.pathString.set(pathString);

      if (this.props.mode === 'decel') {
        decelArrowBase = `m57.184 ${neutralPos} h 17`;
        decelArrowRange = `m57.184 514.25 h 17`;
        this.decelArrowBase.set(decelArrowBase);
        this.decelArrowRange.set(decelArrowRange);
      }
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
        <path id="SpeedTrendArrowBase" ref={this.arrowBaseRef} class="NormalStroke Green" d={this.offset} />
        <path id="SpeedTrendArrowHead" ref={this.arrowHeadRef} class="NormalStroke Green" d={this.pathString} />

        <path id="SpeedTrendArrowBase" ref={this.decelRefElement} class="NormalStroke Green" d={this.decelArrowBase} />
        <path id="SpeedTrendArrowHead" ref={this.decelRefElement} class="NormalStroke Green" d={this.decelArrowRange} />
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

      const VLsPos = ((this.airSpeed.value - this.vls.value) * DistanceSpacing) / ValueSpacing + neutralPos;
      const lowestValue = this.airSpeed.value - DisplayRange;
      const vLsFloor = Math.max(lowestValue, normalLawActive ? this.vAlphaProt.value : this.vStallWarn.value);
      const offset = ((this.vls.value - vLsFloor) * DistanceSpacing) / ValueSpacing;

      this.vlsPath.set(`m 81 ${VLsPos}h 8.4 v ${offset}`);
      offset > 0 ? this.vlsVisbility.set('visible') : this.vlsVisbility.set('hidden');
    } else {
      this.vlsVisbility.set('hidden');
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<Arinc429Values & HUDSimvars & ClockEvents>();

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
    return <path id="VLsIndicator" class="NormalStroke Green" d={this.vlsPath} visibility={this.vlsVisbility} />;
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

      this.VAlimIndicator.instance.setAttribute('d', `m80.882 525.13h14.556v${offset}h-14.556`);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

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
      this.VAprotIndicator.instance.setAttribute('d', this.setPath());
    }
  }

  private setPath() {
    const length = DisplayRange - (this.airSpeed.value - this.vAlphaProt.value);
    const n = Math.round(length / 2.8);
    let path = `m93.075 343.4h-12.325v5.95h12.325v5.95z`;
    for (let i = 0; i < n; i++) {
      const path2 = `m0 11.9h-12.325v5.95h12.325v5.95z`;
      path = path + path2;
    }
    return path;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

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
        class="BarGreenThin"
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
      this.VMaxIndicator.instance.setAttribute('d', this.setPath());
    }
  }

  private setPath() {
    const length = DisplayRange + (this.airSpeed.value - this.vMax.value);
    const n = Math.round(length / 4.8);
    let path = `m93.5 333.2h-12.75v10.2h12.75v-20.4z`;
    for (let i = 0; i < n; i++) {
      const path2 = `m0 -20.4h-12.75v10.2h12.75v-20.4z`;
      path = path + path2;
    }
    return path;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

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
        class="BarGreenThin"
        // eslint-disable-next-line max-len
        //d="m22.053-2.2648v-2.6206m-3.022-2.419v2.419h3.022v-2.419zm3.022 10.079v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0-12.498h-3.022v2.4191h3.022zm0 12.498v-2.4191h-3.022v2.4191zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419zm3.022 25.198v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0-12.498h-3.022v2.4191h3.022zm0 12.498v-2.4191h-3.022v2.4191zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419zm3.022 25.198v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0-12.498h-3.022v2.4191h3.022zm0 12.498v-2.4191h-3.022v2.4191zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419zm3.022 25.198v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m0 7.6603v-2.6206m-3.022 5.0397h3.022v-2.4191h-3.022zm3.022-17.538h-3.022v2.4191h3.022zm0 12.498v-2.4191h-3.022v2.4191zm0-7.4588v2.4191h-3.022v-2.4191zm-3.022-10.079v2.419h3.022v-2.419z"
        d={this.setPath()}
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
      this.VStallWarnIndicator.instance.setAttribute('d', this.setPath());
    }
  }

  private setPath() {
    const length = DisplayRange - (this.airSpeed.value - this.vStallWarn.value);
    const n = Math.round(length / 5);
    let path = `m93.5 353.6 h -12.75 v -10.2 h 12.75 v 21.25 z`;
    for (let i = 0; i < n; i++) {
      const path2 = `m 0 21.25 h -12.75 v -10.2 h 12.75 v 21.25 z`;
      path = path + path2;
    }
    return path;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

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
        class="BarGreen"
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
    const sub = this.props.bus.getSubscriber<HUDSimvars>();

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
      <text ref={this.v1TextRef} id="V1SpeedText" class="FontSmall Green" x="90.40183925000001" y="183.7275">
        0
      </text>
    );
  }
}

interface SpeedStateInfo {
  pfdTargetSpeed: Arinc429Word;
  fcuSelectedSpeed: Arinc429Word;
  speed: Arinc429Word;
  fmgcDiscreteWord5: Arinc429Word;
}

class SpeedTarget extends DisplayComponent<{ bus: ArincEventBus; mode: WindMode }> {
  private xwindOffset = 0;
  private readonly spdSelFlagVisible = Subject.create(false);

  private lowerBoundRef = FSComponent.createRef<SVGTextElement>();
  private BoundBgRef = FSComponent.createRef<SVGPathElement>();

  private upperBoundRef = FSComponent.createRef<SVGTextElement>();

  private speedTargetRef = FSComponent.createRef<SVGPathElement>();

  private currentVisible: NodeReference<SVGElement> = this.lowerBoundRef;

  private textSub = Subject.create('0');

  private decelActive = false;
  private speedMarginsRef = FSComponent.createRef<SVGGElement>();
  private needsUpdate = true;
  private crosswindMode = false;
  private speedState: SpeedStateInfo = {
    speed: new Arinc429Word(0),
    pfdTargetSpeed: new Arinc429Word(0),
    fcuSelectedSpeed: new Arinc429Word(0),
    fmgcDiscreteWord5: new Arinc429Word(0),
  };

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.needsUpdate = true;
    const sub = this.props.bus.getArincSubscriber<
      HUDSimvars & SimplaneValues & ClockEvents & Arinc429Values & FgBus & FcuBus & HudElems
    >();

    sub
      .on('cWndMode')
      .whenChanged()
      .handle((v) => {
        this.crosswindMode = v;
        this.handleCrosswinMode();
      });

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

      const inRange = this.handleVisibility(
        chosenTargetSpeed.value,
        chosenTargetSpeedFailed,
        chosenTargetSpeedNcd,
        isSpeedManaged,
      );

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

      if (isSpeedManaged) {
        this.speedTargetRef.instance.classList.add('GreenFill2');
      } else {
        this.speedTargetRef.instance.classList.remove('GreenFill2');
      }
    }
  }

  private handleVisibility(
    currentTargetSpeed: number,
    spdSelFail: boolean,
    spdSelNcd: boolean,
    isSpeedManaged: boolean,
  ): boolean {
    let inRange = false;

    if (spdSelFail) {
      //fail
      this.lowerBoundRef.instance.style.visibility = 'hidden';
      this.upperBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
      this.spdSelFlagVisible.set(true);
    } else if (spdSelNcd) {
      //no computed data
      this.lowerBoundRef.instance.style.visibility = 'hidden';
      this.upperBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
      this.spdSelFlagVisible.set(false);
    } else if (this.speedState.speed.value - currentTargetSpeed > DisplayRange) {
      this.lowerBoundRef.instance.style.visibility = 'visible';
      this.upperBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
      this.BoundBgRef.instance.style.transform = `translate3d(0px, ${(DisplayRange / ValueSpacing) * DistanceSpacing + 15}px, 0px)`;
      this.spdSelFlagVisible.set(false);
      this.currentVisible = this.lowerBoundRef;
    } else if (this.speedState.speed.value - currentTargetSpeed < -DisplayRange && !this.decelActive) {
      this.upperBoundRef.instance.style.visibility = 'visible';
      this.lowerBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
      this.BoundBgRef.instance.style.transform = `translate3d(0px, ${-(DisplayRange / ValueSpacing) * DistanceSpacing - 15}px, 0px)`;
      this.spdSelFlagVisible.set(false);
      this.currentVisible = this.upperBoundRef;
    } else if (Math.abs(this.speedState.speed.value - currentTargetSpeed) < DisplayRange) {
      this.upperBoundRef.instance.style.visibility = 'hidden';
      this.lowerBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'visible';
      this.spdSelFlagVisible.set(false);
      this.currentVisible = this.speedTargetRef;
      inRange = true;
    } else {
      this.upperBoundRef.instance.style.visibility = 'hidden';
      this.lowerBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
      this.spdSelFlagVisible.set(false);
    }

    if (inRange) {
      this.BoundBgRef.instance.style.visibility = 'hidden';
    } else {
      if (isSpeedManaged) {
        this.BoundBgRef.instance.style.visibility = 'visible';
        this.upperBoundRef.instance.classList.add('InverseGreen');
        this.upperBoundRef.instance.classList.remove('Green');
        this.lowerBoundRef.instance.classList.add('InverseGreen');
        this.lowerBoundRef.instance.classList.remove('Green');
      } else {
        this.BoundBgRef.instance.style.visibility = 'hidden';
        this.upperBoundRef.instance.classList.remove('InverseGreen');
        this.upperBoundRef.instance.classList.add('Green');
        this.lowerBoundRef.instance.classList.remove('InverseGreen');
        this.lowerBoundRef.instance.classList.add('Green');
      }
    }

    if (this.decelActive) {
      this.BoundBgRef.instance.style.visibility = 'hidden';
    }
    return inRange;
  }

  private handleCrosswinMode() {
    if (this.crosswindMode === false) {
      this.xwindOffset = 0;
      this.upperBoundRef.instance.setAttribute('y', '155.85');
      this.lowerBoundRef.instance.setAttribute('y', '544');
      this.speedMarginsRef.instance.style.transform = `translate3d(0px, 0px, 0px)`;
    } else {
      this.xwindOffset = -XWIND_TO_AIR_REF_OFFSET;
      this.upperBoundRef.instance.setAttribute('y', '251');
      this.lowerBoundRef.instance.setAttribute('y', '448');
      this.speedMarginsRef.instance.style.transform = `translate3d(0px, 0px, 0px)`;
    }
  }

  render(): VNode {
    return (
      <>
        <path
          ref={this.BoundBgRef}
          id="SpeedTargetBackground"
          class="GreenFill"
          style=""
          d="m63.75 332.563 h 38.25 v 21.25 h -38.25z"
        ></path>
        <text
          ref={this.upperBoundRef}
          id="SelectedSpeedUpperText"
          class="FontSmall EndAlign InverseGreen "
          x="102.48405375"
          y="155.85"
        >
          {this.textSub}
        </text>
        <text
          ref={this.lowerBoundRef}
          id="SelectedSpeedLowerText"
          class="FontSmall EndAlign Green"
          x="102.33570325"
          y="544"
        >
          {this.textSub}
        </text>
        <path
          id="speedTarget"
          ref={this.speedTargetRef}
          class="NormalStroke CornerRound Green"
          style="transform: translate3d(0px, 0px, 0px)"
          d="m81.915 348.054 22.77 8.293v-25.702l-22.77 8.293"
        />
        <g ref={this.speedMarginsRef}>
          <SpeedMargins bus={this.props.bus} />
        </g>
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
          class="Fill Green"
          d="m83.725 342.125h22.77v2.975h-22.77z"
          visibility={this.upperSpeedMarginVisibility}
          transform={this.upperMarginTransform}
        />
        <path
          id="LowerSpeedMargin"
          class="Fill Green"
          d="m83.725 342.125h22.77v2.975h-22.77z"
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
  private machTextSub = Subject.create('');

  private failedRef = FSComponent.createRef<SVGTextElement>();

  private showMach = false;

  private onGround = false;

  private leftMainGearCompressed = true;

  private rightMainGearCompressed = true;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & HUDSimvars>();

    sub.on('machAr').handle((mach) => {
      if (!mach.isNormalOperation() && !this.onGround) {
        this.machTextSub.set('');
        this.failedRef.instance.style.display = 'inline';
        return;
      }
      this.failedRef.instance.style.display = 'none';
      const machPermille = Math.round(mach.value * 1000);
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
      <g id="MachGroup" transform="translate(70 615)">
        <text
          ref={this.failedRef}
          id="MachFailText"
          class="Blink9Seconds FontMedium StartAlign Green"
          x="5.4257932"
          y="136.88908"
        >
          MACH
        </text>
        <text id="CurrentMachText" class="FontMedium StartAlign Green" x="5.566751" y="137.03004">
          {this.machTextSub}
        </text>
      </g>
    );
  }
}

class VProtBug extends DisplayComponent<{ bus: ArincEventBus }> {
  private vProtBug = FSComponent.createRef<SVGGElement>();

  private fcdcWord1 = new Arinc429Word(0);

  private Vmax = new Arinc429Word(0);
  private currentSpeed = new Arinc429Word(0);

  private handleVProtBugDisplay() {
    const showVProt = this.Vmax.value > 240 && this.Vmax.isNormalOperation();
    const offset = (-(this.Vmax.value + 6) * DistanceSpacing) / ValueSpacing;

    const isNormalLawActive = this.fcdcWord1.bitValue(11) && !this.fcdcWord1.isFailureWarning();

    if (showVProt && isNormalLawActive && Math.abs(this.currentSpeed.value - this.Vmax.value) < DisplayRange) {
      this.vProtBug.instance.style.display = 'block';
      this.vProtBug.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
    } else {
      this.vProtBug.instance.style.display = 'none';
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

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
    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((s) => (this.currentSpeed = s));
  }

  render(): VNode {
    return (
      <g id="SpeedProtSymbol" ref={this.vProtBug} style="display: none">
        <path class="NormalOutline" d="m59.474 345.478h12.843m-12.843 -4.284h12.843" />
        <path class="NormalStroke Green" d="m59.474 345.478h12.843m-12.843 -4.284h12.843" />
      </g>
    );
  }
}

//GroundSpeed indicator
class GroundSpeedIndicator extends DisplayComponent<{ bus: EventBus }> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();
  private flightPhase = -1;
  private declutterMode = 0;
  private sVisibility = Subject.create('none');
  private readonly groundSpeedRef = FSComponent.createRef<SVGTextElement>();

  private readonly trueAirSpeedRef = FSComponent.createRef<SVGTextElement>();

  private readonly groundSpeedRegister = Arinc429RegisterSubject.createEmpty();

  private readonly trueAirSpeedRegister = Arinc429RegisterSubject.createEmpty();

  private readonly gndSpeed = ConsumerSubject.create(this.sub.on('gndSpeed'), false);
  private readonly isVisible = MappedSubject.create(([gndSpeed]) => {
    return gndSpeed ? 'block' : 'none';
  }, this.gndSpeed);

  onAfterRender(node: VNode) {
    super.onAfterRender(node);
    this.subscriptions.push(this.gndSpeed);

    this.sub
      .on('groundSpeed')
      .atFrequency(2)
      .handle((value) => this.groundSpeedRegister.setWord(value));

    this.groundSpeedRegister.sub((data) => {
      const element = this.groundSpeedRef.instance;

      element.textContent = data.isNormalOperation() ? Math.round(data.value).toString() : '';

      data.value <= 250
        ? (this.groundSpeedRef.instance.style.display = 'block')
        : (this.groundSpeedRef.instance.style.display = 'none');
    }, true);
  }

  render(): VNode | null {
    return (
      <g id="GndSpdGroup" display={this.isVisible}>
        <Layer x={2} y={25}>
          <text ref={this.groundSpeedRef} x={0} y={0} class="Green FontSmall">
            GS
          </text>
          <text ref={this.groundSpeedRef} x={70} y={0} class="Green FontSmall EndAlign" />
        </Layer>
      </g>
    );
  }
}
