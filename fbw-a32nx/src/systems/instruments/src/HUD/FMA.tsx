// @ts-strict-ignore
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
  VNode,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429RegisterSubject, Arinc429Register } from '@flybywiresim/fbw-sdk';

import { FgBus } from 'instruments/src/PFD/shared/FgBusProvider';
import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';
import { Arinc429Values } from './shared/ArincValueProvider';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { FlashOneHertz } from 'instruments/src/MsfsAvionicsCommon/FlashingElementUtils';
import { ExtendedClockEvents } from 'instruments/src/MsfsAvionicsCommon/providers/ExtendedClockProvider';

import { HudElems } from './HUDUtils';

/* eslint-disable no-constant-condition,no-dupe-else-if -- for keeping the FMA code while it's not active yet */

abstract class ShowForSecondsComponent<T extends ComponentProps> extends DisplayComponent<T> {
  private timeout: number = 0;

  private displayTimeInSeconds: number;

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

  public handleDeclutterMode = (cancel = false, decMode, textRef) => {
    if (decMode === 2) {
      if (cancel || !this.isShown) {
        clearTimeout(this.timeout);
        textRef.instance.style.visibility = 'hidden';
      } else {
        clearTimeout(this.timeout);
        textRef.instance.style.visibility = 'visible';
        this.timeout = setTimeout(() => {
          textRef.instance.style.visibility = 'hidden';
        }, this.displayTimeInSeconds * 1000) as unknown as number;
      }
      this.modeChangedPathRef.instance.classList.remove('ModeChangedPath');
    } else {
      textRef.instance.style.visibility = 'visible';
    }
  };
}

export class FMA extends DisplayComponent<{ bus: ArincEventBus; isAttExcessive: Subscribable<boolean> }> {
  private FMA = '';

  private FMARef = FSComponent.createRef<SVGGElement>();

  private bitMask = 0;
  private athMode = 0;
  private onToPower = false;
  private onGround = true;
  private crosswindMode = false;
  private flightPhase = -1;
  private fmgcFlightPhase = -1;
  private declutterMode = 0;

  private activeLateralMode: number = 0;

  private activeVerticalMode: number = 0;

  private armedVerticalModeSub = Subject.create(0);

  private athrModeMessage = 0;

  private tcasRaInhibited = Subject.create(false);

  private trkFpaDeselected = Subject.create(false);

  private fmgcDiscreteWord1 = new Arinc429Word(0);

  private fmgcDiscreteWord2 = new Arinc429Word(0);

  private fmgcDiscreteWord4 = new Arinc429Word(0);

  private fmgcDiscreteWord7 = Arinc429RegisterSubject.createEmpty();

  private machPreselVal = Arinc429RegisterSubject.createEmpty();

  private speedPreselVal = Arinc429RegisterSubject.createEmpty();

  private setHoldSpeed = Subject.create(false);

  private tdReached = Subject.create(false);

  private checkSpeedMode = Subject.create(false);

  private fcdcDiscreteWord1 = Arinc429RegisterSubject.createEmpty();

  private fwcFlightPhase = Subject.create(0);

  private firstBorderSub = Subject.create('');

  private secondBorderSub = Subject.create('');

  private fcuAtsFmaDiscreteWord = Arinc429RegisterSubject.createEmpty();

  private ecu1MaintenanceWord6 = Arinc429RegisterSubject.createEmpty();

  private ecu2MaintenanceWord6 = Arinc429RegisterSubject.createEmpty();

  private autobrakeMode = Subject.create(0);

  private preselActive = MappedSubject.create(
    ([machPresel, spdPresel]) => machPresel.isNormalOperation() || spdPresel.isNormalOperation(),
    this.machPreselVal,
    this.speedPreselVal,
  );

  private BC3Message = MappedSubject.create(
    ([isAttExcessive, fmgcDiscreteWord7, setHoldSpeed, fcdcDiscreteWord1, fwcFlightPhase, tdReached, checkSpeedMode]) =>
      getBC3Message(
        isAttExcessive,
        fmgcDiscreteWord7,
        setHoldSpeed,
        fcdcDiscreteWord1,
        fwcFlightPhase,
        tdReached,
        checkSpeedMode,
      ),
    this.props.isAttExcessive,
    this.fmgcDiscreteWord7,
    this.setHoldSpeed,
    this.fcdcDiscreteWord1,
    this.fwcFlightPhase,
    this.tdReached,
    this.checkSpeedMode,
  );

  private BC3MessageActive = MappedSubject.create(([BC3Message]) => BC3Message[0] !== null, this.BC3Message);

  private A3Message = MappedSubject.create(
    ([fcuAtsFmaDiscreteWord, ecu1MaintenanceWord6, ecu2MaintenanceWord6, autobrakeMode, AB3Message]) =>
      getA3Message(fcuAtsFmaDiscreteWord, ecu1MaintenanceWord6, ecu2MaintenanceWord6, autobrakeMode, AB3Message),
    this.fcuAtsFmaDiscreteWord,
    this.ecu1MaintenanceWord6,
    this.ecu2MaintenanceWord6,
    this.autobrakeMode,
    this.preselActive,
  );

  private A3MessageActive = MappedSubject.create(([A3Message]) => A3Message[0] !== null, this.A3Message);

  private AB3MessageInhibit = MappedSubject.create(
    ([BC3Message, A3Message]) => BC3Message || A3Message,
    this.BC3MessageActive,
    this.A3MessageActive,
  );

  private AB3Message = MappedSubject.create(
    ([machPreselVal, speedPreselVal, inhibit]) => getAB3Message(machPreselVal, speedPreselVal, inhibit),
    this.machPreselVal,
    this.speedPreselVal,
    this.AB3MessageInhibit,
  );

