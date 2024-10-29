// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429RegisterSubject } from '@flybywiresim/fbw-sdk';

import { ArmedLateralMode, ArmedVerticalMode, isArmed, LateralMode, VerticalMode } from '@shared/autopilot';
import { Arinc429Values } from './shared/ArincValueProvider';
import { PFDSimvars } from './shared/PFDSimvarPublisher';

/* eslint-disable no-constant-condition,no-dupe-else-if -- for keeping the FMA code while it's not active yet */

abstract class ShowForSecondsComponent<T extends ComponentProps> extends DisplayComponent<T> {
  private timeout: number = 0;

  private displayTimeInSeconds;

  protected modeChangedPathRef = FSComponent.createRef<SVGPathElement>();

  protected isShown = false;

  protected constructor(props: T, displayTimeInSeconds: number) {
    super(props);
    this.displayTimeInSeconds = displayTimeInSeconds;
  }

  public displayModeChangedPath = (cancel = false) => {
    if (cancel || !this.isShown) {
      clearTimeout(this.timeout);
      this.modeChangedPathRef.instance.classList.remove('ModeChangedPath');
    } else {
      this.modeChangedPathRef.instance.classList.add('ModeChangedPath');
      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.modeChangedPathRef.instance.classList.remove('ModeChangedPath');
      }, this.displayTimeInSeconds * 1000) as unknown as number;
    }
  };
}

export class FMA extends DisplayComponent<{ bus: ArincEventBus; isAttExcessive: Subscribable<boolean> }> {
  private activeLateralMode: number = 0;

  private activeVerticalMode: number = 0;

  private armedVerticalModeSub = Subject.create(0);

  private autobrakeMode = 0;

  private athrModeMessage = 0;

  private machPreselVal = 0;

  private speedPreselVal = 0;

  private setHoldSpeed = false;

  private tdReached = false;

  private checkSpeedMode = false;

  private tcasRaInhibited = Subject.create(false);

  private trkFpaDeselected = Subject.create(false);

  private fcdcDiscreteWord1 = new Arinc429Word(0);

  private fwcFlightPhase = 0;

  private firstBorderSub = Subject.create('');

  private secondBorderSub = Subject.create('');

  private handleFMABorders() {
    const sharedModeActive =
      this.activeLateralMode === 32 ||
      this.activeLateralMode === 33 ||
      this.activeLateralMode === 34 ||
      (this.activeLateralMode === 20 && this.activeVerticalMode === 24);
    const BC3Message =
      getBC3Message(
        this.props.isAttExcessive.get(),
        this.armedVerticalModeSub.get(),
        this.setHoldSpeed,
        this.trkFpaDeselected.get(),
        this.tcasRaInhibited.get(),
        this.fcdcDiscreteWord1,
        this.fwcFlightPhase,
        this.tdReached,
        this.checkSpeedMode,
      )[0] !== null;

    const AB3Message =
      this.athrModeMessage === 0 &&
      this.autobrakeMode !== 3 &&
      (this.machPreselVal !== -1 || this.speedPreselVal !== -1) &&
      !BC3Message;

    let secondBorder: string;
    if (sharedModeActive && !this.props.isAttExcessive.get()) {
      secondBorder = '';
    } else if (BC3Message) {
      secondBorder = 'm66.241 0.33732v15.766';
    } else {
      secondBorder = 'm66.241 0.33732v20.864';
    }

    let firstBorder: string;
    if (AB3Message && !this.props.isAttExcessive.get()) {
      firstBorder = 'm33.117 0.33732v15.766';
    } else {
      firstBorder = 'm33.117 0.33732v20.864';
    }

    this.firstBorderSub.set(firstBorder);
    this.secondBorderSub.set(secondBorder);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values>();

    this.props.isAttExcessive.sub((_a) => {
      this.handleFMABorders();
    });

    sub
      .on('fmaVerticalArmed')
      .whenChanged()
      .handle((a) => {
        this.armedVerticalModeSub.set(a);
        this.handleFMABorders();
      });

    sub
      .on('activeLateralMode')
      .whenChanged()
      .handle((activeLateralMode) => {
        this.activeLateralMode = activeLateralMode;
        this.handleFMABorders();
      });
    sub
      .on('activeVerticalMode')
      .whenChanged()
      .handle((activeVerticalMode) => {
        this.activeVerticalMode = activeVerticalMode;
        this.handleFMABorders();
      });

    sub
      .on('speedPreselVal')
      .whenChanged()
      .handle((s) => {
        this.speedPreselVal = s;
        this.handleFMABorders();
      });

    sub
      .on('machPreselVal')
      .whenChanged()
      .handle((m) => {
        this.machPreselVal = m;
        this.handleFMABorders();
      });

    sub
      .on('setHoldSpeed')
      .whenChanged()
      .handle((shs) => {
        this.setHoldSpeed = shs;
        this.handleFMABorders();
      });

    sub
      .on('tcasRaInhibited')
      .whenChanged()
      .handle((tra) => {
        this.tcasRaInhibited.set(tra);
        this.handleFMABorders();
      });

    sub
      .on('trkFpaDeselectedTCAS')
      .whenChanged()
      .handle((trk) => {
        this.trkFpaDeselected.set(trk);
        this.handleFMABorders();
      });

    sub
      .on('fcdcDiscreteWord1')
      .atFrequency(1)
      .handle((fcdcDiscreteWord1) => {
        this.fcdcDiscreteWord1 = fcdcDiscreteWord1;
        this.handleFMABorders();
      });

    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((fwcFlightPhase) => {
        this.fwcFlightPhase = fwcFlightPhase;
      });

    sub
      .on('tdReached')
      .whenChanged()
      .handle((tdr) => {
        this.tdReached = tdr;
        this.handleFMABorders();
      });

    sub
      .on('checkSpeedMode')
      .whenChanged()
      .handle((csm) => {
        this.checkSpeedMode = csm;
        this.handleFMABorders();
      });

    sub
      .on('athrModeMessage')
      .whenChanged()
      .handle((athr) => {
        this.athrModeMessage = athr;
        this.handleFMABorders();
      });

    sub
      .on('autoBrakeMode')
      .whenChanged()
      .handle((ab) => {
        this.autobrakeMode = ab;
        this.handleFMABorders();
      });
  }

  render(): VNode {
    return (
      <g id="FMA">
        <g class="NormalStroke Grey">
          <path d={this.firstBorderSub} />
          <path d={this.secondBorderSub} />
          <path d="m102.52 0.33732v20.864" />
          <path d="m133.72 0.33732v20.864" />
        </g>

        <Row1 bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />
        <Row2 bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />
        <Row3 bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />
      </g>
    );
  }
}

