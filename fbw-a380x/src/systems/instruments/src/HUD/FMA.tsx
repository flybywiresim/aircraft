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
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { SimplaneValues } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';
import {
  Arinc429ConsumerSubject,
  Arinc429LocalVarConsumerSubject,
  Arinc429Word,
  Arinc429WordData,
  ArincEventBus,
} from '@flybywiresim/fbw-sdk';
import { FcdcValueProvider } from './shared/FcdcValueProvider';
import { DmcLogicEvents } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { getDisplayIndex } from './HUD';
import { HudElems } from './HUDUtils';
import { FGVars } from 'instruments/src/MsfsAvionicsCommon/providers/FGDataPublisher';
import { AutoThrustModeMessage } from '@shared/autopilot';

abstract class ShowForSecondsComponent<T extends ComponentProps> extends DisplayComponent<T> {
  private timeout: number = 0;

  private readonly displayTimeInSeconds: number;

  protected modeChangedPathRef = FSComponent.createRef<SVGPathElement>();

  protected isShown = false;

  protected constructor(props: T, displayTimeInSeconds: number) {
    super(props);
    this.displayTimeInSeconds = displayTimeInSeconds;
  }

  public handleDeclutterMode = (cancel = false, decMode, textRef, textRef2?) => {
    if (decMode === 2) {
      if (cancel || !this.isShown) {
        clearTimeout(this.timeout);
        textRef.instance.style.visibility = 'hidden';
        if (typeof textRef2 !== 'undefined') {
          textRef2.instance.style.visibility = 'hidden';
        }
      } else {
        clearTimeout(this.timeout);
        textRef.instance.style.visibility = 'visible';
        if (typeof textRef2 !== 'undefined') {
          textRef2.instance.style.visibility = 'visible';
        }
        this.timeout = setTimeout(() => {
          textRef.instance.style.visibility = 'hidden';
          if (typeof textRef2 !== 'undefined') {
            textRef2.instance.style.visibility = 'hidden';
          }
        }, this.displayTimeInSeconds * 1000) as unknown as number;
      }
      this.modeChangedPathRef.instance.classList.remove('ModeChangedPath');
    } else {
      textRef.instance.style.visibility = 'visible';
      if (typeof textRef2 !== 'undefined') {
        textRef2.instance.style.visibility = 'visible';
      }
    }
  };

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
  private sub = this.props.bus.getSubscriber<
    HUDSimvars & Arinc429Values & SimplaneValues & HudElems & DmcLogicEvents & FGVars
  >();

  private FMA = '';

  private FMARef = FSComponent.createRef<SVGGElement>();

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

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub
      .on('FMA')
      .whenChanged()
      .handle((v) => {
        this.FMA = v;
        this.FMARef.instance.style.display = `${this.FMA}`;
      });
    this.sub
      .on('fmaVerticalArmed')
      .whenChanged()
      .handle((a) => {
        this.armedVerticalModeSub.set(a);
      });

    this.sub
      .on('activeLateralMode')
      .whenChanged()
      .handle((activeLateralMode) => {
        this.activeLateralMode = activeLateralMode;
      });

    this.sub
      .on('setHoldSpeed')
      .whenChanged()
      .handle((shs) => {
        this.setHoldSpeed = shs;
      });

    this.sub
      .on('tcasRaInhibited')
      .whenChanged()
      .handle((tra) => {
        this.tcasRaInhibited.set(tra);
      });

    this.sub
      .on('trkFpaDeselectedTCAS')
      .whenChanged()
      .handle((trk) => {
        this.trkFpaDeselected.set(trk);
      });

