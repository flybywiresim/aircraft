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
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import {
  Arinc429ConsumerSubject,
  Arinc429LocalVarConsumerSubject,
  Arinc429Word,
  ArincEventBus,
} from '@flybywiresim/fbw-sdk';
import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { getDisplayIndex } from './HUD';
import { HudElems } from './HUDUtils';
import { PrimFgBusBaseEvents } from '@shared/publishers/PrimFgPublisher';
import { FlashOneHertz } from '../MsfsAvionicsCommon/FlashingElementUtils';
import {
  A1A2Messages,
  A3Messages,
  B1Messages,
  BC3Messages,
  C1Messages,
  computeA1A2Message,
  computeA3Message,
  computeB1Message,
  computeBC3Message,
  computeC1Message,
  computeD1D2Message,
  D1D2Messages,
} from './FMADefinitions';
import { FcdcBusBaseEvents } from '@shared/publishers/FcdcPublisher';
import { FcuEfisCpBusEvents } from '../../../shared/src/publishers/EfisCpBusPublisher';

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
}> {
  private sub = this.props.bus.getSubscriber<
    HUDSimvars & Arinc429Values & HudElems & DmcLogicEvents & PrimFgBusBaseEvents & FcdcBusBaseEvents
  >();

  private FMA = '';

  private FMARef = FSComponent.createRef<SVGGElement>();

  private primFgDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_1'));

  private primFgDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_2'));

  private primFgDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_3'));

  private primFgDiscreteWord4 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_4'));

  private primFgDiscreteWord6 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_6'));

  private primFgAtsDiscreteWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_ats_discrete_word'));

  private primFgAtsFmaDiscreteWord = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('prim_fg_ats_fma_discrete_word'),
  );

  private readonly fcdcDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_discrete_word_1'));

  private readonly ap1Engaged = this.primFgDiscreteWord1.map((word) => word.bitValueOr(11, false));

  private readonly ap2Engaged = this.primFgDiscreteWord1.map((word) => word.bitValueOr(12, false));

  private readonly athrEngaged = this.primFgAtsDiscreteWord.map((word) => word.bitValueOr(11, false));

  private readonly athrActive = this.primFgAtsDiscreteWord.map((word) => word.bitValueOr(12, false));

  private machPresel = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_presel_mach'));

  private speedPresel = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_presel_speed'));

  private setHoldSpeed = ConsumerSubject.create(this.sub.on('setHoldSpeed'), false);

  private tdReached = ConsumerSubject.create(this.sub.on('tdReached'), false);

  private firstBorderRef = FSComponent.createRef<SVGPathElement>();

  private secondBorderRef = FSComponent.createRef<SVGPathElement>();

  private readonly radioHeight = ConsumerSubject.create(this.sub.on('chosenRa'), Arinc429Word.empty());

  private readonly altitude = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('altitudeAr'),
  );

  private readonly landingElevation = ConsumerSubject.create(this.sub.on('landingElevation'), Arinc429Word.empty());

  private readonly fwcFlightPhase = ConsumerSubject.create(this.sub.on('fwcFlightPhase'), 0);

  private readonly btvExitMissed = ConsumerSubject.create(this.sub.on('btvExitMissed'), false);

  private readonly autoBrakeActive = ConsumerSubject.create(this.sub.on('autoBrakeActive'), false);

  private readonly autoBrakeMode = ConsumerSubject.create(this.sub.on('autoBrakeMode'), 0);

  private readonly B1Message = this.primFgDiscreteWord3.map((primFgDiscreteWord3) =>
    computeB1Message(primFgDiscreteWord3),
  );

  private readonly disconnectApForLdg = MappedSubject.create(
    ([ap1, ap2, ra, altitude, landingElevation, B1Message]) => {
      return (
        (ap1 || ap2) &&
        (ra.isNormalOperation() ? ra.value <= 150 : altitude.valueOr(Infinity) - landingElevation.valueOr(0) <= 150) &&
        (B1Message === B1Messages.DES ||
          B1Message === B1Messages.OP_DES ||
          B1Message === B1Messages.FPA ||
          B1Message === B1Messages.VS ||
          B1Message === B1Messages.APP_DES)
      );
    },
    this.ap1Engaged,
    this.ap2Engaged,
    this.radioHeight,
    this.altitude,
    this.landingElevation,
    this.B1Message,
  );

  private readonly BC3Message = MappedSubject.create(
    ([
      isAttExcessive,
      primFgDiscreteWord2,
      setHoldSpeed,
      fcdcDiscreteWord1,
      fwcFlightPhase,
      primFgDiscreteWord6,
      tdReached,
      disconnectApForLdg,
      btvExitMissed,
    ]) => {
      return computeBC3Message(
        isAttExcessive,
        setHoldSpeed,
        fcdcDiscreteWord1,
        fwcFlightPhase,
        tdReached,
        disconnectApForLdg,
        btvExitMissed,
        primFgDiscreteWord2,
        primFgDiscreteWord6,
      );
    },
    this.props.isAttExcessive,
    this.primFgDiscreteWord2,
    this.setHoldSpeed,
    this.fcdcDiscreteWord1,
    this.fwcFlightPhase,
    this.primFgDiscreteWord6,
    this.tdReached,
    this.disconnectApForLdg,
    this.btvExitMissed,
  );

  private readonly A1A2Message = MappedSubject.create(
    ([athrEngaged, athrActive, primFgAtsFmaDiscreteWord, autoBrakeActive, autoBrakeMode]) => {
      return computeA1A2Message(athrEngaged, athrActive, primFgAtsFmaDiscreteWord, autoBrakeActive, autoBrakeMode);
    },
    this.athrEngaged,
    this.athrActive,
    this.primFgAtsFmaDiscreteWord,
    this.autoBrakeActive,
    this.autoBrakeMode,
  );

  private readonly A3Message = MappedSubject.create(
    ([primFgAtsFmaDiscreteWord, autoBrakeActive, autoBrakeMode]) => {
      return computeA3Message(primFgAtsFmaDiscreteWord, false, autoBrakeActive, autoBrakeMode);
    },
    this.primFgAtsFmaDiscreteWord,
    this.autoBrakeActive,
    this.autoBrakeMode,
  );

  private readonly sharedModeActive = MappedSubject.create(
    ([primFgDiscreteWord1, primFgDiscreteWord3, primFgDiscreteWord4]) => {
      const rollOutActive = primFgDiscreteWord4.bitValueOr(26, false);
      const flareActive = primFgDiscreteWord3.bitValueOr(24, false);
      const landActive = primFgDiscreteWord1.bitValueOr(23, false);

      return landActive || rollOutActive || flareActive;
    },
    this.primFgDiscreteWord1,
    this.primFgDiscreteWord3,
    this.primFgDiscreteWord4,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
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

        <Row1
          bus={this.props.bus}
          isAttExcessive={this.props.isAttExcessive}
          A1A2CellMessage={this.A1A2Message}
          B1CellMessage={this.B1Message}
        />
        <Row2 bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} A1A2CellMessage={this.A1A2Message} />
        <Row3
          bus={this.props.bus}
          isAttExcessive={this.props.isAttExcessive}
          BC3Message={this.BC3Message}
          A3Message={this.A3Message}
        />
      </g>
    );
  }
}

