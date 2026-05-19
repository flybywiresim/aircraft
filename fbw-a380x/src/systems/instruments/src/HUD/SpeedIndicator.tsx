// @ts-strict-ignore
/* eslint-disable prettier/prettier */
import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  NodeReference,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import {
  Arinc429LocalVarConsumerSubject,
  Arinc429RegisterSubject,
  Arinc429Word,
  ArincEventBus,
} from '@flybywiresim/fbw-sdk';
import { FmsVars } from 'instruments/src/MsfsAvionicsCommon/providers/FmsDataPublisher';
import { LagFilter, RateLimiter, XWIND_FULL_OFFSET, XWIND_TO_AIR_REF_OFFSET } from './HUDUtils';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { VerticalTape } from './VerticalTape';
import { SimplaneValues } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';
import { WindMode, HudElems } from './HUDUtils';
import { CrosswindDigitalSpeedReadout } from './CrosswindDigitalSpeedReadout';
import { AutoThrustMode } from '../../../shared/autopilot';
import { Layer } from '../MsfsAvionicsCommon/Layer';
import { Arinc429Values } from './shared/ArincValueProvider';
import { FcdcValueProvider } from './shared/FcdcValueProvider';
import { SfccEvents } from 'instruments/src/MsfsAvionicsCommon/providers/SfccPublisher';

const ValueSpacing = 10;
const DistanceSpacing = 45.6;
let DisplayRange = 42;
const neutralPos = 361.5;

const VMO = 340;
const MMO = 0.89;

class AirspeedIndicatorBase extends DisplayComponent<AirspeedIndicatorProps> {
  private flightPhase = -1;
  private declutterMode = 0;
  private crosswindMode = false;
  private bitMask = 0;
  private athMode = 0;
  private onToPower = false;
  private sDecelVis = Subject.create<String>('none');
  private sCrosswindModeOn = Subject.create<String>('');
  private sCrosswindModeOff = Subject.create<String>('');
  private groundSpeedRef = FSComponent.createRef<SVGGElement>();
  private lgRightCompressed = true;

  private spdTape = '';
  private xWindSpdTape = '';
  private spdTapeRef = FSComponent.createRef<SVGGElement>();
  private xWindSpdTapeRef = FSComponent.createRef<SVGGElement>();

  private speedSub = Subject.create<number>(0);

  private speedTapeElements: NodeReference<SVGGElement> = FSComponent.createRef();

  private failedGroup: NodeReference<SVGGElement> = FSComponent.createRef();

  private showBarsRef = FSComponent.createRef<SVGGElement>();

  private vfeNext = FSComponent.createRef<SVGPathElement>();
  private vfeNextXwnd = FSComponent.createRef<SVGPathElement>();

  private barTimeout = 0;

  private onGround = Subject.create(true);

  private airSpeed = new Arinc429Word(0);

  private leftMainGearCompressed: boolean;

  private rightMainGearCompressed: boolean;

  private pathSub = Subject.create('');
  private cwOffsetRef = FSComponent.createRef<SVGGElement>();
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
    this.pathSub.set(`m17.071 34.163v${length}`);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & ClockEvents & HudElems>();

    sub
      .on('spdTape')
      .whenChanged()
      .handle((v) => {
        this.spdTape = v;
        this.spdTapeRef.instance.style.display = `${this.spdTape}`;
      });
    sub
      .on('xWindSpdTape')
      .whenChanged()
      .handle((v) => {
        this.xWindSpdTape = v;
        this.xWindSpdTapeRef.instance.style.display = `${this.xWindSpdTape}`;
      });

    sub
      .on('AThrMode')
      .whenChanged()
      .handle((value) => {
        this.athMode = value;
        this.athMode == AutoThrustMode.MAN_FLEX ||
        this.athMode == AutoThrustMode.MAN_TOGA ||
        this.athMode == AutoThrustMode.TOGA_LK
          ? (this.onToPower = true)
          : (this.onToPower = false);
      });