    this.sub
      .on('tdReached')
      .whenChanged()
      .handle((tdr) => {
        this.tdReached = tdr;
      });
  }

  render(): VNode {
    return (
      <g id="FMA" ref={this.FMARef}>
        {/* //Debug */}
        <g class="NormalStroke Grey" display="none">
          {/* //Alt and Speed tape masks */}
          <g transform="scale(1 1),translate(0 0)">
            <path d="m 120 190 v 427 h 137.5 v -427 z" class="maskFill" />
            <path d="m 1024 190 v 427 h 101.5 v -427 z" class="maskFill" />
          </g>
          <path class="NormalStroke Green" d="m 256 0 v100" />
          <path class="NormalStroke Green" d="m 426 0 v100" />
          <path class="NormalStroke Green" d="m 575.5 0 v100" />
          <path class="NormalStroke Green" d="m 725 0 v100" />
          <path class="NormalStroke Green" d="m 874 0 v100" />
          <path class="NormalStroke Green" d="m 1024 0 v100" />
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
  private decMode = 0;

  private text = Subject.create('');

  private className = Subject.create('FontMediumSmaller MiddleAlign Green');

  private autoBrkRef = FSComponent.createRef<SVGTextElement>();

  private modeArmed = FSComponent.createRef<SVGPathElement>();
  private handleDecMode() {
    if (this.text.get() === '') {
      this.modeArmed.instance.setAttribute('visibility', 'hidden');
      this.autoBrkRef.instance.style.visibility = 'hidden';
    } else {
      if (this.decMode !== 2) {
        this.modeArmed.instance.setAttribute('visibility', 'visible');
        this.autoBrkRef.instance.style.visibility = 'visible';
      } else {
        this.modeArmed.instance.setAttribute('visibility', 'hidden');
        this.autoBrkRef.instance.style.visibility = 'hidden';
      }
    }
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

    sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
        this.handleDecMode();
      });

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

        if (this.text.get() === '') {
          this.modeArmed.instance.setAttribute('visibility', 'hidden');
        } else {
          if (this.decMode !== 2) {
            this.modeArmed.instance.setAttribute('visibility', 'visible');
            this.autoBrkRef.instance.style.visibility = 'visible';
          } else {
            this.modeArmed.instance.setAttribute('visibility', 'hidden');
            this.autoBrkRef.instance.style.visibility = 'hidden';
          }
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
          this.handleDecMode();
        }
      });
  }

  render(): VNode {
    return (
      <g id="A2">
        <path
          ref={this.modeArmed}
          visibility="hidden"
          class="NormalStroke Green"
          d="m263.9 39.2 h 160"
          stroke-dasharray="10 8"
        />
        <text ref={this.autoBrkRef} class={this.className} x="341" y="71.6" style="white-space: pre">
          {this.text}
        </text>
      </g>
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
  private decMode = 0;

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
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        text = `
                                <path class="NormalStroke Green" d="m 296 9 v 67.5 h 90 v -67.5 z" />
                                <text class="FontMedium MiddleAlign Green" x="341" y="35.6">MAN</text>
                                <text class="FontMedium MiddleAlign Green" x="341" y="71.75">TOGA</text>
                            `;
        break;
      case 2:
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        text = `<g>
                                <path class="NormalStroke Green" d="m 296 9 v 67.5 h 90 v -67.5 z" />
                                <text class="FontMedium MiddleAlign Green" x="341" y="35.6">MAN</text>
                                <text class="FontMedium MiddleAlign Green" x="341" y="71.75">GA SOFT</text>
                            </g>`;
        break;
      case 3: {
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        const FlexTemp = Math.round(this.flexTemp);
        const FlexText = FlexTemp.toString();
        text = `<g>
                                <path class="NormalStroke Green" d="m 271 9 v 67.5 h 140 v -67.5 z" />
                                <text class="FontMedium MiddleAlign Green" x="341" y="35.6">MAN</text>
                                <text class="FontMedium MiddleAlign Green" x="310" y="71.75">FLX</text>
                                <text class="FontMedium MiddleAlign Green" x="355" y="74.25">+</text>
                                <text class="FontMedium MiddleAlign Green" x="385" y="71.75">
                                ${FlexText}
                                </text>
                            </g>`;

        break;
      }
      case 4:
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        text = `<g>
                                <path class="NormalStroke Green" d="m 296 9 v 67.5 h 90 v -67.5 z" />
                                <text class="FontMedium MiddleAlign Green" x="341" y="35.6">MAN</text>
                                <text class="FontMedium MiddleAlign Green" x="341" y="71.75">DTO</text>
                            </g>`;
        break;
      case 5:
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        text = `<g>
                                <path class="NormalStroke Green" d="m 296 9 v 67.5 h 90 v -67.5 z" />
                                <text class="FontMedium MiddleAlign Green" x="341" y="35.6">MAN</text>
                                <text class="FontMedium MiddleAlign Green" x="341" y="71.75">MCT</text>
                            </g>`;
        break;
      case 6:
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        text = `<g>
                                <path class="NormalStroke Green" d="m 296 9 v 67.5 h 90 v -67.5 zz" />
                                <text class="FontMedium MiddleAlign Green" x="341" y="35.6">MAN</text>
                                <text class="FontMedium MiddleAlign Green" x="341" y="71.75">THR</text>
                            </g>`;
        break;
      case 7:
        text = '<text  class="FontMedium MiddleAlign Green" x="341" y="35.6">SPEED</text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case 8:
        text = '<text  class="FontMedium MiddleAlign Green" x="341" y="35.6">MACH</text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case 9:
        text = '<text  class="FontMedium MiddleAlign Green" x="341" y="35.6">THR MCT</text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case 10:
        text = '<text  class="FontMedium MiddleAlign Green" x="341" y="35.6">THR CLB</text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case 11:
        text = '<text  class="FontMedium MiddleAlign Green" x="341" y="35.6">THR LVR</text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case 12:
        text = '<text  class="FontMediumSmaller MiddleAlign Green" x="341" y="35.6">THR IDLE</text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case 13:
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        text = `<g>
                                <path class="NormalStroke Green BlinkInfinite" d="m263 9 h 156 v 30.2 h-156 z" />
                                <text class="FontMedium MiddleAlign Green" x="341" y="35.6">A.FLOOR</text>
                            </g>`;
        break;
      case 14:
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        text = `<g>
                                <path class="NormalStroke Green BlinkInfinite" d="m263 9 h 156 v 30.2 h-156 z" />
                                <text class="FontMedium MiddleAlign Green" x="341" y="35.6">TOGA LK</text>
                            </g>`;
        break;
      default:
        if (this.autoBrakeActive) {
          switch (this.autoBrakeMode) {
            case 1:
              text = '<text class="FontMedium MiddleAlign Green" x="341" y="35.6">BTV</text>';
              this.displayModeChangedPath();
              this.handleDeclutterMode(false, this.decMode, this.cellRef);
              break;
            case 2:
              text = '<text class="FontMedium MiddleAlign Green" x="341" y="35.6">BRK LO</text>';
              this.displayModeChangedPath();
              this.handleDeclutterMode(false, this.decMode, this.cellRef);
              break;
            case 3:
              text = '<text class="FontMedium MiddleAlign Green" x="341" y="35.6">BRK 2 </text>';
              this.displayModeChangedPath();
              this.handleDeclutterMode(false, this.decMode, this.cellRef);
              break;
            case 4:
              text = '<text class="FontMedium MiddleAlign Green" x="341" y="35.6">BRK 3 </text>';
              this.displayModeChangedPath();
              this.handleDeclutterMode(false, this.decMode, this.cellRef);
              break;
            case 5:
              text = '<text class="FontMedium MiddleAlign Green" x="341" y="35.6">BRK HI </text>';
              this.displayModeChangedPath();
              this.handleDeclutterMode(false, this.decMode, this.cellRef);
              break;
            case 6:
              text = '<text class="FontMedium MiddleAlign Green" x="341" y="35.6">BRK RTO</text>';
              this.displayModeChangedPath();
              this.handleDeclutterMode(false, this.decMode, this.cellRef);
              break;
            default:
              text = '';
              this.isShown = false;
              this.displayModeChangedPath(true);
              this.handleDeclutterMode(true, this.decMode, this.cellRef);
          }
        } else {
          text = '';
          this.isShown = false;
          this.displayModeChangedPath(true);
          this.handleDeclutterMode(true, this.decMode, this.cellRef);
        }
    }

    this.cellRef.instance.innerHTML = text;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

    sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
        this.isShown = false;
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
      });
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
        this.setText();
      });
  }

  render(): VNode {
    return (
      <>
        <path
          ref={this.modeChangedPathRef}
          visibility="hidden"
          class="NormalStroke Green"
          d="m263 9 h 156 v 30.2 h -156z"
        />
        <g id="A1A2" ref={this.cellRef} />
      </>
    );
  }
}

