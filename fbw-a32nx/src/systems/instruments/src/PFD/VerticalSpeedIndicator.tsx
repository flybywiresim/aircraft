// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  MathUtils,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, Arinc429Word, Arinc429LocalVarConsumerSubject, Arinc429WordData } from '@flybywiresim/fbw-sdk';

import { Arinc429Values } from './shared/ArincValueProvider';
import { LagFilter } from './PFDUtils';
import { FlashOneHertz } from '../MsfsAvionicsCommon/FlashingElementUtils';
import { A32NXTcasBusEvents } from '@shared/publishers/A32NXTcasBusPublisher';

function bitsToInteger(word: Arinc429WordData, startBit: number, endBit: number): number {
  const mask = ((1 << (endBit - startBit + 1)) - 1) << (startBit - 1);

  return (word.value & mask) >> (startBit - 1);
}

function resolutionAdvisoryNumberToVs(resAdv: number, rateToMaintain: number, sign: number) {
  if (resAdv == 1) {
    return rateToMaintain;
  } else if (resAdv == 2) {
    return sign * 250;
  } else if (resAdv == 3) {
    return sign * 500;
  } else if (resAdv == 4) {
    return sign * 1000;
  } else if (resAdv == 5) {
    return sign * 2000;
  } else {
    return sign * 32767;
  }
}

function yPosFromVs(vsValue: number): number {
  const absVSpeed = Math.abs(vsValue);
  const sign = Math.sign(vsValue);

  if (absVSpeed < 1000) {
    return (vsValue / 1000) * -27.22;
  } else if (absVSpeed < 2000) {
    return ((vsValue - sign * 1000) / 1000) * -10.1 - sign * 27.22;
  } else if (absVSpeed < 6000) {
    return ((vsValue - sign * 2000) / 4000) * -10.1 - sign * 37.32;
  } else {
    return sign * -47.37;
  }
}

interface VerticalSpeedIndicatorProps {
  bus: ArincEventBus;
  instrument: BaseInstrument;
  filteredRadioAltitude: Subscribable<number>;
}

export class VerticalSpeedIndicator extends DisplayComponent<VerticalSpeedIndicatorProps> {
  private readonly sub = this.props.bus.getArincSubscriber<A32NXTcasBusEvents & Arinc429Values & ClockEvents>();

  private readonly verticalSpeed = ConsumerSubject.create(this.sub.on('vs'), Arinc429Word.empty());

  private readonly lagFilter = new LagFilter(2);

  private readonly filteredVerticalSpeed = Subject.create(0);

  private readonly ra = ConsumerSubject.create(this.sub.on('chosenRa'), Arinc429Word.empty());

