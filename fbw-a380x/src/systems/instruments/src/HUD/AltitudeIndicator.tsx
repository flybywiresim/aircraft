import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { VerticalMode } from '@shared/autopilot';
import {
  Arinc429ConsumerSubject,
  Arinc429LocalVarConsumerSubject,
  Arinc429Register,
  Arinc429RegisterSubject,
  Arinc429Word,
  ArincEventBus,
} from '@flybywiresim/fbw-sdk';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { DigitalAltitudeReadout } from './DigitalAltitudeReadout';
import { SimplaneValues } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';
import { VerticalTape } from './VerticalTape';
import { Arinc429Values } from './shared/ArincValueProvider';
import { FmgcFlightPhase } from '@shared/flightphase';
import { A380XFcuBusEvents } from '@shared/publishers/A380XFcuBusPublisher';
import { getDisplayIndex } from './HUD';
import { ALT_TAPE_XPOS, ALT_TAPE_YPOS, XWIND_TO_AIR_REF_OFFSET } from './HUDUtils';
import { HudElems, WindMode, MdaMode } from './HUDUtils';
import { CrosswindDigitalAltitudeReadout } from './CrosswindDigitalAltitudeReadout';

let DisplayRange = 600;
const ValueSpacing = 100;
const DistanceSpacing = 33.3;

class LandingElevationIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly altitude = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('altitudeAr'),
  );

  private landingElevationIndicator = FSComponent.createRef<SVGPathElement>();

  private crosswindMode = false;
  private xWindOffset = 0;
  private landingElevation = new Arinc429Word(0);

  private flightPhase = 0;

  private delta = 0;

  private handleLandingElevation() {
    const landingElevationValid =
      !this.landingElevation.isFailureWarning() && !this.landingElevation.isNoComputedData();
    const delta = this.altitude.get().value - this.landingElevation.value;
    const offset = ((delta - DisplayRange) * DistanceSpacing) / ValueSpacing + this.xWindOffset;
    this.delta = delta;
    if (delta > DisplayRange || (this.flightPhase !== 9 && this.flightPhase !== 10) || !landingElevationValid) {
      this.landingElevationIndicator.instance.classList.add('HiddenElement');
    } else {
      this.landingElevationIndicator.instance.classList.remove('HiddenElement');
    }
    this.landingElevationIndicator.instance.setAttribute('d', `m586.862 554.167h-58.736v${offset}h58.736z`);
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & HudElems>();

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
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        if (this.crosswindMode != value) {
          this.crosswindMode = value;
          if (this.crosswindMode) {
            DisplayRange = 200;
            this.xWindOffset = -150;
            this.landingElevationIndicator.instance.style.transform = `translate3d(0px, ${XWIND_TO_AIR_REF_OFFSET}px, 0px)`;
          } else {
            DisplayRange = 600;
            this.xWindOffset = 0;
            this.landingElevationIndicator.instance.style.transform = 'translate3d(0px, 0px, 0px)';
          }
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
    return <path ref={this.landingElevationIndicator} id="AltTapeLandingElevation" class="GreenFill2" />;
  }
}

class RadioAltIndicator extends DisplayComponent<{ bus: EventBus; filteredRadioAltitude: Subscribable<number> }> {
  private altTapeGndRef = FSComponent.createRef<SVGPathElement>();
  private crosswindMode = false;
  private xWindOffset = 0;
  private hudMode = -1;
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
      this.crosswindMode
        ? this.offsetSub.set(`m588.208 437 h12.876v${offset}h-12.876z`)
        : this.offsetSub.set(`m588.208 556 h12.876v${offset}h-12.876z`);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & HudElems>();

    this.props.filteredRadioAltitude.sub((_filteredRadioAltitude) => {
      this.setOffset();
    }, true);

    sub
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
        if (this.crosswindMode) {
          DisplayRange = 200;
          this.xWindOffset = -137;
        } else {
          DisplayRange = 600;
          this.xWindOffset = 0;
        }
        this.setOffset();
      });

    sub.on('chosenRa').handle((ra) => {
      this.radioAltitude = ra;
      this.setOffset();
    });
  }

  render(): VNode {
    return <path visibility={this.visibilitySub} id="AltTapeGroundReference" class="BarGreen" d={this.offsetSub} />;
  }
}

class MinimumDescentAltitudeIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly sub = this.props.bus.getSubscriber<A380XFcuBusEvents>();

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
    const isQnh = this.fcuEisDiscreteWord2.get().bitValueOr(29, false);
    const isQfe = !isQnh && !this.fcuEisDiscreteWord2.get().bitValueOr(28, true);

    this.qnhLandingAltValid =
      !this.landingElevation.isFailureWarning() &&
      !this.landingElevation.isNoComputedData() &&
      this.inLandingPhases &&
      isQnh;

    this.qfeLandingAltValid = this.inLandingPhases && isQfe;

    const altDelta = this.mda.get().value - this.altitude.get().value;

    const showMda =
      (this.radioAltitudeValid || this.qnhLandingAltValid || this.qfeLandingAltValid) &&
      Math.abs(altDelta) <= DisplayRange &&
      !this.mda.get().isFailureWarning() &&
      !this.mda.get().isNoComputedData();

    if (!showMda) {
      this.visibility.set('hidden');
      return;
    }

    const offset = (altDelta * DistanceSpacing) / ValueSpacing;
    this.path.set(`m 577 ,${360 - offset} h 23 v 5 h -23z`);
    this.visibility.set('visible');
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isFo = getDisplayIndex() === 2;
    this.fcuEisDiscreteWord2.setConsumer(
      this.sub.on(isFo ? 'a380x_fcu_eis_discrete_word_2_right' : 'a380x_fcu_eis_discrete_word_2_left'),
    );

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & SimplaneValues>();
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
    return <path visibility={this.visibility} id="AltTapeMdaIndicator" class="Fill Green" d={this.path} />;
  }
}

interface AltitudeIndicatorProps {
  bus: ArincEventBus;
}

export class AltitudeIndicator extends DisplayComponent<AltitudeIndicatorProps> {
  private crosswindMode = false;
  private subscribable = Subject.create<number>(0);
  private tapeRef = FSComponent.createRef<HTMLDivElement>();
  private altIndicatorGroupRef = FSComponent.createRef<SVGGElement>();