class Row1 extends DisplayComponent<{ bus: ArincEventBus; isAttExcessive: Subscribable<boolean> }> {
  private b1Cell = FSComponent.createRef<B1Cell>();

  private c1Cell = FSComponent.createRef<C1Cell>();

  private D1D2Cell = FSComponent.createRef<D1D2Cell>();

  private BC1Cell = FSComponent.createRef<BC1Cell>();

  private cellsToHide = FSComponent.createRef<SVGGElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.isAttExcessive.sub((a) => {
      if (a) {
        this.cellsToHide.instance.style.display = 'none';
        this.b1Cell.instance.displayModeChangedPath(true);
        this.c1Cell.instance.displayModeChangedPath(true);
        this.BC1Cell.instance.displayModeChangedPath(true);
      } else {
        this.cellsToHide.instance.style.display = 'inline';
        this.b1Cell.instance.displayModeChangedPath();
        this.c1Cell.instance.displayModeChangedPath();
        this.BC1Cell.instance.displayModeChangedPath();
      }
    });
  }

  render(): VNode {
    return (
      <g>
        <A1A2Cell bus={this.props.bus} />

        <g ref={this.cellsToHide}>
          <B1Cell ref={this.b1Cell} bus={this.props.bus} />
          <C1Cell ref={this.c1Cell} bus={this.props.bus} />
          <D1D2Cell ref={this.D1D2Cell} bus={this.props.bus} />
          <BC1Cell ref={this.BC1Cell} bus={this.props.bus} />
        </g>
        <E1Cell bus={this.props.bus} />
      </g>
    );
  }
}

class Row2 extends DisplayComponent<{ bus: ArincEventBus; isAttExcessive: Subscribable<boolean> }> {
  private cellsToHide = FSComponent.createRef<SVGGElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.isAttExcessive.sub((a) => {
      if (a) {
        this.cellsToHide.instance.style.display = 'none';
      } else {
        this.cellsToHide.instance.style.display = 'inline';
      }
    });
  }

  render(): VNode {
    return (
      <g>
        <A2Cell bus={this.props.bus} />
        <g ref={this.cellsToHide}>
          <B2Cell bus={this.props.bus} />
          <C2Cell bus={this.props.bus} />
        </g>
        <E2Cell bus={this.props.bus} />
      </g>
    );
  }
}

class A2Cell extends DisplayComponent<{ bus: ArincEventBus }> {
  private text = Subject.create('');

  private className = Subject.create('FontMediumSmaller MiddleAlign Cyan');

  private autoBrkRef = FSComponent.createRef<SVGTextElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('autoBrakeMode')
      .whenChanged()
      .handle((am) => {
        switch (am) {
          case 0:
            this.text.set('');
            break;
          case 1:
            this.text.set('BRK LO ');
            break;
          case 2:
            this.text.set('BRK MED ');
            break;
          case 3:
            // MAX will be shown in 3rd row
            this.text.set('');
            break;
          default:
            break;
        }
      });

    sub
      .on('autoBrakeActive')
      .whenChanged()
      .handle((am) => {
        if (am) {
          this.autoBrkRef.instance.style.visibility = 'hidden';
        } else {
          this.autoBrkRef.instance.style.visibility = 'visible';
        }
      });

    sub
      .on('AThrMode')
      .whenChanged()
      .handle((athrMode) => {
        // ATHR mode overrides BRK LO and MED memo
        if (athrMode > 0 && athrMode <= 6) {
          this.autoBrkRef.instance.style.visibility = 'hidden';
        } else {
          this.autoBrkRef.instance.style.visibility = 'visible';
        }
      });
  }

  render(): VNode {
    return (
      <text ref={this.autoBrkRef} class={this.className} x="16.782249" y="14.329653" style="white-space: pre">
        {this.text}
      </text>
    );
  }
}

class Row3 extends DisplayComponent<{
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
}> {
  private cellsToHide = FSComponent.createRef<SVGGElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.isAttExcessive.sub((a) => {
      if (a) {
        this.cellsToHide.instance.style.display = 'none';
      } else {
        this.cellsToHide.instance.style.display = 'inline';
      }
    });
  }

  render(): VNode {
    return (
      <g>
        <A3Cell bus={this.props.bus} />
        <g ref={this.cellsToHide}>
          <AB3Cell bus={this.props.bus} />
          <D3Cell bus={this.props.bus} />
        </g>
        <BC3Cell isAttExcessive={this.props.isAttExcessive} bus={this.props.bus} />
        <E3Cell bus={this.props.bus} />
      </g>
    );
  }
}

interface CellProps extends ComponentProps {
  bus: ArincEventBus;
}

class A1A2Cell extends ShowForSecondsComponent<CellProps> {
  private athrMode = 0;

  private cellRef = FSComponent.createRef<SVGGElement>();

  private flexTemp = 0;

  private autoBrakeActive = false;

  private autoBrakeMode = 0;

  constructor(props) {
    super(props, 9);
  }