interface A3CellProps extends CellProps {
  AB3Message: Subscribable<boolean>;
  autoThrustModeMessage: Subscribable<AutoThrustModeMessage>;
}

class A3Cell extends DisplayComponent<A3CellProps> {
  private decMode = 0;

  private classSub = Subject.create('');

  private textSub = Subject.create('');

  private autobrakeMode = 0;

  private AB3Message = false;

  private autoBrakeActive = false;

  private modeArmed = FSComponent.createRef<SVGPathElement>();

  private onUpdateAthrModeMessage(message: AutoThrustModeMessage) {
    let text: string = '';
    let className: string = '';
    switch (message) {
      case AutoThrustModeMessage.ThrustLock:
        text = 'THR LK';
        className = 'Green BlinkInfinite';
        break;
      case AutoThrustModeMessage.LeverToga:
        className = 'Green BlinkInfinite';
        break;
      case AutoThrustModeMessage.LeverClb:
        text = 'LVR CLB';
        className = 'Green BlinkInfinite';
        break;
      case AutoThrustModeMessage.LeverMct:
        text = 'LVR MCT';
        className = 'Green BlinkInfinite';
        break;
      case AutoThrustModeMessage.LeverAsym:
        text = 'LVR ASYM';
        className = 'Green';
        break;
      default:
        text = '';
    }

    this.textSub.set(text);
    this.classSub.set(`FontMedium MiddleAlign ${className}`);
  }

