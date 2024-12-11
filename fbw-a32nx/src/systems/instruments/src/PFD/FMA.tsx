// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429RegisterSubject, Arinc429Register } from '@flybywiresim/fbw-sdk';

import { FgBus } from 'instruments/src/PFD/shared/FgBusProvider';
import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';
import { Arinc429Values } from './shared/ArincValueProvider';
import { PFDSimvars } from './shared/PFDSimvarPublisher';

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
}

export class FMA extends DisplayComponent<{ bus: ArincEventBus; isAttExcessive: Subscribable<boolean> }> {
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

    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & FgBus & FcuBus>();

    this.props.isAttExcessive.sub((_a) => {
      this.handleFMABorders();
    });

    this.BC3Message.sub(() => this.handleFMABorders());

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
      <g id="FMA">
        <g class="NormalStroke Grey">
          <path d={this.firstBorderSub} />
          <path d={this.secondBorderSub} />
          <path d="m102.52 0.33732v20.864" />
          <path d="m133.72 0.33732v20.864" />
        </g>

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

  private autobrakeActive = false;

  private autobrakeMode = 0;

  private fcuAtsFmaDiscreteWord = new Arinc429Word(0);

  private fcuAtsDiscreteWord = new Arinc429Word(0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & FcuBus>();

    sub
      .on('autoBrakeMode')
      .whenChanged()
      .handle((am) => {
        this.autobrakeMode = am;
        this.handleMessage();
      });

    sub
      .on('autoBrakeActive')
      .whenChanged()
      .handle((am) => {
        this.autobrakeActive = am;
        this.handleMessage();
      });

    sub
      .on('fcuAtsDiscreteWord')
      .whenChanged()
      .handle((word) => {
        this.fcuAtsDiscreteWord = word;
        this.handleMessage();
      });

    sub
      .on('fcuAtsFmaDiscreteWord')
      .whenChanged()
      .handle((word) => {
        this.fcuAtsFmaDiscreteWord = word;
        this.handleMessage();
      });
  }

