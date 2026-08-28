// @ts-strict-ignore
import {
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
import {
  Arinc429ConsumerSubject,
  Arinc429LocalVarConsumerSubject,
  Arinc429Register,
  Arinc429RegisterSubject,
  Arinc429Word,
  ArincEventBus,
} from '@flybywiresim/fbw-sdk';
import { PFDSimvars } from './shared/PFDSimvarPublisher';
import { DigitalAltitudeReadout } from './DigitalAltitudeReadout';
import { VerticalTape } from './VerticalTape';
import { Arinc429Values } from './shared/ArincValueProvider';
import { FmgcFlightPhase } from '@shared/flightphase';
import { FcuEfisCpBusEvents } from '@shared/publishers/EfisCpBusPublisher';
import { getDisplayIndex } from './PFD';
import { PrimFgBusBaseEvents } from '@shared/publishers/PrimFgPublisher';
import { FlashOneHertz } from '../MsfsAvionicsCommon/FlashingElementUtils';

const DisplayRange = 600;
const ValueSpacing = 100;
const DistanceSpacing = 7.5;

class LandingElevationIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly altitude = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('altitudeAr'),
  );

  private landingElevationIndicator = FSComponent.createRef<SVGPathElement>();

  private landingElevation = new Arinc429Word(0);

  private flightPhase = 0;

  private delta = 0;

  private handleLandingElevation() {
    const landingElevationValid =
      !this.landingElevation.isFailureWarning() && !this.landingElevation.isNoComputedData();
    const delta = this.altitude.get().value - this.landingElevation.value;
    const offset = ((delta - DisplayRange) * DistanceSpacing) / ValueSpacing;
    this.delta = delta;
    if (delta > DisplayRange || (this.flightPhase !== 9 && this.flightPhase !== 10) || !landingElevationValid) {
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

        if ((fp !== 9 && fp !== 10) || this.delta > DisplayRange) {
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

    this.altitude.sub(() => this.handleLandingElevation.bind(this), true);
  }

  render(): VNode {
    return <path ref={this.landingElevationIndicator} id="AltTapeLandingElevation" class="EarthFill" />;
  }
}

class RadioAltIndicator extends DisplayComponent<{ bus: EventBus; filteredRadioAltitude: Subscribable<number> }> {
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
  private readonly sub = this.props.bus.getSubscriber<FcuEfisCpBusEvents>();

  private readonly altitude = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('altitudeAr'),
  );

  private visibility = Subject.create('hidden');

  private path = Subject.create('');

  private radioAltitudeValid = false;

  private qnhLandingAltValid = false;

  private qfeLandingAltValid = false;

  private inLandingPhases = false;

  private readonly fcuEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(null);

  private readonly mda = Arinc429RegisterSubject.createEmpty();

  private landingElevation = new Arinc429Word(0);

  private updateIndication(): void {
    const isQnh = this.fcuEisDiscreteWord2.get().bitValueOr(12, false);
    const isQfe = !isQnh && !this.fcuEisDiscreteWord2.get().bitValueOr(11, true);

    this.qnhLandingAltValid =
      !this.landingElevation.isFailureWarning() &&
      !this.landingElevation.isNoComputedData() &&
      this.inLandingPhases &&
      isQnh;

    this.qfeLandingAltValid = this.inLandingPhases && isQfe;

    const altDelta = this.mda.get().value - this.altitude.get().value;

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

    const isFo = getDisplayIndex() === 2;
    this.fcuEisDiscreteWord2.setConsumer(
      this.sub.on(isFo ? 'fcu_efis_r_discrete_word_2' : 'fcu_efis_l_discrete_word_2'),
    );

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values>();

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

    this.altitude.sub(this.updateIndication.bind(this), true);

    this.mda.sub(this.updateIndication.bind(this));
    this.fcuEisDiscreteWord2.sub(this.updateIndication.bind(this));

    sub
      .on('fwcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.inLandingPhases = fp === 9 || fp === 10;
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
  private readonly altitude = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('altitudeAr'),
  );

  render(): VNode {
    return (
      <g id="AltitudeTape">
        <AltTapeBackground />
        <LandingElevationIndicator bus={this.props.bus} />
        <g
          style={{
            display: this.altitude.map((v) => (v.isNormalOperation() || v.isFunctionalTest() ? 'inline' : 'none')),
          }}
        >
          <VerticalTape
            displayRange={DisplayRange + 30}
            valueSpacing={ValueSpacing}
            distanceSpacing={DistanceSpacing}
            lowerLimit={-1500}
            upperLimit={50000}
            tapeValue={this.altitude.map((v) => v.value)}
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
  private readonly sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents & Arinc429Values>();

  private readonly altitude = Arinc429ConsumerSubject.create(this.sub.on('altitudeAr'));

  private readonly altFlagVisible = this.altitude.map((v) => !v.isNormalOperation() && !v.isFunctionalTest());

  private readonly selectedAlt = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_selected_altitude'));

  private readonly altConstraint = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fm_alt_constraint'));

  private readonly fgDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_1'));

  private readonly fgDiscreteWord3 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_3'));

  private readonly selectedAltIgnored = MappedSubject.create(
    ([fgDiscreteWord1, fgDiscreteWord3]) => {
      const landTrackActive = fgDiscreteWord1.bitValueOr(23, false);
      const gsCaptActive = fgDiscreteWord3.bitValueOr(21, false);
      const gsTrkActive = fgDiscreteWord3.bitValueOr(22, false);
      const finalDesActive = fgDiscreteWord3.bitValueOr(23, false);

      return landTrackActive || gsCaptActive || gsTrkActive || finalDesActive;
    },
    this.fgDiscreteWord1,
    this.fgDiscreteWord3,
  );

  private readonly useAltConstraint = MappedSubject.create(
    ([altConstraint, selectedAltIgnored]) =>
      !(selectedAltIgnored || altConstraint.isFailureWarning() || altConstraint.isNoComputedData()),
    this.altConstraint,
    this.selectedAltIgnored,
  );

  private readonly shownTargetAltitude = Arinc429RegisterSubject.createEmpty();

  private readonly selectedAltPipe = this.selectedAlt.pipe(this.shownTargetAltitude, false);
  private readonly altConstraintPipe = this.altConstraint.pipe(this.shownTargetAltitude, true);

  private readonly selectedAltColor = MappedSubject.create(
    ([useAltConstraint, selectedAltIgnored]) => {
      if (selectedAltIgnored) {
        return TargetAltitudeColor.White;
      } else if (useAltConstraint) {
        return TargetAltitudeColor.Magenta;
      } else {
        return TargetAltitudeColor.Cyan;
      }
    },
    this.useAltConstraint,
    this.selectedAltIgnored,
  );

  private tcasFailed = FSComponent.createRef<SVGGElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.useAltConstraint.sub((useAltConstraint) => {
      if (useAltConstraint) {
        this.selectedAltPipe.pause();
        this.altConstraintPipe.resume();
      } else {
        this.selectedAltPipe.resume();
        this.altConstraintPipe.pause();
      }
    }, true);

    const sub = this.props.bus.getSubscriber<PFDSimvars>();

    sub
      .on('tcasFail')
      .whenChanged()
      .handle((tcasFailed) => {
        if (tcasFailed) {
          this.tcasFailed.instance.style.display = 'inline';
        } else {
          this.tcasFailed.instance.style.display = 'none';
        }
      });
  }

  render(): VNode {
    return (
      <>
        <g style={{ display: this.altFlagVisible.map((v) => (v ? 'inherit' : 'none')) }}>
          <path id="AltTapeOutlineUpper" class="NormalStroke Red" d="m 117.75,38.09 h 13.10 6.73" />
          <path id="AltTapeOutlineLower" class="NormalStroke Red" d="m 117.75,123.56 h 13.10 6.73" />
          <path id="AltReadoutBackground" class="BlackFill" d="m131.35 85.308h-13.63v-8.9706h13.63z" />
          <text id="AltFailText" class="Blink9Seconds FontLargest Red EndAlign" x="131.16769" y="83.433167">
            ALT
          </text>
        </g>
        <g ref={this.tcasFailed} style="display: none">
          <text class="Blink9Seconds FontLargest Amber EndAlign" x="141.5" y="96">
            T
          </text>
          <text class="Blink9Seconds FontLargest Amber EndAlign" x="141.5" y="104">
            C
          </text>
          <text class="Blink9Seconds FontLargest Amber EndAlign" x="141.5" y="112">
            A
          </text>
          <text class="Blink9Seconds FontLargest Amber EndAlign" x="141.5" y="120">
            S
          </text>
        </g>
        <g style={{ display: this.altFlagVisible.map((v) => (v ? 'none' : 'inherit')) }}>
          <path id="AltTapeOutlineUpper" class="NormalStroke White" d="m 117.75,38.09 h 13.10 6.73" />
          <path id="AltTapeOutlineLower" class="NormalStroke White" d="m 117.75,123.56 h 13.10 6.73" />
          <MinimumDescentAltitudeIndicator bus={this.props.bus} />
          <SelectedAltIndicator
            bus={this.props.bus}
            targetAlt={this.shownTargetAltitude}
            targetAltColor={this.selectedAltColor}
          />
          <AltimeterIndicator bus={this.props.bus} altitude={this.altitude.map((v) => v.value)} />
          <MetricAltIndicator
            bus={this.props.bus}
            targetAlt={this.shownTargetAltitude}
            targetAltColor={this.selectedAltColor}
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
}

interface SelectedAltIndicatorProps {
  bus: ArincEventBus;
  targetAlt: Arinc429RegisterSubject;
  targetAltColor: Subscribable<TargetAltitudeColor>;
}

class SelectedAltIndicator extends DisplayComponent<SelectedAltIndicatorProps> {
  private readonly sub = this.props.bus.getSubscriber<FcuEfisCpBusEvents & PrimFgBusBaseEvents>();

  private readonly altitude = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('altitudeAr'),
  );

  private readonly fcuEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(null);

  private selectedAltLowerGroupRef = FSComponent.createRef<SVGGElement>();

  private selectedAltLowerText = FSComponent.createRef<SVGTextElement>();

  private selectedAltLowerFLText = FSComponent.createRef<SVGTextElement>();

  private selectedAltUpperGroupRef = FSComponent.createRef<SVGGElement>();

  private selectedAltUpperText = FSComponent.createRef<SVGTextElement>();

  private selectedAltUpperFLText = FSComponent.createRef<SVGTextElement>();

  private readonly selectedAltFailed = Subject.create(false);

  private targetGroupRef = FSComponent.createRef<SVGGElement>();

  private blackFill = FSComponent.createRef<SVGPathElement>();

  private targetSymbolRef = FSComponent.createRef<SVGPathElement>();

  private altTapeTargetText = FSComponent.createRef<SVGTextElement>();

  private shownTargetAltitude = Arinc429Register.empty();

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

    const isFo = getDisplayIndex() === 2;
    this.fcuEisDiscreteWord2.setConsumer(
      this.sub.on(isFo ? 'fcu_efis_r_discrete_word_2' : 'fcu_efis_l_discrete_word_2'),
    );

    this.props.targetAltColor.sub((targetAltColor) => {
      this.updateAltitudeColor(targetAltColor);
    }, true);

    this.props.targetAlt.sub((targetAlt) => {
      this.shownTargetAltitude.set(targetAlt.rawWord);

      this.getOffset();
      this.handleAltitudeDisplay();
      this.setText();
    }, true);

    this.altitude.sub(() => {
      this.handleAltitudeDisplay();
      this.getOffset();
    }, true);

    this.fcuEisDiscreteWord2.sub(() => {
      const isStd = this.fcuEisDiscreteWord2.get().bitValueOr(11, true);

      if (isStd) {
        this.selectedAltLowerFLText.instance.style.visibility = 'visible';
        this.selectedAltUpperFLText.instance.style.visibility = 'visible';
      } else {
        this.selectedAltLowerFLText.instance.style.visibility = 'hidden';
        this.selectedAltUpperFLText.instance.style.visibility = 'hidden';
      }

      this.handleAltitudeDisplay();
      this.setText();
    }, true);
  }

  private handleAltitudeDisplay() {
    if (this.shownTargetAltitude.isNoComputedData() || this.shownTargetAltitude.isFailureWarning()) {
      this.selectedAltUpperGroupRef.instance.style.display = 'none';
      this.selectedAltLowerGroupRef.instance.style.display = 'none';
      this.targetGroupRef.instance.style.display = 'none';
      this.selectedAltFailed.set(true);
    } else if (this.altitude.get().value - this.shownTargetAltitude.value > DisplayRange) {
      this.selectedAltLowerGroupRef.instance.style.display = 'block';
      this.selectedAltUpperGroupRef.instance.style.display = 'none';
      this.targetGroupRef.instance.style.display = 'none';
      this.selectedAltFailed.set(false);
    } else if (this.altitude.get().value - this.shownTargetAltitude.value < -DisplayRange) {
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
    const isStd = this.fcuEisDiscreteWord2.get().bitValueOr(11, true);
    if (isStd) {
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
    const offset = ((this.altitude.get().value - this.shownTargetAltitude.value) * DistanceSpacing) / ValueSpacing;
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
            x="137.7511"
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
            x="138.22987"
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
  private readonly sub = this.props.bus.getSubscriber<FcuEfisCpBusEvents>();

  private readonly fcuEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(null);

  private readonly fcuBaroCorrectionHg = Arinc429LocalVarConsumerSubject.create(null);

  private readonly fcuBaroCorrectionHpa = Arinc429LocalVarConsumerSubject.create(null);

  private readonly isHg = this.fcuEisDiscreteWord2.map((v) => v.bitValueOr(13, false));

  private readonly text = Subject.create('');

  private readonly hgTextPipe = this.fcuBaroCorrectionHg.pipe(
    this.text,
    (v) => (v.isNormalOperation() || v.isFunctionalTest() ? v.value.toFixed(2) : ''),
    true,
  );

  private readonly hpaTextPipe = this.fcuBaroCorrectionHpa.pipe(
    this.text,
    (v) => (v.isNormalOperation() || v.isFunctionalTest() ? v.value.toFixed(0) : ''),
    true,
  );

  private mode = Subject.create('');

  private transAltAr = Arinc429Register.empty();

  private transLvlAr = Arinc429Register.empty();

  private fmgcFlightPhase = 0;

  private stdGroup = FSComponent.createRef<SVGGElement>();

  private qfeGroup = FSComponent.createRef<SVGGElement>();

  private qfeBorder = FSComponent.createRef<SVGGElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isFo = getDisplayIndex() === 2;

    this.fcuEisDiscreteWord2.setConsumer(
      this.sub.on(isFo ? 'fcu_efis_r_discrete_word_2' : 'fcu_efis_l_discrete_word_2'),
    );
    this.fcuBaroCorrectionHg.setConsumer(
      this.sub.on(isFo ? 'fcu_efis_r_baro_setting_inhg' : 'fcu_efis_l_baro_setting_inhg'),
    );
    this.fcuBaroCorrectionHpa.setConsumer(this.sub.on(isFo ? 'fcu_efis_r_baro_setting' : 'fcu_efis_l_baro_setting'));

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values>();

    this.fcuEisDiscreteWord2.sub(() => {
      const isQnh = this.fcuEisDiscreteWord2.get().bitValueOr(12, false);
      const isStd = this.fcuEisDiscreteWord2.get().bitValueOr(11, true);
      const isQfe = !isQnh && !isStd;

      if (isQfe) {
        this.mode.set('QFE');
        this.stdGroup.instance.classList.add('HiddenElement');
        this.qfeGroup.instance.classList.remove('HiddenElement');
        this.qfeBorder.instance.classList.remove('HiddenElement');
      } else if (isQnh) {
        this.mode.set('QNH');
        this.stdGroup.instance.classList.add('HiddenElement');
        this.qfeGroup.instance.classList.remove('HiddenElement');
        this.qfeBorder.instance.classList.add('HiddenElement');
      } else if (isStd) {
        this.mode.set('STD');
        this.stdGroup.instance.classList.remove('HiddenElement');
        this.qfeGroup.instance.classList.add('HiddenElement');
        this.qfeBorder.instance.classList.add('HiddenElement');
      }
    }, true);

    sub
      .on('fmgcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.fmgcFlightPhase = fp;

        this.handleBlink();
      });

    sub
      .on('fmTransAltRaw')
      .whenChanged()
      .handle((ta) => {
        this.transAltAr.set(ta);

        this.handleBlink();
      });

    sub
      .on('fmTransLvlRaw')
      .whenChanged()
      .handle((tl) => {
        this.transLvlAr.set(tl);

        this.handleBlink();
      });

    this.isHg.sub((isHg) => {
      if (isHg) {
        this.hpaTextPipe.pause();
        this.hgTextPipe.resume(true);
      } else {
        this.hgTextPipe.pause();
        this.hpaTextPipe.resume(true);
      }
    }, true);

    this.props.altitude.sub((_a) => {
      this.handleBlink();
    });
  }

  private handleBlink() {
    if (this.mode.get() === 'STD') {
      if (
        this.fmgcFlightPhase > FmgcFlightPhase.Cruise &&
        this.transLvlAr.isNormalOperation() &&
        100 * this.transLvlAr.value > this.props.altitude.get()
      ) {
        this.stdGroup.instance.classList.add('BlinkInfinite');
      } else {
        this.stdGroup.instance.classList.remove('BlinkInfinite');
      }
    } else if (
      this.fmgcFlightPhase <= FmgcFlightPhase.Cruise &&
      this.transAltAr.isNormalOperation() &&
      this.transAltAr.value < this.props.altitude.get()
    ) {
      this.qfeGroup.instance.classList.add('BlinkInfinite');
    } else {
      this.qfeGroup.instance.classList.remove('BlinkInfinite');
    }
  }

  render(): VNode {
    return (
      <>
        <g ref={this.stdGroup} id="STDAltimeterModeGroup">
          <path class="NormalStroke Yellow" d="m124.79 131.74h13.096v7.0556h-13.096z" />
          <text class="FontMedium Cyan AlignLeft" x="125.75785" y="137.36">
            STD
          </text>
        </g>
        <g id="AltimeterGroup">
          <g ref={this.qfeGroup} id="QFEGroup">
            <path
              ref={this.qfeBorder}
              class="NormalStroke White"
              d="m 116.83686,133.0668 h 13.93811 v 5.8933 h -13.93811 z"
            />
            <text id="AltimeterModeText" class="FontMedium White" x="118.23066" y="138.11342">
              {this.mode}
            </text>
            <text id="AltimeterSettingText" class="FontMedium StartAlign Cyan" x="131" y="138.09006">
              {this.text}
            </text>
          </g>
        </g>
      </>
    );
  }
}

interface MetricAltIndicatorProps {
  bus: ArincEventBus;
  targetAlt: Arinc429RegisterSubject;
  targetAltColor: Subscribable<TargetAltitudeColor>;
}

class MetricAltIndicator extends DisplayComponent<MetricAltIndicatorProps> {
  private sub = this.props.bus.getSubscriber<PrimFgBusBaseEvents & Arinc429Values & PFDSimvars>();

  private primFgDiscreteWord5 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_5'));

  private readonly metricAltActive = this.primFgDiscreteWord5.map((word) => word.bitValueOr(14, false));

  private readonly altitude = Arinc429ConsumerSubject.create(this.sub.on('altitudeAr'));

  private currentMetricAlt = this.altitude.map((alt) => Math.round((alt.value * 0.3048) / 10) * 10);

  private metricTargetAlt = this.props.targetAlt.map((alt) => Math.round((alt.value * 0.3048) / 10) * 10);

  private readonly mda = ConsumerSubject.create(this.sub.on('mda'), 0);

  private readonly belowMda = MappedSubject.create(([mda, altitude]) => altitude.value < mda, this.mda, this.altitude);

  render(): VNode {
    return (
      <g id="MetricAltGroup" visibility={this.metricAltActive.map((active) => (active ? 'inherit' : 'hidden'))}>
        <path class="NormalStroke Yellow" d="m116.56 140.22h29.213v7.0556h-29.213z" />
        <text class="FontMedium Cyan MiddleAlign" x="142.03537" y="145.8689">
          M
        </text>
        <text
          id="MetricAltText"
          class={{
            FontMedium: true,
            MiddleAlign: true,
            Green: this.belowMda.map(SubscribableMapFunctions.not()),
            Amber: this.belowMda,
          }}
          x="128.64708"
          y="145.86191"
        >
          {this.currentMetricAlt}
        </text>
        <g id="MetricAltTargetGroup">
          <text
            id="MetricAltTargetText"
            class={{
              FontSmallest: true,
              MiddleAlign: true,
              White: this.props.targetAltColor.map((color) => color === TargetAltitudeColor.White),
              Cyan: this.props.targetAltColor.map((color) => color === TargetAltitudeColor.Cyan),
              Magenta: this.props.targetAltColor.map((color) => color === TargetAltitudeColor.Magenta),
            }}
            x="94.088852"
            y="37.926617"
          >
            {this.metricTargetAlt}
          </text>
          <text class="FontSmallest Cyan MiddleAlign" x="105.25774" y="37.872921">
            M
          </text>
        </g>
      </g>
    );
  }
}
