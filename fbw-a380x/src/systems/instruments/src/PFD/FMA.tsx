// @ts-strict-ignore
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
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { ArmedLateralMode, ArmedVerticalMode, isArmed, LateralMode, VerticalMode } from '@shared/autopilot';
import { Arinc429Values } from './shared/ArincValueProvider';
import { PFDSimvars } from './shared/PFDSimvarPublisher';
import {
  Arinc429ConsumerSubject,
  Arinc429LocalVarConsumerSubject,
  Arinc429Word,
  Arinc429WordData,
  ArincEventBus,
} from '@flybywiresim/fbw-sdk';
import { FcdcValueProvider } from './shared/FcdcValueProvider';
import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { FGVars } from '../MsfsAvionicsCommon/providers/FGDataPublisher';
import { AutoThrustModeMessage } from '@shared/autopilot';
import { getDisplayIndex } from './PFD';
import { PrimFgBusBaseEvents } from '@shared/publishers/PrimFgPublisher';
import { FlashOneHertz } from '../MsfsAvionicsCommon/FlashingElementUtils';

abstract class ShowForSecondsComponent<T extends ComponentProps> extends DisplayComponent<T> {
  private timeout: number = 0;

  private readonly displayTimeInSeconds: number;

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

export class FMA extends DisplayComponent<{
  readonly bus: ArincEventBus;
  readonly isAttExcessive: Subscribable<boolean>;
  readonly fcdcData: FcdcValueProvider;
}> {
  private sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & DmcLogicEvents & FGVars>();

  private activeLateralMode: LateralMode = LateralMode.NONE;

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

  private readonly altitude = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('altitudeAr'),
  );

  private readonly landingElevation = ConsumerSubject.create(this.sub.on('landingElevation'), Arinc429Word.empty());

  private readonly ap1Active = ConsumerSubject.create(this.sub.on('ap1Active'), false);

  private readonly ap2Active = ConsumerSubject.create(this.sub.on('ap2Active'), false);

  private readonly selectedAltitude = ConsumerSubject.create(this.sub.on('selectedAltitude'), null);

  private readonly selectedFpa = ConsumerSubject.create(this.sub.on('selectedFpa'), null);

  private readonly selectedVs = ConsumerSubject.create(this.sub.on('selectedVs'), null);

  private readonly fwcFlightPhase = ConsumerSubject.create(this.sub.on('fwcFlightPhase'), 0);

  private readonly activeVerticalMode = ConsumerSubject.create(this.sub.on('activeVerticalMode'), 0);

  private readonly btvExitMissed = ConsumerSubject.create(this.sub.on('btvExitMissed'), false);

  private readonly autoThrustModeMessage = ConsumerSubject.create(
    this.sub.on('fg.athr.message'),
    AutoThrustModeMessage.None,
  );

