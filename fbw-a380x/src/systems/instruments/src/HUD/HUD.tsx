import {
  ClockEvents,
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  SubscribableMapFunctions,
  Subscription,
  VNode,
  HEvent,
} from '@microsoft/msfs-sdk';
import { Arinc429LocalVarConsumerSubject, Arinc429Word, ArincEventBus, FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { AttitudeIndicatorWarnings } from '@flybywiresim/hud';
import { AttitudeIndicatorWarningsA380 } from 'instruments/src/HUD/AttitudeIndicatorWarningsA380';
import { LinearDeviationIndicator } from 'instruments/src/HUD/LinearDeviationIndicator';
import { CdsDisplayUnit, DisplayUnitID } from '../MsfsAvionicsCommon/CdsDisplayUnit';
import { LagFilter, HudElems } from './HUDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { AltitudeIndicator, AltitudeIndicatorOfftape } from './AltitudeIndicator';
import { AttitudeIndicatorFixedCenter, AttitudeIndicatorFixedUpper } from './AttitudeIndicatorFixed';
import { FMA } from './FMA';
import { Horizon } from './AttitudeIndicatorHorizon';
import { LandingSystem } from './LandingSystemIndicator';
import { AirspeedIndicator, AirspeedIndicatorOfftape, MachNumber } from './SpeedIndicator';
import { VerticalSpeedIndicator } from './VerticalSpeedIndicator';
import { Grid } from './HUDUtils';
import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import './style.scss';
import { HUDSimvars } from 'instruments/src/HUD/shared/HUDSimvarPublisher';
import { WindIndicator } from '../../../../../../fbw-common/src/systems/instruments/src/ND/shared/WindIndicator';
import { ExtendedHorizon } from './AttitudeIndicatorHorizon';
import { DecelIndicator } from './DecelSpeedIndicator';
import { DeclutterIndicator } from './AttitudeIndicatorFixed';
import { HudWarnings } from './HudWarnings';
export const getDisplayIndex = () => {
  const url = Array.from(document.querySelectorAll('vcockpit-panel > *'))
    .find((it) => it.tagName.toLowerCase() !== 'wasm-instrument')
    .getAttribute('url');
  const duId = url ? parseInt(url.substring(url.length - 1), 10) : -1;

  switch (duId) {
    case 8:
      return 1;
    case 9:
      return 2;
    default:
      return 0;
  }
};

interface HUDProps extends ComponentProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
}

export class HUDComponent extends DisplayComponent<HUDProps> {
  private spdTape = '';
  private xWindSpdTape = '';
  private altTape = '';
  private xWindAltTape = '';
  private windIndicator = '';
  private spdTapeRef = FSComponent.createRef<SVGPathElement>();
  private xWindSpdTapeRef = FSComponent.createRef<SVGPathElement>();
  private altTapeRef = FSComponent.createRef<SVGPathElement>();
  private xWindAltTapeRef = FSComponent.createRef<SVGPathElement>();
  private spdTapeRef2 = FSComponent.createRef<SVGPathElement>();
  private xWindSpdTapeRef2 = FSComponent.createRef<SVGPathElement>();
  private altTapeRef2 = FSComponent.createRef<SVGPathElement>();
  private xWindAltTapeRef2 = FSComponent.createRef<SVGPathElement>();

  private windIndicatorRef = FSComponent.createRef<SVGGElement>();
  private declutterMode = 0;
  private crosswindMode = false;

  private displayBrightness = Subject.create(0);
  private lastBrightnessValue = Subject.create(0);

  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<Arinc429Values & ClockEvents & HUDSimvars>();

  private headingFailed = Subject.create(true);

  private displayFailed = Subject.create(false);

  private isAttExcessive = Subject.create(false);

  private pitch = new Arinc429Word(0);

  private roll = new Arinc429Word(0);

  private ownRadioAltitude = new Arinc429Word(0);

  private filteredRadioAltitude = Subject.create(0);

  private radioAltitudeFilter = new LagFilter(5);

  private failuresConsumer: FailuresConsumer;

  private readonly groundSpeed = Arinc429LocalVarConsumerSubject.create(this.sub.on('groundSpeed'), 0);