class Row1 extends DisplayComponent<{
  readonly bus: EventBus;
  readonly isAttExcessive: Subscribable<boolean>;
  readonly A1A2CellMessage: Subscribable<number>;
  readonly B1CellMessage: Subscribable<number>;
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
        <A1A2Cell bus={this.props.bus} A1A2CellMessage={this.props.A1A2CellMessage} />

        <g ref={this.cellsToHide}>
          <B1Cell ref={this.b1Cell} bus={this.props.bus} B1Message={this.props.B1CellMessage} />
          <C1Cell ref={this.c1Cell} bus={this.props.bus} />
          <D1D2Cell ref={this.D1D2Cell} bus={this.props.bus} />
          <BC1Cell ref={this.BC1Cell} bus={this.props.bus} />
        </g>
        <E1Cell bus={this.props.bus} />
      </g>
    );
  }
}

class Row2 extends DisplayComponent<{
  bus: EventBus;
  isAttExcessive: Subscribable<boolean>;
  A1A2CellMessage: Subscribable<number>;
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
        <A2Cell bus={this.props.bus} A1A2CellMessage={this.props.A1A2CellMessage} />
        <g ref={this.cellsToHide}>
          <B2Cell bus={this.props.bus} />
          <C2Cell bus={this.props.bus} />
        </g>
        <E2Cell bus={this.props.bus} />
      </g>
    );
  }
}

class A2Cell extends DisplayComponent<{ bus: EventBus; A1A2CellMessage: Subscribable<A1A2Messages> }> {
  private decMode = 0;

  private autoBrakeActive = false;

  private autoBrakeMode = 0;

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
        this.autoBrakeActive = am;
        if (am) {
          this.autoBrkRef.instance.style.visibility = 'hidden';
          this.modeArmed.instance.setAttribute('visibility', 'hidden');
        } else {
          this.autoBrkRef.instance.style.visibility = 'visible';
        }
      });

    this.props.A1A2CellMessage.sub((message) => {
      // ATHR mode overrides BRK LO and MED memo
      if (message > A1A2Messages.NONE && message <= A1A2Messages.MAN_THR) {
        this.autoBrkRef.instance.style.visibility = 'hidden';
      } else {
        if (this.decMode !== 2) {
          if (this.autoBrakeActive) {
            this.modeArmed.instance.setAttribute('visibility', 'hidden');
          } else {
            if (this.autoBrakeMode >= 1 && this.autoBrakeMode <= 5) {
              this.modeArmed.instance.setAttribute('visibility', 'visible');
            } else {
              this.modeArmed.instance.setAttribute('visibility', 'hidden');
            }
          }
          this.autoBrkRef.instance.style.visibility = 'visible';
        } else {
          this.modeArmed.instance.setAttribute('visibility', 'hidden');
          this.autoBrkRef.instance.style.visibility = 'hidden';
        }
      }
    }, true);
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
  readonly BC3Message: Subscribable<BC3Messages>;
  readonly A3Message: Subscribable<A3Messages>;
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
        <A3Cell bus={this.props.bus} A3Message={this.props.A3Message} />
        <g ref={this.cellsToHide}>
          <AB3Cell bus={this.props.bus} A3Message={this.props.A3Message} />
          <D3Cell bus={this.props.bus} />
        </g>
        <BC3Cell BC3Message={this.props.BC3Message} />
        <E3Cell bus={this.props.bus} />
      </g>
    );
  }
}

interface CellProps extends ComponentProps {
  bus: EventBus;
}

interface A1A2CellProps extends CellProps {
  A1A2CellMessage: Subscribable<A1A2Messages>;
}

class A1A2Cell extends ShowForSecondsComponent<A1A2CellProps> {
  private decMode = 0;
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars>();

  private cellRef = FSComponent.createRef<SVGGElement>();

  private flexTemp = ConsumerSubject.create(this.sub.on('flexTemp'), 0);

