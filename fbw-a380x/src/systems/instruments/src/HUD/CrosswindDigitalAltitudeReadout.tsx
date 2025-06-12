// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  DisplayComponent,
  FSComponent,
  NodeReference,
  Subject,
  Subscribable,
  VNode,
  EventBus,
} from '@microsoft/msfs-sdk';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';

const TensDigits = (value: number) => {
  let text: string;
  if (value < 0) {
    text = (value + 100).toString();
  } else if (value >= 100) {
    text = (value - 100).toString().padEnd(2, '0');
  } else {
    text = value.toString().padEnd(2, '0');
  }

  return text;
};

const HundredsDigit = (value: number) => {
  let text: string;
  if (value < 0) {
    text = (value + 1).toString();
  } else if (value >= 10) {
    text = (value - 10).toString();
  } else {
    text = value.toString();
  }

  return text;
};
const ThousandsDigit = (value: number) => {
  let text: string;
  if (!Number.isNaN(value)) {
    text = (value % 10).toString();
  } else {
    text = '';
  }

  return text;
};
const TenThousandsDigit = (value: number) => {
  let text: string;
  if (!Number.isNaN(value)) {
    text = value.toString();
  } else {
    text = '';
  }
  return text;
};

interface CrosswindDigitalAltitudeReadoutProps {
  bus: EventBus;
}

export class CrosswindDigitalAltitudeReadout extends DisplayComponent<CrosswindDigitalAltitudeReadoutProps> {
  private mda = 0;

  private isNegativeSub = Subject.create('hidden');

  private colorSub = Subject.create('');

  private showThousandsZeroSub = Subject.create(false);

  private tenDigitsSub = Subject.create(0);

  private hundredsValue = Subject.create(0);

  private hundredsPosition = Subject.create(0);

  private thousandsValue = Subject.create(0);

  private thousandsPosition = Subject.create(0);

  private tenThousandsValue = Subject.create(0);

  private tenThousandsPosition = Subject.create(0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values>();

    sub
      .on('mda')
      .whenChanged()
      .handle((mda) => {
        this.mda = mda;
        const color = this.mda !== 0 ? 'Amber' : 'Green';
        this.colorSub.set(color);
      });

    sub.on('altitudeAr').handle((altitude) => {
      const isNegative = altitude.value < 0;
      this.isNegativeSub.set(isNegative ? 'visible' : 'hidden');

      const color = this.mda !== 0 && altitude.value < this.mda ? 'Amber' : 'Green';
      this.colorSub.set(color);

      const absAlt = Math.abs(Math.max(Math.min(altitude.value, 50000), -1500));
      const tensDigits = absAlt % 100;
      this.tenDigitsSub.set(tensDigits);

      const HundredsValue = Math.floor((absAlt / 100) % 10);
      this.hundredsValue.set(HundredsValue);
      let HundredsPosition = 0;
      if (tensDigits > 80) {
        HundredsPosition = tensDigits / 20 - 4;
        this.hundredsPosition.set(HundredsPosition);
      } else {
        this.hundredsPosition.set(0);
      }

      const ThousandsValue = Math.floor((absAlt / 1000) % 10);
      this.thousandsValue.set(ThousandsValue);
      let ThousandsPosition = 0;
      if (HundredsValue >= 9) {
        ThousandsPosition = HundredsPosition;
        this.thousandsPosition.set(ThousandsPosition);
      } else {
        this.thousandsPosition.set(0);
      }

      const TenThousandsValue = Math.floor((absAlt / 10000) % 10);
      this.tenThousandsValue.set(TenThousandsValue);
      let TenThousandsPosition = 0;
      if (ThousandsValue >= 9) {
        TenThousandsPosition = ThousandsPosition;
      }

      this.tenThousandsPosition.set(TenThousandsPosition);
      const showThousandsZero = TenThousandsValue !== 0;

      this.showThousandsZeroSub.set(showThousandsZero);
    });
  }

  render(): VNode {
    return (
      <g id="CrosswindAltReadoutGroup">
        <g>
          <svg x="520" y="342" width="72.5" height="44.853" viewBox="0 0 72.5 44.853">
            <Drum
              type="ten-thousands"
              position={this.tenThousandsPosition}
              value={this.tenThousandsValue}
              color={this.colorSub}
              showZero={Subject.create(false)}
              getText={TenThousandsDigit}
              valueSpacing={1}
              distanceSpacing={35}
              displayRange={1}
              amount={2}
            />
            <Drum
              type="thousands"
              position={this.thousandsPosition}
              value={this.thousandsValue}
              color={this.colorSub}
              showZero={this.showThousandsZeroSub}
              getText={ThousandsDigit}
              valueSpacing={1}
              distanceSpacing={35}
              displayRange={1}
              amount={2}
            />
            <Drum
              type="hundreds"
              position={this.hundredsPosition}
              value={this.hundredsValue}
              color={this.colorSub}
              getText={HundredsDigit}
              valueSpacing={1}
              distanceSpacing={35}
              displayRange={1}
              amount={10}
            />
          </svg>
          <svg x="583" y="342" width="44.3235" height="45" viewBox="0 0 44.3235 45">
            <Drum
              type="tens"
              position={this.tenDigitsSub}
              value={this.tenDigitsSub}
              color={this.colorSub}
              getText={TensDigits}
              valueSpacing={20}
              distanceSpacing={23.5}
              displayRange={40}
              amount={4}
            />
          </svg>
        </g>
        <path
          id="AltReadoutReducedAccurMarks"
          class="NormalStroke Green"
          style="display: none"
          d="m663.05 408.345h23.672m-23.672 -8.466h23.672"
        />
        <path id="AltReadoutOutline" class="NormalStroke Green" d="m528 341.25 h 100 v45 h -100 z" />

        <g id="AltNegativeText" class="FontLarge EndAlign" visibility={this.isNegativeSub}>
          <text class="Green" x="607.5857" y="389.784735">
            N
          </text>
          <text class="Green" x="608.5" y="416.25694500000003">
            E
          </text>
          <text class="Green" x="608.18375" y="442.430155">
            G
          </text>
        </g>
      </g>
    );
  }
}