  handleMessage(): void {
    const [_isShown, isTwoLine, _text] = getA1A2CellText(
      this.fcuAtsDiscreteWord,
      this.fcuAtsFmaDiscreteWord,
      0,
      this.autobrakeMode,
      this.autobrakeActive,
    );

    if (this.autobrakeActive || isTwoLine) {
      this.text.set('');

      return;
    }

    switch (this.autobrakeMode) {
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
  }

  render(): VNode {
    return (
      <text class="FontMediumSmaller MiddleAlign Cyan" x="16.782249" y="14.329653" style="white-space: pre">
        {this.text}
      </text>
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
      <g>
        <A3Cell bus={this.props.bus} A3Message={this.props.A3Message} />
        <g ref={this.cellsToHide}>
          <AB3Cell AB3Message={this.props.AB3Message} />
          <D3Cell bus={this.props.bus} />
        </g>
        <BC3Cell BC3Message={this.props.BC3Message} />
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
): [boolean, boolean, string] {
  const atEngaged = fcuAtsDiscreteWord.bitValueOr(13, false);
  const atActive = fcuAtsDiscreteWord.bitValueOr(14, false);

  let text = '';
  let isShown = true;
  let isTwoLine = false;

  if (fcuAtsFmaDiscreteWord.bitValueOr(11, false)) {
    isShown = false;
    isTwoLine = true;
    text = `
                                <path class="NormalStroke White" d="m25.114 1.8143v13.506h-16.952v-13.506z" />
                                <text class="FontMedium MiddleAlign White" x="17.052249" y="7.1280665">MAN</text>
                                <text class="FontMedium MiddleAlign White" x="16.869141" y="14.351689">TOGA</text>
                            `;
  } else if (false) {
    isShown = false;
    isTwoLine = true;
    text = `<g>
                                <path class="NormalStroke White" d="m31.521 1.8143v13.506h-30.217v-13.506z" />
                                <text class="FontMedium MiddleAlign White" x="17.052249" y="7.1280665">MAN</text>
                                <text class="FontMedium MiddleAlign White" x="16.869141" y="14.351689">GA SOFT</text>
                            </g>`;
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(13, false)) {
    isShown = false;
    isTwoLine = true;
    const FlexTemp = Math.round(flexTemp);
    const FlexText = FlexTemp >= 0 ? `+${FlexTemp}` : FlexTemp.toString();
    text = `<g>
                                <path class="NormalStroke White" d="m30.521 1.8143v13.506h-27.217v-13.506z" />
                                <text class="FontMedium MiddleAlign White" x="17.052249" y="7.1280665">MAN</text>
                                <text class="FontMedium MiddleAlign White" x="9.669141" y="14.351689">FLX</text>
                                <text class="FontMedium MiddleAlign Cyan" x="24.099141" y="14.351689">
                               ${FlexText}
                                </text>
                            </g>`;
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(29, false)) {
    isShown = false;
    isTwoLine = true;
    text = `<g>
                                <path class="NormalStroke White" d="m25.114 1.8143v13.506h-16.952v-13.506z" />
                                <text class="FontMedium MiddleAlign White" x="17.052249" y="7.1280665">MAN</text>
                                <text class="FontMedium MiddleAlign White" x="16.869141" y="14.351689">DTO</text>
                            </g>`;
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(12, false) && atEngaged && !atActive) {
    isShown = false;
    isTwoLine = true;
    text = `<g>
                                <path class="NormalStroke White" d="m25.114 1.8143v13.506h-16.952v-13.506z" />
                                <text class="FontMedium MiddleAlign White" x="17.052249" y="7.1280665">MAN</text>
                                <text class="FontMedium MiddleAlign White" x="16.869141" y="14.351689">MCT</text>
                            </g>`;
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(15, false) && atEngaged && !atActive) {
    isShown = false;
    isTwoLine = true;
    text = `<g>
                                <path class="NormalStroke Amber" d="m25.114 1.8143v13.506h-16.952v-13.506z" />
                                <text class="FontMedium MiddleAlign White" x="17.052249" y="7.1280665">MAN</text>
                                <text class="FontMedium MiddleAlign White" x="16.869141" y="14.351689">THR</text>
                            </g>`;
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(17, false)) {
    isShown = false;
    text = `<g>
                                <path class="NormalStroke Amber BlinkInfinite" d="m0.70556 1.8143h30.927v6.0476h-30.927z" />
                                <text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">A.FLOOR</text>
                            </g>`;
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(18, false)) {
    isShown = false;
    text = `<g>
                                <path class="NormalStroke Amber BlinkInfinite" d="m0.70556 1.8143h30.927v6.0476h-30.927z" />
                                <text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">TOGA LK</text>
                            </g>`;
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(19, false)) {
    text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">SPEED</text>';
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(20, false)) {
    text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">MACH</text>';
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(12, false) && atEngaged && atActive) {
    text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">THR MCT</text>';
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(14, false)) {
    text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">THR CLB</text>';
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(15, false) && atEngaged && atActive) {
    text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">THR LVR</text>';
  } else if (fcuAtsFmaDiscreteWord.bitValueOr(16, false)) {
    text = '<text class="FontMediumSmaller MiddleAlign Green" x="16.782249" y="7.1280665">THR IDLE</text>';
  } else if (autoBrakeActive) {
    switch (autoBrakeMode) {
      case 1:
        text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">BRK LO</text>';
        break;
      case 2:
        text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">BRK MED</text>';
        break;
      case 3:
        text = '<text class="FontMedium MiddleAlign Green" x="16.782249" y="7.1280665">BRK MAX</text>';
        break;
      default:
        text = '';
        isShown = false;
    }
  } else {
    text = '';
    isShown = false;
  }

  return [isShown, isTwoLine, text];
}

interface CellProps extends ComponentProps {
  bus: ArincEventBus;
}

class A1A2Cell extends ShowForSecondsComponent<CellProps> {
  private fcuAtsFmaDiscreteWord = new Arinc429Word(0);

  private fcuAtsDiscreteWord = new Arinc429Word(0);

  private cellRef = FSComponent.createRef<SVGGElement>();

  private flexTemp = 0;

  private autoBrakeActive = false;

  private autoBrakeMode = 0;

  constructor(props) {
    super(props, 9);
  }

  private setText() {
    const [isShown, _isTwoLine, text] = getA1A2CellText(
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
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
    }

    this.cellRef.instance.innerHTML = text;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & FcuBus>();

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
      <g>
        <path
          ref={this.modeChangedPathRef}
          visibility="hidden"
          class="NormalStroke White"
          d="m3.3 1.8143h27.127v6.0476h-27.127z"
        />
        <g ref={this.cellRef} />
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
  if (thrLocked) {
    text = 'THR LK';
    className = 'Amber BlinkInfinite';
  } else if (false) {
    text = 'LVR TOGA';
    className = 'White BlinkInfinite';
  } else if (clbDemand) {
    text = 'LVR CLB';
    className = 'White BlinkInfinite';
  } else if (mctDemand) {
    text = 'LVR MCT';
    className = 'White BlinkInfinite';
  } else if (assymThrust) {
    text = 'LVR ASYM';
    className = 'Amber';
  } else if (autobrakeMode === 3 && !AB3Message) {
    text = 'BRK MAX';
    className = 'FontMediumSmaller MiddleAlign Cyan';
  } else {
    return [null, null];
  }

  return [text, className];
};

interface A3CellProps extends CellProps {
  A3Message: Subscribable<string[]>;
}

class A3Cell extends DisplayComponent<A3CellProps> {
  private classSub = Subject.create('');

  private textSub = Subject.create('');

  private updateMessage() {
    const className = this.props.A3Message.get()[1];
    const text = this.props.A3Message.get()[0];

    this.textSub.set(text);
    this.classSub.set(`FontMedium MiddleAlign ${className}`);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.A3Message.sub(() => this.updateMessage());
  }

  render(): VNode {
    return (
      <text class={this.classSub} x="16.989958" y="21.641243">
        {this.textSub}
      </text>
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
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.AB3Message.sub(() => this.getText());
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

  private activeVerticalModeClassSub = Subject.create('');

  private readonly verticalText = Subject.create('');

  private readonly additionalText = Subject.create('');

  private readonly inSpeedProtection = Subject.create(false);

  private speedProtectionPathRef = FSComponent.createRef<SVGPathElement>();

  private inModeReversionPathRef = FSComponent.createRef<SVGPathElement>();

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
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
    }

    const targetNotHeld = this.fmgcDiscreteWord4.bitValueOr(29, false);

    const inSpeedProtection = targetNotHeld && text !== '';

    this.inSpeedProtection.set(inSpeedProtection);

    const longitudinalModeReversion = this.fmgcDiscreteWord3.bitValueOr(18, false);

    if (inSpeedProtection || longitudinalModeReversion) {
      this.boxClassSub.set('NormalStroke None');
    } else {
      this.boxClassSub.set('NormalStroke White');
    }

    if (longitudinalModeReversion) {
      this.inModeReversionPathRef.instance.setAttribute('visibility', 'visible');
    } else {
      this.inModeReversionPathRef.instance.setAttribute('visibility', 'hidden');
    }

    if (inSpeedProtection) {
      this.speedProtectionPathRef.instance.setAttribute('visibility', 'visible');
    } else {
      this.speedProtectionPathRef.instance.setAttribute('visibility', 'hidden');
    }

    const bigBoxDisplayed = tcasMode && this.fmgcDiscreteWord7.bitValueOr(18, false);
    const boxPathString =
      tcasMode && bigBoxDisplayed ? 'm35.756 1.8143h27.918v13.506h-27.918z' : 'm35.756 1.8143h27.918v6.0476h-27.918z';

    this.boxPathStringSub.set(boxPathString);

    // VS FPA & ALT CST* have a smaller font than the other active modes
    const smallFont = fpaMode || vsMode || (captureMode && altMode && !dashMode && altConstraintValid);

    this.activeVerticalModeClassSub.set(
      smallFont ? 'FontMediumSmaller MiddleAlign Green' : 'FontMedium MiddleAlign Green',
    );

    this.verticalText.set(text);
    this.additionalText.set(additionalText);

    return text.length > 0;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus & FcuBus>();

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

  private altConstraint = new Arinc429Word(0);

  private fmgcDiscreteWord3 = new Arinc429Word(0);

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

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus>();

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

  private fmgcDiscreteWord1 = new Arinc429Word(0);

  private fmgcDiscreteWord2 = new Arinc429Word(0);

  private fmgcDiscreteWord3 = new Arinc429Word(0);

  private textSub = Subject.create('');

  constructor(props: CellProps) {
    super(props, 10);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus>();

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

  private updateText(): void {
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

    const hasChanged = text.length > 0 && text !== this.textSub.get();

    if (hasChanged || text.length === 0) {
      this.textSub.set(text);
    }
    if (hasChanged) {
      this.displayModeChangedPath();
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
    }
  }

  render(): VNode {
    return (
      <g>
        <path
          ref={this.modeChangedPathRef}
          class="NormalStroke White"
          visibility="hidden"
          d="m99.87 1.8143v6.0476h-31.025l1e-6 -6.0476z"
        />
        <text class="FontMedium MiddleAlign Green" x="84.856567" y="6.9873109">
          {this.textSub}
        </text>
      </g>
    );
  }
}

class C2Cell extends DisplayComponent<CellProps> {
  private fmgcDiscreteWord1 = new Arinc429Word(0);

  private fmgcDiscreteWord3 = new Arinc429Word(0);

  private textSub = Subject.create('');

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
    }

    this.textSub.set(text);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus>();

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
      <text class="FontMediumSmaller MiddleAlign Cyan" x="84.234184" y="13.629653">
        {this.textSub}
      </text>
    );
  }
}

class BC1Cell extends ShowForSecondsComponent<CellProps> {
  private fmgcDiscreteWord1 = new Arinc429Word(0);

  private fmgcDiscreteWord2 = new Arinc429Word(0);

  private fmgcDiscreteWord4 = new Arinc429Word(0);

  private textSub = Subject.create('');

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
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus>();

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

class BC3Cell extends DisplayComponent<{ BC3Message: Subscribable<string[]> }> {
  private bc3Cell = FSComponent.createRef<SVGTextElement>();

  private classNameSub = Subject.create('');

  private fillBC3Cell() {
    const className = this.props.BC3Message.get()[1];
    const text = this.props.BC3Message.get()[0];

    this.classNameSub.set(`MiddleAlign ${className}`);
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
    return <text ref={this.bc3Cell} class={this.classNameSub} x="68.087875" y="21.627102" style="white-space: pre" />;
  }
}

class D1D2Cell extends ShowForSecondsComponent<CellProps> {
  private fmgcDiscreteWord4 = new Arinc429Word(0);

  private fmgcDiscreteWord3 = new Arinc429Word(0);

  private text1Sub = Subject.create('');

  private text2Sub = Subject.create('');

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

      this.text1Sub.set(text1);
      this.text2Sub.set(text2);

      if (text2 !== '') {
        this.modeChangedPathRef.instance.setAttribute('d', 'm104.1 1.8143h27.994v13.506h-27.994z');
      } else {
        this.modeChangedPathRef.instance.setAttribute('d', 'm104.1 1.8143h27.994v6.0476h-27.994z');
      }
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus>();

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
  private readonly DhModexPos = MappedSubject.create(
    ([noDhSelected]) => (noDhSelected ? 118.38384 : 104.75),
    this.noDhSelected,
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
          x="132.25"
          y="21.104172"
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
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus>();

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
  private fmgc1DiscreteWord4 = new Arinc429Word(0);

  private fmgc2DiscreteWord4 = new Arinc429Word(0);

  private fcuDiscreteWord2 = new Arinc429Word(0);

  private textSub = Subject.create('');

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
    } else if (!this.isShown) {
      this.displayModeChangedPath(true);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FgBus & FcuBus>();

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

  private getClass(atEngaged: boolean, atActive: boolean): string {
    let className: string = '';
    this.isShown = true;
    if (atEngaged && atActive) {
      className = 'White FontMedium';
    } else if (atEngaged) {
      className = 'Cyan FontSmall';
    } else {
      this.isShown = false;
      className = 'HiddenElement';
    }
    return className;
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FcuBus>();

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
        } else if (!this.isShown) {
          this.displayModeChangedPath(true);
        }

        this.posSub.set(!atActive ? 21.253048 : 21.753487);
        this.classSub.set(className);
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