  private readonly autoBrakeMode = ConsumerSubject.create(this.sub.on('autoBrakeMode'), 0);

  private prevAutoBrkMode = 0;

  private readonly isAutoBrkChange = MappedSubject.create(([autoBrakeMode]) => {
    const res = autoBrakeMode === this.prevAutoBrkMode ? true : false;
    this.prevAutoBrkMode = autoBrakeMode;
    return res;
  }, this.autoBrakeMode);

  constructor(props: A1A2CellProps) {
    super(props, 10);
  }

  private setText() {
    let text: string = '';
    this.isShown = true;

    switch (this.props.A1A2CellMessage.get()) {
      case A1A2Messages.MAN_TOGA:
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        text = `
                                <path class="NormalStroke Green" d="m 296 9 v 67.5 h 90 v -67.5 z" />
                                <text class="FontMedium MiddleAlign Green" x="341" y="35.6">MAN</text>
                                <text class="FontMedium MiddleAlign Green" x="341" y="71.75">TOGA</text>
                            `;
        break;
      case A1A2Messages.MAN_GA_SOFT:
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        text = `<g>
                                <path class="NormalStroke Green" d="m 296 9 v 67.5 h 90 v -67.5 z" />
                                <text class="FontMedium MiddleAlign Green" x="341" y="35.6">MAN</text>
                                <text class="FontMedium MiddleAlign Green" x="341" y="71.75">GA SOFT</text>
                            </g>`;
        break;
      case A1A2Messages.MAN_FLEX: {
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        const FlexTemp = Math.round(this.flexTemp.get());
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
      case A1A2Messages.MAN_MCT:
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        text = `<g>
                                <path class="NormalStroke Green" d="m 296 9 v 67.5 h 90 v -67.5 z" />
                                <text class="FontMedium MiddleAlign Green" x="341" y="35.6">MAN</text>
                                <text class="FontMedium MiddleAlign Green" x="341" y="71.75">MCT</text>
                            </g>`;
        break;
      case A1A2Messages.MAN_THR:
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        text = `<g>
                                <path class="NormalStroke Green" d="m 296 9 v 67.5 h 90 v -67.5 zz" />
                                <text class="FontMedium MiddleAlign Green" x="341" y="35.6">MAN</text>
                                <text class="FontMedium MiddleAlign Green" x="341" y="71.75">THR</text>
                            </g>`;
        break;
      case A1A2Messages.SPEED:
        text = '<text  class="FontMedium MiddleAlign Green" x="341" y="35.6">SPEED</text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case A1A2Messages.MACH:
        text = '<text  class="FontMedium MiddleAlign Green" x="341" y="35.6">MACH</text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case A1A2Messages.THR_MCT:
        text = '<text  class="FontMedium MiddleAlign Green" x="341" y="35.6">THR MCT</text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case A1A2Messages.THR_CLB:
        text = '<text  class="FontMedium MiddleAlign Green" x="341" y="35.6">THR CLB</text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case A1A2Messages.THR_LVR:
        text = '<text  class="FontMedium MiddleAlign Green" x="341" y="35.6">THR LVR</text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case A1A2Messages.THR_IDLE:
        text = '<text  class="FontMediumSmaller MiddleAlign Green" x="341" y="35.6">THR IDLE</text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case A1A2Messages.A_FLOOR:
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        text = `<g>
                                <path class="NormalStroke Green BlinkInfinite" d="m263 9 h 156 v 30.2 h-156 z" />
                                <text class="FontMedium MiddleAlign Green" x="341" y="35.6">A.FLOOR</text>
                            </g>`;
        break;
      case A1A2Messages.TOGA_LK:
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
        text = `<g>
                                <path class="NormalStroke Green BlinkInfinite" d="m263 9 h 156 v 30.2 h-156 z" />
                                <text class="FontMedium MiddleAlign Green" x="341" y="35.6">TOGA LK</text>
                            </g>`;
        break;

      case A1A2Messages.BTV:
        text = '<text class="FontMedium MiddleAlign Green" x="341" y="35.6">BTV</text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case A1A2Messages.BRK_LO:
        text = '<text class="FontMedium MiddleAlign Green" x="341" y="35.6">BRK LO</text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case A1A2Messages.BRK_2:
        text = '<text class="FontMedium MiddleAlign Green" x="341" y="35.6">BRK 2 </text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case A1A2Messages.BRK_3:
        text = '<text class="FontMedium MiddleAlign Green" x="341" y="35.6">BRK 3 </text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case A1A2Messages.BRK_HI:
        text = '<text class="FontMedium MiddleAlign Green" x="341" y="35.6">BRK HI </text>';
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
        break;
      case A1A2Messages.BRK_RTO:
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

    this.props.A1A2CellMessage.sub(() => {
      this.setText();
    }, true);

    this.flexTemp.sub(() => {
      this.setText();
    }, true);
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
  A3Message: Subscribable<A3Messages>;
}

class A3Cell extends DisplayComponent<A3CellProps> {
  private decMode = 0;

  private classSub = Subject.create('');

  private textSub = Subject.create('');

  private modeArmed = FSComponent.createRef<SVGPathElement>();

  private onUpdateAthrModeMessage(message: A3Messages) {
    let text: string = '';
    let className: string = '';
    switch (message) {
      case A3Messages.THR_LK:
        text = 'THR LK';
        className = 'Green ';
        break;
      case A3Messages.LVR_TOGA:
        className = 'Green ';
        break;
      case A3Messages.LVR_CLB:
        text = 'LVR CLB';
        className = 'Green ';
        break;
      case A3Messages.LVR_MCT:
        text = 'LVR MCT';
        className = 'Green ';
        break;
      case A3Messages.LVR_ASYM:
        text = 'LVR ASYM';
        className = 'Green';
        break;
      case A3Messages.BRK_RTO:
        text = 'BRK RTO';
        className = 'Green ';
        break;
      default:
        text = '';
    }

    this.textSub.set(text);
    this.classSub.set(`FontMedium MiddleAlign ${className}`);
  }

  private readonly shouldFlash = this.props.A3Message.map(
    (A3Message) => A3Message !== A3Messages.BRK_RTO && A3Message !== A3Messages.LVR_ASYM,
  );
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & HudElems>();
    sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
      });

    this.props.A3Message.sub((a3) => {
      this.onUpdateAthrModeMessage(a3);
    }, true);
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
        <FlashOneHertz bus={this.props.bus} flashDuration={Infinity} flashing={this.shouldFlash}>
          <text class={this.classSub} x="341" y="108">
            {this.textSub}
          </text>
        </FlashOneHertz>
      </g>
    );
  }
}