  private readonly verticalResolutionAdvisoryWord = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_tcas_vertical_resolution_advisory_word'),
  );

  private readonly tcasModeWord = Arinc429LocalVarConsumerSubject.create(this.sub.on('a32nx_tcas_mode_word'));

  private readonly tcasFaultSummaryWord = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_tcas_fault_summary_word'),
  );

  private readonly vsFlagVisible = this.verticalSpeed.map((vs) => vs.isFailureWarning());

  private readonly tcasInvalid = MappedSubject.create(
    ([verticalResolutionAdvisoryWord, tcasModeWord, tcasFaultSummaryWord]) => {
      const tcasFailure =
        verticalResolutionAdvisoryWord.isFailureWarning() ||
        tcasFaultSummaryWord.isFailureWarning() ||
        tcasFaultSummaryWord.bitValue(20);
      const tcasStandby =
        tcasModeWord.bitValue(25) &&
        !(tcasModeWord.bitValue(23) || tcasModeWord.bitValue(24) || tcasModeWord.isFailureWarning());

      return tcasFailure && !tcasStandby;
    },
    this.verticalResolutionAdvisoryWord,
    this.tcasModeWord,
    this.tcasFaultSummaryWord,
  );

  private readonly needleYOffset = this.filteredVerticalSpeed.map((filteredVS) => {
    return yPosFromVs(filteredVS);
  });

  private readonly tcasVerticalResolutionWordValid = this.verticalResolutionAdvisoryWord.map(
    (word) => !word.isFailureWarning(),
  );

  private readonly downResolutionAdvisory = this.verticalResolutionAdvisoryWord.map((word) =>
    bitsToInteger(word, 27, 29),
  );

  private readonly downResolutionAdvisoryActive = MappedSubject.create(
    ([downResolutionAdvisory, tcasVerticalResolutionWordValid]) =>
      tcasVerticalResolutionWordValid && downResolutionAdvisory > 0 && downResolutionAdvisory < 6,
    this.downResolutionAdvisory,
    this.tcasVerticalResolutionWordValid,
  );

  private readonly upResolutionAdvisory = this.verticalResolutionAdvisoryWord.map((word) =>
    bitsToInteger(word, 24, 26),
  );

  private readonly upResolutionAdvisoryActive = MappedSubject.create(
    ([upResolutionAdvisory, tcasVerticalResolutionWordValid]) =>
      tcasVerticalResolutionWordValid && upResolutionAdvisory > 0 && upResolutionAdvisory < 6,
    this.upResolutionAdvisory,
    this.tcasVerticalResolutionWordValid,
  );

  private readonly rateToMaintain = this.verticalResolutionAdvisoryWord.map((word) => {
    const sign = word.bitValue(17) ? -1 : 1;
    return sign * Math.min(bitsToInteger(word, 11, 16), 6000) * 100;
  });

  private readonly upperVsLimit = MappedSubject.create(
    ([downResolutionAdvisory, rateToMaintain]) =>
      resolutionAdvisoryNumberToVs(downResolutionAdvisory, rateToMaintain, 1),
    this.downResolutionAdvisory,
    this.rateToMaintain,
  );

  private readonly lowerVsLimit = MappedSubject.create(
    ([upResolutionAdvisory, rateToMaintain]) => resolutionAdvisoryNumberToVs(upResolutionAdvisory, rateToMaintain, -1),
    this.upResolutionAdvisory,
    this.rateToMaintain,
  );

  private readonly combinedControl = this.verticalResolutionAdvisoryWord.map((word) => bitsToInteger(word, 18, 20));

  private readonly excessiveVs = MappedSubject.create(
    ([raWord, filteredRa, filteredVs]) => {
      const absVSpeed = Math.abs(filteredVs);
      const raValid = !(raWord.isNoComputedData() || raWord.isFailureWarning());

      return (
        absVSpeed >= 6000 ||
        (filteredVs <= -2000 && raValid && filteredRa <= 2500 && filteredRa >= 1000) ||
        (filteredVs <= -1200 && raValid && filteredRa <= 1000)
      );
    },
    this.ra,
    this.props.filteredRadioAltitude,
    this.filteredVerticalSpeed,
  );

  private readonly needleColour = MappedSubject.create(
    ([excessiveVs, downRaActive, upRaActive]) => {
      const resolutionAdvisoryActive = downRaActive || upRaActive;

      if (resolutionAdvisoryActive) {
        return 'White';
      } else if (excessiveVs) {
        return 'Amber';
      } else {
        return 'Green';
      }
    },
    this.excessiveVs,
    this.downResolutionAdvisoryActive,
    this.upResolutionAdvisoryActive,
  );

  private readonly textColour = MappedSubject.create(
    ([upRaActive, downRaActive, upperVsLimit, lowerVsLimit, filteredVs, excessiveVs]) => {
      const tcasRaInRedSector =
        (upRaActive && lowerVsLimit > filteredVs) || (downRaActive && upperVsLimit < filteredVs);

      if (tcasRaInRedSector) {
        return 'Red';
      } else if (excessiveVs) {
        return 'Amber';
      } else {
        return 'Green';
      }
    },
    this.upResolutionAdvisoryActive,
    this.downResolutionAdvisoryActive,
    this.upperVsLimit,
    this.lowerVsLimit,
    this.filteredVerticalSpeed,
    this.excessiveVs,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub.on('simTime').handle(() => {
      const filtered = this.lagFilter.step(this.verticalSpeed.get().value, this.props.instrument.deltaTime / 1000);
      this.filteredVerticalSpeed.set(MathUtils.round(filtered, 0.1));
    });
  }

  render(): VNode {
    return (
      <g>
        <path class="TapeBackground" d="m151.84 131.72 4.1301-15.623v-70.556l-4.1301-15.623h-5.5404v101.8z" />

        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.vsFlagVisible}>
          <text class="FontLargest Red EndAlign" x="153.13206" y="77.501472">
            V
          </text>
          <text class="FontLargest Red EndAlign" x="153.13406" y="83.211388">
            /
          </text>
          <text class="FontLargest Red EndAlign" x="152.99374" y="88.870819">
            S
          </text>
        </FlashOneHertz>

        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.tcasInvalid}>
          <text class="FontMedium Amber EndAlign" x="141.5" y="100">
            T
          </text>
          <text class="FontMedium Amber EndAlign" x="141.5" y="105">
            C
          </text>
          <text class="FontMedium Amber EndAlign" x="141.5" y="110">
            A
          </text>
          <text class="FontMedium Amber EndAlign" x="141.5" y="115">
            S
          </text>
        </FlashOneHertz>

        <g
          id="VerticalSpeedGroup"
          visibility={this.vsFlagVisible.map((flagVisible) => (flagVisible ? 'hidden' : 'visible'))}
        >
          <VSpeedTcas
            bus={this.props.bus}
            upRaActive={this.upResolutionAdvisoryActive}
            downRaActive={this.downResolutionAdvisoryActive}
            combinedControl={this.combinedControl}
            vsUpperLimit={this.upperVsLimit}
            vsLowerLimit={this.lowerVsLimit}
          />
          <g class="Fill White">
            <path d="m149.92 54.339v-1.4615h1.9151v1.4615z" />
            <path d="m149.92 44.26v-1.4615h1.9151v1.4615z" />
            <path d="m149.92 34.054v-1.2095h1.9151v1.2095z" />
            <path d="m151.84 107.31h-1.9151v1.4615h1.9151z" />
            <path d="m151.84 117.39h-1.9151v1.4615h1.9151z" />
            <path d="m151.84 127.59h-1.9151v1.2095h1.9151z" />
          </g>
          <g class="SmallStroke White">
            <path d="m149.92 67.216h1.7135h0" />
            <path d="m151.84 48.569h-1.9151h0" />
            <path d="m151.84 38.489h-1.9151h0" />
            <path d="m149.92 94.43h1.7135h0" />
            <path d="m151.84 113.08h-1.9151h0" />
            <path d="m151.84 123.16h-1.9151h0" />
          </g>
          <g class="FontSmallest MiddleAlign Fill White">
            <text x="148.47067" y="109.72845">
              1
            </text>
            <text x="148.24495" y="119.8801">
              2
            </text>
            <text x="148.27068" y="129.90607">
              6
            </text>
            <text x="148.49667" y="55.316456">
              1
            </text>
            <text x="148.26495" y="45.356102">
              2
            </text>
            <text x="148.21367" y="35.195072">
              6
            </text>
          </g>
          <path class="Fill Yellow" d="m145.79 80.067h6.0476v1.5119h-6.0476z" />
          <VSpeedNeedle yOffset={this.needleYOffset} needleColour={this.needleColour} />

          <VSpeedText
            bus={this.props.bus}
            yOffset={this.needleYOffset}
            textColour={this.textColour}
            filteredVs={this.filteredVerticalSpeed}
          />
        </g>
      </g>
    );
  }
}