  private readonly spoilersArmed = ConsumerSubject.create(this.sub.on('spoilersArmed'), false);

  private readonly thrustTla = [
    ConsumerSubject.create(this.sub.on('tla1'), 0),
    ConsumerSubject.create(this.sub.on('tla2'), 0),
    ConsumerSubject.create(this.sub.on('tla3'), 0),
    ConsumerSubject.create(this.sub.on('tla4'), 0),
  ];
  private readonly atLeastThreeThrustLeversOutOfIdle = MappedSubject.create(
    ([t1, t2, t3, t4]) => [t1, t2, t3, t4].filter((t) => t > 5).length > 2,
    ...this.thrustTla,
  );

  private readonly leftMainGearCompressed = ConsumerSubject.create(this.sub.on('leftMainGearCompressed'), false);
  private readonly rightMainGearCompressed = ConsumerSubject.create(this.sub.on('rightMainGearCompressed'), false);
  private readonly eitherMainLgCompressed = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.leftMainGearCompressed,
    this.rightMainGearCompressed,
  );

  private previousFlapHandlePosition = 0;

  private readonly pitchTrimIndicatorVisible = Subject.create(false);

  private updatePitchTrimVisible(flapsRetracted = false) {
    const gs = this.groundSpeed.get().valueOr(0);
    if (this.filteredRadioAltitude.get() > 50) {
      this.pitchTrimIndicatorVisible.set(false);
    } else if (gs < 30) {
      this.pitchTrimIndicatorVisible.set(true);
    } else if (
      this.eitherMainLgCompressed.get() &&
      gs > 80 &&
      (this.spoilersArmed.get() === false || flapsRetracted === true || this.atLeastThreeThrustLeversOutOfIdle.get())
    ) {
      // FIXME add "flight crew presses pitch trim switches"
      this.pitchTrimIndicatorVisible.set(true);
    }
  }

  constructor(props: HUDProps) {
    super(props);
    this.failuresConsumer = new FailuresConsumer();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<
      Arinc429Values & ClockEvents & DmcLogicEvents & HUDSimvars & HEvent & HudElems
    >();

    sub
      .on('spdTape')
      .whenChanged()
      .handle((v) => {
        this.spdTape = v;
        this.spdTapeRef.instance.style.display = `${this.spdTape}`;
        this.spdTapeRef2.instance.style.display = `${this.spdTape}`;
      });
    sub
      .on('xWindSpdTape')
      .whenChanged()
      .handle((v) => {
        this.xWindSpdTape = v;
        this.xWindSpdTapeRef.instance.style.display = `${this.xWindSpdTape}`;
        this.xWindSpdTapeRef2.instance.style.display = `${this.xWindSpdTape}`;
      });
    sub
      .on('altTape')
      .whenChanged()
      .handle((v) => {
        this.altTape = v;
        this.altTapeRef.instance.style.display = `${this.altTape}`;
        this.altTapeRef2.instance.style.display = `${this.altTape}`;
      });
    sub
      .on('xWindAltTape')
      .whenChanged()
      .handle((v) => {
        this.xWindAltTape = v;
        this.xWindAltTapeRef.instance.style.display = `${this.xWindAltTape}`;
        this.xWindAltTapeRef2.instance.style.display = `${this.xWindAltTape}`;
      });
    sub
      .on('windIndicator')
      .whenChanged()
      .handle((v) => {
        this.windIndicator = v.toString();
        this.windIndicatorRef.instance.style.display = `${this.windIndicator}`;
      });

    sub.on('hEvent').handle((ev) => {
      if (ev.startsWith('A320_Neo_HUD_L')) {
        let vL = SimVar.GetSimVarValue('L:A320_Neo_HUD_L_POS', 'number');
        vL == 0 ? (vL = 1) : (vL = 0);
        SimVar.SetSimVarValue('L:A320_Neo_HUD_L_POS', 'number', vL);
        this.displayBrightness.set(0);
        if (vL == 0) {
          setTimeout(() => {
            this.displayBrightness.set(this.lastBrightnessValue.get());
          }, 1250);
        }
      }
      if (ev.startsWith('A320_Neo_HUD_R')) {
        let vR = SimVar.GetSimVarValue('L:A320_Neo_HUD_R_POS', 'number');
        vR == 0 ? (vR = 1) : (vR = 0);
        SimVar.SetSimVarValue('L:A320_Neo_HUD_R_POS', 'number', vR);
        this.displayBrightness.set(0);
        if (vR == 0) {
          setTimeout(() => {
            this.displayBrightness.set(this.lastBrightnessValue.get());
          }, 1250);
        }
      }
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
      });

    this.subscriptions.push(
      this.sub.on('headingAr').handle((h) => {
        if (this.headingFailed.get() !== h.isNormalOperation()) {
          this.headingFailed.set(!h.isNormalOperation());
        }
      }),
    );

    this.subscriptions.push(
      this.sub.on('rollAr').handle((r) => {
        this.roll = r;
      }),
    );

    this.subscriptions.push(
      this.sub.on('pitchAr').handle((p) => {
        this.pitch = p;
      }),
    );

    this.subscriptions.push(
      this.sub
        .on('realTime')
        .atFrequency(1)
        .handle((_t) => {
          this.failuresConsumer.update();
          if (
            !this.isAttExcessive.get() &&
            ((this.pitch.isNormalOperation() && (this.pitch.value > 25 || this.pitch.value < -13)) ||
              (this.roll.isNormalOperation() && Math.abs(this.roll.value) > 45))
          ) {
            this.isAttExcessive.set(true);
          } else if (
            this.isAttExcessive.get() &&
            this.pitch.isNormalOperation() &&
            this.pitch.value < 22 &&
            this.pitch.value > -10 &&
            this.roll.isNormalOperation() &&
            Math.abs(this.roll.value) < 40
          ) {
            this.isAttExcessive.set(false);
          }
        }),
    );

    this.subscriptions.push(
      this.sub.on('chosenRa').handle((ra) => {
        this.ownRadioAltitude = ra;
        const filteredRadioAltitude = this.radioAltitudeFilter.step(
          this.ownRadioAltitude.value,
          this.props.instrument.deltaTime / 1000,
        );
        this.filteredRadioAltitude.set(filteredRadioAltitude);
        this.updatePitchTrimVisible();
      }),
    );

    this.subscriptions.push(
      this.sub
        .on('flapHandleIndex')
        .whenChanged()
        .handle((fh) => {
          if (this.previousFlapHandlePosition > fh) {
            this.updatePitchTrimVisible(true);
          }
          this.previousFlapHandlePosition = fh;
        }),
    );

    this.subscriptions.push(
      this.groundSpeed.sub(() => this.updatePitchTrimVisible()),
      this.spoilersArmed.sub(() => this.updatePitchTrimVisible()),
      this.atLeastThreeThrustLeversOutOfIdle.sub(() => this.updatePitchTrimVisible()),
      this.groundSpeed,
      this.spoilersArmed,
      this.leftMainGearCompressed,
      this.rightMainGearCompressed,
      this.eitherMainLgCompressed,
      this.atLeastThreeThrustLeversOutOfIdle,
    );

    for (const s of this.thrustTla) {
      this.subscriptions.push(s);
    }
  }

  render(): VNode {
    return (
      <CdsDisplayUnit
        bus={this.props.bus}
        displayUnitId={getDisplayIndex() === 1 ? DisplayUnitID.CaptHud : DisplayUnitID.FoHud}
        test={Subject.create(-1)}
        failed={Subject.create(false)}
      >
        <svg
          class="hud-svg"
          version="1.1"
          viewBox="0 0 1280 1024"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
        >
          <Grid bus={this.props.bus} />
          <Horizon
            bus={this.props.bus}
            instrument={this.props.instrument}
            isAttExcessive={this.isAttExcessive}
            filteredRadioAlt={this.filteredRadioAltitude}
          />
          <path
            id="PitchScaleMask"
            class="BackgroundFill"
            d="m 0 0 h 1280 v 1024 h -1280 Z M 1 125 h 1278v 800 h -1278 Z"
          />

          <g id="TapesMasks">
            <path
              ref={this.altTapeRef}
              id="AltTapeMask"
              class="LargeStroke BlackFill"
              d="M 1039 323 v 430 h 120 v -430 z"
            ></path>
            <path
              ref={this.spdTapeRef}
              id="SpdTapeMask"
              class="LargeStroke BlackFill"
              d="M 95 329 v 383 h 123 v -383  z"
            ></path>

            <path
              ref={this.xWindSpdTapeRef}
              id="CrosswindSpdTapeMask"
              class="LargeStroke  BlackFill"
              //d="M 111 119 v 182 h 98 v -182 z"
              d="M 111 238 v 182 h 98 v -182 z"
            />
            <path
              ref={this.xWindAltTapeRef}
              id="CrosswindAltTapeMask"
              class="LargeStroke BlackFill"
              // d="M 1039 135 v 152 h 120 v -152 z"
              d="M 1039 255 v 150 h 100 v -150 z"
            ></path>
          </g>

          <g id="WindIndicator" class="Wind" transform="translate(250 200) " ref={this.windIndicatorRef}>
            <WindIndicator bus={this.props.bus} />
          </g>
          <AltitudeIndicator bus={this.props.bus} />
          <AirspeedIndicator bus={this.props.bus} instrument={this.props.instrument} />
          <g id="TapesMasks2">
            <path
              id="Mask2Cw"
              class="LargeStroke BackgroundFill "
              ref={this.xWindSpdTapeRef2}
              // d="M 95 0 H 207 V 1024 H 95 Z  M 96 119 v 182 h 110 v -182 z" //full xwind offset
              d="M 95 0 H 210 V 1024 H 95 Z  M 96 238 v 182 h 113 v -182 z"
            />
            <path
              id="Mask2"
              class="LargeStroke BackgroundFill"
              ref={this.spdTapeRef2}
              // eslint-disable-next-line max-len
              //d="M 60 0 H 208 V 1024 H 60 Z  M 61 323 v 364 h 146 v -364 z"
              d="M 95 0 H 207 V 1024 H 95 Z  M 96 329 v 383 h 110 v -383 z"
            />

            <path
              id="Mask3"
              class="LargeStroke BackgroundFill"
              ref={this.altTapeRef2}
              d="M 1028 0 h 115 V 1024 H 1028 Z  M 1029 329 v 383 h 113 v -383 z"
              // d="M 1038 250 h 122 V 700 H 1038 Z  M 1039 274 v 364 h 120 v -364 z"
            />
            <path
              id="Mask4"
              class="LargeStroke BackgroundFill"
              ref={this.xWindAltTapeRef2}
              // d="M 1028 0 h 115 V 1024 H 1028 Z  M 1029 135 v 152 h 113 v -152 z"
              d="M 1028 0 h 115 V 1024 H 1028 Z  M 1029 254 v 152 h 113 v -152 z"
            />
          </g>

          <AttitudeIndicatorFixedCenter
            bus={this.props.bus}
            isAttExcessive={this.isAttExcessive}
            filteredRadioAlt={this.filteredRadioAltitude}
            instrument={this.props.instrument}
          />
          <ExtendedHorizon
            bus={this.props.bus}
            instrument={this.props.instrument}
            filteredRadioAlt={this.filteredRadioAltitude}
          />

          <AirspeedIndicatorOfftape bus={this.props.bus} />

          <LandingSystem bus={this.props.bus} instrument={this.props.instrument} />
          <AttitudeIndicatorFixedUpper bus={this.props.bus} />
          <AttitudeIndicatorWarnings bus={this.props.bus} instrument={this.props.instrument} />
          <AttitudeIndicatorWarningsA380 bus={this.props.bus} instrument={this.props.instrument} />
          <HudWarnings bus={this.props.bus} instrument={this.props.instrument} />
          <VerticalSpeedIndicator
            bus={this.props.bus}
            instrument={this.props.instrument}
            filteredRadioAltitude={this.filteredRadioAltitude}
          />
          <AltitudeIndicatorOfftape bus={this.props.bus} filteredRadioAltitude={this.filteredRadioAltitude} />
          <LinearDeviationIndicator bus={this.props.bus} />
          <DecelIndicator bus={this.props.bus} instrument={this.props.instrument} />

          <MachNumber bus={this.props.bus} />
          <FMA bus={this.props.bus} isAttExcessive={this.isAttExcessive} />

          <DeclutterIndicator bus={this.props.bus} />
        </svg>
      </CdsDisplayUnit>
    );
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }
}
