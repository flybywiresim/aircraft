// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import { Arinc429WordData, MathUtils, GenericAdirsEvents } from '@flybywiresim/fbw-sdk';

import { RoseMode, RoseModeProps } from './RoseMode';
import { RoseModeUnderlay } from './RoseModeUnderlay';
import { NDControlEvents } from '../../NDControlEvents';
import { IlsInfoIndicator } from './IlsInfoIndicator';
import { GlideSlope } from './Glideslope';
import { GenericDisplayManagementEvents } from '../../types/GenericDisplayManagementEvents';
import { GenericVorEvents } from '../../types/GenericVorEvents';
import { GenericFlightManagementBusEvents } from '../../types/GenericFlightManagementBusEvents';

export interface RoseLsProps<T extends number> extends RoseModeProps<T> {
  index: 1 | 2;
}

export class RoseLSPage<T extends number> extends RoseMode<T, RoseLsProps<T>> {
  private readonly sub = this.props.bus.getSubscriber<
    GenericAdirsEvents & GenericDisplayManagementEvents & GenericVorEvents & GenericFlightManagementBusEvents
  >();

  isVisible = Subject.create(false);

  //  private readonly headingWord = Arinc429ConsumerSubject.create(null);

  private readonly courseSub = Subject.create(0);

  private readonly courseDeviationSub = Subject.create(0);

  private readonly ilsAvailableSub = Subject.create(false);

  private readonly ilsFrequencySub = Subject.create(0);

  private readonly localizerValidSub = Subject.create(false);

  private readonly backbeam = ConsumerSubject.create(this.sub.on('fm.1.backbeam'), false);

  onShow() {
    super.onShow();

    const publisher = this.props.bus.getPublisher<NDControlEvents>();

    const index: 3 | 4 = (this.props.index + 2) as 3 | 4;

    this.sub
      .on(`nav${index}Obs`)
      .whenChanged()
      .handle((v) => this.courseSub.set(v));

    this.sub
      .on(`nav${index}RadialError`)
      .whenChanged()
      .handle((v) => this.courseDeviationSub.set(v));

    this.sub
      .on(`nav${index}Available`)
      .whenChanged()
      .handle((v) => this.ilsAvailableSub.set(v));

    this.sub
      .on(`nav${index}Frequency`)
      .whenChanged()
      .handle((v) => this.ilsFrequencySub.set(v));

    this.sub
      .on('localizerValid')
      .whenChanged()
      .handle((v) => this.localizerValidSub.set(v));

    publisher.pub('set_show_map', false);
  }

  render(): VNode | null {
    return (
      <g visibility={this.isVisible.map((v) => (v ? 'visible' : 'hidden'))}>
        {/* inverted map overlays for terrain map in WASM module  */}
        <path
          name="rose-mode-bottom-left-map-area"
          d="M45,625 L122,625 L174,683 L174,768 L0,768 L0,0 L45,0L45,625"
          class="nd-inverted-map-area"
        />
        <path
          name="rose-mode-bottom-right-map-area"
          d="M591,768 L591,626 L648,562 L723,562 L723,0 L768,0 L768,768 L591,769"
          class="nd-inverted-map-area"
        />
        <path
          name="rose-mode-top-map-area"
          d="M45,0 L45,155, L282,155 a250,250 0 0 1 204,0 L723,155 L723,0 L45,0"
          class="nd-inverted-map-area"
        />

        <IlsInfoIndicator bus={this.props.bus} index={this.props.index} />

        <GlideSlope bus={this.props.bus} backbeam={this.backbeam} />

        <RoseModeUnderlay
          bus={this.props.bus}
          heading={this.props.headingWord}
          visible={this.isVisible}
          rangeValues={this.props.rangeValues}
        />

        <IlsCaptureOverlay
          heading={this.props.headingWord}
          course={this.courseSub}
          courseDeviation={this.courseDeviationSub}
          backbeam={this.backbeam}
          available={this.localizerValidSub}
          ilsFrequency={this.ilsFrequencySub}
        />
      </g>
    );
  }
}

