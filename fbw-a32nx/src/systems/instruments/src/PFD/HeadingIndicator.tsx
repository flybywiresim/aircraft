// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, MappedSubject, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { Arinc429ConsumerSubject, Arinc429Word, ArincEventBus } from '@flybywiresim/fbw-sdk';

import { FcuBus } from 'instruments/src/PFD/shared/FcuBusProvider';
import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { HorizontalTape } from './HorizontalTape';
import { getSmallestAngle } from './PFDUtils';
import { PFDSimvars } from './shared/PFDSimvarPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';

const DisplayRange = 24;
const DistanceSpacing = 7.555;
const ValueSpacing = 5;

interface HeadingTapeProps {
  bus: ArincEventBus;
  failed: Subscribable<boolean>;
}

export class HeadingTape extends DisplayComponent<HeadingTapeProps> {
  private headingTapeRef = FSComponent.createRef<SVGGElement>();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.failed.sub((failed) => {
      if (failed) {
        this.headingTapeRef.instance.style.visibility = 'hidden';
      } else {
        this.headingTapeRef.instance.style.visibility = 'visible';
      }
    });
  }

  render(): VNode {
    return (
      <g ref={this.headingTapeRef}>
        <path id="HeadingTapeBackground" d="m32.138 145.34h73.536v10.382h-73.536z" class="TapeBackground" />
        <HorizontalTape
          bus={this.props.bus}
          type="headingTape"
          displayRange={DisplayRange + 3}
          valueSpacing={ValueSpacing}
          distanceSpacing={DistanceSpacing}
        />
      </g>
    );
  }
}

export class HeadingOfftape extends DisplayComponent<{ bus: ArincEventBus; failed: Subscribable<boolean> }> {
  private normalRef = FSComponent.createRef<SVGGElement>();

  private abnormalRef = FSComponent.createRef<SVGGElement>();

  private heading = Subject.create(0);

  private ILSCourse = Subject.create(0);

  private lsPressed = Subject.create(false);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<DmcLogicEvents & PFDSimvars & Arinc429Values & FcuBus>();

    sub
      .on('heading')
      .withArinc429Precision(2)
      .handle((word) => {
        this.heading.set(word.value);

        if (word.isNormalOperation()) {
          this.normalRef.instance.style.visibility = 'visible';
          this.abnormalRef.instance.style.visibility = 'hidden';
        } else {
          this.normalRef.instance.style.visibility = 'hidden';
          this.abnormalRef.instance.style.visibility = 'visible';
        }
      });

    sub
      .on('ilsCourse')
      .whenChanged()
      .handle((n) => {
        this.ILSCourse.set(n);
      });

    sub
      .on('fcuEisDiscreteWord2')
      .whenChanged()
      .handle((word) => {
        this.lsPressed.set(word.bitValueOr(22, false) || word.isFailureWarning());
      });
  }

  render(): VNode {
    return (
      <>
        <g ref={this.abnormalRef}>
          <path id="HeadingTapeBackground" d="m32.138 145.34h73.536v10.382h-73.536z" class="TapeBackground" />
          <path id="HeadingTapeOutline" class="NormalStroke Red" d="m32.138 156.23v-10.886h73.536v10.886" />
          <text id="HDGFailText" class="Blink9Seconds FontLargest EndAlign Red" x="75.926208" y="151.95506">
            HDG
          </text>
        </g>
        <g id="HeadingOfftapeGroup" ref={this.normalRef}>
          <path id="HeadingTapeOutline" class="NormalStroke White" d="m32.138 156.23v-10.886h73.536v10.886" />
          <SelectedHeading heading={this.heading} bus={this.props.bus} />
          <QFUIndicator heading={this.heading} ILSCourse={this.ILSCourse} lsPressed={this.lsPressed} />
          <path class="Fill Yellow" d="m69.61 147.31h-1.5119v-8.0635h1.5119z" />
          <GroundTrackBug bus={this.props.bus} heading={this.heading} />
          <TrueFlag bus={this.props.bus} />
        </g>
      </>
    );
  }
}