class VSpeedNeedle extends DisplayComponent<{ yOffset: Subscribable<number>; needleColour: Subscribable<string> }> {
  private indicatorRef = FSComponent.createRef<SVGPathElement>();

  private readonly pathSub = Subject.create('');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const dxFull = 12;
    const dxBorder = 5;
    const centerX = 162.74;
    const centerY = 80.822;

    this.props.yOffset.sub((yOffset) => {
      const path = `m${centerX - dxBorder} ${centerY + (dxBorder / dxFull) * yOffset} l ${dxBorder - dxFull} ${(1 - dxBorder / dxFull) * yOffset}`;

      this.pathSub.set(path);
    }, true);

    this.props.needleColour.sub((colour) => {
      this.indicatorRef.instance.setAttribute('class', `HugeStroke ${colour}`);
    }, true);
  }

  render(): VNode | null {
    return (
      <>
        <path d={this.pathSub} class="HugeOutline" />
        <path d={this.pathSub} ref={this.indicatorRef} id="VSpeedIndicator" />
      </>
    );
  }
}

class VSpeedText extends DisplayComponent<{
  bus: ArincEventBus;
  yOffset: Subscribable<number>;
  textColour: Subscribable<string>;
  filteredVs: Subscribable<number>;
}> {
  private vsTextRef = FSComponent.createRef<SVGTextElement>();

  private groupRef = FSComponent.createRef<SVGGElement>();

  private visibilitySub = Subject.create('hidden');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.filteredVs.sub((vs) => {
      const absVSpeed = Math.abs(vs);

      if (absVSpeed < 200) {
        this.visibilitySub.set('hidden');
      } else {
        this.visibilitySub.set('inherit');
      }

      const sign = Math.sign(vs);

      const textOffset = this.props.yOffset.get() - sign * 2.4;

      const text = (Math.round(absVSpeed / 100) < 10 ? '0' : '') + Math.round(absVSpeed / 100).toString();
      this.vsTextRef.instance.textContent = text;
      this.groupRef.instance.style.transform = `translate3d(0px, ${textOffset}px, 0px)`;
    }, true);

    this.props.textColour.sub((colour) => {
      const className = `FontSmallest MiddleAlign ${colour}`;
      this.vsTextRef.instance.setAttribute('class', className);
    }, true);
  }

  render(): VNode {
    return (
      <g ref={this.groupRef} visibility={this.visibilitySub} id="VSpeedTextGroup">
        <path class="BackgroundFill" d="m158.4 83.011h-7.0514v-4.3989h7.0514z" />
        <text ref={this.vsTextRef} id="VSpeedText" x="155.14055" y="82.554756" />
      </g>
    );
  }
}