  private handleFMABorders() {
    const rollOutActive = this.fmgcDiscreteWord2.bitValueOr(26, false);
    const flareActive = this.fmgcDiscreteWord2.bitValueOr(25, false);
    const landActive = this.fmgcDiscreteWord4.bitValueOr(14, false) && !flareActive && !rollOutActive;

    const navActive = this.fmgcDiscreteWord2.bitValueOr(12, false);
    const finalActive = this.fmgcDiscreteWord1.bitValueOr(23, false);

    const sharedModeActive = rollOutActive || flareActive || landActive || (navActive && finalActive);

    const BC3MessageActive = this.BC3Message.get()[0] !== null;
    const AB3MessageActive = this.AB3Message.get()[0] !== null;

    let secondBorder: string;
    if (sharedModeActive && !this.props.isAttExcessive.get()) {
      secondBorder = '';
    } else if (BC3MessageActive) {
      secondBorder = 'm66.241 0.33732v15.766';
    } else {
      secondBorder = 'm66.241 0.33732v20.864';
    }

    let firstBorder: string;
    if (AB3MessageActive && !this.props.isAttExcessive.get()) {
      firstBorder = 'm33.117 0.33732v15.766';
    } else {
      firstBorder = 'm33.117 0.33732v20.864';
    }

    this.firstBorderSub.set(firstBorder);
    this.secondBorderSub.set(secondBorder);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & FgBus & FcuBus & HudElems>();

    this.props.isAttExcessive.sub((_a) => {
      this.handleFMABorders();
    });

    this.BC3Message.sub(() => this.handleFMABorders());

    sub.on('FMA').handle((v) => {
      this.FMA = v;
      this.FMARef.instance.style.display = `${this.FMA}`;
    });

    sub
      .on('leftMainGearCompressed')
      .whenChanged()
      .handle((value) => {
        this.onGround = value;
      });
    sub
      .on('decMode')
      .whenChanged()
      .handle((value) => {
        this.declutterMode = value;
      });
    sub
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
      });

    sub
      .on('fmgcDiscreteWord1')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord1 = word;
        this.handleFMABorders();
      });

    sub
      .on('fmgcDiscreteWord2')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord2 = word;
        this.handleFMABorders();
      });

    sub
      .on('fmgcDiscreteWord4')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord4 = word;
        this.handleFMABorders();
      });

    sub.on('fmgcDiscreteWord7').handle((word) => {
      this.fmgcDiscreteWord7.setWord(word.rawWord);
    });

    sub.on('preselSpeed').handle((word) => {
      this.speedPreselVal.setWord(word.rawWord);
    });

    sub.on('preselMach').handle((word) => {
      this.machPreselVal.setWord(word.rawWord);
    });

    sub.on('setHoldSpeed').handle(this.setHoldSpeed.set.bind(this.setHoldSpeed));

    sub.on('fcdcDiscreteWord1').handle((word) => {
      this.fcdcDiscreteWord1.setWord(word.rawWord);
    });

    sub.on('fwcFlightPhase').handle(this.fwcFlightPhase.set.bind(this.fwcFlightPhase));

    sub.on('tdReached').handle(this.tdReached.set.bind(this.tdReached));

    sub.on('checkSpeedMode').handle(this.checkSpeedMode.set.bind(this.checkSpeedMode));

    sub.on('autoBrakeMode').handle(this.autobrakeMode.set.bind(this.autobrakeMode));

    sub.on('fcuAtsFmaDiscreteWord').handle((word) => {
      this.fcuAtsFmaDiscreteWord.setWord(word.rawWord);
    });

    sub.on('ecu1MaintenanceWord6').handle((word) => {
      this.ecu1MaintenanceWord6.setWord(word.rawWord);
    });

    sub.on('ecu2MaintenanceWord6').handle((word) => {
      this.ecu2MaintenanceWord6.setWord(word.rawWord);
    });
  }

  render(): VNode {
    return (
      <g ref={this.FMARef} id="FMA" transform="translate(200 0)">
        <Row1 bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />
        <Row2 bus={this.props.bus} isAttExcessive={this.props.isAttExcessive} />
        <Row3
          bus={this.props.bus}
          isAttExcessive={this.props.isAttExcessive}
          AB3Message={this.AB3Message}
          BC3Message={this.BC3Message}
          A3Message={this.A3Message}
        />
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
      <g id="Row1">
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
      <g id="Row2">
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
  private sub = this.props.bus.getSubscriber<HUDSimvars & FcuBus & HudElems>();

  private text = Subject.create('');

  private className = Subject.create('FontMediumSmaller Smaller MiddleAlign Green');

  private autoBrkRef = FSComponent.createRef<SVGTextElement>();

  private fcuAtsFmaDiscreteWord = new Arinc429Word(0);

  private fcuAtsDiscreteWord = new Arinc429Word(0);

  private readonly autoBrakeActive = ConsumerSubject.create(this.sub.on('autoBrakeActive').whenChanged(), false);
  private readonly AThrMode = ConsumerSubject.create(this.sub.on('AThrMode').whenChanged(), 0);

  private readonly autobrakeMode = ConsumerSubject.create(this.sub.on('autoBrakeMode').whenChanged(), 0);
  private readonly decMode = ConsumerSubject.create(this.sub.on('decMode').whenChanged(), 0);

  private readonly isVisible = MappedSubject.create(
    ([AThrMode, decMode, autobrakeMode, autoBrakeActive]) => {
      // ATHR mode overrides BRK LO and MED memo
      if (
        (AThrMode > 0 && AThrMode <= 6) ||
        decMode === 2 ||
        (autobrakeMode !== 1 && autobrakeMode !== 2) ||
        autoBrakeActive === true
      ) {
        return 'none';
      } else {
        return 'block';
      }
    },
    this.AThrMode,
    this.decMode,
    this.autobrakeMode,
    this.autoBrakeActive,
  );

  private readonly autobrakeModeTxt = MappedSubject.create(
    ([autobrakeMode, decMode]) => {
      switch (autobrakeMode) {
        case 0:
          this.text.set('');
          return '';
        case 1:
          decMode === 2 ? this.text.set('') : this.text.set('BRK LO ');
          return 'BRK LO ';
        case 2:
          decMode === 2 ? this.text.set('') : this.text.set('BRK MED ');
          return 'BRK MED ';
        case 3:
          // MAX will be shown in 3rd row
          this.text.set('');
          return '';
        default:
          this.text.set('');
          return '';
      }
    },
    this.autobrakeMode,
    this.decMode,
  );
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  render(): VNode {
    return (
      <g id="A2Cell">
        <path id="dash" display={this.isVisible} class="NormalStroke Green" d="m16 40h140" stroke-dasharray="5 9" />
        <text ref={this.autoBrkRef} class={this.className} x="83.9" y="68.75" style="white-space: pre">
          {this.text}
        </text>
      </g>
    );
  }
}

class Row3 extends DisplayComponent<{
  bus: ArincEventBus;
  isAttExcessive: Subscribable<boolean>;
  AB3Message: Subscribable<string[]>;
  BC3Message: Subscribable<string[]>;
  A3Message: Subscribable<string[]>;
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
      <g id="Row3">
        <A3Cell bus={this.props.bus} A3Message={this.props.A3Message} />
        <g ref={this.cellsToHide}>
          <AB3Cell AB3Message={this.props.AB3Message} />
          <D3Cell bus={this.props.bus} />
        </g>
        <BC3Cell bus={this.props.bus} BC3Message={this.props.BC3Message} />
        <E3Cell bus={this.props.bus} />
      </g>
    );
  }
}

function getA1A2CellText(
  fcuAtsDiscreteWord: Arinc429Word,
  fcuAtsFmaDiscreteWord: Arinc429Word,
  flexTemp: number,
  autoBrakeMode: number,
  autoBrakeActive: boolean,
): [boolean, boolean, string, boolean] {
  const atEngaged = fcuAtsDiscreteWord.bitValueOr(13, false);
  const atActive = fcuAtsDiscreteWord.bitValueOr(14, false);

  let text = '';
  let isShown = true;
  let isTwoLine = false;
  let amberFlashingBox = false;

  if (fcuAtsFmaDiscreteWord.bitValueOr(11, false)) {
    isShown = false;
    isTwoLine = true;
    text = `
                                <path class="NormalStroke Green" d="m125.57 9.072v67.53h-84.76v-67.53z" />
                                <text class="FontMediumSmaller MiddleAlign White" x="85" y="32.64">MAN</text>
                                <text class="FontMediumSmaller MiddleAlign White" x="84.34" y="68.75">TOGA</text>
                            `;
  } else if (false) {
    isShown = false;
    isTwoLine = true;
    text = `<g>
                                <path class="NormalStroke Green" d="m157.605 9.072v67.53h-151.085v-67.53z" />
                                <text class="FontMediumSmaller MiddleAlign White" x="85" y="32.64">MAN</text>
                                <text class="FontMediumSmaller MiddleAlign White" x="84.34" y="68.75">GA SOFT</text>
                            </g>`;
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(13, false)) {
    isShown = false;
    isTwoLine = true;
    const FlexTemp = Math.round(flexTemp);
    const FlexText = FlexTemp >= 0 ? `+${FlexTemp}` : FlexTemp.toString();
    text = `<g>
                                <path class="NormalStroke Green" d="m152.605 9.072v67.53h-136.085v-67.53z" />
                                <text class="FontMediumSmaller MiddleAlign White" x="85" y="32.64">MAN</text>
                                <text class="FontMediumSmaller MiddleAlign White" x="48.35" y="68.75">FLX</text>
                                <text class="FontMediumSmaller MiddleAlign Cyan" x="120" y="68.75">
                               ${FlexText}
                                </text>
                            </g>`;
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(29, false)) {
    isShown = false;
    isTwoLine = true;
    text = `<g>
                                <path class="NormalStroke Green" d="m125.57 9.072v67.53h-84.76v-67.53z" />
                                <text class="FontMediumSmaller MiddleAlign White" x="85" y="32.64">MAN</text>
                                <text class="FontMediumSmaller MiddleAlign White" x="84.34" y="68.75">DTO</text>
                            </g>`;
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(12, false) && atEngaged && !atActive) {
    isShown = false;
    isTwoLine = true;
    text = `<g>
                                <path class="NormalStroke Green" d="m125.57 9.072v67.53h-84.76v-67.53z" />
                                <text class="FontMediumSmaller MiddleAlign White" x="85" y="32.64">MAN</text>
                                <text class="FontMediumSmaller MiddleAlign White" x="84.34" y="68.75">MCT</text>
                            </g>`;
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(15, false) && atEngaged && !atActive) {
    isShown = false;
    isTwoLine = true;
    text = `<g>
                                <path class="NormalStroke Amber" d="m125.57 9.072v67.53h-84.76v-67.53z" />
                                <text class="FontMediumSmaller MiddleAlign White" x="85" y="32.64">MAN</text>
                                <text class="FontMediumSmaller MiddleAlign White" x="84.34" y="68.75">THR</text>
                            </g>`;
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(17, false)) {
    isShown = false;
    amberFlashingBox = true;
    text = '<text class="FontMediumSmaller MiddleAlign Green" x="83.9" y="32.64">A.FLOOR</text>';
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(18, false)) {
    isShown = false;
    amberFlashingBox = true;
    text = '<text class="FontMediumSmaller MiddleAlign Green" x="83.9" y="32.64">TOGA LK</text>';
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(19, false)) {
    text = '<text class="FontMediumSmaller MiddleAlign Green" x="83.9" y="32.64">SPEED</text>';
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(20, false)) {
    text = '<text class="FontMediumSmaller MiddleAlign Green" x="83.9" y="32.64">MACH</text>';
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(12, false) && atEngaged && atActive) {
    text = '<text class="FontMediumSmaller MiddleAlign Green" x="83.9" y="32.64">THR MCT</text>';
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(14, false)) {
    text = '<text class="FontMediumSmaller MiddleAlign Green" x="83.9" y="32.64">THR CLB</text>';
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(15, false) && atEngaged && atActive) {
    text = '<text class="FontMediumSmaller MiddleAlign Green" x="83.9" y="32.64">THR LVR</text>';
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(16, false)) {
    text = '<text class="FontMediumSmaller MiddleAlign Green" x="83.9" y="32.64">THR IDLE</text>';
  } else if (autoBrakeActive) {
    switch (autoBrakeMode) {
      case 1:
        text = '<text class="FontMediumSmaller MiddleAlign Green" x="83.9" y="32.64">BRK LO</text>';
        break;
      case 2:
        text = '<text class="FontMediumSmaller MiddleAlign Green" x="83.9" y="32.64">BRK MED</text>';
        break;
      case 3:
        text = '<text class="FontMediumSmaller MiddleAlign Green" x="83.9" y="32.64">BRK MAX</text>';
        break;
      default:
        text = '';
        isShown = false;
    }
  } else {
    text = '';
    isShown = false;
  }

  return [isShown, isTwoLine, text, amberFlashingBox];
}