  private handleAutobrakeMode() {
    if (this.autobrakeMode === 6 && !this.AB3Message && !this.autoBrakeActive) {
      if (this.decMode !== 2) {
        this.modeArmed.instance.setAttribute('visibility', 'visible');
      }
      this.textSub.set('BRK RTO');
      this.classSub.set('FontMediumSmaller MiddleAlign Green');
    } else {
      this.modeArmed.instance.setAttribute('visibility', 'hidden');
      this.textSub.set('');
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

    this.props.autoThrustModeMessage.sub((message) => {
      this.onUpdateAthrModeMessage(message);
    });

    sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
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
      <g id="A3">
        <path
          ref={this.modeArmed}
          visibility="hidden"
          class="NormalStroke Green"
          d="m263.9 79.2 h 160"
          stroke-dasharray="10 8"
        />
        <text class={this.classSub} x="341" y="108">
          {this.textSub}
        </text>
      </g>
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
      <text class="FontMedium MiddleAlign Green" x="35.434673" y="21.656223">
        {this.textSub}
      </text>
    );
  }
}

class B1Cell extends ShowForSecondsComponent<CellProps & { fcdcData: FcdcValueProvider }> {
  private readonly boxClassSub = Subject.create('');

  private readonly boxPathStringSub = Subject.create('');

  private readonly activeVerticalModeSub = Subject.create(VerticalMode.NONE);

  private readonly activeVerticalModeClassSub = Subject.create('');

  private readonly speedProtectionPathRef = FSComponent.createRef<SVGPathElement>();

  private readonly inModeReversionPathRef = FSComponent.createRef<SVGPathElement>();

  private readonly fmaTextRef = FSComponent.createRef<SVGTextElement>();

  private selectedVS = 0;

  private inSpeedProtection = false;

  private fmaModeReversion = false;

  private expediteMode = false;

  private crzAltMode = false;

  private tcasModeDisarmed = false;

  private FPA = 0;

  private decMode = 0;

  private readonly displayedVerticalModeText = Subject.create('');

  constructor(props: CellProps & { fcdcData: FcdcValueProvider }) {
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
      case VerticalMode.LAND:
        if (!this.props.fcdcData.autolandCapacity.get()) {
          text = 'G/S';
        } else {
          text = '';
        }

        break;
      default:
        text = '';
    }

    if (text === '') {
      this.isShown = false;
      this.displayModeChangedPath(true);
      this.handleDeclutterMode(true, this.decMode, this.fmaTextRef);
    }

    const inSpeedProtection =
      this.inSpeedProtection && (this.activeVerticalModeSub.get() === 14 || this.activeVerticalModeSub.get() === 15);

    if (inSpeedProtection || this.fmaModeReversion) {
      this.boxClassSub.set('NormalStroke None');
    } else {
      this.boxClassSub.set('NormalStroke Green');
    }

    if (inSpeedProtection) {
      this.speedProtectionPathRef.instance.setAttribute('visibility', 'visible');
    } else {
      this.speedProtectionPathRef.instance.setAttribute('visibility', 'hidden');
    }

    const boxPathString =
      this.activeVerticalModeSub.get() === 50 && this.tcasModeDisarmed
        ? 'm 433 9 h 135 v 67.5 h -135 z'
        : 'm 433 9 h 135 v 30.2 h -135 z';

    this.boxPathStringSub.set(boxPathString);

    // VS FPA has a smaller font than the other active modes
    const VsFPA = this.activeVerticalModeSub.get() === 14 || this.activeVerticalModeSub.get() === 15;

    this.activeVerticalModeClassSub.set(VsFPA ? 'FontMediumSmaller MiddleAlign Green' : 'FontMedium MiddleAlign Green');

    this.fmaTextRef.instance.innerHTML = `<tspan>${text}</tspan><tspan xml:space="preserve" class=${inSpeedProtection ? 'PulseGreenFill' : 'Green'}>${additionalText}</tspan>`;

    if (text.length !== 0 && this.displayedVerticalModeText.get() !== text) {
      this.displayModeChangedPath();
    }
    this.displayedVerticalModeText.set(text);

    return text.length > 0;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();
    sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
        this.getText();
        this.isShown = false;
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.fmaTextRef);
      });
    sub
      .on('activeVerticalMode')
      .whenChanged()
      .handle((activeVerticalMode) => {
        this.activeVerticalModeSub.set(activeVerticalMode);
        this.getText();
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.fmaTextRef);
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
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.fmaTextRef);
      });

    sub
      .on('tcasModeDisarmed')
      .whenChanged()
      .handle((t) => {
        this.tcasModeDisarmed = t;
        this.getText();
      });

    this.props.fcdcData.autolandCapacity.sub(() => this.getText());
  }

  render(): VNode {
    return (
      <g id="B1">
        <path ref={this.modeChangedPathRef} class={this.boxClassSub} visibility="hidden" d={this.boxPathStringSub} />
        <path
          ref={this.speedProtectionPathRef}
          class="NormalStroke Green BlinkInfinite"
          d="m 433 9 h 135 v 30.2 h -135 z"
        />
        <path
          ref={this.inModeReversionPathRef}
          class="NormalStroke Green BlinkInfinite"
          d="m 433 9 h 135 v 30.2 h -135 z"
        />

        <text ref={this.fmaTextRef} style="white-space: pre" class={this.activeVerticalModeClassSub} x="501" y="36">
          {/* set directly via innerhtml as tspan was invisble for some reason when set here */}
        </text>
      </g>
    );
  }
}