function getRedSectorPath(vs: number, isUpperSector: boolean) {
  const dxFull = 10.9;
  const dxBorder = 6.77;
  const centerX = 162.74;
  const centerY = 80.822;

  const yOffset = yPosFromVs(vs);

  const y1 = isUpperSector ? 29.92 : 131.72;
  const y2 = centerY + yOffset;

  const y3 = centerY + (dxBorder / dxFull) * yOffset;
  const y4 = y1;

  const x1 = centerX - dxFull;
  const x2 = centerX - dxBorder;

  return `m${x1},${y1} L${x1},${y2} L${x2},${y3} L${x2},${y4} z`;
}

interface VSpeedTcasProps extends ComponentProps {
  bus: ArincEventBus;
  upRaActive: Subscribable<boolean>;
  downRaActive: Subscribable<boolean>;
  combinedControl: Subscribable<number>;
  vsUpperLimit: Subscribable<number>;
  vsLowerLimit: Subscribable<number>;
}
class VSpeedTcas extends DisplayComponent<VSpeedTcasProps> {
  private readonly upAndDownResolutionAdvisoryActive = MappedSubject.create(
    ([upResolutionAdvisoryActive, downResolutionAdvisoryActive]) =>
      upResolutionAdvisoryActive && downResolutionAdvisoryActive,
    this.props.upRaActive,
    this.props.downRaActive,
  );

  private readonly downCorrectiveResolutionAdvisoryActive = MappedSubject.create(
    ([combinedControl, upAndDownResolutionAdvisoryActive]) =>
      combinedControl == 5 && !upAndDownResolutionAdvisoryActive,
    this.props.combinedControl,
    this.upAndDownResolutionAdvisoryActive,
  );

  private readonly upCorrectiveResolutionAdvisoryActive = MappedSubject.create(
    ([combinedControl, upAndDownResolutionAdvisoryActive]) =>
      combinedControl == 4 && !upAndDownResolutionAdvisoryActive,
    this.props.combinedControl,
    this.upAndDownResolutionAdvisoryActive,
  );

  private readonly upAndDownCorrectiveResolutionAdvisoryActive = MappedSubject.create(
    ([combinedControl, upAndDownResolutionAdvisoryActive]) =>
      (combinedControl == 4 || combinedControl == 5) && upAndDownResolutionAdvisoryActive,
    this.props.combinedControl,
    this.upAndDownResolutionAdvisoryActive,
  );

  private readonly downResolutionAdvsioryZoneVisible = MappedSubject.create(
    ([downRaActive, upDownCorrectiveRaActive]) => downRaActive || upDownCorrectiveRaActive,
    this.props.downRaActive,
    this.upAndDownCorrectiveResolutionAdvisoryActive,
  );

