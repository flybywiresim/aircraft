import {
  ClockEvents,
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

import './style.scss';
import { BatSimVars } from 'instruments/src/BAT/BatSimVarPublisher';

const BASE_DELAY_MS = 800;
const DIGIT_REFRESH_INTERVAL_MS = 125;
const FULL_DISPLAY_REFRESH_TIME_MS = BASE_DELAY_MS + 2 * DIGIT_REFRESH_INTERVAL_MS;

enum BatSelectorPositions {
  ESS = 0,
  APU = 1,
  OFF = 2,
  BAT1 = 3,
  BAT2 = 4,
}

interface BatteryProps extends ComponentProps {
  bus: EventBus;
}

export class BatteryDisplay extends DisplayComponent<BatteryProps> {
  private subs: Subscription[] = [];

  private readonly sub = this.props.bus.getSubscriber<ClockEvents & BatSimVars>();

  private readonly dcBus2PoweredConsumer = ConsumerSubject.create<boolean>(this.sub.on('dc2Powered'), false);

  private readonly annLtSwitchPosConsumer = ConsumerSubject.create<number>(this.sub.on('ovhdAnnLtSwitchPos'), 1);

  private readonly batSelectorPositionConsumer = ConsumerSubject.create<number>(
    this.sub.on('ovhdBatSelectorSwitchPos'),
    2,
  );

  private readonly displayDigits = Subject.create<string>('000');

  private readonly voltageSubs = [
    // .whenChangedBy(0.1) -> only fire when the value has changed enough to be shown on display
    ConsumerSubject.create(this.sub.on('essPotential').whenChangedBy(0.1), 0),
    ConsumerSubject.create(this.sub.on('apuPotential').whenChangedBy(0.1), 0),
    ConsumerSubject.create(this.sub.on('bat1Potential').whenChangedBy(0.1), 0),
    ConsumerSubject.create(this.sub.on('bat2Potential').whenChangedBy(0.1), 0),
  ];

  private voltageToString(voltage: number) {
    return voltage.toFixed(1).replace('.', '').padStart(3, '0');
  }

  private readonly isBatDisplayDisabled = MappedSubject.create(
    ([selectorPosition, annLtSwitchPos, dc2BusPowered]) =>
      selectorPosition === BatSelectorPositions.OFF && !(annLtSwitchPos === 0 && dc2BusPowered),
    this.batSelectorPositionConsumer,
    this.annLtSwitchPosConsumer,
    this.dcBus2PoweredConsumer,
  );

  private readonly targetDigits = MappedSubject.create(
    ([batSelectorPos, annLtSwitchPos, dcBus2Powered, essVoltage, apuVoltage, bat1Voltage, bat2Voltage]) => {
      if (annLtSwitchPos === 0 && dcBus2Powered) {
        this.displayDigits.set('888');
        return '888';
      }
      switch (batSelectorPos) {
        case BatSelectorPositions.ESS:
          return this.voltageToString(essVoltage);

        case BatSelectorPositions.APU:
          return this.voltageToString(apuVoltage);

        case BatSelectorPositions.OFF:
          return this.displayDigits.get();

        case BatSelectorPositions.BAT1:
          return this.voltageToString(bat1Voltage);

        case BatSelectorPositions.BAT2:
          return this.voltageToString(bat2Voltage);
      }

      return 'XXX'; // This event should never occur
    },
    this.batSelectorPositionConsumer,
    this.annLtSwitchPosConsumer,
    this.dcBus2PoweredConsumer,
    ...this.voltageSubs,
  );

  private lastFullUpdateTimestamp = 0;
  private updateDigitIndex = 0;
  private targetOverride = {
    active: false,
    until: 0, // Stores the timestamp until which the override should be in place
  };
  private previousBatSelectorPosition = BatSelectorPositions.OFF;

  private handleUpdate(timestamp: number) {
    /**
     * The digits are updated in sequential order (i.e. 0, 1, 2, 0, 1, ...). It is therefore possible to render
     * the last two digits of a new target value, whilst still having the first digit from a previous value.
     * For example, '888' -> '276', it is possible to get '876' until the first digit is cleared in the next pass.
     */
    if (this.lastFullUpdateTimestamp === -1) {
      this.lastFullUpdateTimestamp = timestamp;
      return;
    }

    let targetDigits;
    if (this.targetOverride.active) {
      if (this.targetOverride.until! >= timestamp) {
        targetDigits = '000';
        timestamp += FULL_DISPLAY_REFRESH_TIME_MS;
      } else {
        this.targetOverride.active = false;
        this.updateDigitIndex = 0;
      }
    }

    if (!this.targetOverride.active) {
      targetDigits = this.targetDigits.get();
    }
    const timeDiff = timestamp - this.lastFullUpdateTimestamp;

    // Update only a single digit per pass (since frequency is potentially lower than DIGIT_REFRESH_INTERVAL_MS)
    const index = this.updateDigitIndex;
    if (timeDiff >= BASE_DELAY_MS + index * DIGIT_REFRESH_INTERVAL_MS) {
      const oldDigits = this.displayDigits.get();
      this.displayDigits.set(`${oldDigits.slice(0, index)}${targetDigits![index]}${oldDigits.slice(index + 1)}`);

      this.updateDigitIndex = (index + 1) % 3;
      if (index === 2) {
        const timeLeftOnCycle = timeDiff - FULL_DISPLAY_REFRESH_TIME_MS;
        this.lastFullUpdateTimestamp = timestamp - timeLeftOnCycle;
      }
    }
  }

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    this.subs.push(
      this.sub
        .on('ovhdBatSelectorSwitchPos')
        .whenChanged()
        .handle((switchPosition) => {
          if (this.previousBatSelectorPosition === BatSelectorPositions.OFF) {
            this.targetOverride.active = true;
            this.targetOverride.until = new Date().valueOf() + FULL_DISPLAY_REFRESH_TIME_MS;
          }

          // Reset timeout
          this.lastFullUpdateTimestamp = -1;
          this.previousBatSelectorPosition = switchPosition;
        }),
    );

    this.subs.push(
      this.sub
        .on('realTime')
        .atFrequency(7)
        .handle((ts) => this.handleUpdate(ts)),
    );
  }

  destroy() {
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <svg class={{ 'bat-svg': true, off: this.isBatDisplayDisabled }} viewBox="0 0 200 100">
        <text x={196} y={48}>
          {MappedSubject.create(([digits]) => `${digits[0]}${digits[1]}.${digits[2]}V`, this.displayDigits)}
        </text>
      </svg>
    );
  }
}