interface AB3CellProps extends CellProps {
  A3Message: Subscribable<A3Messages>;
}

class AB3Cell extends DisplayComponent<AB3CellProps> {
  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents>();

  private machPresel = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_presel_mach'));

  private speedPresel = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_presel_speed'));

  private readonly textSub = MappedSubject.create(
    ([machPresel, speedPresel, A3Message]) => {
      if (A3Message !== A3Messages.NONE) {
        return '';
      } else if (speedPresel.isNormalOperation() && !machPresel.isNormalOperation()) {
        return `SPEED SEL ${speedPresel.value}`;
      } else if (!speedPresel.isNormalOperation() && machPresel.isNormalOperation()) {
        return `MACH SEL ${machPresel.value.toFixed(2)}`;
      } else {
        return '';
      }
    },
    this.machPresel,
    this.speedPresel,
    this.props.A3Message,
  );

  render(): VNode {
    return (
      <text class="FontMedium MiddleAlign Green" x="35.434673" y="21.656223">
        {this.textSub}
      </text>
    );
  }
}

interface B1CellProps extends CellProps {
  B1Message: Subscribable<B1Messages>;
}

class B1Cell extends ShowForSecondsComponent<B1CellProps> {
  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents>();

  private primFgDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_3'));

  private primFgDiscreteWord5 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_5'));

  private primFgDiscreteWord6 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_6'));

  private primFgSelectedVs = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_selected_vertical_speed'));

  private primFgSelectedFpa = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_selected_flight_path_angle'));

  private readonly fmaTextRef = FSComponent.createRef<SVGTextElement>();

  private readonly tcasLargeBoxDemand = this.primFgDiscreteWord6.map((word) => word.bitValueOr(11, false));

  private readonly targetNotHeld = this.primFgDiscreteWord5.map((word) => word.bitValueOr(29, false));

  private decMode = 0;

  private readonly displayedVerticalModeText = Subject.create('');

  private readonly text = MappedSubject.create(
    ([B1Message, primFgSelectedFpa]) => {
      this.isShown = true;

      switch (B1Message) {
        case B1Messages.NONE:
          this.isShown = false;
          return '';

        case B1Messages.GS:
          return 'G/S';
        case B1Messages.F_GS:
          return 'F-G/S';
        case B1Messages.GS_STAR:
          return 'G/S*';
        case B1Messages.F_GS_STAR:
          return 'F-G/S*';
        case B1Messages.SRS:
          return 'SRS';
        case B1Messages.TCAS:
          return 'TCAS';
        case B1Messages.APP_DES:
          return 'APP-DES';
        case B1Messages.DES:
          return 'DES';
        case B1Messages.OP_DES:
          return 'OP DES';
        case B1Messages.CLB:
          return 'CLB';
        case B1Messages.OP_CLB:
          return 'OP CLB';
        case B1Messages.ALT:
          return 'ALT';
        case B1Messages.ALT_STAR:
          return 'ALT*';
        case B1Messages.ALT_CST:
          return 'ALT CST';
        case B1Messages.ALT_CST_STAR:
          return 'ALT CST*';
        case B1Messages.ALT_CRZ:
          return 'ALT CRZ';
        case B1Messages.ALT_CRZ_STAR:
          return 'ALT CRZ*';
        case B1Messages.FPA: {
          let text = 'FPA';
          const fpaValue = primFgSelectedFpa.value;

          // if FPA is 0 give it an empty space for where the '+' and '-' will be.
          if (!(primFgSelectedFpa.isNoComputedData() || primFgSelectedFpa.isFailureWarning()) && fpaValue === 0) {
            text += ' ';
          }
          return text;
        }
        case B1Messages.VS:
          return 'V/S';
        default:
          this.isShown = false;
          return '';
      }
    },
    this.props.B1Message,
    this.primFgSelectedFpa,
  );

