/* eslint-disable no-dupe-else-if */
/* eslint-disable no-constant-condition */
import {
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { ArmedLateralMode, isArmed, LateralMode, VerticalMode } from '@shared/autopilot';
import { Arinc429Values } from './shared/ArincValueProvider';
import { PFDSimvars } from './shared/PFDSimvarPublisher';
import { SimplaneValues } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';
import { Arinc429Word } from '@flybywiresim/fbw-sdk';

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

export class FMA extends DisplayComponent<{ bus: EventBus; isAttExcessive: Subscribable<boolean> }> {
  private sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & SimplaneValues>();

  private activeLateralMode: number = 0;

  private armedVerticalModeSub = Subject.create(0);

  private athrModeMessage = 0;

  private machPresel = Arinc429Word.empty();

  private speedPresel = Arinc429Word.empty();

  private setHoldSpeed = false;

  private tdReached = false;

  private tcasRaInhibited = Subject.create(false);

  private trkFpaDeselected = Subject.create(false);

  private firstBorderRef = FSComponent.createRef<SVGPathElement>();

  private secondBorderRef = FSComponent.createRef<SVGPathElement>();

  private AB3Message = Subject.create(false);

  private readonly radioHeight = ConsumerSubject.create(this.sub.on('chosenRa'), Arinc429Word.empty());

  private readonly altitude = ConsumerSubject.create(this.sub.on('altitudeAr'), Arinc429Word.empty());

  private readonly landingElevation = ConsumerSubject.create(this.sub.on('landingElevation'), Arinc429Word.empty());

  private readonly ap1Active = ConsumerSubject.create(this.sub.on('ap1Active'), false);

  private readonly ap2Active = ConsumerSubject.create(this.sub.on('ap2Active'), false);

  private readonly selectedAltitude = ConsumerSubject.create(this.sub.on('selectedAltitude'), null);

  private readonly selectedFpa = ConsumerSubject.create(this.sub.on('selectedFpa'), null);

  private readonly selectedVs = ConsumerSubject.create(this.sub.on('selectedVs'), null);

  private readonly approachCapability = ConsumerSubject.create(this.sub.on('approachCapability'), 0);

  private readonly activeVerticalMode = ConsumerSubject.create(this.sub.on('activeVerticalMode'), 0);

  private readonly btvExitMissed = ConsumerSubject.create(this.sub.on('btvExitMissed'), false);

  private readonly disconnectApForLdg = MappedSubject.create(
    ([ap1, ap2, ra, altitude, landingElevation, verticalMode, selectedFpa, selectedVs, approachCapability]) => {
      return (
        (ap1 || ap2) &&
        (ra.isNormalOperation() ? ra.value <= 150 : altitude.valueOr(Infinity) - landingElevation.valueOr(0) <= 150) &&
        (approachCapability === 1 || // CAT 1 or FLS
          approachCapability === 6 ||
          approachCapability === 7 ||
          approachCapability === 8 ||
          verticalMode === VerticalMode.DES ||
          verticalMode === VerticalMode.OP_DES ||
          (verticalMode === VerticalMode.FPA && selectedFpa <= 0) ||
          (verticalMode === VerticalMode.VS && selectedVs <= 0))
      );
    },
    this.ap1Active,
    this.ap2Active,
    this.radioHeight,
    this.altitude,
    this.landingElevation,
    this.activeVerticalMode,
    this.selectedFpa,
    this.selectedVs,
    this.approachCapability,
  );

  private readonly unrestrictedClimbDescent = MappedSubject.create(
    ([activeVerticalMode, selectedFpa, selectedVs, selectedAltitude, altitude]) => {
      if (activeVerticalMode === VerticalMode.FPA || activeVerticalMode === VerticalMode.VS) {
        if ((selectedFpa > 0 || selectedVs > 0) && selectedAltitude < altitude.value) {
          return 1;
        } else if ((selectedFpa < 0 || selectedVs < 0) && selectedAltitude > altitude.value) {
          return 2;
        }
      }
      return 0;
    },
    this.activeVerticalMode,
    this.selectedFpa,
    this.selectedVs,
    this.selectedAltitude,
    this.altitude,
  );

  private handleFMABorders() {
    const sharedModeActive =
      this.activeLateralMode === 32 ||
      this.activeLateralMode === 33 ||
      this.activeLateralMode === 34 ||
      (this.activeLateralMode === 20 && this.activeVerticalMode.get() === 24);
    const BC3Message =
      getBC3Message(
        this.props.isAttExcessive.get(),
        this.armedVerticalModeSub.get(),
        this.setHoldSpeed,
        this.trkFpaDeselected.get(),
        this.tcasRaInhibited.get(),
        this.tdReached,
        this.disconnectApForLdg.get(),
        this.unrestrictedClimbDescent.get(),
        this.btvExitMissed.get(),
      )[0] !== null;

    const engineMessage = this.athrModeMessage;
    const AB3Message =
      (this.machPresel.isNormalOperation() || this.speedPresel.isNormalOperation()) &&
      !BC3Message &&
      engineMessage === 0;

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

    this.AB3Message.set(AB3Message);
    this.firstBorderRef.instance.setAttribute('d', firstBorder);
    this.secondBorderRef.instance.setAttribute('d', secondBorder);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.isAttExcessive.sub(() => {
      this.handleFMABorders();
    });

    this.disconnectApForLdg.sub(() => this.handleFMABorders());

    this.btvExitMissed.sub(() => this.handleFMABorders());

    this.unrestrictedClimbDescent.sub(() => {
      this.handleFMABorders();
    });

    this.sub
      .on('fmaVerticalArmed')
      .whenChanged()
      .handle((a) => {
        this.armedVerticalModeSub.set(a);
        this.handleFMABorders();
      });

    this.sub
      .on('activeLateralMode')
      .whenChanged()
      .handle((activeLateralMode) => {
        this.activeLateralMode = activeLateralMode;
        this.handleFMABorders();
      });

    this.activeVerticalMode.sub(() => this.handleFMABorders());

    this.sub
      .on('setHoldSpeed')
      .whenChanged()
      .handle((shs) => {
        this.setHoldSpeed = shs;
        this.handleFMABorders();
      });

    this.sub
      .on('tcasRaInhibited')
      .whenChanged()
      .handle((tra) => {
        this.tcasRaInhibited.set(tra);
        this.handleFMABorders();
      });

    this.sub
      .on('trkFpaDeselectedTCAS')
      .whenChanged()
      .handle((trk) => {
        this.trkFpaDeselected.set(trk);
        this.handleFMABorders();
      });

    this.sub
      .on('tdReached')
      .whenChanged()
      .handle((tdr) => {
        this.tdReached = tdr;
        this.handleFMABorders();
      });
  }

  render(): VNode {
    return (
      <g id="FMA">
        <g class="NormalStroke Grey">
          <path ref={this.firstBorderRef} />
          <path ref={this.secondBorderRef} />
          <path d="m102.52 0.33732v20.864" />
          <path d="m133.72 0.33732v20.864" />
        </g>

        <Row1 bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />
        <Row2 bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />
        <Row3
          bus={this.props.bus}
          isAttExcessive={this.props.isAttExcessive}
          disconnectApForLdg={this.disconnectApForLdg}
          unrestrictedClimbDescent={this.unrestrictedClimbDescent}
          btvExitMissed={this.btvExitMissed}
          AB3Message={this.AB3Message}
        />
      </g>
    );
  }
}

class Row1 extends DisplayComponent<{ bus: EventBus; isAttExcessive: Subscribable<boolean> }> {
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

class Row2 extends DisplayComponent<{ bus: EventBus; isAttExcessive: Subscribable<boolean> }> {
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

class A2Cell extends DisplayComponent<{ bus: EventBus }> {
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
            this.text.set('BTV ');
            break;
          case 2:
            this.text.set('BRK LO ');
            break;
          case 3:
            this.text.set('BRK 2 ');
            break;
          case 4:
            this.text.set('BRK 3 ');
            break;
          case 5:
            this.text.set('BRK HI ');
            break;
          default:
            this.text.set('');
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
  bus: EventBus;
  isAttExcessive: Subscribable<boolean>;
  disconnectApForLdg: Subscribable<boolean>;
  unrestrictedClimbDescent: Subscribable<number>;
  btvExitMissed: Subscribable<boolean>;
  AB3Message: Subscribable<boolean>;
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
        <A3Cell bus={this.props.bus} AB3Message={this.props.AB3Message} />
        <g ref={this.cellsToHide}>
          <AB3Cell bus={this.props.bus} />
          <D3Cell bus={this.props.bus} />
        </g>
        <BC3Cell
          isAttExcessive={this.props.isAttExcessive}
          disconnectApForLdg={this.props.disconnectApForLdg}
          unrestrictedClimbDescent={this.props.unrestrictedClimbDescent}
          btvExitMissed={this.props.btvExitMissed}
          bus={this.props.bus}
        />
        <E3Cell bus={this.props.bus} />
      </g>
    );
  }
}

interface CellProps extends ComponentProps {
  bus: EventBus;
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
        const FlexText = FlexTemp.toString();
        text = `<g>
                                <path class="NormalStroke White" d="m29.821 1.8143v13.506h-24.517v-13.506z" />
                                <text class="FontMedium MiddleAlign White" x="17.052249" y="7.1280665">MAN</text>
                                <text class="FontMedium MiddleAlign White" x="11.669141" y="14.351689">FLX</text>
                                <text class="FontMedium MiddleAlign Cyan" x="20.599141" y="14.851689">+</text>
                                <text class="FontMedium MiddleAlign Cyan" x="26.099141" y="14.351689">
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
              text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">BTV</text>';
              this.displayModeChangedPath();
              break;
            case 2:
              text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">BRK LO</text>';
              this.displayModeChangedPath();
              break;
            case 3:
              text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">BRK 2 </text>';
              this.displayModeChangedPath();
              break;
            case 4:
              text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">BRK 3 </text>';
              this.displayModeChangedPath();
              break;
            case 5:
              text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">BRK HI </text>';
              this.displayModeChangedPath();
              break;
            case 6:
              text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">BRK RTO</text>';
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

interface A3CellProps extends CellProps {
  AB3Message: Subscribable<boolean>;
}

class A3Cell extends DisplayComponent<A3CellProps> {
  private classSub = Subject.create('');

  private textSub = Subject.create('');

  private autobrakeMode = 0;

  private AB3Message = false;

  private onUpdateAthrModeMessage(message: number) {
    let text: string = '';
    let className: string = '';
    switch (message) {
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
        text = '';
    }

    this.textSub.set(text);
    this.classSub.set(`FontMedium MiddleAlign ${className}`);
  }

  private handleAutobrakeMode() {
    if (this.autobrakeMode === 6 && !this.AB3Message) {
      this.textSub.set('BRK RTO');
      this.classSub.set('FontMediumSmaller MiddleAlign Cyan');
    } else {
      this.textSub.set('');
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('athrModeMessage')
      .whenChanged()
      .handle((m) => {
        this.onUpdateAthrModeMessage(m);
      });

    sub
      .on('autoBrakeMode')
      .whenChanged()
      .handle((am) => {
        this.autobrakeMode = am;
        this.handleAutobrakeMode();
      });

    this.props.AB3Message.sub((ab3) => {
      this.AB3Message = ab3;
      this.handleAutobrakeMode();
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
  // TODO: Connect this to the correct FMGC bus
  private speedPresel = Arinc429Word.empty();

  // TODO: Connect these to the correct FMGC bus
  private machPresel = Arinc429Word.empty();

  private athrModeMessage = 0;

  private textSub = Subject.create('');

  private getText() {
    if (this.athrModeMessage === 0) {
      if (this.speedPresel.isNormalOperation() && !this.machPresel.isNormalOperation()) {
        const text = Math.round(this.speedPresel.value);
        this.textSub.set(`SPEED SEL ${text}`);
      } else if (this.machPresel.isNormalOperation() && !this.speedPresel.isNormalOperation()) {
        this.textSub.set(`MACH SEL ${this.machPresel.value.toFixed(2)}`);
      } else if (!this.machPresel.isNormalOperation() && !this.speedPresel.isNormalOperation()) {
        this.textSub.set('');
      }
    } else {
      this.textSub.set('');
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('athrModeMessage')
      .whenChanged()
      .handle((m) => {
        this.athrModeMessage = m;
        this.getText();
      });
  }

  render(): VNode {
    return (
      <text class="FontMedium MiddleAlign Cyan" x="35.434673" y="21.656223">
        {this.textSub}
      </text>
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

  private selectedVS = 0;

  private inSpeedProtection = false;

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
        if (this.crzAltMode) {
          // TODO hook to new FG var if necessary
          text = 'ALT CRZ *';
        } else {
          text = 'ALT*';
        }
        break;
      case VerticalMode.ALT_CST_CPT:
        text = 'ALT CST*';
        break;
      case VerticalMode.ALT_CST:
        text = 'ALT CST';
        break;
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
        const VSText = `${this.selectedVS > 0 ? '+' : ''}${Math.round(this.selectedVS).toString()}`.padStart(6, ' ');

        text = 'V/S';

        additionalText = VSText;
        break;
      }
      default:
        text = '';
        this.isShown = false;
        this.displayModeChangedPath(true);
    }

    const inSpeedProtection =
      this.inSpeedProtection && (this.activeVerticalModeSub.get() === 14 || this.activeVerticalModeSub.get() === 15);

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
        ? 'm34.656 1.8143h29.918v13.506h-29.918z'
        : 'm34.656 1.8143h29.918v6.0476h-29.918z';

    this.boxPathStringSub.set(boxPathString);

    // VS FPA has a smaller font than the other active modes
    const VsFPA = this.activeVerticalModeSub.get() === 14 || this.activeVerticalModeSub.get() === 15;

    this.activeVerticalModeClassSub.set(VsFPA ? 'FontMediumSmaller MiddleAlign Green' : 'FontMedium MiddleAlign Green');

    this.fmaTextRef.instance.innerHTML = `<tspan>${text}</tspan><tspan xml:space="preserve" class=${inSpeedProtection ? 'PulseCyanFill' : 'Cyan'}>${additionalText}</tspan>`;

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
      .on('selectedVs')
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

    sub
      .on('fmaSpeedProtection')
      .whenChanged()
      .handle((protection) => {
        this.inSpeedProtection = protection;
        this.getText();
      });

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
          d="m34.656 1.8143h29.918v6.0476h-29.918z"
        />
        <path
          ref={this.inModeReversionPathRef}
          class="NormalStroke White BlinkInfinite"
          d="m34.656 1.8143h29.918v6.0476h-29.918z"
        />

        <text
          ref={this.fmaTextRef}
          style="white-space: pre"
          class={this.activeVerticalModeClassSub}
          x="49.921795"
          y="7.1040988"
        >
          {/* set directly via innerhtml as tspan was invisble for some reason when set here */}
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

        // TODO hook to FG once implemented
        const openClimbArmed = false;
        const altCruiseArmed = false;

        let text1: string;
        let color1 = 'Cyan';
        let vertModeActive = true;
        if (openClimbArmed) {
          text1 = '      OP CLB';
        } else if (clbArmed) {
          text1 = '      CLB';
        } else if (desArmed) {
          text1 = gsArmed ? 'DES ' : '      DES';
        } else if (altCstArmed) {
          text1 = gsArmed ? 'ALT ' : '      ALT';
          color1 = 'Magenta';
        } else if (altArmed) {
          text1 = gsArmed ? 'ALT ' : '      ALT';
        } else if (altCruiseArmed) {
          text1 = '      ALT CRZ';
        } else {
          text1 = '';
          vertModeActive = false;
        }

        let text2;
        if (gsArmed) {
          if (vertModeActive) {
            text2 = '  G/S';
          } else {
            text1 = '      G/S';
          }
        } else {
          if (!vertModeActive) {
            text1 = '';
          }
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
        <text style="white-space: pre" class="FontMediumSmaller MiddleAlign Cyan" x="56.19803" y="13.629653">
          {this.text2Sub}
        </text>
      </g>
    );
  }
}

class C1Cell extends ShowForSecondsComponent<CellProps> {
  private textSub = Subject.create('');

  private activeLateralMode = 0;

  constructor(props: CellProps) {
    super(props, 10);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('activeLateralMode')
      .whenChanged()
      .handle((lm) => {
        this.activeLateralMode = lm;

        const isShown = this.updateText();

        if (isShown) {
          this.displayModeChangedPath();
        } else {
          this.displayModeChangedPath(true);
        }
      });
  }

  private updateText(): boolean {
    let text: string;
    this.isShown = true;
    if (this.activeLateralMode === LateralMode.GA_TRACK) {
      text = 'GA TRK';
    } else if (this.activeLateralMode === LateralMode.LOC_CPT) {
      text = 'LOC *';
    } else if (this.activeLateralMode === LateralMode.HDG) {
      text = 'HDG';
    } else if (this.activeLateralMode === LateralMode.RWY) {
      text = 'RWY';
    } else if (this.activeLateralMode === LateralMode.RWY_TRACK) {
      text = 'RWY TRK';
    } else if (this.activeLateralMode === LateralMode.TRACK) {
      text = 'TRACK';
    } else if (this.activeLateralMode === LateralMode.LOC_TRACK) {
      text = 'LOC';
    } else if (this.activeLateralMode === LateralMode.NAV) {
      text = 'NAV';
    } else {
      text = '';
      this.isShown = false;
    }

    const hasChanged = text.length > 0 && text !== this.textSub.get();

    if (hasChanged || text.length === 0) {
      this.textSub.set(text);
    }
    return hasChanged;
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
          d="m99.87 1.8143v6.0476h-31.075l1e-6 -6.0476z"
        />
        <text class="FontMedium MiddleAlign Green" x="84.856567" y="6.9873109">
          {this.textSub}
        </text>
      </g>
    );
  }
}

class C2Cell extends DisplayComponent<CellProps> {
  private fmaLateralArmed: number = 0;

  private textSub = Subject.create('');

  private getText() {
    const navArmed = isArmed(this.fmaLateralArmed, ArmedLateralMode.NAV);
    const locArmed = isArmed(this.fmaLateralArmed, ArmedLateralMode.LOC);
    const runwayArmed = false;

    let text: string = '';
    if (locArmed) {
      // case 1:
      //     text = 'LOC B/C';
      //     break;
      text = 'LOC';
      // case 3:
      //     text = 'F-LOC';
      //     break;
    } else if (runwayArmed) {
      text = 'RWY' + (navArmed ? '  NAV' : '');
    } else if (navArmed) {
      text = 'NAV';
    }
    this.textSub.set(text);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('fmaLateralArmed')
      .whenChanged()
      .handle((fla) => {
        this.fmaLateralArmed = fla;
        this.getText();
      });
  }

  render(): VNode {
    return (
      <text style="white-space: pre" class="FontMediumSmaller MiddleAlign Cyan" x="84.234184" y="13.629653">
        {this.textSub}
      </text>
    );
  }
}

class BC1Cell extends ShowForSecondsComponent<CellProps> {
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
  tdReached: boolean,
  disconnectApForLdg: boolean,
  unrestrictedClimbDescent: number,
  exitMissed: boolean,
) => {
  const armedVerticalBitmask = armedVerticalMode;
  const TCASArmed = (armedVerticalBitmask >> 6) & 1;

  let text: string;
  let className: string;

  // All currently unused message are set to false
  if (false) {
    text = 'USE MAN PITCH TRIM';
    className = 'PulseAmber9Seconds Amber';
  } else if (false) {
    text = 'FOR GA: SET TOGA';
    className = 'PulseAmber9Seconds Amber';
  } else if (disconnectApForLdg) {
    text = 'DISCONNECT AP FOR LDG';
    className = 'FontSmall PulseAmber9Seconds Amber';
  } else if (TCASArmed && !isAttExcessive) {
    text = 'TCAS           ';
    className = 'FontMediumSmaller Cyan';
  } else if (tcasRaInhibited && !isAttExcessive) {
    text = 'TCAS RA INHIBITED';
    className = 'FontMedium White';
  } else if (trkFpaDeselectedTCAS && !isAttExcessive) {
    text = 'TRK FPA DESELECTED';
    className = 'FontMedium White';
  } else if (tdReached) {
    text = 'T/D REACHED';
    className = 'FontMedium White';
  } else if (false) {
    text = 'EXTEND SPD BRK';
    className = 'White';
  } else if (false) {
    text = 'RETRACT SPD BRK';
    className = 'White';
  } else if (false) {
    text = 'CHECK APPR SEL';
    className = 'White';
  } else if (setHoldSpeed) {
    text = 'SET HOLD SPD';
    className = 'FontMedium White';
  } else if (exitMissed) {
    text = 'EXIT MISSED';
    className = 'White';
  } else if (unrestrictedClimbDescent === 1) {
    text = 'FCU ALT BELOW A/C';
    className = 'FontMediumSmaller  White';
  } else if (unrestrictedClimbDescent === 2) {
    text = 'FCU ALT ABOVE A/C';
    className = 'DisappearAfter10Seconds FontMediumSmaller White';
  } else {
    return [null, null];
  }

  return [text, className];
};

class BC3Cell extends DisplayComponent<{
  isAttExcessive: Subscribable<boolean>;
  disconnectApForLdg: Subscribable<boolean>;
  unrestrictedClimbDescent: Subscribable<number>;
  btvExitMissed: Subscribable<boolean>;
  bus: EventBus;
}> {
  private sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values>();

  private bc3Cell = FSComponent.createRef<SVGTextElement>();

  private classNameSub = Subject.create('');

  private armedVerticalMode = 0;

  private setHoldSpeed = false;

  private tcasRaInhibited = false;

  private trkFpaDeselected = false;

  private tdReached = false;

  private fillBC3Cell() {
    const [text, className] = getBC3Message(
      this.props.isAttExcessive.get(),
      this.armedVerticalMode,
      this.setHoldSpeed,
      this.trkFpaDeselected,
      this.tcasRaInhibited,
      this.tdReached,
      this.props.disconnectApForLdg.get(),
      this.props.unrestrictedClimbDescent.get(),
      this.props.btvExitMissed.get(),
    );
    this.classNameSub.set(`FontMedium MiddleAlign ${className}`);
    if (text !== null) {
      this.bc3Cell.instance.innerHTML = text;
    } else {
      this.bc3Cell.instance.innerHTML = '';
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.isAttExcessive.sub(() => {
      this.fillBC3Cell();
    });

    this.props.disconnectApForLdg.sub(() => {
      this.fillBC3Cell();
    });

    this.props.unrestrictedClimbDescent.sub(() => {
      this.fillBC3Cell();
    });

    this.props.btvExitMissed.sub(() => {
      this.fillBC3Cell();
    });

    this.sub
      .on('fmaVerticalArmed')
      .whenChanged()
      .handle((v) => {
        this.armedVerticalMode = v;
        this.fillBC3Cell();
      });

    this.sub
      .on('setHoldSpeed')
      .whenChanged()
      .handle((shs) => {
        this.setHoldSpeed = shs;
        this.fillBC3Cell();
      });

    this.sub
      .on('tcasRaInhibited')
      .whenChanged()
      .handle((tra) => {
        this.tcasRaInhibited = tra;
        this.fillBC3Cell();
      });

    this.sub
      .on('trkFpaDeselectedTCAS')
      .whenChanged()
      .handle((trk) => {
        this.trkFpaDeselected = trk;
        this.fillBC3Cell();
      });

    this.sub
      .on('tdReached')
      .whenChanged()
      .handle((tdr) => {
        this.tdReached = tdr;
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

class D3Cell extends DisplayComponent<{ bus: EventBus }> {
  private textRef = FSComponent.createRef<SVGTextElement>();

  private classNameSub = Subject.create('');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('mda')
      .whenChanged()
      .handle((mda) => {
        if (mda !== 0) {
          const MDAText = Math.round(mda).toString().padStart(6, ' ');

          this.textRef.instance.innerHTML = `<tspan>BARO</tspan><tspan class="Cyan" xml:space="preserve">${MDAText}</tspan>`;
        } else {
          this.textRef.instance.innerHTML = '';
        }
        this.classNameSub.set(`FontSmallest MiddleAlign White`);
      });

    sub
      .on('dh')
      .whenChanged()
      .handle((dh) => {
        let fontSize = 'FontSmallest';

        if (dh !== -1 && dh !== -2) {
          const DHText = Math.round(dh).toString().padStart(4, ' ');

          this.textRef.instance.innerHTML = `
                        <tspan>RADIO</tspan><tspan class="Cyan" xml:space="preserve">${DHText}</tspan>
                    `;
        } else if (dh === -2) {
          this.textRef.instance.innerHTML = '<tspan>NO DH</tspan>';
          fontSize = 'FontMedium';
        } else {
          this.textRef.instance.innerHTML = '';
        }
        this.classNameSub.set(`${fontSize} MiddleAlign White`);
      });
  }

  render(): VNode {
    return <text ref={this.textRef} class={this.classNameSub} x="118.38384" y="21.104172" />;
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
      const text = `${this.fd1Active ? '1' : '-'}FD${this.fd2Active ? '2' : '-'}`;
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

  constructor(props: CellProps) {
    super(props, 9);
  }

  private getClass(athrStatus: number): string {
    let className: string = '';
    this.isShown = true;
    switch (athrStatus) {
      case 1:
        className = 'Cyan';
        break;
      case 2:
        className = 'White';
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
        this.classSub.set(`FontMedium MiddleAlign ${className}`);
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
        <text class={this.classSub} x="145.75578" y="21.434536">
          A/THR
        </text>
      </g>
    );
  }
}
