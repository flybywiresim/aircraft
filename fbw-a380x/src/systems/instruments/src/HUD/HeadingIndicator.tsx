import {
  DisplayComponent,
  EventBus,
  FSComponent,
  HEvent,
  Subject,
  Subscribable,
  VNode,
  ClockEvents,
  ConsumerSubject,
  MappedSubject,
} from '@microsoft/msfs-sdk';
import { FIVE_DEG, getSmallestAngle, HudElems } from './HUDUtils';
import { HUDSimvars } from './shared/HUDSimvarPublisher';
import { Arinc429Values } from './shared/ArincValueProvider';
import { getDisplayIndex } from './HUD';
import { DmcLogicEvents } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { Arinc429ConsumerSubject } from '@flybywiresim/fbw-sdk';
import { FcuEfisCpBusEvents } from '@shared/publishers/EfisCpBusPublisher';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { PrimFgBusBaseEvents } from '@shared/publishers/PrimFgPublisher';

const DisplayRange = 18;
const DistanceSpacing = FIVE_DEG;
const ValueSpacing = 5;

export class HeadingOfftape extends DisplayComponent<{ bus: EventBus; failed: Subscribable<boolean> }> {
  private readonly sub = this.props.bus.getSubscriber<FcuEfisCpBusEvents>();

  private readonly fcuEisDiscreteWord2 = Arinc429LocalVarConsumerSubject.create(null);

  private readonly lsPressed = this.fcuEisDiscreteWord2.map((word) => word.bitValueOr(14, true));

  private normalRef = FSComponent.createRef<SVGGElement>();

  private heading = Subject.create(0);

  private ILSCourse = Subject.create(0);

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const isFo = getDisplayIndex() === 2;

    this.fcuEisDiscreteWord2.setConsumer(
      this.sub.on(isFo ? 'fcu_efis_r_discrete_word_2' : 'fcu_efis_l_discrete_word_2'),
    );
    const sub = this.props.bus.getSubscriber<HUDSimvars & Arinc429Values & HEvent>();

    sub.on('headingAr').handle((h) => {
      this.heading.set(h.value);

      if (h.isNormalOperation()) {
        this.normalRef.instance.style.visibility = 'visible';
      } else {
        this.normalRef.instance.style.visibility = 'hidden';
      }
    });

    sub
      .on('ilsCourse')
      .whenChanged()
      .handle((n) => {
        this.ILSCourse.set(n);
      });
  }

  render(): VNode {
    return (
      <>
        <g id="HeadingOfftapeGroup" ref={this.normalRef}>
          <SelectedHeading heading={this.heading} bus={this.props.bus} />
          <QFUIndicator heading={this.heading} ILSCourse={this.ILSCourse} lsPressed={this.lsPressed} />
          <path class="Fill Green" d="m642 532 h -4 v -40 h 4 z" />
          <GroundTrackBug bus={this.props.bus} />
          <TrueFlag bus={this.props.bus} />
        </g>
      </>
    );
  }
}

interface SelectedHeadingProps {
  bus: EventBus;
  heading: Subscribable<number>;
}

class SelectedHeading extends DisplayComponent<SelectedHeadingProps> {
  private readonly sub = this.props.bus.getSubscriber<HUDSimvars & HudElems & PrimFgBusBaseEvents & ClockEvents>();

  private targetIndicator = FSComponent.createRef<SVGPathElement>();

  private readonly targetIndicatorVis = ConsumerSubject.create(this.sub.on('spdChevrons'), 'block');

  private fgDiscreteWord5 = Arinc429LocalVarConsumerSubject.create(this.sub.on('prim_fg_discrete_word_5'));

  private selectedHdgTrk = Arinc429LocalVarConsumerSubject.create(null);

  private readonly trkFpaModeActive = this.fgDiscreteWord5.map((word) => word.bitValueOr(11, true));

  private headingDelta = MappedSubject.create(
    ([heading, selectedHeading]) => {
      return getSmallestAngle(selectedHeading.value, heading);
    },
    this.props.heading,
    this.selectedHdgTrk,
  );

