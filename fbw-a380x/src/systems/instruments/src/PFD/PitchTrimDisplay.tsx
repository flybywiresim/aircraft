// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MathUtils } from '@flybywiresim/fbw-sdk';
import {
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subscribable,
  SubscribableMapFunctions,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { PFDSimvars } from 'instruments/src/PFD/shared/PFDSimvarPublisher';
import PitchTrimUtils from '@shared/PitchTrimUtils';

enum PitchTrimStatus {
  AfterLanding,
  OutOfRange,
  AtTarget,
  NotAtTarget,
}

export class PitchTrimDisplay extends DisplayComponent<{ bus: EventBus; visible: Subscribable<boolean> }> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<PFDSimvars>();

  private readonly cgGroup = FSComponent.createRef<SVGGElement>();

  private readonly cgValue = FSComponent.createRef<SVGTextElement>();

  private readonly outOfRangeGroup = FSComponent.createRef<SVGGElement>();

  private readonly arrowRef = FSComponent.createRef<SVGPolygonElement>();

  private readonly pitchTrimVisibility = this.props.visible.map((it) => (it ? 'visible' : 'hidden'));

  private readonly trimPosition = ConsumerSubject.create(this.sub.on('trimPosition').whenChanged(), 0).map(
    (it) => it * MathUtils.RADIANS_TO_DEGREES,
  );
  private readonly thsForText = this.trimPosition.map((it) => PitchTrimUtils.pitchTrimToCg(it).toFixed(1));

  private readonly rightWheelY = this.trimPosition.map((it) => (it + 2) * 31 + 23 - 400);

  private readonly trimAreasTransform = this.trimPosition.map(
    (it) => `translate(276 ${-(this.degreesToPixel(it) - 103.5) + 23})`,
  );

  private readonly fwcFlightPhase = ConsumerSubject.create(this.sub.on('fwcFlightPhase'), 0);
  private readonly flightPhaseAfterTouchdown = this.fwcFlightPhase.map((fp) => (fp > 9 ? 'hidden' : 'inherit'));

  private readonly engOneRunning = ConsumerSubject.create(this.sub.on('engOneRunning'), false);
  private readonly engTwoRunning = ConsumerSubject.create(this.sub.on('engTwoRunning'), false);
  private readonly engThreeRunning = ConsumerSubject.create(this.sub.on('engThreeRunning'), false);
  private readonly engFourRunning = ConsumerSubject.create(this.sub.on('engFourRunning'), false);
  private readonly anyEngRunning = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.engOneRunning,
    this.engTwoRunning,
    this.engThreeRunning,
    this.engFourRunning,
  );

  private readonly cgPercent = ConsumerSubject.create(this.sub.on('cgPercent').withPrecision(1), 0);
  private readonly cgPercentText = this.cgPercent.map((it) => it.toFixed(1));

  private readonly greenHydPressurized = ConsumerSubject.create(this.sub.on('hydGreenSysPressurized'), false);
  private readonly yellowHydPressurized = ConsumerSubject.create(this.sub.on('hydYellowSysPressurized'), false);
  private readonly oneHydPressurized = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.greenHydPressurized,
    this.yellowHydPressurized,
  );

  private readonly cgStatus = MappedSubject.create(
    ([trim, cg, phase, engRunning]) => {
      if (!engRunning || phase > 9) {
        return PitchTrimStatus.AfterLanding;
      } else {
        if (PitchTrimUtils.pitchTrimOutOfRange(trim)) {
          return PitchTrimStatus.OutOfRange;
        } else {
          return PitchTrimUtils.pitchTrimInCyanBand(cg, trim) ? PitchTrimStatus.AtTarget : PitchTrimStatus.NotAtTarget;
        }
      }
    },
    this.trimPosition,
    this.cgPercent,
    this.fwcFlightPhase,
    this.anyEngRunning,
  );

  private readonly optimalPitchTrim = MappedSubject.create(
    ([cg, phase]) => {
      if (phase > 9) {
        return 0;
      } else {
        return PitchTrimUtils.cgToPitchTrim(cg);
      }
    },
    this.cgPercent,
    this.fwcFlightPhase,
  );

  degreesToPixel(deg: number) {
    return (10 - deg) * 17.25 + 103.5;
  }

  /** in pixels, where magenta GW CG box is */
  private readonly gwCgPositionTransform = MappedSubject.create(
    ([pitch, optimal]) => `translate(0 ${(pitch - optimal) * 17.25 - 5})`,
    this.trimPosition,
    this.optimalPitchTrim,
  );

  private readonly gwCgVisibility = MappedSubject.create(
    ([flightPhase, hydPress, engRunning]) => (engRunning && flightPhase <= 10 && hydPress ? 'inherit' : 'hidden'),
    this.fwcFlightPhase,
    this.oneHydPressurized,
    this.anyEngRunning,
  );

  /** in pixels, where upper magenta box starts */
  private readonly optimalPitchTrimUpperBoxStart = this.optimalPitchTrim.map((it) =>
    this.degreesToPixel(Math.min(it + 1.5, 5.8)),
  );

  /** in pixels, where middle of magenta boxes is */
  private readonly optimalPitchTrimCenter = this.optimalPitchTrim.map((it) => this.degreesToPixel(it));

  private readonly optimalPitchTrimUpperBoxHeight = MappedSubject.create(
    ([start, center]) => center - start,
    this.optimalPitchTrimUpperBoxStart,
    this.optimalPitchTrimCenter,
  );

  /** in pixels, where lower magenta box ends */
  private readonly optimalPitchTrimLowerBoxEnd = this.optimalPitchTrim.map((it) =>
    this.degreesToPixel(Math.max(it - 1.5, -0.2)),
  );

  private readonly optimalPitchTrimLowerBoxHeight = MappedSubject.create(
    ([end, center]) => end - center,
    this.optimalPitchTrimLowerBoxEnd,
    this.optimalPitchTrimCenter,
  );

  updateCgStatus() {
    this.cgValue.instance.classList.remove(...this.cgValue.instance.classList);
    this.arrowRef.instance.classList.remove(...this.cgValue.instance.classList);

    switch (this.cgStatus.get()) {
      case PitchTrimStatus.AfterLanding:
        this.cgGroup.instance.style.visibility = 'inherit';
        this.outOfRangeGroup.instance.style.visibility = 'hidden';
        this.cgValue.instance.classList.add('White');
        this.arrowRef.instance.style.fill = 'white';
        break;
      case PitchTrimStatus.OutOfRange:
        this.cgGroup.instance.style.visibility = 'hidden';
        this.outOfRangeGroup.instance.style.visibility = 'inherit';
        this.arrowRef.instance.style.fill = 'red';
        break;
      case PitchTrimStatus.AtTarget:
        this.cgGroup.instance.style.visibility = 'inherit';
        this.outOfRangeGroup.instance.style.visibility = 'hidden';
        this.cgValue.instance.classList.add('Green');
        this.arrowRef.instance.style.fill = '#00ff00';
        break;
      case PitchTrimStatus.NotAtTarget:
        this.cgGroup.instance.style.visibility = 'inherit';
        this.outOfRangeGroup.instance.style.visibility = 'hidden';
        this.cgValue.instance.classList.add('Amber');
        this.arrowRef.instance.style.fill = '#e68000';
        break;
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.cgStatus.sub(() => this.updateCgStatus(), true));

    this.subscriptions.push(
      this.pitchTrimVisibility,
      this.trimPosition,
      this.thsForText,
      this.rightWheelY,
      this.trimAreasTransform,
      this.fwcFlightPhase,
      this.flightPhaseAfterTouchdown,
      this.anyEngRunning,
      this.cgPercent,
      this.cgPercentText,
      this.greenHydPressurized,
      this.yellowHydPressurized,
      this.oneHydPressurized,
      this.cgStatus,
      this.optimalPitchTrim,
      this.gwCgPositionTransform,
      this.gwCgVisibility,
      this.optimalPitchTrimCenter,
      this.optimalPitchTrimLowerBoxEnd,
      this.optimalPitchTrimLowerBoxHeight,
      this.optimalPitchTrimUpperBoxHeight,
      this.optimalPitchTrimUpperBoxStart,
    );
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <div style={{ visibility: this.pitchTrimVisibility }}>
        <img src="/Images/fbw-a380x/TRIM_INDICATOR.png" class="TrimIndicatorImage" />
        <svg class="TrimIndicatorSvg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="rightWheelGradient" x1="0%" x2="0%" y1="0%" y2="100%">
              {Array(16)
                .fill(1)
                .map((_, index) => {
                  return (
                    <>
                      <stop offset={`${index * 6.25 + 0.001}%`} stop-color="#555f72" />
                      <stop offset={`${index * 6.25 + 2.6}%`} stop-color="#555f72" />
                      <stop offset={`${index * 6.25 + 2.6001}%`} stop-color="white" />
                      <stop offset={`${(index + 1) * 6.25 + 0.001}%`} stop-color="white" />
                    </>
                  );
                })}
            </linearGradient>
            <linearGradient id="shadowGradient" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stop-color="black" stop-opacity="1" />
              <stop offset="10%" stop-color="black" stop-opacity="0" />
              <stop offset="90%" stop-color="black" stop-opacity="0" />
              <stop offset="100%" stop-color="black" stop-opacity="1" />
            </linearGradient>
            <linearGradient id="markerGradient1" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stop-color="#8fadc0" />
              <stop offset="90%" stop-color="#6387a1" />
            </linearGradient>
            <linearGradient id="markerGradient2" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stop-color="#8fadc0" />
              <stop offset="60%" stop-color="#444444" />
              <stop offset="100%" stop-color="#8fadc0" />
            </linearGradient>
            <clipPath id="cut-right">
              <rect x="319" y="23" width="16" height="207" />
            </clipPath>
            <clipPath id="cut-left">
              <rect x="276" y="23" width="30" height="207" />
            </clipPath>
          </defs>
          <g>
            <text x={2} y={138} font-size={21.7} class="White">
              T.O THS
            </text>
            <g ref={this.cgGroup}>
              <text x={110} y={138} font-size={21.7} class="White">
                FOR
              </text>
              <text x={162} y={140} font-size={26.6} class="White" ref={this.cgValue}>
                {this.thsForText}
              </text>
              <text x={232} y={140} font-size={21.7} class="Cyan">
                %
              </text>
            </g>
            <g ref={this.outOfRangeGroup}>
              <text x={125} y={130} font-size={26.6} class="Red">
                OUT OF
              </text>
              <text x={130} y={160} font-size={26.6} class="Red">
                RANGE
              </text>
            </g>
            <g transform={this.gwCgPositionTransform} visibility={this.gwCgVisibility}>
              <rect x={360} y={117} width={71} height={30} stroke="#ff94ff" stroke-width={2} />
              <text x={362} y={140} font-size={21.7} class="Magenta">
                {this.cgPercentText}
              </text>
              <text x={416} y={140} font-size={21.7} class="Cyan">
                %
              </text>
            </g>
          </g>
          <g clip-path="url(#cut-right)">
            <rect width="14" height="600" x="320" y={this.rightWheelY} stroke="black" fill="url(#rightWheelGradient)" />
            <rect x="319" y="23" width="16" height="207" fill="url(#shadowGradient)" />
          </g>
          <g clip-path="url(#cut-left)">
            <g transform={this.trimAreasTransform}>
              <rect width="28" height="414" x="0" y="0" stroke="black" fill="#555f72" />
              <rect width="25" height="207" x="2" y="103.5" fill="none" stroke="white" stroke-width="2" />
              <rect width="23" height="103.5" x="3" y="175.95" fill="none" stroke="#00ff00" stroke-width="4" />
              <rect
                width="16"
                height={this.optimalPitchTrimUpperBoxHeight}
                x="6"
                y={this.optimalPitchTrimUpperBoxStart}
                fill="none"
                stroke="#ff94ff"
                stroke-width="4"
                visibility={this.gwCgVisibility}
              />
              <rect
                width="16"
                height={this.optimalPitchTrimLowerBoxHeight}
                x="6"
                y={this.optimalPitchTrimCenter}
                fill="none"
                stroke="#ff94ff"
                stroke-width="4"
                visibility={this.gwCgVisibility}
              />
              <rect width="20" height="4" x="5" y="274" fill="white" visibility={this.flightPhaseAfterTouchdown} />
            </g>
            <rect x="275" y="23" width="30" height="207" fill="url(#shadowGradient)" />
          </g>
          <polygon points="265,115 265,138 277,126.5" ref={this.arrowRef} />
          <rect x="277" y="118" width="28" height="4" fill="url(#markerGradient1)" />
          <rect x="277" y="130" width="28" height="4" fill="url(#markerGradient1)" />
          <rect x="318" y="113" width="2" height="25" fill="url(#markerGradient2)" />
          <rect x="334" y="113" width="2" height="25" fill="url(#markerGradient2)" />
        </svg>
      </div>
    );
  }
}
