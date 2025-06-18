import {
  ClockEvents,
  ComponentProps,
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

interface TcasState {
  tcasState: number;
  isTcasCorrective: boolean;
  tcasRedZoneL: number;
  tcasRedZoneH: number;
  tcasGreenZoneL: number;
  tcasGreenZoneH: number;
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

  private vspeedTcas = FSComponent.createRef<VSpeedTcas>();

  private filteredRadioAltitude = 0;

  private tcasState: TcasState = {
    tcasState: 0,
    isTcasCorrective: false,
    tcasRedZoneL: 0,
    tcasRedZoneH: 0,
    tcasGreenZoneL: 0,
    tcasGreenZoneH: 0,
  };

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

    sub.on('decMode').handle((v) => {
      if (this.declutterMode != v.get()) {
        this.declutterMode = v.get();
        this.handlePos();
      }
    });

    sub.on('cWndMode').handle((value) => {
      if (this.crosswindMode != value.get()) {
        this.crosswindMode = value.get();
        this.handlePos();
      }
    });
    sub.on('VSI').handle((v) => {
      if (this.VS != v.get().toString()) {
        this.VS = v.get().toString();
        this.VSRef.instance.style.display = `${this.VS}`;
        this.handlePos();
      }
    });
    sub
      .on('tcasState')
      .whenChanged()
      .handle((s) => {
        this.tcasState.tcasState = s;
        this.needsUpdate = true;
      });

    sub
      .on('tcasCorrective')
      .whenChanged()
      .handle((s) => {
        this.tcasState.isTcasCorrective = s;
        this.needsUpdate = true;
      });
    sub
      .on('tcasRedZoneL')
      .whenChanged()
      .handle((s) => {
        this.tcasState.tcasRedZoneL = s;
        this.needsUpdate = true;
      });
    sub
      .on('tcasRedZoneH')
      .whenChanged()
      .handle((s) => {
        this.tcasState.tcasRedZoneH = s;
        this.needsUpdate = true;
      });
    sub
      .on('tcasGreenZoneL')
      .whenChanged()
      .handle((s) => {
        this.tcasState.tcasGreenZoneL = s;
        this.needsUpdate = true;
      });
    sub
      .on('tcasGreenZoneH')
      .whenChanged()
      .handle((s) => {
        this.tcasState.tcasGreenZoneH = s;
        this.needsUpdate = true;
      });

    sub.on('realTime').handle((_r) => {
      if (this.needsUpdate) {
        if (this.tcasState.tcasState === 2) {
          this.needleColour.set('White');
        }
        this.vspeedTcas.instance.update(this.tcasState);
      }
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
          this.vsNormal.instance.style.visibility = 'visible';
        }

        const radioAltitudeValid = !this.radioAlt.isNoComputedData() && !this.radioAlt.isFailureWarning();
        if (this.tcasState.tcasState !== 2) {
          if (
            absVSpeed >= 6000 ||
            (vs.value <= -2000 &&
              radioAltitudeValid &&
              this.filteredRadioAltitude <= 2500 &&
              this.filteredRadioAltitude >= 1000) ||
            (vs.value <= -1200 && radioAltitudeValid && this.filteredRadioAltitude <= 1000)
          ) {
            this.needleColour.set('Green');
          } else {
            this.needleColour.set('Green');
          }
        }

        const sign = Math.sign(filteredVS);

        if (absVSpeed < 1000) {
          this.yOffsetSub.set((filteredVS / 1000) * -136.1);
        } else if (absVSpeed < 2000) {
          this.yOffsetSub.set(((filteredVS - sign * 1000) / 1000) * -50.5 - sign * 136.1);
        } else if (absVSpeed < 6000) {
          this.yOffsetSub.set(((filteredVS - sign * 2000) / 4000) * -50.5 - sign * 186.6);
        } else {
          this.yOffsetSub.set(sign * -237);
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

        <VSpeedTcas ref={this.vspeedTcas} bus={this.props.bus} />

        <g id="VerticalSpeedGroup" ref={this.vsNormal}>
          <path class="Fill Green" d="m 665 361 h 20 v 4 h -20 z" />
          <VSpeedNeedle yOffset={this.yOffsetSub} needleColour={this.needleColour} />

          <VSpeedText
            bus={this.props.bus}
            yOffset={this.yOffsetSub}
            textColour={this.needleColour.map((c) => (c === 'Green' ? 'Green' : c))}
          />
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

interface VSpeedTcasProps extends ComponentProps {
  bus: EventBus;
}
class VSpeedTcas extends DisplayComponent<VSpeedTcasProps> {
  private tcasGroup = FSComponent.createRef<SVGGElement>();

  private nonCorrective = FSComponent.createRef<SVGGElement>();

  private background = FSComponent.createRef<SVGRectElement>();

  private redZoneElement = FSComponent.createRef<VSpeedTcasZone>();

  private greenZoneElement = FSComponent.createRef<VSpeedTcasZone>();

  private redZone = Subject.create(-1);

  private redZoneHigh = Subject.create(-1);

  private greenZone = Subject.create(-1);

  private greenZoneHigh = Subject.create(-1);

  private extended = Subject.create(false);

  private isCorrective = Subject.create(false);

  public update(state: TcasState) {
    if (state.tcasState !== 2) {
      this.tcasGroup.instance.classList.add('HiddenElement');
      this.nonCorrective.instance.classList.add('HiddenElement');
    } else if (state.isTcasCorrective) {
      this.tcasGroup.instance.classList.remove('HiddenElement');
      this.background.instance.classList.remove('HiddenElement');
      this.redZone.set(state.tcasRedZoneL);
      this.redZoneHigh.set(state.tcasRedZoneH);
      this.greenZone.set(state.tcasGreenZoneL);
      this.greenZoneHigh.set(state.tcasGreenZoneH);
      this.nonCorrective.instance.classList.add('HiddenElement');
    } else {
      this.background.instance.classList.add('HiddenElement');
      this.nonCorrective.instance.classList.add('HiddenElement');

      this.isCorrective.set(false);
      this.extended.set(false);
      this.redZone.set(state.tcasRedZoneL);
      this.redZoneHigh.set(state.tcasRedZoneH);
    }
  }

  render(): VNode {
    return (
      <>
        <g id="VerticalSpeedTCASGroup" ref={this.tcasGroup}>
          <rect ref={this.background} class="TapeBackground" height="509" width="27.7" y="149.6" x="759.2" />
          <VSpeedTcasZone
            ref={this.redZoneElement}
            zoneBoundLow={this.redZone}
            zoneBoundHigh={this.redZoneHigh}
            zoneClass="Fill Red"
            isCorrective={this.isCorrective}
            extended={Subject.create(false)}
          />
          <VSpeedTcasZone
            ref={this.greenZoneElement}
            zoneBoundLow={this.greenZone}
            zoneBoundHigh={this.greenZoneHigh}
            zoneClass="Fill Green"
            extended={this.extended}
            isCorrective={this.isCorrective}
          />
        </g>
        <g id="VerticalSpeedTCASGroupNonCorrective" ref={this.nonCorrective}>
          <VSpeedTcasZone
            zoneBoundLow={this.redZone}
            zoneBoundHigh={this.redZoneHigh}
            zoneClass="Fill Red"
            extended={Subject.create(false)}
            isCorrective={Subject.create(false)}
          />
        </g>
      </>
    );
  }
}

interface VSpeedTcasZoneProps extends ComponentProps {
  zoneBoundLow: Subscribable<number>;
  zoneBoundHigh: Subscribable<number>;
  zoneClass: string;
  isCorrective: Subscribable<boolean>;
  extended: Subscribable<boolean>;
}
class VSpeedTcasZone extends DisplayComponent<VSpeedTcasZoneProps> {
  private zoneUpper = 0;

  private zoneLower = 0;

  private extended = false;

  private isCorrective = false;

  private path = FSComponent.createRef<SVGPathElement>();

  private getYoffset = (VSpeed: number) => {
    const absVSpeed = Math.abs(VSpeed);
    const sign = Math.sign(VSpeed);

    if (absVSpeed < 1000) {
      return (VSpeed / 1000) * -27.22;
    }
    if (absVSpeed < 2000) {
      return ((VSpeed - sign * 1000) / 1000) * -10.1 - sign * 27.22;
    }
    if (absVSpeed < 6000) {
      return ((VSpeed - sign * 2000) / 4000) * -10.1 - sign * 37.32;
    }
    return sign * -47.37;
  };

  private drawTcasZone() {
    if (this.zoneLower !== -1 && this.zoneUpper !== -1) {
      let y1;
      let y2;
      let y3;
      let y4;

      if (this.zoneLower >= 6000) {
        y1 = 29.92;
      } else if (this.zoneLower <= -6000) {
        y1 = 131.72;
      } else {
        y1 = 80.822 + this.getYoffset(this.zoneLower);
      }

      if (this.zoneUpper >= 6000) {
        y2 = 29.92;
      } else if (this.zoneUpper <= -6000) {
        y2 = 131.72;
      } else {
        y2 = 80.822 + this.getYoffset(this.zoneUpper);
      }

      if (
        (Math.abs(this.zoneUpper) > 1750 && Math.abs(this.zoneUpper) > Math.abs(this.zoneLower)) ||
        (this.isCorrective && this.props.zoneClass === 'Fill Red')
      ) {
        y3 = y2;
      } else {
        // y3 = 80.822 + getYoffset(zoneBounds[1] / 2);
        y3 = 80.822;
      }

      if (
        (Math.abs(this.zoneLower) > 1750 && Math.abs(this.zoneLower) > Math.abs(this.zoneUpper)) ||
        (this.isCorrective && this.props.zoneClass === 'Fill Red')
      ) {
        y4 = y1;
      } else {
        // y4 = 80.822 + getYoffset(zoneBounds[0] / 2);
        y4 = 80.822;
      }

      const x1 = 151.84;
      const x2 = this.extended ? 162.74 : 157.3804;

      this.path.instance.setAttribute('d', `m${x1},${y1} L${x1},${y2} L${x2},${y3} L${x2},${y4} L${x1},${y1}z`);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.zoneBoundLow.sub((z) => {
      this.zoneLower = z;
      this.drawTcasZone();
    });

    this.props.zoneBoundHigh.sub((z) => {
      this.zoneUpper = z;
      this.drawTcasZone();
    });

    this.props.extended.sub((z) => {
      this.extended = z;
      this.drawTcasZone();
    });

    this.props.isCorrective.sub((z) => {
      this.isCorrective = z;
      this.drawTcasZone();
    });
  }

  render(): VNode {
    return <path ref={this.path} class={this.props.zoneClass} />;
  }
}