  private readonly altitude = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('altitudeAr'),
  );
  private sub = this.props.bus.getSubscriber<HudElems>();
  private readonly altTape = ConsumerSubject.create(this.sub.on('altTape').whenChanged(), '');
  private readonly xWindAltTape = ConsumerSubject.create(this.sub.on('xWindAltTape').whenChanged(), '');
  private isBothAltTapesOff = MappedSubject.create(
    ([altTape, xWindAltTape]) => {
      return altTape === 'none' && xWindAltTape === 'none' ? 'none' : 'block';
    },
    this.altTape,
    this.xWindAltTape,
  );
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.altIndicatorGroupRef.instance.style.transform = `translate3d(${ALT_TAPE_XPOS}px, ${ALT_TAPE_YPOS}px, 0px)`;

    this.sub
      .on('cWndMode')
      .whenChanged()
      .handle((value) => {
        this.crosswindMode = value;
        if (this.crosswindMode) {
          DisplayRange = 200;
          this.tapeRef.instance.style.transform = `translate3d(0px, ${XWIND_TO_AIR_REF_OFFSET}px, 0px)`;
        } else {
          DisplayRange = 600;
          this.tapeRef.instance.style.transform = 'translate3d(0px, 0px, 0px)';
        }
      });
  }

  render(): VNode {
    return (
      <g id="AltitudeTape" ref={this.altIndicatorGroupRef} display={this.isBothAltTapesOff}>
        <LandingElevationIndicator bus={this.props.bus} />
        <g
          ref={this.tapeRef}
          transform="translate3d(0px, 0px, 0px)"
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

interface AltitudeIndicatorOfftapeProps {
  bus: ArincEventBus;
  filteredRadioAltitude: Subscribable<number>;
}

export class AltitudeIndicatorOfftape extends DisplayComponent<AltitudeIndicatorOfftapeProps> {
  private altTape = 'block';
  private xWindAltTape = 'none';

  private altTapeRef = FSComponent.createRef<SVGGElement>();
  private xWindAltTapeRef = FSComponent.createRef<SVGGElement>();

  private readonly altitude = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('altitudeAr'),
  );

  private readonly altFlagVisible = this.altitude.map((v) => !v.isNormalOperation() && !v.isFunctionalTest());

  private tcasFailed = FSComponent.createRef<SVGGElement>();

  private altIndicatorOffTapeGroupRef = FSComponent.createRef<SVGGElement>();
  private doOnce = 0;
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & HudElems>();
    sub
      .on('altTape')
      .whenChanged()
      .handle((v) => {
        this.altTape = v;
        this.altTapeRef.instance.style.display = `${this.altTape}`;
      });
    sub
      .on('xWindAltTape')
      .whenChanged()
      .handle((v) => {
        this.xWindAltTape = v;
        this.xWindAltTapeRef.instance.style.display = `${this.xWindAltTape}`;
        this.xWindAltTapeRef.instance.style.transform = `translate3d(0px, ${XWIND_TO_AIR_REF_OFFSET}px, 0px)`;
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
    this.altIndicatorOffTapeGroupRef.instance.style.transform = `translate3d(${ALT_TAPE_XPOS}px, ${ALT_TAPE_YPOS}px, 0px)`;
  }

  render(): VNode {
    return (
      <g id="altOfftapeGroup" ref={this.altIndicatorOffTapeGroupRef}>
        <g style={{ display: this.altFlagVisible.map((v) => (v ? 'inherit' : 'none')) }}>
          <path id="AltTapeOutlineVert" class="NormalStroke Green" d="m587 170.834v383" />
          <path id="AltTapeOutlineUpper" class="NormalStroke Green" d="m528 170.834h100" />
          <path id="AltTapeOutlineLower" class="NormalStroke Green" d="m528 554.167h100" />
          <path
            id="AltReadoutBackground"
            class="BlackFill"
            d="m587 382.606h-58.888v-40.233h58.888v-11.979h39.758v64.194h-39.758z"
          />
          <text id="AltFailText" class="Blink9Seconds FontLargest Green MiddleAlign" x="588" y="374">
            ALT
          </text>
        </g>
        <g ref={this.tcasFailed} style="display: none">
          <text class="Blink9Seconds FontLargest Green MiddleAlign" x="630" y="420">
            T
          </text>
          <text class="Blink9Seconds FontLargest Green MiddleAlign" x="630" y="455">
            C
          </text>
          <text class="Blink9Seconds FontLargest Green MiddleAlign" x="630" y="490">
            A
          </text>
          <text class="Blink9Seconds FontLargest Green MiddleAlign" x="630" y="525">
            S
          </text>
        </g>

        <g id="NormalOfftapeGroup" style={{ display: this.altFlagVisible.map((v) => (v ? 'none' : 'inherit')) }}>
          <g id="CrosswindAltTape" class="cwTest" transform="translate3d(0px, -311px, 0px)" ref={this.xWindAltTapeRef}>
            <path id="AltTapeOutlineVert" class="NormalStroke Green" d="m587 288.5 v 150" />
            <path id="AltTapeOutlineUpper" class="NormalStroke Green" d="m528 288.5 h100" />
            <path id="AltTapeOutlineLower" class="NormalStroke Green" d="m528 438.5 h100" />
            <MinimumDescentAltitudeIndicator bus={this.props.bus} />
            <SelectedAltIndicator bus={this.props.bus} mode={WindMode.CrossWind} />
            <path id="AltReadoutBackground" class="BlackFill" d="m528 341.25 h 100 v45 h -100z" />
            <RadioAltIndicator bus={this.props.bus} filteredRadioAltitude={this.props.filteredRadioAltitude} />
            <CrosswindDigitalAltitudeReadout bus={this.props.bus} />
          </g>

          <g id="NormalAltTape" ref={this.altTapeRef}>
            <path id="AltTapeOutlineVert" class="NormalStroke Green" d="m587 170.834v383" />
            <path id="AltTapeOutlineUpper" class="NormalStroke Green" d="m528 170.834h100" />
            <path id="AltTapeOutlineLower" class="NormalStroke Green" d="m528 554.167h100" />
            <MinimumDescentAltitudeIndicator bus={this.props.bus} />
            <SelectedAltIndicator bus={this.props.bus} mode={WindMode.Normal} />
            <path
              id="AltReadoutBackground"
              class="BlackFill"
              d="m587 382.606h-58.888v-40.233h58.888v-11.979h39.758v64.194h-39.758z"
            />
            <RadioAltIndicator bus={this.props.bus} filteredRadioAltitude={this.props.filteredRadioAltitude} />
            <DigitalAltitudeReadout bus={this.props.bus} />
          </g>
        </g>
        <AltimeterIndicator bus={this.props.bus} altitude={this.altitude.map((v) => v.value)} />
        <MetricAltIndicator bus={this.props.bus} />
      </g>
    );
  }
}

interface SelectedAltIndicatorProps {
  bus: ArincEventBus;
  mode: WindMode;
}

class SelectedAltIndicator extends DisplayComponent<SelectedAltIndicatorProps> {
  private readonly sub = this.props.bus.getSubscriber<A380XFcuBusEvents & HUDSimvars & Arinc429Values>();

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

  private minimumLowerText = FSComponent.createRef<SVGTextElement>();

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

    this.isManaged = this.constraint > 0 && clbActive;

    this.shownTargetAltitude = this.updateTargetAltitude(this.targetAltitudeSelected, this.isManaged, this.constraint);
  }

  private readonly fmEisDiscrete2 = Arinc429RegisterSubject.createEmpty();
  private readonly hudMode = ConsumerSubject.create(this.sub.on('hudMode').whenChanged(), 0);
  private readonly altitude = Arinc429ConsumerSubject.create(this.sub.on('altitudeAr'));
  private readonly ra = Arinc429ConsumerSubject.create(this.sub.on('chosenRa').whenChanged());
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

  private readonly isMinLowerAltTxtVisible = MappedSubject.create(
    ([mda, dh, mdaDhMode, altitude, ra, hudMode]) => {
      let diff;
      if (hudMode === 0) {
        switch (mdaDhMode) {
          case MdaMode.Baro:
            diff = altitude.value - mda.value;
            break;
          case MdaMode.Radio:
            diff = ra.value - dh.value;
            break;
          case MdaMode.NoDh:
            diff = ra.value;
            break;
          default:
            diff = 0;
            break;
        }

        if (mdaDhMode === MdaMode.NoDh || mdaDhMode === MdaMode.None) {
          return 'none';
        } else {
          return diff <= 0 ? 'block' : 'none';
        }
      } else {
        return 'none';
      }
    },
    this.mda,
    this.dh,
    this.mdaDhMode,
    this.altitude,
    this.ra,
    this.hudMode,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isFo = getDisplayIndex() === 2;
    this.fcuEisDiscreteWord2.setConsumer(
      this.sub.on(isFo ? 'a380x_fcu_eis_discrete_word_2_right' : 'a380x_fcu_eis_discrete_word_2_left'),
    );

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & SimplaneValues>();

    this.sub.on('fmMdaRaw').handle(this.mda.setWord.bind(this.mda));
    this.sub.on('fmDhRaw').handle(this.dh.setWord.bind(this.dh));

    sub
      .on('fmgcFlightPhase')
      .whenChanged()
      .handle((value) => {
        value === FmgcFlightPhase.Approach
          ? this.targetSymbolRef.instance.setAttribute('stroke-dasharray', '3 6')
          : this.targetSymbolRef.instance.setAttribute('stroke-dasharray', '');
      });
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

    this.altitude.sub(() => {
      this.handleAltitudeDisplay();
      this.getOffset();
      this.handleCrosswinMode();
    }, true);

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
    }, true);
  }

  private updateTargetAltitude(targetAltitude: number, isManaged: boolean, constraint: number) {
    return isManaged ? constraint : targetAltitude;
  }

  private handleAltitudeDisplay() {
    if (this.altitude.get().value - this.shownTargetAltitude > DisplayRange) {
      this.selectedAltLowerGroupRef.instance.style.display = 'block';
      this.selectedAltUpperGroupRef.instance.style.display = 'none';
      this.targetGroupRef.instance.style.display = 'none';
    } else if (this.altitude.get().value - this.shownTargetAltitude < -DisplayRange) {
      this.targetGroupRef.instance.style.display = 'none';
      this.selectedAltUpperGroupRef.instance.style.display = 'block';
      this.selectedAltLowerGroupRef.instance.style.display = 'none';
    } else {
      this.selectedAltUpperGroupRef.instance.style.display = 'none';
      this.selectedAltLowerGroupRef.instance.style.display = 'none';
      this.targetGroupRef.instance.style.display = 'inline';
    }
  }

  private handleCrosswinMode() {
    if (this.props.mode === WindMode.Normal) {
      this.minimumLowerText.instance.setAttribute('y', '580');
      this.selectedAltLowerText.instance.setAttribute('y', '580');
      this.selectedAltLowerFLText.instance.setAttribute('y', '580');
      this.selectedAltUpperText.instance.setAttribute('y', '167');
      this.selectedAltUpperFLText.instance.setAttribute('y', '167');
    } else {
      this.minimumLowerText.instance.setAttribute('y', '465');
      this.selectedAltLowerText.instance.setAttribute('y', '465');
      this.selectedAltLowerFLText.instance.setAttribute('y', '465');
      this.selectedAltUpperText.instance.setAttribute('y', '280');
      this.selectedAltUpperFLText.instance.setAttribute('y', '280');
    }
  }

  private setText() {
    let boxLength = 95.7;
    let text = '0';
    const isStd = this.fcuEisDiscreteWord2.get().bitValueOr(28, true);
    if (isStd) {
      text = Math.round(this.shownTargetAltitude / 100)
        .toString()
        .padStart(3, '0');
      boxLength = 62.5;
    } else {
      text = Math.round(this.shownTargetAltitude).toString().padStart(5, ' ');
    }
    this.textSub.set(text);
    this.blackFill.instance.setAttribute('d', `m 528.109 348.861 h ${boxLength}v 27.123 h-${boxLength} z`);
  }

  private getOffset() {
    const offset = ((this.altitude.get().value - this.shownTargetAltitude) * DistanceSpacing) / ValueSpacing;
    this.targetGroupRef.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
  }

  render(): VNode | null {
    return (
      <>
        <text
          id="MinimumLowerText"
          ref={this.minimumLowerText}
          display={this.isMinLowerAltTxtVisible}
          class="FontMedium EndAlign Green"
          x="634"
          y="580"
          style="white-space: pre"
        >
          MINIMUM
        </text>
        <g id="SelectedAltLowerGroup" ref={this.selectedAltLowerGroupRef}>
          <text
            id="SelectedAltLowerText"
            ref={this.selectedAltLowerText}
            class="FontMedium EndAlign Green"
            x="618"
            y="580"
            style="white-space: pre"
          >
            {this.textSub}
          </text>
          <text
            id="SelectedAltLowerFLText"
            ref={this.selectedAltLowerFLText}
            class="FontSmall MiddleAlign Green"
            x="542"
            y="580"
          >
            FL
          </text>
        </g>
        <g id="SelectedAltUpperGroup" ref={this.selectedAltUpperGroupRef}>
          <text
            id="SelectedAltUpperText"
            ref={this.selectedAltUpperText}
            class="FontMedium EndAlign Green"
            x="620"
            y="167"
            style="white-space: pre"
          >
            {this.textSub}
          </text>
          <text
            id="SelectedAltUpperFLText"
            ref={this.selectedAltUpperFLText}
            class="FontSmall MiddleAlign Green"
            x="542"
            y="167"
          >
            FL
          </text>
        </g>
        <g id="AltTapeTargetSymbol" ref={this.targetGroupRef}>
          <path class="BlackFill" ref={this.blackFill} />
          <path
            class="NormalStroke Green"
            ref={this.targetSymbolRef}
            d="m550.713 375.982  v 29.384 h -31.626 v -38.426  l 9.035 -4.521 l -9.035 -4.521 v -38.426  h 31 v  29.384"
          />
          <text
            id="AltTapeTargetText"
            ref={this.altTapeTargetText}
            class="FontMedium StartAlign Green"
            x="530.25258"
            y="372.55577307"
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
  private QFERef = FSComponent.createRef<SVGGElement>();
  private readonly sub = this.props.bus.getSubscriber<
    A380XFcuBusEvents & HUDSimvars & SimplaneValues & Arinc429Values & HudElems & ClockEvents
  >();

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
  private needsUpdate = false;

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.sub
      .on('QFE')
      .whenChanged()
      .handle((v) => {
        this.QFERef.instance.style.display = v;
        this.needsUpdate = true;
      });

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

    this.sub
      .on('fmgcFlightPhase')
      .whenChanged()
      .handle((fp) => {
        this.fmgcFlightPhase = fp;

        this.handleBlink();
      });

    this.sub
      .on('fmTransAltRaw')
      .whenChanged()
      .handle((ta) => {
        this.transAltAr.set(ta);

        this.handleBlink();
      });

    this.sub
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
        <g id="BaroModeGroup" ref={this.QFERef}>
          <g ref={this.stdGroup} id="STDAltimeterModeGroup">
            <path class="NormalStroke Green" d="m559.683 590.854h58.736v31.644h-58.736z" />
            <text class="FontMedium Green AlignLeft" x="564.024" y="616.0596">
              STD
            </text>
          </g>
          <g id="AltimeterGroup">
            <g ref={this.qfeGroup} id="QFEGroup">
              <path ref={this.qfeBorder} class="NormalStroke Green" d="m524.013 596.805h62.513v26.431h-62.513z" />
              <text id="AltimeterModeText" class="FontMedium Green" x="530.26" y="619.4386887">
                {this.mode}
              </text>
              <text id="AltimeterSettingText" class="FontMedium StartAlign Green" x="587.535" y="619.3339191">
                {this.text}
              </text>
            </g>
          </g>
        </g>
      </>
    );
  }
}

