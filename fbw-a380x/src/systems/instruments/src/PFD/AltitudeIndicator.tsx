import {
  ClockEvents,
  DisplayComponent,
  EventBus,
  FSComponent,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { VerticalMode } from '@shared/autopilot';
import {
  Arinc429LocalVarConsumerSubject,
  Arinc429Register,
  Arinc429RegisterSubject,
  Arinc429Word,
  ArincEventBus,
} from '@flybywiresim/fbw-sdk';
import { PFDSimvars } from './shared/PFDSimvarPublisher';
import { DigitalAltitudeReadout } from './DigitalAltitudeReadout';
import { SimplaneValues } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';
import { VerticalTape } from './VerticalTape';
import { Arinc429Values } from './shared/ArincValueProvider';
import { FmgcFlightPhase } from '@shared/flightphase';
import { A380XFcuBusEvents } from '@shared/publishers/A380XFcuBusPublisher';
import { getDisplayIndex } from 'instruments/src/PFD/PFD';

const DisplayRange = 600;
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

    sub.on('altitudeAr').handle((a) => {
      this.altitude = a.value;
      this.handleLandingElevation();
    });
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
  private readonly sub = this.props.bus.getSubscriber<A380XFcuBusEvents>();

  private visibility = Subject.create('hidden');

  private path = Subject.create('');

  private altitude = 0;

  private radioAltitudeValid = false;

  private qnhLandingAltValid = false;

  private qfeLandingAltValid = false;

  private inLandingPhases = false;

  private readonly fcuEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(null);

  private readonly mda = Arinc429RegisterSubject.createEmpty();

  private landingElevation = new Arinc429Word(0);

  private updateIndication(): void {
    const isQnh = this.fcuEisDiscreteWord2.get().bitValueOr(29, false);
    const isQfe = !isQnh && !this.fcuEisDiscreteWord2.get().bitValueOr(28, true);

    this.qnhLandingAltValid =
      !this.landingElevation.isFailureWarning() &&
      !this.landingElevation.isNoComputedData() &&
      this.inLandingPhases &&
      isQnh;

    this.qfeLandingAltValid = this.inLandingPhases && isQfe;

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

    const isFo = getDisplayIndex() === 2;
    this.fcuEisDiscreteWord2.setConsumer(
      this.sub.on(isFo ? 'a380x_fcu_eis_discrete_word_2_right' : 'a380x_fcu_eis_discrete_word_2_left'),
    );

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values & SimplaneValues>();

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
      .on('altitudeAr')
      .withArinc429Precision(0)
      .handle((a) => {
        // TODO filtered alt
        this.altitude = a.value;
        this.updateIndication();
      });

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
            displayRange={DisplayRange + 30}
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

export class AltitudeIndicatorOfftape extends DisplayComponent<AltitudeIndicatorOfftapeProps> {
  private abnormal = FSComponent.createRef<SVGGElement>();

  private tcasFailed = FSComponent.createRef<SVGGElement>();

  private normal = FSComponent.createRef<SVGGElement>();

  private altitude = Subject.create(0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values>();

    sub.on('altitudeAr').handle((altitude) => {
      if (!altitude.isNormalOperation()) {
        this.normal.instance.style.display = 'none';
        this.abnormal.instance.removeAttribute('style');
      } else {
        this.altitude.set(altitude.value);
        this.abnormal.instance.style.display = 'none';
        this.normal.instance.removeAttribute('style');
      }
    });

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
        <g ref={this.abnormal} style="display: none">
          <path id="AltTapeOutlineUpper" className="NormalStroke Red" d="m 117.75,38.09 h 13.10 6.73" />
          <path id="AltTapeOutlineLower" className="NormalStroke Red" d="m 117.75,123.56 h 13.10 6.73" />
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
        <g ref={this.normal} style="display: none">
          <path id="AltTapeOutlineUpper" class="NormalStroke White" d="m 117.75,38.09 h 13.10 6.73" />
          <path id="AltTapeOutlineLower" class="NormalStroke White" d="m 117.75,123.56 h 13.10 6.73" />
          <MinimumDescentAltitudeIndicator bus={this.props.bus} />
          <SelectedAltIndicator bus={this.props.bus} />
          <AltimeterIndicator bus={this.props.bus} altitude={this.altitude} />
          <MetricAltIndicator bus={this.props.bus} />
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
}

class SelectedAltIndicator extends DisplayComponent<SelectedAltIndicatorProps> {
  private readonly sub = this.props.bus.getSubscriber<A380XFcuBusEvents>();

  private readonly fcuEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(null);

  private selectedAltLowerGroupRef = FSComponent.createRef<SVGGElement>();

  private selectedAltLowerText = FSComponent.createRef<SVGTextElement>();

  private selectedAltLowerFLText = FSComponent.createRef<SVGTextElement>();

  private selectedAltUpperGroupRef = FSComponent.createRef<SVGGElement>();

  private selectedAltUpperText = FSComponent.createRef<SVGTextElement>();

  private selectedAltUpperFLText = FSComponent.createRef<SVGTextElement>();

  private targetGroupRef = FSComponent.createRef<SVGGElement>();

  private blackFill = FSComponent.createRef<SVGPathElement>();

  private targetSymbolRef = FSComponent.createRef<SVGPathElement>();

  private altTapeTargetText = FSComponent.createRef<SVGTextElement>();

  private altitude = new Arinc429Word(0);

  private targetAltitudeSelected = 0;

  private shownTargetAltitude = 0;

  private constraint = 0;

  private textSub = Subject.create('');

  private isManaged = false;

  private activeVerticalMode = 0;

  private handleAltManagedChange() {
    // TODO find proper logic for this (what happens when a constraint is sent by the fms but vertical mode is not managed)
    const clbActive =
      this.activeVerticalMode !== VerticalMode.OP_CLB &&
      this.activeVerticalMode !== VerticalMode.OP_DES &&
      this.activeVerticalMode !== VerticalMode.VS &&
      this.activeVerticalMode !== VerticalMode.FPA;

    const selectedAltIgnored =
      (this.activeVerticalMode >= VerticalMode.GS_CPT && this.activeVerticalMode < VerticalMode.ROLL_OUT) ||
      this.activeVerticalMode === VerticalMode.FINAL;

    this.isManaged = this.constraint > 0 && clbActive;

    this.shownTargetAltitude = this.updateTargetAltitude(this.targetAltitudeSelected, this.isManaged, this.constraint);

    if (selectedAltIgnored) {
      this.selectedAltLowerFLText.instance.classList.remove('Cyan');
      this.selectedAltLowerFLText.instance.classList.remove('Magenta');
      this.selectedAltLowerFLText.instance.classList.add('White');

      this.selectedAltLowerText.instance.classList.remove('Cyan');
      this.selectedAltLowerText.instance.classList.remove('Magenta');
      this.selectedAltLowerText.instance.classList.add('White');

      this.selectedAltUpperFLText.instance.classList.remove('Cyan');
      this.selectedAltUpperFLText.instance.classList.remove('Magenta');
      this.selectedAltUpperFLText.instance.classList.add('White');

      this.selectedAltUpperText.instance.classList.remove('Cyan');
      this.selectedAltUpperText.instance.classList.remove('Magenta');
      this.selectedAltUpperText.instance.classList.add('White');

      this.altTapeTargetText.instance.classList.remove('Cyan');
      this.altTapeTargetText.instance.classList.add('White');

      this.targetSymbolRef.instance.classList.remove('Cyan');
      this.targetSymbolRef.instance.classList.remove('Magenta');

      this.targetSymbolRef.instance.classList.add('White');
    } else if (this.isManaged) {
      this.selectedAltLowerFLText.instance.classList.remove('Cyan');
      this.selectedAltLowerFLText.instance.classList.remove('White');
      this.selectedAltLowerFLText.instance.classList.add('Magenta');

      this.selectedAltLowerText.instance.classList.remove('Cyan');
      this.selectedAltLowerText.instance.classList.remove('White');
      this.selectedAltLowerText.instance.classList.add('Magenta');

      this.selectedAltUpperFLText.instance.classList.remove('Cyan');
      this.selectedAltUpperFLText.instance.classList.remove('White');
      this.selectedAltUpperFLText.instance.classList.add('Magenta');

      this.selectedAltUpperText.instance.classList.remove('Cyan');
      this.selectedAltUpperText.instance.classList.remove('White');
      this.selectedAltUpperText.instance.classList.add('Magenta');

      this.altTapeTargetText.instance.classList.remove('Cyan');
      this.altTapeTargetText.instance.classList.remove('White');
      this.altTapeTargetText.instance.classList.add('Magenta');

      this.targetSymbolRef.instance.classList.remove('Cyan');
      this.targetSymbolRef.instance.classList.remove('White');
      this.targetSymbolRef.instance.classList.add('Magenta');
    } else {
      this.selectedAltLowerFLText.instance.classList.add('Cyan');
      this.selectedAltLowerFLText.instance.classList.remove('Magenta');
      this.selectedAltLowerFLText.instance.classList.remove('White');

      this.selectedAltLowerText.instance.classList.add('Cyan');
      this.selectedAltLowerText.instance.classList.remove('Magenta');
      this.selectedAltLowerText.instance.classList.remove('White');

      this.selectedAltUpperFLText.instance.classList.add('Cyan');
      this.selectedAltUpperFLText.instance.classList.remove('Magenta');
      this.selectedAltUpperFLText.instance.classList.remove('White');

      this.selectedAltUpperText.instance.classList.add('Cyan');
      this.selectedAltUpperText.instance.classList.remove('Magenta');
      this.selectedAltUpperText.instance.classList.remove('White');

      this.altTapeTargetText.instance.classList.add('Cyan');
      this.altTapeTargetText.instance.classList.remove('Magenta');
      this.altTapeTargetText.instance.classList.remove('White');

      this.targetSymbolRef.instance.classList.add('Cyan');
      this.targetSymbolRef.instance.classList.remove('Magenta');
      this.targetSymbolRef.instance.classList.remove('White');
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isFo = getDisplayIndex() === 2;
    this.fcuEisDiscreteWord2.setConsumer(
      this.sub.on(isFo ? 'a380x_fcu_eis_discrete_word_2_right' : 'a380x_fcu_eis_discrete_word_2_left'),
    );

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & Arinc429Values & SimplaneValues>();

    sub
      .on('activeVerticalMode')
      .whenChanged()
      .handle((v) => {
        this.activeVerticalMode = v;
        this.handleAltManagedChange();
        this.getOffset();
        this.handleAltitudeDisplay();
        this.setText();
      });

    sub
      .on('selectedAltitude')
      .whenChanged()
      .handle((m) => {
        this.targetAltitudeSelected = m;
        this.handleAltManagedChange();
        this.getOffset();
        this.handleAltitudeDisplay();
        this.setText();
      });

    sub
      .on('altConstraint')
      .whenChanged()
      .handle((m) => {
        this.constraint = m;
        this.handleAltManagedChange();
        this.getOffset();
        this.handleAltitudeDisplay();
        this.setText();
      });

    sub
      .on('altitudeAr')
      .withArinc429Precision(2)
      .handle((a) => {
        this.altitude = a;
        this.handleAltitudeDisplay();
        this.getOffset();
      });

    this.fcuEisDiscreteWord2.sub(() => {
      const isStd = this.fcuEisDiscreteWord2.get().bitValueOr(28, true);

      if (isStd) {
        this.selectedAltLowerFLText.instance.style.visibility = 'visible';
        this.selectedAltUpperFLText.instance.style.visibility = 'visible';
      } else {
        this.selectedAltLowerFLText.instance.style.visibility = 'hidden';
        this.selectedAltUpperFLText.instance.style.visibility = 'hidden';
      }

      this.handleAltitudeDisplay();
      this.setText();
    });
  }

  private updateTargetAltitude(targetAltitude: number, isManaged: boolean, constraint: number) {
    return isManaged ? constraint : targetAltitude;
  }

  private handleAltitudeDisplay() {
    if (this.altitude.value - this.shownTargetAltitude > DisplayRange) {
      this.selectedAltLowerGroupRef.instance.style.display = 'block';
      this.selectedAltUpperGroupRef.instance.style.display = 'none';
      this.targetGroupRef.instance.style.display = 'none';
    } else if (this.altitude.value - this.shownTargetAltitude < -DisplayRange) {
      this.targetGroupRef.instance.style.display = 'none';
      this.selectedAltUpperGroupRef.instance.style.display = 'block';
      this.selectedAltLowerGroupRef.instance.style.display = 'none';
    } else {
      this.selectedAltUpperGroupRef.instance.style.display = 'none';
      this.selectedAltLowerGroupRef.instance.style.display = 'none';
      this.targetGroupRef.instance.style.display = 'inline';
    }
  }

  private setText() {
    let boxLength = 19.14;
    let text = '0';
    const isStd = this.fcuEisDiscreteWord2.get().bitValueOr(28, true);
    if (isStd) {
      text = Math.round(this.shownTargetAltitude / 100)
        .toString()
        .padStart(3, '0');
      boxLength = 12.5;
    } else {
      text = Math.round(this.shownTargetAltitude).toString().padStart(5, ' ');
    }
    this.textSub.set(text);
    this.blackFill.instance.setAttribute('d', `m117.75 77.784h${boxLength}v6.0476h-${boxLength}z`);
  }

  private getOffset() {
    const offset = ((this.altitude.value - this.shownTargetAltitude) * DistanceSpacing) / ValueSpacing;
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
      </>
    );
  }
}

interface AltimeterIndicatorProps {
  altitude: Subscribable<number>;
  bus: ArincEventBus;
}

class AltimeterIndicator extends DisplayComponent<AltimeterIndicatorProps> {
  private readonly sub = this.props.bus.getSubscriber<A380XFcuBusEvents>();

  private readonly fcuEisDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(null);

  private readonly fcuEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(null);

  private readonly fcuBaroCorrectionHg = Arinc429LocalVarConsumerSubject.create(null);

  private readonly fcuBaroCorrectionHpa = Arinc429LocalVarConsumerSubject.create(null);

  private readonly isHg = this.fcuEisDiscreteWord1.map((v) => v.bitValueOr(11, false));

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

    this.fcuEisDiscreteWord1.setConsumer(
      this.sub.on(isFo ? 'a380x_fcu_eis_discrete_word_1_right' : 'a380x_fcu_eis_discrete_word_1_left'),
    );
    this.fcuEisDiscreteWord2.setConsumer(
      this.sub.on(isFo ? 'a380x_fcu_eis_discrete_word_2_right' : 'a380x_fcu_eis_discrete_word_2_left'),
    );
    this.fcuBaroCorrectionHg.setConsumer(this.sub.on(isFo ? 'a380x_fcu_eis_baro_right' : 'a380x_fcu_eis_baro_left'));
    this.fcuBaroCorrectionHpa.setConsumer(
      this.sub.on(isFo ? 'a380x_fcu_eis_baro_hpa_right' : 'a380x_fcu_eis_baro_hpa_left'),
    );

    const sub = this.props.bus.getArincSubscriber<PFDSimvars & SimplaneValues & Arinc429Values>();

    this.fcuEisDiscreteWord2.sub(() => {
      const isQnh = this.fcuEisDiscreteWord2.get().bitValueOr(29, false);
      const isStd = this.fcuEisDiscreteWord2.get().bitValueOr(28, true);
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

interface MetricAltIndicatorState {
  altitude: Arinc429Word;
  MDA: number;
  targetAltSelected: number;
  targetAltManaged: number;
  altIsManaged: boolean;
  metricAltToggle: boolean;
}

class MetricAltIndicator extends DisplayComponent<{ bus: EventBus }> {
  private needsUpdate = false;

  private metricAlt = FSComponent.createRef<SVGGElement>();

  private metricAltText = FSComponent.createRef<SVGTextElement>();

  private metricAltTargetText = FSComponent.createRef<SVGTextElement>();

  private state: MetricAltIndicatorState = {
    altitude: new Arinc429Word(0),
    MDA: 0,
    targetAltSelected: 0,
    targetAltManaged: 0,
    altIsManaged: false,
    metricAltToggle: false,
  };

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<PFDSimvars & Arinc429Values & ClockEvents & SimplaneValues>();

    sub
      .on('mda')
      .whenChanged()
      .handle((mda) => {
        this.state.MDA = mda;
        this.needsUpdate = true;
      });

    sub.on('altitudeAr').handle((a) => {
      this.state.altitude = a;
      this.needsUpdate = true;
    });

    sub
      .on('selectedAltitude')
      .whenChanged()
      .handle((m) => {
        this.state.targetAltSelected = m;
        this.needsUpdate = true;
      });
    sub.on('altConstraint').handle((m) => {
      this.state.targetAltManaged = m;
      this.needsUpdate = true;
    });

    sub
      .on('metricAltToggle')
      .whenChanged()
      .handle((m) => {
        this.state.metricAltToggle = m;
        this.needsUpdate = true;
      });

    sub.on('realTime').handle(this.updateState.bind(this));
  }

  private updateState(_time: number) {
    if (this.needsUpdate) {
      this.needsUpdate = false;
      const showMetricAlt = this.state.metricAltToggle;
      if (!showMetricAlt) {
        this.metricAlt.instance.style.display = 'none';
      } else {
        this.metricAlt.instance.style.display = 'inline';
        const currentMetricAlt = Math.round((this.state.altitude.value * 0.3048) / 10) * 10;
        this.metricAltText.instance.textContent = currentMetricAlt.toString();

        const targetMetric =
          Math.round(
            ((this.state.altIsManaged ? this.state.targetAltManaged : this.state.targetAltSelected) * 0.3048) / 10,
          ) * 10;
        this.metricAltTargetText.instance.textContent = targetMetric.toString();

        if (this.state.altIsManaged) {
          this.metricAltTargetText.instance.classList.replace('Cyan', 'Magenta');
        } else {
          this.metricAltTargetText.instance.classList.replace('Magenta', 'Cyan');
        }

        if (this.state.altitude.value > this.state.MDA) {
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