interface CellProps extends ComponentProps {
  bus: ArincEventBus;
}

class A1A2Cell extends ShowForSecondsComponent<CellProps> {
  private fcuAtsFmaDiscreteWord = new Arinc429Word(0);

  private fcuAtsDiscreteWord = new Arinc429Word(0);

  private cellRef = FSComponent.createRef<SVGGElement>();

  private readonly amberFlashingBox = Subject.create(false);

  private flexTemp = 0;

  private autoBrakeActive = false;

  private autoBrakeMode = 0;

  private decMode = 0;

  constructor(props) {
    super(props, 9);
  }

  private setText() {
    const [isShown, _isTwoLine, text, amberFlashingBox] = getA1A2CellText(
      this.fcuAtsDiscreteWord,
      this.fcuAtsFmaDiscreteWord,
      this.flexTemp,
      this.autoBrakeMode,
      this.autoBrakeActive,
    );
    this.isShown = isShown;

    const hasChanged = text.length > 0 && text !== this.cellRef.instance.innerHTML;
    if (hasChanged) {
      this.displayModeChangedPath();
      if (this.decMode === 2) {
        this.handleDeclutterMode(false, this.decMode, this.cellRef);
      }
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
      if (this.decMode === 2) {
        this.handleDeclutterMode(true, this.decMode, this.cellRef);
      }
    }

    this.cellRef.instance.innerHTML = text;

    this.amberFlashingBox.set(amberFlashingBox);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & FcuBus & HudElems>();

    sub
      .on('decMode')
      .whenChanged()
      .handle((f) => {
        this.decMode = f;
        if (f === 2) {
          this.handleDeclutterMode(false, this.decMode, this.cellRef);
        } else {
          this.cellRef.instance.style.visibility = 'visible';
        }
      });

    sub
      .on('flexTemp')
      .whenChanged()
      .handle((f) => {
        this.flexTemp = f;
        this.setText();
      });

    sub
      .on('fcuAtsDiscreteWord')
      .whenChanged()
      .handle((word) => {
        this.fcuAtsDiscreteWord = word;
        this.setText();
      });

    sub
      .on('fcuAtsFmaDiscreteWord')
      .whenChanged()
      .handle((word) => {
        this.fcuAtsFmaDiscreteWord = word;
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
      <g id="A1A2Cell">
        <path
          ref={this.modeChangedPathRef}
          visibility="hidden"
          class="NormalStroke Green"
          d="m16.5 9.072h135.635v30.238h-135.635z"
        />
        <g ref={this.cellRef} />
        <FlashOneHertz bus={this.props.bus} flashDuration={Infinity} visible={this.amberFlashingBox}>
          <path class="NormalStroke Amber" d="m3.528 9.072h154.635v30.238h-154.635z" />
        </FlashOneHertz>
      </g>
    );
  }
}

const getA3Message = (
  fcuAtsFmaDiscreteWord: Arinc429Register,
  ecu1MaintenanceWord6: Arinc429Register,
  ecu2MaintenanceWord6: Arinc429Register,
  autobrakeMode: number,
  AB3Message: boolean,
) => {
  const clbDemand = fcuAtsFmaDiscreteWord.bitValueOr(22, false);
  const mctDemand = fcuAtsFmaDiscreteWord.bitValueOr(23, false);
  const assymThrust = fcuAtsFmaDiscreteWord.bitValueOr(21, false);
  const thrLocked = ecu1MaintenanceWord6.bitValueOr(12, false) || ecu2MaintenanceWord6.bitValueOr(12, false);

  let text: string;
  let className: string;
  let flashingClassName = null;
  if (thrLocked) {
    text = 'THR LK';
    className = 'Amber';
    flashingClassName = '';
  } else if (false) {
    text = 'LVR TOGA';
    className = 'White';
    flashingClassName = '';
  } else if (clbDemand) {
    text = 'LVR CLB';
    className = 'White';
    flashingClassName = '';
  } else if (mctDemand) {
    text = 'LVR MCT';
    className = 'White';
    flashingClassName = '';
  } else if (assymThrust) {
    text = 'LVR ASYM';
    className = 'Amber';
  } else if (autobrakeMode === 3 && !AB3Message) {
    text = 'BRK MAX';
    className = 'FontMediumSmaller MiddleAlign Cyan';
  } else {
    return [null, null, null];
  }

  return [text, className, flashingClassName];
};

interface A3CellProps extends CellProps {
  A3Message: Subscribable<string[]>;
}

class A3Cell extends DisplayComponent<A3CellProps> {
  private isArmed = Subject.create('');

  private classSub = Subject.create('');

  private textSub = Subject.create('');

  private readonly shouldFlash = Subject.create(false);

  private updateMessage() {
    const className = this.props.A3Message.get()[1];
    const text = this.props.A3Message.get()[0];

    this.textSub.set(text);
    this.classSub.set(`FontMediumSmaller MiddleAlign ${className}`);
    this.shouldFlash.set(this.props.A3Message.get()[2] !== null);
    this.textSub.get() === null ? this.isArmed.set('none') : this.isArmed.set('block');
  }

  private autobrakeMode = 0;

  private athrMessage = 0;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.A3Message.sub(() => this.updateMessage());
  }

  render(): VNode {
    return (
      <g id="A3Cell">
        {/* <path id="dash" display={this.isArmed} class="NormalStroke Green" d="m 20 16.4 h 30" stroke-dasharray="5 9" /> */}
        <path id="dash" display={this.isArmed} class="NormalStroke Green" d="m 16 82 h 140" stroke-dasharray="5 9" />

        <FlashOneHertz bus={this.props.bus} flashDuration={Infinity} flashing={this.shouldFlash}>
          <text class={this.classSub} x="85" y="105.25">
            {this.textSub}
          </text>
        </FlashOneHertz>
      </g>
    );
  }
}

const getAB3Message = (machPresel: Arinc429Register, spdPresel: Arinc429Register, inhibit: boolean) => {
  /* use vertical bar instead of : for PRESEL text since : is not aligned to the bottom as the other fonts and the font file is used on ECAM, ND etc.
              vertical bar is mapped to ":" aligned to bottom in font file
               */
  if (!inhibit && spdPresel.isNormalOperation()) {
    return ['SPEED SEL|   ', Math.round(spdPresel.value).toString()];
  } else if (!inhibit && machPresel.isNormalOperation()) {
    return ['MACH SEL|   ', machPresel.value.toFixed(2)];
  } else {
    return [null, null];
  }
};

class AB3Cell extends DisplayComponent<{ AB3Message: Subscribable<string[]> }> {
  private isArmed = Subject.create('');

  private speedPreselVal = -1;

  private machPreselVal = -1;

  private athrModeMessage = 0;

  private autobrakeMode = 0;

