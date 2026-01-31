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
import { FgBus } from 'instruments/src/HUD/shared/FgBusProvider';
import { FcuBus } from './shared/FcuBusProvider';
const UnitDigits = (value: number) => {
  let text: string;
  if (value < 0) {
    text = (0).toString();
  } else if (value >= 10) {
    text = (value - 10).toString();
  } else {
    text = value.toString();
  }

  return text;
};

const TensDigits = (value: number) => {
  let text: string;
  if (value < 0) {
    text = (value + 100).toString();
  } else if (value >= 100) {
    text = (value - 100).toString();
  } else {
    text = value.toString();
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

interface CrosswindDigitalSpeedReadoutProps {
  bus: ArincEventBus;
}

export class CrosswindDigitalSpeedReadout extends DisplayComponent<CrosswindDigitalSpeedReadoutProps> {
  private speed = Subject.create(0);
  //private readonly speed = Arinc429RegisterSubject.createEmpty();

  private readonly mda = Arinc429RegisterSubject.createEmpty();

  private baroMode = new Arinc429Word(0);

  private isNegativeSub = Subject.create('hidden');

  private showThousandsZeroSub = Subject.create(false);

  private unitDigitsSub = Subject.create(0);

  private unitsValue = Subject.create(0);

  private tensValue = Subject.create(0);

  private hundredsValue = Subject.create(0);

  private unitsPosition = Subject.create(0);

  private tensPosition = Subject.create(0);

  private hundredsPosition = Subject.create(0);

  private thousandsValue = Subject.create(0);

  private thousandsPosition = Subject.create(0);

  private tenThousandsValue = Subject.create(0);

  private tenThousandsPosition = Subject.create(0);

  private readonly color = MappedSubject.create(([speed]) => (speed > -1 ? 'Green' : 'Green'), this.speed);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HEvent & Arinc429Values & ClockEvents & FgBus & FcuBus>();

    // FIXME clean this up.. should be handled by an IE in the XML

    this.speed.sub((speed) => {
      const isNegative = speed < 0;
      this.isNegativeSub.set(isNegative ? 'visible' : 'hidden');

      const absSpeed = Math.abs(Math.max(Math.min(speed, 50000), -1500));

      const unitDigits = absSpeed % 10;
      this.unitsValue.set(unitDigits);

      const TensValue = Math.floor((absSpeed / 10) % 10);
      this.tensValue.set(TensValue);
      let TensPosition = 0;
      if (unitDigits >= 9) {
        TensPosition = unitDigits / 2 - 4;
        this.tensPosition.set(TensPosition);
      } else {
        this.tensPosition.set(0);
      }

      const HundredsValue = Math.floor((absSpeed / 100) % 10);
      this.hundredsValue.set(HundredsValue);
      let HundredsPosition = 0;
      if (TensValue >= 9) {
        HundredsPosition = TensPosition;
        this.hundredsPosition.set(HundredsPosition);
      } else {
        this.hundredsPosition.set(0);
      }

      const ThousandsValue = Math.floor((absSpeed / 1000) % 10);
      this.thousandsValue.set(ThousandsValue);
      let ThousandsPosition = 0;
      if (HundredsValue >= 9) {
        ThousandsPosition = HundredsPosition;
        this.thousandsPosition.set(ThousandsPosition);
      } else {
        this.thousandsPosition.set(0);
      }

      const TenThousandsValue = Math.floor((absSpeed / 10000) % 10);
      this.tenThousandsValue.set(TenThousandsValue);
      let TenThousandsPosition = 0;
      if (ThousandsValue >= 9) {
        TenThousandsPosition = ThousandsPosition;
      }

      this.tenThousandsPosition.set(TenThousandsPosition);
      const showThousandsZero = TenThousandsValue !== 0;

      this.showThousandsZeroSub.set(showThousandsZero);
    });
    //sub.on('speed').handle(this.speed.setWord.bind(this.speed));
    sub.on('speedAr').handle((speed) => {
      this.speed.set(speed.value);
    });
  }

  render(): VNode {
    return (
      //   change lvar when btns added to model.
      <g id="CrosswindSpeedReadoutGroup" transform="translate(-125 245)">
        <path
          id="CrosswindSpeedReadoutOutline"
          class="NormalStroke Green ReadoutBackgroundFill"
          d="m  130   83 h 55.25 v 30 h -55.25z"
        />
        <g>
          <svg x="117" y="76.5" width="57.375" height="38.125" viewBox="0 0 57.375 38.125">
            <Drum
              type="hundreds"
              position={this.hundredsPosition}
              value={this.hundredsValue}
              color={this.color}
              getText={HundredsDigit}
              valueSpacing={1}
              distanceSpacing={42.5}
              displayRange={1}
              amount={10}
            />
          </svg>
          <svg x="128.5" y="76.5" width="57.375" height="38.125" viewBox="0 0 57.375 38.125">
            <Drum
              type="tens"
              position={this.tensPosition}
              value={this.tensValue}
              color={this.color}
              getText={TensDigits}
              valueSpacing={1}
              distanceSpacing={42.5}
              displayRange={1}
              amount={10}
            />
          </svg>
          <svg x="132.5" y="76.5" width="57.375" height="38.125" viewBox="0 0 57.375 38.125">
            <Drum
              type="unit"
              position={this.unitsValue}
              value={this.unitsValue}
              color={this.color}
              getText={UnitDigits}
              valueSpacing={1}
              distanceSpacing={42.5}
              displayRange={1}
              amount={10}
            />
          </svg>
        </g>

        {/* <path id="cwTape"
            class="NormalStroke  Green"
            d="m128.75 76.337  v -6 "
          />
          <path id="cwTape"
            class="NormalStroke  Green"
            d="m128.75 85.337  v 6 "
          />
          <path id="cwTape"
            class="NormalStroke  Green"
            d="m117.75 91.337  h 22 "
          />
          <path id="cwTape"
            class="NormalStroke  Green"
            d="m117.75 70.337  h 22 "
          /> */}
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
            x="24"
            y="30.175"
          />,
        );
      } else if (this.props.type === 'thousands') {
        graduationElements.push(
          <text
            ref={digitRef}
            style="transform: rotate3d(0px, 0px, 0px)"
            class={`FontNormal MiddleAlign ${this.color}`}
            x="30.6"
            y="30.175"
          />,
        );
      } else if (this.props.type === 'ten-thousands') {
        graduationElements.push(
          <text
            ref={digitRef}
            style="transform: rotate3d(0px, 0px, 0px)"
            class={`FontNormal MiddleAlign ${this.color}`}
            x="10.6"
            y="30.175"
          />,
        );
      } else if (this.props.type === 'tens') {
        graduationElements.push(
          <text
            ref={digitRef}
            style="transform: rotate3d(0px, 0px, 0px)"
            class={`FontNormal MiddleAlign ${this.color}`}
            x="30"
            y="30.175"
          />,
        );
      } else if (this.props.type === 'unit') {
        graduationElements.push(
          <text
            ref={digitRef}
            style="transform: rotate3d(0px, 0px, 0px)"
            class={`FontNormal MiddleAlign ${this.color}`}
            x="44"
            y="30.175"
          />,
        );
      }

      this.digitRefElements.push(digitRef);
    }

    return graduationElements;
  }

  private getOffset(position: number) {
    //// smooth drum
    //this.gRef.instance.style.transform = `translate3d(0px, ${(position * this.props.distanceSpacing) / this.props.valueSpacing}px, 0px)`;

    //// snap on digit
    this.gRef.instance.style.transform = `translate3d(0px, ${
      (position * this.props.distanceSpacing) / this.props.valueSpacing -
      (((position * this.props.distanceSpacing) / this.props.valueSpacing) % this.props.distanceSpacing)
    }px, 0px)`;
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