  private readonly additionalText = MappedSubject.create(
    ([B1Message, primFgSelectedVs, primFgSelectedFpa]) => {
      if (B1Message === B1Messages.FPA) {
        if (!(primFgSelectedFpa.isNoComputedData() || primFgSelectedFpa.isFailureWarning())) {
          const fpaValue = primFgSelectedFpa.value;
          return `${fpaValue > 0 ? '+' : ''}${(Math.round(fpaValue * 10) / 10).toFixed(1)}°`;
        } else {
          return '-----';
        }
      } else if (B1Message === B1Messages.VS) {
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
    this.props.B1Message,
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
    inSpeedProtection ? 'NormalStroke None' : 'NormalStroke Green',
  );

  private readonly boxPathStringSub = MappedSubject.create(
    ([tcasLargeBoxDemand, primFgDiscreteWord3]) => {
      return tcasLargeBoxDemand && primFgDiscreteWord3.bitValueOr(25, false)
        ? 'm 433 9 h 135 v 67.5 h -135 z'
        : 'm 433 9 h 135 v 30.2 h -135 z';
    },
    this.tcasLargeBoxDemand,
    this.primFgDiscreteWord3,
  );

  private readonly activeVerticalModeClassSub = this.primFgDiscreteWord3.map((word) => {
    // VS FPA has a smaller font than the other active modes
    const fpaMode = word.bitValueOr(18, false);
    const vsMode = word.bitValueOr(17, false);

    // ALT CRZ* also has a smaller font, as it otherwise would be too large for the box.
    const altCstrApplicable = word.bitValueOr(28, false);
    const altIsCrzAlt = word.bitValueOr(29, false);
    const altAcqMode = word.bitValueOr(19, false);

    return vsMode || fpaMode || (altAcqMode && !altCstrApplicable && altIsCrzAlt)
      ? 'FontMediumSmaller MiddleAlign Green'
      : 'FontMedium MiddleAlign Green';
  });

  constructor(props: B1CellProps) {
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
        this.isShown = false;
        this.handleDeclutterMode(false, this.decMode, this.fmaTextRef);
      });

    this.text.sub(() => {
      this.displayModeChangedPath();
      this.handleDeclutterMode(false, this.decMode, this.fmaTextRef);
    });
  }

  render(): VNode {
    return (
      <g id="B1">
        <path ref={this.modeChangedPathRef} class={this.boxClassSub} visibility="hidden" d={this.boxPathStringSub} />

        <FlashOneHertz bus={this.props.bus} flashDuration={Infinity} visible={this.inSpeedProtection}>
          <path class="NormalStroke Green " d="m 433 9 h 135 v 30.2 h -135 z" />
        </FlashOneHertz>

        <text ref={this.fmaTextRef} style="white-space: pre" class={this.activeVerticalModeClassSub} x="501" y="36">
          <tspan>{this.text}</tspan>
          <FlashOneHertz
            bus={this.props.bus}
            flashDuration={Infinity}
            flashing={this.inSpeedProtection}
            className1={'Green'}
            className2={'DimmedGreen Fill'}
          >
            <tspan xml:space="preserve">{this.additionalText}</tspan>
          </FlashOneHertz>
        </text>
      </g>
    );
  }
}

class B2Cell extends DisplayComponent<CellProps> {
  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  private cellTextRef2 = FSComponent.createRef<SVGTextElement>();

  private modeArmedRef = FSComponent.createRef<SVGPathElement>();

  private decMode = 0;

  private sub = this.props.bus.getSubscriber<HUDSimvars & HudElems & PrimFgBusBaseEvents>();

  private primFgDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_2'));
  private readonly altArmed = this.primFgDiscreteWord2.map((word) => word.bitValueOr(11, false));
  private readonly gsArmed = this.primFgDiscreteWord2.map((word) => word.bitValueOr(13, false));
  private readonly appDesArmed = this.primFgDiscreteWord2.map((word) => word.bitValueOr(14, false));
  private readonly clbArmed = this.primFgDiscreteWord2.map((word) => word.bitValueOr(15, false));
  private readonly desArmed = this.primFgDiscreteWord2.map((word) => word.bitValueOr(16, false));
  private readonly opClbArmed = this.primFgDiscreteWord2.map((word) => word.bitValueOr(17, false));
  private primFgDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_3'));
  private readonly declutterMode = ConsumerSubject.create(this.sub.on('decMode'), 0);
  private classSub = MappedSubject.create(
    ([primFgDiscreteWord2, primFgDiscreteWord3]) => {
      const altAcqArmed = primFgDiscreteWord2.bitValueOr(11, false);

      const altCstrApplicable = primFgDiscreteWord3.bitValueOr(28, false);

      return altAcqArmed && altCstrApplicable
        ? 'FontMediumSmaller MiddleAlign Green'
        : 'FontMediumSmaller MiddleAlign Green';
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
      } else if (altAcqArmed && altIsCrzAlt) {
        return '     ALT CRZ';
      } else if (altAcqArmed) {
        return gsArmed ? 'ALT ' : '      ALT';
      } else if (gsArmed) {
        return '      G/S';
      } else {
        return '';
      }
    },
    this.primFgDiscreteWord2,
    this.primFgDiscreteWord3,
  );

  private readonly modeArmed = MappedSubject.create(
    ([altArmed, gsArmed, appDesArmed, clbArmed, desArmed, opClbArmed, declutterMode]) => {
      if (declutterMode != 2) {
        return altArmed || gsArmed || appDesArmed || clbArmed || desArmed || opClbArmed ? 'visible' : 'hidden';
      } else {
        return 'hidden';
      }
    },
    this.altArmed,
    this.gsArmed,
    this.appDesArmed,
    this.clbArmed,
    this.desArmed,
    this.opClbArmed,
    this.declutterMode,
  );

  private text2Sub = MappedSubject.create(
    ([primFgDiscreteWord2, text1Sub]) => {
      const gsArmed = primFgDiscreteWord2.bitValueOr(13, false);

      //TODO Improve this logic, very ugly
      if (gsArmed && text1Sub !== '      G/S') {
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

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
        if (this.decMode !== 2) {
          // this.text1Sub.get() === ''
          //   ? this.modeArmedRef.instance.setAttribute('visibility', 'hidden')
          //   : this.modeArmedRef.instance.setAttribute('visibility', 'visible');
          this.cellTextRef.instance.setAttribute('visibility', 'visible');
          this.cellTextRef2.instance.setAttribute('visibility', 'visible');
        } else {
          //this.modeArmedRef.instance.setAttribute('visibility', 'hidden');
          this.cellTextRef.instance.setAttribute('visibility', 'hidden');
          this.cellTextRef2.instance.setAttribute('visibility', 'hidden');
        }
      });
  }

  render(): VNode {
    return (
      <g id="B2">
        <path
          ref={this.modeArmedRef}
          visibility={this.modeArmed}
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

class C1Cell extends ShowForSecondsComponent<CellProps> {
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & HudElems & PrimFgBusBaseEvents>();
  private decMode = 0;
  private cellTextRef = FSComponent.createRef<SVGTextElement>();
  private activeLateralMode = 0;

  private primFgDiscreteWord4 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_4'));
  private primFgDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_2'));

  private readonly message = this.primFgDiscreteWord4.map((primFgDiscreteWord4) =>
    computeC1Message(primFgDiscreteWord4),
  );

  private readonly text = this.message.map((C1Message) => {
    this.isShown = true;
    switch (C1Message) {
      case C1Messages.GA_TRK:
        return 'GA TRK';
      case C1Messages.LOC_BC_STAR:
        return 'LOC B/C*';
      case C1Messages.LOC_STAR:
        return 'LOC *';
      case C1Messages.F_LOC_STAR:
        return 'F-LOC *';
      case C1Messages.HDG:
        return 'HDG';
      case C1Messages.RWY:
        return 'RWY';
      case C1Messages.RWY_TRK:
        return 'RWY TRK';
      case C1Messages.TRACK:
        return 'TRACK';
      case C1Messages.LOC_BC:
        return 'LOC B/C';
      case C1Messages.LOC:
        return 'LOC';
      case C1Messages.F_LOC:
        return 'F-LOC';
      case C1Messages.NAV:
        return 'NAV';
      default:
        this.isShown = false;
        return '';
    }
  });

  constructor(props: CellProps) {
    super(props, 10);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
        this.isShown = false;
        this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
      });

    this.text.sub(() => {
      this.displayModeChangedPath();
      this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
    });
  }

  render(): VNode {
    return (
      <g id="C1">
        <path
          ref={this.modeChangedPathRef}
          class="NormalStroke Green"
          visibility="hidden"
          d="m 582.5 9 v 30.2 h 135 v -30.2 z"
        />
        <text ref={this.cellTextRef} class="FontMedium MiddleAlign Green" x="650.5" y="36">
          {this.text}
        </text>
      </g>
    );
  }
}

