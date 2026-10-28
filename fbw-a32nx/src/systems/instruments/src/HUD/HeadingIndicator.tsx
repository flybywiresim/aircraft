// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ClockEvents,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  HEvent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
  Subscription,
} from '@microsoft/msfs-sdk';
import { Arinc429ConsumerSubject, ArincEventBus } from '@flybywiresim/fbw-sdk';

import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { HorizontalTape } from './HorizontalTape';
import { getSmallestAngle, HudElems, FIVE_DEG } from './HUDUtils';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';
import { getDisplayIndex } from './HUD';

const DisplayRange = 18;
const DistanceSpacing = FIVE_DEG;
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

  private lsPressed = ConsumerSubject.create(null, false);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getArincSubscriber<DmcLogicEvents & HUDSimvars & Arinc429Values & HEvent>();

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

    this.lsPressed.setConsumer(sub.on(getDisplayIndex() === 1 ? 'ls1Button' : 'ls2Button'));
  }

  render(): VNode {
    return (
      <>
        <g ref={this.abnormalRef} transform="scale(4 4)">
          <text id="HDGFailText" class="Blink9Seconds FontLargest EndAlign Red" x="154" y="120">
            HDG
          </text>
        </g>
        <g id="HeadingOfftapeGroup" ref={this.normalRef} transform="translate(571 367)">
          <SelectedHeading heading={this.heading} bus={this.props.bus} />
          <QFUIndicator
            bus={this.props.bus}
            heading={this.heading}
            ILSCourse={this.ILSCourse}
            lsPressed={this.lsPressed}
          />
          {/* <path class="Fill Green" d="m69.61 155h-1.5119v-18h1.5119z" />  */}
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
  private selectedHeading = NaN;

  private showSelectedHeading = 0;

  private targetIndicator = FSComponent.createRef<SVGPathElement>();

  private text = Subject.create('');

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<HUDSimvars>();

    sub
      .on('selectedHeading')
      .whenChanged()
      .handle((h) => {
        if (this.showSelectedHeading === 1) {
          this.selectedHeading = h;
          this.handleDelta(this.props.heading.get(), this.selectedHeading);
        } else {
          this.selectedHeading = NaN;
        }
      });

    sub
      .on('showSelectedHeading')
      .whenChanged()
      .handle((sh) => {
        this.showSelectedHeading = sh;
        if (this.showSelectedHeading === 0) {
          this.selectedHeading = NaN;
        }
        this.handleDelta(this.props.heading.get(), this.selectedHeading);
      });

    this.props.heading.sub((h) => {
      this.handleDelta(h, this.selectedHeading);
    }, true);
  }

  private handleDelta(heading: number, selectedHeading: number) {
    const headingDelta = getSmallestAngle(selectedHeading, heading);

    this.text.set(Math.round(selectedHeading).toString().padStart(3, '0'));

    if (Number.isNaN(selectedHeading)) {
      this.targetIndicator.instance.classList.add('HiddenElement');
      return;
    }

    if (Math.abs(headingDelta) < DisplayRange) {
      const offset = (headingDelta * DistanceSpacing) / ValueSpacing;

      this.targetIndicator.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
      this.targetIndicator.instance.classList.remove('HiddenElement');

      return;
    }
    this.targetIndicator.instance.classList.add('HiddenElement');
  }

  render(): VNode {
    return (
      <>
        <path
          ref={this.targetIndicator}
          id="HeadingTargetIndicator"
          class="ThickStroke  Green CornerRound"
          d="m70 145.1  5.5 -15 h -13.2 l 5.5 15"
        />
      </>
    );
  }
}

interface GroundTrackBugProps {
  heading: Subscribable<number>;
  bus: ArincEventBus;
}