class B2Cell extends DisplayComponent<CellProps> {
  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  private cellTextRef2 = FSComponent.createRef<SVGTextElement>();

  private decMode = 0;

  private text1Sub = Subject.create('');

  private text2Sub = Subject.create('');

  private classSub = Subject.create('');

  private modeArmed = FSComponent.createRef<SVGPathElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

    sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
        if (this.decMode !== 2) {
          this.text1Sub.get() === ''
            ? this.modeArmed.instance.setAttribute('visibility', 'hidden')
            : this.modeArmed.instance.setAttribute('visibility', 'visible');
          this.cellTextRef.instance.setAttribute('visibility', 'visible');
          this.cellTextRef2.instance.setAttribute('visibility', 'visible');
        } else {
          this.modeArmed.instance.setAttribute('visibility', 'hidden');
          this.cellTextRef.instance.setAttribute('visibility', 'hidden');
          this.cellTextRef2.instance.setAttribute('visibility', 'hidden');
        }
      });

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
        let color1 = 'Green';
        let vertModeActive = true;
        if (openClimbArmed) {
          text1 = '      OP CLB';
        } else if (clbArmed) {
          text1 = '      CLB';
        } else if (desArmed) {
          text1 = gsArmed ? 'DES ' : '      DES';
        } else if (altCstArmed) {
          text1 = gsArmed ? 'ALT ' : '      ALT';
          color1 = 'Green';
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

        if (gsArmed || openClimbArmed || altArmed || altCstArmed || clbArmed || desArmed) {
          if (this.decMode !== 2) {
            this.text1Sub.get() === ''
              ? this.modeArmed.instance.setAttribute('visibility', 'hidden')
              : this.modeArmed.instance.setAttribute('visibility', 'visible');
            this.cellTextRef.instance.setAttribute('visibility', 'visible');
            this.cellTextRef2.instance.setAttribute('visibility', 'visible');
          }
        } else {
          this.text1Sub.get() === ''
            ? this.modeArmed.instance.setAttribute('visibility', 'hidden')
            : this.modeArmed.instance.setAttribute('visibility', 'visible');
          this.cellTextRef.instance.setAttribute('visibility', 'hidden');
          this.cellTextRef2.instance.setAttribute('visibility', 'hidden');
        }
      });
  }

  render(): VNode {
    return (
      <g id="B2">
        <path
          ref={this.modeArmed}
          visibility="hidden"
          class="NormalStroke Green"
          d="m433 39.2 h 140"
          stroke-dasharray="10 8"
        />
        <text ref={this.cellTextRef} class={this.classSub} style="white-space: pre" x="463.5" y="72">
          {this.text1Sub}
        </text>
        <text
          ref={this.cellTextRef2}
          style="white-space: pre"
          class="FontMediumSmaller MiddleAlign Green"
          x="538.5"
          y="72"
        >
          {this.text2Sub}
        </text>
      </g>
    );
  }
}

class C1Cell extends ShowForSecondsComponent<CellProps & { fcdcData: FcdcValueProvider }> {
  private textSub = Subject.create('');
  private decMode = 0;
  private cellTextRef = FSComponent.createRef<SVGTextElement>();
  private activeLateralMode = 0;

  constructor(props: CellProps & { fcdcData: FcdcValueProvider }) {
    super(props, 10);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();
    sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
        const isShown = this.updateText();
        if (isShown) {
          this.displayModeChangedPath();
          this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
        } else {
          this.displayModeChangedPath(true);
          this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
        }
      });
    sub
      .on('activeLateralMode')
      .whenChanged()
      .handle((lm) => {
        this.activeLateralMode = lm;

        const isShown = this.updateText();

        if (isShown) {
          this.displayModeChangedPath();
          this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
        } else {
          this.displayModeChangedPath(true);
          this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
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
    } else if (
      this.activeLateralMode === LateralMode.LOC_TRACK ||
      (this.activeLateralMode === LateralMode.LAND && !this.props.fcdcData.autolandCapacity.get())
    ) {
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
      <g id="C1">
        <path
          ref={this.modeChangedPathRef}
          class="NormalStroke Green"
          visibility="hidden"
          d="m 582.5 9 v 30.2 h 135 v -30.2 z"
        />
        <text ref={this.cellTextRef} class="FontMedium MiddleAlign Green" x="650.5" y="36">
          {this.textSub}
        </text>
      </g>
    );
  }
}

class C2Cell extends DisplayComponent<CellProps> {
  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  private decMode = 0;

  private fmaLateralArmed: number = 0;

  private textSub = Subject.create('');