  private textSub = Subject.create('');

  private text2Sub = Subject.create('');

  private textXPosSub = Subject.create(0);

  private getText() {
    this.textSub.set(this.props.AB3Message.get()[0]);
    this.text2Sub.set(this.props.AB3Message.get()[1]);

    if (this.textSub.get() === 'SPEED SEL|   ') {
      this.textXPosSub.set(35.434673);
    } else {
      this.textXPosSub.set(33.834673);
    }

    this.textSub.get() === null ? this.isArmed.set('none') : this.isArmed.set('block');
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.AB3Message.sub(() => this.getText());
  }

  render(): VNode {
    return (
      <g id="AB3Cell">
        <path id="dash" display={this.isArmed} class="NormalStroke Green" d="m100 82h150" stroke-dasharray="5 9" />
        <text class="FontMediumSmaller  MiddleAlign Green" style="white-space: pre" x={this.textXPosSub} y="18.65">
          {this.textSub}
        </text>
        <text class="FontMediumSmaller  MiddleAlign Green" x="264.65" y="105.25">
          {this.text2Sub}
        </text>
      </g>
    );
  }
}

class B1Cell extends ShowForSecondsComponent<CellProps> {
  private boxClassSub = Subject.create('');

  private boxPathStringSub = Subject.create('');

  private activeVerticalModeClassSub = Subject.create('');

  private readonly verticalText = Subject.create('');

  private readonly additionalText = Subject.create('');

  private readonly inSpeedProtection = Subject.create(false);

  private readonly inModeReversion = Subject.create(false);

  private fmaTextRef = FSComponent.createRef<SVGTextElement>();

  private selectedVS = new Arinc429Word(0);

  private selectedFPA = new Arinc429Word(0);

  private fmgcDiscreteWord1 = new Arinc429Word(0);

  private fmgcDiscreteWord2 = new Arinc429Word(0);

  private fmgcDiscreteWord3 = new Arinc429Word(0);

  private fmgcDiscreteWord4 = new Arinc429Word(0);

  private fmgcDiscreteWord7 = new Arinc429Word(0);

  private fmAltitudeConstraint = new Arinc429Word(0);

  private previousText = '';

  private decMode = 0;

  constructor(props: CellProps) {
    super(props, 10);
  }

