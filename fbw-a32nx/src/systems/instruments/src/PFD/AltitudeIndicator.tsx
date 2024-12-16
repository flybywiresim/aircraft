// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import {
  ArincEventBus,
  Arinc429Register,
  Arinc429Word,
  Arinc429WordData,
  Arinc429RegisterSubject,
  Arinc429LocalVarConsumerSubject,
} from '@flybywiresim/fbw-sdk';
import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';
import { FgBus } from 'instruments/src/PFD/shared/FgBusProvider';

import { PFDSimvars } from './shared/PFDSimvarPublisher';
import { DigitalAltitudeReadout } from './DigitalAltitudeReadout';
import { VerticalTape } from './VerticalTape';
import { Arinc429Values } from './shared/ArincValueProvider';
import { A32NXFwcBusEvents } from '@shared/publishers/A32NXFwcBusPublisher';
import { FlashOneHertz } from 'instruments/src/MsfsAvionicsCommon/FlashingElementUtils';

const DisplayRange = 570;
const ValueSpacing = 100;
const DistanceSpacing = 7.5;

class LandingElevationIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private landingElevationIndicator = FSComponent.createRef<SVGPathElement>();

  private altitude = 0;

  private landingElevation = new Arinc429Word(0);

  private flightPhase = 0;

  private delta = 0;

  private handleLandingElevation() {
    const landingElevationValid =
      !this.landingElevation.isFailureWarning() && !this.landingElevation.isNoComputedData();
    const delta = this.altitude - this.landingElevation.value;
    const offset = ((delta - DisplayRange) * DistanceSpacing) / ValueSpacing;
    this.delta = delta;
    if (delta > DisplayRange || (this.flightPhase !== 7 && this.flightPhase !== 8) || !landingElevationValid) {
      this.landingElevationIndicator.instance.classList.add('HiddenElement');
    } else {
      this.landingElevationIndicator.instance.classList.remove('HiddenElement');
    }
    this.landingElevationIndicator.instance.setAttribute('d', `m130.85 123.56h-13.096v${offset}h13.096z`);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values>();

    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.flightPhase = fp;

        if ((fp !== 7 && fp !== 8) || this.delta > DisplayRange) {
          this.landingElevationIndicator.instance.classList.add('HiddenElement');
        } else {
          this.landingElevationIndicator.instance.classList.remove('HiddenElement');
        }
      });

    sub
      .on('landingElevation')
      .whenChanged()
      .handle((le) => {
        this.landingElevation = le;
        this.handleLandingElevation();
      });

    sub.on('altitudeAr').handle((a) => {
      this.altitude = a.value;
      this.handleLandingElevation();
    });
  }

  render(): VNode {
    return <path ref={this.landingElevationIndicator} id="AltTapeLandingElevation" class="EarthFill" />;
  }
}

class RadioAltIndicator extends DisplayComponent<{ bus: ArincEventBus; filteredRadioAltitude: Subscribable<number> }> {
  private visibilitySub = Subject.create('hidden');

  private offsetSub = Subject.create('');

  private radioAltitude = new Arinc429Word(0);

  private setOffset() {
    if (
      this.props.filteredRadioAltitude.get() > DisplayRange ||
      this.radioAltitude.isFailureWarning() ||
      this.radioAltitude.isNoComputedData()
    ) {
      this.visibilitySub.set('hidden');
    } else {
      this.visibilitySub.set('visible');
      const offset = ((this.props.filteredRadioAltitude.get() - DisplayRange) * DistanceSpacing) / ValueSpacing;
      this.offsetSub.set(`m131.15 123.56h2.8709v${offset}h-2.8709z`);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values>();

    this.props.filteredRadioAltitude.sub((_filteredRadioAltitude) => {
      this.setOffset();
    }, true);

    sub.on('chosenRa').handle((ra) => {
      this.radioAltitude = ra;
      this.setOffset();
    });
  }

  render(): VNode {
    return <path visibility={this.visibilitySub} id="AltTapeGroundReference" class="Fill Red" d={this.offsetSub} />;
  }
}

class MinimumDescentAltitudeIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private visibility = Subject.create('hidden');

  private path = Subject.create('');

  private altitude = 0;