  private modeArmed = FSComponent.createRef<SVGPathElement>();

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
    if (navArmed || locArmed) {
      this.setDeclutterMode();
    } else {
      this.modeArmed.instance.setAttribute('visibility', 'hidden');
    }
  }

  private setDeclutterMode() {
    if (this.decMode !== 2) {
      this.cellTextRef.instance.setAttribute('visibility', 'visible');
      this.textSub.get() === ''
        ? this.modeArmed.instance.setAttribute('visibility', 'hidden')
        : this.modeArmed.instance.setAttribute('visibility', 'visible');
    } else {
      this.cellTextRef.instance.setAttribute('visibility', 'hidden');
      this.modeArmed.instance.setAttribute('visibility', 'hidden');
    }
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

    sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
        this.setDeclutterMode();
      });

    sub
      .on('fmaLateralArmed')
      .whenChanged()
      .handle((fla) => {
        this.fmaLateralArmed = fla;
        this.getText();
        this.setDeclutterMode();
      });
  }

  render(): VNode {
    return (
      <g id="C2">
        <path
          ref={this.modeArmed}
          visibility="hidden"
          class="NormalStroke Green"
          d="m583 39.2 h 138"
          stroke-dasharray="10 8"
        />
        <text
          ref={this.cellTextRef}
          style="white-space: pre"
          class="FontMediumSmaller MiddleAlign Green"
          x="650.5"
          y="68"
        >
          {this.textSub}
        </text>
      </g>
    );
  }
}

class BC1Cell extends ShowForSecondsComponent<CellProps & { fcdcData: FcdcValueProvider }> {
  private decMode = 0;
  private cellTextRef = FSComponent.createRef<SVGTextElement>();
  private lastVerticalMode = 0;

  private textSub = Subject.create('');

  constructor(props: CellProps & { fcdcData: FcdcValueProvider }) {
    super(props, 9);
  }

  private setText() {
    let text: string;
    this.isShown = true;
    if (this.lastVerticalMode === VerticalMode.ROLL_OUT) {
      text = 'ROLL OUT';
    } else if (this.lastVerticalMode === VerticalMode.FLARE) {
      text = 'FLARE';
    } else if (this.lastVerticalMode === VerticalMode.LAND && this.props.fcdcData.autolandCapacity.get()) {
      text = 'LAND';
    } else {
      text = '';
    }
    if (text !== '') {
      this.displayModeChangedPath();
      this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
    } else {
      this.isShown = false;
      this.displayModeChangedPath(true);
      this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
    }
    this.textSub.set(text);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();
    sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
        this.setText();
      });
    sub
      .on('activeVerticalMode')
      .whenChanged()
      .handle((v) => {
        this.lastVerticalMode = v;
        this.setText();
      });

    this.props.fcdcData.autolandCapacity.sub(() => this.setText(), true);
  }

  render(): VNode {
    return (
      <g id="BC1">
        <path
          ref={this.modeChangedPathRef}
          class="NormalStroke Green"
          visibility="hidden"
          d="m 506 9h 150 v 30.2 h -150 z"
        />
        <text ref={this.cellTextRef} class="FontMedium MiddleAlign Green" x="576" y="36">
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
    className = 'PulseGreen9Seconds Green';
  } else if (false) {
    text = 'FOR GA: SET TOGA';
    className = 'PulseGreen9Seconds Green';
  } else if (disconnectApForLdg) {
    text = 'DISCONNECT AP FOR LDG';
    className = 'FontSmall PulseGreen9Seconds Green';
  } else if (TCASArmed && !isAttExcessive) {
    text = 'TCAS           ';
    className = 'FontMediumSmaller Green';
  } else if (tcasRaInhibited && !isAttExcessive) {
    text = 'TCAS RA INHIBITED';
    className = 'FontMedium Green';
  } else if (trkFpaDeselectedTCAS && !isAttExcessive) {
    text = 'TRK FPA DESELECTED';
    className = 'FontMedium Green';
  } else if (thrustLocked) {
    text = 'MOVE THR LEVERS';
    className = 'BlinkInfinite Amber';
  } else if (tdReached) {
    text = 'T/D REACHED';
    className = 'FontMedium Green';
  } else if (false) {
    text = 'EXTEND SPD BRK';
    className = 'Green';
  } else if (false) {
    text = 'RETRACT SPD BRK';
    className = 'Green';
  } else if (false) {
    text = 'CHECK APPR SEL';
    className = 'Green';
  } else if (setHoldSpeed) {
    text = 'SET HOLD SPD';
    className = 'FontMedium Green';
  } else if (exitMissed) {
    text = 'EXIT MISSED';
    className = 'Green';
  } else if (unrestrictedClimbDescent === 1) {
    text = 'FCU ALT BELOW A/C';
    className = 'FontMediumSmaller  Green';
  } else if (unrestrictedClimbDescent === 2) {
    text = 'FCU ALT ABOVE A/C';
    className = 'DisappearAfter10Seconds FontMediumSmaller Green';
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
  private sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values>();

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
    return <text ref={this.bc3Cell} class={this.classNameSub} x="640" y="107.15" style="white-space: pre" />;
  }
}