class GroundTrackBug extends DisplayComponent<GroundTrackBugProps> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getArincSubscriber<
    Arinc429Values & DmcLogicEvents & HUDSimvars & ClockEvents & HudElems
  >();
  private readonly groundTrack = Arinc429ConsumerSubject.create(this.sub.on('track'));
  private readonly headingTrk = ConsumerSubject.create(this.sub.on('headingTrk'), '');
  private readonly fpa = Arinc429ConsumerSubject.create(this.sub.on('fpa'));

  private isVisibleSub = MappedSubject.create(
    ([groundTrack, heading]) => {
      const delta = getSmallestAngle(groundTrack.value, heading);
      // TODO should also be hidden if heading is invalid
      return groundTrack.isNormalOperation() && Math.abs(delta) < DisplayRange;
    },
    this.groundTrack,
    this.props.heading,
  );

  private isDisplayed = MappedSubject.create(
    ([headingTrk, fpa]) => {
      if (Math.abs(fpa.value) < 1.5) {
        return 'none';
      } else {
        const bHeadingTrk = headingTrk === 'block' ? true : false;
        // TODO should also be hidden if heading is invalid
        return this.isVisibleSub && bHeadingTrk ? 'block' : 'none';
      }
    },
    this.headingTrk,
    this.fpa,
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

    this.subscriptions.push(this.groundTrack, this.headingTrk);

    this.groundTrack.setConsumer(this.sub.on('track').withArinc429Precision(3));
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <g style={{ transform: this.transformSub }} id="ActualTrackIndicator" display={this.isDisplayed}>
        <path class="ThickOutline CornerRound" d="m68.906 145.75   -6 9 6 9 6 -9z" />
        <path class="ThickStroke Green CornerRound" d="m68.906 145.75   -6 9 6 9 6 -9z" />
      </g>
    );
  }
}

class QFUIndicator extends DisplayComponent<{
  bus: ArincEventBus;
  ILSCourse: Subscribable<number>;
  heading: Subscribable<number>;
  lsPressed: Subscribable<boolean>;
}> {
  private readonly subscriptions: Subscription[] = [];
  private readonly sub = this.props.bus.getArincSubscriber<HUDSimvars & Arinc429Values & HudElems>();

  private flightPhase = -1;
  private declutterMode = 0;
  private sVisibility = Subject.create<String>('none');

  private qfuContainer = FSComponent.createRef<SVGGElement>();

  private ilsCoursePointer = FSComponent.createRef<SVGGElement>();

  private heading = 0;

  private ilsCourse = -1;

  private lsPressed = false;

  private text = Subject.create('');

  private DeclutterSimVar = '';

  private readonly IlsHorizonTrk = ConsumerSubject.create(this.sub.on('IlsHorizonTrk').whenChanged(), '');
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subscriptions.push(this.IlsHorizonTrk);

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
            this.ilsCoursePointer.instance.classList.add('HiddenElement');
          } else {
            this.ilsCoursePointer.instance.classList.add('HiddenElement');
          }
        } else {
          const offset = (getSmallestAngle(this.ilsCourse, this.heading) * DistanceSpacing) / ValueSpacing;
          this.ilsCoursePointer.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
          this.ilsCoursePointer.instance.classList.remove('HiddenElement');
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
            this.ilsCoursePointer.instance.classList.add('HiddenElement');
          } else {
            this.ilsCoursePointer.instance.classList.add('HiddenElement');
          }
        } else {
          const offset = (getSmallestAngle(this.ilsCourse, this.heading) * DistanceSpacing) / ValueSpacing;
          this.ilsCoursePointer.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
          this.ilsCoursePointer.instance.classList.remove('HiddenElement');
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
      <g ref={this.qfuContainer} display={this.IlsHorizonTrk}>
        <g id="ILSCoursePointer" ref={this.ilsCoursePointer}>
          <path class="ThickOutline" d="m58.9 135 h 20 m -10 -22 v30" />
          <path class="ThickStroke Green" d="m58.9 135 h 20 m -10 -22 v30" />
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
  onAfterRender(): void {
    this.props.bus
      .getSubscriber<DmcLogicEvents>()
      .on('trueRefActive')
      .whenChanged()
      .handle((v) => this.trueRefActive.set(v));
    // FIXME this should be 127-11 from FWC
    this.props.bus
      .getSubscriber<HUDSimvars>()
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
        <rect x="38" y="85" width="61" height="25" class="Green NormalStroke" />
        <text x="68.9065" y="100" text-anchor="middle" alignment-baseline="middle" class="FontLargest Green">
          TRUE
        </text>
      </g>
    );
  }
}