  private radioAltitudeValid = false;

  private qnhLandingAltValid = false;

  private qfeLandingAltValid = false;

  private inLandingPhases = false;

  private fcuEisDiscreteWord2 = new Arinc429Word(0);

  private readonly mda = Arinc429RegisterSubject.createEmpty();

  private landingElevation = new Arinc429Word(0);

  private updateIndication(): void {
    this.qnhLandingAltValid =
      !this.landingElevation.isFailureWarning() &&
      !this.landingElevation.isNoComputedData() &&
      this.inLandingPhases &&
      this.fcuEisDiscreteWord2.bitValueOr(29, false);

    this.qfeLandingAltValid = this.inLandingPhases && !this.fcuEisDiscreteWord2.bitValueOr(29, true);

    const altDelta = this.mda.get().value - this.altitude;

    const showMda =
      (this.radioAltitudeValid || this.qnhLandingAltValid || this.qfeLandingAltValid) &&
      Math.abs(altDelta) <= 570 &&
      !this.mda.get().isFailureWarning() &&
      !this.mda.get().isNoComputedData();

    if (!showMda) {
      this.visibility.set('hidden');
      return;
    }

    const offset = (altDelta * DistanceSpacing) / ValueSpacing;
    this.path.set(`m 127.9276,${80.249604 - offset} h 5.80948 v 1.124908 h -5.80948 z`);
    this.visibility.set('visible');
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values & FcuBus>();

    sub
      .on('chosenRa')
      .whenArinc429SsmChanged()
      .handle((ra) => {
        this.radioAltitudeValid = !ra.isFailureWarning() && !ra.isNoComputedData();
        this.updateIndication();
      });

    sub
      .on('landingElevation')
      .withArinc429Precision(0)
      .handle((landingElevation) => {
        this.landingElevation = landingElevation;
        this.updateIndication();
      });

    sub
      .on('fcuEisDiscreteWord2')
      .whenChanged()
      .handle((m) => {
        this.fcuEisDiscreteWord2 = m;
        this.updateIndication();
      });

    sub
      .on('altitudeAr')
      .withArinc429Precision(0)
      .handle((a) => {
        this.altitude = a.value;
        this.updateIndication();
      });

    this.mda.sub(this.updateIndication.bind(this));

    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.inLandingPhases = fp === 7 || fp === 8;
        this.updateIndication();
      });

    sub.on('fmMdaRaw').handle(this.mda.setWord.bind(this.mda));
  }

  render(): VNode {
    return <path visibility={this.visibility} id="AltTapeMdaIndicator" class="Fill Amber" d={this.path} />;
  }
}

interface AltitudeIndicatorProps {
  bus: ArincEventBus;
}

export class AltitudeIndicator extends DisplayComponent<AltitudeIndicatorProps> {
  private subscribable = Subject.create<number>(0);

  private tapeRef = FSComponent.createRef<HTMLDivElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const pf = this.props.bus.getSubscriber<Arinc429Values>();

    pf.on('altitudeAr').handle((a) => {
      if (a.isNormalOperation()) {
        this.subscribable.set(a.value);
        this.tapeRef.instance.style.display = 'inline';
      } else {
        this.tapeRef.instance.style.display = 'none';
      }
    });
  }

  render(): VNode {
    return (
      <g id="AltitudeTape">
        <AltTapeBackground />
        <LandingElevationIndicator bus={this.props.bus} />
        <g ref={this.tapeRef}>
          <VerticalTape
            displayRange={DisplayRange + 60}
            valueSpacing={ValueSpacing}
            distanceSpacing={DistanceSpacing}
            lowerLimit={-1500}
            upperLimit={50000}
            tapeValue={this.subscribable}
            type="altitude"
          />
        </g>
      </g>
    );
  }
}

class AltTapeBackground extends DisplayComponent<any> {
  render(): VNode {
    return <path id="AltTapeBackground" d="m130.85 123.56h-13.096v-85.473h13.096z" class="TapeBackground" />;
  }
}

interface AltitudeIndicatorOfftapeProps {
  bus: ArincEventBus;
  filteredRadioAltitude: Subscribable<number>;
}

enum TargetAltitudeColor {
  Cyan,
  Magenta,
  White,
}

