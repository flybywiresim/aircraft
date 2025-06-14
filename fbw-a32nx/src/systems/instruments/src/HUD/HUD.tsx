// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  ComponentProps,
  DisplayComponent,
  FSComponent,
  Subject,
  VNode,
  Subscribable,
  HEvent,
} from '@microsoft/msfs-sdk';
import {
  ArincEventBus,
  Arinc429Register,
  Arinc429Word,
  Arinc429WordData,
  FailuresConsumer,
} from '@flybywiresim/fbw-sdk';

import { A320Failure } from '@failures';
import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';
import { DisplayUnit } from '../MsfsAvionicsCommon/displayUnit';
import './style.scss';
import { AltitudeIndicator, AltitudeIndicatorOfftape } from './AltitudeIndicator';
import {
  AttitudeIndicatorFixedCenter,
  AttitudeIndicatorFixedUpper,
  DeclutterIndicator,
} from './AttitudeIndicatorFixed';
import { FMA } from './FMA';
import { Horizon } from './AttitudeIndicatorHorizon';
import { LandingSystem } from './LandingSystemIndicator';
import { LinearDeviationIndicator } from './LinearDeviationIndicator';
import { AirspeedIndicator, AirspeedIndicatorOfftape, MachNumber } from './SpeedIndicator';
import { VerticalSpeedIndicator } from './VerticalSpeedIndicator';
import './style.scss';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { WindIndicator } from '../../../../../../fbw-common/src/systems/instruments/src/ND/shared/WindIndicator';
import { AutoThrustMode, VerticalMode } from '@shared/autopilot';
import { HudElemsValues, LagFilter, calculateHorizonOffsetFromPitch } from './HUDUtils';
import { SyntheticRunway } from 'instruments/src/HUD/SyntheticRunway';

export const getDisplayIndex = () => {
  const url = document.getElementsByTagName('a32nx-hud')[0].getAttribute('url');
  return url ? parseInt(url.substring(url.length - 1), 10) : 0;
};

interface HUDProps extends ComponentProps {
  bus: ArincEventBus;
  //flightPhase: FmgcFlightPhase;
  instrument: BaseInstrument;
}

export class HUDComponent extends DisplayComponent<HUDProps> {
  private spdTapeOrForcedOnLand = '';
  private xWindSpdTape = '';
  private altTape = '';
  private windIndicator = '';
  private spdTapeOrForcedOnLandRef = FSComponent.createRef<SVGPathElement>();
  private xWindSpdTapeRef = FSComponent.createRef<SVGPathElement>();
  private altTapeRef = FSComponent.createRef<SVGPathElement>();
  private spdTapeOrForcedOnLandRef2 = FSComponent.createRef<SVGPathElement>();
  private xWindSpdTapeRef2 = FSComponent.createRef<SVGPathElement>();
  private altTapeRef2 = FSComponent.createRef<SVGPathElement>();
  private windIndicatorRef = FSComponent.createRef<SVGGElement>();

  private onLanding = false;
  private groundSpeed = 0;
  private onRollout = false;
  private onDecel = false;
  private landSpeed = false;
  private flightPhase = -1;
  private declutterMode = 0;
  private bitMask = 0;
  private athMode = 0;
  private onToPower = false;
  private onGround = true;
  private crosswindMode = false;
  private lgRightCompressed = false;
  private headingFailed = Subject.create(true);

  private displayBrightness = Subject.create(0);
  private lastBrightnessValue = Subject.create(0);

  private displayFailed = Subject.create(false);

  private displayPowered = Subject.create(false);

  private isAttExcessive = Subject.create(false);

  private pitch: Arinc429WordData = Arinc429Register.empty();

  private roll: Arinc429WordData = Arinc429Register.empty();

  private ownRadioAltitude = new Arinc429Word(0);

  private filteredRadioAltitude = Subject.create(0);

  private radioAltitudeFilter = new LagFilter(5);

  private failuresConsumer;