interface MetricAltIndicatorState {
  MDA: number;
  targetAltSelected: number;
  targetAltManaged: number;
  altIsManaged: boolean;
  metricAltToggle: boolean;
}

class MetricAltIndicator extends DisplayComponent<{ bus: ArincEventBus }> {
  private readonly altitude = Arinc429ConsumerSubject.create(
    this.props.bus.getArincSubscriber<Arinc429Values>().on('altitudeAr'),
  );

  private needsUpdate = true;
  private metricAltHudVis = false;

  private metricAlt = FSComponent.createRef<SVGGElement>();

  private metricAltText = FSComponent.createRef<SVGTextElement>();

  private metricAltTargetText = FSComponent.createRef<SVGTextElement>();
  private metricAltTargetMText = FSComponent.createRef<SVGTextElement>();

  private state: MetricAltIndicatorState = {
    MDA: 0,
    targetAltSelected: 0,
    targetAltManaged: 0,
    altIsManaged: false,
    metricAltToggle: false,
  };

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & ClockEvents & SimplaneValues & HudElems>();
    sub
      .on('cWndMode')
      .whenChanged()
      .handle((v) => {
        if (v) {
          this.metricAltTargetText.instance.setAttribute('x', '557');
          this.metricAltTargetMText.instance.setAttribute('x', '608');
          this.metricAltTargetText.instance.setAttribute('y', '60');
          this.metricAltTargetMText.instance.setAttribute('y', '60');
        } else {
          this.metricAltTargetText.instance.setAttribute('x', '457');
          this.metricAltTargetMText.instance.setAttribute('x', '498');
          this.metricAltTargetText.instance.setAttribute('y', '170');
          this.metricAltTargetMText.instance.setAttribute('y', '170');
        }
      });
    sub
      .on('metricAlt')
      .whenChanged()
      .handle((v) => {
        v ? (this.metricAltHudVis = true) : (this.metricAltHudVis = false);
      });