  private getText(): boolean {
    const gsMode = this.fmgcDiscreteWord1.bitValueOr(22, false);
    const gsTrackMode = this.fmgcDiscreteWord1.bitValueOr(20, false);
    const gsCaptureMode = this.fmgcDiscreteWord1.bitValueOr(21, false);
    const expedMode = this.fmgcDiscreteWord1.bitValueOr(24, false);
    const descentMode = this.fmgcDiscreteWord1.bitValueOr(12, false);
    const climbMode = this.fmgcDiscreteWord1.bitValueOr(11, false);
    const pitchTakeoffMode = this.fmgcDiscreteWord1.bitValueOr(15, false);
    const pitchGoaroundMode = this.fmgcDiscreteWord1.bitValueOr(16, false);
    const openMode = this.fmgcDiscreteWord1.bitValueOr(14, false);
    const trackMode = this.fmgcDiscreteWord1.bitValueOr(20, false);
    const captureMode = this.fmgcDiscreteWord1.bitValueOr(21, false);
    const altMode = this.fmgcDiscreteWord1.bitValueOr(19, false);
    const dashMode = this.fmgcDiscreteWord1.bitValueOr(26, false);
    const altConstraintValid = this.fmAltitudeConstraint.isNormalOperation();
    const fpaMode = this.fmgcDiscreteWord1.bitValueOr(18, false);
    const vsMode = this.fmgcDiscreteWord1.bitValueOr(17, false);
    const finalDesMode = this.fmgcDiscreteWord1.bitValueOr(23, false);
    const tcasMode = this.fmgcDiscreteWord7.bitValueOr(13, false);

    const navMode = this.fmgcDiscreteWord2.bitValueOr(12, false);

    let text: string;
    let additionalText: string = '';

    this.isShown = true;
    if (gsMode && gsTrackMode) {
      text = 'G/S';
    } else if (false) {
      text = 'F-G/S';
    } else if (gsMode && gsCaptureMode) {
      text = 'G/S*';
    } else if (false) {
      text = 'F-G/S*';
    } else if (expedMode && descentMode) {
      text = 'EXP DES';
    } else if (expedMode && climbMode) {
      text = 'EXP CLB';
    } else if (pitchTakeoffMode || pitchGoaroundMode) {
      text = 'SRS';
    } else if (tcasMode) {
      text = 'TCAS';
    } else if (finalDesMode && !navMode) {
      text = 'FINAL';
    } else if (descentMode && !openMode) {
      text = 'DES';
    } else if (descentMode && openMode) {
      text = 'OP DES';
    } else if (climbMode && !openMode) {
      text = 'CLB';
    } else if (climbMode && openMode) {
      text = 'OP CLB';
    } else if (trackMode && altMode && !dashMode && !altConstraintValid) {
      text = 'ALT';
    } else if (captureMode && altMode && !dashMode && !altConstraintValid) {
      text = 'ALT*';
    } else if (captureMode && altMode && !dashMode && altConstraintValid) {
      text = 'ALT CST*';
    } else if (trackMode && altMode && !dashMode && altConstraintValid) {
      text = 'ALT CST';
    } else if (dashMode && (!altMode || !altConstraintValid)) {
      text = 'ALT CRZ';
    } else if (fpaMode) {
      text = 'FPA';

      if (!(this.selectedFPA.isNoComputedData() || this.selectedFPA.isFailureWarning())) {
        const fpaValue = this.selectedFPA.value;
        additionalText = `${fpaValue > 0 ? '+' : ''}${(Math.round(fpaValue * 10) / 10).toFixed(1)}°`;
        // if FPA is 0 give it an empty space for where the '+' and '-' will be.
        if (fpaValue === 0) {
          text += ' ';
        }
      } else {
        additionalText = '-----';
      }
    } else if (vsMode) {
      if (!(this.selectedVS.isNoComputedData() || this.selectedVS.isFailureWarning())) {
        const vsValue = this.selectedVS.value;
        additionalText = `${vsValue > 0 ? '+' : ''}${Math.round(vsValue).toString()}`.padStart(5, '\xa0');
      } else {
        additionalText = '-----';
      }

      text = 'V/S';
    } else {
      text = '';
      this.isShown = false;
    }

    const hasChanged = text.length > 0 && text !== this.previousText;
    this.previousText = text;

    if (hasChanged) {
      this.displayModeChangedPath();
      this.handleDeclutterMode(false, this.decMode, this.fmaTextRef);
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
      this.handleDeclutterMode(true, this.decMode, this.fmaTextRef);
      this.fmaTextRef.instance.style.visibility = 'hidden';
    }

    const targetNotHeld = this.fmgcDiscreteWord4.bitValueOr(29, false);

    const inSpeedProtection = targetNotHeld && text !== '';

    this.inSpeedProtection.set(inSpeedProtection);

    const longitudinalModeReversion = this.fmgcDiscreteWord3.bitValueOr(18, false);

    if (inSpeedProtection || longitudinalModeReversion) {
      this.boxClassSub.set('NormalStroke None');
    } else {
      this.boxClassSub.set('NormalStroke Green');
    }

    this.inModeReversion.set(longitudinalModeReversion);

    const bigBoxDisplayed = tcasMode && this.fmgcDiscreteWord7.bitValueOr(18, false);
    const boxPathString =
      tcasMode && bigBoxDisplayed ? 'm178.78 9.072h139.59v67.53h-139.59z' : 'm178.78 9.072h139.59v30.238h-139.59z';

    this.boxPathStringSub.set(boxPathString);

    // VS FPA & ALT CST* have a smaller font than the other active modes
    const smallFont = fpaMode || vsMode || (captureMode && altMode && !dashMode && altConstraintValid);

    this.activeVerticalModeClassSub.set(
      smallFont ? 'FontMediumSmaller MiddleAlign Green' : 'FontMediumSmaller MiddleAlign Green',
    );

    this.verticalText.set(text);
    this.additionalText.set(additionalText);

    return text.length > 0;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus & FcuBus & ExtendedClockEvents & HudElems>();

    sub
      .on('decMode')
      .whenChanged()
      .handle((v) => {
        this.decMode = v;
        if (this.decMode === 2) {
          this.displayModeChangedPath(true);
          this.handleDeclutterMode(false, this.decMode, this.fmaTextRef);
        } else {
          if (this.isShown === false) {
            this.displayModeChangedPath(true);
            this.handleDeclutterMode(true, this.decMode, this.fmaTextRef);
            this.fmaTextRef.instance.style.visibility = 'hidden';
          } else {
            this.displayModeChangedPath(true);
            this.handleDeclutterMode(false, this.decMode, this.fmaTextRef);
            this.fmaTextRef.instance.style.visibility = 'visible';
          }
        }
        this.getText();
      });
    sub
      .on('fmgcDiscreteWord1')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord1 = word;
        this.getText();
      });

    sub
      .on('fmgcDiscreteWord2')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord2 = word;
        this.getText();
      });

    sub
      .on('fmgcDiscreteWord3')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord3 = word;
        this.getText();
      });

    sub
      .on('fmgcDiscreteWord4')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord4 = word;
        this.getText();
      });

    sub
      .on('fmgcDiscreteWord7')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord7 = word;
        this.getText();
      });

    sub
      .on('fmgcFmAltitudeConstraint')
      .whenChanged()
      .handle((word) => {
        this.fmAltitudeConstraint = word;
        this.getText();
      });

    sub
      .on('fcuSelectedFpa')
      .whenChanged()
      .handle((fpa) => {
        this.selectedFPA = fpa;
        this.getText();
      });

    sub
      .on('fcuSelectedVerticalSpeed')
      .whenChanged()
      .handle((svs) => {
        this.selectedVS = svs;
        this.getText();
      });
  }

  render(): VNode {
    return (
      <g id="B1Cell">
        <path ref={this.modeChangedPathRef} class={this.boxClassSub} visibility="hidden" d={this.boxPathStringSub} />

        <FlashOneHertz bus={this.props.bus} flashDuration={Infinity} visible={this.inSpeedProtection}>
          <path class="NormalStroke Green" d="m178.78 9.072h139.59v30.238h-139.59z" />
        </FlashOneHertz>

        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.inModeReversion}>
          <path class="NormalStroke Green" d="m178.78 9.072h139.59v30.238h-139.59z" />
        </FlashOneHertz>

        <text
          ref={this.fmaTextRef}
          style="white-space: pre"
          class={this.activeVerticalModeClassSub}
          x="249.5"
          y="32.64"
        >
          <tspan>{this.verticalText}</tspan>
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

class B2Cell extends ShowForSecondsComponent<CellProps> {
  private fmaVerticalArmed = Subject.create('');

  private text1Sub = Subject.create('');

  private text2Sub = Subject.create('');

  private classSub = Subject.create('');

  private altConstraint = new Arinc429Word(0);

  private fmgcDiscreteWord3 = new Arinc429Word(0);

  private decMode = 0;

  private modeArmed = FSComponent.createRef<SVGPathElement>();

  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  private cellTextRef2 = FSComponent.createRef<SVGTextElement>();

  private handleMessage(): void {
    const altAcqArmed = this.fmgcDiscreteWord3.bitValueOr(12, false);
    const clbArmed = this.fmgcDiscreteWord3.bitValueOr(24, false);

    let text1: string;
    let color1 = 'Cyan';
    if (altAcqArmed && !clbArmed && this.altConstraint.isNormalOperation()) {
      text1 = 'ALT';
      color1 = 'Magenta';
    } else if (altAcqArmed && !clbArmed && !this.altConstraint.isNormalOperation()) {
      text1 = 'ALT';
    } else if (clbArmed) {
      text1 = '      CLB'; // spaces added to center armed FMA as per newer DMC stnadards
    } else if (this.fmgcDiscreteWord3.bitValueOr(25, false)) {
      text1 = 'DES';
    } else {
      text1 = '';
    }

    let text2;
    if (false) {
      text2 = 'F-G/S';
    } else if (this.fmgcDiscreteWord3.bitValueOr(22, false)) {
      text2 = 'G/S';
    } else if (this.fmgcDiscreteWord3.bitValueOr(23, false)) {
      text2 = 'FINAL';
    } else {
      text2 = '';
    }

    this.text1Sub.set(text1);
    this.text2Sub.set(text2);
    this.classSub.set(`FontMediumSmaller MiddleAlign ${color1}`);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus & HUDSimvars & HudElems>();

    sub
      .on('decMode')
      .whenChanged()
      .handle((v) => {
        this.handleMessage();
        this.decMode = v;
        if (this.decMode !== 2) {
          console.log('dec : ' + this.text1Sub.get());
          this.text2Sub.get() === ''
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
      .on('fmgcDiscreteWord3')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord3 = word;
        this.handleMessage();
      });

    sub
      .on('fmgcFmAltitudeConstraint')
      .whenChanged()
      .handle((word) => {
        this.altConstraint = word;
        this.handleMessage();
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
        const finalArmed = (fmv >> 5) & 1;

        if (altArmed || altCstArmed || clbArmed || desArmed || gsArmed || finalArmed) {
          if (this.decMode !== 2) {
            this.text2Sub.get() === ''
              ? this.modeArmed.instance.setAttribute('visibility', 'hidden')
              : this.modeArmed.instance.setAttribute('visibility', 'visible');
            this.cellTextRef.instance.setAttribute('visibility', 'visible');
            this.cellTextRef2.instance.setAttribute('visibility', 'visible');
          }
        } else {
          this.text2Sub.get() === ''
            ? this.modeArmed.instance.setAttribute('visibility', 'hidden')
            : this.modeArmed.instance.setAttribute('visibility', 'visible');
          this.cellTextRef.instance.setAttribute('visibility', 'hidden');
          this.cellTextRef2.instance.setAttribute('visibility', 'hidden');
        }
      });
  }

  render(): VNode {
    return (
      <g id="B2Cell">
        <path
          id="dash"
          ref={this.modeArmed}
          visibility="hidden"
          class="NormalStroke Green"
          d="m178.5 40h150"
          stroke-dasharray="5 10"
        />
        <text class={this.classSub} ref={this.cellTextRef} style="white-space: pre" x="203.8" y="65">
          {this.text1Sub}
        </text>
        <text ref={this.cellTextRef2} class="FontMediumSmaller Smaller MiddleAlign Green" x="281" y="65">
          {this.text2Sub}
        </text>
      </g>
    );
  }
}

class C1Cell extends ShowForSecondsComponent<CellProps> {
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars>();

  private fmgcDiscreteWord1 = new Arinc429Word(0);

  private fmgcDiscreteWord2 = new Arinc429Word(0);

  private fmgcDiscreteWord3 = new Arinc429Word(0);

  private textSub = Subject.create('');

  private decMode = 0;
  private hasChanged = false;
  private cellTextRef = FSComponent.createRef<SVGTextElement>();
  constructor(props: CellProps) {
    super(props, 10);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus & HudElems>();
    sub
      .on('decMode')
      .whenChanged()
      .handle((v) => {
        this.decMode = v;
        if (this.decMode === 2) {
          this.displayModeChangedPath(true);
          this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
        } else {
          if (this.isShown === false) {
            this.displayModeChangedPath(true);
            this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
            this.cellTextRef.instance.style.visibility = 'hidden';
          } else {
            this.displayModeChangedPath(true);
            this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
            this.cellTextRef.instance.style.visibility = 'visible';
          }
        }
      });
    sub
      .on('fmgcDiscreteWord1')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord1 = word;

        this.updateText();
      });

    sub
      .on('fmgcDiscreteWord2')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord2 = word;

        this.updateText();
      });

    sub
      .on('fmgcDiscreteWord3')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord3 = word;

        this.updateText();
      });
  }

  private updateText(): boolean {
    const rollGaActive = this.fmgcDiscreteWord2.bitValueOr(15, false);
    const backbeamMode = this.fmgcDiscreteWord3.bitValueOr(19, false);
    const locCaptActive = this.fmgcDiscreteWord2.bitValueOr(13, false);
    const locTrackActive = this.fmgcDiscreteWord2.bitValueOr(14, false);
    const headingActive = this.fmgcDiscreteWord2.bitValueOr(16, false);
    const runwayActive = this.fmgcDiscreteWord2.bitValueOr(11, false);
    const runwayLocSubmodeActive = this.fmgcDiscreteWord2.bitValueOr(20, false);
    const runwayTrackSubmodeActive = this.fmgcDiscreteWord2.bitValueOr(23, false);
    const trackActive = this.fmgcDiscreteWord2.bitValueOr(17, false);
    const navActive = this.fmgcDiscreteWord2.bitValueOr(12, false);
    const finalDesArmed = this.fmgcDiscreteWord3.bitValueOr(23, false);
    const finalDesActive = this.fmgcDiscreteWord1.bitValueOr(23, false);

    let text: string;
    this.isShown = true;
    if (rollGaActive) {
      text = 'GA TRK';
    } else if (locCaptActive && backbeamMode) {
      text = 'LOC B/C*';
    } else if (locCaptActive && !backbeamMode) {
      text = 'LOC *';
    } else if (false) {
      text = 'F-LOC *';
    } else if (headingActive) {
      text = 'HDG';
    } else if (runwayActive && runwayLocSubmodeActive) {
      text = 'RWY';
    } else if (runwayActive && runwayTrackSubmodeActive) {
      text = 'RWY TRK';
    } else if (trackActive) {
      text = 'TRACK';
    } else if (locTrackActive && backbeamMode) {
      text = 'LOC B/C';
    } else if (locTrackActive && !backbeamMode) {
      text = 'LOC';
    } else if (false) {
      text = 'F-LOC';
    } else if (navActive && !finalDesActive && finalDesArmed) {
      text = 'APP NAV';
    } else if (navActive && !finalDesActive && !finalDesArmed) {
      text = 'NAV';
    } else {
      text = '';
      this.isShown = false;
    }

    this.hasChanged = text.length > 0 && text !== this.textSub.get();

    if (this.hasChanged || text.length === 0) {
      this.textSub.set(text);
    }
    if (this.hasChanged) {
      this.displayModeChangedPath();
      this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
      this.cellTextRef.instance.style.visibility = 'hidden';
    }
    return this.hasChanged;
  }

  render(): VNode {
    return (
      <g id="C1Cell">
        <path
          ref={this.modeChangedPathRef}
          class="NormalStroke Green"
          visibility="hidden"
          d="m499.35 9.072 v 30.238 h-155.125 v -30.238 z"
        />
        <text ref={this.cellTextRef} class="FontMediumSmaller  MiddleAlign Green" x="424" y="32.64">
          {this.textSub}
        </text>
      </g>
    );
  }
}