class C2Cell extends DisplayComponent<CellProps> {
  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  private decMode = 0;

  private sub = this.props.bus.getSubscriber<HudElems & HUDSimvars & PrimFgBusBaseEvents>();

  private primFgDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_2'));

  private readonly navArmed = this.primFgDiscreteWord2.map((word) => word.bitValueOr(22, false));
  private readonly locArmed = this.primFgDiscreteWord2.map((word) => word.bitValueOr(23, false));
  private readonly rwyArmed = this.primFgDiscreteWord2.map((word) => word.bitValueOr(24, false));
  private readonly land = this.primFgDiscreteWord2.map((word) => word.bitValueOr(28, false));
  private primFgDiscreteWord4 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_4'));

  private readonly declutterMode = ConsumerSubject.create(this.sub.on('decMode'), 0);

  private readonly modeArmedVis = MappedSubject.create(
    ([navArmed, locArmed, rwyArmed, declutterMode]) => {
      if (declutterMode != 2) {
        if (navArmed || locArmed || rwyArmed) {
          return 'block';
        } else {
          return 'none';
        }
      } else {
        return 'none';
      }
    },
    this.navArmed,
    this.locArmed,
    this.rwyArmed,
    this.declutterMode,
  );

  private readonly text = MappedSubject.create(
    ([primFgDiscreteWord2, primFgDiscreteWord4]) => {
      const navArmed = primFgDiscreteWord2.bitValueOr(22, false);
      const locArmed = primFgDiscreteWord2.bitValueOr(23, false);
      const rwyArmed = primFgDiscreteWord2.bitValueOr(24, false);
      const land = primFgDiscreteWord2.bitValueOr(28, false);
      const backbeamMode = primFgDiscreteWord4.bitValueOr(29, false);

      if (!navArmed && !locArmed && !rwyArmed && !land) {
        return '';
      }

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

  private setDeclutterMode() {
    if (this.decMode !== 2) {
      this.cellTextRef.instance.setAttribute('visibility', 'visible');
    } else {
      this.cellTextRef.instance.setAttribute('visibility', 'hidden');
    }
  }
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub
      .on('decMode')
      .whenChanged()
      .handle((mode) => {
        this.decMode = mode;
        this.setDeclutterMode();
      });
  }

  render(): VNode {
    return (
      <g id="C2">
        <path display={this.modeArmedVis} class="NormalStroke Green" d="m583 39.2 h 138" stroke-dasharray="10 8" />
        <text
          ref={this.cellTextRef}
          style="white-space: pre"
          class="FontMediumSmaller MiddleAlign Green"
          x="650.5"
          y="68"
        >
          {this.text}
        </text>
      </g>
    );
  }
}

class BC1Cell extends ShowForSecondsComponent<CellProps> {
  private cellTextRef = FSComponent.createRef<SVGTextElement>();
  private lastVerticalMode = 0;

  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents & HudElems>();

  private primFgDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_1'));

  private primFgDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_3'));