    sub
      .on('decMode')
      .whenChanged()
      .handle((value) => {
        this.declutterMode = value;
        this.setOutline();
      });
    sub
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
        this.cwOffsetRef.instance.style.transform = `translate3d(0px, ${XWIND_TO_AIR_REF_OFFSET}px, 0px)`;
      });

    sub
      .on('autoBrakeDecel')
      .whenChanged()
      .handle((value) => {
        value ? this.sDecelVis.set('block') : this.sDecelVis.set('none');
      });
    sub
      .on('vFeNext')
      .withArinc429Precision(2)
      .handle((vfe) => {
        if (vfe.isNormalOperation()) {
          const offset = (-vfe.value * DistanceSpacing) / ValueSpacing;
          this.vfeNext.instance.classList.remove('HiddenElement');
          this.vfeNextXwnd.instance.classList.remove('HiddenElement');
          this.vfeNext.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
          this.vfeNextXwnd.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
        } else {
          this.vfeNext.instance.classList.add('HiddenElement');
          this.vfeNextXwnd.instance.classList.add('HiddenElement');
        }
      });

    sub
      .on('speedAr')
      .withArinc429Precision(3)
      .handle((airSpeed) => {
        this.airSpeed = airSpeed;
        this.setOutline();
      });

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.leftMainGearCompressed = g;
        this.onGround.set(this.rightMainGearCompressed || g);
        this.setOutline();
      });

    sub
      .on('rightMainGearCompressed')
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

    sub
      .on('realTime')
      .atFrequency(2)
      .handle(() => {
        //this.crosswindMode ? (DisplayRange = 20) : (DisplayRange = 42);
      });
  }

  render(): VNode {
    return (
      <>
        <g id="FailedGroup" transform="translate(95 159)" ref={this.failedGroup} class="HiddenElement">
          <path id="SpeedTapeOutlineRight" class="NormalStroke Green" d="m87 170 v 383" />
          <path id="SpeedTapeOutlineUpper" class="NormalStroke Green" d="m16 170 h 98" />
          <path id="SpeedTapeOutlineLower" class="NormalStroke Green" d="m16 553 h 98" />
          <text id="SpeedFailText" class="Blink9Seconds FontLargest EndAlign Green" x="80" y="373">
            SPD
          </text>
        </g>

        <g id="SpeedTapeElementsGroup" ref={this.speedTapeElements}>
          <g id="CrosswindSpeedTape" transform="translate(95 159)" ref={this.xWindSpdTapeRef}>
            <g id="CrosswindSpeedTapeTest" class="cwTest">
              {/* <path id="SpeedTapeOutlineRight" class="NormalStroke Green" d={this.pathSub} />
              <path id="SpeedTapeBelowForty" class="NormalStroke Green" d="m19.031 81 v43" /> */}

              {/* <g id="CrosswindVerticalTape" transform="translate(0 -311)" */}
              <g id="CrosswindVerticalTape" ref={this.cwOffsetRef}>
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
                    ref={this.vfeNextXwnd}
                    class="ThickStroke Green"
                    d="m87 365 h-14.354m0 -7.04h14.354"
                  />
                  <VProtBug bus={this.props.bus} fcdcData={this.props.fcdcData} />
                </VerticalTape>
                <VMaxBar bus={this.props.bus} />
                <VAlphaProtBar bus={this.props.bus} fcdcData={this.props.fcdcData} />
                <VStallWarnBar bus={this.props.bus} fcdcData={this.props.fcdcData} />
                <g ref={this.showBarsRef}>
                  <VLsBar bus={this.props.bus} fcdcData={this.props.fcdcData} />
                </g>
                <VAlphaLimBar bus={this.props.bus} fcdcData={this.props.fcdcData} />
                <SpeedTrendArrow
                  airspeed={this.speedSub}
                  instrument={this.props.instrument}
                  bus={this.props.bus}
                  distanceSpacing={DistanceSpacing}
                  valueSpacing={ValueSpacing}
                />
                <V1Offtape bus={this.props.bus} />
                <ArsBar bus={this.props.bus} />
              </g>
            </g>
          </g>

          <g id="NormalSpeedTape" ref={this.spdTapeRef} transform=" translate(95 159)">
            <path id="SpeedTapeOutlineRight" class="NormalStroke Green" d={this.pathSub} />
            <path id="SpeedTapeBelowForty" class="NormalStroke Green" d="m17.071 72.657v38.571" />

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
                class="ThickStroke Green"
                d="m87 365 h-14.354m0 -7.04h14.354"
              />
              <VProtBug bus={this.props.bus} fcdcData={this.props.fcdcData} />
            </VerticalTape>

            <VMaxBar bus={this.props.bus} />
            <VAlphaProtBar bus={this.props.bus} fcdcData={this.props.fcdcData} />
            <VStallWarnBar bus={this.props.bus} fcdcData={this.props.fcdcData} />
            <g ref={this.showBarsRef}>
              <VLsBar bus={this.props.bus} fcdcData={this.props.fcdcData} />
            </g>
            <VAlphaLimBar bus={this.props.bus} fcdcData={this.props.fcdcData} />
            <SpeedTrendArrow
              airspeed={this.speedSub}
              instrument={this.props.instrument}
              bus={this.props.bus}
              distanceSpacing={DistanceSpacing}
              valueSpacing={ValueSpacing}
            />
            <V1Offtape bus={this.props.bus} />
            <ArsBar bus={this.props.bus} />
          </g>

          <g ref={this.groundSpeedRef} id="GroundSpeedIndicator" transform="translate(200 400) ">
            <GroundSpeedIndicator bus={this.props.bus} />
          </g>
        </g>
      </>
    );
  }
}

class V1BugElement extends DisplayComponent<{ bus: EventBus }> {
  private offsetSub = Subject.create('translate3d(0px, 0px, 0px)');

  private visibilitySub = Subject.create('hidden');

  private flightPhase = 0;

  private v1Speed = 0;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const pf = this.props.bus.getSubscriber<HUDSimvars>();

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
    if (this.flightPhase <= 5 && this.v1Speed !== 0) {
      this.visibilitySub.set('visible');
    } else {
      this.visibilitySub.set('hidden');
    }
  }

  render(): VNode {
    return (
      <g id="V1BugGroup" style={this.offsetSub} visibility={this.visibilitySub}>
        <path class="NormalStroke Green" d="m83.065 361.5 h27.449" />
        <text class="FontLarge MiddleAlign Green" x="120" y="370">
          1
        </text>
      </g>
    );
  }
}

class VRBugElement extends DisplayComponent<{ bus: EventBus }> {
  private offsetSub = Subject.create('');

  private visibilitySub = Subject.create('hidden');

  private flightPhase = 0;

  private vrSpeed = 0;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const pf = this.props.bus.getSubscriber<HUDSimvars>();

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
    if (this.flightPhase <= 5 && this.vrSpeed !== 0) {
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
        class="NormalStroke Green"
        d="m107.745 361.5 a6.296 6.3 0 1 0 -12.592 0 6.296 6.3 0 1 0 12.592 0z"
      />
    );
  }
}