class D1D2Cell extends ShowForSecondsComponent<CellProps & { readonly fcdcData: FcdcValueProvider }> {
  private delay: number = 0;
  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  private cellTextRef2 = FSComponent.createRef<SVGTextElement>();

  private prevDecMode = 0;

  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & DmcLogicEvents & HudElems>();

  private readonly lsButton = ConsumerSubject.create(
    this.sub.on(getDisplayIndex() == 1 ? 'ls1Button' : 'ls2Button'),
    false,
  );
  private readonly fmaLateralActive = ConsumerSubject.create(this.sub.on('activeLateralMode'), 0);
  private readonly fmaLateralArmed = ConsumerSubject.create(this.sub.on('fmaLateralArmed'), 0);

  private readonly fmaVerticalActive = ConsumerSubject.create(this.sub.on('activeVerticalMode'), 0);
  private readonly fmaVerticalArmed = ConsumerSubject.create(this.sub.on('fmaVerticalArmed'), 0);
  private readonly decMode = ConsumerSubject.create(this.sub.on('decMode'), 0);

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

  private static readonly FiveCharactersPerLineSingleLineModeChangePath = 'm 732  9.5 h 135 v 30.2 h -135 z';

  private static readonly FiveCharactersPerLineTwoLinesModeChangePath = 'm 732  9.5 h 135 v 67.5 h -135 z';

  private static readonly FourCharactersPerLineTwoLinesModeChangePath = 'm 732  9.5 h 135 v 67.5 h -135 z';

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
      modeChangedPath = D1D2Cell.FiveCharactersPerLineTwoLinesModeChangePath;
    } else if (this.props.fcdcData.land3FailOperationalCapacity.get()) {
      text1 = 'LAND3';
      text2 = 'DUAL';
      modeChangedPath = D1D2Cell.FiveCharactersPerLineSingleLineModeChangePath;
    } else if (false) {
      text1 = 'LAND1';
      text2 = '';
      modeChangedPath = D1D2Cell.FiveCharactersPerLineSingleLineModeChangePath;
    } else if (false) {
      text1 = 'F-APP';
    } else if (false) {
      text1 = 'F-APP';
      text2 = '+ RAW';
      modeChangedPath = D1D2Cell.FiveCharactersPerLineTwoLinesModeChangePath;
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
      this.text1Sub.set(text1);
      this.text2Sub.set(text2);

      this.modeChangedPathRef.instance.setAttribute('d', modeChangedPath!);
      if (this.decMode.get() === 2) {
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(false, this.decMode.get(), this.cellTextRef, this.cellTextRef2);
      } else {
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode.get(), this.cellTextRef, this.cellTextRef2);
      }
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
    }

    if (this.prevDecMode !== this.decMode.get()) {
      if (this.decMode.get() === 2) {
        this.cellTextRef.instance.style.visibility = 'hidden';
        this.cellTextRef2.instance.style.visibility = 'hidden';
      } else {
        this.cellTextRef.instance.style.visibility = 'visible';
        this.cellTextRef2.instance.style.visibility = 'visible';
      }
      this.prevDecMode = this.decMode.get();
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    MappedSubject.create(
      () => this.setText(),
      this.props.fcdcData.fcdcFgDiscreteWord4,
      this.landModesArmedOrActive,
      this.lsButton,
      this.decMode,
    );
  }

  render(): VNode {
    return (
      <g id="D1D2">
        <text ref={this.cellTextRef} class="FontMedium MiddleAlign Green" x="800" y="36">
          {this.text1Sub}
        </text>
        <text ref={this.cellTextRef2} class="FontMedium MiddleAlign Green" x="800" y="72">
          {this.text2Sub}
        </text>
        <path ref={this.modeChangedPathRef} class="NormalStroke Green" visibility="hidden" />
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
  private readonly sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values>();

  private readonly textRef = FSComponent.createRef<SVGTextElement>();

  /** bit 29 is NO DH selection */
  private readonly fmEisDiscrete2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fmEisDiscreteWord2Raw'));
  private timeout: number = 0;

  private decMode = 0;

  private classNameSub = Subject.create('');

  private readonly mda = Arinc429LocalVarConsumerSubject.create(this.sub.on('fmMdaRaw'));

  private readonly dh = Arinc429LocalVarConsumerSubject.create(this.sub.on('fmDhRaw'));

  private readonly flightPhase = ConsumerSubject.create(this.sub.on('fmgcFlightPhase'), 0);

  private readonly noDhSelected = this.fmEisDiscrete2.map((r) => r.bitValueOr(29, false));

  private readonly mdaDhMode = MappedSubject.create(
    ([noDh, dh, mda, flightPhase]) => {
      if (flightPhase == 7) {
        return MdaMode.None;
      }

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
    this.flightPhase,
  );

  private readonly mdaDhValueText = MappedSubject.create(
    ([mdaMode, dh, mda, flightPhase]) => {
      if (flightPhase == 7) {
        return '';
      }
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
    this.flightPhase,
  );
  private readonly DhModexPos = MappedSubject.create(([noDhSelected]) => (noDhSelected ? 800 : 735), this.noDhSelected);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

    sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
        this.handleDeclutterModeLocal(this.decMode, this.textRef);
      });
  }

  private handleDeclutterModeLocal(decMode, textRef) {
    if (decMode === 2) {
      textRef.instance.style.visibility = 'hidden';
    } else {
      textRef.instance.style.visibility = 'visible';
    }
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
          Green: true,
        }}
        x={this.DhModexPos}
        y="107"
      >
        <tspan>{this.mdaDhMode}</tspan>
        <tspan
          class={{ EndAlign: true, Green: true, HiddenElement: this.mdaDhValueText.map((v) => v.length <= 0) }}
          x="870"
          y="107"
        >
          {this.mdaDhValueText}
        </tspan>
      </text>
    );
  }
}