    sub
      .on('mda')
      .whenChanged()
      .handle((mda) => {
        this.state.MDA = mda;
        this.needsUpdate = true;
      });

    this.altitude.sub(() => (this.needsUpdate = true));

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
      if (showMetricAlt) {
        if (this.metricAltHudVis) {
          this.metricAlt.instance.style.display = 'inline';
          const currentMetricAlt = Math.round((this.altitude.get().value * 0.3048) / 10) * 10;
          this.metricAltText.instance.textContent = currentMetricAlt.toString();

          const targetMetric =
            Math.round(
              ((this.state.altIsManaged ? this.state.targetAltManaged : this.state.targetAltSelected) * 0.3048) / 10,
            ) * 10;
          this.metricAltTargetText.instance.textContent = targetMetric.toString();
        } else {
          this.metricAlt.instance.style.display = 'none';
        }
      } else {
        this.metricAlt.instance.style.display = 'none';
      }
    }
  }

  render(): VNode {
    return (
      <g id="MetricAltGroup" ref={this.metricAlt}>
        <path class="NormalStroke Green" d="m522.772 628.887h131.02v31.644h-131.02z" />
        <text class="FontMedium Green MiddleAlign" x="637.0286344499999" y="654.2220165">
          M
        </text>
        <text
          ref={this.metricAltText}
          id="MetricAltText"
          class="FontMedium Green MiddleAlign"
          x="576.9821538"
          y="654.19066635"
        >
          0
        </text>
        <g id="MetricAltTargetGroup">
          <text
            id="MetricAltTargetText"
            ref={this.metricAltTargetText}
            class="FontSmallest Green MiddleAlign"
            x="457.47"
            y="170.100877245"
          >
            0
          </text>
          <text
            ref={this.metricAltTargetMText}
            class="FontSmallest Green MiddleAlign"
            x="497.83500000000004"
            y="169.860050685"
          >
            M
          </text>
        </g>
      </g>
    );
  }
}