interface SelectedHeadingProps {
  bus: ArincEventBus;
  heading: Subscribable<number>;
}

class SelectedHeading extends DisplayComponent<SelectedHeadingProps> {
  private selectedHeading = new Arinc429Word(0);

  private selectedTrack = new Arinc429Word(0);

  private fcuDiscreteWord1 = new Arinc429Word(0);

  private heading = 0;

  private targetIndicator = FSComponent.createRef<SVGPathElement>();

  private headingTextRight = FSComponent.createRef<SVGPathElement>();

  private headingTextLeft = FSComponent.createRef<SVGPathElement>();

  private text = Subject.create('');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<Arinc429Values & FcuBus>();

    sub
      .on('fcuSelectedHeading')
      .whenChanged()
      .handle((h) => {
        this.selectedHeading = h;
        this.handleDelta();
      });

    sub
      .on('fcuSelectedTrack')
      .whenChanged()
      .handle((t) => {
        this.selectedTrack = t;
        this.handleDelta();
      });

    sub
      .on('fcuDiscreteWord1')
      .whenChanged()
      .handle((a) => {
        this.fcuDiscreteWord1 = a;
        this.handleDelta();
      });

    this.props.heading.sub((h) => {
      this.heading = h;
      this.handleDelta();
    }, true);
  }

  private handleDelta() {
    const trkFpaActive = this.fcuDiscreteWord1.bitValueOr(25, false);
    const targetValue = trkFpaActive ? this.selectedTrack : this.selectedHeading;

    if (targetValue.isNoComputedData() || targetValue.isFailureWarning()) {
      this.headingTextLeft.instance.classList.add('HiddenElement');
      this.targetIndicator.instance.classList.add('HiddenElement');
      this.headingTextRight.instance.classList.add('HiddenElement');
      return;
    }

    const headingDelta = getSmallestAngle(targetValue.value, this.heading);

    this.text.set(Math.round(targetValue.value).toString().padStart(3, '0'));

    if (Math.abs(headingDelta) < DisplayRange) {
      const offset = (headingDelta * DistanceSpacing) / ValueSpacing;

      this.targetIndicator.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
      this.targetIndicator.instance.classList.remove('HiddenElement');
      this.headingTextRight.instance.classList.add('HiddenElement');
      this.headingTextLeft.instance.classList.add('HiddenElement');
      return;
    }
    this.targetIndicator.instance.classList.add('HiddenElement');

    if (headingDelta > 0) {
      this.headingTextRight.instance.classList.remove('HiddenElement');
      this.headingTextLeft.instance.classList.add('HiddenElement');
    } else {
      this.headingTextRight.instance.classList.add('HiddenElement');
      this.headingTextLeft.instance.classList.remove('HiddenElement');
    }
  }

  render(): VNode {
    return (
      <>
        <path
          ref={this.targetIndicator}
          id="HeadingTargetIndicator"
          class="NormalStroke Cyan CornerRound"
          d="m69.978 145.1 1.9501-5.3609h-6.0441l1.9501 5.3609"
        />
        <text
          ref={this.headingTextRight}
          id="SelectedHeadingTextRight"
          class="FontSmallest MiddleAlign Cyan"
          x="101.70432"
          y="144.34792"
        >
          {this.text}
        </text>
        <text
          ref={this.headingTextLeft}
          id="SelectedHeadingTextLeft"
          class="FontSmallest MiddleAlign Cyan"
          x="36.418198"
          y="144.32108"
        >
          {this.text}
        </text>
      </>
    );
  }
}

interface GroundTrackBugProps {
  heading: Subscribable<number>;
  bus: ArincEventBus;
}

class GroundTrackBug extends DisplayComponent<GroundTrackBugProps> {
  private groundTrack = Arinc429ConsumerSubject.create(null);

  private isVisibleSub = MappedSubject.create(
    ([groundTrack, heading]) => {
      const delta = getSmallestAngle(groundTrack.value, heading);
      // TODO should also be hidden if heading is invalid
      return groundTrack.isNormalOperation() && Math.abs(delta) < DisplayRange;
    },
    this.groundTrack,
    this.props.heading,
  );

