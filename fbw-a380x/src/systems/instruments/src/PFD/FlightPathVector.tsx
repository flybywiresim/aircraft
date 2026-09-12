// @ts-strict-ignore
import {
  ConsumerSubject,
  CssTransformBuilder,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { Arinc429ConsumerSubject, Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { calculateHorizonOffsetFromPitch } from './PFDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { getDisplayIndex } from './PFD';
import { FcuEfisCpBusEvents } from '@shared/publishers/EfisCpBusPublisher';
import { PrimFgBusBaseEvents } from '@shared/publishers/PrimFgPublisher';
import { SelectedFdEvents } from './shared/FdSelectionProvider';

const DistanceSpacing = 15;
const ValueSpacing = 10;

export class FlightPathVector extends DisplayComponent<{ bus: EventBus }> {
  private static readonly BIRD_CIRCLE = 'm17.75 15.5 a2.25 2.25 0 1 0 -4.5 0 a2.25 2.25 0 1 0 4.5 0';
  private static readonly BIRD_WINGS = 'm17.75 15.5 h5 m-9.5 0 h-5 m7.25 -2.25 v-2';

  private static readonly BIRD_CIRCLE_SMALL = 'm17 15.5 a1.5 1.5 0 1 0 -3 0 a1.5 1.5 0 1 0 3 0';
  private static readonly BIRD_WINGS_SMALL = 'm17 15.5 h2.5 m-5.5 0 h-2.5 m4 -1.5 v-1.5';

  private readonly sub = this.props.bus.getSubscriber<
    Arinc429Values & PrimFgBusBaseEvents & FcuEfisCpBusEvents & SelectedFdEvents
  >();

  private readonly fcuEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(null);

  private primFgDiscreteWord5 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_5'));

  private readonly fdEngaged = ConsumerSubject.create(this.sub.on('fd_engaged'), false);

  private readonly isTrkFpaActive = this.primFgDiscreteWord5.map((word) => word.bitValueOr(11, true));
  private readonly isBirdBlack = this.isTrkFpaActive.map(SubscribableMapFunctions.not());

  private readonly isVelocityVectorActive = this.fcuEisDiscreteWord2.map((word) => word.bitValueOr(15, true));

  private readonly roll = Arinc429ConsumerSubject.create(this.sub.on('rollAr'));
  private readonly pitch = Arinc429ConsumerSubject.create(this.sub.on('pitchAr'));
  private readonly fpa = Arinc429ConsumerSubject.create(this.sub.on('fpa'));
  private readonly da = Arinc429ConsumerSubject.create(this.sub.on('da'));

  private readonly isRequested = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.isTrkFpaActive,
    this.isVelocityVectorActive,
  );

  private readonly isDaAndFpaValid = MappedSubject.create(
    ([da, fpa]) => da.isNormalOperation() && fpa.isNormalOperation(),
    this.da,
    this.fpa,
  );
  private readonly isRollAndPitchValid = MappedSubject.create(
    ([roll, pitch]) => roll.isNormalOperation() && pitch.isNormalOperation(),
    this.roll,
    this.pitch,
  );

  private readonly isBirdHidden = MappedSubject.create(
    ([isReq, isValid]) => !isReq || !isValid,
    this.isRequested,
    this.isDaAndFpaValid,
  );

  private readonly isFailureFlagHidden = MappedSubject.create(
    ([isRequested, isDaAndFpaValid, isRollAndPitchValid]) => !isRequested || isDaAndFpaValid || !isRollAndPitchValid,
    this.isRequested,
    this.isDaAndFpaValid,
    this.isRollAndPitchValid,
  );

  private readonly birdTransformBuilder = CssTransformBuilder.translate3d('px');
  private readonly birdTransform = Subject.create(this.birdTransformBuilder.resolve());

  private readonly birdCirclePath = this.fdEngaged.map((fdEngaged) =>
    fdEngaged ? FlightPathVector.BIRD_CIRCLE_SMALL : FlightPathVector.BIRD_CIRCLE,
  );

  private readonly birdWingsPath = this.fdEngaged.map((fdEngaged) =>
    fdEngaged ? FlightPathVector.BIRD_WINGS_SMALL : FlightPathVector.BIRD_WINGS,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isFo = getDisplayIndex() === 2;

    this.fcuEisDiscreteWord2.setConsumer(
      this.sub.on(isFo ? 'fcu_efis_r_discrete_word_2' : 'fcu_efis_l_discrete_word_2'),
    );

    const moveBirdSub = MappedSubject.create(this.roll, this.pitch, this.fpa, this.da).sub(
      this.moveBird.bind(this),
      true,
      true,
    );

    this.isBirdHidden.sub((isHidden) => {
      if (isHidden) {
        moveBirdSub.pause();
      } else {
        moveBirdSub.resume(true);
      }
    }, true);
  }

  private moveBird() {
    const daLimConv = (Math.max(Math.min(this.da.get().value, 21), -21) * DistanceSpacing) / ValueSpacing;
    const pitchSubFpaConv =
      calculateHorizonOffsetFromPitch(this.pitch.get().value) - calculateHorizonOffsetFromPitch(this.fpa.get().value);
    const rollCos = Math.cos((this.roll.get().value * Math.PI) / 180);
    const rollSin = Math.sin((-this.roll.get().value * Math.PI) / 180);

    const xOffset = daLimConv * rollCos - pitchSubFpaConv * rollSin;
    const yOffset = pitchSubFpaConv * rollCos + daLimConv * rollSin;

    this.birdTransformBuilder.set(xOffset, yOffset, 0, 0.01, 0.01);
    this.birdTransform.set(this.birdTransformBuilder.resolve());
  }

  render(): VNode {
    return (
      <>
        <g
          id="bird"
          style={{
            transform: this.birdTransform,
          }}
          class={{
            HiddenElement: this.isBirdHidden,
          }}
        >
          <svg
            x="53.4"
            y="65.3"
            width="31px"
            height="31px"
            version="1.1"
            viewBox="0 0 31 31"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <path
                class={{
                  NormalOutline: true,
                  White: this.isBirdBlack,
                }}
                d={this.birdCirclePath}
              />
              <path
                class={{
                  NormalOutline: true,
                  White: this.isBirdBlack,
                }}
                d={this.birdWingsPath}
              />
              <path
                class={{
                  NormalStroke: true,
                  Green: this.isTrkFpaActive,
                  Black: this.isBirdBlack,
                }}
                d={this.birdCirclePath}
              />
              <path
                class={{
                  NormalStroke: true,
                  Green: this.isTrkFpaActive,
                  Black: this.isBirdBlack,
                }}
                d={this.birdWingsPath}
              />
            </g>
          </svg>
        </g>
        <text
          id="FPVFlag"
          x="62.987099"
          y="89.42025"
          class={{
            HiddenElement: this.isFailureFlagHidden,
            Blink9Seconds: true,
            FontLargest: true,
            Red: true,
            EndAlign: true,
          }}
        >
          FPV
        </text>
      </>
    );
  }
}