interface DrumProperties {
  type: string;
  displayRange: number;
  amount: number;
  valueSpacing: number;
  distanceSpacing: number;
  position: Subscribable<number>;
  value: Subscribable<number>;
  color: Subscribable<string>;
  getText: any;
  showZero?: Subscribable<boolean>;
}
class Drum extends DisplayComponent<DrumProperties> {
  private digitRefElements: NodeReference<SVGTextElement>[] = [];

  private buildElements(amount: number) {
    const highestPosition =
      Math.round((this.position + this.props.displayRange) / this.props.valueSpacing) * this.props.valueSpacing;

    const highestValue =
      Math.round((this.value + this.props.displayRange) / this.props.valueSpacing) * this.props.valueSpacing;

    const graduationElements: SVGTextElement[] = [];

    for (let i = 0; i < amount; i++) {
      const elementPosition = highestPosition - i * this.props.valueSpacing;
      const offset = (-elementPosition * this.props.distanceSpacing) / this.props.valueSpacing;

      let elementVal = highestValue - i * this.props.valueSpacing;
      if (!this.showZero && elementVal === 0) {
        elementVal = NaN;
      }

      const digitRef = FSComponent.createRef<SVGTextElement>();

      if (this.props.type === 'hundreds') {
        graduationElements.push(
          <text
            ref={digitRef}
            transform={`translate(0 ${offset})`}
            class={`FontLarge MiddleAlign Green`}
            x="60"
            y="34"
          />,
        );
      } else if (this.props.type === 'thousands') {
        graduationElements.push(
          <text
            ref={digitRef}
            transform={`translate(0 ${offset})`}
            class={`FontLarge MiddleAlign Green`}
            x="42.5"
            y="34"
          />,
        );
      } else if (this.props.type === 'ten-thousands') {
        graduationElements.push(
          <text
            ref={digitRef}
            transform={`translate(0 ${offset})`}
            class={`FontLarge MiddleAlign Green`}
            x="24.25"
            y="34"
          />,
        );
      } else if (this.props.type === 'tens') {
        graduationElements.push(
          <text
            ref={digitRef}
            transform={`translate(0 ${offset})`}
            class={`FontSmallest MiddleAlign Green`}
            x="27.5"
            y="34"
          />,
        );
      }
      this.digitRefElements.push(digitRef);
    }

    return graduationElements;
  }

  private getOffset(position: number) {
    const className = `translate(0 ${(position * this.props.distanceSpacing) / this.props.valueSpacing})`;

    this.gRef.instance.setAttribute('transform', className);
  }

  private updateValue() {
    let highestPosition =
      Math.round((this.position + this.props.displayRange) / this.props.valueSpacing) * this.props.valueSpacing;
    if (highestPosition > this.position + this.props.displayRange) {
      highestPosition -= this.props.valueSpacing;
    }

    let highestValue =
      Math.round((this.value + this.props.displayRange) / this.props.valueSpacing) * this.props.valueSpacing;
    if (highestValue > this.value + this.props.displayRange) {
      highestValue -= this.props.valueSpacing;
    }

    for (let i = 0; i < this.props.amount; i++) {
      let elementVal = highestValue - i * this.props.valueSpacing;
      const elementPosition = highestPosition - i * this.props.valueSpacing;
      const offset = (-elementPosition * this.props.distanceSpacing) / this.props.valueSpacing;
      if (!this.showZero && elementVal === 0) {
        elementVal = NaN;
      }

      const text = this.props.getText(elementVal);

      this.digitRefElements[i].instance.setAttribute('transform', `translate(0 ${offset})`);
      if (this.digitRefElements[i].instance.textContent !== text) {
        this.digitRefElements[i].instance.textContent = text;
      }
    }
  }

  private position = 0;

  private value = 0;

  private color = 'Green';

  private showZero = true;

  private gRef = FSComponent.createRef<SVGGElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.position.sub((p) => {
      this.position = p;
      this.getOffset(p);
    }, true);
    this.props.value.sub((p) => {
      this.value = p;
      this.updateValue();
    }, true);
    this.props.color.sub((p) => {
      this.color = p;
      this.updateValue();
    });
    this.props.showZero?.sub((p) => {
      this.showZero = p;
      this.updateValue();
    }, true);
  }

  render(): VNode {
    return <g ref={this.gRef}>{this.buildElements(this.props.amount)}</g>;
  }
}