  private readonly selectedHeadingValid = this.selectedHdgTrk.map(
    (hdg) => hdg.isNormalOperation() || hdg.isFunctionalTest(),
  );

  private readonly headingBugTransform = this.headingDelta.map(
    (headingDelta) => `translate3d(${(headingDelta * DistanceSpacing) / ValueSpacing}px, 0px, 0px)`,
  );

  private readonly headingBugHidden = MappedSubject.create(
    ([selectedHeadingValid, headingDelta]) => {
      return !(selectedHeadingValid && Math.abs(headingDelta) < DisplayRange);
    },
    this.selectedHeadingValid,
    this.headingDelta,
  );

  onAfterRender(): void {
    this.trkFpaModeActive.sub((trkFpaModeActive) => {
      this.selectedHdgTrk.setConsumer(this.sub.on(trkFpaModeActive ? 'prim_selected_track' : 'prim_selected_heading'));
    }, true);
  }

  render(): VNode {
    return (
      <>
        {' '}
        <path
          display={this.targetIndicatorVis}
          style={{ transform: this.headingBugTransform }}
          id="HeadingTargetIndicator"
          class={{ NormalStroke: true, Green: true, CornerRound: true, HiddenElement: this.headingBugHidden }}
          d="m641 512 10 -20 h -22 l 10 20"
        />
      </>
    );
  }
}

interface GroundTrackBugProps {
  bus: EventBus;
}

class GroundTrackBug extends DisplayComponent<GroundTrackBugProps> {
  private trackIndicator = FSComponent.createRef<SVGGElement>();
  private heading = 0;
  private groundTrack = 0;
  private needsUpdate = false;
  private readonly sub = this.props.bus.getSubscriber<Arinc429Values & ClockEvents & HudElems>();
  private readonly hdg = Arinc429ConsumerSubject.create(this.sub.on('headingAr').whenChanged());
  private readonly trk = Arinc429ConsumerSubject.create(this.sub.on('groundTrackAr').whenChanged());
  private readonly headingTrk = ConsumerSubject.create(this.sub.on('headingTrk').whenChanged(), '');
  private readonly fpa = Arinc429ConsumerSubject.create(this.sub.on('fpa').whenChanged());
  private setPos(hdg: number, trk: number) {
    const offset = -(getSmallestAngle(hdg, trk) * DistanceSpacing) / ValueSpacing;
    this.trackIndicator.instance.style.transform = `translate3d(${offset}px, 0px, 0px)`;
  }
  private readonly isHdgTrkVisible = MappedSubject.create(
    ([hdg, trk, headingTrk, fpa]) => {
      if (headingTrk === 'block') {
        this.setPos(hdg.value, trk.value);
      }
      return fpa.value > -1.5 && fpa.value < 0.5 ? 'none' : headingTrk;
    },
    this.hdg,
    this.trk,
    this.headingTrk,
    this.fpa,
  );

  render(): VNode {
    return (
      <g ref={this.trackIndicator} id="ActualTrackIndicator" display={this.isHdgTrkVisible}>
        <path class="NormalOutline CornerRound" d="m640 512 -6 9 6 9 6 -9z" />
        <path class="NormalStroke Green CornerRound" d="m640 512 -6 9 6 9 6 -9z" />
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
      if (ls) {
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
          <path class="NormalStroke Green" d="m 620 505 h 20 m-10 -32.5 v 40" />
        </g>
      </g>
    );
  }
}

interface TrueFlagProps {
  bus: EventBus;
}

class TrueFlag extends DisplayComponent<TrueFlagProps> {
  private readonly trueRefActive = Subject.create(false);

  private readonly slatsExtended = Subject.create(false);

  private readonly slatsExtendedWithTrue = Subject.create(false);

  private readonly trueFlagRef = FSComponent.createRef<SVGGElement>();

  /** @inheritdoc */
  onAfterRender(node: VNode): void {
    super.onAfterRender(node);
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
        <rect x="62.439" y="134.468" width="12.935" height="4.575" class="Cyan NormalStroke" />
        <text x="68.9065" y="137.008" text-anchor="middle" alignment-baseline="middle" class="FontSmallest Cyan">
          TRUE
        </text>
      </g>
    );
  }
}