export class AltitudeIndicatorOfftape extends DisplayComponent<AltitudeIndicatorOfftapeProps> {
  private readonly sub = this.props.bus.getSubscriber<A32NXFwcBusEvents>();

  private readonly fwc1DiscreteWord = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fwc_discrete_word_124_1'),
  );
  private readonly fwc2DiscreteWord = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fwc_discrete_word_124_2'),
  );

  private isCheckAltVisible = MappedSubject.create(
    ([fwc1Word, fwc2Word]) =>
      fwc1Word.bitValue(24) || fwc1Word.bitValue(25) || fwc2Word.bitValue(24) || fwc2Word.bitValue(25),
    this.fwc1DiscreteWord,
    this.fwc2DiscreteWord,
  );

  private abnormal = FSComponent.createRef<SVGGElement>();

  private readonly altFlagVisible = Subject.create(false);

  private readonly tcasFailed = ConsumerSubject.create(null, false);

  private normal = FSComponent.createRef<SVGGElement>();

  private altitude = Subject.create(0);

  private fcuSelectedAlt = new Arinc429Word(0);

  private altConstraint = new Arinc429Word(0);

  private fmgcDiscreteWord1 = new Arinc429Word(0);

  private fmgcDiscreteWord4 = new Arinc429Word(0);

  private shownTargetAltitude = Subject.create<Arinc429Word>(new Arinc429Word(0));

  private targetAltitudeColor = Subject.create<TargetAltitudeColor>(TargetAltitudeColor.Cyan);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & FgBus & FcuBus>();

    sub.on('altitudeAr').handle((altitude) => {
      if (!altitude.isNormalOperation()) {
        this.normal.instance.style.display = 'none';
        this.abnormal.instance.removeAttribute('style');
      } else {
        this.altitude.set(altitude.value);
        this.abnormal.instance.style.display = 'none';
        this.normal.instance.removeAttribute('style');
      }
      this.altFlagVisible.set(!altitude.isNormalOperation());
    });

    this.tcasFailed.setConsumer(sub.on('tcasFail'));

    sub
      .on('fmgcDiscreteWord1')
      .whenChanged()
      .handle((v) => {
        this.fmgcDiscreteWord1 = v;
        this.handleAltManagedChange();
      });

    sub
      .on('fmgcDiscreteWord4')
      .whenChanged()
      .handle((v) => {
        this.fmgcDiscreteWord4 = v;
        this.handleAltManagedChange();
      });

    sub
      .on('fcuSelectedAltitude')
      .whenChanged()
      .handle((alt) => {
        this.fcuSelectedAlt = alt;
        this.handleAltManagedChange();
      });

    sub
      .on('fmgcFmAltitudeConstraint')
      .whenChanged()
      .handle((cstr) => {
        this.altConstraint = cstr;
        this.handleAltManagedChange();
      });
  }

  render(): VNode {
    return (
      <>
        <g ref={this.abnormal} style="display: none">
          <path id="AltTapeOutline" class="NormalStroke Red" d="m117.75 123.56h13.096v-85.473h-13.096" />
          <path id="AltReadoutBackground" class="BlackFill" d="m131.35 85.308h-13.63v-8.9706h13.63z" />
          <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.altFlagVisible}>
            <text id="AltFailText" class="FontLargest Red EndAlign" x="131.16769" y="83.433167">
              ALT
            </text>
          </FlashOneHertz>
        </g>
        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.tcasFailed}>
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
        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.isCheckAltVisible}>
          <g
            id="CheckAltWarning"
            class={{
              FontSmall: true,
              MiddleAlign: true,
            }}
          >
            <text class="Amber" x="133.7" y="43.6">
              C
            </text>
            <text class="Amber" x="133.7" y="47.85">
              H
            </text>
            <text class="Amber" x="133.7" y="52.1">
              E
            </text>
            <text class="Amber" x="133.7" y="56.35">
              C
            </text>
            <text class="Amber" x="133.7" y="60.6">
              K
            </text>
            <text class="Amber" x="137.8" y="64.3">
              A
            </text>
            <text class="Amber" x="137.8" y="68.55">
              L
            </text>
            <text class="Amber" x="137.8" y="72.8">
              T
            </text>
          </g>
        </FlashOneHertz>
        <g ref={this.normal} style="display: none">
          <path
            id="AltTapeOutline"
            class="NormalStroke White"
            d="m117.75 123.56h17.83m-4.7345-85.473v85.473m-13.096-85.473h17.83"
          />
          <MinimumDescentAltitudeIndicator bus={this.props.bus} />
          <SelectedAltIndicator
            bus={this.props.bus}
            selectedAltitude={this.shownTargetAltitude}
            altitudeColor={this.targetAltitudeColor}
          />
          <AltimeterIndicator bus={this.props.bus} altitude={this.altitude} />
          <MetricAltIndicator
            bus={this.props.bus}
            targetAlt={this.shownTargetAltitude}
            altitudeColor={this.targetAltitudeColor}
          />
          <path
            id="AltReadoutBackground"
            class="BlackFill"
            d="m130.85 85.308h-13.13v-8.9706h13.13v-2.671h8.8647v14.313h-8.8647z"
          />
          <RadioAltIndicator bus={this.props.bus} filteredRadioAltitude={this.props.filteredRadioAltitude} />
          <DigitalAltitudeReadout bus={this.props.bus} />
        </g>
      </>
    );
  }

  private handleAltManagedChange() {
    const landTrackActive = this.fmgcDiscreteWord4.bitValueOr(14, false);
    const gsActive = this.fmgcDiscreteWord1.bitValueOr(22, false);
    const finalDesActive = this.fmgcDiscreteWord1.bitValueOr(23, false);

    const selectedAltIgnored = landTrackActive || gsActive || finalDesActive;

    const targetAltIsSelected =
      selectedAltIgnored || this.altConstraint.isFailureWarning() || this.altConstraint.isNoComputedData();

    this.shownTargetAltitude.set(targetAltIsSelected ? this.fcuSelectedAlt : this.altConstraint);

    if (selectedAltIgnored) {
      this.targetAltitudeColor.set(TargetAltitudeColor.White);
    } else if (targetAltIsSelected) {
      this.targetAltitudeColor.set(TargetAltitudeColor.Cyan);
    } else {
      this.targetAltitudeColor.set(TargetAltitudeColor.Magenta);
    }
  }
}