  private readonly upResolutionAdvsioryZoneVisible = MappedSubject.create(
    ([upRaActive, upDownCorrectiveRaActive]) => upRaActive || upDownCorrectiveRaActive,
    this.props.upRaActive,
    this.upAndDownCorrectiveResolutionAdvisoryActive,
  );

  private readonly flyToZoneVisible = MappedSubject.create(
    ([upRaActive, upCorrectiveRaActive, downRaActive, downCorrectiveRaActive, upDownCorrectiveRaActive]) =>
      (upRaActive && upCorrectiveRaActive) || (downRaActive && downCorrectiveRaActive) || upDownCorrectiveRaActive,
    this.props.upRaActive,
    this.upCorrectiveResolutionAdvisoryActive,
    this.props.downRaActive,
    this.downCorrectiveResolutionAdvisoryActive,
    this.upAndDownCorrectiveResolutionAdvisoryActive,
  );

  private readonly tcasIndicationsVisible = MappedSubject.create(
    ([upRaActive, downRaActive]) => upRaActive || downRaActive,
    this.props.upRaActive,
    this.props.downRaActive,
  );

  private readonly downResolutionAdvisoryZonePath = this.props.vsUpperLimit.map((vs) => getRedSectorPath(vs, true));

  private readonly upResolutionAdvisoryZonePath = this.props.vsLowerLimit.map((vs) => getRedSectorPath(vs, false));

  private readonly flyToZonePath = MappedSubject.create(
    ([
      vsUpperLimit,
      vsLowerLimit,
      upRaActive,
      upCorrectiveResolutionAdvisoryActive,
      downRaActive,
      downCorrectiveResolutionAdvisoryActive,
    ]) => {
      const dxFull = 10.9;
      const dxBorder = 6.77;
      const centerX = 162.74;
      const centerY = 80.822;

      const yOffsetForCorrective = 18;

      const upCorrectiveActive = upRaActive && upCorrectiveResolutionAdvisoryActive;
      const downCorrectiveActive = downRaActive && downCorrectiveResolutionAdvisoryActive;

      const upperSectorYOffset = yPosFromVs(vsUpperLimit);
      const lowerSectorYOffset = yPosFromVs(vsLowerLimit);

      let y1: number, y2: number, y3: number, y4: number;

      if (upCorrectiveActive) {
        y1 = centerY + lowerSectorYOffset * (dxBorder / dxFull) - yOffsetForCorrective;
        y4 = y1;
      } else {
        y1 = centerY + upperSectorYOffset;
        y4 = centerY + (dxBorder / dxFull) * upperSectorYOffset;
      }

      if (downCorrectiveActive) {
        y2 = centerY + upperSectorYOffset * (dxBorder / dxFull) + yOffsetForCorrective;
        y3 = y2;
      } else {
        y2 = centerY + lowerSectorYOffset;
        y3 = centerY + (dxBorder / dxFull) * lowerSectorYOffset;
      }

      const x1 = centerX - dxFull;
      const x2 = centerX - dxBorder;

      return `m${x1},${y1} L${x1},${y2} L${x2},${y3} L${x2},${y4} z`;
    },
    this.props.vsUpperLimit,
    this.props.vsLowerLimit,
    this.props.upRaActive,
    this.upCorrectiveResolutionAdvisoryActive,
    this.props.downRaActive,
    this.downCorrectiveResolutionAdvisoryActive,
  );

  render(): VNode {
    return (
      <>
        <g
          id="VerticalSpeedTCASGroup"
          visibility={this.tcasIndicationsVisible.map((visible) => (visible ? 'inherit' : 'hidden'))}
        >
          <rect class="TapeBackground" height="101.8" width="4.1301" y="29.92" x="151.84" />
          <path
            d={this.downResolutionAdvisoryZonePath}
            visibility={this.downResolutionAdvsioryZoneVisible.map((visible) => (visible ? 'inherit' : 'hidden'))}
            class="Fill Red"
          />
          <path
            d={this.upResolutionAdvisoryZonePath}
            visibility={this.upResolutionAdvsioryZoneVisible.map((visible) => (visible ? 'inherit' : 'hidden'))}
            class="Fill Red"
          />
          <path
            d={this.flyToZonePath}
            visibility={this.flyToZoneVisible.map((visible) => (visible ? 'inherit' : 'hidden'))}
            class="Fill Green"
          />
        </g>
      </>
    );
  }
}