class C2Cell extends ShowForSecondsComponent<CellProps> {
  private isArmed = Subject.create('');

  private fmgcDiscreteWord1 = new Arinc429Word(0);

  private fmgcDiscreteWord3 = new Arinc429Word(0);

  private textSub = Subject.create('');

  private decMode = 0;

  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  private getText() {
    const navArmed = this.fmgcDiscreteWord3.bitValueOr(14, false);
    const locArmed = this.fmgcDiscreteWord3.bitValueOr(16, false);
    const backbeamMode = this.fmgcDiscreteWord3.bitValueOr(19, false);

    const finalArmed = this.fmgcDiscreteWord3.bitValueOr(23, false);
    const finalActive = this.fmgcDiscreteWord1.bitValueOr(23, false);

    let text: string = '';
    if (locArmed && backbeamMode) {
      text = 'LOC B/C';
    } else if (locArmed && !backbeamMode) {
      text = 'LOC';
    } else if (false) {
      text = 'F-LOC';
    } else if (navArmed && (finalArmed || finalActive)) {
      text = 'APP NAV';
    } else if (navArmed) {
      text = 'NAV';
    } else {
      text = '';
    }

    this.textSub.set(text);
    (navArmed || locArmed || finalArmed) && this.decMode < 2 ? this.isArmed.set('block') : this.isArmed.set('none');
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus & HudElems>();
    sub
      .on('decMode')
      .whenChanged()
      .handle((v) => {
        this.decMode = v;
        if (this.decMode === 2) {
          this.cellTextRef.instance.style.visibility = 'hidden';
        } else {
          this.cellTextRef.instance.style.visibility = 'visible';
        }
      });
    sub
      .on('fmgcDiscreteWord1')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord1 = word;
        this.getText();
      });

    sub
      .on('fmgcDiscreteWord3')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord3 = word;
        this.getText();
      });
  }

  render(): VNode {
    return (
      <g id="C2Cell">
        <path id="dash" display={this.isArmed} class="NormalStroke Green" d="m350 40 h 150" stroke-dasharray="5 10" />
        <text ref={this.cellTextRef} class="FontMediumSmaller MiddleAlign Green" x="421" y="65">
          {this.textSub}
        </text>
      </g>
    );
  }
}

class BC1Cell extends ShowForSecondsComponent<CellProps> {
  private fmgcDiscreteWord1 = new Arinc429Word(0);

  private fmgcDiscreteWord2 = new Arinc429Word(0);

  private fmgcDiscreteWord4 = new Arinc429Word(0);

  private textSub = Subject.create('');

  private decMode = 0;

  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  constructor(props: CellProps) {
    super(props, 9);
  }

  private setText() {
    const rollOutActive = this.fmgcDiscreteWord2.bitValueOr(26, false);
    const flareActive = this.fmgcDiscreteWord1.bitValueOr(25, false);
    const landActive = this.fmgcDiscreteWord4.bitValueOr(14, false) && !flareActive && !rollOutActive;

    const navActive = this.fmgcDiscreteWord2.bitValueOr(12, false);
    const finalActive = this.fmgcDiscreteWord1.bitValueOr(23, false);

    let text: string;
    this.isShown = true;
    if (rollOutActive) {
      text = 'ROLL OUT';
    } else if (flareActive) {
      text = 'FLARE';
    } else if (landActive) {
      text = 'LAND';
    } else if (navActive && finalActive) {
      text = 'FINAL APP';
    } else {
      text = '';
      this.isShown = false;
    }

    const hasChanged = text.length > 0 && text !== this.textSub.get();

    if (hasChanged || text.length === 0) {
      this.textSub.set(text);
    }
    if (hasChanged) {
      this.displayModeChangedPath();
      this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
      this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus & HudElems>();
    sub
      .on('decMode')
      .whenChanged()
      .handle((v) => {
        this.decMode = v;
        this.setText();
      });
    sub
      .on('fmgcDiscreteWord1')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord1 = word;
        this.setText();
      });

    sub
      .on('fmgcDiscreteWord2')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord2 = word;
        this.setText();
      });

    sub
      .on('fmgcDiscreteWord4')
      .whenChanged()
      .handle((word) => {
        this.fmgcDiscreteWord4 = word;
        this.setText();
      });
  }

  render(): VNode {
    return (
      <g id="BC1Cell">
        <path
          ref={this.modeChangedPathRef}
          class="NormalStroke Green"
          visibility="hidden"
          d="m250.89 9.072h175.87v30.238h-175.87z"
        />
        <text ref={this.cellTextRef} class="FontMediumSmaller  MiddleAlign Green" x="340" y="32.64">
          {this.textSub}
        </text>
      </g>
    );
  }
}