interface SelectedAltIndicatorProps {
  bus: ArincEventBus;
  selectedAltitude: Subscribable<Arinc429Word>;
  altitudeColor: Subscribable<TargetAltitudeColor>;
}

class SelectedAltIndicator extends DisplayComponent<SelectedAltIndicatorProps> {
  private baroInStd = false;

  private selectedAltLowerText = FSComponent.createRef<SVGTextElement>();

  private selectedAltLowerFLText = FSComponent.createRef<SVGTextElement>();

  private selectedAltUpperText = FSComponent.createRef<SVGTextElement>();

  private selectedAltUpperFLText = FSComponent.createRef<SVGTextElement>();

  private selectedAltLowerGroupRef = FSComponent.createRef<SVGGElement>();

  private selectedAltUpperGroupRef = FSComponent.createRef<SVGGElement>();

  private readonly selectedAltFailed = Subject.create(false);

  private targetGroupRef = FSComponent.createRef<SVGGElement>();

  private blackFill = FSComponent.createRef<SVGPathElement>();

  private targetSymbolRef = FSComponent.createRef<SVGPathElement>();

  private altTapeTargetText = FSComponent.createRef<SVGTextElement>();

  private altitude = new Arinc429Word(0);

  private shownTargetAltitude = new Arinc429Word(0);

  private textSub = Subject.create('');

