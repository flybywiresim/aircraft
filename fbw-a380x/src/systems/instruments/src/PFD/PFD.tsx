import { A380Failure } from '@flybywiresim/failures';
import {
  ClockEvents,
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  Subject,
  VNode,
} from '@microsoft/msfs-sdk';
import { LowerArea } from 'instruments/src/PFD/LowerArea';
import { Arinc429Word, ArincEventBus, FailuresConsumer } from '@flybywiresim/fbw-sdk';

import { AttitudeIndicatorWarnings } from '@flybywiresim/pfd';
import { AttitudeIndicatorWarningsA380 } from 'instruments/src/PFD/AttitudeIndicatorWarningsA380';
import { LinearDeviationIndicator } from 'instruments/src/PFD/LinearDeviationIndicator';
import { CdsDisplayUnit, DisplayUnitID } from '../MsfsAvionicsCommon/CdsDisplayUnit';
import { LagFilter } from './PFDUtils';
import { Arinc429Values } from './shared/ArincValueProvider';
import { AltitudeIndicator, AltitudeIndicatorOfftape } from './AltitudeIndicator';
import { AttitudeIndicatorFixedCenter, AttitudeIndicatorFixedUpper } from './AttitudeIndicatorFixed';
import { FMA } from './FMA';
import { HeadingOfftape, HeadingTape } from './HeadingIndicator';
import { Horizon } from './AttitudeIndicatorHorizon';
import { LandingSystem } from './LandingSystemIndicator';
import { AirspeedIndicator, AirspeedIndicatorOfftape, MachNumber } from './SpeedIndicator';
import { VerticalSpeedIndicator } from './VerticalSpeedIndicator';

import './style.scss';
import { PitchTrimDisplay } from 'instruments/src/PFD/PitchTrimDisplay';
import { PFDSimvars } from 'instruments/src/PFD/shared/PFDSimvarPublisher';

export const getDisplayIndex = () => {
  const url = Array.from(document.querySelectorAll('vcockpit-panel > *'))
    .find((it) => it.tagName.toLowerCase() !== 'wasm-instrument')
    .getAttribute('url');

  const duId = url ? parseInt(url.substring(url.length - 1), 10) : -1;

  switch (duId) {
    case 0:
      return 1;
    case 3:
      return 2;
    default:
      return 0;
  }
};

interface PFDProps extends ComponentProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
}

export class PFDComponent extends DisplayComponent<PFDProps> {
  private sub = this.props.bus.getSubscriber<Arinc429Values & ClockEvents & PFDSimvars>();

  private headingFailed = Subject.create(true);

  private displayFailed = Subject.create(false);

  private isAttExcessive = Subject.create(false);

  private pitch = new Arinc429Word(0);

  private roll = new Arinc429Word(0);

  private ownRadioAltitude = new Arinc429Word(0);

  private filteredRadioAltitude = Subject.create(0);

  private radioAltitudeFilter = new LagFilter(5);

  private failuresConsumer;

  private readonly groundSpeed = ConsumerSubject.create(this.sub.on('groundSpeed').whenChanged(), 0);

  private readonly spoilersArmed = ConsumerSubject.create(this.sub.on('spoilersArmed').whenChanged(), false);

  private readonly thrustTla = ConsumerSubject.create(this.sub.on('tla1').whenChanged(), 0);

  private previousFlapHandlePosition = 0;

  private readonly pitchTrimIndicatorVisible = Subject.create(false);

  private updatePitchTrimVisible(flapsRetracted = false) {
    const gs = new Arinc429Word(this.groundSpeed.get()).valueOr(0);
    if (this.filteredRadioAltitude.get() > 50) {
      this.pitchTrimIndicatorVisible.set(false);
    } else if (gs < 30) {
      this.pitchTrimIndicatorVisible.set(true);
    } else if (gs < 80 && (this.spoilersArmed.get() === false || flapsRetracted === true || this.thrustTla.get() > 5)) {
      // FIXME add "flight crew presses pitch trim switches"
      this.pitchTrimIndicatorVisible.set(true);
    }
  }