  private setText() {
    let text: string = '';
    this.isShown = true;

    switch (this.athrMode) {
      case 1:
        this.displayModeChangedPath(true);
        text = `
                                <path class="NormalStroke White" d="m25.114 1.8143v13.506h-16.952v-13.506z" />
                                <text class="FontMedium MiddleAlign White" x="17.052249" y="7.1280665">MAN</text>
                                <text class="FontMedium MiddleAlign White" x="16.869141" y="14.351689">TOGA</text>
                            `;
        break;
      case 2:
        this.displayModeChangedPath(true);
        text = `<g>
                                <path class="NormalStroke White" d="m31.521 1.8143v13.506h-30.217v-13.506z" />
                                <text class="FontMedium MiddleAlign White" x="17.052249" y="7.1280665">MAN</text>
                                <text class="FontMedium MiddleAlign White" x="16.869141" y="14.351689">GA SOFT</text>
                            </g>`;
        break;
      case 3: {
        this.displayModeChangedPath(true);
        const FlexTemp = Math.round(this.flexTemp);
        const FlexText = FlexTemp >= 0 ? `+${FlexTemp}` : FlexTemp.toString();
        text = `<g>
                                <path class="NormalStroke White" d="m30.521 1.8143v13.506h-27.217v-13.506z" />
                                <text class="FontMedium MiddleAlign White" x="17.052249" y="7.1280665">MAN</text>
                                <text class="FontMedium MiddleAlign White" x="9.669141" y="14.351689">FLX</text>
                                <text class="FontMedium MiddleAlign Cyan" x="24.099141" y="14.351689">
                               ${FlexText}
                                </text>
                            </g>`;

        break;
      }
      case 4:
        this.displayModeChangedPath(true);
        text = `<g>
                                <path class="NormalStroke White" d="m25.114 1.8143v13.506h-16.952v-13.506z" />
                                <text class="FontMedium MiddleAlign White" x="17.052249" y="7.1280665">MAN</text>
                                <text class="FontMedium MiddleAlign White" x="16.869141" y="14.351689">DTO</text>
                            </g>`;
        break;
      case 5:
        this.displayModeChangedPath(true);
        text = `<g>
                                <path class="NormalStroke White" d="m25.114 1.8143v13.506h-16.952v-13.506z" />
                                <text class="FontMedium MiddleAlign White" x="17.052249" y="7.1280665">MAN</text>
                                <text class="FontMedium MiddleAlign White" x="16.869141" y="14.351689">MCT</text>
                            </g>`;
        break;
      case 6:
        this.displayModeChangedPath(true);
        text = `<g>
                                <path class="NormalStroke Amber" d="m25.114 1.8143v13.506h-16.952v-13.506z" />
                                <text class="FontMedium MiddleAlign White" x="17.052249" y="7.1280665">MAN</text>
                                <text class="FontMedium MiddleAlign White" x="16.869141" y="14.351689">THR</text>
                            </g>`;
        break;
      case 7:
        text = '<text  class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">SPEED</text>';
        this.displayModeChangedPath();
        break;
      case 8:
        text = '<text  class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">MACH</text>';
        this.displayModeChangedPath();
        break;
      case 9:
        text = '<text  class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">THR MCT</text>';
        this.displayModeChangedPath();
        break;
      case 10:
        text = '<text  class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">THR CLB</text>';
        this.displayModeChangedPath();
        break;
      case 11:
        text = '<text  class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">THR LVR</text>';
        this.displayModeChangedPath();
        break;
      case 12:
        text = '<text  class="FontMediumSmaller MiddleAlign Green" x="16.782249" y="7.1280665">THR IDLE</text>';
        this.displayModeChangedPath();
        break;
      case 13:
        this.displayModeChangedPath(true);
        text = `<g>
                                <path class="NormalStroke Amber BlinkInfinite" d="m0.70556 1.8143h30.927v6.0476h-30.927z" />
                                <text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">A.FLOOR</text>
                            </g>`;
        break;
      case 14:
        this.displayModeChangedPath(true);
        text = `<g>
                                <path class="NormalStroke Amber BlinkInfinite" d="m0.70556 1.8143h30.927v6.0476h-30.927z" />
                                <text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">TOGA LK</text>
                            </g>`;
        break;
      default:
        if (this.autoBrakeActive) {
          switch (this.autoBrakeMode) {
            case 1:
              text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">BRK LO</text>';
              this.displayModeChangedPath();
              break;
            case 2:
              text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">BRK MED</text>';
              this.displayModeChangedPath();
              break;
            case 3:
              text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">BRK MAX</text>';
              this.displayModeChangedPath();
              break;
            default:
              text = '';
              this.isShown = false;
              this.displayModeChangedPath(true);
          }
        } else {
          text = '';
          this.isShown = false;
          this.displayModeChangedPath(true);
        }
    }

    this.cellRef.instance.innerHTML = text;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('flexTemp')
      .whenChanged()
      .handle((f) => {
        this.flexTemp = f;
        this.setText();
      });

    sub
      .on('AThrMode')
      .whenChanged()
      .handle((athrMode) => {
        this.athrMode = athrMode;
        this.setText();
      });

    sub
      .on('autoBrakeActive')
      .whenChanged()
      .handle((am) => {
        this.autoBrakeActive = am;
        this.setText();
      });

    sub
      .on('autoBrakeMode')
      .whenChanged()
      .handle((a) => {
        this.autoBrakeMode = a;
      });
  }

  render(): VNode {
    return (
      <>
        <path
          ref={this.modeChangedPathRef}
          visibility="hidden"
          class="NormalStroke White"
          d="m3.3 1.8143h27.127v6.0476h-27.127z"
        />
        <g ref={this.cellRef} />
      </>
    );
  }
}

class A3Cell extends DisplayComponent<CellProps> {
  private classSub = Subject.create('');

  private textSub = Subject.create('');

  private autobrakeMode = 0;

  private athrMessage = 0;

  private handleAthrMessageAndAutobrakeMode() {
    let text: string = '';
    let className: string = '';
    switch (this.athrMessage) {
      case 1:
        text = 'THR LK';
        className = 'Amber BlinkInfinite';
        break;
      case 2:
        text = 'LVR TOGA';
        className = 'White BlinkInfinite';
        break;
      case 3:
        text = 'LVR CLB';
        className = 'White BlinkInfinite';
        break;
      case 4:
        text = 'LVR MCT';
        className = 'White BlinkInfinite';
        break;
      case 5:
        text = 'LVR ASYM';
        className = 'Amber';
        break;
      default:
        switch (this.autobrakeMode) {
          case 3:
            text = 'BRK MAX';
            className = 'Cyan';
            break;
          default:
            text = '';
        }
    }
    this.textSub.set(text);
    this.classSub.set(`FontMedium MiddleAlign ${className}`);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('athrModeMessage')
      .whenChanged()
      .handle((m) => {
        this.athrMessage = m;
        this.handleAthrMessageAndAutobrakeMode();
      });

    sub
      .on('autoBrakeMode')
      .whenChanged()
      .handle((am) => {
        this.autobrakeMode = am;
        this.handleAthrMessageAndAutobrakeMode();
      });

    sub
      .on('autoBrakeActive')
      .whenChanged()
      .handle((a) => {
        if (a) {
          this.classSub.set('HiddenElement');
        }
      });
  }

  render(): VNode {
    return (
      <text class={this.classSub} x="16.989958" y="21.641243">
        {this.textSub}
      </text>
    );
  }
}

class AB3Cell extends DisplayComponent<CellProps> {
  private speedPreselVal = -1;

  private machPreselVal = -1;

  private athrModeMessage = 0;

  private autobrakeMode = 0;

  private textSub = Subject.create('');

  private text2Sub = Subject.create('');

  private textXPosSub = Subject.create(0);