  private updateAltitudeColor(color: TargetAltitudeColor) {
    this.selectedAltLowerFLText.instance.classList.toggle('Cyan', color === TargetAltitudeColor.Cyan);
    this.selectedAltLowerFLText.instance.classList.toggle('Magenta', color === TargetAltitudeColor.Magenta);
    this.selectedAltLowerFLText.instance.classList.toggle('White', color === TargetAltitudeColor.White);

    this.selectedAltLowerText.instance.classList.toggle('Cyan', color === TargetAltitudeColor.Cyan);
    this.selectedAltLowerText.instance.classList.toggle('Magenta', color === TargetAltitudeColor.Magenta);
    this.selectedAltLowerText.instance.classList.toggle('White', color === TargetAltitudeColor.White);

    this.selectedAltUpperFLText.instance.classList.toggle('Cyan', color === TargetAltitudeColor.Cyan);
    this.selectedAltUpperFLText.instance.classList.toggle('Magenta', color === TargetAltitudeColor.Magenta);
    this.selectedAltUpperFLText.instance.classList.toggle('White', color === TargetAltitudeColor.White);

    this.selectedAltUpperText.instance.classList.toggle('Cyan', color === TargetAltitudeColor.Cyan);
    this.selectedAltUpperText.instance.classList.toggle('Magenta', color === TargetAltitudeColor.Magenta);
    this.selectedAltUpperText.instance.classList.toggle('White', color === TargetAltitudeColor.White);

    this.altTapeTargetText.instance.classList.toggle('Cyan', color === TargetAltitudeColor.Cyan);
    this.altTapeTargetText.instance.classList.toggle('Magenta', color === TargetAltitudeColor.Magenta);
    this.altTapeTargetText.instance.classList.toggle('White', color === TargetAltitudeColor.White);

    this.targetSymbolRef.instance.classList.toggle('Cyan', color === TargetAltitudeColor.Cyan);
    this.targetSymbolRef.instance.classList.toggle('Magenta', color === TargetAltitudeColor.Magenta);
    this.targetSymbolRef.instance.classList.toggle('White', color === TargetAltitudeColor.White);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values & FcuBus>();

    sub
      .on('altitudeAr')
      .withArinc429Precision(2)
      .handle((a) => {
        this.altitude = a;
        this.handleAltitudeDisplay();
        this.getOffset();
      });

    sub
      .on('fcuEisDiscreteWord2')
      .whenChanged()
      .handle((m) => {
        this.baroInStd = m.bitValueOr(28, false) || m.isFailureWarning();

        if (this.baroInStd) {
          this.selectedAltLowerFLText.instance.style.visibility = 'visible';
          this.selectedAltUpperFLText.instance.style.visibility = 'visible';
        } else {
          this.selectedAltLowerFLText.instance.style.visibility = 'hidden';
          this.selectedAltUpperFLText.instance.style.visibility = 'hidden';
        }
        this.handleAltitudeDisplay();
        this.setText();
      });

    this.props.altitudeColor.sub((color) => {
      this.updateAltitudeColor(color);
    });

    this.props.selectedAltitude.sub((alt) => {
      this.shownTargetAltitude = alt;
      this.getOffset();
      this.handleAltitudeDisplay();
      this.setText();
    });
  }

  private handleAltitudeDisplay() {
    if (this.shownTargetAltitude.isNoComputedData() || this.shownTargetAltitude.isFailureWarning()) {
      this.selectedAltUpperGroupRef.instance.style.display = 'none';
      this.selectedAltLowerGroupRef.instance.style.display = 'none';
      this.targetGroupRef.instance.style.display = 'none';
      this.selectedAltFailed.set(true);
    } else if (this.altitude.value - this.shownTargetAltitude.value > DisplayRange) {
      this.selectedAltLowerGroupRef.instance.style.display = 'block';
      this.selectedAltUpperGroupRef.instance.style.display = 'none';
      this.targetGroupRef.instance.style.display = 'none';
      this.selectedAltFailed.set(false);
    } else if (this.altitude.value - this.shownTargetAltitude.value < -DisplayRange) {
      this.targetGroupRef.instance.style.display = 'none';
      this.selectedAltUpperGroupRef.instance.style.display = 'block';
      this.selectedAltLowerGroupRef.instance.style.display = 'none';
      this.selectedAltFailed.set(false);
    } else {
      this.selectedAltUpperGroupRef.instance.style.display = 'none';
      this.selectedAltLowerGroupRef.instance.style.display = 'none';
      this.targetGroupRef.instance.style.display = 'inline';
      this.selectedAltFailed.set(false);
    }
  }

