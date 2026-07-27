// @ts-strict-ignore
import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { Arinc429LocalVarConsumerSubject, Arinc429Word } from '@flybywiresim/fbw-sdk';
import { FlightPathVector } from './FlightPathVector';
import { Arinc429Values } from './shared/ArincValueProvider';
import { PFDSimvars } from './shared/PFDSimvarPublisher';
import { SelectedFdEvents } from './shared/FdSelectionProvider';
import { PrimFgBusBaseEvents } from '@shared/publishers/PrimFgPublisher';
import { FlashOneHertz } from '../MsfsAvionicsCommon/FlashingElementUtils';
import { FcdcBusEvents } from '@shared/publishers/FcdcPublisher';

interface AttitudeIndicatorFixedUpperProps {
  readonly bus: EventBus;
}

export class AttitudeIndicatorFixedUpper extends DisplayComponent<AttitudeIndicatorFixedUpperProps> {
  private readonly sub = this.props.bus.getSubscriber<Arinc429Values & FcdcBusEvents>();

  private roll = new Arinc429Word(0);

  private pitch = new Arinc429Word(0);

  private visibilitySub = Subject.create('hidden');

  private readonly fcdc1DiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_1_1'));

  private readonly fcdc2DiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_1_2'));

  private readonly isNormalLawActive = MappedSubject.create(
    ([fcdc1DiscreteWord1, fcdc2DiscreteWord1]) =>
      fcdc1DiscreteWord1.bitValueOr(11, false) || fcdc2DiscreteWord1.bitValueOr(11, false),
    this.fcdc1DiscreteWord1,
    this.fcdc2DiscreteWord1,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub.on('rollAr').handle((roll) => {
      this.roll = roll;
      if (!this.roll.isNormalOperation()) {
        this.visibilitySub.set('hidden');
      } else {
        this.visibilitySub.set('visible');
      }
    });

    this.sub.on('pitchAr').handle((pitch) => {
      this.pitch = pitch;
      if (!this.pitch.isNormalOperation()) {
        this.visibilitySub.set('hidden');
      } else {
        this.visibilitySub.set('visible');
      }
    });
  }

  render(): VNode {
    return (
      <g id="AttitudeUpperInfoGroup" visibility={this.visibilitySub}>
        <g
          id="RollProtGroup"
          class="SmallStroke Green"
          style={{ display: this.isNormalLawActive.map((nl) => (nl ? 'block' : 'none')) }}
        >
          <path id="RollProtRight" d="m105.64 62.887 1.5716-0.8008m-1.5716-0.78293 1.5716-0.8008" />
          <path id="RollProtLeft" d="m32.064 61.303-1.5716-0.8008m1.5716 2.3845-1.5716-0.8008" />
        </g>
        <g
          id="RollProtLost"
          class="NormalStroke Amber"
          style={{ display: this.isNormalLawActive.map((nl) => (!nl ? 'block' : 'none')) }}
        >
          <path id="RollProtLostRight" d="m107.77 60.696-1.7808 1.7818m1.7808 0-1.7808-1.7818" />
          <path id="RollProtLostLeft" d="m30.043 62.478 1.7808-1.7818m-1.7808 0 1.7808 1.7818" />
        </g>
        <g class="SmallStroke White">
          <path d="m98.645 51.067 2.8492-2.8509" />
          <path d="m39.168 51.067-2.8492-2.8509" />
          <path d="m90.858 44.839a42.133 42.158 0 0 0-43.904 0" />
          <path d="m89.095 43.819 1.8313-3.1738 1.7448 1.0079-1.8313 3.1738" />
          <path d="m84.259 41.563 0.90817-2.4967-1.8932-0.68946-0.90818 2.4966" />
          <path d="m75.229 39.142 0.46109-2.6165 1.9841 0.35005-0.46109 2.6165" />
          <path d="m60.6 39.492-0.46109-2.6165 1.9841-0.35005 0.46109 2.6165" />
          <path d="m53.553 41.563-0.90818-2.4967 0.9466-0.34474 0.9466-0.34472 0.90818 2.4966" />
          <path d="m46.973 44.827-1.8313-3.1738 1.7448-1.0079 1.8313 3.1738" />
        </g>
        <path class="NormalStroke Yellow CornerRound" d="m68.906 38.650-2.5184-3.7000h5.0367l-2.5184 3.7000" />
      </g>
    );
  }
}