  private getText() {
    if (this.athrModeMessage === 0 && this.autobrakeMode !== 3) {
      /* use vertical bar instead of : for PRESEL text since : is not aligned to the bottom as the other fonts and the font file is used on ECAM, ND etc.
                vertical bar is mapped to ":" aligned to bottom in font file
                 */
      if (this.speedPreselVal !== -1 && this.machPreselVal === -1) {
        const text = Math.round(this.speedPreselVal);
        this.textSub.set('SPEED SEL|   ');
        this.text2Sub.set(`${text}`);
        this.textXPosSub.set(35.434673);
      } else if (this.machPreselVal !== -1 && this.speedPreselVal === -1) {
        this.textSub.set('MACH SEL|   ');
        this.text2Sub.set(`${this.machPreselVal.toFixed(2)}`);
        this.textXPosSub.set(33.834673);
      } else if (this.machPreselVal === -1 && this.speedPreselVal === -1) {
        this.textSub.set('');
        this.text2Sub.set('');
      }
    } else {
      this.textSub.set('');
      this.text2Sub.set('');
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('speedPreselVal')
      .whenChanged()
      .handle((m) => {
        this.speedPreselVal = m;
        this.getText();
      });

    sub
      .on('machPreselVal')
      .whenChanged()
      .handle((m) => {
        this.machPreselVal = m;
        this.getText();
      });

    sub
      .on('athrModeMessage')
      .whenChanged()
      .handle((m) => {
        this.athrModeMessage = m;
        this.getText();
      });

    sub
      .on('autoBrakeMode')
      .whenChanged()
      .handle((ab) => {
        this.autobrakeMode = ab;
        this.getText();
      });
  }

  render(): VNode {
    return (
      <g>
        <text class="FontMedium MiddleAlign Cyan" style="white-space: pre" x={this.textXPosSub} y="21.656223">
          {this.textSub}
        </text>
        <text class="FontMedium MiddleAlign Cyan" x="52.934673" y="21.656223">
          {this.text2Sub}
        </text>
      </g>
    );
  }
}

class B1Cell extends ShowForSecondsComponent<CellProps> {
  private boxClassSub = Subject.create('');

  private boxPathStringSub = Subject.create('');

  private activeVerticalModeSub = Subject.create(0);

  private activeVerticalModeClassSub = Subject.create('');

  private speedProtectionPathRef = FSComponent.createRef<SVGPathElement>();

  private inModeReversionPathRef = FSComponent.createRef<SVGPathElement>();

  private fmaTextRef = FSComponent.createRef<SVGTextElement>();

  private readonly verticalText = Subject.create('');

  private readonly additionalText = Subject.create('');

  private selectedVS = 0;

  private readonly apSpeedProtection = ConsumerSubject.create(null, false);

  private readonly inSpeedProtection = MappedSubject.create(
    ([apSpeedProtection, activeVerticalMode]) =>
      apSpeedProtection && (activeVerticalMode === 14 || activeVerticalMode === 15),
    this.apSpeedProtection,
    this.activeVerticalModeSub,
  );

  private fmaModeReversion = false;

  private expediteMode = false;

  private crzAltMode = false;

  private tcasModeDisarmed = false;

  private FPA = 0;

  constructor(props: CellProps) {
    super(props, 10);
  }

  private getText(): boolean {
    let text: string;
    let additionalText: string = '';

    this.isShown = true;
    switch (this.activeVerticalModeSub.get()) {
      case VerticalMode.GS_TRACK:
        text = 'G/S';
        break;
      /*  case 2:
            text = 'F-G/S';
            break; */
      case VerticalMode.GS_CPT:
        text = 'G/S*';
        break;
      /*  case 4:
            text = 'F-G/S*';
            break; */
      case VerticalMode.SRS:
      case VerticalMode.SRS_GA:
        text = 'SRS';
        break;
      case VerticalMode.TCAS:
        text = 'TCAS';
        break;
      /*  case 9:
            text = 'FINAL';
            break; */
      case VerticalMode.DES:
        text = 'DES';
        break;
      case VerticalMode.OP_DES:
        if (this.expediteMode) {
          text = 'EXP DES';
        } else {
          text = 'OP DES';
        }
        break;
      case VerticalMode.CLB:
        text = 'CLB';
        break;
      case VerticalMode.OP_CLB:
        if (this.expediteMode) {
          text = 'EXP CLB';
        } else {
          text = 'OP CLB';
        }
        break;
      case VerticalMode.ALT:
        if (this.crzAltMode) {
          text = 'ALT CRZ';
        } else {
          text = 'ALT';
        }
        break;
      case VerticalMode.ALT_CPT:
        text = 'ALT*';
        break;
      case VerticalMode.ALT_CST_CPT:
        text = 'ALT CST*';
        break;
      case VerticalMode.ALT_CST:
        text = 'ALT CST';
        break;
      /* case 18:
            text = 'ALT CRZ';
            break; */
      case VerticalMode.FPA: {
        const FPAText = `${this.FPA > 0 ? '+' : ''}${(Math.round(this.FPA * 10) / 10).toFixed(1)}°`;

        text = 'FPA';
        // if FPA is 0 give it an empty space for where the '+' and '-' will be.
        if (this.FPA === 0) {
          text += ' ';
        }
        additionalText = FPAText;
        break;
      }
      case VerticalMode.VS: {
        const VSText = `${this.selectedVS > 0 ? '+' : ''}${Math.round(this.selectedVS).toString()}`.padStart(5, '\xa0');

        text = 'V/S';

        additionalText = VSText;
        break;
      }
      default:
        text = '';
        this.isShown = false;
        this.displayModeChangedPath(true);
    }

    const inSpeedProtection = this.inSpeedProtection.get();

    if (inSpeedProtection || this.fmaModeReversion) {
      this.boxClassSub.set('NormalStroke None');
    } else {
      this.boxClassSub.set('NormalStroke White');
    }

    if (inSpeedProtection) {
      this.speedProtectionPathRef.instance.setAttribute('visibility', 'visible');
    } else {
      this.speedProtectionPathRef.instance.setAttribute('visibility', 'hidden');
    }

    const boxPathString =
      this.activeVerticalModeSub.get() === 50 && this.tcasModeDisarmed
        ? 'm35.756 1.8143h27.918v13.506h-27.918z'
        : 'm35.756 1.8143h27.918v6.0476h-27.918z';

    this.boxPathStringSub.set(boxPathString);

    // VS FPA & ALT CST* have a smaller font than the other active modes
    const smallFont =
      this.activeVerticalModeSub.get() === 14 ||
      this.activeVerticalModeSub.get() === 15 ||
      this.activeVerticalModeSub.get() === 21;

    this.activeVerticalModeClassSub.set(
      smallFont ? 'FontMediumSmaller MiddleAlign Green' : 'FontMedium MiddleAlign Green',
    );

    this.verticalText.set(text);
    this.additionalText.set(additionalText);

    return text.length > 0;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('activeVerticalMode')
      .whenChanged()
      .handle((activeVerticalMode) => {
        this.activeVerticalModeSub.set(activeVerticalMode);
        this.getText();
        this.displayModeChangedPath();
      });

    sub
      .on('selectedFpa')
      .whenChanged()
      .handle((fpa) => {
        this.FPA = fpa;
        this.getText();
      });

    sub
      .on('apVsSelected')
      .whenChanged()
      .handle((svs) => {
        this.selectedVS = svs;
        this.getText();
      });

    sub
      .on('fmaModeReversion')
      .whenChanged()
      .handle((reversion) => {
        this.fmaModeReversion = reversion;
        if (reversion) {
          this.inModeReversionPathRef.instance.setAttribute('visibility', 'visible');
        } else {
          this.inModeReversionPathRef.instance.setAttribute('visibility', 'hidden');
        }
        this.getText();
      });

    this.apSpeedProtection.setConsumer(sub.on('fmaSpeedProtection'));
    this.apSpeedProtection.sub(this.getText.bind(this));

    sub
      .on('expediteMode')
      .whenChanged()
      .handle((e) => {
        this.expediteMode = e;
        this.getText();
      });

    sub
      .on('crzAltMode')
      .whenChanged()
      .handle((c) => {
        this.crzAltMode = c;
        this.getText();
      });

    sub
      .on('tcasModeDisarmed')
      .whenChanged()
      .handle((t) => {
        this.tcasModeDisarmed = t;
        this.getText();
      });
  }