  private transformSub = MappedSubject.create(
    ([groundTrack, heading]) => {
      const offset = (getSmallestAngle(groundTrack.value, heading) * DistanceSpacing) / ValueSpacing;
      return `translate3d(${offset}px, 0px, 0px)`;
    },
    this.groundTrack,
    this.props.heading,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<DmcLogicEvents>();
    this.groundTrack.setConsumer(sub.on('track').withArinc429Precision(3));
  }

  render(): VNode {
    return (
      <g
        style={{ transform: this.transformSub, display: this.isVisibleSub.map((v) => (v ? '' : 'none')) }}
        id="ActualTrackIndicator"
      >
        <path class="ThickOutline CornerRound" d="m68.906 145.75-1.2592 1.7639 1.2592 1.7639 1.2592-1.7639z" />
        <path class="ThickStroke Green CornerRound" d="m68.906 145.75-1.2592 1.7639 1.2592 1.7639 1.2592-1.7639z" />
      </g>
    );
  }
}

class QFUIndicator extends DisplayComponent<{
  ILSCourse: Subscribable<number>;
  heading: Subscribable<number>;
  lsPressed: Subscribable<boolean>;
}> {
  private qfuContainer = FSComponent.createRef<SVGGElement>();

  private ilsCourseRight = FSComponent.createRef<SVGGElement>();

  private ilsCourseLeft = FSComponent.createRef<SVGGElement>();

  private ilsCoursePointer = FSComponent.createRef<SVGGElement>();

  private heading = 0;

  private ilsCourse = -1;

  private lsPressed = false;

  private text = Subject.create('');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.props.heading.sub((h) => {
      this.heading = h;

      const delta = getSmallestAngle(this.ilsCourse, this.heading);
      this.text.set(Math.round(this.ilsCourse).toString().padStart(3, '0'));

      if (this.ilsCourse < 0) {
        this.qfuContainer.instance.classList.add('HiddenElement');
      } else if (this.lsPressed) {
        this.qfuContainer.instance.classList.remove('HiddenElement');
        if (Math.abs(delta) > DisplayRange) {
          if (delta > 0) {
            this.ilsCourseRight.instance.classList.remove('HiddenElement');
            this.ilsCourseLeft.instance.classList.add('HiddenElement');
            this.ilsCoursePointer.instance.classList.add('HiddenElement');
          } else {
            this.ilsCourseLeft.instance.classList.remove('HiddenElement');
            this.ilsCourseRight.instance.classList.add('HiddenElement');
            this.ilsCoursePointer.instance.classList.add('HiddenElement');
          }
        } else {
          const offset = (getSmallestAngle(this.ilsCourse, this.heading) * DistanceSpacing) / ValueSpacing;
          this.ilsCoursePointer.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
          this.ilsCoursePointer.instance.classList.remove('HiddenElement');
          this.ilsCourseRight.instance.classList.add('HiddenElement');
          this.ilsCourseLeft.instance.classList.add('HiddenElement');
        }
      }
    });

    this.props.ILSCourse.sub((c) => {
      this.ilsCourse = c;

      const delta = getSmallestAngle(this.ilsCourse, this.heading);
      this.text.set(Math.round(this.ilsCourse).toString().padStart(3, '0'));

      if (c < 0) {
        this.qfuContainer.instance.classList.add('HiddenElement');
      } else if (this.lsPressed) {
        this.qfuContainer.instance.classList.remove('HiddenElement');
        if (Math.abs(delta) > DisplayRange) {
          if (delta > 0) {
            this.ilsCourseRight.instance.classList.remove('HiddenElement');
            this.ilsCourseLeft.instance.classList.add('HiddenElement');
            this.ilsCoursePointer.instance.classList.add('HiddenElement');
          } else {
            this.ilsCourseLeft.instance.classList.remove('HiddenElement');
            this.ilsCourseRight.instance.classList.add('HiddenElement');
            this.ilsCoursePointer.instance.classList.add('HiddenElement');
          }
        } else {
          const offset = (getSmallestAngle(this.ilsCourse, this.heading) * DistanceSpacing) / ValueSpacing;
          this.ilsCoursePointer.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
          this.ilsCoursePointer.instance.classList.remove('HiddenElement');
          this.ilsCourseRight.instance.classList.add('HiddenElement');
          this.ilsCourseLeft.instance.classList.add('HiddenElement');
        }
      }
    });

    this.props.lsPressed.sub((ls) => {
      this.lsPressed = ls;
      // ilsCourse may be negative if tuned via the RMP then back to MCDU
      if (ls && this.ilsCourse >= 0) {
        this.qfuContainer.instance.classList.remove('HiddenElement');
      } else {
        this.qfuContainer.instance.classList.add('HiddenElement');
      }
    });
  }

  render(): VNode {
    return (
      <g ref={this.qfuContainer}>
        <g id="ILSCoursePointer" class="HiddenElement" ref={this.ilsCoursePointer}>
          <path class="ThickOutline" d="m66.992 152.82h3.8279m-1.914-6.5471v9.4518" />
          <path class="ThickStroke Magenta" d="m66.992 152.82h3.8279m-1.914-6.5471v9.4518" />
        </g>
        <g id="ILSCourseRight" class="HiddenElement" ref={this.ilsCourseRight}>
          <path class="BlackFill NormalStroke White" d="m100.57 149.68h12.088v6.5516h-12.088z" />
          <text id="ILSCourseTextRight" class="FontMedium MiddleAlign Magenta" x="106.95047" y="155.22305">
            {this.text}
          </text>
        </g>
        <g id="ILSCourseLeft" class="HiddenElement" ref={this.ilsCourseLeft}>
          <path class="BlackFill NormalStroke White" d="m26.094 156.18v-6.5516h12.088v6.5516z" />
          <text id="ILSCourseTextLeft" class="FontMedium MiddleAlign Magenta" x="32.406616" y="155.22305">
            {this.text}
          </text>
        </g>
      </g>
    );
  }
}