interface AttitudeIndicatorFixedCenterProps {
  bus: EventBus;
  isAttExcessive: Subscribable<boolean>;
}

export class AttitudeIndicatorFixedCenter extends DisplayComponent<AttitudeIndicatorFixedCenterProps> {
  private roll = new Arinc429Word(0);

  private pitch = new Arinc429Word(0);

  private visibilitySub = Subject.create('hidden');

  private failureVis = Subject.create('hidden');

  private fdVisibilitySub = Subject.create('hidden');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values>();

    sub.on('rollAr').handle((r) => {
      this.roll = r;
      if (!this.roll.isNormalOperation()) {
        this.visibilitySub.set('display:none');
        this.failureVis.set('display:block');
        this.fdVisibilitySub.set('display:none');
      } else {
        this.visibilitySub.set('display:inline');
        this.failureVis.set('display:none');
        if (!this.props.isAttExcessive.get()) {
          this.fdVisibilitySub.set('display:inline');
        }
      }
    });

    sub.on('pitchAr').handle((p) => {
      this.pitch = p;

      if (!this.pitch.isNormalOperation()) {
        this.visibilitySub.set('display:none');
        this.failureVis.set('display:block');
        this.fdVisibilitySub.set('display:none');
      } else {
        this.visibilitySub.set('display:inline');
        this.failureVis.set('display:none');
        if (!this.props.isAttExcessive.get()) {
          this.fdVisibilitySub.set('display:inline');
        }
      }
    });

    this.props.isAttExcessive.sub((a) => {
      if (a) {
        this.fdVisibilitySub.set('display:none');
      } else if (this.roll.isNormalOperation() && this.pitch.isNormalOperation()) {
        this.fdVisibilitySub.set('display:inline');
      }
    });

    sub.on('da').handle(() => {
      this.props;
    });
  }

  render(): VNode {
    return (
      <>
        <text
          style={this.failureVis}
          id="AttFailText"
          class="Blink9Seconds FontLargest Red EndAlign"
          x="75.893127"
          y="83.136955"
        >
          ATT
        </text>
        <g id="AttitudeSymbolsGroup" style={this.visibilitySub}>
          <SidestickIndicator bus={this.props.bus} />
          <path class="BlackFill" d="m67.647 82.083v-2.5198h2.5184v2.5198z" />

          <FlightPathVector bus={this.props.bus} />

          <g style={this.fdVisibilitySub}>
            <FDYawBar bus={this.props.bus} />
            <FlightDirector bus={this.props.bus} />
          </g>

          <path class="NormalOutline" d="m67.647 82.083v-2.5198h2.5184v2.5198z" />
          <path class="NormalStroke Yellow" d="m67.647 82.083v-2.5198h2.5184v2.5198z" />
          <g class="NormalOutline">
            <path d="m88.55 86.114h2.5184v-4.0317h12.592v-2.5198h-15.11z" />
            <path d="m34.153 79.563h15.11v6.5516h-2.5184v-4.0317h-12.592z" />
          </g>
          <g id="FixedAircraftReference" class="NormalStroke Yellow BlackFill">
            <path d="m88.55 86.114h2.5184v-4.0317h12.592v-2.5198h-15.11z" />
            <path d="m34.153 79.563h15.11v6.5516h-2.5184v-4.0317h-12.592z" />
          </g>
        </g>
      </>
    );
  }
}

class FDYawBar extends DisplayComponent<{ bus: EventBus }> {
  private readonly sub = this.props.bus.getSubscriber<SelectedFdEvents>();

  private fdYawCommand = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_yaw_fd_command'));

  private fdActive = ConsumerSubject.create(this.sub.on('fd_engaged'), false);

