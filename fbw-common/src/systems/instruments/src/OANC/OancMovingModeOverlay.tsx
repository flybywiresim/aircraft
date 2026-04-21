// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { Arinc429RegisterSubject, Arinc429SignStatusMatrix, EfisNdMode } from '@flybywiresim/fbw-sdk';

import { OANC_RENDER_HEIGHT, OANC_RENDER_WIDTH } from './';
import { ArcModeUnderlay } from './OancArcModeCompass';
import { RoseModeUnderlay } from './OancRoseCompass';
import { OancPlanModeCompass } from './OancPlanModeCompass';

export interface OancMapOverlayProps {
  bus: EventBus;

  oansRange: Subscribable<number>;

  rotation: Subscribable<number>;

  ndMode: Subscribable<EfisNdMode>;

  isMapPanned: Subscribable<boolean>;

  airportWithinRange: Subscribable<boolean>;

  airportBearing: Subscribable<number>;

  airportIcao: Subscribable<string>;
}

export class OancMovingModeOverlay extends DisplayComponent<OancMapOverlayProps> {
  private subs: Subscription[] = [];

  private readonly arcModeVisible = MappedSubject.create(
    ([ndMode, isPanning]) => ndMode === EfisNdMode.ARC && isPanning,
    this.props.ndMode,
    this.props.isMapPanned,
  );

  private readonly roseModeVisible = MappedSubject.create(
    ([ndMode, isPanning]) => ndMode === EfisNdMode.ROSE_NAV && isPanning,
    this.props.ndMode,
    this.props.isMapPanned,
  );

  private readonly rotationArinc429Word = Arinc429RegisterSubject.createEmpty();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.rotation.sub((r) => {
        this.rotationArinc429Word.setValueSsm(r, Arinc429SignStatusMatrix.NormalOperation);
      }, true),
    );

    this.subs.push(this.arcModeVisible, this.roseModeVisible);
  }

  destroy(): void {
    for (const s of this.subs) {
      s.destroy();
    }
  }

  render(): VNode | null {
    return (
      <svg
        class="oanc-svg"
        viewBox={`0 0 ${OANC_RENDER_WIDTH * 2} ${OANC_RENDER_HEIGHT * 2}`}
        style="position: absolute; width: 1536px; height: 1536px; left: -384px; top: -384px; pointer-events: none; z-index: 99;"
      >
        <RoseModeUnderlay
          bus={this.props.bus}
          visible={this.roseModeVisible}
          rotation={this.rotationArinc429Word}
          oansRange={this.props.oansRange}
          doClip={false}
        />

        <ArcModeUnderlay
          bus={this.props.bus}
          visible={this.arcModeVisible}
          rotation={this.rotationArinc429Word}
          oansRange={this.props.oansRange}
          doClip={false}
          yOffset={620 - 384}
          airportWithinRange={this.props.airportWithinRange}
          airportBearing={this.props.airportBearing}
          airportIcao={this.props.airportIcao}
        />
      </svg>
    );
  }
}

export class OancStaticModeOverlay extends DisplayComponent<OancMapOverlayProps> {
  private subs: Subscription[] = [];

  private readonly arcModeVisible = MappedSubject.create(
    ([ndMode, isPanning]) => ndMode === EfisNdMode.ARC && !isPanning,
    this.props.ndMode,
    this.props.isMapPanned,
  );

  private readonly roseModeVisible = MappedSubject.create(
    ([ndMode, isPanning]) => ndMode === EfisNdMode.ROSE_NAV && !isPanning,
    this.props.ndMode,
    this.props.isMapPanned,
  );

  private readonly rotationArinc429Word = Arinc429RegisterSubject.createEmpty();

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.rotation.sub((r) => {
        this.rotationArinc429Word.setValueSsm(r, Arinc429SignStatusMatrix.NormalOperation);
      }, true),
    );
  }

  destroy(): void {
    for (const s of this.subs) {
      s.destroy();
    }
  }

  render(): VNode | null {
    return (
      <svg
        class="oanc-svg"
        viewBox={`0 0 ${OANC_RENDER_WIDTH * 2} ${OANC_RENDER_HEIGHT * 2}`}
        style="position: absolute; width: 1536px; height: 1536px; left: -384px; top: -384px; pointer-events: none;"
      >
        <RoseModeUnderlay
          bus={this.props.bus}
          visible={this.roseModeVisible}
          rotation={this.rotationArinc429Word}
          oansRange={this.props.oansRange}
          doClip
        />

        <ArcModeUnderlay
          bus={this.props.bus}
          visible={this.arcModeVisible}
          rotation={this.rotationArinc429Word}
          oansRange={this.props.oansRange}
          doClip
          yOffset={0}
          airportWithinRange={this.props.airportWithinRange}
          airportBearing={this.props.airportBearing}
          airportIcao={this.props.airportIcao}
        />

        <OancPlanModeCompass
          bus={this.props.bus}
          visible={this.props.ndMode.map((it) => it === EfisNdMode.PLAN)}
          oansRange={this.props.oansRange}
        />
      </svg>
    );
  }
}