  private primFgDiscreteWord4 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_4'));

  private decMode = ConsumerSubject.create(this.sub.on('decMode'), 0);

  private readonly text = MappedSubject.create(
    ([primFgDiscreteWord1, primFgDiscreteWord3, primFgDiscreteWord4, decMode]) => {
      const rollOutActive = primFgDiscreteWord4.bitValueOr(26, false);
      const flareActive = primFgDiscreteWord3.bitValueOr(24, false);
      const landActive = primFgDiscreteWord1.bitValueOr(23, false) && !flareActive && !rollOutActive;

      this.isShown = true;
      if (rollOutActive) {
        this.handleDeclutterMode(true, decMode, this.cellTextRef);
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
    this.decMode,
  );

  constructor(props: CellProps) {
    super(props, 10);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.text.sub(() => {
      this.displayModeChangedPath();
      this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
    });
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
          {this.text}
        </text>
      </g>
    );
  }
}

class BC3Cell extends DisplayComponent<{
  readonly BC3Message: Subscribable<BC3Messages>;
}> {
  private bc3Cell = FSComponent.createRef<SVGTextElement>();

  private classNameSub = Subject.create('');

  private getBC3MessageText(BC3Message: BC3Messages) {
    let text: string;
    let className: string;

    switch (BC3Message) {
      case BC3Messages.USE_MAN_PITCH_TRIM:
        text = 'USE MAN PITCH TRIM';
        className = 'PulseAmber9Seconds Amber';
        break;
      case BC3Messages.FOR_GA_SET_TOGA:
        text = 'FOR GA: SET TOGA';
        className = 'PulseAmber9Seconds Amber';
        break;
      case BC3Messages.DISCONNECT_AP_FOR_LDG:
        text = 'DISCONNECT AP FOR LDG';
        className = 'FontSmall PulseAmber9Seconds Amber';
        break;
      case BC3Messages.TCAS_ARMED:
        text = 'TCAS           ';
        className = 'FontMediumSmaller Green';
        break;
      case BC3Messages.TCAS_RA_INHIBITED:
        text = 'TCAS RA INHIBITED';
        className = 'FontMediumSmaller Green';
        break;
      case BC3Messages.TRK_FPA_DESELECTED:
        text = 'TRK FPA DESELECTED';
        className = 'FontMediumSmaller Green';
        break;
      case BC3Messages.MOVE_THR_LEVERS:
        text = 'MOVE THR LEVERS';
        className = 'BlinkInfinite Amber';
        break;
      case BC3Messages.TD_REACHED:
        text = 'T/D REACHED';
        className = 'FontMediumSmaller Green';
        break;
      case BC3Messages.EXTEND_SPD_BRK:
        text = 'EXTEND SPD BRK';
        className = 'FontMediumSmaller Green';
        break;
      case BC3Messages.RETRACT_SPD_BRK:
        text = 'RETRACT SPD BRK';
        className = 'FontMediumSmaller Green';
        break;
      case BC3Messages.CHECK_APPR_SEL:
        text = 'CHECK APPR SEL';
        className = 'FontMediumSmaller Green';
        break;
      case BC3Messages.SET_HOLD_SPD:
        text = 'SET HOLD SPD';
        className = 'FontMediumSmaller Green';
        break;
      case BC3Messages.EXIT_MISSED:
        text = 'EXIT MISSED';
        className = 'FontMediumSmaller Green';
        break;
      case BC3Messages.FCU_ALT_BELOW_AC:
        text = 'FCU ALT BELOW A/C';
        className = 'FontMediumSmaller  Green';
        break;
      case BC3Messages.FCU_ALT_ABOVE_AC:
        text = 'FCU ALT ABOVE A/C';
        className = 'FontMediumSmaller Green';
        break;
      default:
        return [null, null];
    }

    return [text, className];
  }
  private fillBC3Cell() {
    const [text, className] = this.getBC3MessageText(this.props.BC3Message.get());
    this.classNameSub.set(`FontMedium MiddleAlign ${className}`);
    if (text !== null) {
      this.bc3Cell.instance.innerHTML = text;
    } else {
      this.bc3Cell.instance.innerHTML = '';
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.BC3Message.sub(() => {
      this.fillBC3Cell();
    }, true);
  }

  render(): VNode {
    return <text ref={this.bc3Cell} class={this.classNameSub} x="640" y="107.15" style="white-space: pre" />;
  }
}

class D1D2Cell extends ShowForSecondsComponent<CellProps> {
  private static readonly FiveCharactersPerLineSingleLineModeChangePath = 'm 732  9.5 h 135 v 30.2 h -135 z';
  private static readonly SixCharactersPerLineTwoLinesModeChangePath = 'm 732  9.5 h 135 v 67.5 h -135 z';
  private static readonly FourCharactersPerLineTwoLinesModeChangePath = 'm 732  9.5 h 135 v 67.5 h -135 z';
  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  private cellTextRef2 = FSComponent.createRef<SVGTextElement>();
  private prevDecMode = -1;

  private sub = this.props.bus.getSubscriber<
    PrimFgBusBaseEvents & FcdcBusBaseEvents & FcuEfisCpBusEvents & HUDSimvars & HudElems
  >();

  private readonly primFgDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_1'));

  private readonly primFgDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_2'));

  private readonly fcdcFgDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fcdc_fg_discrete_word_1'));

  private readonly fcuEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(null);

  private readonly lsButton = this.fcuEisDiscreteWord2.map((word) => word.bitValueOr(14, true));

  private readonly hasLoc = ConsumerSubject.create(this.sub.on('hasLoc'), false);

  private readonly hasGs = ConsumerSubject.create(this.sub.on('hasGlideslope'), false);

  private readonly decMode = ConsumerSubject.create(this.sub.on('decMode'), 0);

  private readonly appr1Condition = MappedSubject.create(
    ([lsButton, hasLoc, hasGs]) => lsButton && hasGs && hasLoc,
    this.lsButton,
    this.hasLoc,
    this.hasGs,
  );

  private readonly D1D2Message = MappedSubject.create(
    ([primFgDiscreteWord1, primFgDiscreteWord2, fcdcFgDiscreteWord1, appr1Condition]) => {
      return computeD1D2Message(primFgDiscreteWord1, primFgDiscreteWord2, fcdcFgDiscreteWord1, appr1Condition);
    },
    this.primFgDiscreteWord1,
    this.primFgDiscreteWord2,
    this.fcdcFgDiscreteWord1,
    this.appr1Condition,
  );

  private readonly text1Sub = this.D1D2Message.map((message) => {
    this.isShown = true;

    if (message == D1D2Messages.LAND_2) {
      return 'LAND2';
    } else if (message == D1D2Messages.LAND_3_DUAL || message == D1D2Messages.LAND_3_SINGLE) {
      return 'LAND3';
    } else if (message == D1D2Messages.APPR_1) {
      return 'APPR1';
    } else if (message == D1D2Messages.F_APP || message == D1D2Messages.F_APP_RAW) {
      return 'F-APP';
    } else if (message == D1D2Messages.RAW_ONLY) {
      return 'RAW';
    } else if (message == D1D2Messages.LAND_1) {
      return 'LAND1';
    } else {
      this.isShown = false;

      return '';
    }
  });

  private readonly text2Sub = this.D1D2Message.map((message) => {
    this.isShown = true;

    if (
      message == D1D2Messages.LAND_1 ||
      message == D1D2Messages.APPR_1 ||
      message == D1D2Messages.LAND_2 ||
      message == D1D2Messages.F_APP
    ) {
      return '';
    } else if (message == D1D2Messages.LAND_3_SINGLE) {
      return 'SINGLE';
    } else if (message == D1D2Messages.LAND_3_DUAL) {
      return 'DUAL';
    } else if (message == D1D2Messages.F_APP_RAW) {
      return '+RAW';
    } else if (message == D1D2Messages.RAW_ONLY) {
      return 'ONLY';
    } else {
      return '';
    }
  });

  private readonly modeChangePath = this.D1D2Message.map((message) => {
    if (
      message == D1D2Messages.LAND_1 ||
      message == D1D2Messages.APPR_1 ||
      message == D1D2Messages.LAND_2 ||
      message == D1D2Messages.F_APP
    ) {
      return D1D2Cell.FiveCharactersPerLineSingleLineModeChangePath;
    } else if (
      message == D1D2Messages.LAND_3_DUAL ||
      message == D1D2Messages.LAND_3_SINGLE ||
      message == D1D2Messages.F_APP_RAW
    ) {
      return D1D2Cell.SixCharactersPerLineTwoLinesModeChangePath;
    } else if (message == D1D2Messages.RAW_ONLY) {
      return D1D2Cell.FourCharactersPerLineTwoLinesModeChangePath;
    } else {
      return '';
    }
  });

  constructor(props: CellProps) {
    super(props, 9);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isFo = getDisplayIndex() === 2;

    this.fcuEisDiscreteWord2.setConsumer(
      this.sub.on(isFo ? 'fcu_efis_r_discrete_word_2' : 'fcu_efis_l_discrete_word_2'),
    );

    this.D1D2Message.sub(() => {
      this.displayModeChangedPath();
      this.handleDeclutterMode(false, this.decMode.get(), this.cellTextRef, this.cellTextRef2);

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
    });
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
        <path ref={this.modeChangedPathRef} d={this.modeChangePath} class="NormalStroke Green" visibility="hidden" />
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
  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents & HudElems>();

  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  private primFgDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_1'));

  private decMode = ConsumerSubject.create(this.sub.on('decMode'), 0);

  private ap1Engaged = this.primFgDiscreteWord1.map((word) => word.bitValueOr(11, false));

  private ap2Engaged = this.primFgDiscreteWord1.map((word) => word.bitValueOr(12, false));

  private textSub = MappedSubject.create(
    ([ap1Engaged, ap2Engaged]) => {
      this.isShown = true;
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
      this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
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

  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents & HudElems>();

  private primFgDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_1'));

  private decMode = ConsumerSubject.create(this.sub.on('decMode'), 0);

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
      if (this.decMode.get() !== 2) {
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
      } else {
        this.isShown = false;
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
      }
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

  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents & HudElems>();

  private primFgAtsDiscreteWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_ats_discrete_word'));

  private athrEngaged = this.primFgAtsDiscreteWord.map((word) => word.bitValueOr(11, false));

  private athrActive = this.primFgAtsDiscreteWord.map((word) => word.bitValueOr(12, false));

  private decMode = ConsumerSubject.create(this.sub.on('decMode'), 0);

  private classSub = MappedSubject.create(
    ([athrEngaged, athrActive]) => {
      this.isShown = true;
      if (athrEngaged && athrActive) {
        this.isShown = false;
        return 'FontMedium MiddleAlign Green';
      } else if (athrEngaged) {
        return 'FontMedium MiddleAlign Green';
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
      if (this.classSub.get() !== 'HiddenElement') {
        this.displayModeChangedPath();
        this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
      } else {
        this.displayModeChangedPath(true);
        this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
      }
      this.displayModeChangedPath();
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