  private setText() {
    let boxLength = 19.14;
    let text = '0';
    if (this.baroInStd) {
      text = Math.round(this.shownTargetAltitude.value / 100)
        .toString()
        .padStart(3, '0');
      boxLength = 12.5;
    } else {
      text = Math.round(this.shownTargetAltitude.value).toString().padStart(5, ' ');
    }
    this.textSub.set(text);
    this.blackFill.instance.setAttribute('d', `m117.75 77.784h${boxLength}v6.0476h-${boxLength}z`);
  }

  private getOffset() {
    const offset = ((this.altitude.value - this.shownTargetAltitude.value) * DistanceSpacing) / ValueSpacing;
    this.targetGroupRef.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
  }

  render(): VNode | null {
    return (
      <>
        <g id="SelectedAltLowerGroup" ref={this.selectedAltLowerGroupRef}>
          <text
            id="SelectedAltLowerText"
            ref={this.selectedAltLowerText}
            class="FontMedium EndAlign Cyan"
            x="135.7511"
            y="128.70299"
            style="white-space: pre"
          >
            {this.textSub}
          </text>
          <text
            id="SelectedAltLowerFLText"
            ref={this.selectedAltLowerFLText}
            class="FontSmall MiddleAlign Cyan"
            x="120.87094"
            y="128.71681"
          >
            FL
          </text>
        </g>
        <g id="SelectedAltUpperGroup" ref={this.selectedAltUpperGroupRef}>
          <text
            id="SelectedAltUpperText"
            ref={this.selectedAltUpperText}
            class="FontMedium EndAlign Cyan"
            x="136.22987"
            y="37.250134"
            style="white-space: pre"
          >
            {this.textSub}
          </text>
          <text
            id="SelectedAltUpperFLText"
            ref={this.selectedAltUpperFLText}
            class="FontSmall MiddleAlign Cyan"
            x="120.85925"
            y="37.125755"
          >
            FL
          </text>
        </g>
        <g id="AltTapeTargetSymbol" ref={this.targetGroupRef}>
          <path class="BlackFill" ref={this.blackFill} />
          <path
            class="NormalStroke Cyan"
            ref={this.targetSymbolRef}
            d="m122.79 83.831v6.5516h-7.0514v-8.5675l2.0147-1.0079m4.8441-3.0238v-6.5516h-6.8588v8.5675l2.0147 1.0079"
          />
          <text
            id="AltTapeTargetText"
            ref={this.altTapeTargetText}
            class="FontMedium StartAlign Cyan"
            x="118.228"
            y="83.067062"
            style="white-space: pre"
          >
            {this.textSub}
          </text>
        </g>
        <FlashOneHertz bus={this.props.bus} flashDuration={9} visible={this.selectedAltFailed}>
          <text id="SelectedAltUpperText" class="FontSmall EndAlign Red" x="136.22987" y="37.250134">
            ALT SEL
          </text>
        </FlashOneHertz>
      </>
    );
  }
}

interface AltimeterIndicatorProps {
  altitude: Subscribable<number>;
  bus: ArincEventBus;
}

class AltimeterIndicator extends DisplayComponent<AltimeterIndicatorProps> {
  private mode = Subject.create('');

  private text = Subject.create('');

  private readonly shouldFlash = Subject.create(false);

  private baroInhg = new Arinc429Word(0);

  private baroHpa = new Arinc429Word(0);

  private baroInInhg = false;

  private baroInStd = false;

  private baroInQnh = false;

  private transAltAr = Arinc429Register.empty();

  private transLvlAr = Arinc429Register.empty();

  private flightPhase = 0;

  private stdVisible = Subject.create(false);

  private altiSettingVisible = Subject.create(false);

  private qfeBorderHidden = Subject.create(true);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & PFDSimvars & FcuBus>();

    sub
      .on('fcuEisDiscreteWord1')
      .whenChanged()
      .handle((word) => {
        this.baroInInhg = word.bitValueOr(11, false);

        this.getText();
      });

    sub
      .on('fcuEisDiscreteWord2')
      .whenChanged()
      .handle((word) => {
        this.baroInStd = word.bitValueOr(28, false) || word.isFailureWarning();
        this.baroInQnh = word.bitValueOr(29, false);

        this.getText();
      });