class E1Cell extends ShowForSecondsComponent<CellProps> {
  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  private decMode = 0;

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
    this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
    this.textSub.set(text);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

    sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
        this.isShown = false;
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
      });

    sub
      .on('ap1Active')
      .whenChanged()
      .handle((ap) => {
        this.ap1Active = ap;
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
        this.setText();
      });

    sub
      .on('ap2Active')
      .whenChanged()
      .handle((ap) => {
        this.ap2Active = ap;
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
        this.setText();
      });
  }

  render(): VNode {
    return (
      <g id="E1">
        <path
          ref={this.modeChangedPathRef}
          visibility="hidden"
          class="NormalStroke Green"
          d="m 881 9 v 30.2 h 135 v -30.2 z"
        />
        <text ref={this.cellTextRef} class="FontMedium MiddleAlign Green" x="949" y="36">
          {this.textSub}
        </text>
      </g>
    );
  }
}

class E2Cell extends ShowForSecondsComponent<CellProps> {
  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  private decMode = 0;

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

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

    sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
        if (this.decMode !== 2) {
          this.displayModeChangedPath();
          this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
        } else {
          this.isShown = false;
          this.displayModeChangedPath(true);
          this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
        }
      });

    sub
      .on('fd1Active')
      .whenChanged()
      .handle((fd) => {
        this.fd1Active = fd;
        if (fd || this.fd2Active) {
          this.displayModeChangedPath();
          this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
        } else {
          this.displayModeChangedPath(true);
          this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
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
          this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
        } else {
          this.displayModeChangedPath(true);
          this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
        }
        this.getText();
      });
  }

  render(): VNode {
    return (
      <g id="E2">
        <path
          ref={this.modeChangedPathRef}
          d="m 881 45 v 30.2 h 135 v -30.2 z"
          visibility="hidden"
          class="NormalStroke Green"
        />
        <text
          ref={this.cellTextRef}
          class="FontMedium MiddleAlign Green"
          x="949"
          style="word-spacing: -1.9844px"
          y="72"
        >
          {this.textSub}
        </text>
      </g>
    );
  }
}

class E3Cell extends ShowForSecondsComponent<CellProps> {
  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  private decMode = 0;
  private className = '';
  private classSub = Subject.create('');

  constructor(props: CellProps) {
    super(props, 9);
  }

  private getClass(athrStatus: number): string {
    let className: string = '';
    this.isShown = true;
    switch (athrStatus) {
      case 1:
        className = 'Green';
        break;
      case 2:
        className = 'Green';
        break;
      default:
        this.isShown = false;
        className = 'HiddenElement';
    }
    return className;
  }

  private setText() {
    this.classSub.set(`FontMedium MiddleAlign ${this.className}`);
    if (this.className !== 'HiddenElement') {
      this.displayModeChangedPath();
      this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
    } else {
      this.displayModeChangedPath(true);
      this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();

    sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
        this.isShown = false;
        this.setText();
      });

    sub
      .on('athrStatus')
      .whenChanged()
      .handle((a) => {
        this.className = this.getClass(a);
        this.setText();
      });
  }

  render(): VNode {
    return (
      <g id="E3">
        <path
          ref={this.modeChangedPathRef}
          class="NormalStroke Green"
          visibility="hidden"
          d="m 881 80 h 135 v 30.2 h -135 z"
        />
        <text ref={this.cellTextRef} class={this.classSub} x="949" y="107.15">
          A/THR
        </text>
      </g>
    );
  }
}
