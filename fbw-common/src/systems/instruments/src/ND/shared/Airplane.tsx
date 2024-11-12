// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  DisplayComponent,
  VNode,
  Subject,
  EventBus,
  MappedSubject,
  Subscribable,
} from '@microsoft/msfs-sdk';
import { EfisNdMode, Arinc429ConsumerSubject, GenericAdirsEvents } from '@flybywiresim/fbw-sdk';

import { NDControlEvents } from '../NDControlEvents';
import { LubberLine } from '../pages/arc/LubberLine';
import { GenericDisplayManagementEvents } from '../types/GenericDisplayManagementEvents';
import { Layer } from '../../MsfsAvionicsCommon/Layer';

const PLANE_X_OFFSET = -41;
const PLANE_Y_OFFSET = 0;

export class Airplane extends DisplayComponent<{ bus: EventBus; ndMode: Subscribable<EfisNdMode> }> {
  private readonly headingWord = Arinc429ConsumerSubject.create(null);

  private readonly headingWordValid = this.headingWord.map((it) => it.isNormalOperation());

  private readonly showPlane = Subject.create(false);

  private readonly planeVisibility = MappedSubject.create(
    ([headingValid, showPlane]) => headingValid && showPlane,
    this.headingWordValid,
    this.showPlane,
  );

  private readonly lubberVisibility = MappedSubject.create(
    ([planeVisibility, ndMode]) => ndMode !== EfisNdMode.PLAN && planeVisibility,
    this.planeVisibility,
    this.props.ndMode,
  );

  private readonly circleVisibility = MappedSubject.create(
    ([headingValid, showPlane]) => !headingValid && showPlane,
    this.headingWordValid,
    this.showPlane,
  );

  private readonly x = Subject.create(0);

  private readonly y = Subject.create(0);

  private readonly rotation = Subject.create(0);

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<GenericAdirsEvents & GenericDisplayManagementEvents & NDControlEvents>();

    this.headingWord.setConsumer(sub.on('heading'));

    sub.on('set_show_plane').handle((show) => {
      this.showPlane.set(show);
    });

    sub.on('set_plane_x').handle((x) => {
      this.x.set(x);
    });

    sub.on('set_plane_y').handle((y) => {
      this.y.set(y);
    });

    sub.on('set_plane_rotation').handle((rotation) => {
      this.rotation.set(rotation);
    });
  }

  render(): VNode | null {
    return (
      <>
        <Layer x={this.x.map((x) => x + PLANE_X_OFFSET)} y={this.y.map((y) => y + PLANE_Y_OFFSET)}>
          <g
            visibility={this.planeVisibility.map((it) => (it ? 'inherit' : 'hidden'))}
            transform={this.rotation.map((rotation) => `rotate(${rotation} ${-PLANE_X_OFFSET} 0)`)}
          >
            <path
              class="shadow"
              stroke-width={8}
              stroke-linecap="round"
              d="M 0, 0 h 82 m -41, -29.5 v 70.25 m -11.5, -9.75 h 23.5"
            />
            <path
              class="Yellow"
              stroke-width={5}
              stroke-linecap="round"
              d="M 0, 0 h 82 m -41, -29.5 v 70.25 m -11.5, -9.75 h 23.5"
            />
          </g>

          <circle
            class="Red"
            stroke-width={2}
            visibility={this.circleVisibility.map((it) => (it ? 'inherit' : 'hidden'))}
            cx={-PLANE_X_OFFSET}
            cy={-PLANE_Y_OFFSET}
            r={9}
          />
        </Layer>

        <LubberLine
          bus={this.props.bus}
          visible={this.lubberVisibility}
          rotation={this.rotation}
          ndMode={this.props.ndMode}
        />
      </>
    );
  }
}