  constructor(props: PFDProps) {
    super(props);
    this.failuresConsumer = new FailuresConsumer('A32NX');
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.failuresConsumer.register(getDisplayIndex() === 1 ? A380Failure.LeftPfdDisplay : A380Failure.RightPfdDisplay);

    this.sub.on('headingAr').handle((h) => {
      if (this.headingFailed.get() !== h.isNormalOperation()) {
        this.headingFailed.set(!h.isNormalOperation());
      }
    });

    this.sub.on('rollAr').handle((r) => {
      this.roll = r;
    });

    this.sub.on('pitchAr').handle((p) => {
      this.pitch = p;
    });

    this.sub
      .on('realTime')
      .atFrequency(1)
      .handle((_t) => {
        this.failuresConsumer.update();
        this.displayFailed.set(
          this.failuresConsumer.isActive(
            getDisplayIndex() === 1 ? A380Failure.LeftPfdDisplay : A380Failure.RightPfdDisplay,
          ),
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

    this.sub.on('chosenRa').handle((ra) => {
      this.ownRadioAltitude = ra;
      const filteredRadioAltitude = this.radioAltitudeFilter.step(
        this.ownRadioAltitude.value,
        this.props.instrument.deltaTime / 1000,
      );
      this.filteredRadioAltitude.set(filteredRadioAltitude);
      this.updatePitchTrimVisible();
    });

    this.sub
      .on('flapHandleIndex')
      .whenChanged()
      .handle((fh) => {
        if (this.previousFlapHandlePosition > fh) {
          this.updatePitchTrimVisible(true);
        }
        this.previousFlapHandlePosition = fh;
      });

    this.groundSpeed.sub(() => this.updatePitchTrimVisible());
    this.spoilersArmed.sub(() => this.updatePitchTrimVisible());
  }

  render(): VNode {
    return (
      <CdsDisplayUnit
        bus={this.props.bus}
        displayUnitId={DisplayUnitID.CaptPfd}
        test={Subject.create(-1)}
        failed={Subject.create(false)}
      >
        <svg
          class="pfd-svg"
          version="1.1"
          viewBox="0 0 158.75 211.6"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
        >
          <Horizon
            bus={this.props.bus}
            instrument={this.props.instrument}
            isAttExcessive={this.isAttExcessive}
            filteredRadioAlt={this.filteredRadioAltitude}
          />
          <AttitudeIndicatorFixedCenter bus={this.props.bus} isAttExcessive={this.isAttExcessive} />
          <path
            id="Mask1"
            class="BackgroundFill"
            // eslint-disable-next-line max-len
            d="m 32.138 101.25 c 7.4164 13.363 21.492 21.652 36.768 21.652 c 15.277 0 29.352 -8.2886 36.768 -21.652 v -40.859 c -7.4164 -13.363 -21.492 -21.652 -36.768 -21.652 c -15.277 0 -29.352 8.2886 -36.768 21.652 z m -32.046 110.498 h 158.66 v -211.75 h -158.66 z"
          />
          <HeadingTape bus={this.props.bus} failed={this.headingFailed} />
          <AltitudeIndicator bus={this.props.bus} />
          <AirspeedIndicator bus={this.props.bus} instrument={this.props.instrument} />
          <path
            id="Mask2"
            class="BackgroundFill"
            // eslint-disable-next-line max-len
            d="m 32.138 145.34 h 73.536 v 10.382 h -73.536 z m 0 -44.092 c 7.4164 13.363 21.492 21.652 36.768 21.652 c 15.277 0 29.352 -8.2886 36.768 -21.652 v -40.859 c -7.4164 -13.363 -21.492 -21.652 -36.768 -21.652 c -15.277 0 -29.352 8.2886 -36.768 21.652 z m -32.046 110.498 h 158.66 v -211.746 h -158.66 z m 115.14 -88.191 v -85.473 h 20.344 v 85.473 z m -113.33 0 v -85.473 h 27.548 v 85.473 z"
          />
          <AirspeedIndicatorOfftape bus={this.props.bus} />

          <LandingSystem bus={this.props.bus} instrument={this.props.instrument} />
          <AttitudeIndicatorFixedUpper bus={this.props.bus} />
          <AttitudeIndicatorWarnings bus={this.props.bus} instrument={this.props.instrument} />
          <AttitudeIndicatorWarningsA380 bus={this.props.bus} instrument={this.props.instrument} />
          <VerticalSpeedIndicator
            bus={this.props.bus}
            instrument={this.props.instrument}
            filteredRadioAltitude={this.filteredRadioAltitude}
          />
          <HeadingOfftape bus={this.props.bus} failed={this.headingFailed} />
          <AltitudeIndicatorOfftape bus={this.props.bus} filteredRadioAltitude={this.filteredRadioAltitude} />
          <LinearDeviationIndicator bus={this.props.bus} />

          <MachNumber bus={this.props.bus} />
          <FMA bus={this.props.bus} isAttExcessive={this.isAttExcessive} />

          <LowerArea bus={this.props.bus} pitchTrimIndicatorVisible={this.pitchTrimIndicatorVisible} />
        </svg>
        <PitchTrimDisplay bus={this.props.bus} visible={this.pitchTrimIndicatorVisible} />
      </CdsDisplayUnit>
    );
  }
}