  private readonly transform = this.fdYawCommand.map((word) => {
    const offset = -Math.max(Math.min(word.value, 45), -45) * 0.44;

    return `translate3d(${offset}px, 0px, 0px)`;
  });

  private readonly visibility = MappedSubject.create(
    ([fdActive, fdYawCommand]) => {
      const visible = fdActive && !(fdYawCommand.isNoComputedData() || fdYawCommand.isFailureWarning());

      return visible ? 'inherit' : 'hidden';
    },
    this.fdActive,
    this.fdYawCommand,
  );

  render(): VNode {
    return (
      <path
        id="GroundYawSymbol"
        style={{ transform: this.transform }}
        visibility={this.visibility}
        class="NormalStroke Green"
        d="m67.899 82.536v13.406h2.0147v-13.406l-1.0074-1.7135z"
      />
    );
  }
}

class FlightDirector extends DisplayComponent<{ bus: EventBus }> {
  private readonly sub = this.props.bus.getSubscriber<SelectedFdEvents & PrimFgBusBaseEvents & PFDSimvars>();

  private readonly fdRollCommand = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_roll_fd_command'));

  private readonly fdPitchCommand = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_pitch_fd_command'));

  private readonly fdYawCommand = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_yaw_fd_command'));

  private readonly primFgDiscreteWord5 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_5'));

  private readonly fdActive = ConsumerSubject.create(this.sub.on('fd_engaged'), false);

  private readonly leftMainGearCompressed = ConsumerSubject.create(this.sub.on('leftMainGearCompressed'), false);

  private readonly rightMainGearCompressed = ConsumerSubject.create(this.sub.on('leftMainGearCompressed'), false);

  private readonly onGround = MappedSubject.create(
    ([leftMainGearCompressed, rightMainGearCompressed]) => leftMainGearCompressed || rightMainGearCompressed,
    this.leftMainGearCompressed,
    this.rightMainGearCompressed,
  );

  private readonly lateralShouldFlash = this.primFgDiscreteWord5.map((word) => word.bitValueOr(27, false));

  private readonly longitudinalShouldFlash = this.primFgDiscreteWord5.map((word) => word.bitValueOr(26, false));

  private readonly rollTransform = this.fdRollCommand.map((word) => {
    const offset = Math.min(Math.max(word.value, -45), 45) * 0.44;

    return `translate3d(${offset}px, 0px, 0px)`;
  });

  private readonly lateralVisible = MappedSubject.create(
    ([fdActive, fdRollCommand]) => fdActive && !(fdRollCommand.isNoComputedData() || fdRollCommand.isFailureWarning()),
    this.fdActive,
    this.fdRollCommand,
  );

  private readonly pitchTransform = this.fdPitchCommand.map((word) => {
    const offset = Math.min(Math.max(word.value, -22.5), 22.5) * 0.89;

    return `translate3d(0px, ${offset}px, 0px)`;
  });

  private readonly longitudinalVisible = MappedSubject.create(
    ([fdActive, fdPitchCommand]) =>
      fdActive && !(fdPitchCommand.isNoComputedData() || fdPitchCommand.isFailureWarning()),
    this.fdActive,
    this.fdPitchCommand,
  );

  private readonly fdFlagVisible = MappedSubject.create(
    ([fdActive, fdPitchCommand, fdRollCommand, fdYawCommand, onGround]) =>
      fdActive &&
      (fdRollCommand.isFailureWarning() ||
        fdPitchCommand.isFailureWarning() ||
        (fdYawCommand.isFailureWarning() && onGround)),
    this.fdActive,
    this.fdPitchCommand,
    this.fdRollCommand,
    this.fdYawCommand,
    this.onGround,
  );