interface TrueFlagProps {
  bus: ArincEventBus;
}

class TrueFlag extends DisplayComponent<TrueFlagProps> {
  private readonly trueRefActive = Subject.create(false);

  private readonly slatsExtended = Subject.create(false);

  private readonly slatsExtendedWithTrue = Subject.create(false);

  private readonly trueFlagRef = FSComponent.createRef<SVGGElement>();

  /** @inheritdoc */
  onAfterRender(_node: VNode): void {
    this.props.bus
      .getSubscriber<DmcLogicEvents>()
      .on('trueRefActive')
      .whenChanged()
      .handle((v) => this.trueRefActive.set(v));
    // FIXME this should be 127-11 from FWC
    this.props.bus
      .getSubscriber<PFDSimvars>()
      .on('slatPosLeft')
      .withPrecision(0.25)
      .handle((v) => this.slatsExtended.set(v > 0.4));

    this.trueRefActive.sub((trueRef) => this.trueFlagRef.instance.classList.toggle('HiddenElement', !trueRef), true);

    this.trueRefActive.sub(this.handleSlatsTrue.bind(this));
    this.slatsExtended.sub(this.handleSlatsTrue.bind(this));
    this.slatsExtendedWithTrue.sub((flash) => this.trueFlagRef.instance.classList.toggle('Blink10Seconds', flash));
  }

  private handleSlatsTrue(): void {
    this.slatsExtendedWithTrue.set(this.trueRefActive.get() && this.slatsExtended.get());
  }

  /** @inheritdoc */
  render(): VNode {
    return (
      <g id="TrueRefFlag" ref={this.trueFlagRef}>
        <rect x="62.439" y="134.468" width="12.935" height="4.575" class="Cyan NormalStroke" />
        <text x="68.9065" y="137.008" text-anchor="middle" alignment-baseline="middle" class="FontSmallest Cyan">
          TRUE
        </text>
      </g>
    );
  }
}
