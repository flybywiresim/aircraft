import { DisplayComponent, EventBus, FSComponent, MappedSubject } from '@microsoft/msfs-sdk';
import { deflectionToXOffset } from './HorizontalDeflectionIndicator';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { FcdcBusBaseEvents } from '@shared/publishers/FcdcPublisher';

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
  private readonly sub = this.props.bus.getSubscriber<FcdcBusBaseEvents>();

  private readonly fcdcDiscreteWord9 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_9'));

  private readonly fcdcRudderTrimPosition = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('fcdc_rudder_trim_position_deg'),
  );

  private readonly deflectionInfoValid = this.fcdcRudderTrimPosition.map((word) => !word.isInvalid());

  private readonly rudderTrimAvail = this.fcdcDiscreteWord9.map(
    (word) => word.bitValueOr(13, false) || word.bitValueOr(14, false),
  );

  private readonly leftRightLabelVisible = MappedSubject.create(
    ([rudderTrim, deflectionInfoValid]) => Math.abs(rudderTrim.valueOr(0)) > 0.05 && deflectionInfoValid,
    this.fcdcRudderTrimPosition,
    this.deflectionInfoValid,
  );

  private readonly powerAvailableClass = this.rudderTrimAvail.map((rudderTrimAvail) =>
    rudderTrimAvail ? 'Cyan' : 'Amber',
  );

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
          <path d="m-10,0 h20 v17 h-20 z" class="BackgroundFill" />

          <path
            d="m0,0 l6,8 l-6,8 l-6,-8 z"
            class={this.powerAvailableClass.map((powerAvailableClass) => `${powerAvailableClass} Fill`)}
            transform={this.fcdcRudderTrimPosition.map(
              (rudderTrim) => `translate(${deflectionToXOffset(-rudderTrim.value)} 0)`,
            )}
          />

          <text
            x={72}
            y={17}
            visibility={this.leftRightLabelVisible.map((leftRightLabelVisible) =>
              leftRightLabelVisible ? 'visible' : 'hidden',
            )}
            class={this.powerAvailableClass.map((powerAvailableClass) => `${powerAvailableClass} F22`)}
          >
            {this.fcdcRudderTrimPosition.map((rudderTrim) => (Math.sign(rudderTrim.valueOr(0)) === 1 ? 'L' : 'R'))}
          </text>
          <text
            x={159}
            y={17}
            class={this.powerAvailableClass.map((powerAvailableClass) => `${powerAvailableClass} F22 EndAlign`)}
          >
            {this.fcdcRudderTrimPosition.map((rudderTrim) => Math.abs(rudderTrim.valueOr(0)).toFixed(1))}
          </text>
          <text x={159} y={19} class="Cyan F22">
            °
          </text>
        </g>

        <text
          x={96}
          y={20}
          visibility={this.deflectionInfoValid.map((deflectionInfoValid) =>
            !deflectionInfoValid ? 'visible' : 'hidden',
          )}
          class="Amber F22"
        >
          XX
        </text>
        <text
          x={-9}
          y={20}
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
