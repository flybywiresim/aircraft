// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, NodeReference, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { HudElems } from './HUDUtils';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';

interface VerticalTapeProps {
  displayRange: number;
  valueSpacing: number;
  distanceSpacing: number;
  tapeValue: Subscribable<number>;
  lowerLimit: number;
  upperLimit: number;
  type: 'altitude' | 'speed';
  bus: ArincEventBus;
}

export class VerticalTape extends DisplayComponent<VerticalTapeProps> {
  private refElement = FSComponent.createRef<SVGGElement>();
  private readonly sub = this.props.bus.getArincSubscriber<HudElems>();
  private tickRefs: NodeReference<SVGGElement>[] = [];
  private crosswindMode = false;
  private buildSpeedGraduationPoints(): NodeReference<SVGGElement>[] {
    const numTicks = Math.round((this.props.displayRange * 2) / this.props.valueSpacing);

    const clampedValue = Math.max(Math.min(this.props.tapeValue.get(), this.props.upperLimit), this.props.lowerLimit);

    let lowestValue = Math.max(
      Math.round((clampedValue - this.props.displayRange) / this.props.valueSpacing) * this.props.valueSpacing,
      this.props.lowerLimit,
    );
    if (lowestValue < this.props.tapeValue.get() - this.props.displayRange) {
      lowestValue += this.props.valueSpacing;
    }

    const graduationPoints = [];

    for (let i = 0; i < numTicks; i++) {
      const elementValue = lowestValue + i * this.props.valueSpacing;
      if (elementValue <= (this.props.upperLimit ?? Infinity)) {
        const offset = (-elementValue * this.props.distanceSpacing) / this.props.valueSpacing;
        const element = { elementValue, offset };
        if (element) {
          let text = '';
          if (elementValue % 20 === 0) {
            text = Math.abs(elementValue).toString().padStart(3, '0');
          }

          const tickRef = FSComponent.createRef<SVGGElement>();
          graduationPoints.push(
            <g ref={tickRef} style={`transform: translate3d(0px, ${offset}px, 0px)`} id="spdVerticalTape">
              <path class="NormalStroke Green" d="m80.882 343.476h-11.988" />
              <text class="FontMedium MiddleAlign Green" x="34" y="352.75">
                {text}
              </text>
            </g>,
          );
          this.tickRefs.push(tickRef);
        }
      }
    }
    return graduationPoints;
  }