class VAlphaProtBar extends DisplayComponent<{
  readonly bus: ArincEventBus;
  readonly fcdcData: FcdcValueProvider;
}> {
  private VAprotIndicator = FSComponent.createRef<SVGPathElement>();

  private airSpeed = new Arinc429Word(0);

  private vAlphaProt = new Arinc429Word(0);

  private setAlphaProtBarPath() {
    const normalLawActive =
      this.props.fcdcData.fcdcDiscreteWord1.get().bitValueOr(11, false) ||
      this.props.fcdcData.fcdcDiscreteWord2.get().bitValueOr(11, false);
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

    this.props.fcdcData.fcdcDiscreteWord1.sub(() => {
      this.setAlphaProtBarPath();
    });
  }

  render(): VNode {
    return (
      <path
        id="VAlphaProtBarberpole"
        ref={this.VAprotIndicator}
        class="BarGreen"
        // eslint-disable-next-line max-len
        d="m87 762.001v-6.329h13.102v6.329zm13.102 -13.11v6.78m0 -19.89v6.78m-13.102 6.329v-6.329h13.102v6.329zm13.102 -26.219v6.78m-13.102 6.329v-6.329h13.102v6.329zm13.102 -26.219v6.78m-13.102 6.329v-6.329h13.102v6.329zm0 -45.657h13.102v6.329h-13.102zm13.102 19.439v6.78m-13.102 6.329v-6.329h13.102v6.329zm13.102 -26.219v6.78m-13.102 6.329v-6.329h13.102v6.329zm0 -26.219v-6.329h13.102v6.329zm13.102 0v6.78m0 -19.89v6.78m0 -19.89v6.78m-13.102 6.329v-6.329h13.102v6.329zm13.102 -26.219v6.78m-13.102 6.329v-6.329h13.102v6.329zm13.102 -26.219v6.78m-13.102 6.329v-6.329h13.102v6.329zm0 -45.657h13.102v6.329h-13.102zm13.102 19.439v6.78m-13.102 6.329v-6.329h13.102v6.329zm13.102 -26.219v6.78m-13.102 6.329v-6.329h13.102v6.329zm0 -26.219v-6.329h13.102v6.329zm13.102 0v6.78m0 -19.89v6.78m0 -19.89v6.78m-13.102 6.329v-6.329h13.102v6.329zm13.102 -26.219v6.78m-13.102 6.329v-6.329h13.102v6.329zm13.102 -26.219v6.78m-13.102 6.329v-6.329h13.102v6.329zm0 -45.657h13.102v6.329h-13.102zm13.102 19.439v6.78m-13.102 6.329v-6.329h13.102v6.329zm13.102 -26.219v6.78m-13.102 6.329v-6.329h13.102v6.329zm0 -26.219v-6.329h13.102v6.329zm13.102 0v6.78m0 -19.89v6.78m0 -19.89v6.78m-13.102 6.329v-6.329h13.102v6.329zm13.102 -26.219v6.78m-13.102 6.329v-6.329h13.102v6.329zm13.102 -26.219v6.78m-13.102 6.329v-6.329h13.102v6.329zm0 -45.657h13.102v6.329h-13.102zm13.102 19.439v6.78m-13.102 6.329v-6.329h13.102v6.329zm13.102 -26.219v6.78m-13.102 6.329v-6.329h13.102v6.329zm0 -26.219v-6.329h13.102v6.329zm13.102 0v6.78m0 -19.89v6.78m0 -19.89v6.78m-13.102 6.329v-6.329h13.102v6.329zm8.857 -19.439h4.246v6.329h-13.102v-6.329z"
      />
    );
  }
}

