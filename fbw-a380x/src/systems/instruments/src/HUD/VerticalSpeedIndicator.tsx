import {
  ClockEvents,
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { Arinc429Word, ArincEventBus } from '@flybywiresim/fbw-sdk';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { LagFilter } from './HUDUtils';
import { HudElems } from './HUDUtils';

interface VerticalSpeedIndicatorProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
  filteredRadioAltitude: Subscribable<number>;
}

export class VerticalSpeedIndicator extends DisplayComponent<VerticalSpeedIndicatorProps> {
  private crosswindMode = false;
  private declutterMode = 0;
  private VS = '';
  private VSRef = FSComponent.createRef<SVGGElement>();
  private yOffsetSub = Subject.create(0);

  private needleColour = Subject.create('Green');

  private radioAlt = new Arinc429Word(0);

  private vsFailed = FSComponent.createRef<SVGGElement>();

  private vsNormal = FSComponent.createRef<SVGGElement>();

  private lagFilter = new LagFilter(2);

  private needsUpdate = false;

  private filteredRadioAltitude = 0;

  private handlePos() {
    if (this.crosswindMode) {
      // transform="translate(475 135)
      this.VSRef.instance.style.transform = 'translate3d(485px, -35px, 0px)';
    } else {
      this.VSRef.instance.style.transform = 'translate3d(485px, 155px, 0px)';
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & ClockEvents & HudElems>();

    sub
      .on('decMode')
      .whenChanged()
      .handle((value) => {
        this.declutterMode = value;
        this.handlePos();
      });

    sub
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
        this.handlePos();
      });
    sub
      .on('VSI')
      .whenChanged()
      .handle((v) => {
        this.VS = v;
        this.VSRef.instance.style.display = `${this.VS}`;
        this.handlePos();
      });
    sub
      .on('vs')
      .withArinc429Precision(2)
      .handle((vs) => {
        const filteredVS = this.lagFilter.step(vs.value, this.props.instrument.deltaTime / 1000);

        const absVSpeed = Math.abs(filteredVS);
        if (!vs.isNormalOperation()) {
          this.vsFailed.instance.style.visibility = 'visible';
          this.vsNormal.instance.style.visibility = 'hidden';
        } else {
          this.vsFailed.instance.style.visibility = 'hidden';
          absVSpeed > 50
            ? (this.vsNormal.instance.style.visibility = 'visible')
            : (this.vsNormal.instance.style.visibility = 'hidden');
        }

        const sign = Math.sign(filteredVS);
        const multiplier = this.crosswindMode ? 0.5 : 1;
        if (absVSpeed < 1000) {
          this.yOffsetSub.set((filteredVS / 1000) * -136.1 * multiplier);
        } else if (absVSpeed < 2000) {
          this.yOffsetSub.set(((filteredVS - sign * 1000) / 1000) * -50.5 - sign * 136.1 * multiplier);
        } else if (absVSpeed < 6000) {
          this.yOffsetSub.set(((filteredVS - sign * 2000) / 4000) * -50.5 - sign * 186.6 * multiplier);
        } else {
          this.yOffsetSub.set(sign * -237 * multiplier);
        }
      });

    sub.on('chosenRa').handle((ra) => {
      this.radioAlt = ra;
    });

    this.props.filteredRadioAltitude.sub((filteredRadioAltitude) => {
      this.filteredRadioAltitude = filteredRadioAltitude;
    });
  }

  render(): VNode {
    return (
      <g id="VerticalSpeedIndicator" ref={this.VSRef}>
        <g id="VSpeedFailText" ref={this.vsFailed}>
          <text class="Blink9Seconds FontLargest Green EndAlign" x="686.7972891000001" y="347.59410192">
            V
          </text>
          <text class="Blink9Seconds FontLargest Green EndAlign" x="686.8062591" y="373.20307518">
            /
          </text>
          <text class="Blink9Seconds FontLargest Green EndAlign" x="686.1769239" y="398.585623215">
            S
          </text>
        </g>

        <g id="VerticalSpeedGroup" ref={this.vsNormal}>
          <path class="Fill Green" d="m 665 361 h 20 v 4 h -20 z" />
          <VSpeedNeedle yOffset={this.yOffsetSub} needleColour={this.needleColour} />

          <VSpeedText bus={this.props.bus} yOffset={this.yOffsetSub} textColour={this.needleColour} />
        </g>
      </g>
    );
  }
}

class VSpeedNeedle extends DisplayComponent<{ yOffset: Subscribable<number>; needleColour: Subscribable<string> }> {
  private outLineRef = FSComponent.createRef<SVGPathElement>();

  private indicatorRef = FSComponent.createRef<SVGPathElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const dxFull = 50;
    const dxBorder = 13;
    const centerX = 733;
    const centerY = 363;

    this.props.yOffset.sub((yOffset) => {
      const path = `m${centerX - dxBorder} ${centerY + (dxBorder / dxFull) * yOffset} l ${dxBorder - dxFull} ${(1 - dxBorder / dxFull) * yOffset}`;

      this.outLineRef.instance.setAttribute('d', path);
      this.indicatorRef.instance.setAttribute('d', path);
    });

    this.props.needleColour.sub((colour) => {
      this.indicatorRef.instance.setAttribute('class', `ThickStroke ${colour}`);
    }, true);
  }

  render(): VNode | null {
    return (
      <>
        <path ref={this.outLineRef} class="NormalOutline" />
        <path ref={this.indicatorRef} id="VSpeedIndicator" />
      </>
    );
  }
}

class VSpeedText extends DisplayComponent<{
  bus: EventBus;
  yOffset: Subscribable<number>;
  textColour: Subscribable<string>;
}> {
  private vsTextRef = FSComponent.createRef<SVGTextElement>();

  private groupRef = FSComponent.createRef<SVGGElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values>();

    sub.on('vs').handle((vs) => {
      const absVSpeed = Math.abs(vs.value);

      if (absVSpeed < 200) {
        this.groupRef.instance.setAttribute('visibility', 'hidden');
        return;
      }
      this.groupRef.instance.setAttribute('visibility', 'visible');

      const sign = Math.sign(vs.value);

      const textOffset = this.props.yOffset.get() - sign * 12;
      const textOffsetX = sign > 0 ? 0 : -5;

      const minusSign = sign > 0 ? '' : '-';

      const text = minusSign + (Math.round(absVSpeed / 100) < 10 ? '0' : '') + Math.round(absVSpeed / 100).toString();
      this.vsTextRef.instance.textContent = text;
      this.groupRef.instance.setAttribute('transform', `translate(${textOffsetX} ${textOffset})`);
    });

    this.props.textColour.sub((colour) => {
      const className = `FontSmallest MiddleAlign ${colour}`;
      this.vsTextRef.instance.setAttribute('class', className);
    }, true);
  }

  render(): VNode {
    return (
      <g ref={this.groupRef} id="VSpeedTextGroup">
        <text ref={this.vsTextRef} id="VSpeedText" x="695.8029" y="370.0125" />
      </g>
    );
  }
}
