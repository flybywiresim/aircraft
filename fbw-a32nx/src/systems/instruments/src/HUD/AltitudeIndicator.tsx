// @ts-strict-ignore
// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  Subject,
  Subscribable,
  VNode,
  HEvent,
  MappedSubject,
  Subscription,
} from '@microsoft/msfs-sdk';

import {
  ArincEventBus,
  Arinc429Register,
  Arinc429Word,
  Arinc429WordData,
  Arinc429RegisterSubject,
  Arinc429ConsumerSubject,
} from '@flybywiresim/fbw-sdk';
import { FcuBus } from 'instruments/src/HUD/shared/FcuBusProvider';
import { FgBus } from 'instruments/src/HUD/shared/FgBusProvider';

import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { DigitalAltitudeReadout } from './DigitalAltitudeReadout';
import { Arinc429Values } from './shared/ArincValueProvider';
import { FlashOneHertz } from 'instruments/src/MsfsAvionicsCommon/FlashingElementUtils';

import { CrosswindDigitalAltitudeReadout } from './CrosswindDigitalAltitudeReadout';
import { VerticalTape } from './VerticalTape';
import { HudElems, WindMode, MdaMode, FIVE_DEG } from './HUDUtils';

let DisplayRange = 570;
const ValueSpacing = 100;
const DistanceSpacing = 32;
const neutralPos = 343.5;

class RadioAltIndicator extends DisplayComponent<{ bus: ArincEventBus; filteredRadioAltitude: Subscribable<number> }> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<Arinc429Values>();
  private visibilitySub = Subject.create('hidden');

  private offsetSub = Subject.create('');

  private readonly radioaltitude = Arinc429ConsumerSubject.create(this.sub.on('chosenRa'));
  private setOffset() {
    if (
      this.props.filteredRadioAltitude.get() > DisplayRange ||
      this.radioaltitude.get().isFailureWarning() ||
      this.radioaltitude.get().isNoComputedData()
    ) {
      this.visibilitySub.set('hidden');
    } else {
      this.visibilitySub.set('visible');
      const offset = ((this.props.filteredRadioAltitude.get() - DisplayRange) * DistanceSpacing) / ValueSpacing;
      this.offsetSub.set(`m 557.388 525.13 h 12.201 v ${offset} h -12.201z`);
    }
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.radioaltitude);

    this.props.filteredRadioAltitude.sub((_filteredRadioAltitude) => {
      this.setOffset();
    }, true);

    this.radioaltitude.sub(() => {
      this.setOffset();
    });
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return <path visibility={this.visibilitySub} id="AltTapeGroundReference" class="Fill Green" d={this.offsetSub} />;
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

  private baroMode = new Arinc429Word(0);

  private readonly mda = Arinc429RegisterSubject.createEmpty();

  private landingElevation = new Arinc429Word(0);

  private updateIndication(): void {
    this.qnhLandingAltValid =
      !this.landingElevation.isFailureWarning() &&
      !this.landingElevation.isNoComputedData() &&
      this.inLandingPhases &&
      this.baroMode.bitValueOr(29, false);

    this.qfeLandingAltValid = this.inLandingPhases && !this.baroMode.bitValueOr(29, true);

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
    this.path.set(`m 543.692 ${neutralPos - offset} h 24.69 v 4.781 h -24.69 z`);
    this.visibility.set('visible');
  }

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & FcuBus>();

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
      .on('fcuEisDiscreteWord2') //baromode
      .whenChanged()
      .handle((m) => {
        this.baroMode = m;
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
    return <path visibility={this.visibility} id="AltTapeMdaIndicator" class="Fill Green" d={this.path} />;
  }
}

interface AltitudeIndicatorProps {
  bus: ArincEventBus;
}

export class AltitudeIndicator extends DisplayComponent<AltitudeIndicatorProps> {
  private readonly subscriptions: Subscription[] = [];
  private crosswindMode = false;

  private altIndicatorGroupRef = FSComponent.createRef<SVGGElement>();

  private subscribable = Subject.create<number>(0);

  private tapeRef = FSComponent.createRef<HTMLDivElement>();
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & HEvent & Arinc429Values & FcuBus & HudElems>();