class FlapsSpeedPointBugs extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

  private greenDotBug = FSComponent.createRef<SVGGElement>();

  private flapsBug = FSComponent.createRef<SVGGElement>();

  private slatBug = FSComponent.createRef<SVGGElement>();

  private readonly shortTermManagedSpeedConsumer = ConsumerSubject.create(
    this.sub.on('shortTermManagedSpeed').whenChanged(),
    0,
  );

  private readonly leftMainGearCompressedConsumer = ConsumerSubject.create(
    this.sub.on('leftMainGearCompressed').whenChanged(),
    true,
  );

  private readonly rightMainGearCompressedConsumer = ConsumerSubject.create(
    this.sub.on('rightMainGearCompressed').whenChanged(),
    true,
  );

  private readonly airspeedRaw = ConsumerSubject.create(this.sub.on('speed').whenChanged(), null);

  private readonly airspeed = Arinc429RegisterSubject.createEmpty();

  private readonly shortTermManagedSpeedExists = MappedSubject.create(
    ([shortTermManagedSpeed, leftGearCompressed, rightGearCompressed]) =>
      shortTermManagedSpeed > 0 && (!leftGearCompressed || !rightGearCompressed),
    this.shortTermManagedSpeedConsumer,
    this.leftMainGearCompressedConsumer,
    this.rightMainGearCompressedConsumer,
  );

  private readonly shortTermVisibility = this.shortTermManagedSpeedExists.map((v) => (v ? 'visible' : 'hidden'));

  private readonly shortTermPath = MappedSubject.create(
    ([ias, shortTermSpeed]) => {
      if (ias.isNormalOperation() && shortTermSpeed) {
        const diff = Math.abs(ias.value - shortTermSpeed);
        if (diff < DisplayRange) {
          return `m93 361.5 a 6.296 6.3 0 1 0 -12.592 0 6.296 6.3 0 1 0 12.592 0z`;
        } else if (ias.value > shortTermSpeed) {
          return `m83.55 361.5 c 0.002 3.119 2.692 5.646 6.01 5.646 3.317 0 6.008 -2.527 6.01 -5.646h-6.01z`;
        } else {
          return `m83.55 361.5 c 0.002 3.372 2.806 6.103 6.265 6.103 3.458 0 6.262 -2.732 6.265 -6.103h-6.265z`;
        }
      } else {
        return '';
      }
    },
    this.airspeed,
    this.shortTermManagedSpeedConsumer,
  );

  private readonly shortTermStyle = MappedSubject.create(
    ([shortTermVisible, ias, shortTermManagedSpeed]) => {
      if (shortTermVisible && ias.isNormalOperation()) {
        return `transform: translate(0px, ${getSpeedTapeOffsetAlwaysVisible(ias.value, shortTermManagedSpeed)}px)`;
      }
      return '';
    },
    this.shortTermManagedSpeedExists,
    this.airspeed,
    this.shortTermManagedSpeedConsumer,
  );

  render(): VNode {
    return (
      <>
        <g id="ShortTermManagedSpeed" visibility={this.shortTermVisibility} style={this.shortTermStyle}>
          <path class="Fill Green" d={this.shortTermPath} />
        </g>
        <g id="GreenDotSpeedMarker" ref={this.greenDotBug} style="transform:translate3d(0px, 0px,0px)">
          <path class="ThickOutline" d="m93.5 361.5 a6.296 6.3 0 1 0 -12.592 0 6.296 6.3 0 1 0 12.592 0z" />
          <path class="ThickStroke Green" d="m93.5 361.5 a6.296 6.3 0 1 0 -12.592 0 6.296 6.3 0 1 0 12.592 0z" />
        </g>
        <g id="FlapsSlatsBug" ref={this.flapsBug} style="transform: translate3d(0px, 0px,0px)">
          <path class="NormalStroke Green" d="m87 361.5  h19.14" />
          <text class="FontLarge MiddleAlign Green" x="130" y="373">
            F
          </text>
        </g>
        <g id="FlapsSlatsBug" ref={this.slatBug} style="transform: translate3d(0px, 0px,0px)">
          <path class="NormalStroke Green" d="m87 361.5  h19.14" />
          <text class="FontLarge MiddleAlign Green" x="130" y="373">
            S
          </text>
        </g>
      </>
    );
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.airspeedRaw.sub((w) => this.airspeed.setWord(w));

    this.sub
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
    this.sub
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
    this.sub
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
const getSpeedTapeOffsetAlwaysVisible = (currentSpeed: number, bugSpeed: number) => {
  const diff = Math.abs(currentSpeed - bugSpeed);
  if (diff < DisplayRange) {
    return getSpeedTapeOffset(bugSpeed);
  } else {
    return getSpeedTapeOffset(currentSpeed > bugSpeed ? currentSpeed - DisplayRange : currentSpeed + DisplayRange); // speed always visible on tape
  }
};

export class AirspeedIndicatorOfftape extends DisplayComponent<{ bus: ArincEventBus }> {
  private spdTape = '';
  private xWindSpdTape = '';
  private xWindSpdTapeRef = FSComponent.createRef<SVGGElement>();
  private spdTapeRef = FSComponent.createRef<SVGGElement>();

  private flightPhase = -1;
  private declutterMode = 0;
  private crosswindMode = false;
  private bitMask = 0;
  private athMode = 0;
  private onToPower = false;
  private onPower = false;
  private finalGnd = false;
  private sCrosswindModeOn = Subject.create<String>('');
  private sCrosswindModeOff = Subject.create<String>('');
  private decelRef = FSComponent.createRef<SVGTextElement>();
  private decelXwndRef = FSComponent.createRef<SVGTextElement>();
  private spdLimFlagRef = FSComponent.createRef<SVGTextElement>();
  private spdLimFlagXwndRef = FSComponent.createRef<SVGTextElement>();
  private lowerRef = FSComponent.createRef<SVGGElement>();

  private offTapeRef = FSComponent.createRef<SVGGElement>();
  private offTapeRefCw = FSComponent.createRef<SVGGElement>();

  private offTapeFailedRef = FSComponent.createRef<SVGGElement>();

  private onGround = true;

  private leftMainGearCompressed = true;

  private rightMainGearCompressed = true;
  private cwSpdLinesRef = FSComponent.createRef<SVGGElement>();
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & HudElems>();

    sub
      .on('spdTape')
      .whenChanged()
      .handle((v) => {
        this.spdTape = v;
        this.spdTapeRef.instance.style.display = `${this.spdTape}`;
      });
    sub
      .on('xWindSpdTape')
      .whenChanged()
      .handle((v) => {
        this.xWindSpdTape = v;
        this.xWindSpdTapeRef.instance.style.display = `${this.xWindSpdTape}`;
      });

    sub
      .on('AThrMode')
      .whenChanged()
      .handle((value) => {
        this.athMode = value;
        this.athMode == AutoThrustMode.MAN_FLEX ||
        this.athMode == AutoThrustMode.MAN_TOGA ||
        this.athMode == AutoThrustMode.TOGA_LK
          ? (this.onToPower = true)
          : (this.onToPower = false);
      });

    sub
      .on('decMode')
      .whenChanged()
      .handle((value) => {
        this.declutterMode = value;
      });
    sub
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
        this.cwSpdLinesRef.instance.style.transform = `translate3d(0px, ${-XWIND_FULL_OFFSET + XWIND_TO_AIR_REF_OFFSET}px, 0px)`;
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

    sub.on('speedAr').handle((speed) => {
      let airspeedValue: number;
      if (speed.isFailureWarning() || (speed.isNoComputedData() && !this.onGround)) {
        airspeedValue = NaN;
      } else if (speed.isNoComputedData()) {
        airspeedValue = 30;
      } else {
        airspeedValue = speed.value;
      }
      if (Number.isNaN(airspeedValue)) {
        this.offTapeRefCw.instance.classList.add('HiddenElement');
        this.offTapeRef.instance.classList.add('HiddenElement');
        this.offTapeFailedRef.instance.classList.remove('HiddenElement');
      } else {
        this.offTapeRefCw.instance.classList.remove('HiddenElement');
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
  }

  render(): VNode {
    return (
      <>
        <g id="offTapeSpeedGroup">
          <g id="crosswind" class="cwTest" ref={this.xWindSpdTapeRef}>
            <g id="SpeedOfftapeGroup" transform=" translate(95 159)" ref={this.offTapeRefCw}>
              <g ref={this.cwSpdLinesRef}>
                <path id="SpeedTapeOutlineRight" class="NormalStroke Green" d="m87 -40 v 182"></path>
                <path id="SpeedTapeOutlineUpper" class="NormalStroke Green" d="m16 -40 h 98"></path>
                <path id="SpeedTapeOutlineLower" class="NormalStroke Green" d="m16 142 h 98"></path>
                <path class="Fill Green SmallOutline" d="m 62 49 v 4 h 28 l 15.614 5.745 v -15.119 l -15.614 5.745z" />
              </g>

              <SpeedTarget bus={this.props.bus} mode={WindMode.CrossWind} />

              <CrosswindDigitalSpeedReadout bus={this.props.bus} />
            </g>
          </g>
          <g id="normal" ref={this.spdTapeRef}>
            <g id="SpeedOfftapeGroup" transform=" translate(95 159)" ref={this.offTapeRef}>
              <g id="OfftapeFailedGroup" ref={this.offTapeFailedRef}>
                <path id="SpeedTapeOutlineRight" class="NormalStroke Green" d="m87 170 v 383" />
                <path id="SpeedTapeOutlineUpper" class="NormalStroke Green" d="m16 170 h 98" />
                <path id="SpeedTapeOutlineLower" class="NormalStroke Green" d="m16 553 h 98" />
              </g>

              <path id="SpeedTapeOutlineRight" class="NormalStroke Green" d="m87 170 v 383" />
              <path id="SpeedTapeOutlineUpper" class="NormalStroke Green" d="m16 170 h 98" />
              <SpeedTarget bus={this.props.bus} mode={WindMode.Normal} />
              <text id="AutoBrkDecel" ref={this.decelRef} class="FontMedium EndAlign Green" x="91.9425" y="578.565">
                DECEL
              </text>
              <path
                class="Fill Green SmallOutline"
                d="m62.763 360.863v3.254h29.367l14.006 5.153v-13.562l-14.006 5.153z"
              />
              <path class="Fill Green SmallOutline" d="m0.415 364.115v-3.254h9.035v3.254z" />
              <path id="SpeedTapeOutlineLower" ref={this.lowerRef} class="NormalStroke Green" d="m16  553 h 98" />
            </g>
          </g>
        </g>
      </>
    );
  }
}

class VMaxBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private VMaxIndicator = FSComponent.createRef<SVGPathElement>();

  private airSpeed = new Arinc429Word(0);

  private vMax = new Arinc429Word(0);

  private staticPressure = new Arinc429Word(0);

  private setVMaxBarPath() {
    const vMax = this.vMax.isNormalOperation() ? this.vMax.value : this.computeFallbackVMax();

    if (this.airSpeed.value - vMax < -DisplayRange) {
      this.VMaxIndicator.instance.style.visibility = 'hidden';
    } else {
      this.VMaxIndicator.instance.style.visibility = 'visible';

      const delta = Math.min(this.airSpeed.value - vMax, DisplayRange);
      const offset = (delta * DistanceSpacing) / ValueSpacing;

      this.VMaxIndicator.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
    }
  }

  private computeFallbackVMax() {
    return Math.min(
      VMO,
      this.staticPressure.isNormalOperation() ? computeCasFromMach(MMO, this.staticPressure.value) : Infinity,
    );
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

    sub
      .on('staticPressure')
      .withArinc429Precision(2)
      .handle((p) => {
        this.staticPressure = p;
      });
  }

  render(): VNode {
    return (
      <path
        id="OverspeedBarberpole"
        ref={this.VMaxIndicator}
        class="BarGreen"
        // eslint-disable-next-line max-len
        d="m98.908 -10.158v-11.753m-13.554 -10.849v10.849h13.554v-10.849zm13.554 45.204v-11.753m0 34.357v-11.753m0 34.357v-11.753m0 34.357v-11.753m0 -56.054h-13.554v10.849h13.554zm0 56.054v-10.849h-13.554v10.849zm0 -33.453v10.849h-13.554v-10.849zm-13.554 -45.204v10.849h13.554v-10.849zm13.554 113.013v-11.753m0 34.357v-11.753m0 34.357v-11.753m0 34.357v-11.753m0 -56.054h-13.554v10.849h13.554zm0 56.054v-10.849h-13.554v10.849zm0 -33.453v10.849h-13.554v-10.849zm-13.554 -45.204v10.849h13.554v-10.849zm13.554 113.013v-11.753m0 34.357v-11.753m0 34.357v-11.753m0 34.357v-11.753m0 -56.054h-13.554v10.849h13.554zm0 56.054v-10.849h-13.554v10.849zm0 -33.453v10.849h-13.554v-10.849zm-13.554 -45.204v10.849h13.554v-10.849zm13.554 113.013v-11.753m0 34.357v-11.753m0 34.357v-11.753m0 34.357v-11.753m-13.554 22.603h13.554v-10.849h-13.554zm13.554 -78.658h-13.554v10.849h13.554zm0 56.054v-10.849h-13.554v10.849zm0 -33.453v10.849h-13.554v-10.849zm-13.554 -45.204v10.849h13.554v-10.849z"
      />
    );
  }
}

class VStallWarnBar extends DisplayComponent<{
  readonly bus: ArincEventBus;
  readonly fcdcData: FcdcValueProvider;
}> {
  private VStallWarnIndicator = FSComponent.createRef<SVGPathElement>();

  private airSpeed = new Arinc429Word(0);

  private vStallWarn = new Arinc429Word(0);

  private setVStallWarnBarPath() {
    const normalLawActive =
      this.props.fcdcData.fcdcDiscreteWord1.get().bitValueOr(11, false) ||
      this.props.fcdcData.fcdcDiscreteWord2.get().bitValueOr(11, false);
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

    this.props.fcdcData.fcdcDiscreteWord2.sub(() => {
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
        d="m98.908 384.97v-11.753m-13.554 -10.849v10.849h13.554v-10.849zm13.554 45.204v-11.753m0 34.357v-11.753m0 34.357v-11.753m0 34.357v-11.753m0 -56.054h-13.554v10.849h13.554zm0 56.054v-10.849h-13.554v10.849zm0 -33.453v10.849h-13.554v-10.849zm-13.554 -45.204v10.849h13.554v-10.849zm13.554 113.013v-11.753m0 34.357v-11.753m0 34.357v-11.753m0 34.357v-11.753m0 -56.054h-13.554v10.849h13.554zm0 56.054v-10.849h-13.554v10.849zm0 -33.453v10.849h-13.554v-10.849zm-13.554 -45.204v10.849h13.554v-10.849zm13.554 113.013v-11.753m0 34.357v-11.753m0 34.357v-11.753m0 34.357v-11.753m0 -56.054h-13.554v10.849h13.554zm0 56.054v-10.849h-13.554v10.849zm0 -33.453v10.849h-13.554v-10.849zm-13.554 -45.204v10.849h13.554v-10.849zm13.554 113.013v-11.753m0 34.357v-11.753m0 34.357v-11.753m0 34.357v-11.753m-13.554 22.603h13.554v-10.849h-13.554zm13.554 -78.658h-13.554v10.849h13.554zm0 56.054v-10.849h-13.554v10.849zm0 -33.453v10.849h-13.554v-10.849zm-13.554 -45.204v10.849h13.554v-10.849z"
      />
    );
  }
}

interface AirspeedIndicatorProps {
  readonly bus: ArincEventBus;
  readonly instrument: BaseInstrument;
  readonly fcdcData: FcdcValueProvider;
}

export class AirspeedIndicator extends DisplayComponent<AirspeedIndicatorProps> {
  private crosswindMode = false;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<EventBus & HUDSimvars & Arinc429Values & ClockEvents & HudElems>();
    sub
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
        this.crosswindMode ? (DisplayRange = 20) : (DisplayRange = 42);
      });
  }

  render(): VNode {
    return (
      <>
        <AirspeedIndicatorBase bus={this.props.bus} instrument={this.props.instrument} fcdcData={this.props.fcdcData} />
      </>
    );
  }
}