  render(): VNode | null {
    return (
      <g>
        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={Infinity}
          visible={this.lateralVisible}
          flashing={this.lateralShouldFlash}
        >
          <path style={{ transform: this.rollTransform }} class="ThickOutline" d="m68.903 61.672v38.302" />
        </FlashOneHertz>

        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={Infinity}
          visible={this.longitudinalVisible}
          flashing={this.longitudinalShouldFlash}
        >
          <path style={{ transform: this.pitchTransform }} class="ThickOutline" d="m49.263 80.823h39.287" />
        </FlashOneHertz>

        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={Infinity}
          visible={this.lateralVisible}
          flashing={this.lateralShouldFlash}
        >
          <path
            style={{ transform: this.rollTransform }}
            class="ThickStroke Green"
            id="FlightDirectorRoll"
            d="m68.903 61.672v38.302"
          />
        </FlashOneHertz>

        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={Infinity}
          visible={this.longitudinalVisible}
          flashing={this.longitudinalShouldFlash}
        >
          <path
            style={{ transform: this.pitchTransform }}
            class="ThickStroke Green"
            id="FlightDirectorPitch"
            d="m49.263 80.823h39.287"
          />
        </FlashOneHertz>

        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.fdFlagVisible}>
          <text id="FDFlag" x="52.702862" y="56.065434" class="FontLargest EndAlign Red">
            FD
          </text>
        </FlashOneHertz>
      </g>
    );
  }
}

class SidestickIndicator extends DisplayComponent<{ bus: EventBus }> {
  private sideStickX = 0;

  private sideStickY = 0;

  private leftGearcompressed = true;

  private rightGearCompressed = true;

  private crossHairRef = FSComponent.createRef<SVGPathElement>();

  private onGroundForVisibility = Subject.create('visible');

  private engOneRunning = false;

  private engTwoRunning = false;

  private engThreeRunning = false;

  private engFourRunning = false;

  private handleSideStickIndication() {
    const onGround = this.leftGearcompressed || this.rightGearCompressed;
    const oneEngineRunning = this.engOneRunning || this.engTwoRunning || this.engThreeRunning || this.engFourRunning;

    if (onGround && oneEngineRunning) {
      this.onGroundForVisibility.set('visible');
      this.crossHairRef.instance.style.transform = `translate3d(${this.sideStickX}px, ${this.sideStickY}px, 0px)`;
    } else {
      this.onGroundForVisibility.set('hidden');
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.leftGearcompressed = g;
        this.handleSideStickIndication();
      });

    sub
      .on('rightMainGearCompressed')
      .whenChanged()
      .handle((g) => {
        this.rightGearCompressed = g;
        this.handleSideStickIndication();
      });

    sub
      .on('sideStickX')
      .whenChanged()
      .handle((x) => {
        this.sideStickX = x * 29.56;
        this.handleSideStickIndication();
      });

    sub
      .on('sideStickY')
      .whenChanged()
      .handle((y) => {
        this.sideStickY = -y * 23.02;
        this.handleSideStickIndication();
      });

    sub
      .on('engOneRunning')
      .whenChanged()
      .handle((e) => {
        this.engOneRunning = e;
        this.handleSideStickIndication();
      });

    sub
      .on('engTwoRunning')
      .whenChanged()
      .handle((e) => {
        this.engTwoRunning = e;
        this.handleSideStickIndication();
      });

    sub
      .on('engThreeRunning')
      .whenChanged()
      .handle((e) => {
        this.engThreeRunning = e;
        this.handleSideStickIndication();
      });

    sub
      .on('engFourRunning')
      .whenChanged()
      .handle((e) => {
        this.engFourRunning = e;
        this.handleSideStickIndication();
      });
  }

  render(): VNode {
    return (
      <g id="GroundCursorGroup" class="NormalStroke White" visibility={this.onGroundForVisibility}>
        <path
          id="GroundCursorBorders"
          d="m92.327 103.75h6.0441v-6.0476m-58.93 0v6.0476h6.0441m46.842-45.861h6.0441v6.0476m-58.93 0v-6.0476h6.0441"
        />
        <path
          ref={this.crossHairRef}
          id="GroundCursorCrosshair"
          d="m73.994 81.579h-4.3316v4.3341m-5.8426-4.3341h4.3316v4.3341m5.8426-5.846h-4.3316v-4.3341m-5.8426 4.3341h4.3316v-4.3341"
        />
      </g>
    );
  }
}
