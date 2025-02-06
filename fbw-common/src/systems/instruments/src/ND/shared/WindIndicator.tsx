// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FSComponent, DisplayComponent, EventBus, Subject, VNode } from '@microsoft/msfs-sdk';
import { Arinc429RegisterSubject, GenericAdirsEvents } from '@flybywiresim/fbw-sdk';

import { GenericDisplayManagementEvents } from '../types/GenericDisplayManagementEvents';
import { Layer } from '../../MsfsAvionicsCommon/Layer';

const mod = (x: number, n: number) => x - Math.floor(x / n) * n;

export class WindIndicator extends DisplayComponent<{ bus: EventBus }> {
  private readonly windDirectionWord = Arinc429RegisterSubject.createEmpty();

  private readonly windSpeedWord = Arinc429RegisterSubject.createEmpty();

  private readonly planeHeadingWord = Arinc429RegisterSubject.createEmpty();

  private readonly windDirectionText = Subject.create('');

  private readonly windSpeedText = Subject.create('');

  private readonly windArrowVisible = Subject.create(false);

  private readonly windArrowRotation = Subject.create(0);

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<GenericAdirsEvents & GenericDisplayManagementEvents>();

    sub
      .on('windDirection')
      .atFrequency(10)
      .handle((value) => {
        this.windDirectionWord.setWord(value);

        this.handleWindDirection();
        this.handleWindSpeed();
        this.handleWindArrow();
      });

    sub
      .on('windSpeed')
      .atFrequency(10)
      .handle((value) => {
        this.windSpeedWord.setWord(value);

        this.handleWindDirection();
        this.handleWindSpeed();
        this.handleWindArrow();
      });

    sub
      .on('trueHeadingRaw')
      .atFrequency(25)
      .handle((value) => {
        this.planeHeadingWord.setWord(value);
      });
  }

  private handleWindDirection() {
    const direction = this.windDirectionWord.get();
    const speed = this.windSpeedWord.get();

    if (direction.isFailureWarning() || speed.isFailureWarning()) {
      this.windDirectionText.set('');
    } else if (direction.isNoComputedData() || speed.isNoComputedData()) {
      this.windDirectionText.set('---');
    } else {
      const windDirection360 = direction.value < 0 ? direction.value + 360 : direction.value;

      const text = Math.round(windDirection360).toString().padStart(3, '0');

      this.windDirectionText.set(text);
    }
  }

  private handleWindSpeed() {
    const direction = this.windDirectionWord.get();
    const speed = this.windSpeedWord.get();

    if (direction.isFailureWarning() || speed.isFailureWarning()) {
      this.windSpeedText.set('');
    } else if (direction.isNoComputedData() || speed.isNoComputedData()) {
      this.windSpeedText.set('---');
    } else {
      const text = Math.round(speed.value).toString().padStart(3, ' ');

      this.windSpeedText.set(text);
    }
  }

  private handleWindArrow() {
    const direction = this.windDirectionWord.get();
    const speed = this.windSpeedWord.get();
    const heading = this.planeHeadingWord.get();

    if (!direction.isNormalOperation() || !speed.isNormalOperation() || !heading.isNormalOperation()) {
      this.windArrowVisible.set(false);
      return;
    }

    const speedValue = speed.value;
    const headingValue = heading.value;

    if (speedValue > 2) {
      const windDirection360 = direction.value < 0 ? direction.value + 360 : direction.value;

      this.windArrowVisible.set(true);
      this.windArrowRotation.set(mod(Math.round(windDirection360) - Math.round(headingValue) + 180, 360));
    } else {
      this.windArrowVisible.set(false);
    }
  }

  render(): VNode | null {
    return (
      <Layer x={23} y={58}>
        <text x={25} y={0} class="Green FontSmall EndAlign">
          {this.windDirectionText}
        </text>
        <text x={31} y={-1} class="White FontSmallest">
          /
        </text>
        <text x={50} y={0} class="Green FontSmall">
          {this.windSpeedText}
        </text>
        <Layer x={3} y={10}>
          <path
            class="Green"
            stroke-width={2.5}
            stroke-linecap="round"
            d="M 0 30 v -30 m -6.5 12 l 6.5 -12 l 6.5 12"
            transform={this.windArrowRotation.map((rotation) => `rotate(${rotation} 0 15)`)}
            visibility={this.windArrowVisible.map((visible) => (visible ? 'visible' : 'hidden'))}
          />
        </Layer>
      </Layer>
    );
  }
}