class SpeedTrendArrow extends DisplayComponent<{
  airspeed: Subscribable<number>;
  instrument: BaseInstrument;
  bus: EventBus;
  valueSpacing: number;
  distanceSpacing: number;
}> {
  private refElement = FSComponent.createRef<SVGGElement>();

  private arrowBaseRef = FSComponent.createRef<SVGPathElement>();

  private arrowHeadRef = FSComponent.createRef<SVGPathElement>();

  private offset = Subject.create<string>('');

  private pathString = Subject.create<string>('');

  private lagFilter = new LagFilter(1.6);

  private airspeedAccRateLimiter = new RateLimiter(1.2, -1.2);

  private previousAirspeed = 0;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ClockEvents>();

    sub.on('realTime').handle((_t) => {
      const { deltaTime } = this.props.instrument;
      const clamped = Math.max(this.props.airspeed.get(), 30);
      const airspeedAcc = ((clamped - this.previousAirspeed) / deltaTime) * 1000;
      this.previousAirspeed = clamped;

      let filteredAirspeedAcc = this.lagFilter.step(airspeedAcc, deltaTime / 1000);
      filteredAirspeedAcc = this.airspeedAccRateLimiter.step(filteredAirspeedAcc, deltaTime / 1000);

      const targetSpeed = filteredAirspeedAcc * 10;

      if (Math.abs(targetSpeed) < 1) {
        this.refElement.instance.style.visibility = 'hidden';
      } else {
        this.refElement.instance.style.visibility = 'visible';
        let pathString;
        const sign = Math.sign(filteredAirspeedAcc);

        const offset = (-targetSpeed * DistanceSpacing) / ValueSpacing;
        if (sign > 0) {
          pathString = `m 71.76 ${neutralPos + offset} l -5.606 13.455 M 71.76 ${neutralPos + offset} l 5.606 13.455`;
        } else {
          pathString = `m 71.76 ${neutralPos + offset} l 5.606 -13.455 M 71.76 ${neutralPos + offset} l -5.606 -13.455`;
        }

        this.offset.set(`m 71.76 ${neutralPos} v${offset.toFixed(10)}`);

        this.pathString.set(pathString);
      }
    });
  }

  render(): VNode | null {
    return (
      <g id="SpeedTrendArrow" ref={this.refElement}>
        <path id="SpeedTrendArrowBase" ref={this.arrowBaseRef} class="NormalStroke Green" d={this.offset} />
        <path id="SpeedTrendArrowHead" ref={this.arrowHeadRef} class="NormalStroke Green" d={this.pathString} />
      </g>
    );
  }
}

