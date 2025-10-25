// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  DisplayComponent,
  FSComponent,
  MappedSubject,
  NodeReference,
  Subject,
  Subscribable,
  VNode,
  HEvent,
  ClockEvents,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429RegisterSubject, Arinc429Word } from '@flybywiresim/fbw-sdk';

import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { FcuBus } from './shared/FcuBusProvider';

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
  bus: ArincEventBus;
}

export class CrosswindDigitalAltitudeReadout extends DisplayComponent<CrosswindDigitalAltitudeReadoutProps> {
  private readonly mda = Arinc429RegisterSubject.createEmpty();

  private readonly altitude = Arinc429RegisterSubject.createEmpty();

  private baroMode = new Arinc429Word(0);

  private isNegativeSub = Subject.create('hidden');

  private showThousandsZeroSub = Subject.create(false);

  private tenDigitsSub = Subject.create(0);

  private hundredsValue = Subject.create(0);

  private hundredsPosition = Subject.create(0);

  private thousandsValue = Subject.create(0);

  private thousandsPosition = Subject.create(0);

  private tenThousandsValue = Subject.create(0);

  private tenThousandsPosition = Subject.create(0);

  private readonly color = MappedSubject.create(
    ([mda, altitude]) =>
      !mda.isNoComputedData() && !mda.isFailureWarning() && altitude.value < mda.value ? 'Green' : 'Green',
    this.mda,
    this.altitude,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HEvent & Arinc429Values & ClockEvents & FcuBus>();

    // FIXME clean this up.. should be handled by an IE in the XML

    this.altitude.sub((altitude) => {
      const isNegative = altitude.value < 0;
      this.isNegativeSub.set(isNegative ? 'visible' : 'hidden');

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

    sub.on('fmMdaRaw').handle(this.mda.setWord.bind(this.mda));
    // FIXME once the ADR has the proper baro alt implementation this will need filtered altitude with source selection
    sub.on('baroCorrectedAltitude').handle(this.altitude.setWord.bind(this.altitude));

    sub
      .on('fcuEisDiscreteWord2') //baromode
      .whenChanged()
      .handle((m) => {
        this.baroMode = m;
      });
  }

  render(): VNode {
    return (
      //   change lvar when btns added to model.
      <g id="CrosswindAltReadoutGroup">
        <g>
          <path id="cwTapeBg" class="NormalStroke  BackgroundFill" d="m501.5 325.125h93.5v38.25h-93.5z" />
          <svg x="500" y="324.4" width="57.375" height="38.125" viewBox="0 0 57.375 38.1250">
            <Drum
              type="ten-thousands"
              position={this.tenThousandsPosition}
              value={this.tenThousandsValue}
              color={this.color}
              showZero={Subject.create(false)}
              getText={TenThousandsDigit}
              valueSpacing={1}
              distanceSpacing={30}
              displayRange={1}
              amount={2}
            />
            <Drum
              type="thousands"
              position={this.thousandsPosition}
              value={this.thousandsValue}
              color={this.color}
              showZero={this.showThousandsZeroSub}
              getText={ThousandsDigit}
              valueSpacing={1}
              distanceSpacing={30}
              displayRange={1}
              amount={2}
            />
            <Drum
              type="hundreds"
              position={this.hundredsPosition}
              value={this.hundredsValue}
              color={this.color}
              getText={HundredsDigit}
              valueSpacing={1}
              distanceSpacing={30}
              displayRange={1}
              amount={10}
            />
          </svg>
          <svg x="556" y="324.4" width="37.675" height="38.25" viewBox="0 0 37.675 38.25">
            <Drum
              type="tens"
              amount={4}
              position={this.tenDigitsSub}
              value={this.tenDigitsSub}
              color={this.color}
              getText={TensDigits}
              valueSpacing={20}
              distanceSpacing={20}
              displayRange={40}
            />
          </svg>
        </g>
        <path
          id="CrosswindAltReadoutReducedAccurMarks"
          class="NormalStroke Green"
          style="display: none"
          d="m563.593 347.093h20.122m-20.122 -7.197h20.122"
        />
        <path id="CrosswindAltReadoutOutline" class="NormalStroke Green" d="m500.438 324.432h93.5v38.25h-93.5z" />

        <g id="CrosswindAltNegativeText" class="FontNormal EndAlign" visibility={this.isNegativeSub}>
          <text class="Green" x="516.447845" y="331.31702475">
            N
          </text>
          <text class="Green" x="517.225" y="353.81840325">
            E
          </text>
          <text class="Green" x="516.9561875" y="376.06563174999997">
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
    const highestValue =
      Math.round((this.value + this.props.displayRange) / this.props.valueSpacing) * this.props.valueSpacing;

    const graduationElements: SVGTextElement[] = [];

    for (let i = 0; i < amount; i++) {
      let elementVal = highestValue - i * this.props.valueSpacing;
      if (!this.showZero && elementVal === 0) {
        elementVal = NaN;
      }

      const digitRef = FSComponent.createRef<SVGTextElement>();

      if (this.props.type === 'hundreds') {
        graduationElements.push(
          <text
            ref={digitRef}
            style="transform: rotate3d(0px, 0px, 0px)"
            class={`FontNormal MiddleAlign ${this.color}`}
            x="49.43175"
            y="30.175"
          />,
        );
      } else if (this.props.type === 'thousands') {
        graduationElements.push(
          <text
            ref={digitRef}
            style="transform: rotate3d(0px, 0px, 0px)"
            class={`FontNormal MiddleAlign ${this.color}`}
            x="30.515"
            y="30.175"
          />,
        );
      } else if (this.props.type === 'ten-thousands') {
        graduationElements.push(
          <text
            ref={digitRef}
            style="transform: rotate3d(0px, 0px, 0px)"
            class={`FontNormal MiddleAlign ${this.color}`}
            x="10.6165"
            y="30.175"
          />,
        );
      } else if (this.props.type === 'tens') {
        graduationElements.push(
          <text
            ref={digitRef}
            style="transform: rotate3d(0px, 0px, 0px)"
            class={`FontMedium MiddleAlign ${this.color}`}
            x="19.5"
            y="25.5"
          />,
        );
      }
      this.digitRefElements.push(digitRef);
    }

    return graduationElements;
  }

  private getOffset(position: number) {
    this.gRef.instance.style.transform = `translate3d(0px, ${(position * this.props.distanceSpacing) / this.props.valueSpacing}px, 0px)`;
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
      this.digitRefElements[i].instance.classList.replace('Green', this.color);
      this.digitRefElements[i].instance.classList.replace('Amber', this.color);
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