  render(): VNode {
    return (
      <g>
        <path ref={this.modeChangedPathRef} class={this.boxClassSub} visibility="hidden" d={this.boxPathStringSub} />

        <path
          ref={this.speedProtectionPathRef}
          class="NormalStroke Amber BlinkInfinite"
          d="m35.756 1.8143h27.918v6.0476h-27.918z"
        />
        <path
          ref={this.inModeReversionPathRef}
          class="NormalStroke White BlinkInfinite"
          d="m35.756 1.8143h27.918v6.0476h-27.918z"
        />

        <text
          ref={this.fmaTextRef}
          style="white-space: pre"
          class={this.activeVerticalModeClassSub}
          x="49.921795"
          y="7.1040988"
        >
          <tspan>{this.verticalText}</tspan>
          <tspan
            xml:space="preserve"
            class={{
              PulseCyanFill: this.inSpeedProtection,
              Cyan: this.inSpeedProtection.map(SubscribableMapFunctions.not()),
            }}
          >
            {this.additionalText}
          </tspan>
        </text>
      </g>
    );
  }
}

class B2Cell extends DisplayComponent<CellProps> {
  private text1Sub = Subject.create('');

  private text2Sub = Subject.create('');

  private classSub = Subject.create('');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('fmaVerticalArmed')
      .whenChanged()
      .handle((fmv) => {
        const altArmed = (fmv >> 0) & 1;
        const altCstArmed = (fmv >> 1) & 1;
        const clbArmed = (fmv >> 2) & 1;
        const desArmed = (fmv >> 3) & 1;
        const gsArmed = (fmv >> 4) & 1;
        const finalArmed = (fmv >> 5) & 1;

        let text1: string;
        let color1 = 'Cyan';
        if (clbArmed) {
          text1 = '      CLB'; // spaces added to center armed FMA as per newer DMC stnadards
        } else if (desArmed) {
          text1 = 'DES';
        } else if (altCstArmed) {
          text1 = 'ALT';
          color1 = 'Magenta';
        } else if (altArmed) {
          text1 = 'ALT';
        } else {
          text1 = '';
        }

        let text2;
        if (gsArmed) {
          text2 = 'G/S';
        } else if (finalArmed) {
          text2 = 'FINAL';
        } else {
          text2 = '';
        }

        this.text1Sub.set(text1);
        this.text2Sub.set(text2);
        this.classSub.set(`FontMediumSmaller MiddleAlign ${color1}`);
      });
  }

  render(): VNode {
    return (
      <g>
        <text class={this.classSub} style="white-space: pre" x="40.777474" y="13.629653">
          {this.text1Sub}
        </text>
        <text class="FontMediumSmaller MiddleAlign Cyan" x="56.19803" y="13.629653">
          {this.text2Sub}
        </text>
      </g>
    );
  }
}

class C1Cell extends ShowForSecondsComponent<CellProps> {
  private readonly sub = this.props.bus.getSubscriber<PFDSimvars>();

  private readonly activeLateralMode = ConsumerSubject.create(this.sub.on('activeLateralMode'), LateralMode.NONE);

  private readonly activeVerticalMode = ConsumerSubject.create(this.sub.on('activeVerticalMode'), VerticalMode.NONE);

  private readonly armedVerticalMode = ConsumerSubject.create(this.sub.on('fmaVerticalArmed'), VerticalMode.NONE);

  /**
   * Whether LOC backbeam mode mode is selected.
   * @todo Get this state from the FG.
   */
  private readonly backbeam = ConsumerSubject.create(this.sub.on('fm1Backbeam'), false);

  private readonly text = MappedSubject.create(
    this.mapText.bind(this),
    this.activeLateralMode,
    this.activeVerticalMode,
    this.armedVerticalMode,
    this.backbeam,
  );

  constructor(props: CellProps) {
    super(props, 10);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.text.sub((v) => {
      this.isShown = v.length > 0;
      this.displayModeChangedPath(!this.isShown);
    });
  }

  private mapText([activeLateralMode, activeVerticalMode, armedVerticalMode, backbeam]: [
    LateralMode,
    VerticalMode,
    VerticalMode,
    boolean,
  ]): string {
    const finalArmed = (armedVerticalMode >> 5) & 1;

    if (activeLateralMode === LateralMode.GA_TRACK) {
      return 'GA TRK';
    }
    if (activeLateralMode === LateralMode.LOC_CPT) {
      return backbeam ? 'LOC B/C*' : 'LOC *';
    }
    if (activeLateralMode === LateralMode.HDG) {
      return 'HDG';
    }
    if (activeLateralMode === LateralMode.RWY) {
      return 'RWY';
    }
    if (activeLateralMode === LateralMode.RWY_TRACK) {
      return 'RWY TRK';
    }
    if (activeLateralMode === LateralMode.TRACK) {
      return 'TRACK';
    }
    if (activeLateralMode === LateralMode.LOC_TRACK) {
      return backbeam ? 'LOC B/C' : 'LOC';
    }
    if (activeLateralMode === LateralMode.NAV && !finalArmed && activeVerticalMode !== VerticalMode.FINAL) {
      return 'NAV';
    }
    if (activeLateralMode === LateralMode.NAV && finalArmed && activeVerticalMode !== VerticalMode.FINAL) {
      return 'APP NAV';
    }

    return '';
  }