  private readonly disconnectApForLdg = MappedSubject.create(
    ([ap1, ap2, ra, altitude, landingElevation, verticalMode, selectedFpa, selectedVs, autolandCapacity]) => {
      return (
        (ap1 || ap2) &&
        (ra.isNormalOperation() ? ra.value <= 150 : altitude.valueOr(Infinity) - landingElevation.valueOr(0) <= 150) &&
        (!autolandCapacity ||
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
    this.props.fcdcData.autolandCapacity,
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
      (this.props.fcdcData.autolandCapacity.get() &&
        this.activeVerticalMode.get() === VerticalMode.LAND &&
        this.activeLateralMode === LateralMode.LAND) ||
      this.activeLateralMode === LateralMode.FLARE ||
      this.activeVerticalMode.get() === VerticalMode.FLARE ||
      this.activeLateralMode === LateralMode.ROLL_OUT ||
      this.activeVerticalMode.get() === VerticalMode.ROLL_OUT;
    const BC3Message =
      getBC3Message(
        this.props.isAttExcessive.get(),
        this.armedVerticalModeSub.get(),
        this.setHoldSpeed,
        this.props.fcdcData.fcdcDiscreteWord1.get(),
        this.fwcFlightPhase.get(),
        this.trkFpaDeselected.get(),
        this.tcasRaInhibited.get(),
        this.tdReached,
        this.disconnectApForLdg.get(),
        this.unrestrictedClimbDescent.get(),
        this.btvExitMissed.get(),
        this.autoThrustModeMessage.get() === AutoThrustModeMessage.ThrustLock,
      )[0] !== null;

    const engineMessage = this.autoThrustModeMessage.get();
    const AB3Message =
      (this.machPresel.isNormalOperation() || this.speedPresel.isNormalOperation()) &&
      !BC3Message &&
      engineMessage === AutoThrustModeMessage.None;
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

    this.props.fcdcData.fcdcDiscreteWord1.sub(() => this.handleFMABorders());
    this.fwcFlightPhase.sub(() => this.handleFMABorders());

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

    this.autoThrustModeMessage.sub(() => {
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

        <Row1 bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} fcdcData={this.props.fcdcData} />
        <Row2 bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />
        <Row3
          bus={this.props.bus}
          isAttExcessive={this.props.isAttExcessive}
          disconnectApForLdg={this.disconnectApForLdg}
          autoThrustModeMessage={this.autoThrustModeMessage}
          unrestrictedClimbDescent={this.unrestrictedClimbDescent}
          btvExitMissed={this.btvExitMissed}
          AB3Message={this.AB3Message}
          fcdcData={this.props.fcdcData}
        />
      </g>
    );
  }
}

class Row1 extends DisplayComponent<{
  readonly bus: EventBus;
  readonly isAttExcessive: Subscribable<boolean>;
  readonly fcdcData: FcdcValueProvider;
}> {
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
          <B1Cell ref={this.b1Cell} bus={this.props.bus} fcdcData={this.props.fcdcData} />
          <C1Cell ref={this.c1Cell} bus={this.props.bus} fcdcData={this.props.fcdcData} />
          <D1D2Cell ref={this.D1D2Cell} bus={this.props.bus} fcdcData={this.props.fcdcData} />
          <BC1Cell ref={this.BC1Cell} bus={this.props.bus} fcdcData={this.props.fcdcData} />
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
  readonly bus: ArincEventBus;
  readonly isAttExcessive: Subscribable<boolean>;
  readonly disconnectApForLdg: Subscribable<boolean>;
  readonly unrestrictedClimbDescent: Subscribable<number>;
  readonly btvExitMissed: Subscribable<boolean>;
  readonly AB3Message: Subscribable<boolean>;
  readonly fcdcData: FcdcValueProvider;
  readonly autoThrustModeMessage: Subscribable<AutoThrustModeMessage>;
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
        <A3Cell
          bus={this.props.bus}
          AB3Message={this.props.AB3Message}
          autoThrustModeMessage={this.props.autoThrustModeMessage}
        />
        <g ref={this.cellsToHide}>
          <AB3Cell bus={this.props.bus} autoThrustModeMessage={this.props.autoThrustModeMessage} />
          <D3Cell bus={this.props.bus} />
        </g>
        <BC3Cell
          isAttExcessive={this.props.isAttExcessive}
          disconnectApForLdg={this.props.disconnectApForLdg}
          unrestrictedClimbDescent={this.props.unrestrictedClimbDescent}
          btvExitMissed={this.props.btvExitMissed}
          bus={this.props.bus}
          fcdcData={this.props.fcdcData}
          autoThrustModeMessage={this.props.autoThrustModeMessage}
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
        text = '<text class="FontMediumSmaller MiddleAlign Green" x="16.782249" y="7.1280665">THR IDLE</text>';
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
      .handle((a) => {
        this.autoBrakeActive = a;
        this.setText();
      });

    sub
      .on('autoBrakeMode')
      .whenChanged()
      .handle((a) => {
        this.autoBrakeMode = a;
        if (this.autoBrakeActive) {
          this.setText();
        }
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
  autoThrustModeMessage: Subscribable<AutoThrustModeMessage>;
}

class A3Cell extends DisplayComponent<A3CellProps> {
  private classSub = Subject.create('');

  private textSub = Subject.create('');

  private autobrakeMode = 0;

  private AB3Message = false;

  private autoBrakeActive = false;

  private onUpdateAthrModeMessage(message: AutoThrustModeMessage) {
    let text: string = '';
    let className: string = '';
    switch (message) {
      case AutoThrustModeMessage.ThrustLock:
        text = 'THR LK';
        className = 'Amber BlinkInfinite';
        break;
      case AutoThrustModeMessage.LeverToga:
        text = 'LVR TOGA';
        className = 'White BlinkInfinite';
        break;
      case AutoThrustModeMessage.LeverClb:
        text = 'LVR CLB';
        className = 'White BlinkInfinite';
        break;
      case AutoThrustModeMessage.LeverMct:
        text = 'LVR MCT';
        className = 'White BlinkInfinite';
        break;
      case AutoThrustModeMessage.LeverAsym:
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
    if (this.autobrakeMode === 6 && !this.AB3Message && !this.autoBrakeActive) {
      this.textSub.set('BRK RTO');
      this.classSub.set('FontMediumSmaller MiddleAlign Cyan');
    } else {
      this.textSub.set('');
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    this.props.autoThrustModeMessage.sub((message) => {
      this.onUpdateAthrModeMessage(message);
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
        this.autoBrakeActive = a;
        this.handleAutobrakeMode();
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

interface AB3CellProps extends CellProps {
  autoThrustModeMessage: Subscribable<AutoThrustModeMessage>;
}

class AB3Cell extends DisplayComponent<AB3CellProps> {
  // TODO: Connect this to the correct FMGC bus
  private speedPresel = Arinc429Word.empty();

  // TODO: Connect these to the correct FMGC bus
  private machPresel = Arinc429Word.empty();

  private athrModeMessage = AutoThrustModeMessage.None;

  private readonly textSub = Subject.create('');

  private getText() {
    if (this.athrModeMessage === AutoThrustModeMessage.None) {
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
    this.props.autoThrustModeMessage.sub((message) => {
      this.athrModeMessage = message;
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

class B1Cell extends ShowForSecondsComponent<CellProps & { fcdcData: FcdcValueProvider }> {
  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents>();

  private primFgDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_3'));

  private primFgDiscreteWord4 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_4'));

  private primFgDiscreteWord6 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_6'));

  private primFgSelectedVs = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_selected_vertical_speed'));

  private primFgSelectedFpa = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_selected_flight_path_angle'));

  private readonly fmaTextRef = FSComponent.createRef<SVGTextElement>();

  private readonly tcasLargeBoxDemand = this.primFgDiscreteWord6.map((word) => word.bitValueOr(11, false));

  private readonly targetNotHeld = this.primFgDiscreteWord4.map((word) => word.bitValueOr(29, false));

  private readonly longitudinalModeReversion = this.primFgDiscreteWord4.map((word) => word.bitValueOr(29, false));

  private readonly text = MappedSubject.create(
    ([primFgDiscreteWord3, primFgSelectedFpa]) => {
      const gsTrackMode = primFgDiscreteWord3.bitValueOr(22, false);
      const gsCaptureMode = primFgDiscreteWord3.bitValueOr(21, false);
      const descentMode = primFgDiscreteWord3.bitValueOr(12, false);
      const climbMode = primFgDiscreteWord3.bitValueOr(11, false);
      const pitchTakeoffMode = primFgDiscreteWord3.bitValueOr(15, false);
      const pitchGoaroundMode = primFgDiscreteWord3.bitValueOr(16, false);
      const openDescentMode = primFgDiscreteWord3.bitValueOr(14, false);
      const openClimbMode = primFgDiscreteWord3.bitValueOr(13, false);
      const altHoldMode = primFgDiscreteWord3.bitValueOr(20, false);
      const altAcqMode = primFgDiscreteWord3.bitValueOr(19, false);
      const fpaMode = primFgDiscreteWord3.bitValueOr(18, false);
      const vsMode = primFgDiscreteWord3.bitValueOr(17, false);
      const appDesMode = primFgDiscreteWord3.bitValueOr(23, false);
      const tcasMode = primFgDiscreteWord3.bitValueOr(25, false);

      const altCstrApplicable = primFgDiscreteWord3.bitValueOr(28, false);
      const altIsCrzAlt = primFgDiscreteWord3.bitValueOr(29, false);

      this.isShown = true;
      if (gsTrackMode) {
        return 'G/S';
      } else if (false) {
        return 'F-G/S';
      } else if (gsCaptureMode) {
        return 'G/S*';
      } else if (false) {
        return 'F-G/S*';
      } else if (pitchTakeoffMode || pitchGoaroundMode) {
        return 'SRS';
      } else if (tcasMode) {
        return 'TCAS';
      } else if (appDesMode) {
        return 'APP-DES';
      } else if (descentMode) {
        return 'DES';
      } else if (openDescentMode) {
        return 'OP DES';
      } else if (climbMode) {
        return 'CLB';
      } else if (openClimbMode) {
        return 'OP CLB';
      } else if (altHoldMode && !altCstrApplicable && !altIsCrzAlt) {
        return 'ALT';
      } else if (altAcqMode && !altCstrApplicable && !altIsCrzAlt) {
        return 'ALT*';
      } else if (altAcqMode && altCstrApplicable && !altIsCrzAlt) {
        return 'ALT CST*';
      } else if (altHoldMode && altCstrApplicable && !altIsCrzAlt) {
        return 'ALT CST';
      } else if (altHoldMode && !altCstrApplicable && altIsCrzAlt) {
        return 'ALT CRZ';
      } else if (fpaMode) {
        let text = 'FPA';
        const fpaValue = primFgSelectedFpa.value;

        // if FPA is 0 give it an empty space for where the '+' and '-' will be.
        if (!(primFgSelectedFpa.isNoComputedData() || primFgSelectedFpa.isFailureWarning()) && fpaValue === 0) {
          text += ' ';
        }
        return text;
      } else if (vsMode) {
        return 'V/S';
      } else {
        this.isShown = false;

        return '';
      }
    },
    this.primFgDiscreteWord3,
    this.primFgSelectedFpa,
  );

  private readonly additionalText = MappedSubject.create(
    ([primFgDiscreteWord3, primFgSelectedVs, primFgSelectedFpa]) => {
      const fpaMode = primFgDiscreteWord3.bitValueOr(18, false);
      const vsMode = primFgDiscreteWord3.bitValueOr(17, false);

      if (fpaMode) {
        if (!(primFgSelectedFpa.isNoComputedData() || primFgSelectedFpa.isFailureWarning())) {
          const fpaValue = primFgSelectedFpa.value;
          return `${fpaValue > 0 ? '+' : ''}${(Math.round(fpaValue * 10) / 10).toFixed(1)}°`;
        } else {
          return '-----';
        }
      } else if (vsMode) {
        if (!(primFgSelectedVs.isNoComputedData() || primFgSelectedVs.isFailureWarning())) {
          const vsValue = primFgSelectedVs.value;
          return `${vsValue > 0 ? '+' : ''}${Math.round(vsValue).toString()}`.padStart(5, '\xa0');
        } else {
          return '-----';
        }
      } else {
        return '';
      }
    },
    this.primFgDiscreteWord3,
    this.primFgSelectedVs,
    this.primFgSelectedFpa,
  );

  private readonly inSpeedProtection = MappedSubject.create(
    ([text, targetNotHeld]) => {
      return targetNotHeld && text !== '';
    },
    this.text,
    this.targetNotHeld,
  );

  private readonly boxClassSub = this.inSpeedProtection.map((inSpeedProtection) =>
    inSpeedProtection ? 'NormalStroke None' : 'NormalStroke White',
  );

  private readonly boxPathStringSub = MappedSubject.create(
    ([tcasLargeBoxDemand, primFgDiscreteWord3]) => {
      return tcasLargeBoxDemand && primFgDiscreteWord3.bitValueOr(25, false)
        ? 'm35.756 1.8143h27.918v13.506h-27.918z'
        : 'm35.756 1.8143h27.918v6.0476h-27.918z';
    },
    this.tcasLargeBoxDemand,
    this.primFgDiscreteWord3,
  );

  private readonly activeVerticalModeClassSub = this.primFgDiscreteWord3.map((word) => {
    // VS FPA has a smaller font than the other active modes
    const fpaMode = word.bitValueOr(18, false);
    const vsMode = word.bitValueOr(17, false);

    return vsMode || fpaMode ? 'FontMediumSmaller MiddleAlign Green' : 'FontMedium MiddleAlign Green';
  });

  constructor(props: CellProps & { fcdcData: FcdcValueProvider }) {
    super(props, 10);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.text.sub(() => {
      this.displayModeChangedPath();
    });
  }

  render(): VNode {
    return (
      <g>
        <path ref={this.modeChangedPathRef} class={this.boxClassSub} visibility="hidden" d={this.boxPathStringSub} />

        <FlashOneHertz bus={this.props.bus} flashDuration={Infinity} visible={this.inSpeedProtection}>
          <path class="NormalStroke Amber" d="m34.656 1.8143h29.918v6.0476h-29.918z" />
        </FlashOneHertz>

        <text
          ref={this.fmaTextRef}
          style="white-space: pre"
          class={this.activeVerticalModeClassSub}
          x="49.921795"
          y="7.1040988"
        >
          <tspan>{this.text}</tspan>
          <FlashOneHertz
            bus={this.props.bus}
            flashDuration={Infinity}
            flashing={this.inSpeedProtection}
            className1={'Cyan'}
            className2={'DimmedCyan Fill'}
          >
            <tspan xml:space="preserve">{this.additionalText}</tspan>
          </FlashOneHertz>
        </text>
      </g>
    );
  }
}

class B2Cell extends DisplayComponent<CellProps> {
  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents>();

  private primFgDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_2'));

  private primFgDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_3'));

  private classSub = MappedSubject.create(
    ([primFgDiscreteWord2, primFgDiscreteWord3]) => {
      const altAcqArmed = primFgDiscreteWord2.bitValueOr(11, false);

      const altCstrApplicable = primFgDiscreteWord3.bitValueOr(28, false);

      return altAcqArmed && altCstrApplicable
        ? 'FontMediumSmaller MiddleAlign Magenta'
        : 'FontMediumSmaller MiddleAlign Cyan';
    },
    this.primFgDiscreteWord2,
    this.primFgDiscreteWord3,
  );

  private text1Sub = MappedSubject.create(
    ([primFgDiscreteWord2, primFgDiscreteWord3]) => {
      const altAcqArmed = primFgDiscreteWord2.bitValueOr(11, false);
      const clbArmed = primFgDiscreteWord2.bitValueOr(15, false);
      const desArmed = primFgDiscreteWord2.bitValueOr(16, false);
      const opClbArmed = primFgDiscreteWord2.bitValueOr(17, false);

      const gsArmed = primFgDiscreteWord2.bitValueOr(13, false);
      const altCstrApplicable = primFgDiscreteWord3.bitValueOr(28, false);
      const altIsCrzAlt = primFgDiscreteWord3.bitValueOr(29, false);

      if (opClbArmed) {
        return '      OP CLB';
      } else if (clbArmed) {
        return '      CLB';
      } else if (desArmed) {
        return gsArmed ? 'DES ' : '      DES';
      } else if (altAcqArmed && altCstrApplicable) {
        return gsArmed ? 'ALT ' : '      ALT';
      } else if (altAcqArmed) {
        return gsArmed ? 'ALT ' : '      ALT';
      } else if (altAcqArmed && altIsCrzAlt) {
        return '      ALT CRZ';
      } else if (gsArmed) {
        return '      G/S';
      } else {
        return '';
      }
    },
    this.primFgDiscreteWord2,
    this.primFgDiscreteWord3,
  );

  private text2Sub = MappedSubject.create(
    ([primFgDiscreteWord2, text1Sub]) => {
      const gsArmed = primFgDiscreteWord2.bitValueOr(13, false);

      if (gsArmed && text1Sub.length !== 0) {
        return '  G/S';
      } else if (primFgDiscreteWord2.bitValueOr(14, false)) {
        return 'APP-DES';
      } else {
        return '';
      }
    },
    this.primFgDiscreteWord2,
    this.text1Sub,
  );

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

class C1Cell extends ShowForSecondsComponent<CellProps & { fcdcData: FcdcValueProvider }> {
  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents>();

  private primFgDiscreteWord4 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_4'));

  private readonly text = MappedSubject.create(([primFgDiscreteWord4]) => {
    const rollGaActive = primFgDiscreteWord4.bitValueOr(15, false);
    const backbeamMode = primFgDiscreteWord4.bitValueOr(29, false);
    const locCaptActive = primFgDiscreteWord4.bitValueOr(13, false);
    const locTrackActive = primFgDiscreteWord4.bitValueOr(14, false);
    const headingActive = primFgDiscreteWord4.bitValueOr(16, false);
    const runwayActive = primFgDiscreteWord4.bitValueOr(11, false);
    const runwayLocSubmodeActive = primFgDiscreteWord4.bitValueOr(18, false);
    const runwayTrackSubmodeActive = primFgDiscreteWord4.bitValueOr(19, false);
    const trackActive = primFgDiscreteWord4.bitValueOr(17, false);
    const navActive = primFgDiscreteWord4.bitValueOr(12, false);

    this.isShown = true;
    if (rollGaActive) {
      return 'GA TRK';
    } else if (locCaptActive && backbeamMode) {
      return 'LOC B/C*';
    } else if (locCaptActive && !backbeamMode) {
      return 'LOC *';
    } else if (false) {
      return 'F-LOC *';
    } else if (headingActive) {
      return 'HDG';
    } else if (runwayActive && runwayLocSubmodeActive) {
      return 'RWY';
    } else if (runwayActive && runwayTrackSubmodeActive) {
      return 'RWY TRK';
    } else if (trackActive) {
      return 'TRACK';
    } else if (locTrackActive && backbeamMode) {
      return 'LOC B/C';
    } else if (locTrackActive && !backbeamMode) {
      return 'LOC';
    } else if (false) {
      return 'F-LOC';
    } else if (navActive) {
      return 'NAV';
    } else {
      this.isShown = false;
      return '';
    }
  }, this.primFgDiscreteWord4);

  constructor(props: CellProps & { fcdcData: FcdcValueProvider }) {
    super(props, 10);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.text.sub(() => {
      this.displayModeChangedPath();
    });
  }

  render(): VNode {
    return (
      <g>
        <path
          ref={this.modeChangedPathRef}
          class="NormalStroke White"
          visibility="hidden"
          d="m99.87 1.8143v6.0476h-31.075l1e-6 -6.0476z"
        />
        <text class="FontMedium MiddleAlign Green" x="84.856567" y="6.9873109">
          {this.text}
        </text>
      </g>
    );
  }
}

class C2Cell extends DisplayComponent<CellProps> {
  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents>();

  private primFgDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_2'));

  private primFgDiscreteWord4 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_4'));

  private readonly text = MappedSubject.create(
    ([primFgDiscreteWord2, primFgDiscreteWord4]) => {
      const navArmed = primFgDiscreteWord2.bitValueOr(22, false);
      const locArmed = primFgDiscreteWord2.bitValueOr(23, false);
      const rwyArmed = primFgDiscreteWord2.bitValueOr(24, false);
      const backbeamMode = primFgDiscreteWord4.bitValueOr(29, false);

      if (locArmed && backbeamMode) {
        return 'LOC B/C';
      } else if (locArmed) {
        return 'LOC';
      } else if (false) {
        return 'F-LOC';
      } else if (rwyArmed) {
        return 'RWY' + (navArmed ? '  NAV' : '');
      } else if (navArmed) {
        return 'NAV';
      }
    },
    this.primFgDiscreteWord2,
    this.primFgDiscreteWord4,
  );

  render(): VNode {
    return (
      <text style="white-space: pre" class="FontMediumSmaller MiddleAlign Cyan" x="84.234184" y="13.629653">
        {this.text}
      </text>
    );
  }
}

class BC1Cell extends ShowForSecondsComponent<CellProps & { fcdcData: FcdcValueProvider }> {
  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents>();

  private primFgDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_1'));

  private primFgDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_3'));

  private primFgDiscreteWord4 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_4'));

  private readonly text = MappedSubject.create(
    ([primFgDiscreteWord1, primFgDiscreteWord3, primFgDiscreteWord4]) => {
      const rollOutActive = primFgDiscreteWord4.bitValueOr(26, false);
      const flareActive = primFgDiscreteWord3.bitValueOr(24, false);
      const landActive = primFgDiscreteWord1.bitValueOr(23, false) && !flareActive && !rollOutActive;

      this.isShown = true;
      if (rollOutActive) {
        return 'ROLL OUT';
      } else if (flareActive) {
        return 'FLARE';
      } else if (landActive) {
        return 'LAND';
      } else {
        this.isShown = false;
        return '';
      }
    },
    this.primFgDiscreteWord1,
    this.primFgDiscreteWord3,
    this.primFgDiscreteWord4,
  );

  constructor(props: CellProps & { fcdcData: FcdcValueProvider }) {
    super(props, 10);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.text.sub(() => {
      this.displayModeChangedPath();
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
          {this.text}
        </text>
      </g>
    );
  }
}

const getBC3Message = (
  isAttExcessive: boolean,
  armedVerticalMode: number,
  setHoldSpeed: boolean,
  fcdcWord1: Arinc429WordData,
  fwcFlightPhase: number,
  trkFpaDeselectedTCAS: boolean,
  tcasRaInhibited: boolean,
  tdReached: boolean,
  disconnectApForLdg: boolean,
  unrestrictedClimbDescent: number,
  exitMissed: boolean,
  thrustLocked: boolean,
) => {
  const flightPhaseForWarning =
    fwcFlightPhase >= 2 && fwcFlightPhase <= 11 && !(fwcFlightPhase >= 4 && fwcFlightPhase <= 7);
  const armedVerticalBitmask = armedVerticalMode;
  const TCASArmed = (armedVerticalBitmask >> 6) & 1;

  let text: string;
  let className: string;

  // All currently unused message are set to false
  if (fcdcWord1.bitValue(15) && !fcdcWord1.isFailureWarning() && flightPhaseForWarning) {
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
    className = 'FontMediumSmaller White';
  } else if (trkFpaDeselectedTCAS && !isAttExcessive) {
    text = 'TRK FPA DESELECTED';
    className = 'FontMediumSmaller White';
  } else if (thrustLocked) {
    text = 'MOVE THR LEVERS';
    className = 'BlinkInfinite Amber';
  } else if (tdReached) {
    text = 'T/D REACHED';
    className = 'FontMediumSmaller White';
  } else if (false) {
    text = 'EXTEND SPD BRK';
    className = 'FontMediumSmaller White';
  } else if (false) {
    text = 'RETRACT SPD BRK';
    className = 'FontMediumSmaller White';
  } else if (false) {
    text = 'CHECK APPR SEL';
    className = 'FontMediumSmaller White';
  } else if (setHoldSpeed) {
    text = 'SET HOLD SPD';
    className = 'FontMediumSmaller White';
  } else if (exitMissed) {
    text = 'EXIT MISSED';
    className = 'FontMediumSmaller White';
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
  readonly isAttExcessive: Subscribable<boolean>;
  readonly disconnectApForLdg: Subscribable<boolean>;
  readonly unrestrictedClimbDescent: Subscribable<number>;
  readonly btvExitMissed: Subscribable<boolean>;
  readonly bus: EventBus;
  readonly fcdcData: FcdcValueProvider;
  readonly autoThrustModeMessage: Subscribable<AutoThrustModeMessage>;
}> {
  private sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values>();

  private bc3Cell = FSComponent.createRef<SVGTextElement>();

  private classNameSub = Subject.create('');

  private armedVerticalMode = 0;

  private setHoldSpeed = false;

  private tcasRaInhibited = false;

  private trkFpaDeselected = false;

  private tdReached = false;

  private readonly fwcFlightPhase = ConsumerSubject.create(this.sub.on('fwcFlightPhase'), 0);

  private fillBC3Cell() {
    const [text, className] = getBC3Message(
      this.props.isAttExcessive.get(),
      this.armedVerticalMode,
      this.setHoldSpeed,
      this.props.fcdcData.fcdcDiscreteWord1.get(),
      this.fwcFlightPhase.get(),
      this.trkFpaDeselected,
      this.tcasRaInhibited,
      this.tdReached,
      this.props.disconnectApForLdg.get(),
      this.props.unrestrictedClimbDescent.get(),
      this.props.btvExitMissed.get(),
      this.props.autoThrustModeMessage.get() == AutoThrustModeMessage.ThrustLock,
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

    this.props.fcdcData.fcdcDiscreteWord1.sub(() => this.fillBC3Cell());
    this.fwcFlightPhase.sub(() => this.fillBC3Cell());

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

    this.props.autoThrustModeMessage.sub(() => {
      this.fillBC3Cell();
    });
  }

  render(): VNode {
    return <text ref={this.bc3Cell} class={this.classNameSub} x="68.087875" y="21.627102" style="white-space: pre" />;
  }
}

class D1D2Cell extends ShowForSecondsComponent<CellProps & { readonly fcdcData: FcdcValueProvider }> {
  private static readonly FiveCharactersPerLineSingleLineModeChangePath = 'm108.1 1.8143h19.994v6.0476h-19.994z';
  private static readonly SixCharactersPerLineTwoLinesModeChangePath = 'm107.1 1.8143h22.994v13.506h-22.994z';
  private static readonly FourCharactersPerLineTwoLinesModeChangePath = 'm110.1 1.8143h15.994v13.506h-15.994z';

  private readonly sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & DmcLogicEvents>();

  private readonly lsButton = ConsumerSubject.create(
    this.sub.on(getDisplayIndex() == 1 ? 'ls1Button' : 'ls2Button'),
    false,
  );

  private readonly fmaLateralActive = ConsumerSubject.create(this.sub.on('activeLateralMode'), 0);
  private readonly fmaLateralArmed = ConsumerSubject.create(this.sub.on('fmaLateralArmed'), 0);

  private readonly fmaVerticalActive = ConsumerSubject.create(this.sub.on('activeVerticalMode'), 0);
  private readonly fmaVerticalArmed = ConsumerSubject.create(this.sub.on('fmaVerticalArmed'), 0);

  private readonly landModesArmedOrActive = MappedSubject.create(
    ([latAct, latArm, vertAct, vertArm]) =>
      ((latAct >= 30 && latAct <= 34) || isArmed(latArm, ArmedLateralMode.LOC)) &&
      ((vertAct >= 30 && vertAct <= 34) || isArmed(vertArm, ArmedVerticalMode.GS)),
    this.fmaLateralActive,
    this.fmaLateralArmed,
    this.fmaVerticalActive,
    this.fmaVerticalArmed,
  );

  private readonly text1Sub = Subject.create('');

  private readonly text2Sub = Subject.create('');

  constructor(props: CellProps & { readonly fcdcData: FcdcValueProvider }) {
    super(props, 9);
  }

  private setText() {
    let text1: string;
    let text2: string | undefined;
    let modeChangedPath: string | undefined;
    this.isShown = true;
    if (this.props.fcdcData.land2Capacity.get()) {
      text1 = 'LAND2';
      text2 = '';
      modeChangedPath = D1D2Cell.FiveCharactersPerLineSingleLineModeChangePath;
    } else if (this.props.fcdcData.land3FailPassiveCapacity.get()) {
      text1 = 'LAND3';
      text2 = 'SINGLE';
      modeChangedPath = D1D2Cell.SixCharactersPerLineTwoLinesModeChangePath;
    } else if (this.props.fcdcData.land3FailOperationalCapacity.get()) {
      text1 = 'LAND3';
      text2 = 'DUAL';
      modeChangedPath = D1D2Cell.SixCharactersPerLineTwoLinesModeChangePath;
    } else if (false) {
      text1 = 'LAND1';
      text2 = '';
      modeChangedPath = D1D2Cell.FiveCharactersPerLineSingleLineModeChangePath;
    } else if (false) {
      text1 = 'F-APP';
      modeChangedPath = D1D2Cell.FiveCharactersPerLineSingleLineModeChangePath;
    } else if (false) {
      text1 = 'F-APP';
      text2 = '+ RAW';
      modeChangedPath = D1D2Cell.SixCharactersPerLineTwoLinesModeChangePath;
    } else if (false) {
      text1 = 'RAW';
      text2 = 'ONLY';
      modeChangedPath = D1D2Cell.FourCharactersPerLineTwoLinesModeChangePath;
    } else if (this.lsButton.get() || this.landModesArmedOrActive.get()) {
      text1 = 'APPR1';
      text2 = '';
      modeChangedPath = D1D2Cell.FiveCharactersPerLineSingleLineModeChangePath;
    } else {
      text1 = '';
      text2 = '';
      this.isShown = false;
    }

    const hasChanged = text1 !== this.text1Sub.get() || text2 !== this.text2Sub.get();

    if (hasChanged) {
      this.displayModeChangedPath();

      this.text1Sub.set(text1);
      this.text2Sub.set(text2);
      if (this.modeChangedPathRef !== undefined) {
        this.modeChangedPathRef.instance.setAttribute('d', modeChangedPath);
      }
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    MappedSubject.create(
      () => this.setText(),
      this.props.fcdcData.fcdcFgDiscreteWord4,
      this.landModesArmedOrActive,
      this.lsButton,
    );
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
  private readonly sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values>();

  private readonly textRef = FSComponent.createRef<SVGTextElement>();

  /** bit 29 is NO DH selection */
  private readonly fmEisDiscrete2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fmEisDiscreteWord2Raw'));

  private readonly mda = Arinc429LocalVarConsumerSubject.create(this.sub.on('fmMdaRaw'));

  private readonly dh = Arinc429LocalVarConsumerSubject.create(this.sub.on('fmDhRaw'));

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
  private readonly DhModexPos = MappedSubject.create(
    ([noDhSelected]) => (noDhSelected ? 118.38384 : 103.47),
    this.noDhSelected,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <text
        ref={this.textRef}
        class={{
          FontSmallest: this.noDhSelected.map(SubscribableMapFunctions.not()),
          StartAlign: this.noDhSelected.map(SubscribableMapFunctions.not()),
          FontMedium: this.noDhSelected,
          MiddleAlign: this.noDhSelected,
          White: true,
        }}
        x={this.DhModexPos}
        y="21.104172"
      >
        <tspan>{this.mdaDhMode}</tspan>
        <tspan
          class={{ EndAlign: true, Cyan: true, HiddenElement: this.mdaDhValueText.map((v) => v.length <= 0) }}
          x="133.425"
          y="21.104172"
        >
          {this.mdaDhValueText}
        </tspan>
      </text>
    );
  }
}

class E1Cell extends ShowForSecondsComponent<CellProps> {
  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents>();

  private primFgDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_1'));

  private ap1Engaged = this.primFgDiscreteWord1.map((word) => word.bitValueOr(11, false));

  private ap2Engaged = this.primFgDiscreteWord1.map((word) => word.bitValueOr(12, false));

  private textSub = MappedSubject.create(
    ([ap1Engaged, ap2Engaged]) => {
      if (ap1Engaged && ap2Engaged) {
        return 'AP1+2';
      } else if (ap1Engaged) {
        return 'AP1';
      } else if (ap2Engaged) {
        return 'AP2';
      } else {
        this.isShown = false;
        return '';
      }
    },
    this.ap1Engaged,
    this.ap2Engaged,
  );

  constructor(props: CellProps) {
    super(props, 10);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.textSub.sub(() => {
      this.displayModeChangedPath();
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
  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents>();

  private primFgDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_1'));

  private ap1Engaged = this.primFgDiscreteWord1.map((word) => word.bitValueOr(11, false));

  private ap2Engaged = this.primFgDiscreteWord1.map((word) => word.bitValueOr(12, false));

  private fd1Engaged = this.primFgDiscreteWord1.map((word) => word.bitValueOr(13, false));

  private fd2Engaged = this.primFgDiscreteWord1.map((word) => word.bitValueOr(14, false));

  private textSub = MappedSubject.create(
    ([ap1Engaged, ap2Engaged, fd1Engaged, fd2Engaged]) => {
      this.isShown = true;
      if (!ap1Engaged && !ap2Engaged && !fd1Engaged && !fd2Engaged) {
        this.isShown = false;
        return '';
      } else {
        return `${fd1Engaged ? '1' : '-'}FD${fd2Engaged ? '2' : '-'}`;
      }
    },
    this.ap1Engaged,
    this.ap2Engaged,
    this.fd1Engaged,
    this.fd2Engaged,
  );

  constructor(props: CellProps) {
    super(props, 10);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.textSub.sub(() => {
      this.displayModeChangedPath();
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
  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents>();

  private primFgAtsDiscreteWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_ats_discrete_word'));

  private athrEngaged = this.primFgAtsDiscreteWord.map((word) => word.bitValueOr(11, false));

  private athrActive = this.primFgAtsDiscreteWord.map((word) => word.bitValueOr(12, false));

  private classSub = MappedSubject.create(
    ([athrEngaged, athrActive]) => {
      this.isShown = true;
      if (athrEngaged && athrActive) {
        this.isShown = false;
        return 'White';
      } else if (athrEngaged) {
        return 'Cyan';
      } else {
        this.isShown = false;
        return 'HiddenElement';
      }
    },
    this.athrEngaged,
    this.athrActive,
  );

  constructor(props: CellProps) {
    super(props, 10);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.classSub.sub(() => {
      this.displayModeChangedPath();
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