class VLsBar extends DisplayComponent<{ readonly bus: ArincEventBus; readonly fcdcData: FcdcValueProvider }> {
  private vlsPath = Subject.create<string>('');

  private vlsVisbility = Subject.create<string>('hidden');

  private vAlphaProt = new Arinc429Word(0);

  private vStallWarn = new Arinc429Word(0);

  private airSpeed = new Arinc429Word(0);

  private vls = new Arinc429Word(0);

  private setVlsPath() {
    if (this.vls.isNormalOperation()) {
      this.vlsVisbility.set('visible');

      const normalLawActive = this.props.fcdcData.fcdcDiscreteWord1.get().bitValueOr(11, false);

      const VLsPos = ((this.airSpeed.value - this.vls.value) * DistanceSpacing) / ValueSpacing + neutralPos;
      const offset =
        ((this.vls.value - (normalLawActive ? this.vAlphaProt.valueOr(0) : this.vStallWarn.valueOr(0))) *
          DistanceSpacing) /
        ValueSpacing;

      this.vlsPath.set(`m 86 ${VLsPos}h 10 v${offset + 1}`);
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

    this.props.fcdcData.fcdcDiscreteWord1.sub(() => this.setVlsPath());
  }

  render(): VNode {
    return <path id="VLsIndicator" class="NormalStroke Green" d={this.vlsPath} visibility={this.vlsVisbility} />;
  }
}

class VAlphaLimBar extends DisplayComponent<{
  readonly bus: ArincEventBus;
  readonly fcdcData: FcdcValueProvider;
}> {
  private VAlimIndicator = FSComponent.createRef<SVGPathElement>();

  private airSpeed = new Arinc429Word(0);

  private vAlphaLim = new Arinc429Word(0);

  private setAlphaLimBarPath() {
    const normalLawActive = this.props.fcdcData.fcdcDiscreteWord1.get().bitValueOr(11, false);
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

      this.VAlimIndicator.instance.setAttribute('d', `m 87 556 h 16 v ${offset} h -16 z`);
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

    this.props.fcdcData.fcdcDiscreteWord1.sub(() => this.setAlphaLimBarPath());
  }

  render(): VNode {
    return <path ref={this.VAlimIndicator} id="VAlimIndicator" class="Fill Green" />;
  }
}

class V1Offtape extends DisplayComponent<{ bus: EventBus }> {
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
        if (p <= 5) {
          this.v1TextRef.instance.style.visibility = 'visible';
        } else {
          this.v1TextRef.instance.style.visibility = 'hidden';
        }
      });
  }

  render() {
    return (
      <text ref={this.v1TextRef} id="V1SpeedText" class="FontTiny Green" x="89.7" y="188.37">
        0
      </text>
    );
  }
}

class ArsBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getArincSubscriber<HUDSimvars & SfccEvents>();
  private static readonly ARS_1F_F_SPEED = 212;
  private static readonly CONF_1_F_VFE = 222;
  private readonly size = ((ArsBar.ARS_1F_F_SPEED - ArsBar.CONF_1_F_VFE) * DistanceSpacing) / ValueSpacing;
  private readonly path = `m85.215 0h8.835v${this.size}`;

  //FIXME PRIM Should provide the ARS speed. All this logic should be moved there
  private readonly flapSlatsStatusWord = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('slat_flap_system_status_word_1'),
    undefined,
  );
  private readonly flapLever1 = this.flapSlatsStatusWord.map((w) => w.bitValueOr(18, false) && !w.bitValue(26));
  private readonly flapsSlatActualPosition = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('slat_flap_actual_position_word_1'),
    undefined,
  );

  private readonly config1F = this.flapsSlatActualPosition.map((w) => {
    // Slats valid and in 1
    return (
      w.bitValueOr(11, false) &&
      w.bitValue(13) &&
      !w.bitValue(14) &&
      !w.bitValue(15) &&
      // Flaps valid and in 1
      w.bitValue(18) &&
      w.bitValue(20) &&
      !w.bitValue(21) &&
      !w.bitValue(22) &&
      // flap not fault and not jammed
      !w.bitValue(29) &&
      !w.bitValue(25)
    );
  });

  private readonly airspeed = Arinc429LocalVarConsumerSubject.create(this.sub.on('speed'), undefined);

  private readonly arsVisible = MappedSubject.create(
    ([flapLever1, config1F, airspeed]) => !airspeed.isInvalid() && flapLever1 && config1F,
    this.flapLever1,
    this.config1F,
    this.airspeed,
  );

  private readonly arsStyle = MappedSubject.create(
    ([visible, ias]) => {
      return visible
        ? `transform: translate3d(0px, ${((ias.value - ArsBar.ARS_1F_F_SPEED) * DistanceSpacing) / ValueSpacing + 363.7}px, 0px )`
        : '';
    },
    this.arsVisible,
    this.airspeed,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.config1F.sub((v) => {
      if (!v) {
        this.airspeed.pause();
      } else {
        this.airspeed.resume();
      }
    });
  }

  render(): VNode {
    return (
      <path
        id="ArsIndicator"
        class={{
          NormalStroke: true,
          Green: true,
          HiddenElement: this.arsVisible.map(SubscribableMapFunctions.not()),
        }}
        d={this.path}
        style={this.arsStyle}
      />
    );
  }
}

interface SpeedStateInfo {
  targetSpeed: number;
  managedTargetSpeed: number;
  holdValue: number;
  isSpeedManaged: boolean;
  isMach: boolean;
  speed: Arinc429Word;
}

class SpeedTarget extends DisplayComponent<{ bus: ArincEventBus; mode: WindMode }> {
  private xwindOffset = 0;

  private BoundBgRef = FSComponent.createRef<SVGPathElement>();
  private upperBoundRef = FSComponent.createRef<SVGTextElement>();

  private lowerBoundRef = FSComponent.createRef<SVGTextElement>();
  private speedTargetRef = FSComponent.createRef<SVGPathElement>();

  private currentVisible: NodeReference<SVGElement> = this.upperBoundRef;

  private textSub = Subject.create('0');

  private decelActive = false;

  private needsUpdate = true;
  private crosswindMode = false;
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
      this.currentVisible.instance.classList.replace('Green', 'Green');
      const text = Math.round(this.speedState.managedTargetSpeed).toString().padStart(3, '0');
      this.textSub.set(text);
    } else {
      this.currentVisible.instance.classList.replace('Green', 'Green');
      const text = Math.round(this.speedState.managedTargetSpeed).toString().padStart(3, '0');
      this.textSub.set(text);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.needsUpdate = true;

    const sub = this.props.bus.getArincSubscriber<
      HUDSimvars & SimplaneValues & ClockEvents & Arinc429Values & HudElems
    >();

    sub
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
        this.handleCrosswinMode();
      });
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
            ValueSpacing +
          this.xwindOffset;
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
    if (this.speedState.isSpeedManaged) {
      this.speedTargetRef.instance.classList.add('GreenFill2');
    } else {
      this.speedTargetRef.instance.classList.remove('GreenFill2');
    }
  }

  private determineTargetSpeed() {
    const isSelected = !this.speedState.isSpeedManaged;
    if (isSelected) {
      if (this.speedState.isMach) {
        const { holdValue } = this.speedState;
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
    this.handleCrosswinMode();
    const currentTargetSpeed = this.speedState.isSpeedManaged
      ? this.speedState.managedTargetSpeed
      : this.speedState.targetSpeed;
    if (this.speedState.speed.value - currentTargetSpeed > DisplayRange) {
      this.upperBoundRef.instance.style.visibility = 'visible';
      this.lowerBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
      this.BoundBgRef.instance.style.transform = `translate3d(0px, ${this.xwindOffset + (DisplayRange / ValueSpacing) * DistanceSpacing + 15}px, 0px)`;
      this.currentVisible = this.upperBoundRef;
    } else if (this.speedState.speed.value - currentTargetSpeed < -DisplayRange && !this.decelActive) {
      this.lowerBoundRef.instance.style.visibility = 'visible';
      this.upperBoundRef.instance.style.visibility = 'hidden';
      this.speedTargetRef.instance.style.visibility = 'hidden';
      this.BoundBgRef.instance.style.transform = `translate3d(0px, ${this.xwindOffset - (DisplayRange / ValueSpacing) * DistanceSpacing - 15}px, 0px)`;
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

    if (inRange) {
      this.BoundBgRef.instance.style.visibility = 'hidden';
    } else {
      if (this.speedState.isSpeedManaged) {
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
    if (this.props.mode === WindMode.Normal) {
      this.xwindOffset = 0;
      this.upperBoundRef.instance.setAttribute('y', '578');
      this.lowerBoundRef.instance.setAttribute('y', '166');
    } else {
      this.xwindOffset = XWIND_TO_AIR_REF_OFFSET;
      this.upperBoundRef.instance.setAttribute('y', `${165 - XWIND_FULL_OFFSET + XWIND_TO_AIR_REF_OFFSET}`);
      this.lowerBoundRef.instance.setAttribute('y', `${-45 - XWIND_FULL_OFFSET + XWIND_TO_AIR_REF_OFFSET}`);
    }
  }

  render(): VNode {
    return (
      <>
        <path ref={this.BoundBgRef} id="SpeedTargetBackground" class="GreenFill" d="m70.5 348.5 h45v27h-45z"></path>
        <text
          ref={this.upperBoundRef}
          id="SelectedSpeedUpperText"
          class="FontSmallest MiddleAlign Green"
          x="94"
          y="578"
        >
          {this.textSub}
        </text>
        <text
          ref={this.lowerBoundRef}
          id="SelectedSpeedLowerText"
          class="FontSmallest MiddleAlign InverseGreen"
          x="94"
          y="166"
        >
          {this.textSub}
        </text>
        <path
          id="speedTarget"
          ref={this.speedTargetRef}
          class="NormalStroke CornerRound Green"
          style="transform: translate3d(0px, 0px, 0px)"
          d="m86.444 367.299 24.03 8.751v-27.123l-24.03 8.751z"
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
  private xwindOffset = 0;
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const sub = this.props.bus.getArincSubscriber<Arinc429Values & FmsVars & HudElems>();

    sub
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        value === true ? (this.xwindOffset = XWIND_TO_AIR_REF_OFFSET) : (this.xwindOffset = 0);
      });

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
          class="Fill Green"
          d="m89 359.5 h 26 v 6 h -26z"
          visibility={this.upperSpeedMarginVisibility}
          transform={this.upperMarginTransform}
        />
        <path
          id="LowerSpeedMargin"
          class="Fill Green"
          d="m89 359.5 h 26 v 6 h -26z"
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
          Math.round((100 * (this.currentSpeed.get().value - speed) * DistanceSpacing) / ValueSpacing) / 100 +
          this.xwindOffset
        ).toFixed(2);
        transform.set(`translate(0 ${offset})`);
      }

      if (isInRange !== marginIsVisible) {
        visibility.set(isInRange ? 'visible' : 'hidden');
      }
    };
  }
}

