// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, NodeReference, VNode, Subscribable, Subject } from '@microsoft/msfs-sdk';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';

import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { getDisplayIndex } from './HUD';
import { HudElems } from './HUDUtils';

interface HorizontalTapeProps {
  displayRange: number;
  valueSpacing: number;
  distanceSpacing: number;
  type: 'horizon' | 'headingTape';
  bus: ArincEventBus;
  yOffset?: Subscribable<number>;
}
export class HorizontalTape extends DisplayComponent<HorizontalTapeProps> {
  private declutterMode = 0;
  private flightPhase = 0;
  private headingTicksVisibility = Subject.create('none');

  private refElement = FSComponent.createRef<SVGGElement>();

  private tapeOffset = 0;

  private tickNumberRefs: NodeReference<SVGTextElement>[] = [];

  private currentDrawnHeading = 0;

  private yOffset = 0;

  private DeclutterSimVar = '';

  private buildHorizonTicks(): { ticks: SVGPathElement[]; labels?: SVGTextElement[] } {
    const result = { ticks: [] as SVGPathElement[], labels: [] as SVGTextElement[] };

    result.ticks.push(<path transform="translate(0 0)" class="ScaledStroke White" d="m68.906 80.823v1.8" />);

    for (let i = 0; i < 6; i++) {
      const headingOffset = (1 + i) * this.props.valueSpacing;
      const dX = (this.props.distanceSpacing / this.props.valueSpacing) * headingOffset;

      if (headingOffset % 10 === 0) {
        result.ticks.push(<path class="ScaledStroke White" d="m68.906 80.823v1.8" transform={`translate(${dX} 0)`} />);
        result.ticks.unshift(
          <path class="ScaledStroke White" d="m68.906 80.823v1.8" transform={`translate(${-dX} 0)`} />,
        );
      }
    }

    return result;
  }