const getBC3Message = (
  isAttExcessive: boolean,
  fmgcDiscreteWord7: Arinc429Word,
  setHoldSpeed: boolean,
  fcdcWord1: Arinc429Word,
  fwcFlightPhase: number,
  tdReached: boolean,
  checkSpeedMode: boolean,
) => {
  const flightPhaseForWarning =
    fwcFlightPhase >= 2 && fwcFlightPhase <= 9 && fwcFlightPhase !== 4 && fwcFlightPhase !== 5;

  const TCASArmed = fmgcDiscreteWord7.bitValueOr(12, false);
  const tcasRaInhibited = fmgcDiscreteWord7.bitValueOr(24, false);
  const trkFpaDeselectedTCAS = fmgcDiscreteWord7.bitValueOr(25, false);

  let text: string;
  let className: string;
  let flashingClassName1 = '';
  let flashingClassName2 = '';
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
    className = 'FontMediumSmaller Red Blink9Seconds';
    flashingClassName1 = 'Red Fill';
    flashingClassName2 = 'HiddenElement';
  } else if (fcdcWord1.bitValue(15) && !fcdcWord1.isFailureWarning() && flightPhaseForWarning) {
    text = 'USE MAN PITCH TRIM';
    className = 'FontMediumSmaller PulseAmber9Seconds Amber';
    flashingClassName1 = 'Amber Fill';
    flashingClassName2 = 'DimmedAmber Fill';
  } else if (false) {
    text = 'FOR GA: SET TOGA';
    className = 'FontMediumSmaller  PulseAmber9Seconds Amber';
    flashingClassName1 = 'Amber Fill';
    flashingClassName2 = 'DimmedAmber Fill';
  } else if (TCASArmed && !isAttExcessive) {
    text = 'TCAS           ';
    className = 'FontMediumSmaller Smaller Green';
  } else if (false) {
    text = 'DISCONNECT AP FOR LDG';
    className = 'FontMediumSmaller  PulseAmber9Seconds Amber';
    flashingClassName1 = 'Amber Fill';
    flashingClassName2 = 'DimmedAmber Fill';
  } else if (tcasRaInhibited && !isAttExcessive) {
    text = 'TCAS RA INHIBITED';
    className = 'FontMediumSmaller  Green';
  } else if (trkFpaDeselectedTCAS && !isAttExcessive) {
    text = 'TRK FPA DESELECTED';
    className = 'FontMediumSmaller  Green';
  } else if (false) {
    text = 'SET GREEN DOT SPEED';
    className = 'FontMediumSmaller  Green';
  } else if (tdReached) {
    text = 'T/D REACHED';
    className = 'FontMediumSmaller  Green';
  } else if (false) {
    text = 'MORE DRAG';
    className = 'FontMediumSmaller  Green';
  } else if (checkSpeedMode && !isAttExcessive) {
    text = 'CHECK SPEED MODE';
    className = 'FontMediumSmaller  Green';
  } else if (false) {
    text = 'CHECK APPR SELECTION';
    className = 'FontMediumSmaller  Green';
  } else if (false) {
    text = 'TURN AREA EXCEEDANCE';
    className = 'FontMediumSmaller  Green';
  } else if (setHoldSpeed) {
    text = 'SET HOLD SPEED';
    className = 'FontMediumSmaller  Green';
  } else if (false) {
    text = 'VERT DISCONT AHEAD';
    className = 'FontMediumSmaller  Amber';
  } else if (false) {
    text = 'FINAL APP SELECTED';
    className = 'FontSmall Green';
  } else {
    return [null, null, flashingClassName1, flashingClassName2];
  }

  return [text, className, flashingClassName1, flashingClassName2];
};

class BC3Cell extends DisplayComponent<{ BC3Message: Subscribable<string[]> } & CellProps> {
  private bc3Cell = FSComponent.createRef<SVGTextElement>();

  private readonly normalClassNames = Subject.create('');

  private readonly flashingClassName1 = Subject.create('');

  private readonly flashingClassName2 = Subject.create('');

  private readonly isFlashing = Subject.create(false);

  private fillBC3Cell() {
    this.normalClassNames.set(`${this.props.BC3Message.get()[1]} MiddleAlign`);
    this.flashingClassName1.set(this.props.BC3Message.get()[2]);
    this.flashingClassName2.set(this.props.BC3Message.get()[3]);
    this.isFlashing.set(this.props.BC3Message.get()[2] !== '');

    const text = this.props.BC3Message.get()[0];
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
    });
  }

  render(): VNode {
    return <text ref={this.bc3Cell} class={this.normalClassNames} x="340" y="105" style="white-space: pre" />;
  }
}

class D1D2Cell extends ShowForSecondsComponent<CellProps> {
  private fmgcDiscreteWord4 = new Arinc429Word(0);

  private fmgcDiscreteWord3 = new Arinc429Word(0);

  private text1Sub = Subject.create('');

  private text2Sub = Subject.create('');

  private decMode = 0;

  private cellTextRef = FSComponent.createRef<SVGGElement>();

  constructor(props: CellProps) {
    super(props, 9);
  }