  render(): VNode {
    // case 2:
    //     text = 'LOC B/C*';
    //     id = 2;
    //     break;
    // case 4:
    //     text = 'F-LOC*';
    //     id = 4;
    //     break;
    // case 9:
    //     text = 'LOC B/C';
    //     id = 9;
    //     break;
    // case 11:
    //     text = 'F-LOC';
    //     id = 11;
    //     break;
    // case 12:
    //     text = 'APP NAV';
    //     id = 12;
    //     break;

    return (
      <g>
        <path
          ref={this.modeChangedPathRef}
          class="NormalStroke White"
          visibility="hidden"
          d="m99.87 1.8143v6.0476h-31.025l1e-6 -6.0476z"
        />
        <text class="FontMedium MiddleAlign Green" x="84.856567" y="6.9873109">
          {this.text}
        </text>
      </g>
    );
  }
}

class C2Cell extends DisplayComponent<CellProps> {
  private readonly sub = this.props.bus.getSubscriber<PFDSimvars>();

  private readonly fmaLateralArmed = ConsumerSubject.create(this.sub.on('fmaLateralArmed'), LateralMode.NONE);

  private readonly fmaVerticalArmed = ConsumerSubject.create(this.sub.on('fmaVerticalArmed'), LateralMode.NONE);

  private readonly activeVerticalMode = ConsumerSubject.create(this.sub.on('activeVerticalMode'), LateralMode.NONE);

  /**
   * Whether LOC backbeam mode mode is selected.
   * @todo Get this state from the FG.
   */
  private readonly backbeam = ConsumerSubject.create(this.sub.on('fm1Backbeam'), false);

  private text = MappedSubject.create(
    this.mapText.bind(this),
    this.fmaLateralArmed,
    this.fmaVerticalArmed,
    this.activeVerticalMode,
    this.backbeam,
  );

  private mapText([lateralArmed, verticalArmed, verticalActive, backbeam]: [
    LateralMode,
    VerticalMode,
    VerticalMode,
    boolean,
  ]): string {
    const navArmed = isArmed(lateralArmed, ArmedLateralMode.NAV);
    const locArmed = isArmed(lateralArmed, ArmedLateralMode.LOC);

    const finalArmed = isArmed(verticalArmed, ArmedVerticalMode.FINAL);

    if (locArmed) {
      return backbeam ? 'LOC B/C' : 'LOC';
      // case 3:
      //     text = 'F-LOC';
      //     break;
    } else if (navArmed && (finalArmed || verticalActive === VerticalMode.FINAL)) {
      return 'APP NAV';
    } else if (navArmed) {
      return 'NAV';
    }
    return '';
  }

  render(): VNode {
    return (
      <text class="FontMediumSmaller MiddleAlign Cyan" x="84.234184" y="13.629653">
        {this.text}
      </text>
    );
  }
}

class BC1Cell extends ShowForSecondsComponent<CellProps> {
  private lastLateralMode = 0;

  private lastVerticalMode = 0;

  private textSub = Subject.create('');

  constructor(props: CellProps) {
    super(props, 9);
  }

  private setText() {
    let text: string;
    this.isShown = true;
    if (this.lastVerticalMode === VerticalMode.ROLL_OUT) {
      text = 'ROLL OUT';
    } else if (this.lastVerticalMode === VerticalMode.FLARE) {
      text = 'FLARE';
    } else if (this.lastVerticalMode === VerticalMode.LAND) {
      text = 'LAND';
    } else if (this.lastVerticalMode === VerticalMode.FINAL && this.lastLateralMode === LateralMode.NAV) {
      text = 'FINAL APP';
    } else {
      text = '';
    }
    if (text !== '') {
      this.displayModeChangedPath();
    } else {
      this.isShown = false;
      this.displayModeChangedPath(true);
    }
    this.textSub.set(text);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('activeVerticalMode')
      .whenChanged()
      .handle((v) => {
        this.lastVerticalMode = v;
        this.setText();
      });

    sub
      .on('activeLateralMode')
      .whenChanged()
      .handle((l) => {
        this.lastLateralMode = l;
        this.setText();
      });
  }

  render(): VNode {
    return (
      <g>
        <path
          ref={this.modeChangedPathRef}
          class="NormalStroke White"
          visibility="hidden"
          d="m50.178 1.8143h35.174v6.0476h-35.174z"
        />
        <text class="FontMedium MiddleAlign Green" x="67.9795" y="6.8893085">
          {this.textSub}
        </text>
      </g>
    );
  }
}

const getBC3Message = (
  isAttExcessive: boolean,
  armedVerticalMode: number,
  setHoldSpeed: boolean,
  trkFpaDeselectedTCAS: boolean,
  tcasRaInhibited: boolean,
  fcdcWord1: Arinc429Word,
  fwcFlightPhase: number,
  tdReached: boolean,
  checkSpeedMode: boolean,
) => {
  const armedVerticalBitmask = armedVerticalMode;
  const TCASArmed = (armedVerticalBitmask >> 6) & 1;

  const flightPhaseForWarning =
    fwcFlightPhase >= 2 && fwcFlightPhase <= 9 && fwcFlightPhase !== 4 && fwcFlightPhase !== 5;

  let text: string;
  let className: string;
  // All currently unused message are set to false
  if (
    !fcdcWord1.bitValue(11) &&
    !fcdcWord1.bitValue(12) &&
    !fcdcWord1.bitValue(13) &&
    !fcdcWord1.bitValue(15) &&
    !fcdcWord1.isFailureWarning() &&
    flightPhaseForWarning
  ) {
    text = 'MAN PITCH TRIM ONLY';
    className = 'FontSmall Red Blink9Seconds';
  } else if (fcdcWord1.bitValue(15) && !fcdcWord1.isFailureWarning() && flightPhaseForWarning) {
    text = 'USE MAN PITCH TRIM';
    className = 'FontSmall PulseAmber9Seconds Amber';
  } else if (false) {
    text = 'FOR GA: SET TOGA';
    className = 'FontMedium PulseAmber9Seconds Amber';
  } else if (TCASArmed && !isAttExcessive) {
    text = 'TCAS           ';
    className = 'FontMediumSmaller Cyan';
  } else if (false) {
    text = 'DISCONNECT AP FOR LDG';
    className = 'FontMedium PulseAmber9Seconds Amber';
  } else if (tcasRaInhibited && !isAttExcessive) {
    text = 'TCAS RA INHIBITED';
    className = 'FontMedium White';
  } else if (trkFpaDeselectedTCAS && !isAttExcessive) {
    text = 'TRK FPA DESELECTED';
    className = 'FontMedium White';
  } else if (false) {
    text = 'SET GREEN DOT SPEED';
    className = 'FontMedium White';
  } else if (tdReached) {
    text = 'T/D REACHED';
    className = 'FontMedium White';
  } else if (false) {
    text = 'MORE DRAG';
    className = 'FontMedium White';
  } else if (checkSpeedMode && !isAttExcessive) {
    text = 'CHECK SPEED MODE';
    className = 'FontMedium White';
  } else if (false) {
    text = 'CHECK APPR SELECTION';
    className = 'FontMedium White';
  } else if (false) {
    text = 'TURN AREA EXCEEDANCE';
    className = 'FontMedium White';
  } else if (setHoldSpeed) {
    text = 'SET HOLD SPEED';
    className = 'FontMedium White';
  } else if (false) {
    text = 'VERT DISCONT AHEAD';
    className = 'FontMedium Amber';
  } else if (false) {
    text = 'FINAL APP SELECTED';
    className = 'FontSmall White';
  } else {
    return [null, null];
  }

  return [text, className];
};