    sub
      .on('fmgcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.flightPhase = fp;

        this.handleBlink();
      });

    sub
      .on('fmTransAltRaw')
      .whenChanged()
      .handle((ta) => {
        this.transAltAr.set(ta);

        this.getText();
        this.handleBlink();
      });

    sub
      .on('fmTransLvlRaw')
      .whenChanged()
      .handle((tl) => {
        this.transLvlAr.set(tl);

        this.getText();
        this.handleBlink();
      });

    sub
      .on('fcuEisBaro')
      .whenChanged()
      .handle((p) => {
        this.baroInhg = p;
        this.getText();
      });

    sub
      .on('fcuEisBaroHpa')
      .whenChanged()
      .handle((p) => {
        this.baroHpa = p;
        this.getText();
      });

    this.props.altitude.sub((_a) => {
      this.handleBlink();
    });
  }

  private handleBlink() {
    if (this.mode.get() === 'STD') {
      if (
        this.flightPhase > 3 &&
        this.transLvlAr.isNormalOperation() &&
        100 * this.transLvlAr.value > this.props.altitude.get()
      ) {
        this.shouldFlash.set(true);
      } else {
        this.shouldFlash.set(false);
      }
    } else if (
      this.flightPhase <= 3 &&
      this.transAltAr.isNormalOperation() &&
      this.transAltAr.value < this.props.altitude.get()
    ) {
      this.shouldFlash.set(true);
    } else {
      this.shouldFlash.set(false);
    }
  }

  private getText() {
    if (this.baroInStd) {
      this.mode.set('STD');
    } else if (this.baroInQnh) {
      this.mode.set('QNH');
    } else {
      this.mode.set('QFE');
    }

    this.stdVisible.set(this.baroInStd);
    this.altiSettingVisible.set(!this.baroInStd);
    this.qfeBorderHidden.set(this.baroInStd || this.baroInQnh);

    if (!this.baroInInhg) {
      this.text.set(Math.round(this.baroHpa.value).toString());
    } else {
      this.text.set(this.baroInhg.value.toFixed(2));
    }
  }

  render(): VNode {
    return (
      <>
        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={Infinity}
          flashing={this.shouldFlash}
          visible={this.stdVisible}
        >
          <g id="STDAltimeterModeGroup">
            <path class="NormalStroke Yellow" d="m124.79 131.74h13.096v7.0556h-13.096z" />
            <text class="FontMedium Cyan AlignLeft" x="125.75785" y="137.36">
              STD
            </text>
          </g>
        </FlashOneHertz>

        <FlashOneHertz
          bus={this.props.bus}
          flashDuration={Infinity}
          flashing={this.shouldFlash}
          visible={this.altiSettingVisible}
        >
          <g id="AltimeterGroup">
            <path
              class={{
                NormalStroke: true,
                White: true,
                HiddenElement: this.qfeBorderHidden,
              }}
              d="m 116.83686,133.0668 h 13.93811 v 5.8933 h -13.93811 z"
            />
            <text id="AltimeterModeText" class="FontMedium White" x="118.23066" y="138.11342">
              {this.mode}
            </text>
            <text id="AltimeterSettingText" class="FontMedium MiddleAlign Cyan" x="141.25583" y="138.09006">
              {this.text}
            </text>
          </g>
        </FlashOneHertz>
      </>
    );
  }
}

interface MetricAltIndicatorState {
  altitude: Arinc429WordData;
  targetAlt: Arinc429WordData;
  altitudeColor: TargetAltitudeColor;
  fcuDiscreteWord1: Arinc429Word;
}

interface MetricAltIndicatorProps {
  bus: ArincEventBus;
  targetAlt: Subscribable<Arinc429Word>;
  altitudeColor: Subscribable<TargetAltitudeColor>;
}

class MetricAltIndicator extends DisplayComponent<MetricAltIndicatorProps> {
  private needsUpdate = false;

  private metricAlt = FSComponent.createRef<SVGGElement>();

  private metricTargetAlt = FSComponent.createRef<SVGGElement>();

  private metricAltText = FSComponent.createRef<SVGTextElement>();

  private metricAltTargetText = FSComponent.createRef<SVGTextElement>();

  private readonly mda = Arinc429RegisterSubject.createEmpty();