  private buildHeadingTicks(): { ticks: SVGLineElement[]; labels: SVGTextElement[] } {
    const result = {
      ticks: [] as SVGLineElement[],
      labels: [] as SVGTextElement[],
    };

    const tickLength = 7;
    let textRef = FSComponent.createRef<SVGTextElement>();

    result.ticks.push(<path class="ScaledStroke Green" d={`m640 512v${tickLength}`} transform="translate(0 0)" />);

    result.labels.push(
      <text
        id="HeadingLabel"
        class="Green MiddleAlign FontSmallest"
        ref={textRef}
        x="640"
        y="540"
        transform={`translate(${0} 0)`}
      >
        360
      </text>,
    );
    this.tickNumberRefs.push(textRef);

    for (let i = 0; i < 6; i++) {
      const headingOffset = (1 + i) * this.props.valueSpacing;
      const dX = (this.props.distanceSpacing / this.props.valueSpacing) * headingOffset;

      // if (headingOffset % 10 === 0) {
      result.ticks.push(
        <path
          class="ScaledStroke Green"
          d={`m640 512v${tickLength}`}
          style={`transform: translate3d(${dX}px, 0px, 0px)`}
        />,
      );
      result.ticks.unshift(
        <path
          class="ScaledStroke Green"
          d={`m640 512v${tickLength}`}
          style={`transform: translate3d(${-dX}px, 0px, 0px)`}
        />,
      );
      // } else {
      //     result.ticks.push(<path class="ScaledStroke Green" d={`m512 384v${tickLength * 0.42}`} style={`transform: translate3d(${dX}px, 0px, 0px)`} />);
      //     result.ticks.unshift(<path class="ScaledStroke Green" d={`m512 384v${tickLength * 0.42}`} style={`transform: translate3d(${-dX}px, 0px, 0px)`} />);
      // }

      if (headingOffset % 10 === 0) {
        textRef = FSComponent.createRef<SVGTextElement>();

        result.labels.unshift(
          <text
            id="HeadingLabel"
            class="Green MiddleAlign FontSmallest"
            ref={textRef}
            x="640"
            y="540"
            style={`transform: translate3d(${-dX}px, 0px, 0px)`}
          >
            {headingOffset}
          </text>,
        );
        this.tickNumberRefs.unshift(textRef);
        textRef = FSComponent.createRef<SVGTextElement>();
        result.labels.push(
          <text
            id="HeadingLabel"
            class="Green MiddleAlign FontSmallest"
            ref={textRef}
            x="640"
            y="540"
            style={`transform: translate3d(${dX}px, 0px, 0px)`}
          >
            {360 - headingOffset}
          </text>,
        );
        this.tickNumberRefs.push(textRef);
      }
    }

    return result;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isCaptainSide = getDisplayIndex() === 1;
    const sub = this.props.bus.getArincSubscriber<Arinc429Values & DmcLogicEvents & HUDSimvars & HudElems>();

    this.props.yOffset?.sub((yOffset) => {
      this.yOffset = yOffset;
      this.refElement.instance.style.transform = `translate3d(${this.tapeOffset}px, ${yOffset}px, 0px)`;
    });

    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        isCaptainSide
          ? (this.DeclutterSimVar = 'L:A32NX_HUD_L_DECLUTTER_MODE')
          : (this.DeclutterSimVar = 'L:A32NX_HUD_R_DECLUTTER_MODE');
        this.declutterMode = SimVar.GetSimVarValue(this.DeclutterSimVar, 'Number');
        this.flightPhase = fp;
        //onGround
        if (this.flightPhase <= 4 || this.flightPhase >= 8) {
          this.headingTicksVisibility.set('block');
        }
        //inFlight
        if (this.flightPhase > 4 && this.flightPhase < 8) {
          isCaptainSide
            ? (this.DeclutterSimVar = 'L:A32NX_HUD_L_DECLUTTER_MODE')
            : (this.DeclutterSimVar = 'L:A32NX_HUD_R_DECLUTTER_MODE');
          this.declutterMode = SimVar.GetSimVarValue(this.DeclutterSimVar, 'Number');
          if (this.declutterMode == 2) {
            this.headingTicksVisibility.set('none');
          }
          if (this.declutterMode < 2) {
            this.headingTicksVisibility.set('block');
          }
        }
      });

    sub
      .on('decMode')
      .whenChanged()
      .handle((value) => {
        this.flightPhase = SimVar.GetSimVarValue('L:A32NX_FWC_FLIGHT_PHASE', 'Number');
        this.declutterMode = value;
        //onGround
        if (this.flightPhase <= 4 || this.flightPhase >= 8) {
          this.headingTicksVisibility.set('block');
        }
        //inFlight
        if (this.flightPhase > 4 && this.flightPhase < 8) {
          isCaptainSide
            ? (this.DeclutterSimVar = 'L:A32NX_HUD_L_DECLUTTER_MODE')
            : (this.DeclutterSimVar = 'L:A32NX_HUD_R_DECLUTTER_MODE');
          this.declutterMode = SimVar.GetSimVarValue(this.DeclutterSimVar, 'Number');
          if (this.declutterMode == 2) {
            this.headingTicksVisibility.set('none');
          }
          if (this.declutterMode < 2) {
            this.headingTicksVisibility.set('block');
          }
        }
      });

    sub
      .on('heading')
      .withArinc429Precision(2)
      .handle((newVal) => {
        const tapeOffset = ((-newVal.value % 10) * this.props.distanceSpacing) / this.props.valueSpacing;

        if (newVal.value / 10 >= this.currentDrawnHeading + 1 || newVal.value / 10 <= this.currentDrawnHeading) {
          this.currentDrawnHeading = Math.floor(newVal.value / 10);

          const start = 330 + this.currentDrawnHeading * 10;

          this.tickNumberRefs.forEach((t, index) => {
            const scrollerValue = t.instance;
            if (scrollerValue !== null) {
              const hdg = (start + index * 10) % 360;
              if (hdg % 10 === 0) {
                const content = hdg !== 0 ? (hdg / 10).toFixed(0) : '0';
                if (scrollerValue.textContent !== content) {
                  scrollerValue.textContent = content;
                }
              } else {
                scrollerValue.textContent = '';
              }
              // if (hdg % 30 === 0) {
              //     scrollerValue.classList.remove('FontSmallest');
              //     scrollerValue.classList.add('FontMedium');
              // } else {
              //     scrollerValue.classList.add('FontSmallest');
              //     scrollerValue.classList.remove('FontMedium');
              // }
            }
          });
        }
        this.tapeOffset = tapeOffset;

        this.refElement.instance.style.transform = `translate3d(${tapeOffset}px, ${this.yOffset}px, 0px)`;
      });
  }

  render(): VNode {
    const tapeContent = this.props.type === 'horizon' ? this.buildHorizonTicks() : this.buildHeadingTicks();

    return (
      <g id="HeadingTick" ref={this.refElement} display={this.headingTicksVisibility}>
        {tapeContent.ticks}
        {this.props.type === 'headingTape' && tapeContent.labels}
      </g>
    );
  }
}