  private buildAltitudeGraduationPoints(): NodeReference<SVGGElement>[] {
    const numTicks = Math.round((this.props.displayRange * 2) / this.props.valueSpacing);

    const clampedValue = Math.max(Math.min(this.props.tapeValue.get(), this.props.upperLimit), this.props.lowerLimit);

    let lowestValue = Math.max(
      Math.round((clampedValue - this.props.displayRange) / this.props.valueSpacing) * this.props.valueSpacing,
      this.props.lowerLimit,
    );
    if (lowestValue < this.props.tapeValue.get() - this.props.displayRange) {
      lowestValue += this.props.valueSpacing;
    }

    const graduationPoints = [];

    for (let i = 0; i < numTicks; i++) {
      const elementValue = lowestValue + i * this.props.valueSpacing;
      if (elementValue <= (this.props.upperLimit ?? Infinity)) {
        const offset = (-elementValue * this.props.distanceSpacing) / this.props.valueSpacing;
        const element = { elementValue, offset };
        if (element) {
          let text = '';
          if (elementValue % 500 === 0) {
            text = (Math.abs(elementValue) / 100).toString().padStart(3, '0');
          }
          const tickRef = FSComponent.createRef<SVGGElement>();

          graduationPoints.push(
            <g ref={tickRef} style={`transform: translate3d(0px, ${offset}px, 0px`}>
              <path class="NormalStroke Green" d="m556.112 343.481h-8.562" />
              <text class="FontMedium MiddleAlign Green" x="524" y="351">
                {text}
              </text>
            </g>,
          );
          this.tickRefs.push(tickRef);
        }
      }
    }
    return graduationPoints;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.sub
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
      });

    this.props.tapeValue.sub((newValue) => {
      const multiplier = 100;
      const currentValueAtPrecision = Math.round(newValue * multiplier) / multiplier;
      const clampedValue = Math.max(
        Math.min(currentValueAtPrecision, this.props.upperLimit ?? Infinity),
        this.props.lowerLimit ?? -Infinity,
      );

      let lowestValue = Math.max(
        Math.round((clampedValue - this.props.displayRange) / this.props.valueSpacing) * this.props.valueSpacing,
        this.props.lowerLimit,
      );
      if (lowestValue < currentValueAtPrecision - this.props.displayRange) {
        lowestValue += this.props.valueSpacing;
      }
      for (let i = 0; i < this.tickRefs.length; i++) {
        const elementValue = lowestValue + i * this.props.valueSpacing;
        if (elementValue <= (this.props.upperLimit ?? Infinity)) {
          const offset = (-elementValue * this.props.distanceSpacing) / this.props.valueSpacing;
          const element = { elementValue, offset };
          if (element) {
            this.tickRefs[i].instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;

            let text = '';
            if (this.props.type === 'speed') {
              if (elementValue % 20 === 0) {
                text = Math.abs(elementValue).toString().padStart(3, '0');
              }

              if (newValue < 80) {
                if (elementValue > newValue + this.props.displayRange) {
                  this.tickRefs[i].instance.getElementsByTagName('path')[0].classList.add('HiddenElement');
                  this.tickRefs[i].instance.getElementsByTagName('text')[0].classList.add('HiddenElement');
                } else {
                  this.tickRefs[i].instance.getElementsByTagName('path')[0].classList.remove('HiddenElement');
                  this.tickRefs[i].instance.getElementsByTagName('text')[0].classList.remove('HiddenElement');
                }
              } else {
                this.tickRefs[i].instance.getElementsByTagName('path')[0].classList.remove('HiddenElement');
                this.tickRefs[i].instance.getElementsByTagName('text')[0].classList.remove('HiddenElement');
              }
            } else if (this.props.type === 'altitude') {
              if (elementValue % 500 === 0) {
                text = (Math.abs(elementValue) / 100).toString().padStart(3, '0');
                this.tickRefs[i].instance.getElementsByTagName('path')[0].classList.remove('HiddenElement');
              } else {
                this.tickRefs[i].instance.getElementsByTagName('path')[0].classList.add('HiddenElement');
              }

              if (this.crosswindMode) {
                if (Math.abs(currentValueAtPrecision - elementValue) > 200) {
                  this.tickRefs[i].instance.getElementsByTagName('path')[0].classList.add('HiddenElement');
                  this.tickRefs[i].instance.getElementsByTagName('text')[0].classList.add('HiddenElement');
                }
              } else {
                this.tickRefs[i].instance.getElementsByTagName('path')[0].classList.remove('HiddenElement');
                this.tickRefs[i].instance.getElementsByTagName('text')[0].classList.remove('HiddenElement');
              }
            }

            if (this.tickRefs[i].instance.getElementsByTagName('text')[0].textContent !== text) {
              this.tickRefs[i].instance.getElementsByTagName('text')[0].textContent = text;
            }
          }
        }
      }
      this.refElement.instance.style.transform = `translate3d(0px, ${(clampedValue * this.props.distanceSpacing) / this.props.valueSpacing}px, 0px)`;
    }, true);
  }

  render(): VNode {
    return (
      <g ref={this.refElement}>
        {this.props.type === 'altitude' && this.buildAltitudeGraduationPoints()}
        {this.props.type === 'speed' && this.buildSpeedGraduationPoints()}
        {this.props.children}
      </g>
    );
  }
}
