// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  ComponentProps,
  Subscribable,
  VNode,
  Subject,
  EventBus,
  ConsumerSubject,
} from '@microsoft/msfs-sdk';

import { Arinc429Register, Arinc429WordData, EfisNdMode, GenericAdirsEvents } from '@flybywiresim/fbw-sdk';

import { PlanModeUnderlay } from './PlanModeUnderlay';
import { MapParameters } from '../../shared/utils/MapParameters';
import { NDPage } from '../NDPage';
import { NDControlEvents } from '../../NDControlEvents';
import { GenericFcuEvents } from '../../types/GenericFcuEvents';
import { GenericFmsEvents } from '../../types/GenericFmsEvents';

export interface PlanModePageProps<T extends number> extends ComponentProps {
  bus: EventBus;
  rangeValues: T[];
  aircraftTrueHeading: Subscribable<Arinc429WordData>;
}

export class PlanModePage<T extends number> extends NDPage<PlanModePageProps<T>> {
  public isVisible = Subject.create(false);

  private readonly controlPublisher = this.props.bus.getPublisher<NDControlEvents>();

  private readonly subs = this.props.bus.getSubscriber<NDControlEvents & GenericAdirsEvents & GenericFmsEvents>();

  private readonly pposLatSub = ConsumerSubject.create(this.subs.on('latitude').whenChanged(), -1);

  private readonly pposLatRegister = Arinc429Register.empty();

  private readonly pposLongSub = ConsumerSubject.create(this.subs.on('longitude').whenChanged(), -1);

  private readonly pposLongRegister = Arinc429Register.empty();

  private readonly mapCenterLatSub = ConsumerSubject.create(this.subs.on('set_map_center_lat').whenChanged(), -1);

  private readonly mapCenterLonSub = ConsumerSubject.create(this.subs.on('set_map_center_lon').whenChanged(), -1);

  private readonly mapRangeRadiusSub = ConsumerSubject.create(this.subs.on('set_map_range_radius').whenChanged(), -1);

  private readonly selectedWaypointLatRegister = Arinc429Register.empty();

  private readonly selectedWaypointLatSub = ConsumerSubject.create(this.subs.on('mrpLat').whenChanged(), -1);

  private readonly selectedWaypointLongRegister = Arinc429Register.empty();

  private readonly selectedWaypointLongSub = ConsumerSubject.create(this.subs.on('mrpLong').whenChanged(), -1);

  private readonly mapRangeSub = ConsumerSubject.create(
    this.props.bus.getSubscriber<GenericFcuEvents>().on('ndRangeSetting').whenChanged(),
    -1,
  );

  private readonly mapParams = new MapParameters();

  onShow() {
    this.handleSelectedWaypointPos();
    this.handleMovePlane();
    this.handleRotatePlane();
    this.handleScaleMap();
    this.handlePlaneVisibility();
  }

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    this.props.aircraftTrueHeading.sub(() => {
      this.handlePlaneVisibility();
      this.handleRotatePlane();
    });

    this.pposLatSub.sub((lat) => {
      this.pposLatRegister.set(lat);

      this.handlePlaneVisibility();
      this.handleMovePlane();
    });

    this.pposLongSub.sub((long) => {
      this.pposLongRegister.set(long);

      this.handlePlaneVisibility();
      this.handleMovePlane();
    });

    this.mapCenterLatSub.sub(() => {
      this.handleRecomputeMapParameters();
      this.handleMovePlane();
    });

    this.mapCenterLonSub.sub(() => {
      this.handleRecomputeMapParameters();
      this.handleMovePlane();
    });

    this.mapRangeRadiusSub.sub(() => {
      this.handleRecomputeMapParameters();
      this.handleMovePlane();
    });

    this.mapRangeSub.sub(() => this.handleScaleMap());

    this.selectedWaypointLatSub.sub(() => this.handleSelectedWaypointPos());
    this.selectedWaypointLongSub.sub(() => this.handleSelectedWaypointPos());
  }

  private handleMovePlane() {
    if (this.isVisible.get()) {
      const latRegister = this.pposLatRegister;
      const longRegister = this.pposLongRegister;

      if (latRegister.isNormalOperation() && longRegister.isNormalOperation()) {
        const lat = latRegister.value;
        const long = longRegister.value;

        const [x, y] = this.mapParams.coordinatesToXYy({ lat, long });

        this.controlPublisher.pub('set_plane_x', 768 / 2 + x);
        this.controlPublisher.pub('set_plane_y', 768 / 2 + y);
      }
    }
  }

  private handleRotatePlane() {
    if (this.isVisible.get()) {
      const planeRotation = this.props.aircraftTrueHeading.get();

      if (planeRotation.isNormalOperation()) {
        const ndRotation = this.mapParams.rotation(planeRotation.value);
        this.controlPublisher.pub('set_plane_rotation', ndRotation);
      }
    }
  }

  private handlePlaneVisibility() {
    if (this.isVisible.get()) {
      const planeRotation = this.props.aircraftTrueHeading.get();
      if (
        planeRotation.isNormalOperation() &&
        this.pposLongRegister.isNormalOperation() &&
        this.pposLatRegister.isNormalOperation()
      ) {
        this.controlPublisher.pub('set_show_plane', true);
      } else {
        this.controlPublisher.pub('set_show_plane', false);
      }
    }
  }

  private handleScaleMap() {
    if (this.isVisible.get()) {
      const rangeSetting = this.mapRangeSub.get();
      const range = this.props.rangeValues[rangeSetting];

      this.controlPublisher.pub('set_map_efis_mode', EfisNdMode.PLAN);
      this.controlPublisher.pub('set_map_pixel_radius', 250);
      this.controlPublisher.pub('set_map_range_radius', range / 2);
      this.controlPublisher.pub('set_map_center_y_bias', 0);
    }
  }

  private handleSelectedWaypointPos() {
    this.selectedWaypointLatRegister.set(this.selectedWaypointLatSub.get());
    this.selectedWaypointLongRegister.set(this.selectedWaypointLongSub.get());

    // FIXME what to do when the selected waypoint is not valid?
    if (
      this.isVisible.get() &&
      this.selectedWaypointLatRegister.isNormalOperation() &&
      this.selectedWaypointLongRegister.isNormalOperation()
    ) {
      this.controlPublisher.pub('set_show_map', true);
      this.controlPublisher.pub('set_map_center_lat', this.selectedWaypointLatRegister.value);
      this.controlPublisher.pub('set_map_center_lon', this.selectedWaypointLongRegister.value);
      this.controlPublisher.pub('set_map_up_course', 0);
    }
  }

  private handleRecomputeMapParameters() {
    this.mapParams.compute(
      { lat: this.mapCenterLatSub.get(), long: this.mapCenterLonSub.get() },
      0,
      this.mapRangeRadiusSub.get(),
      250,
      0, // FIXME true north ?
    );
  }

  render(): VNode | null {
    return (
      <g visibility={this.isVisible.map((visible) => (visible ? 'visible' : 'hidden'))}>
        <PlanModeUnderlay mapRange={this.mapRangeRadiusSub} />
      </g>
    );
  }
}
