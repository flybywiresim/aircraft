import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  VNode,
} from '@microsoft/msfs-sdk';
import { deflectionToXOffset } from './HorizontalDeflectionIndicator';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { SDSimvars } from '../../../SDSimvarPublisher';

export enum RudderPosition {
  Upper,
  Lower,
}

interface RudderTrimProps {
  x: number;
  y: number;
  bus: EventBus;
}

export class RudderTrim extends DisplayComponent<RudderTrimProps> {
  private readonly sub = this.props.bus.getSubscriber<SDSimvars>();

  private readonly sec1RudderStatusWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('sec1RudderStatusWord'));

  private readonly sec3RudderStatusWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('sec3RudderStatusWord'));

  private readonly secSourceForTrim = this.sec1RudderStatusWord.map((word) => (word.bitValueOr(28, false) ? 1 : 3));

  private readonly deflectionInfoValid = MappedSubject.create(
    ([sec1RudderStatusWord, sec3RudderStatusWord]) =>
      sec1RudderStatusWord.bitValueOr(28, false) || sec3RudderStatusWord.bitValueOr(28, false),
    this.sec1RudderStatusWord,
    this.sec3RudderStatusWord,
  );

  private readonly rudderTrimAvail = Subject.create(true);

  private readonly rudderTrim = Arinc429LocalVarConsumerSubject.create(null);

  private readonly powerSource1Avail = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`dcEssPowered`),
    false,
  );

  private readonly powerSource2Avail = ConsumerSubject.create(
    this.props.bus.getSubscriber<SDSimvars>().on(`dc1Powered`),
    false,
  );

  private readonly leftRightLabelVisible = MappedSubject.create(
    ([rudderTrim, deflectionInfoValid]) => Math.abs(rudderTrim.valueOr(0)) > 0.05 && deflectionInfoValid,
    this.rudderTrim,
    this.deflectionInfoValid,
  );

  private readonly powerAvailableClass = MappedSubject.create(
    ([powerSource1Avail, powerSource2Avail, rudderTrimAvail]) =>
      (powerSource1Avail || powerSource2Avail) && rudderTrimAvail ? 'Cyan' : 'Amber',
    this.powerSource1Avail,
    this.powerSource2Avail,
    this.rudderTrimAvail,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.secSourceForTrim.sub(
      (source) => this.rudderTrim.setConsumer(this.sub.on(`sec${source}RudderTrimPosition`).atFrequency(10)),
      true,
    );
  }

  render() {
    return (
      <g id="rudder-trim" transform={`translate(${this.props.x} ${this.props.y})`}>
        <text x={70} y={-8} class="F22 White LS1">
          RUD TRIM
        </text>

        <g
          visibility={this.deflectionInfoValid.map((deflectionInfoValid) =>
            deflectionInfoValid ? 'visible' : 'hidden',
          )}
        >
          {/* This is to occlude part of the tail graphic. */}
          <path d="m-5,0 h8 v17 h-8 z" class="BackgroundFill" />

          <path
            d="m0,0 l6,8 l-6,8 l-6,-8 z"
            class={this.powerAvailableClass.map((powerAvailableClass) => `${powerAvailableClass} Fill`)}
            transform={this.rudderTrim.map((rudderTrim) => `translate(${deflectionToXOffset(-rudderTrim.value)} 0)`)}
          />

          <text
            x={72}
            y={17}
            visibility={this.leftRightLabelVisible.map((leftRightLabelVisible) =>
              leftRightLabelVisible ? 'visible' : 'hidden',
            )}
            class={this.powerAvailableClass.map((powerAvailableClass) => `${powerAvailableClass} F22`)}
          >
            {this.rudderTrim.map((rudderTrim) => (Math.sign(rudderTrim.valueOr(0)) === 1 ? 'L' : 'R'))}
          </text>
          <text
            x={159}
            y={17}
            class={this.powerAvailableClass.map((powerAvailableClass) => `${powerAvailableClass} F22 EndAlign`)}
          >
            {this.rudderTrim.map((rudderTrim) => Math.abs(rudderTrim.valueOr(0)).toFixed(1).padStart(4, '\xa0'))}
          </text>
          <text x={159} y={19} class="Cyan F22">
            °
          </text>
        </g>

        <text
          x={94}
          y={17}
          visibility={this.deflectionInfoValid.map((deflectionInfoValid) =>
            !deflectionInfoValid ? 'visible' : 'hidden',
          )}
          class="Amber F22"
        >
          XX
        </text>
        <text
          x={-7}
          y={18}
          visibility={this.deflectionInfoValid.map((deflectionInfoValid) =>
            !deflectionInfoValid ? 'visible' : 'hidden',
          )}
          class="Amber F22"
        >
          X
        </text>
      </g>
    );
  }
}
