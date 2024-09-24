import {
  ConsumerSubject,
  CssTransformBuilder,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { Arinc429ConsumerSubject, Arinc429WordData } from '@flybywiresim/fbw-sdk';
import { calculateHorizonOffsetFromPitch } from './PFDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { PFDSimvars } from './shared/PFDSimvarPublisher';
import { getDisplayIndex } from 'instruments/src/MsfsAvionicsCommon/CdsDisplayUnit';

const DistanceSpacing = 15;
const ValueSpacing = 10;

interface FlightPathVectorData {
  readonly roll: Subscribable<Arinc429WordData>;
  readonly pitch: Subscribable<Arinc429WordData>;
  readonly fpa: Subscribable<Arinc429WordData>;
  readonly da: Subscribable<Arinc429WordData>;
}

// FIXME should get smaller when FD is on
export class FlightPathVector extends DisplayComponent<{ bus: EventBus }> {
  private readonly sub = this.props.bus.getSubscriber<Arinc429Values & PFDSimvars>();

  private readonly isTrkFpaActive = ConsumerSubject.create(this.sub.on('trkFpaActive'), false);
  private readonly isBirdBlack = this.isTrkFpaActive.map(SubscribableMapFunctions.not());

  private readonly isVelocityVectorActive = ConsumerSubject.create(
    this.sub.on(getDisplayIndex() === 2 ? 'fcuRightVelocityVectorOn' : 'fcuLeftVelocityVectorOn'),
    false,
  );

  private readonly data: FlightPathVectorData = {
    roll: Arinc429ConsumerSubject.create(this.sub.on('rollAr')),
    pitch: Arinc429ConsumerSubject.create(this.sub.on('pitchAr')),
    fpa: Arinc429ConsumerSubject.create(this.sub.on('fpa')),
    da: Arinc429ConsumerSubject.create(this.sub.on('da')),
  };

  private readonly isRequested = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.isTrkFpaActive,
    this.isVelocityVectorActive,
  );

  private readonly isDaAndFpaValid = MappedSubject.create(
    ([da, fpa]) => da.isNormalOperation() && fpa.isNormalOperation(),
    this.data.da,
    this.data.fpa,
  );
  private readonly isRollAndPitchValid = MappedSubject.create(
    ([roll, pitch]) => roll.isNormalOperation() && pitch.isNormalOperation(),
    this.data.roll,
    this.data.pitch,
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

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const moveBirdSub = MappedSubject.create(this.data.roll, this.data.pitch, this.data.fpa, this.data.da).sub(
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
    const daLimConv = (Math.max(Math.min(this.data.da.get().value, 21), -21) * DistanceSpacing) / ValueSpacing;
    const pitchSubFpaConv =
      calculateHorizonOffsetFromPitch(this.data.pitch.get().value) -
      calculateHorizonOffsetFromPitch(this.data.fpa.get().value);
    const rollCos = Math.cos((this.data.roll.get().value * Math.PI) / 180);
    const rollSin = Math.sin((-this.data.roll.get().value * Math.PI) / 180);

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
                // eslint-disable-next-line max-len
                d="m17.766 15.501c8.59e-4 -1.2531-1.0142-2.2694-2.2665-2.2694-1.2524 0-2.2674 1.0163-2.2665 2.2694-8.57e-4 1.2531 1.0142 2.2694 2.2665 2.2694 1.2524 0 2.2674-1.0163 2.2665-2.2694z"
              />
              <path
                class={{
                  ThickOutline: true,
                  White: this.isBirdBlack,
                }}
                d="m17.766 15.501h5.0367m-9.5698 0h-5.0367m7.3033-2.2678v-2.5199"
              />
              <path
                class={{
                  NormalStroke: true,
                  Green: this.isTrkFpaActive,
                  Black: this.isBirdBlack,
                }}
                // eslint-disable-next-line max-len
                d="m17.766 15.501c8.59e-4 -1.2531-1.0142-2.2694-2.2665-2.2694-1.2524 0-2.2674 1.0163-2.2665 2.2694-8.57e-4 1.2531 1.0142 2.2694 2.2665 2.2694 1.2524 0 2.2674-1.0163 2.2665-2.2694z"
              />
              <path
                class={{
                  ThickStroke: true,
                  Green: this.isTrkFpaActive,
                  Black: this.isBirdBlack,
                }}
                d="m17.766 15.501h5.0367m-9.5698 0h-5.0367m7.3033-2.2678v-2.5199"
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