  constructor(props: HUDProps) {
    super(props);
    this.failuresConsumer = new FailuresConsumer();
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isCaptainSide = getDisplayIndex() === 1;

    this.failuresConsumer.register(isCaptainSide ? A320Failure.LeftPfdDisplay : A320Failure.RightPfdDisplay);

    const sub = this.props.bus.getSubscriber<
      Arinc429Values & ClockEvents & DmcLogicEvents & HUDSimvars & HEvent & HudElemsValues
    >();

    sub.on('spdTapeOrForcedOnLand').handle((v) => {
      this.spdTapeOrForcedOnLand = v.get().toString();
      this.spdTapeOrForcedOnLandRef.instance.style.display = `${this.spdTapeOrForcedOnLand}`;
      this.spdTapeOrForcedOnLandRef2.instance.style.display = `${this.spdTapeOrForcedOnLand}`;
    });
    sub.on('xWindSpdTape').handle((v) => {
      this.xWindSpdTape = v.get().toString();
      this.xWindSpdTapeRef.instance.style.display = `${this.xWindSpdTape}`;
      this.xWindSpdTapeRef2.instance.style.display = `${this.xWindSpdTape}`;
    });
    sub.on('altTape').handle((v) => {
      this.altTape = v.get().toString();
      this.altTapeRef.instance.style.display = `${this.altTape}`;
      this.altTapeRef2.instance.style.display = `${this.altTape}`;
    });
    sub.on('windIndicator').handle((v) => {
      this.windIndicator = v.get().toString();
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
      .on('activeVerticalMode')
      .whenChanged()
      .handle((value) => {
        value == VerticalMode.ROLL_OUT ? (this.onRollout = true) : (this.onRollout = false);
        if (this.onGround && this.landSpeed && (this.onDecel || this.onRollout)) {
          this.onLanding = true;
        } else {
          this.onLanding = false;
        }
      });

    sub
      .on('autoBrakeDecel')
      .whenChanged()
      .handle((value) => {
        this.onDecel = value;
        if (this.onGround && this.landSpeed && (this.onDecel || this.onRollout)) {
          this.onLanding = true;
        } else {
          this.onLanding = false;
        }
      });

    sub
      .on('groundSpeed')
      .whenChanged()
      .handle((value) => {
        this.groundSpeed = value;
        this.groundSpeed > 30 ? (this.landSpeed = true) : (this.landSpeed = false);
        if (this.onGround && this.landSpeed && (this.onDecel || this.onRollout)) {
          this.onLanding = true;
        } else {
          this.onLanding = false;
        }
      });
    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((value) => {
        this.onGround = value;

        if (this.onGround && this.landSpeed && (this.onDecel || this.onRollout)) {
          this.onLanding = true;
        } else {
          this.onLanding = false;
        }
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
      .on(isCaptainSide ? 'declutterModeL' : 'declutterModeR')
      .whenChanged()
      .handle((value) => {
        this.declutterMode = value;
      });
    sub
      .on(isCaptainSide ? 'crosswindModeL' : 'crosswindModeR')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
      });

    sub
      .on(isCaptainSide ? 'hudPotentiometerCaptain' : 'hudPotentiometerFo')
      .whenChanged()
      .handle((value) => {
        this.displayBrightness.set(value);
        if (value != 0) {
          this.lastBrightnessValue.set(value);
        }
      });

    sub
      .on(isCaptainSide ? 'elec' : 'elecFo')
      .whenChanged()
      .handle((value) => {
        this.displayPowered.set(value);
      });

    sub.on('heading').handle((h) => {
      this.headingFailed.set(!h.isNormalOperation());
    });

    sub.on('rollAr').handle((r) => {
      this.roll = r;
    });

    sub.on('pitchAr').handle((p) => {
      this.pitch = p;
    });

    sub
      .on('realTime')
      .atFrequency(1)
      .handle((_t) => {
        this.failuresConsumer.update();
        this.displayFailed.set(
          this.failuresConsumer.isActive(isCaptainSide ? A320Failure.LeftPfdDisplay : A320Failure.RightPfdDisplay),
        );
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
      });

    sub.on('chosenRa').handle((ra) => {
      this.ownRadioAltitude = ra;
      const filteredRadioAltitude = this.radioAltitudeFilter.step(
        this.ownRadioAltitude.value,
        this.props.instrument.deltaTime / 1000,
      );
      this.filteredRadioAltitude.set(filteredRadioAltitude);
    });
  }

  render(): VNode {
    return (
      <DisplayUnit
        failed={this.displayFailed}
        bus={this.props.bus}
        powered={this.displayPowered}
        brightness={this.displayBrightness}
        normDmc={getDisplayIndex()}
      >
        <svg class="hud-svg" version="1.1" viewBox="0 0 1280 1024" xmlns="http://www.w3.org/2000/svg">
          <Horizon
            bus={this.props.bus}
            instrument={this.props.instrument}
            isAttExcessive={this.isAttExcessive}
            filteredRadioAlt={this.filteredRadioAltitude}
          />

          <path
            id="PitchScaleMask"
            class="BackgroundFill"
            d="m 0 0 h 1280 v 1024 h -1280 Z M 1 125 h 1278 v 800 h -1278 Z"
          />

          <g id="TapesMasks">
            <g id="AltTapeMask">
              <path
                ref={this.altTapeRef}
                id="AltitudeTapeMask"
                class="BlackFill"
                d="m1045 322 h 114 v 365 h-114z"
              ></path>
            </g>
            <g id="SpdTapeMask">
              <path
                ref={this.spdTapeOrForcedOnLandRef}
                id="SpeedTapeMask"
                class="BlackFill"
                d="m70 322 h 98 v 365 h-98z"
              ></path>
            </g>
            <g id="CrosswindSpdTapeMask">
              <path
                ref={this.xWindSpdTapeRef}
                id="cwSpdTapeBg"
                class="NormalStroke  BackgroundFill"
                d="m71 128  h 94 v 172 h -94z"
              />
            </g>
          </g>

          <g id="WindIndicator" class="Wind" transform="translate(250 200) " ref={this.windIndicatorRef}>
            <WindIndicator bus={this.props.bus} />
          </g>

          <AltitudeIndicator bus={this.props.bus} />

          <AirspeedIndicator bus={this.props.bus} instrument={this.props.instrument} />

          {/* mask2 speedtape draw limits | mask3 altTape draw limits */}
          <g id="TapesMasks2">
            <path
              id="Mask2Cw"
              class="BackgroundFill"
              ref={this.xWindSpdTapeRef2}
              //d="M 60 0 H 208 V 1024 H 60 Z  M 61 130 v 172h 146 v -172 z"
              d="M 60 0 H 208 V 1024 H 60 Z  M 61 130 v 172h 146 v -172 z"
            />

            <path
              id="Mask2"
              class="BackgroundFill"
              ref={this.spdTapeOrForcedOnLandRef2}
              d="M 60 0 H 208 V 1024 H 60 Z  M 61 323 v 364 h 146 v -364 z"
              // d="M 60 0 H 208 V 1024 H 60 Z  M 61 274 v 364 h 146 v -364 z"
            />
            <path
              id="Mask3"
              ref={this.altTapeRef2}
              d="M 1038 250 h 122 V 720 H 1038 Z  M 1039 323 v 364 h 120 v -364 z"
              // d="M 1038 250 h 122 V 700 H 1038 Z  M 1039 274 v 364 h 120 v -364 z"
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

          <VerticalSpeedIndicator
            bus={this.props.bus}
            instrument={this.props.instrument}
            filteredRadioAltitude={this.filteredRadioAltitude}
          />
          {/* <HeadingOfftape bus={this.props.bus} failed={this.headingFailed} /> */}
          <AltitudeIndicatorOfftape bus={this.props.bus} filteredRadioAltitude={this.filteredRadioAltitude} />
          <LinearDeviationIndicator bus={this.props.bus} />

          <MachNumber bus={this.props.bus} />
          <FMA bus={this.props.bus} isAttExcessive={this.isAttExcessive} />
          <DeclutterIndicator bus={this.props.bus} />
        </svg>
      </DisplayUnit>
    );
  }
}

interface ExtendedHorizonProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
  filteredRadioAlt: Subscribable<number>;
}

class ExtendedHorizon extends DisplayComponent<ExtendedHorizonProps> {
  private pitchGroupRef = FSComponent.createRef<SVGGElement>();
  private rollGroupRef = FSComponent.createRef<SVGGElement>();
  private path = FSComponent.createRef<SVGPathElement>();
  private path2 = FSComponent.createRef<SVGPathElement>();
  private path3 = FSComponent.createRef<SVGPathElement>();
  private extendedAlt = FSComponent.createRef<SVGPathElement>();
  private extendedSpd = FSComponent.createRef<SVGPathElement>();