export class MachNumber extends DisplayComponent<{ bus: EventBus }> {
  private machTextSub = Subject.create('');

  private failedRef = FSComponent.createRef<SVGTextElement>();

  private showMach = false;

  private decMode = 0;

  private onGround = false;

  private leftMainGearCompressed = true;

  private rightMainGearCompressed = true;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & HUDSimvars & HudElems>();
    sub
      .on('decMode')
      .whenChanged()
      .handle((value) => {
        this.decMode = value;
      });
    sub.on('machAr').handle((mach) => {
      if (!mach.isNormalOperation() && !this.onGround) {
        this.machTextSub.set('');
        this.failedRef.instance.style.display = 'inline';
        return;
      }
      this.failedRef.instance.style.display = 'none';
      const machPermille = Math.round(mach.valueOr(0) * 1000);
      if (this.decMode !== 2) {
        if (this.showMach && machPermille < 450) {
          this.showMach = false;
          this.machTextSub.set('');
        } else if (!this.showMach && machPermille > 500) {
          this.showMach = true;
        }
      } else {
        this.showMach = false;
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
          class="Blink9Seconds FontLargest StartAlign Green"
          x="5.4257932"
          y="136.88908"
        >
          MACH
        </text>
        <text id="CurrentMachText" class="FontLarge StartAlign Green" x="150" y="770">
          {this.machTextSub}
        </text>
      </>
    );
  }
}

class VProtBug extends DisplayComponent<{ readonly bus: EventBus; readonly fcdcData: FcdcValueProvider }> {
  private vProtBug = FSComponent.createRef<SVGGElement>();

  private fcdcWord1 = new Arinc429Word(0);

  private Vmax = new Arinc429Word(0);

  private handleVProtBugDisplay() {
    const showVProt = this.Vmax.value > 240 && this.Vmax.isNormalOperation();
    const offset = (-(this.Vmax.value + 10) * DistanceSpacing) / ValueSpacing;

    const isNormalLawActive =
      this.props.fcdcData.fcdcDiscreteWord1.get().bitValue(11) &&
      !this.props.fcdcData.fcdcDiscreteWord1.get().isFailureWarning();

    if (showVProt && isNormalLawActive) {
      this.vProtBug.instance.style.display = 'block';
      this.vProtBug.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
    } else {
      this.vProtBug.instance.style.display = 'none';
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values>();

    sub
      .on('vMax')
      .whenChanged()
      .handle((vm) => {
        this.Vmax = vm;

        this.handleVProtBugDisplay();
      });

    this.props.fcdcData.fcdcDiscreteWord1.sub(() => this.handleVProtBugDisplay());
  }

  render(): VNode {
    return (
      <g id="SpeedProtSymbol" ref={this.vProtBug} style="display: none">
        <path class="NormalOutline" d="m60 365 h 15 m-15.11 -5 h 15" />
        <path class="NormalStroke Green" d="m60 365 h 15 m-15.11 -5 h 15" />
      </g>
    );
  }
}

//GroundSpeed indicator
interface GroundSpeedIndicatorData {
  readonly hudMode: Subscribable<number>;
}

class GroundSpeedIndicator extends DisplayComponent<{ bus: EventBus }> {
  private flightPhase = -1;
  private declutterMode = 0;
  private sVisibility = Subject.create('none');
  private readonly groundSpeedRef = FSComponent.createRef<SVGTextElement>();

  private readonly trueAirSpeedRef = FSComponent.createRef<SVGTextElement>();

  private readonly groundSpeedRegister = Arinc429RegisterSubject.createEmpty();

  private readonly trueAirSpeedRegister = Arinc429RegisterSubject.createEmpty();

  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

  private readonly data: GroundSpeedIndicatorData = {
    hudMode: ConsumerSubject.create(this.sub.on('hudFlightPhaseMode'), 0),
  };

  private readonly gsVisibility = MappedSubject.create(([hudMode]) => {
    if (hudMode !== 0) {
      return 'block';
    } else {
      return 'none';
    }
  }, this.data.hudMode);

  onAfterRender(node: VNode) {
    super.onAfterRender(node);
    this.sub
      .on('groundSpeed')
      .atFrequency(2)
      .handle((value) => this.groundSpeedRegister.setWord(value));
    this.groundSpeedRegister.sub((data) => {
      const element = this.groundSpeedRef.instance;

      element.textContent = data.isNormalOperation() ? Math.round(data.value).toString() : '';

      data.value < 250
        ? (this.groundSpeedRef.instance.style.display = 'block')
        : (this.groundSpeedRef.instance.style.display = 'none');
    }, true);
  }

  render(): VNode | null {
    return (
      <g id="GndSpdGroup" display={this.gsVisibility}>
        <Layer x={2} y={25}>
          <text ref={this.groundSpeedRef} x={20} y={0} class="Green FontMediumSmaller">
            GS
          </text>
          <text ref={this.groundSpeedRef} x={100} y={0} class="Green FontMediumSmaller EndAlign" />
        </Layer>
      </g>
    );
  }
}

function computeCasFromMach(mach: number, staticPressure: number) {
  return 1479.1 * Math.sqrt(((staticPressure / 1013.25) * ((0.2 * mach ** 2 + 1) ** 3.5 - 1) + 1) ** (1 / 3.5) - 1);
}