interface IlsCaptureOverlayProps extends ComponentProps {
  heading: Subscribable<Arinc429WordData>;
  course: Subscribable<number>;
  courseDeviation: Subscribable<number>;
  backbeam: Subscribable<boolean>;
  available: Subscribable<boolean>;
  ilsFrequency: Subscribable<number>;
}

class IlsCaptureOverlay extends DisplayComponent<IlsCaptureOverlayProps> {
  // we can't tell if the course is valid from the MSFS radio, so at least check that the frequency is
  private readonly pointerVisibilitySub = MappedSubject.create(([ilsFrequency]) => {
    return ilsFrequency >= 108 && ilsFrequency <= 112 ? 'inherit' : 'hidden';
  }, this.props.ilsFrequency);

  private readonly visible = MappedSubject.create(([heading]) => {
    return heading.isNormalOperation();
  }, this.props.heading);

  private readonly rotation = MappedSubject.create(
    ([heading, course]) => {
      if (heading.isNormalOperation()) {
        return course - heading.value;
      }
      return 0;
    },
    this.props.heading,
    this.props.course,
  );

  private readonly pointerColor = MappedSubject.create(([heading]) => {
    if (heading.isNormalOperation()) {
      return 'Cyan';
    }

    return 'White';
  }, this.props.heading);

  private readonly deviation = MappedSubject.create(
    ([courseDeviation, backbeam]) => {
      const dots =
        (backbeam ? -1 : 1) * Math.max(-2, Math.min(2, MathUtils.correctMsfsLocaliserError(courseDeviation) / 0.8));
      return dots * 74;
    },
    this.props.courseDeviation,
    this.props.backbeam,
  );

  // FIXME hook up when MMR ready
  private readonly mixLocVnav = Subject.create(false);

  private readonly locBcReminderText = MappedSubject.create(
    ([backbeam, mixLocVnav]) => (backbeam ? 'B/C' : mixLocVnav ? 'LOC' : ''),
    this.props.backbeam,
    this.mixLocVnav,
  );

  render(): VNode {
    return (
      <g
        visibility={this.visible.map((visible) => (visible ? 'inherit' : 'hidden'))}
        transform={this.rotation.map((deg) => `rotate(${deg} 384 384)`)}
        stroke="white"
        strokeWidth={3}
        fill="none"
      >
        <g id="loc-bc-reminder">
          {/* FIXME don't have a good reference for the position of this. Only doc illustrations. */}
          <text x={202} y={416} class="FontSmall Magenta">
            {this.locBcReminderText}
          </text>
        </g>

        <g id="ils-deviation-scale">
          <circle cx={236} cy={384} r={5} />
          <circle cx={310} cy={384} r={5} />
          <circle cx={458} cy={384} r={5} />
          <circle cx={532} cy={384} r={5} />
        </g>

        <g visibility={this.pointerVisibilitySub}>
          <path
            d="M352,256 L416,256 M384,134 L384,294 M384,474 L384,634"
            class="rounded shadow"
            id="ils-course-pointer-shadow"
            stroke-width={4.5}
          />
          <path
            d="M352,256 L416,256 M384,134 L384,294 M384,474 L384,634"
            class="Magenta rounded"
            id="ils-course-pointer"
            stroke-width={4}
          />
        </g>

        <g visibility={this.props.available.map((a) => (a ? 'inherit' : 'hidden'))}>
          <path
            d="M384,304 L384,464"
            class="rounded shadow"
            transform={this.deviation.map((cdiPx) => `translate(${cdiPx}, 0)`)}
            id="ils-deviation-shadow"
            stroke-width={4.5}
          />
          <path
            d="M384,304 L384,464"
            class="Magenta rounded"
            transform={this.deviation.map((cdiPx) => `translate(${cdiPx}, 0)`)}
            id="ils-deviation"
            stroke-width={4}
          />
        </g>
      </g>
    );
  }
}
