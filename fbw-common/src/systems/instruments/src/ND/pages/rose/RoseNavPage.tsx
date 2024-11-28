// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FSComponent, ConsumerSubject, MappedSubject, Subject, VNode } from '@microsoft/msfs-sdk';

import { Arinc429RegisterSubject, EfisNdMode, MathUtils, GenericAdirsEvents } from '@flybywiresim/fbw-sdk';

import { LsCourseBug } from '../arc/LsCourseBug';
import { Flag } from '../../shared/Flag';
import { RoseMode } from './RoseMode';
import { RoseModeUnderlay } from './RoseModeUnderlay';
import { NDControlEvents } from '../../NDControlEvents';
import { GenericFcuEvents } from '../../types/GenericFcuEvents';

export class RoseNavPage<T extends number> extends RoseMode<T> {
  private readonly pposLatWord = Arinc429RegisterSubject.createEmpty();

  private readonly pposLonWord = Arinc429RegisterSubject.createEmpty();

  private readonly mapRangeSub = ConsumerSubject.create(
    this.props.bus.getSubscriber<GenericFcuEvents>().on('ndRangeSetting').whenChanged(),
    -1,
  );

  private readonly mapFlagShown = MappedSubject.create(
    ([headingWord, latWord, longWord]) => {
      return !headingWord.isNormalOperation() || !latWord.isNormalOperation() || !longWord.isNormalOperation();
    },
    this.props.headingWord,
    this.pposLatWord,
    this.pposLonWord,
  );

  private readonly planeRotation = MappedSubject.create(
    ([isUsingTrackUpMode, headingWord, trackWord]) => {
      if (isUsingTrackUpMode) {
        if (headingWord.isNormalOperation() && trackWord.isNormalOperation()) {
          return MathUtils.getSmallestAngle(headingWord.value, trackWord.value);
        }
      }

      return 0;
    },
    this.props.isUsingTrackUpMode,
    this.props.headingWord,
    this.props.trackWord,
  );

  isVisible = Subject.create(false);

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    this.isVisible.sub((visible) => {
      if (visible) {
        this.handleMoveMap();
        this.handleScaleMap();
      }
    });

    const sub = this.props.bus.getArincSubscriber<GenericAdirsEvents & GenericFcuEvents>();

    sub
      .on('latitude')
      .whenChanged()
      .handle((v) => this.pposLatWord.setWord(v));
    sub
      .on('longitude')
      .whenChanged()
      .handle((v) => this.pposLonWord.setWord(v));

    this.props.isUsingTrackUpMode.sub(() => this.handleRotateMap());
    this.props.trueHeadingWord.sub(() => {
      if (!this.props.isUsingTrackUpMode.get()) {
        this.handleRotateMap();
      }
    });
    this.props.trueTrackWord.sub(() => {
      if (this.props.isUsingTrackUpMode.get()) {
        this.handleRotateMap();
      }
    });

    this.pposLatWord.sub(() => this.handleMoveMap());
    this.pposLonWord.sub(() => this.handleMoveMap());

    this.mapRangeSub.sub(() => this.handleScaleMap());
  }

  private handleRotateMap() {
    if (!this.isVisible.get()) {
      return;
    }

    const publisher = this.props.bus.getPublisher<NDControlEvents>();

    const rotation = this.props.isUsingTrackUpMode.get()
      ? this.props.trueTrackWord.get()
      : this.props.trueHeadingWord.get();

    if (rotation.isNormalOperation()) {
      publisher.pub('set_map_up_course', rotation.value);
    } else {
      publisher.pub('set_show_map', false);
    }
  }

  private handleMoveMap() {
    if (!this.isVisible.get()) {
      return;
    }

    const publisher = this.props.bus.getPublisher<NDControlEvents>();

    const latWord = this.pposLatWord.get();
    const lonWord = this.pposLonWord.get();

    if (latWord.isNormalOperation() && lonWord.isNormalOperation()) {
      publisher.pub('set_show_map', true);
      publisher.pub('set_map_center_lat', latWord.value);
      publisher.pub('set_map_center_lon', lonWord.value);
    } else {
      publisher.pub('set_show_map', false);
    }
  }

  private handleScaleMap() {
    if (!this.isVisible.get()) {
      return;
    }

    const publisher = this.props.bus.getPublisher<NDControlEvents>();

    const rangeSetting = this.mapRangeSub.get();
    const range = this.props.rangeValues[rangeSetting];

    publisher.pub('set_map_efis_mode', EfisNdMode.ROSE_NAV);
    publisher.pub('set_map_pixel_radius', 250);
    publisher.pub('set_map_range_radius', range / 2);
    publisher.pub('set_map_center_y_bias', 0);
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

        <RoseModeUnderlay
          bus={this.props.bus}
          heading={this.props.headingWord}
          visible={this.isVisible}
          rangeValues={this.props.rangeValues}
        />

        <LsCourseBug
          bus={this.props.bus}
          rotationOffset={this.planeRotation}
          mode={Subject.create(EfisNdMode.ROSE_NAV)}
        />

        <Flag visible={this.mapFlagShown} x={384} y={320.6} class="Red FontLarge">
          MAP NOT AVAIL
        </Flag>
      </g>
    );
  }
}