class BC3Cell extends DisplayComponent<{ isAttExcessive: Subscribable<boolean>; bus: ArincEventBus }> {
  private bc3Cell = FSComponent.createRef<SVGTextElement>();

  private classNameSub = Subject.create('');

  private isAttExcessive = false;

  private armedVerticalMode = 0;

  private setHoldSpeed = false;

  private tcasRaInhibited = false;

  private trkFpaDeselected = false;

  private fcdcDiscreteWord1 = new Arinc429Word(0);

  private fwcFlightPhase = 0;

  private tdReached = false;

  private checkSpeedMode = false;

  private fillBC3Cell() {
    const [text, className] = getBC3Message(
      this.isAttExcessive,
      this.armedVerticalMode,
      this.setHoldSpeed,
      this.trkFpaDeselected,
      this.tcasRaInhibited,
      this.fcdcDiscreteWord1,
      this.fwcFlightPhase,
      this.tdReached,
      this.checkSpeedMode,
    );
    this.classNameSub.set(`MiddleAlign ${className}`);
    if (text !== null) {
      this.bc3Cell.instance.innerHTML = text;
    } else {
      this.bc3Cell.instance.innerHTML = '';
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values>();

    this.props.isAttExcessive.sub((e) => {
      this.isAttExcessive = e;
      this.fillBC3Cell();
    });

    sub
      .on('fmaVerticalArmed')
      .whenChanged()
      .handle((v) => {
        this.armedVerticalMode = v;
        this.fillBC3Cell();
      });

    sub
      .on('setHoldSpeed')
      .whenChanged()
      .handle((shs) => {
        this.setHoldSpeed = shs;
        this.fillBC3Cell();
      });

    sub
      .on('tcasRaInhibited')
      .whenChanged()
      .handle((tra) => {
        this.tcasRaInhibited = tra;
        this.fillBC3Cell();
      });

    sub
      .on('trkFpaDeselectedTCAS')
      .whenChanged()
      .handle((trk) => {
        this.trkFpaDeselected = trk;
        this.fillBC3Cell();
      });

    sub
      .on('fcdcDiscreteWord1')
      .atFrequency(1)
      .handle((fcdcDiscreteWord1) => {
        this.fcdcDiscreteWord1 = fcdcDiscreteWord1;
        this.fillBC3Cell();
      });

    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((fwcFlightPhase) => {
        this.fwcFlightPhase = fwcFlightPhase;
      });

    sub
      .on('tdReached')
      .whenChanged()
      .handle((tdr) => {
        this.tdReached = tdr;
        this.fillBC3Cell();
      });

    sub
      .on('checkSpeedMode')
      .whenChanged()
      .handle((csm) => {
        this.checkSpeedMode = csm;
        this.fillBC3Cell();
      });
  }

  render(): VNode {
    return <text ref={this.bc3Cell} class={this.classNameSub} x="68.087875" y="21.627102" style="white-space: pre" />;
  }
}

class D1D2Cell extends ShowForSecondsComponent<CellProps> {
  private text1Sub = Subject.create('');

  private text2Sub = Subject.create('');

  constructor(props: CellProps) {
    super(props, 9);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('approachCapability')
      .whenChanged()
      .handle((c) => {
        let text1: string;
        let text2: string | undefined;

        this.isShown = true;
        switch (c) {
          case 1:
            text1 = 'CAT1';
            break;
          case 2:
            text1 = 'CAT2';
            break;
          case 3:
            text1 = 'CAT3';
            text2 = 'SINGLE';
            break;
          case 4:
            text1 = 'CAT3';
            text2 = 'DUAL';
            break;
          case 5:
            text1 = 'AUTO';
            text2 = 'LAND';
            break;
          case 6:
            text1 = 'F-APP';
            break;
          case 7:
            text1 = 'F-APP';
            text2 = '+ RAW';
            break;
          case 8:
            text1 = 'RAW';
            text2 = 'ONLY';
            break;
          default:
            text1 = '';
        }

        this.text1Sub.set(text1);

        if (text2) {
          this.text2Sub.set(text2);
          this.modeChangedPathRef.instance.setAttribute('d', 'm104.1 1.8143h27.994v13.506h-27.994z');
        } else {
          this.text2Sub.set('');
          this.modeChangedPathRef.instance.setAttribute('d', 'm104.1 1.8143h27.994v6.0476h-27.994z');
        }
        if (text1.length === 0 && !text2) {
          this.isShown = false;
        }
        this.displayModeChangedPath();
      });
  }

  render(): VNode {
    return (
      <g>
        <text class="FontMedium MiddleAlign White" x="118.45866" y="7.125926">
          {this.text1Sub}
        </text>
        <text class="FontMedium MiddleAlign White" x="118.39752" y="14.289783">
          {this.text2Sub}
        </text>
        <path ref={this.modeChangedPathRef} class="NormalStroke White" visibility="hidden" />
      </g>
    );
  }
}

enum MdaMode {
  None = '',
  NoDh = 'NO DH',
  Radio = 'RADIO',
  Baro = 'BARO',
}

class D3Cell extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly textRef = FSComponent.createRef<SVGTextElement>();

  /** bit 29 is NO DH selection */
  private readonly fmEisDiscrete2 = Arinc429RegisterSubject.createEmpty();

  private readonly mda = Arinc429RegisterSubject.createEmpty();

  private readonly dh = Arinc429RegisterSubject.createEmpty();

