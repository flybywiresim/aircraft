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
  Arinc429ConsumerSubject,
  Arinc429LocalVarConsumerSubject,
  Arinc429RegisterSubject,
  Arinc429Word,
  Arinc429WordData,
  ArincEventBus,
} from '@flybywiresim/fbw-sdk';
import { FmsVars } from '../MsfsAvionicsCommon/providers/FmsDataPublisher';
import { HudMode, RateLimiter, XWIND_FULL_OFFSET, XWIND_TO_AIR_REF_OFFSET } from './HUDUtils';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { VerticalTape } from './VerticalTape';
import { WindMode, HudElems } from './HUDUtils';
import { CrosswindDigitalSpeedReadout } from './CrosswindDigitalSpeedReadout';
import { Layer } from '../MsfsAvionicsCommon/Layer';
import { Arinc429Values } from './shared/ArincValueProvider';
import { SfccEvents } from '../MsfsAvionicsCommon/providers/SfccPublisher';
import { PrimFeBusBaseEvents } from '@shared/publishers/PrimFePublisher';
import { FlashOneHertz } from '../MsfsAvionicsCommon/FlashingElementUtils';
import { PrimFgBusBaseEvents } from '@shared/publishers/PrimFgPublisher';
import { FcdcBusEvents } from '@shared/publishers/FcdcPublisher';

const ValueSpacing = 10;
const DistanceSpacing = 45.6;
let DisplayRange = 42;
const neutralPos = 361.5;

const VMO = 340;
const MMO = 0.89;

class AirspeedIndicatorBase extends DisplayComponent<AirspeedIndicatorProps> {
  private readonly sub = this.props.bus.getArincSubscriber<PrimFeBusBaseEvents>();

  private readonly vFeNextValue = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_v_fe_next'));

  private groundSpeedRef = FSComponent.createRef<SVGGElement>();

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

    sub;
    this.vFeNextValue.sub((vfe) => {
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
    }, true);

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