  private readonly altitudeAr = Arinc429ConsumerSubject.create(this.sub.on('altitudeAr'));
  private readonly cWndMode = ConsumerSubject.create(this.sub.on('cWndMode').whenChanged(), false);
  private readonly altTape = ConsumerSubject.create(this.sub.on('altTape').whenChanged(), '');
  private readonly xWindAltTape = ConsumerSubject.create(this.sub.on('xWindAltTape').whenChanged(), '');
  private readonly isTapeVisible = MappedSubject.create(
    ([alt, xwndAlt, altitudeAr]) => {
      if (altitudeAr.isNormalOperation()) {
        this.subscribable.set(altitudeAr.value);
        return alt === 'block' || xwndAlt === 'block' ? 'block' : 'none';
      } else {
        return 'none';
      }
    },
    this.altTape,
    this.xWindAltTape,
    this.altitudeAr,
  );
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.cWndMode, this.altTape, this.xWindAltTape, this.isTapeVisible);

    this.cWndMode.sub(() => {
      this.crosswindMode = this.cWndMode.get();
      if (this.crosswindMode) {
        DisplayRange = 100;
        this.tapeRef.instance.style.transform = `translate3d(0px, -176px, 0px)`;
      } else {
        DisplayRange = 570;
        this.tapeRef.instance.style.transform = `translate3d(0px, 0px, 0px)`;
      }
    });
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }
    super.destroy();
  }

  render(): VNode {
    return (
      <g id="AltitudeTape" transform="translate(557 167)" ref={this.altIndicatorGroupRef}>
        {/* <AltTapeBackground /> */}
        {/* <LandingElevationIndicator bus={this.props.bus} /> */}
        <g ref={this.tapeRef} display={this.isTapeVisible}>
          <VerticalTape
            displayRange={DisplayRange + 60}
            valueSpacing={ValueSpacing}
            distanceSpacing={DistanceSpacing}
            lowerLimit={-1500}
            upperLimit={50000}
            tapeValue={this.subscribable}
            type="altitude"
            bus={this.props.bus}
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

enum TargetAltitudeColor {
  Cyan,
  Magenta,
  White,
}

export class AltitudeIndicatorOfftape extends DisplayComponent<AltitudeIndicatorOfftapeProps> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & FgBus & FcuBus & HudElems>();

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

  private readonly altTape = ConsumerSubject.create(this.sub.on('altTape').whenChanged(), '');
  private readonly xWindAltTape = ConsumerSubject.create(this.sub.on('xWindAltTape').whenChanged(), '');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.altTape, this.xWindAltTape, this.tcasFailed);

    this.sub.on('altitudeAr').handle((altitude) => {
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

    this.tcasFailed.setConsumer(this.sub.on('tcasFail'));

    this.subscriptions.push(
      this.sub
        .on('fmgcDiscreteWord1')
        .whenChanged()
        .handle((v) => {
          this.fmgcDiscreteWord1 = v;
          this.handleAltManagedChange();
        }),
    );
    this.subscriptions.push(
      this.sub
        .on('fmgcDiscreteWord4')
        .whenChanged()
        .handle((v) => {
          this.fmgcDiscreteWord4 = v;
          this.handleAltManagedChange();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fcuSelectedAltitude')
        .whenChanged()
        .handle((alt) => {
          this.fcuSelectedAlt = alt;
          this.handleAltManagedChange();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fmgcFmAltitudeConstraint')
        .whenChanged()
        .handle((cstr) => {
          this.altConstraint = cstr;
          this.handleAltManagedChange();
        }),
    );
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <g ref={this.abnormal} id="altGroup" style="display: none" transform="translate(557 167)">
          <path id="AltTapeOutline" class="NormalStroke Green" d="m500.438 525.13h55.658v-363.26h-55.658" />
          <path id="AltReadoutBackground" class="BlackFill" d="m558.237 362.559h-57.928v-38.125h57.928z" />
          <path id="CrosswindAltReadoutBackground" class="BlackFill" d="m558.237 362.559h-57.928v-38.125h57.928z" />
          <text id="AltFailText" class="Blink9Seconds FontLarge Green EndAlign" x="557" y="354.5 ">
            ALT
          </text>
        </g>
        <g visible={this.tcasFailed} id="Tcas Fail" style="display: none" transform="translate(557 167)">
          <text class="Blink9Seconds FontMedium Green EndAlign" x="141.5" y="100">
            T
          </text>
          <text class="Blink9Seconds FontMedium Green EndAlign" x="141.5" y="105">
            C
          </text>
          <text class="Blink9Seconds FontMedium Green EndAlign" x="141.5" y="110">
            A
          </text>
          <text class="Blink9Seconds FontMedium Green EndAlign" x="141.5" y="115">
            S
          </text>
        </g>
        <g ref={this.normal} id="AltTapes" transform="translate(557 167)">
          <g id="normalAltTape" display={this.altTape}>
            <path
              id="AltTapeOutline"
              class="NormalStroke Green"
              d="m500.438 525.13h75.777m-20.122 -363.26v363.26m-55.658 -363.26h75.777"
            />
            <g transform="translate(0 0)">
              <MinimumDescentAltitudeIndicator bus={this.props.bus} />
            </g>
            <SelectedAltIndicator
              bus={this.props.bus}
              selectedAltitude={this.shownTargetAltitude}
              altitudeColor={this.targetAltitudeColor}
              mode={WindMode.Normal}
            />
            <MetricAltIndicator
              bus={this.props.bus}
              targetAlt={this.shownTargetAltitude}
              altitudeColor={this.targetAltitudeColor}
            />
            <path
              id="AltReadoutBackground"
              class="BlackFill"
              d="m556.112 362.559h-55.803v-38.125h55.803v-11.352h37.675v60.83h-37.675z"
            />
            <g transform="translate(0 0)">
              <RadioAltIndicator bus={this.props.bus} filteredRadioAltitude={this.props.filteredRadioAltitude} />
            </g>
            <DigitalAltitudeReadout bus={this.props.bus} />
          </g>

          <g id="CrosswindAltTape" transform={`translate( 0 -${FIVE_DEG})`} display={this.xWindAltTape}>
            <path id="cwTape" class="NormalStroke Green" d="m547.188 324.432v-25.5" />
            <path id="cwTape" class="NormalStroke Green" d="m547.188 362.682v25.5" />

            <SelectedAltIndicator
              bus={this.props.bus}
              selectedAltitude={this.shownTargetAltitude}
              altitudeColor={this.targetAltitudeColor}
              mode={WindMode.CrossWind}
            />
            <MetricAltIndicator
              bus={this.props.bus}
              targetAlt={this.shownTargetAltitude}
              altitudeColor={this.targetAltitudeColor}
            />
            <CrosswindDigitalAltitudeReadout bus={this.props.bus} />
            <path id="cwTape" class="NormalStroke Green" d="m500.438 388.182h93.5" />
            <path id="cwTape" class="NormalStroke Green" d="m500.438 298.932h93.5" />
          </g>
          <AltimeterIndicator bus={this.props.bus} altitude={this.altitude} />
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
  mode: WindMode;
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

  private minimumLowerText = FSComponent.createRef<SVGTextElement>();

  private altitude = new Arinc429Word(0);

  private shownTargetAltitude = new Arinc429Word(0);
  private isMinLowerAltTxtVisible = '';
  private textSub = Subject.create('');
  private needsUpdate = false;

  private sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & FcuBus & ClockEvents>();
  private ra = 0;

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

  private readonly mdaDhValue = MappedSubject.create(
    ([mdaMode, dh, mda]) => {
      switch (mdaMode) {
        case MdaMode.Baro:
          return Math.round(mda.value);
        case MdaMode.Radio:
          return Math.round(dh.value);
        default:
          return 0;
      }
    },
    this.mdaDhMode,
    this.dh,
    this.mda,
  );
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.sub.on('fmEisDiscreteWord2Raw').handle(this.fmEisDiscrete2.setWord.bind(this.fmEisDiscrete2));
    this.sub.on('fmMdaRaw').handle(this.mda.setWord.bind(this.mda));
    this.sub.on('fmDhRaw').handle(this.dh.setWord.bind(this.dh));
    this.sub
      .on('chosenRa')
      .whenChanged()
      .handle((v) => {
        this.needsUpdate = true;
        this.ra = v.value;
      });

    this.sub.on('realTime').handle((_t) => {
      if (this.needsUpdate === true) {
        this.needsUpdate = false;
        this.mda.get().value;
        const mdaDiff = this.altitude.value - this.mda.get().value;
        const dhDiff = this.ra - this.dh.get().value;
        if (this.mda.get().value > 0) {
          mdaDiff < 0 ? (this.isMinLowerAltTxtVisible = 'block') : (this.isMinLowerAltTxtVisible = 'none');
        } else if (this.dh.get().value > 0) {
          dhDiff < 0 ? (this.isMinLowerAltTxtVisible = 'block') : (this.isMinLowerAltTxtVisible = 'none');
        } else {
          this.isMinLowerAltTxtVisible = 'none';
        }
        this.minimumLowerText.instance.style.display = this.isMinLowerAltTxtVisible;
      }
    });

    this.sub
      .on('altitudeAr')
      .withArinc429Precision(2)
      .handle((a) => {
        this.altitude = a;
        this.handleAltitudeDisplay();
        this.getOffset();
        this.handleCrosswinMode();
      });

    this.sub
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
      this.isMinLowerAltTxtVisible === 'block'
        ? (this.selectedAltLowerGroupRef.instance.style.display = 'none')
        : (this.selectedAltLowerGroupRef.instance.style.display = 'block');
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
    let boxLength = 82;
    let text = '0';
    if (this.baroInStd) {
      text = Math.round(this.shownTargetAltitude.value / 100)
        .toString()
        .padStart(3, '0');
      boxLength = 53;
    } else {
      text = Math.round(this.shownTargetAltitude.value).toString().padStart(5, ' ');
    }
    this.textSub.set(text);
    this.blackFill.instance.setAttribute('d', `m500.438 330.582 h ${boxLength} v 25.702 h-${boxLength}z`);
  }

  private getOffset() {
    const offset = ((this.altitude.value - this.shownTargetAltitude.value) * DistanceSpacing) / ValueSpacing;
    this.targetGroupRef.instance.style.transform = `translate3d(0px, ${offset}px, 0px)`;
  }

  private handleCrosswinMode() {
    if (this.props.mode === WindMode.Normal) {
      this.minimumLowerText.instance.setAttribute('x', '586.5');
      this.minimumLowerText.instance.setAttribute('y', '547');
      this.selectedAltLowerText.instance.setAttribute('y', '547');
      this.selectedAltLowerFLText.instance.setAttribute('y', '547');
      this.selectedAltUpperText.instance.setAttribute('y', '158.3');
      this.selectedAltUpperFLText.instance.setAttribute('y', '157.8');
    } else {
      this.minimumLowerText.instance.setAttribute('x', '599.25');
      this.minimumLowerText.instance.setAttribute('y', '412.25');
      this.selectedAltLowerText.instance.setAttribute('y', '412.25');
      this.selectedAltLowerFLText.instance.setAttribute('y', '412.25');
      this.selectedAltUpperText.instance.setAttribute('y', '293.25');
      this.selectedAltUpperFLText.instance.setAttribute('y', '293.25');
    }
  }

  render(): VNode | null {
    return (
      <>
        <text
          id="MinimumLowerText"
          ref={this.minimumLowerText}
          class="FontMedium EndAlign Green"
          x="586.5"
          y="547"
          style="white-space: pre"
        >
          MINIMUM
        </text>
        <g id="SelectedAltLowerGroup" ref={this.selectedAltLowerGroupRef}>
          <text
            id="SelectedAltLowerText"
            ref={this.selectedAltLowerText}
            class="FontMedium EndAlign Green"
            x="577"
            y="547"
            style="white-space: pre"
          >
            {this.textSub}
          </text>
          <text
            id="SelectedAltLowerFLText"
            ref={this.selectedAltLowerFLText}
            class="FontMedium MiddleAlign Green"
            x="513.7"
            y="547"
          >
            FL
          </text>
        </g>
        <g id="SelectedAltUpperGroup" ref={this.selectedAltUpperGroupRef}>
          <text
            id="SelectedAltUpperText"
            ref={this.selectedAltUpperText}
            class="FontMedium EndAlign Green"
            x="579"
            y="158.3"
            style="white-space: pre"
          >
            {this.textSub}
          </text>
          <text
            id="SelectedAltUpperFLText"
            ref={this.selectedAltUpperFLText}
            class="FontMedium MiddleAlign Green"
            x="513.6"
            y="157.8"
          >
            FL
          </text>
        </g>
        <g id="AltTapeTargetSymbol" ref={this.targetGroupRef}>
          <path class="BlackFill" ref={this.blackFill} />
          <path
            class="NormalStroke Green"
            ref={this.targetSymbolRef}
            d="m521.858 356.282v27.844h-29.968v-36.412l8.562 -4.284m20.587 -12.851v-27.844h-29.15v36.412l8.562 4.284"
          />
          <path id="targetAltTxtBg" d="m501.5 331.5h93.5v21.25h-93.5z" />
          <text
            id="AltTapeTargetText"
            ref={this.altTapeTargetText}
            class="FontMedium StartAlign Green"
            x="502.5"
            y="351"
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
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getArincSubscriber<HUDSimvars & FcuBus & Arinc429Values & HudElems>();

  private flightPhase = -1;

  private pressure = 0;

  private unit = '';

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

  private stdGroup = FSComponent.createRef<SVGGElement>();

  private stdVisible = Subject.create(false);

  private altiSettingVisible = Subject.create(false);

  private qfeBorderHidden = Subject.create(true);

  private readonly QFE = ConsumerSubject.create(this.sub.on('QFE').whenChanged(), '');
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.QFE);

    this.subscriptions.push(
      this.sub
        .on('fcuEisDiscreteWord1')
        .whenChanged()
        .handle((word) => {
          this.baroInInhg = word.bitValueOr(11, false);

          this.getText();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fcuEisDiscreteWord2')
        .whenChanged()
        .handle((word) => {
          this.baroInStd = word.bitValueOr(28, false) || word.isFailureWarning();
          this.baroInQnh = word.bitValueOr(29, false);

          this.getText();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('baroMode')
        .whenChanged()
        .handle(() => {
          this.getText();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fcuEisDiscreteWord1')
        .whenChanged()
        .handle((word) => {
          this.baroInInhg = word.bitValueOr(11, false);

          this.getText();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fcuEisDiscreteWord2')
        .whenChanged()
        .handle((word) => {
          this.baroInStd = word.bitValueOr(28, false) || word.isFailureWarning();
          this.baroInQnh = word.bitValueOr(29, false);

          this.getText();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fmgcFlightPhase')
        .whenChanged()
        .handle((fp) => {
          this.flightPhase = fp;

          this.handleBlink();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fmTransAltRaw')
        .whenChanged()
        .handle((ta) => {
          this.transAltAr.set(ta);

          this.getText();
          this.handleBlink();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fmTransLvlRaw')
        .whenChanged()
        .handle((tl) => {
          this.transLvlAr.set(tl);

          this.getText();
          this.handleBlink();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fcuEisBaro')
        .whenChanged()
        .handle((p) => {
          this.baroInhg = p;
          this.getText();
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fcuEisBaroHpa')
        .whenChanged()
        .handle((p) => {
          this.baroHpa = p;
          this.getText();
        }),
    );

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

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        <g id="QfeGroup" display={this.QFE}>
          <FlashOneHertz
            bus={this.props.bus}
            flashDuration={Infinity}
            flashing={this.shouldFlash}
            visible={this.stdVisible}
          >
            <g ref={this.stdGroup} id="STDAltimeterModeGroup" transform="translate(0 10)">
              <path class="NormalStroke Green" d="m527 559.895h55.25v29.986h-55.25z" />
              <text class="FontMedium Green AlignLeft" x="534.471" y="583.78">
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
            <g id="AltimeterGroup" transform="translate(0 10)">
              <g id="QFEGroup">
                <path
                  class={{
                    NormalStroke: true,
                    White: true,
                    HiddenElement: this.qfeBorderHidden,
                  }}
                  d="m496.557 565.534h59.237v25.047h-59.237z"
                />
                <text id="AltimeterModeText" class="FontMedium Green" x="502.480305" y="586.9">
                  {this.mode}
                </text>
                <text id="AltimeterSettingText" class="FontMedium MiddleAlign Green" x="600.3" y="586.9">
                  {this.text}
                </text>
              </g>
            </g>
          </FlashOneHertz>
        </g>
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
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getArincSubscriber<
    HUDSimvars & Arinc429Values & ClockEvents & FcuBus & FgBus & HudElems
  >();
  private needsUpdate = false;

  private metricAltRef = FSComponent.createRef<SVGGElement>();

  private metricAltText = FSComponent.createRef<SVGTextElement>();

  private metricAltTargetText = FSComponent.createRef<SVGTextElement>();
  private metricAltTargetMText = FSComponent.createRef<SVGTextElement>();

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

  private readonly cWndMode = ConsumerSubject.create(this.sub.on('cWndMode').whenChanged(), false);
  private readonly metricAlt = ConsumerSubject.create(this.sub.on('metricAlt').whenChanged(), false);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.cWndMode, this.metricAlt);
    this.mda.sub(() => (this.needsUpdate = true));

    this.cWndMode.sub(() => {
      if (this.cWndMode.get()) {
        this.metricAltRef.instance.style.transform = `translate3d(0px, ${FIVE_DEG}px, 0px)`;
        this.metricAltTargetText.instance.setAttribute('x', '442');
        this.metricAltTargetMText.instance.setAttribute('x', '484.5');
        this.metricAltTargetText.instance.setAttribute('y', '110');
        this.metricAltTargetMText.instance.setAttribute('y', '110');
      } else {
        this.metricAltRef.instance.style.transform = 'translate3d(0px, 0px, 0px)';
        this.metricAltTargetText.instance.setAttribute('x', '400');
        this.metricAltTargetMText.instance.setAttribute('x', '442');
        this.metricAltTargetText.instance.setAttribute('y', '159');
        this.metricAltTargetMText.instance.setAttribute('y', '159');
      }
    });

    this.subscriptions.push(
      this.sub.on('altitudeAr').handle((a) => {
        this.state.altitude = a;
        this.needsUpdate = true;
      }),
    );

    this.props.altitudeColor.sub((color) => {
      this.state.altitudeColor = color;
      this.needsUpdate = true;
    });

    this.props.targetAlt.sub((alt) => {
      this.state.targetAlt = alt;
      this.needsUpdate = true;
    });

    this.subscriptions.push(
      this.sub
        .on('fcuDiscreteWord1')
        .whenChanged()
        .handle((m) => {
          this.state.fcuDiscreteWord1 = m;
          this.needsUpdate = true;
        }),
    );

    this.subscriptions.push(this.sub.on('fmMdaRaw').handle(this.mda.setWord.bind(this.mda)));

    this.subscriptions.push(
      this.sub
        .on('fmgcDiscreteWord1')
        .whenChanged()
        .handle((v) => {
          this.fmgcDiscreteWord1 = v;
          this.needsUpdate = true;
        }),
    );

    this.subscriptions.push(
      this.sub
        .on('fmgcDiscreteWord4')
        .whenChanged()
        .handle((v) => {
          this.fmgcDiscreteWord4 = v;
          this.needsUpdate = true;
        }),
    );

    this.subscriptions.push(this.sub.on('realTime').handle(this.updateState.bind(this)));
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
      if (showMetricAlt) {
        if (this.metricAlt.get()) {
          this.metricAltRef.instance.style.display = 'inline';
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
            this.metricAltText.instance.classList.replace('Green', 'Green');
          } else {
            this.metricAltText.instance.classList.replace('Green', 'Green');
          }
        } else {
          this.metricAltRef.instance.style.display = 'none';
        }
      } else {
        this.metricAltRef.instance.style.display = 'none';
      }
    }
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <g id="MetricAltGroup" ref={this.metricAltRef}>
        <path class="NormalStroke Green" d="m495.38 600 h124.155v29.986h-124.155z" />
        <text class="FontMedium Green MiddleAlign" x="603.6503225" y="625.192825">
          M
        </text>
        <text ref={this.metricAltText} id="MetricAltText" class="FontMedium Green MiddleAlign" x="546.75" y="625">
          0
        </text>
        <g id="MetricAltTargetGroup">
          <text
            id="MetricAltTargetText"
            ref={this.metricAltTargetText}
            class="FontMedium Green MiddleAlign"
            x="400"
            y="161"
          >
            0
          </text>
          <text ref={this.metricAltTargetMText} class="FontMedium Green MiddleAlign" x="447.345395" y="161">
            M
          </text>
        </g>
      </g>
    );
  }
}