  // FIXME remove this weird pattern... the state of the component belongs directly to the component
  private state: MetricAltIndicatorState = {
    altitude: new Arinc429Word(0),
    altitudeColor: TargetAltitudeColor.Cyan,
    targetAlt: new Arinc429Word(0),
    fcuDiscreteWord1: new Arinc429Word(0),
  };

  private fmgcDiscreteWord1 = new Arinc429Word(0);

  private fmgcDiscreteWord4 = new Arinc429Word(0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values & ClockEvents & FcuBus & FgBus>();

    this.mda.sub(() => (this.needsUpdate = true));

    sub.on('altitudeAr').handle((a) => {
      this.state.altitude = a;
      this.needsUpdate = true;
    });

    this.props.altitudeColor.sub((color) => {
      this.state.altitudeColor = color;
      this.needsUpdate = true;
    });

    this.props.targetAlt.sub((alt) => {
      this.state.targetAlt = alt;
      this.needsUpdate = true;
    });

    sub
      .on('fcuDiscreteWord1')
      .whenChanged()
      .handle((m) => {
        this.state.fcuDiscreteWord1 = m;
        this.needsUpdate = true;
      });

    sub.on('fmMdaRaw').handle(this.mda.setWord.bind(this.mda));

    sub
      .on('fmgcDiscreteWord1')
      .whenChanged()
      .handle((v) => {
        this.fmgcDiscreteWord1 = v;
        this.needsUpdate = true;
      });

    sub
      .on('fmgcDiscreteWord4')
      .whenChanged()
      .handle((v) => {
        this.fmgcDiscreteWord4 = v;
        this.needsUpdate = true;
      });

    sub.on('realTime').handle(this.updateState.bind(this));
  }

  private updateAltitudeColor() {
    this.metricAltTargetText.instance.classList.toggle('Cyan', this.state.altitudeColor === TargetAltitudeColor.Cyan);
    this.metricAltTargetText.instance.classList.toggle(
      'Magenta',
      this.state.altitudeColor === TargetAltitudeColor.Magenta,
    );
    this.metricAltTargetText.instance.classList.toggle('White', this.state.altitudeColor === TargetAltitudeColor.White);
  }

  private updateState(_time: number) {
    if (this.needsUpdate) {
      this.needsUpdate = false;

      const showMetricAlt =
        this.state.fcuDiscreteWord1.bitValueOr(20, false) &&
        !this.state.targetAlt.isFailureWarning() &&
        !this.state.targetAlt.isNoComputedData();
      if (!showMetricAlt) {
        this.metricAlt.instance.style.display = 'none';
      } else {
        this.metricAlt.instance.style.display = 'inline';
        const currentMetricAlt = Math.round((this.state.altitude.value * 0.3048) / 10) * 10;
        this.metricAltText.instance.textContent = currentMetricAlt.toString();

        const targetMetric = Math.round((this.state.targetAlt.value * 0.3048) / 10) * 10;
        this.metricAltTargetText.instance.textContent = targetMetric.toString();

        this.updateAltitudeColor();

        if (
          !this.mda.get().isNoComputedData() &&
          !this.mda.get().isFailureWarning() &&
          this.state.altitude.value < this.mda.get().value
        ) {
          this.metricAltText.instance.classList.replace('Green', 'Amber');
        } else {
          this.metricAltText.instance.classList.replace('Amber', 'Green');
        }
      }
    }
  }

  render(): VNode {
    return (
      <g id="MetricAltGroup" ref={this.metricAlt}>
        <path class="NormalStroke Yellow" d="m116.56 140.22h29.213v7.0556h-29.213z" />
        <text class="FontMedium Cyan MiddleAlign" x="142.03537" y="145.8689">
          M
        </text>
        <text
          ref={this.metricAltText}
          id="MetricAltText"
          class="FontMedium Green MiddleAlign"
          x="128.64708"
          y="145.86191"
        >
          0
        </text>
        <g id="MetricAltTargetGroup">
          <text
            id="MetricAltTargetText"
            ref={this.metricAltTargetText}
            class="FontSmallest Cyan MiddleAlign"
            x="94.088852"
            y="37.926617"
          >
            0
          </text>
          <text class="FontSmallest Cyan MiddleAlign" x="105.25774" y="37.872921">
            M
          </text>
        </g>
      </g>
    );
  }
}