  private readonly noDhSelected = this.fmEisDiscrete2.map((r) => r.bitValueOr(29, false));

  private readonly mdaDhMode = MappedSubject.create(
    ([noDh, dh, mda]) => {
      if (noDh) {
        return MdaMode.NoDh;
      }

      if (!dh.isNoComputedData() && !dh.isFailureWarning()) {
        return MdaMode.Radio;
      }

      if (!mda.isNoComputedData() && !mda.isFailureWarning()) {
        return MdaMode.Baro;
      }

      return MdaMode.None;
    },
    this.noDhSelected,
    this.dh,
    this.mda,
  );

  private readonly mdaDhValueText = MappedSubject.create(
    ([mdaMode, dh, mda]) => {
      switch (mdaMode) {
        case MdaMode.Baro:
          return Math.round(mda.value).toString().padStart(6, '\xa0');
        case MdaMode.Radio:
          return Math.round(dh.value).toString().padStart(4, '\xa0');
        default:
          return '';
      }
    },
    this.mdaDhMode,
    this.dh,
    this.mda,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values>();

    sub.on('fmEisDiscreteWord2Raw').handle(this.fmEisDiscrete2.setWord.bind(this.fmEisDiscrete2));
    sub.on('fmMdaRaw').handle(this.mda.setWord.bind(this.mda));
    sub.on('fmDhRaw').handle(this.dh.setWord.bind(this.dh));
  }

  render(): VNode {
    return (
      <text
        ref={this.textRef}
        class={{
          FontSmallest: this.noDhSelected.map(SubscribableMapFunctions.not()),
          FontMedium: this.noDhSelected,
          MiddleAlign: true,
          White: true,
        }}
        x="118.38384"
        y="21.104172"
      >
        <tspan>{this.mdaDhMode}</tspan>
        <tspan
          class={{ Cyan: true, HiddenElement: this.mdaDhValueText.map((v) => v.length <= 0) }}
          style="white-space: pre"
        >
          {this.mdaDhValueText}
        </tspan>
      </text>
    );
  }
}

class E1Cell extends ShowForSecondsComponent<CellProps> {
  private ap1Active = false;

  private ap2Active = false;

  private textSub = Subject.create('');

  constructor(props: CellProps) {
    super(props, 9);
  }

  private setText() {
    let text: string;
    this.isShown = true;
    if (this.ap1Active && !this.ap2Active) {
      text = 'AP1';
    } else if (this.ap2Active && !this.ap1Active) {
      text = 'AP2';
    } else if (!this.ap2Active && !this.ap1Active) {
      text = '';
      this.isShown = false;
    } else {
      text = 'AP1+2';
    }
    this.displayModeChangedPath();
    this.textSub.set(text);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('ap1Active')
      .whenChanged()
      .handle((ap) => {
        this.ap1Active = ap;
        this.displayModeChangedPath();
        this.setText();
      });

    sub
      .on('ap2Active')
      .whenChanged()
      .handle((ap) => {
        this.ap2Active = ap;
        this.displayModeChangedPath();
        this.setText();
      });
  }

  render(): VNode {
    return (
      <g>
        <path
          ref={this.modeChangedPathRef}
          visibility="hidden"
          class="NormalStroke White"
          d="m156.13 1.8143v6.0476h-20.81v-6.0476z"
        />
        <text class="FontMedium MiddleAlign White" x="145.61546" y="6.9559975">
          {this.textSub}
        </text>
      </g>
    );
  }
}

class E2Cell extends ShowForSecondsComponent<CellProps> {
  private fd1Active = false;

  private fd2Active = false;

  private ap1Active = false;

  private ap2Active = false;

  private textSub = Subject.create('');

  constructor(props: CellProps) {
    super(props, 9);
  }

  private getText() {
    this.isShown = true;
    if (!this.ap1Active && !this.ap2Active && !this.fd1Active && !this.fd2Active) {
      this.isShown = false;
      this.textSub.set('');
    } else {
      const text = `${this.fd1Active ? '1' : '-'} FD ${this.fd2Active ? '2' : '-'}`;
      this.textSub.set(text);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('fd1Active')
      .whenChanged()
      .handle((fd) => {
        this.fd1Active = fd;
        if (fd || this.fd2Active) {
          this.displayModeChangedPath();
        } else {
          this.displayModeChangedPath(true);
        }
        this.getText();
      });

    sub
      .on('ap1Active')
      .whenChanged()
      .handle((fd) => {
        this.ap1Active = fd;
        this.getText();
      });

    sub
      .on('ap2Active')
      .whenChanged()
      .handle((fd) => {
        this.ap2Active = fd;
        this.getText();
      });

    sub
      .on('fd2Active')
      .whenChanged()
      .handle((fd) => {
        this.fd2Active = fd;
        if (fd || this.fd1Active) {
          this.displayModeChangedPath();
        } else {
          this.displayModeChangedPath(true);
        }
        this.getText();
      });
  }

  render(): VNode {
    return (
      <g>
        <path
          ref={this.modeChangedPathRef}
          d="m156.13 9.0715v6.0476h-20.81v-6.0476z"
          visibility="hidden"
          class="NormalStroke White"
        />
        <text class="FontMedium MiddleAlign White" x="145.95045" style="word-spacing: -1.9844px" y="14.417698">
          {this.textSub}
        </text>
      </g>
    );
  }
}

class E3Cell extends ShowForSecondsComponent<CellProps> {
  private classSub = Subject.create('');

  private posSub = Subject.create(0);

  constructor(props: CellProps) {
    super(props, 9);
  }

  private getClass(athrStatus: number): string {
    let className: string = '';
    this.isShown = true;
    switch (athrStatus) {
      case 1:
        className = 'Cyan FontSmall';
        break;
      case 2:
        className = 'White FontMedium';
        break;
      default:
        this.isShown = false;
        className = 'HiddenElement';
    }
    return className;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('athrStatus')
      .whenChanged()
      .handle((a) => {
        const className = this.getClass(a);
        this.posSub.set(a === 1 ? 21.253048 : 21.753487);
        this.classSub.set(`MiddleAlign ${className}`);
        if (className !== 'HiddenElement') {
          this.displayModeChangedPath();
        } else {
          this.displayModeChangedPath(true);
        }
      });
  }

  render(): VNode {
    return (
      <g>
        <path
          ref={this.modeChangedPathRef}
          class="NormalStroke White"
          visibility="hidden"
          d="m135.32 16.329h20.81v6.0476h-20.81z"
        />
        <text class={this.classSub} x="145.75578" y={this.posSub}>
          A/THR
        </text>
      </g>
    );
  }
}
