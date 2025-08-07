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
  HEvent,
  ConsumerSubject,
  Subscription,
} from '@microsoft/msfs-sdk';
import {
  ArincEventBus,
  Arinc429Register,
  Arinc429Word,
  Arinc429WordData,
  FailuresConsumer,
  Arinc429RegisterSubject,
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
import { HudElems, LagFilter, Grid } from './HUDUtils';
import { HudWarnings } from './HudWarnings';
import { SyntheticRunway } from './SyntheticRunway';
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
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<
    Arinc429Values & ClockEvents & DmcLogicEvents & HUDSimvars & HEvent & HudElems
  >();

  private groundSpeed = 0;
  private onRollout = false;
  private onDecel = false;
  private landSpeed = false;
  private onGround = true;
  private headingFailed = Subject.create(true);

  private displayFailed = Subject.create(false);

  private isAttExcessive = Subject.create(false);

  private pitch: Arinc429WordData = Arinc429Register.empty();

  private roll: Arinc429RegisterSubject = Arinc429RegisterSubject.createEmpty();

  private ownRadioAltitude = new Arinc429Word(0);

  private filteredRadioAltitude = Subject.create(0);

  private radioAltitudeFilter = new LagFilter(5);

  private failuresConsumer;
  private readonly isCaptainSide = getDisplayIndex() === 1;

  constructor(props: HUDProps) {
    super(props);
    this.failuresConsumer = new FailuresConsumer();
  }

  private hudPos = 0;
  private brightness = Subject.create(1);

  private readonly displayPowered = ConsumerSubject.create(this.sub.on(this.isCaptainSide ? 'elec' : 'elecFo'), true);
  private readonly spdTape = ConsumerSubject.create(this.sub.on('spdTape').whenChanged(), '');
  private readonly xWindSpdTape = ConsumerSubject.create(this.sub.on('xWindSpdTape').whenChanged(), '');
  private readonly altTape = ConsumerSubject.create(this.sub.on('altTape').whenChanged(), '');
  private readonly xWindAltTape = ConsumerSubject.create(this.sub.on('xWindAltTape').whenChanged(), '');
  private readonly windIndicator = ConsumerSubject.create(this.sub.on('windIndicator').whenChanged(), '');
  private readonly potentiometerPos = ConsumerSubject.create(
    this.sub.on(this.isCaptainSide ? 'hudPotentiometerCaptain' : 'hudPotentiometerFo').whenChanged(),
    0,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(
      this.displayPowered,
      this.spdTape,
      this.xWindSpdTape,
      this.altTape,
      this.xWindAltTape,
      this.windIndicator,
      this.potentiometerPos,
    );

    this.failuresConsumer.register(this.isCaptainSide ? A320Failure.LeftPfdDisplay : A320Failure.RightPfdDisplay);

    this.subscriptions.push(
      this.sub.on('hEvent').handle((ev) => {
        if (ev === (this.isCaptainSide ? 'A320_Neo_HUD_L_POS' : 'A320_Neo_HUD_R_POS')) {
          this.hudPos === 0 ? (this.hudPos = 1) : (this.hudPos = 0);
          SimVar.SetSimVarValue(`L:${ev}`, 'number', this.hudPos);

          if (this.hudPos === 0) {
            setTimeout(() => {
              this.brightness.set(this.potentiometerPos.get());
            }, 1250);
          } else {
            this.brightness.set(0);
          }
        }
      }),
    );

    this.subscriptions.push(
      this.sub.on('heading').handle((h) => {
        this.headingFailed.set(!h.isNormalOperation());
      }),
    );

    this.subscriptions.push(
      this.sub.on('rollAr').handle((r) => {
        this.roll.setWord(r.rawWord);
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
          //console.log(this.hudPos, this.potentiometerPos.get());
          this.failuresConsumer.update();
          this.displayFailed.set(
            this.failuresConsumer.isActive(
              this.isCaptainSide ? A320Failure.LeftPfdDisplay : A320Failure.RightPfdDisplay,
            ),
          );
          if (
            !this.isAttExcessive.get() &&
            ((this.pitch.isNormalOperation() && (this.pitch.value > 25 || this.pitch.value < -13)) ||
              (this.roll.get().isNormalOperation() && Math.abs(this.roll.get().value) > 45))
          ) {
            this.isAttExcessive.set(true);
          } else if (
            this.isAttExcessive.get() &&
            this.pitch.isNormalOperation() &&
            this.pitch.value < 22 &&
            this.pitch.value > -10 &&
            this.roll.get().isNormalOperation() &&
            Math.abs(this.roll.get().value) < 40
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
      <DisplayUnit
        failed={this.displayFailed}
        bus={this.props.bus}
        powered={this.displayPowered}
        brightness={this.brightness}
        normDmc={getDisplayIndex()}
      >
        <svg class="hud-svg" version="1.1" viewBox="0 0 1280 1024" xmlns="http://www.w3.org/2000/svg">
          <Horizon
            bus={this.props.bus}
            instrument={this.props.instrument}
            isAttExcessive={this.isAttExcessive}
            filteredRadioAlt={this.filteredRadioAltitude}
          />
          <SyntheticRunway bus={this.props.bus} filteredRadioAlt={this.filteredRadioAltitude} />
          <path
            id="PitchScaleMask"
            class="BackgroundFill"
            d="m 0 0 h 1280 v 1024 h -1280 Z M 1 125 h 1278 v 800 h -1278 Z"
          />

          <g id="TapesMasks">
            <path
              display={this.altTape}
              id="AltitudeTapeMask"
              class="BlackFill"
              d="M 1039 320 v 380 h 113 v -380 z"
            ></path>

            <path
              id="CwAltTapeMask"
              display={this.xWindAltTape}
              class="NormalStroke  BackgroundFill"
              d="m1045 284 h 106 v 100 h -106 z"
            />

            <path display={this.spdTape} id="SpeedTapeMask" class="BlackFill" d="m70 322 h 98 v 365 h-98z"></path>

            <path
              display={this.xWindSpdTape}
              id="cwSpdTapeBg"
              class="NormalStroke  BackgroundFill"
              d="m71 242 h 94 v 172 h -94z"
            />
          </g>

          <g id="WindIndicator" class="Wind" transform="translate(250 200) " display={this.windIndicator}>
            <WindIndicator bus={this.props.bus} />
          </g>

          <AltitudeIndicator bus={this.props.bus} />

          <AirspeedIndicator bus={this.props.bus} instrument={this.props.instrument} />

          {/* mask2 speedtape draw limits | mask3 altTape draw limits */}
          <g id="TapesMasks2">
            <path
              id="Mask2"
              class="BackgroundFill"
              display={this.spdTape}
              d="M 60 290 H 190 V 720 H 60 Z  M 61 329 v 363 h 128 v -363 z"
            />
            <path
              id="Mask2Cw"
              class="BackgroundFill"
              display={this.xWindSpdTape}
              d="M 60 210 H 190 V 450 H 60 Z  M 61 241 v 176 h 128 v -176 z"
            />
            <path
              id="Mask3"
              class="BackgroundFill"
              display={this.altTape}
              d="M 1038 280 h 122 V 720 H 1038 Z  M 1039 329 v 363 h 120 v -363 z"
            />

            <path
              id="Mask3Cw"
              class="BackgroundFill"
              display={this.xWindAltTape}
              d="M 1038 250 h 122 v 160h -122 Z  M 1039 283 v 90 h 120 v -90z"
            />
          </g>

          <AttitudeIndicatorFixedCenter
            bus={this.props.bus}
            isAttExcessive={this.isAttExcessive}
            filteredRadioAlt={this.filteredRadioAltitude}
            instrument={this.props.instrument}
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
          <HudWarnings bus={this.props.bus} instrument={this.props.instrument} />
          <Grid bus={this.props.bus} />
        </svg>
      </DisplayUnit>
    );
  }
}