              <g id="CrosswindVerticalTape" ref={this.cwOffsetRef} transform="translate(0 -192)">
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
    if (this.flightPhase <= 5 && this.v1Speed > 0) {
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
    if (this.flightPhase <= 5 && this.vrSpeed > 0) {
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
}> {
  private readonly sub = this.props.bus.getSubscriber<PrimFeBusBaseEvents>();

  private VAprotIndicator = FSComponent.createRef<SVGPathElement>();

  private airSpeed = new Arinc429Word(0);

  private vAlphaProt = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_v_alpha_prot'));

  private setAlphaProtBarPath() {
    if (
      this.airSpeed.value - this.vAlphaProt.get().value > DisplayRange ||
      this.vAlphaProt.get().isFailureWarning() ||
      this.vAlphaProt.get().isNoComputedData()
    ) {
      this.VAprotIndicator.instance.style.visibility = 'hidden';
    } else {
      this.VAprotIndicator.instance.style.visibility = 'visible';

      const delta = Math.max(this.airSpeed.value - this.vAlphaProt.get().value, -DisplayRange);
      const offset = (delta * DistanceSpacing) / ValueSpacing;

      this.VAprotIndicator.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<PrimFeBusBaseEvents & Arinc429Values>();

    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((s) => {
        this.airSpeed = s;
        this.setAlphaProtBarPath();
      });

    this.vAlphaProt.sub(() => {
      this.setAlphaProtBarPath();
    }, true);
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
  private readonly sub = this.props.bus.getArincSubscriber<
    HUDSimvars & Arinc429Values & PrimFeBusBaseEvents & PrimFgBusBaseEvents
  >();

  private greenDotBug = FSComponent.createRef<SVGGElement>();

  private flapsBug = FSComponent.createRef<SVGGElement>();

  private slatBug = FSComponent.createRef<SVGGElement>();

  private readonly vMan = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_v_man'));

  private readonly v3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_v_3'));

  private readonly v4 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_v_4'));

  private readonly shortTermManagedSpeed = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('prim_pfd_short_term_managed_speed').whenChanged(),
  );
  private readonly pfdTargetSpeed = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_pfd_speed_target'));

  private readonly airspeedRaw = ConsumerSubject.create(this.sub.on('speed').whenChanged(), null);

  private readonly airspeed = Arinc429RegisterSubject.createEmpty();

  private readonly selectedSpeedActive = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('prim_fg_discrete_word_5'),
  ).map((v) => !v.isInvalid() && v.bitValue(18));

  private readonly shortTermManagedSpeedVisible = MappedSubject.create(
    ([shortTermManagedSpeed, pfdTargetSpeed, selectedSpeed]) =>
      !shortTermManagedSpeed.isInvalid() &&
      !pfdTargetSpeed.isInvalid() &&
      (selectedSpeed || Math.abs(shortTermManagedSpeed.value - pfdTargetSpeed.value) > 2),
    this.shortTermManagedSpeed,
    this.pfdTargetSpeed,
    this.selectedSpeedActive,
  );

  private readonly shortTermVisibility = this.shortTermManagedSpeedVisible.map((v) => (v ? 'visible' : 'hidden'));

  private readonly shortTermPath = MappedSubject.create(
    ([ias, shortTermSpeed]) => {
      if (ias.isNormalOperation() && shortTermSpeed) {
        const diff = Math.abs(ias.value - shortTermSpeed.value);
        if (diff < DisplayRange) {
          return `m93 361.5 a 6.296 6.3 0 1 0 -12.592 0 6.296 6.3 0 1 0 12.592 0z`;
        } else if (ias.value > shortTermSpeed.value) {
          return `m83.55 361.5 c 0.002 3.119 2.692 5.646 6.01 5.646 3.317 0 6.008 -2.527 6.01 -5.646h-6.01z`;
        } else {
          return `m83.55 361.5 c 0.002 3.372 2.806 6.103 6.265 6.103 3.458 0 6.262 -2.732 6.265 -6.103h-6.265z`;
        }
      } else {
        return '';
      }
    },
    this.airspeed,
    this.shortTermManagedSpeed,
  );

  private readonly shortTermStyle = MappedSubject.create(
    ([shortTermVisible, ias, shortTermManagedSpeed]) => {
      if (shortTermVisible && ias.isNormalOperation()) {
        return `transform: translate(0px, ${getSpeedTapeOffsetAlwaysVisible(ias.value, shortTermManagedSpeed.value)}px)`;
      }
      return '';
    },
    this.shortTermManagedSpeedVisible,
    this.airspeed,
    this.shortTermManagedSpeed,
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

    this.vMan.sub((gd) => {
      if (gd.isNormalOperation()) {
        this.greenDotBug.instance.style.visibility = 'visible';
        this.greenDotBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(gd.value)}px, 0px`;
      } else {
        this.greenDotBug.instance.style.visibility = 'hidden';
      }
    }, true);

    this.v4.sub((sls) => {
      if (sls.isNormalOperation()) {
        this.slatBug.instance.style.visibility = 'visible';
        this.slatBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(sls.value)}px, 0px`;
      } else {
        this.slatBug.instance.style.visibility = 'hidden';
      }
    }, true);

    this.v3.sub((fs) => {
      if (fs.isNormalOperation()) {
        this.flapsBug.instance.style.visibility = 'visible';
        this.flapsBug.instance.style.transform = `translate3d(0px,${getSpeedTapeOffset(fs.value)}px, 0px`;
      } else {
        this.flapsBug.instance.style.visibility = 'hidden';
      }
    }, true);
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
  private readonly sub = this.props.bus.getSubscriber<PrimFeBusBaseEvents & HudElems & HUDSimvars & Arinc429Values>();

  private readonly vMax = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_v_max'));
  private readonly spdTape = ConsumerSubject.create(this.sub.on('spdTape'), '');
  private readonly xWindSpdTape = ConsumerSubject.create(this.sub.on('xWindSpdTape'), '');
  private readonly autoBrakeDecel = ConsumerSubject.create(this.sub.on('autoBrakeDecel'), false);
  private readonly leftMainGearCompressed = ConsumerSubject.create(this.sub.on('leftMainGearCompressed'), false);
  private readonly rightMainGearCompressed = ConsumerSubject.create(this.sub.on('rightMainGearCompressed'), false);
  private readonly speed = Arinc429ConsumerSubject.create(this.sub.on('speedAr'));

  private readonly spdLimFlagVisibility = this.vMax.map((vMax) => (vMax.isFailureWarning() ? 'block' : 'none'));
  private readonly spdTapeVis = this.spdTape.map((s) => (s == 'block' ? 'block' : 'none'));
  private readonly xWindSpdTapeVis = this.xWindSpdTape.map((s) => (s == 'block' ? 'block' : 'none'));

  private readonly onGround = MappedSubject.create(
    ([lmgc, rmgc]) => {
      return lmgc || rmgc;
    },
    this.leftMainGearCompressed,
    this.rightMainGearCompressed,
  );

  private readonly decelVis = MappedSubject.create(([autoBrakeDecel]) => {
    return autoBrakeDecel ? 'block' : 'none';
  }, this.autoBrakeDecel);

  private readonly isFailed = MappedSubject.create(
    ([onGround, speed]) => {
      let airspeedValue: number;
      if (speed.isFailureWarning() || (speed.isNoComputedData() && !onGround)) {
        airspeedValue = NaN;
      } else if (speed.isNoComputedData()) {
        airspeedValue = 30;
      } else {
        airspeedValue = speed.value;
      }
      if (Number.isNaN(airspeedValue)) {
        return true;
      } else {
        return false;
      }
    },
    this.onGround,
    this.speed,
  );

  private readonly showLower = MappedSubject.create(([speed]) => {
    const clampedSpeed = Math.max(Math.min(speed.value, 660), 30);
    return clampedSpeed > 72 ? 'block' : 'none';
  }, this.speed);

  render(): VNode {
    return (
      <>
        <g id="offTapeSpeedGroup">
          <g id="crosswind" class="cwTest" display={this.xWindSpdTapeVis}>
            <g
              id="SpeedOfftapeGroup"
              transform=" translate(95 159)"
              display={this.isFailed.map((v) => {
                !v ? 'block' : 'none';
              })}
            >
              <g id="cwOfftapeFailedGroup">
                <path id="SpeedTapeOutlineRight" class="NormalStroke Green" d="m87 79 v 182"></path>
                <path id="SpeedTapeOutlineUpper" class="NormalStroke Green" d="m16 79 h 98"></path>
                <path id="SpeedTapeOutlineLower" class="NormalStroke Green" d="m16 261 h 98"></path>
                <path class="Fill Green SmallOutline" d="m 62 168 v 4 h 28 l 15.614 5.745 v -15.119 l -15.614 5.745z" />
              </g>

              <SpeedTarget bus={this.props.bus} mode={WindMode.CrossWind} />

              <CrosswindDigitalSpeedReadout bus={this.props.bus} />
            </g>
          </g>
          <g id="normal" display={this.spdTapeVis}>
            <g
              id="SpeedOfftapeGroup"
              transform=" translate(95 159)"
              display={this.isFailed.map((v) => {
                !v ? 'block' : 'none';
              })}
            >
              <g
                id="OfftapeFailedGroup"
                display={this.isFailed.map((v) => {
                  v ? 'block' : 'none';
                })}
              >
                <path id="SpeedTapeOutlineRight" class="NormalStroke Green" d="m87 170 v 383" />
                <path id="SpeedTapeOutlineUpper" class="NormalStroke Green" d="m16 170 h 98" />
                <path id="SpeedTapeOutlineLower" class="NormalStroke Green" d="m16 553 h 98" />
              </g>

              <path id="SpeedTapeOutlineRight" class="NormalStroke Green" d="m87 170 v 383" />
              <path id="SpeedTapeOutlineUpper" class="NormalStroke Green" d="m16 170 h 98" />
              <SpeedTarget bus={this.props.bus} mode={WindMode.Normal} />
              <text id="AutoBrkDecel" display={this.decelVis} class="FontMedium EndAlign Green" x="91.9425" y="578.565">
                DECEL
              </text>
              <path
                class="Fill Green SmallOutline"
                d="m62.763 360.863v3.254h29.367l14.006 5.153v-13.562l-14.006 5.153z"
              />
              <path class="Fill Green SmallOutline" d="m0.415 364.115v-3.254h9.035v3.254z" />
              <path id="SpeedTapeOutlineLower" display={this.showLower} class="NormalStroke Green" d="m16  553 h 98" />
              <text
                id="SpdLimFailTextUpper"
                x="143.7"
                y="522.2757"
                display={this.spdLimFlagVisibility}
                class="Blink9Seconds FontMedium EndAlign Green"
              >
                SPD
              </text>
              <text
                id="SpdLimFailTextLower"
                x="143.83"
                y="547.213"
                display={this.spdLimFlagVisibility}
                class="Blink9Seconds FontMedium EndAlign Green"
              >
                LIM
              </text>
            </g>
          </g>
        </g>
      </>
    );
  }
}

class VMaxBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getArincSubscriber<PrimFeBusBaseEvents>();

  private VMaxIndicator = FSComponent.createRef<SVGPathElement>();

  private airSpeed = new Arinc429Word(0);

  private readonly vMax = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_v_max'));

  private staticPressure = new Arinc429Word(0);

  private setVMaxBarPath() {
    const vMax = this.vMax.get().isNormalOperation() ? this.vMax.get().value : this.computeFallbackVMax();

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

    this.vMax.sub(() => {
      this.setVMaxBarPath();
    }, true);

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
}> {
  private readonly sub = this.props.bus.getArincSubscriber<PrimFeBusBaseEvents>();

  private VStallWarnIndicator = FSComponent.createRef<SVGPathElement>();

  private airSpeed = new Arinc429Word(0);

  private readonly vStallWarn = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_v_alpha_stall_warn'));

  private setVStallWarnBarPath() {
    if (
      this.airSpeed.value - this.vStallWarn.get().value > DisplayRange ||
      this.vStallWarn.get().isFailureWarning() ||
      this.vStallWarn.get().isNoComputedData()
    ) {
      this.VStallWarnIndicator.instance.style.visibility = 'hidden';
    } else {
      this.VStallWarnIndicator.instance.style.visibility = 'visible';

      const delta = Math.max(this.airSpeed.value - this.vStallWarn.get().value, -DisplayRange);
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

    this.vStallWarn.sub(() => {
      this.setVStallWarnBarPath();
    }, true);
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
        <AirspeedIndicatorBase bus={this.props.bus} instrument={this.props.instrument} />
      </>
    );
  }
}

class SpeedTrendArrow extends DisplayComponent<{
  airspeed: Subscribable<number>;
  instrument: BaseInstrument;
  bus: ArincEventBus;
  valueSpacing: number;
  distanceSpacing: number;
}> {
  private readonly sub = this.props.bus.getArincSubscriber<PrimFeBusBaseEvents & ClockEvents>();

  private vCTrendWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_speed_trend').atFrequency(10));

  private vCTrendInvalid = this.vCTrendWord.map((input) => {
    return input.isFailureWarning() || input.isNoComputedData();
  });

  private vCTrendRateLimit = new RateLimiter(12, -12);

  private vCTrendRateLimited = Subject.create(0);

  private vCTrendSign = this.vCTrendRateLimited.map((input) => {
    return input > 0;
  });

  private offset = this.vCTrendRateLimited.map((value) => (-value * DistanceSpacing) / ValueSpacing);

  private offsetString = this.offset.map((offset) => `m 71.76 ${neutralPos} v${offset.toFixed(3)}`);

  private pathString = MappedSubject.create(
    ([vCTrendSign, offset]) => {
      if (vCTrendSign) {
        return `m 71.76 ${neutralPos + offset} l -5.606 13.455 M 71.76 ${neutralPos + offset} l 5.606 13.455`;
      } else {
        return `m 71.76 ${neutralPos + offset} l 5.606 -13.455 M 71.76 ${neutralPos + offset} l -5.606 -13.455`;
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
      <g id="SpeedTrendArrow" visibility={this.vCTrendVisible.map((visible) => (visible ? 'visible' : 'hidden'))}>
        <path id="SpeedTrendArrowBase" class="NormalStroke Green" d={this.offsetString} />
        <path id="SpeedTrendArrowHead" class="NormalStroke Green" d={this.pathString} />
      </g>
    );
  }
}

class VLsBar extends DisplayComponent<{ readonly bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getArincSubscriber<PrimFeBusBaseEvents>();

  private vlsPath = Subject.create<string>('');

  private vlsVisbility = Subject.create<string>('hidden');

  private readonly vAlphaProt = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_v_alpha_prot'));

  private readonly vStallWarn = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_v_alpha_stall_warn'));

  private airSpeed = new Arinc429Word(0);

  private readonly vls = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_v_ls'));

  private setVlsPath() {
    if (this.vls.get().isNormalOperation()) {
      this.vlsVisbility.set('visible');

      const vAlphaProtVisible = !(this.vAlphaProt.get().isFailureWarning() || this.vAlphaProt.get().isNoComputedData());

      const VLsPos = ((this.airSpeed.value - this.vls.get().value) * DistanceSpacing) / ValueSpacing + neutralPos;
      const offset =
        ((this.vls.get().value -
          (vAlphaProtVisible ? this.vAlphaProt.get().valueOr(0) : this.vStallWarn.get().valueOr(0))) *
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

    this.vAlphaProt.sub(() => {
      this.setVlsPath();
    }, true);

    this.vStallWarn.sub(() => {
      this.setVlsPath();
    }, true);

    sub
      .on('speedAr')
      .withArinc429Precision(2)
      .handle((s) => {
        this.airSpeed = s;
        this.setVlsPath();
      });

    this.vls.sub(() => {
      this.setVlsPath();
    }, true);
  }

  render(): VNode {
    return <path id="VLsIndicator" class="NormalStroke Green" d={this.vlsPath} visibility={this.vlsVisbility} />;
  }
}

class VAlphaLimBar extends DisplayComponent<{
  readonly bus: ArincEventBus;
}> {
  private readonly sub = this.props.bus.getArincSubscriber<PrimFeBusBaseEvents>();

  private VAlimIndicator = FSComponent.createRef<SVGPathElement>();

  private airSpeed = new Arinc429Word(0);

  private readonly vAlphaLim = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_v_alpha_lim'));

  private setAlphaLimBarPath() {
    if (
      this.vAlphaLim.get().value - this.airSpeed.value < -DisplayRange ||
      this.vAlphaLim.get().isFailureWarning() ||
      this.vAlphaLim.get().isNoComputedData()
    ) {
      this.VAlimIndicator.instance.style.visibility = 'hidden';
    } else {
      this.VAlimIndicator.instance.style.visibility = 'visible';

      const delta = this.airSpeed.value - DisplayRange - this.vAlphaLim.get().value;
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

    this.vAlphaLim.sub(() => {
      this.setAlphaLimBarPath();
    }, true);
  }

  render(): VNode {
    return <path ref={this.VAlimIndicator} id="VAlimIndicator" class="Fill Green" />;
  }
}

class V1Offtape extends DisplayComponent<{ bus: EventBus }> {
  private readonly v1 = ConsumerSubject.create(this.props.bus.getSubscriber<HUDSimvars>().on('v1'), 0);

  private readonly fwcFlightPhase = ConsumerSubject.create(
    this.props.bus.getSubscriber<HUDSimvars>().on('fwcFlightPhase'),
    1,
  );
  private readonly speed = Arinc429ConsumerSubject.create(this.props.bus.getSubscriber<Arinc429Values>().on('speedAr'));

  private readonly visibility = MappedSubject.create(
    ([v1, flightphase, speed]) => {
      if (!speed.isFailureWarning() && v1 > 0 && flightphase <= 5 && v1 - speed.valueOr(30) > DisplayRange) {
        return 'visible';
      } else {
        return 'hidden';
      }
    },
    this.v1,
    this.fwcFlightPhase,
    this.speed,
  );

  onAfterRender(node: VNode) {
    super.onAfterRender(node);
  }

  render() {
    return (
      <text id="V1SpeedText" class="FontTiny Green" x="89.7" y="188.37" style={{ visibility: this.visibility }}>
        {this.v1}
      </text>
    );
  }
}

class ArsBar extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getArincSubscriber<HUDSimvars & SfccEvents & PrimFeBusBaseEvents>();
  private static readonly ARS_1F_F_SPEED = 212;

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

  private readonly airspeed = Arinc429LocalVarConsumerSubject.create(this.sub.on('speed'), null);

  private readonly vMax = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_v_max'));

  private readonly path = MappedSubject.create(
    ([vMax, airspeed]) => {
      let offset: number;
      if (vMax.value < airspeed.value + DisplayRange) {
        offset = ((ArsBar.ARS_1F_F_SPEED - vMax.value) * DistanceSpacing) / ValueSpacing;
      } else {
        offset = ((ArsBar.ARS_1F_F_SPEED - (airspeed.value + DisplayRange)) * DistanceSpacing) / ValueSpacing;
      }
      const arsPos = ((airspeed.value - ArsBar.ARS_1F_F_SPEED) * DistanceSpacing) / ValueSpacing + 363.7;
      return `m 87 ${arsPos}h 8.835 v ${offset}`;
    },
    this.vMax,
    this.airspeed,
  );

  private readonly arsVisible = MappedSubject.create(
    ([flapLever1, config1F, airspeed, vMax]) =>
      !airspeed.isInvalid() && flapLever1 && config1F && !vMax.isFailureWarning(),
    this.flapLever1,
    this.config1F,
    this.airspeed,
    this.vMax,
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
      />
    );
  }
}

class SpeedTarget extends DisplayComponent<{ bus: ArincEventBus; mode: WindMode }> {
  private xwindOffset = 0;

  private BoundBgRef = FSComponent.createRef<SVGPathElement>();

  private upperBoundRef = FSComponent.createRef<SVGTextElement>();

  private lowerBoundRef = FSComponent.createRef<SVGTextElement>();

  private speedTargetRef = FSComponent.createRef<SVGPathElement>();

  private sub = this.props.bus.getArincSubscriber<PrimFgBusBaseEvents & Arinc429Values & HUDSimvars & HudElems>();

  private decelActive = ConsumerSubject.create(this.sub.on('autoBrakeDecel'), false);
  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudMode'), 0);
  private readonly speed = Arinc429ConsumerSubject.create(this.sub.on('speedAr').withArinc429Precision(2));
  private readonly fwcFlighPhase = ConsumerSubject.create(this.sub.on('fwcFlightPhase'), 0);
  private readonly pfdTargetSpeed = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_pfd_speed_target'));
  private readonly selectedSpeed = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_selected_speed'));
  private readonly managedSpeed = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('prim_pfd_short_term_managed_speed'),
  );

  private readonly fgDiscreteWord5 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_5'));

  private readonly isSpeedManaged = this.fgDiscreteWord5.map((word) => word.bitValueOr(17, false));

  private readonly targetSpeedValid = this.pfdTargetSpeed.map(
    (speed) => speed.isNormalOperation() || speed.isFunctionalTest(),
  );
  private readonly cWndMode = ConsumerSubject.create(this.sub.on('cWndMode'), false);

  private readonly spdSelFlagVisible = this.pfdTargetSpeed.map((speed) => speed.isFailureWarning());

  private readonly speedTargetBugVisible = MappedSubject.create(
    ([speedTarget, speed, targetSpeedValid]) =>
      targetSpeedValid && Math.abs(speed.value - speedTarget.value) < DisplayRange,
    this.pfdTargetSpeed,
    this.speed,
    this.targetSpeedValid,
    this.cWndMode,
  );

  private readonly speedTargetUpperVisible = MappedSubject.create(
    ([speedTarget, speed, targetSpeedValid]) => targetSpeedValid && speed.value - speedTarget.value > DisplayRange,
    this.pfdTargetSpeed,
    this.speed,
    this.targetSpeedValid,
  );

  private readonly speedTargetLowerVisible = MappedSubject.create(
    ([speedTarget, speed, targetSpeedValid, decelActive]) =>
      targetSpeedValid && !decelActive && speed.value - speedTarget.value < -DisplayRange,
    this.pfdTargetSpeed,
    this.speed,
    this.targetSpeedValid,
    this.decelActive,
  );

  private readonly speedTargetText = this.pfdTargetSpeed.map((target) =>
    Math.round(target.value).toString().padStart(3, '0'),
  );
  private windMode = this.props.mode;
  private readonly speedTargetTransform = MappedSubject.create(
    ([speedTarget, speed]) => {
      const multiplier = 100;
      const currentValueAtPrecision = Math.round(speed.value * multiplier) / multiplier;
      const offset =
        ((currentValueAtPrecision - speedTarget.value) * DistanceSpacing) / ValueSpacing + this.xwindOffset;

      return `translate3d(0px, ${offset}px, 0px)`;
    },
    this.pfdTargetSpeed,
    this.speed,
  );

  private readonly isBoundBgVisible = MappedSubject.create(
    ([speedTargetLowerVisible, speedTargetUpperVisible, isSpeedManaged]) => {
      //return isSpeedManaged && (speedTargetLowerVisible || speedTargetUpperVisible) ? 'visible' : 'hidden';
      return isSpeedManaged && (speedTargetLowerVisible || speedTargetUpperVisible);
    },
    this.speedTargetLowerVisible,
    this.speedTargetUpperVisible,
    this.isSpeedManaged,
  );

  private setTargetSpeedBugBg() {
    if (this.isSpeedManaged.get()) {
      this.speedTargetRef.instance.classList.add('GreenFill2');
    } else {
      this.speedTargetRef.instance.classList.remove('GreenFill2');
    }
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

  private handleLowerUpperBound(): boolean {
    let currentTargetSpeed;

    if (this.hudMode.get() === HudMode.TAKEOFF) {
      this.isSpeedManaged.get().valueOf()
        ? (currentTargetSpeed = this.managedSpeed.get().value - 10)
        : (currentTargetSpeed = this.selectedSpeed.get().value - 10);
    } else {
      this.isSpeedManaged.get().valueOf()
        ? (currentTargetSpeed = this.managedSpeed.get().value)
        : (currentTargetSpeed = this.selectedSpeed.get().value);
    }
    let inRange = false;
    this.handleCrosswinMode();
    this.setTargetSpeedBugBg();
    if (this.speed.get().value - currentTargetSpeed > DisplayRange) {
      this.BoundBgRef.instance.style.transform = `translate3d(0px, ${this.xwindOffset + (DisplayRange / ValueSpacing) * DistanceSpacing + 15}px, 0px)`;
    } else if (this.speed.get().value - currentTargetSpeed < -DisplayRange && !this.decelActive.get()) {
      this.BoundBgRef.instance.style.transform = `translate3d(0px, ${this.xwindOffset - (DisplayRange / ValueSpacing) * DistanceSpacing - 15}px, 0px)`;
    } else if (Math.abs(this.speed.get().value - currentTargetSpeed) < DisplayRange) {
      inRange = true;
    }

    if (inRange) {
      this.BoundBgRef.instance.setAttribute('d', 'm70.5 348.5 h45v 0 h-45z');
    } else {
      if (this.isSpeedManaged.get()) {
        this.BoundBgRef.instance.setAttribute('d', 'm70.5 348.5 h45v 27 h-45z');
        this.upperBoundRef.instance.classList.add('InverseGreen');
        this.upperBoundRef.instance.classList.remove('Green');
        this.lowerBoundRef.instance.classList.add('InverseGreen');
        this.lowerBoundRef.instance.classList.remove('Green');
      } else {
        this.upperBoundRef.instance.classList.remove('InverseGreen');
        this.upperBoundRef.instance.classList.add('Green');
        this.lowerBoundRef.instance.classList.remove('InverseGreen');
        this.lowerBoundRef.instance.classList.add('Green');
      }
    }

    if (this.decelActive.get()) {
      this.BoundBgRef.instance.style.visibility = 'hidden';
    }
    return inRange;
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.isBoundBgVisible.sub(this.handleLowerUpperBound.bind(this), true);
    this.speed.sub(this.handleLowerUpperBound.bind(this), true);
    this.cWndMode.sub(this.handleCrosswinMode.bind(this), true);
  }

  render(): VNode {
    return (
      <>
        <path
          ref={this.BoundBgRef}
          id="SpeedTargetBackground"
          d="m70.5 348.5 h45v27h-45z"
          class={{
            GreenFill: this.isBoundBgVisible,
          }}
          visible={this.isBoundBgVisible.map((v) => (v ? 'visible' : 'hidden'))}
        />
        <text
          ref={this.upperBoundRef}
          id="SelectedSpeedUpperText"
          class={{
            FontSmallest: true,
            MiddleAlign: true,
            Green: this.isSpeedManaged.map(SubscribableMapFunctions.not()),
            InverseGreen: this.isSpeedManaged,
            HiddenElement: this.speedTargetUpperVisible.map(SubscribableMapFunctions.not()),
          }}
          x="94"
          y="578"
        >
          {this.speedTargetText}
        </text>
        <text
          ref={this.lowerBoundRef}
          id="SelectedSpeedLowerText"
          class={{
            FontSmallest: true,
            MiddleAlign: true,
            Green: this.isSpeedManaged.map(SubscribableMapFunctions.not()),
            InverseGreen: this.isSpeedManaged,
            HiddenElement: this.speedTargetLowerVisible.map(SubscribableMapFunctions.not()),
          }}
          x="94"
          y="166"
        >
          {this.speedTargetText}
        </text>
        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.spdSelFlagVisible}>
          <text id="SelectedSpeedFailText" class="FontSmall EndAlign Green" x="94" y="166">
            SPD SEL
          </text>
        </FlashOneHertz>
        <path
          id="speedTarget"
          ref={this.speedTargetRef}
          class={{
            NormalStroke: true,
            CornerRound: true,
            Green: true,
            HiddenElement: this.speedTargetBugVisible.map(SubscribableMapFunctions.not()),
          }}
          style={{ transform: this.speedTargetTransform }}
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
        this.machTextSub.set('');
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
          class="Blink9Seconds FontLarge StartAlign Green"
          x="5.4257932"
          y="136.88908"
        >
          MACH
        </text>
        <text id="CurrentMachText" class="FontLarge StartAlign Green" x="150" y="767">
          {this.machTextSub}
        </text>
      </>
    );
  }
}

class VProtBug extends DisplayComponent<{ readonly bus: EventBus }> {
  private readonly sub = this.props.bus.getSubscriber<PrimFeBusBaseEvents & FcdcBusEvents>();

  private readonly vMax = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_v_max'));

  private vProtBug = FSComponent.createRef<SVGGElement>();

  private readonly fcdc1DiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_1_1'));

  private readonly fcdc2DiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_1_2'));

  private readonly isNormalLawActive = MappedSubject.create(
    ([fcdc1DiscreteWord1, fcdc2DiscreteWord1]) =>
      fcdc1DiscreteWord1.bitValueOr(11, false) || fcdc2DiscreteWord1.bitValueOr(11, false),
    this.fcdc1DiscreteWord1,
    this.fcdc2DiscreteWord1,
  );
  private handleVProtBugDisplay() {
    const showVProt = this.vMax.get().value > 240 && this.vMax.get().isNormalOperation();
    const offset = (-(this.vMax.get().value + 10) * DistanceSpacing) / ValueSpacing;

    const isNormalLawActive = this.isNormalLawActive.get();

    if (showVProt && isNormalLawActive) {
      this.vProtBug.instance.style.display = 'block';
      this.vProtBug.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
    } else {
      this.vProtBug.instance.style.display = 'none';
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.vMax.sub(() => {
      this.handleVProtBugDisplay();
    }, true);

    this.isNormalLawActive.sub(() => this.handleVProtBugDisplay(), true);
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
  private readonly groundSpeedRef = FSComponent.createRef<SVGTextElement>();

  private readonly groundSpeedRegister = Arinc429RegisterSubject.createEmpty();

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