  private setText() {
    const landModeArmed = this.fmgcDiscreteWord3.bitValueOr(20, false);
    const landModeActive = this.fmgcDiscreteWord4.bitValueOr(14, false);
    const land2Capacity = this.fmgcDiscreteWord4.bitValueOr(23, false);
    const land3FailPassiveCapacity = this.fmgcDiscreteWord4.bitValueOr(24, false);
    const land3FailOperationalCapacity = this.fmgcDiscreteWord4.bitValueOr(25, false);

    let text1: string;
    let text2: string | undefined;
    this.isShown = true;
    if (land2Capacity) {
      text1 = 'CAT2';
      text2 = '';
    } else if (land3FailPassiveCapacity) {
      text1 = 'CAT3';
      text2 = 'SINGLE';
    } else if (land3FailOperationalCapacity) {
      text1 = 'CAT3';
      text2 = 'DUAL';
    } else if (landModeArmed || landModeActive) {
      text1 = 'CAT1';
      text2 = '';
    } else if (false) {
      text1 = 'AUTO';
      text2 = 'LAND';
    } else if (false) {
      text1 = 'F-APP';
    } else if (false) {
      text1 = 'F-APP';
      text2 = '+ RAW';
    } else if (false) {
      text1 = 'RAW';
      text2 = 'ONLY';
    } else {
      text1 = '';
      text2 = '';
      this.isShown = false;
    }

    const hasChanged = text1 !== this.text1Sub.get() || text2 !== this.text2Sub.get();

    if (hasChanged) {
      this.displayModeChangedPath();
      this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
      this.text1Sub.set(text1);
      this.text2Sub.set(text2);

      if (text2 !== '') {
        this.modeChangedPathRef.instance.setAttribute('d', 'm520.5 9.05 h 140 v 67.53 h -140 z');
      } else {
        this.modeChangedPathRef.instance.setAttribute('d', 'm520.5 9.05 h 140 v 30.2386 h -140 z');
      }
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
      this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus & HudElems>();
    sub
      .on('decMode')
      .whenChanged()
      .handle((v) => {
        this.decMode = v;
        if (this.decMode === 2) {
          this.displayModeChangedPath(true);
          this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
        } else {
          if (this.isShown === false) {
            this.displayModeChangedPath(true);
            this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
            this.cellTextRef.instance.style.visibility = 'hidden';
          } else {
            this.displayModeChangedPath(true);
            this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
            this.cellTextRef.instance.style.visibility = 'visible';
          }
        }
      });
    sub
      .on('fmgcDiscreteWord4')
      .whenChanged()
      .handle((c) => {
        this.fmgcDiscreteWord4 = c;
        this.setText();
      });

    sub
      .on('fmgcDiscreteWord3')
      .whenChanged()
      .handle((c) => {
        this.fmgcDiscreteWord3 = c;
        this.setText();
      });
  }

  render(): VNode {
    return (
      <g id="D1D2Cell">
        <g ref={this.cellTextRef}>
          <text class="FontMediumSmaller MiddleAlign White" x="592" y="32.64">
            {this.text1Sub}
          </text>
          <text class="FontMediumSmaller MiddleAlign White" x="592" y="68.75">
            {this.text2Sub}
          </text>
        </g>
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
  private readonly textRef = FSComponent.createRef<SVGTextElement>();

  private sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & HudElems>();
  /** bit 29 is NO DH selection */
  private readonly fmEisDiscrete2 = Arinc429RegisterSubject.createEmpty();

  private readonly mda = Arinc429RegisterSubject.createEmpty();

  private readonly dh = Arinc429RegisterSubject.createEmpty();

  private readonly noDhSelected = this.fmEisDiscrete2.map((r) => r.bitValueOr(29, false));

  private readonly decMode = ConsumerSubject.create(this.sub.on('decMode').whenChanged(), 0);

  private readonly mdaDhMode = MappedSubject.create(
    ([noDh, dh, mda, decMode]) => {
      if (decMode !== 2) {
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
      } else {
        return '';
      }
    },
    this.noDhSelected,
    this.dh,
    this.mda,
    this.decMode,
  );

  private readonly mdaDhValueText = MappedSubject.create(
    ([mdaMode, dh, mda, decMode]) => {
      if (decMode !== 2) {
        switch (mdaMode) {
          case MdaMode.Baro:
            return Math.round(mda.value).toString().padStart(6, '\xa0');
          case MdaMode.Radio:
            return Math.round(dh.value).toString().padStart(4, '\xa0');
          default:
            return '';
        }
      } else {
        return '';
      }
    },
    this.mdaDhMode,
    this.dh,
    this.mda,
    this.decMode,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub.on('fmEisDiscreteWord2Raw').handle(this.fmEisDiscrete2.setWord.bind(this.fmEisDiscrete2));
    this.sub.on('fmMdaRaw').handle(this.mda.setWord.bind(this.mda));
    this.sub.on('fmDhRaw').handle(this.dh.setWord.bind(this.dh));
  }

  render(): VNode {
    return (
      <text
        ref={this.textRef}
        class={{
          FontMediumSmallest: true,
          MiddleAlign: true,
          Green: true,
        }}
        x="592"
        y="104.5"
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
  private fmgc1DiscreteWord4 = new Arinc429Word(0);

  private fmgc2DiscreteWord4 = new Arinc429Word(0);

  private textSub = Subject.create('');

  private decMode = 0;

  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  constructor(props: CellProps) {
    super(props, 9);
  }

  private setText() {
    const ap1Engaged = this.fmgc1DiscreteWord4.bitValueOr(12, false);
    const ap2Engaged = this.fmgc2DiscreteWord4.bitValueOr(12, false);

    let text: string;
    this.isShown = true;
    if (ap1Engaged && ap2Engaged) {
      text = 'AP1+2';
    } else if (ap1Engaged) {
      text = 'AP1';
    } else if (ap2Engaged) {
      text = 'AP2';
    } else {
      text = '';
      this.isShown = false;
    }

    const hasChanged = text.length > 0 && text !== this.textSub.get();

    if (hasChanged || text.length === 0) {
      this.textSub.set(text);
    }
    if (hasChanged) {
      this.displayModeChangedPath();
      if (this.decMode === 2) {
        this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
      }
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
      if (this.decMode === 2) {
        this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
      }
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus & HudElems>();
    sub
      .on('decMode')
      .whenChanged()
      .handle((v) => {
        this.decMode = v;
        if (this.decMode === 2) {
          this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
        } else {
          this.cellTextRef.instance.style.visibility = 'visible';
        }
      });

    sub
      .on('fmgc1DiscreteWord4')
      .whenChanged()
      .handle((ap) => {
        this.fmgc1DiscreteWord4 = ap;
        this.setText();
      });

    sub
      .on('fmgc2DiscreteWord4')
      .whenChanged()
      .handle((ap) => {
        this.fmgc2DiscreteWord4 = ap;
        this.setText();
      });
  }

  render(): VNode {
    return (
      <g id="E1Cell">
        <path
          ref={this.modeChangedPathRef}
          visibility="hidden"
          class="NormalStroke Green"
          d="m780.65 9.05 v30.2386h-104.05v-30.2386z"
        />
        <text ref={this.cellTextRef} class="FontMediumSmaller  MiddleAlign Green" x="728.05 " y="32.64">
          {this.textSub}
        </text>
      </g>
    );
  }
}

class E2Cell extends ShowForSecondsComponent<CellProps> {
  private fmgc1DiscreteWord4 = new Arinc429Word(0);

  private fmgc2DiscreteWord4 = new Arinc429Word(0);

  private fcuDiscreteWord2 = new Arinc429Word(0);

  private textSub = Subject.create('');

  private decMode = 0;

  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  constructor(props: CellProps) {
    super(props, 9);
  }

  private getText() {
    const ap1Engaged = this.fmgc1DiscreteWord4.bitValueOr(12, false);
    const ap2Engaged = this.fmgc2DiscreteWord4.bitValueOr(12, false);

    const fd1Engaged = this.fmgc1DiscreteWord4.bitValueOr(13, false);
    const fd2Engaged = this.fmgc2DiscreteWord4.bitValueOr(13, false);

    const fdLeftOff = this.fcuDiscreteWord2.bitValueOr(26, false);
    const fdRightOff = this.fcuDiscreteWord2.bitValueOr(27, false);

    const fd1EngagedOnLeft = !fdLeftOff && fd1Engaged;
    const fd2EngagedOnRight = !fdRightOff && fd2Engaged;
    const fd1EngagedOnRight = !fdRightOff && fd1Engaged;
    const fd2EngagedOnLeft = !fdLeftOff && fd2Engaged;

    const anyFdOrApEngaged = ap1Engaged || ap2Engaged || fd1Engaged || fd2Engaged;

    let text: string;
    this.isShown = true;
    if (!anyFdOrApEngaged) {
      this.isShown = false;
      text = '';
    } else if (fd1EngagedOnLeft && fd2EngagedOnRight) {
      text = '1 FD 2';
    } else if (fd1EngagedOnLeft && fd1EngagedOnRight) {
      text = '1 FD 1';
    } else if (fd2EngagedOnLeft && fd2EngagedOnRight) {
      text = '2 FD 2';
    } else if (fd1EngagedOnLeft) {
      text = '1 FD -';
    } else if (fd1EngagedOnRight) {
      text = '- FD 1';
    } else if (fd2EngagedOnRight) {
      text = '- FD 2';
    } else if (fd2EngagedOnLeft) {
      text = '2 FD -';
    } else {
      text = '- FD -';
    }

    const hasChanged = text.length > 0 && text !== this.textSub.get();

    if (hasChanged || text.length === 0) {
      this.textSub.set(text);
    }
    if (hasChanged) {
      this.displayModeChangedPath();
      if (this.decMode === 2) {
        this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
      }
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
      if (this.decMode === 2) {
        this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
      }
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus & FcuBus & HudElems>();
    sub
      .on('decMode')
      .whenChanged()
      .handle((v) => {
        this.decMode = v;
        if (this.decMode === 2) {
          this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
        } else {
          this.cellTextRef.instance.style.visibility = 'visible';
        }
      });

    sub
      .on('fmgc1DiscreteWord4')
      .whenChanged()
      .handle((fd) => {
        this.fmgc1DiscreteWord4 = fd;
        this.getText();
      });

    sub
      .on('fmgc2DiscreteWord4')
      .whenChanged()
      .handle((fd) => {
        this.fmgc2DiscreteWord4 = fd;
        this.getText();
      });

    sub
      .on('fcuDiscreteWord2')
      .whenChanged()
      .handle((fd) => {
        this.fcuDiscreteWord2 = fd;
        this.getText();
      });
  }

  render(): VNode {
    return (
      <g id="E2Cell">
        <path
          ref={this.modeChangedPathRef}
          d="m780.65 45 v30.2386h-104.05v-30.2386z"
          visibility="hidden"
          class="NormalStroke Green"
        />
        <text
          ref={this.cellTextRef}
          class="FontMediumSmaller  MiddleAlign Green"
          x="729.75"
          style="word-spacing: -10px"
          y="69"
        >
          {this.textSub}
        </text>
      </g>
    );
  }
}

class E3Cell extends ShowForSecondsComponent<CellProps> {
  private isArmed = Subject.create('');

  private classSub = Subject.create('');

  private posSub = Subject.create(0);

  private decMode = 0;

  private cellTextRef = FSComponent.createRef<SVGTextElement>();

  constructor(props: CellProps) {
    super(props, 9);
  }

  private getClass(atEngaged: boolean, atActive: boolean): string {
    let className: string = '';
    this.isShown = true;
    if (atEngaged && atActive) {
      className = 'Green FontMediumSmaller ';
      this.isArmed.set('none');
    } else if (atEngaged) {
      className = 'Green FontMediumSmaller';
      this.isArmed.set('block');
    } else {
      this.isShown = false;
      className = 'HiddenElement';
      this.isArmed.set('none');
    }
    return className;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FcuBus & HudElems>();
    sub
      .on('decMode')
      .whenChanged()
      .handle((v) => {
        this.decMode = v;
        if (this.decMode === 2) {
          this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
        } else {
          this.cellTextRef.instance.style.visibility = 'visible';
        }
      });
    sub
      .on('fcuAtsDiscreteWord')
      .whenChanged()
      .handle((a) => {
        const atEngaged = a.bitValueOr(13, false);
        const atActive = a.bitValueOr(14, false);

        const className = `MiddleAlign ${this.getClass(atEngaged, atActive)}`;

        const hasChanged = className.length > 0 && className !== this.classSub.get();
        if (hasChanged) {
          this.displayModeChangedPath();
          if (this.decMode === 2) {
            this.handleDeclutterMode(false, this.decMode, this.cellTextRef);
          }
        } else if (!this.isShown) {
          this.displayModeChangedPath(true);
          if (this.decMode === 2) {
            this.handleDeclutterMode(true, this.decMode, this.cellTextRef);
          }
        }

        this.posSub.set(!atActive ? 103.25 : 105.75);
        this.classSub.set(className);
      });
  }

  render(): VNode {
    return (
      <g id="E3Cell">
        <path id="dash" display={this.isArmed} class="NormalStroke Green" d="m 677.5 82 h 105" stroke-dasharray="5 9" />
        <path
          ref={this.modeChangedPathRef}
          class="NormalStroke Green"
          visibility="hidden"
          d="m676.6 81.645 h104.05v30.2386h-104.05z"
        />
        <text ref={this.cellTextRef} class={this.classSub} x="728.7" y={this.posSub}>
          A/THR
        </text>
      </g>
    );
  }
}