  private pitch = 0;
  private yOffset = Subject.create(0);

  private xAltTop = Subject.create<String>('');
  private yAltTop = Subject.create<String>('');

  private xSpdTop = Subject.create<String>('');
  private ySpdTop = Subject.create<String>('');

  private spdRollDev = 0;
  private altRollDev = 0;
  private crosswindMode = false;
  private upperBound = 0;
  private lowerBound = 0;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isCaptainSide = getDisplayIndex() === 1;
    const sub = this.props.bus.getArincSubscriber<Arinc429Values & HUDSimvars>();

    sub
      .on(isCaptainSide ? 'crosswindModeL' : 'crosswindModeR')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
      });

    sub.on('rollAr').handle((roll) => {
      const radRoll = (roll.value / 180) * Math.PI;

      //frame of reference 1  air pitch   :F1
      //frame 2  center: airHorizonHeadingBug x: hud horizon :F2
      const D = calculateHorizonOffsetFromPitch(this.pitch);

      let rSign = 1;

      const xPos = -D * Math.sin(radRoll);

      // xposition from frame2 to eval if extention should be drawn
      if (this.crosswindMode == false) {
        this.lowerBound = -6.143;
        this.upperBound = 355;
      } else {
        this.upperBound = -27.143;
        this.lowerBound = -199.143;
      }

      let Lalt = 0;
      let Lspd = 0;

      if (roll.value < 0) {
        if (D * Math.cos(radRoll) > this.lowerBound && D * Math.cos(radRoll) < this.upperBound) {
          Lspd = 472;
          Lalt = 400;
        } else {
          Lalt = 494;
          Lspd = 570;
        }
      } else {
        if (D * Math.cos(radRoll) > this.lowerBound && D * Math.cos(radRoll) < this.upperBound) {
          Lalt = 400;
          Lspd = 472;
        } else {
          Lalt = 494;
          Lspd = 570;
        }
      }
      const xPosF = 640 + (Lalt + xPos) / Math.cos(radRoll);
      const xPosFspd = 640 - (Lspd - xPos) / Math.cos(radRoll);

      if (roll.isNormalOperation()) {
        this.spdRollDev = -(640 - 168) * Math.tan(radRoll);
        this.altRollDev = Lalt * Math.tan(radRoll);
        this.rollGroupRef.instance.style.display = 'block';
        this.rollGroupRef.instance.setAttribute('transform', `rotate(${-roll.value} 640 329.143)`);

        if (roll.value < 0) {
          rSign = -1;
        } else {
          rSign = 1;
        }

        const ax = '640 ';
        const ay = '512 ';
        const bx = '0 ';
        const by = (-D).toString();
        const cx = (640 + xPos * Math.cos(radRoll * rSign)).toString();
        const cy = (512 + xPos * Math.sin(radRoll)).toString();

        const ex = (640 + (Lalt + xPos) * Math.cos(-radRoll)).toString(); //acual eval point
        const ey = (512 + (Lalt + xPos) * Math.sin(radRoll)).toString(); //acual eval point

        const exs = (640 - (Lspd - xPos) * Math.cos(-radRoll)).toString();
        const eys = (512 + (Lspd - xPos) * Math.sin(-radRoll)).toString();

        //vertial offset of eval point from horizon
        let F1AltSideVertDev = Math.sqrt((Number(ex) - xPosF) ** 2 + (Number(ey) - 512) ** 2);
        if (Number(ey) < 512) {
          F1AltSideVertDev *= -1;
        }
        let F1SpdSideVertDev = Math.sqrt((Number(exs) - xPosFspd) ** 2 + (Number(eys) - 512) ** 2);
        if (Number(eys) < 512) {
          F1SpdSideVertDev *= -1;
        }

        // debug eval point pos circles
        this.xAltTop.set(xPosF.toString());
        this.yAltTop.set((512).toString());
        this.xSpdTop.set(xPosFspd.toString());
        this.ySpdTop.set((512).toString());
        // end debug
        //debug draws : toggle .DEBUG to block in styles.scss to show
        this.path.instance.setAttribute('d', `m ${ax} ${ay} l ${bx}  ${by} L ${cx}  ${cy}     z`);
        this.path2.instance.setAttribute('d', `m ${ax} ${ay} L ${ex}  ${ey}  L ${xPosF} 512     z`);
        this.path3.instance.setAttribute('d', `m ${ax} ${ay} L ${exs}  ${eys}  L ${xPosFspd} 512     z`);
        //end debug

        const F1HorizonPitchOffset = D * Math.cos(radRoll);

        if (
          F1HorizonPitchOffset - F1AltSideVertDev > this.lowerBound &&
          F1HorizonPitchOffset - F1AltSideVertDev < this.upperBound
        ) {
          this.extendedAlt.instance.setAttribute('class', 'SmallStroke Green');
          this.extendedAlt.instance.setAttribute('d', ``);
        } else {
          this.extendedAlt.instance.setAttribute('class', 'SmallStroke Green');
          this.extendedAlt.instance.setAttribute('d', `m 640 512 h 1000 `);
        }

        if (
          F1HorizonPitchOffset - F1SpdSideVertDev > this.lowerBound &&
          F1HorizonPitchOffset - F1SpdSideVertDev < this.upperBound
        ) {
          this.extendedSpd.instance.setAttribute('class', 'SmallStroke Green');
          this.extendedSpd.instance.setAttribute('d', ``);
        } else {
          this.extendedSpd.instance.setAttribute('class', 'SmallStroke Green');
          this.extendedSpd.instance.setAttribute('d', `m 640 512 h -1000 `);
        }
        // console.log(
        //     "\nD: "+D +
        //     "\nD cos r: "+D*Math.cos(radRoll) +
        //     "\nF1HorizonPitchOffset-F1SpdSideVertDev: "+t1 +
        //     "\nyPos-F1SpdSideVertDev: "+t2 +
        //     "\nyPos: "+yPos +
        //     "\nF1HorizonPitchOffset: "+F1HorizonPitchOffset +
        //     "\nyroll: "+roll.value +
        //     "\nF1SpdSideVertDev: "+F1SpdSideVertDev
        // );
      } else {
        this.rollGroupRef.instance.style.display = 'none';
      }
    });

    sub.on('pitchAr').handle((pitch) => {
      this.pitch = pitch.value;
      if (pitch.isNormalOperation()) {
        this.pitchGroupRef.instance.style.display = 'block';
        this.pitchGroupRef.instance.style.transform = `translate3d(0px, ${calculateHorizonOffsetFromPitch(pitch.value) - 182.857}px, 0px)`;
        const yOffset = calculateHorizonOffsetFromPitch(pitch.value) - 182.857;
        this.yOffset.set(yOffset);
      }
    });
  }

  render(): VNode {
    // FIXME: What is the tailstrike pitch limit with compressed main landing gear for A320? Assume 11.7 degrees now.
    // FIXME: further fine tune.
    return (
      <g id="ExtendedHorizon">
        <path d="m 0 323 h 1280" class="red DEBUG" />
        <path d="m 0 688 h 1280" class="red DEBUG" />
        <path d="m 0 302 h 1280" class="blue DEBUG" />
        <path d="m 0 130 h 1280" class="blue DEBUG" />
        <path d="m 0 216 h 1280" class="blue DEBUG" />

        <g id="ARollGroup" ref={this.rollGroupRef} style="display:none">
          <g id="APitchGroup" ref={this.pitchGroupRef} class="ScaledStroke">
            <SyntheticRunway bus={this.props.bus} filteredRadioAlt={this.props.filteredRadioAlt} />

            <path ref={this.extendedAlt} id="extendedAlt" d="" class="SmallStroke Green" />
            <path ref={this.extendedSpd} id="extendedSpd" d="" class="SmallStroke Green" />

            {/* debug  */}
            <circle cx={this.xAltTop} cy={this.yAltTop} r="5" class="blue DEBUG" display="block" />
            <circle cx={this.xSpdTop} cy={this.ySpdTop} r="5" class="blue DEBUG" display="block" />
            <circle cx="640" cy="512" r="5" class="blue DEBUG" display="block" />
            <path ref={this.path} d="" class="yellow  DEBUG" />
            <path ref={this.path2} d="" class="yellow DEBUG" />
            <path ref={this.path3} d="" class="yellow DEBUG" />
            {/* debug  */}
          </g>
        </g>
      </g>
    );
  }
}
