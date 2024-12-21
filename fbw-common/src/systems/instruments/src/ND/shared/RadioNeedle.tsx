// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  FSComponent,
  DisplayComponent,
  EventBus,
  Subject,
  Subscribable,
  VNode,
  MappedSubject,
  ClockEvents,
} from '@microsoft/msfs-sdk';
import { EfisNdMode, MathUtils, NavAidMode, Arinc429WordData, GenericAdirsEvents } from '@flybywiresim/fbw-sdk';

import { diffAngle } from 'msfs-geo';
import { GenericFcuEvents } from '../types/GenericFcuEvents';
import { GenericDisplayManagementEvents } from '../types/GenericDisplayManagementEvents';
import { GenericVorEvents } from '../types/GenericVorEvents';

export interface RadioNeedleProps {
  bus: EventBus;
  headingWord: Subscribable<Arinc429WordData>;
  trackWord: Subscribable<Arinc429WordData>;
  isUsingTrackUpMode: Subscribable<boolean>;
  index: 1 | 2;
  mode: Subscribable<EfisNdMode>;
}

export class RadioNeedle extends DisplayComponent<RadioNeedleProps> {
  private readonly isVor = Subject.create(false);

  private readonly isAdf = Subject.create(false);

  private readonly trackCorrection = MappedSubject.create(
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

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<GenericFcuEvents>();

    sub
      .on(`navaidMode${this.props.index}`)
      .whenChanged()
      .handle((mode) => {
        if (mode === NavAidMode.VOR) {
          this.isVor.set(true);
          this.isAdf.set(false);
        } else if (mode === NavAidMode.ADF) {
          this.isAdf.set(true);
          this.isVor.set(false);
        } else {
          this.isAdf.set(false);
          this.isVor.set(false);
        }
      });
  }

  render(): VNode | null {
    return (
      <>
        <VorNeedle
          bus={this.props.bus}
          shown={this.isVor}
          headingWord={this.props.headingWord}
          trackWord={this.props.trackWord}
          trackCorrection={this.trackCorrection}
          index={this.props.index}
          mode={this.props.mode}
        />
        <AdfNeedle
          bus={this.props.bus}
          shown={this.isAdf}
          headingWord={this.props.headingWord}
          trackWord={this.props.trackWord}
          trackCorrection={this.trackCorrection}
          index={this.props.index}
          mode={this.props.mode}
        />
      </>
    );
  }
}

export interface SingleNeedleProps {
  bus: EventBus;
  shown: Subscribable<boolean>;
  headingWord: Subscribable<Arinc429WordData>;
  trackWord: Subscribable<Arinc429WordData>;
  trackCorrection: Subscribable<number>;
  index: 1 | 2;
  mode: Subscribable<EfisNdMode>;
}

class VorNeedle extends DisplayComponent<SingleNeedleProps> {
  private readonly ARC_MODE_PATHS = [
    'M384,251 L384,179 M384,128 L384,155 L370,179 L398,179 L384,155 M384,1112 L384,1085 M384,989 L384,1061 L370,1085 L398,1085 L384,1061',
    'M377,251 L377,219 L370,219 L384,195 L398,219 L391,219 L391,251 M384,195 L384,128 M384,1112 L384,1045 M377,989 L377,1045 L391,1045 L391,989',
  ];

  private readonly ROSE_MODE_PATHS = [
    'M384,257 L384,185 M384,134 L384,161 L370,185 L398,185 L384,161 M384,634 L384,607 M384,511 L384,583 L370,607 L398,607 L384,583',
    'M377,257 L377,225 L370,225 L384,201 L398,225 L391,225 L391,256 M384,201 L384,134 M384,634 L384,567 M377,511 L377,567 L391,567 L391,511',
  ];

  private readonly rawRelativeBearing = Subject.create(0);

  private readonly filteredRelativeBearing = Subject.create(0);

  private lastFilterTime = 0;

  private readonly radioAvailable = Subject.create(false);

  private readonly stationDeclination = Subject.create(0);

  private readonly stationLatitude = Subject.create(0);

  private readonly trueRefActive = Subject.create(false);

  // eslint-disable-next-line arrow-body-style
  private readonly availableSub = MappedSubject.create(
    ([shown, radioAvailable, heading, track, mode]) => {
      // TODO in the future we will get the radio values via ARINC429 so this will no longer be needed
      return (
        shown && radioAvailable && heading.isNormalOperation() && track.isNormalOperation() && mode !== EfisNdMode.PLAN
      );
    },
    this.props.shown,
    this.radioAvailable,
    this.props.headingWord,
    this.props.trackWord,
    this.props.mode,
  );

  // eslint-disable-next-line arrow-body-style
  private readonly rotationSub = MappedSubject.create(
    ([relativeBearing, trackCorrection, ndMode]) => {
      return `rotate(${relativeBearing + trackCorrection} 384 ${ndMode === EfisNdMode.ARC ? 620 : 384})`;
    },
    this.filteredRelativeBearing,
    this.props.trackCorrection,
    this.props.mode,
  );

  private readonly needlePaths = Subject.create(['', '']);

  private readonly stationTrueRef = MappedSubject.create(
    ([latitude, declination]) => Math.abs(latitude) > 75 && declination < Number.EPSILON,
    this.stationLatitude,
    this.stationDeclination,
  );

  private readonly stationCorrected = MappedSubject.create(
    ([trueRef, stationTrueRef, available, ndMode]) =>
      trueRef !== stationTrueRef && available && ndMode !== EfisNdMode.ROSE_VOR && ndMode !== EfisNdMode.ROSE_ILS,
    this.trueRefActive,
    this.stationTrueRef,
    this.availableSub,
    this.props.mode,
  );

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<
      GenericAdirsEvents & ClockEvents & GenericDisplayManagementEvents & GenericFcuEvents & GenericVorEvents
    >();

    sub
      .on(`nav${this.props.index}RelativeBearing`)
      .whenChanged()
      .handle((value) => this.rawRelativeBearing.set(value));
    sub
      .on(`nav${this.props.index}Available`)
      .whenChanged()
      .handle((value) => this.radioAvailable.set(!!value));

    sub
      .on(`nav${this.props.index}StationDeclination`)
      .whenChanged()
      .handle((v) => this.stationDeclination.set(v));
    sub
      .on(`nav${this.props.index}Location`)
      .whenChanged()
      .handle((v) => this.stationLatitude.set(v.lat));

    sub
      .on('trueRefActive')
      .whenChanged()
      .handle((v) => this.trueRefActive.set(!!v));

    sub.on('simTime').handle((simTime) => {
      const dt = Math.min(simTime - this.lastFilterTime, 100);
      this.lastFilterTime = simTime;

      const diff = diffAngle(this.filteredRelativeBearing.get(), this.rawRelativeBearing.get());
      if (!this.availableSub.get() || Math.abs(diff) < 0.1) {
        return;
      }

      const bearing = this.filteredRelativeBearing.get() + (dt / 800) * diff;
      this.filteredRelativeBearing.set(bearing % 360);
    });

    this.props.mode.sub((mode) => {
      switch (mode) {
        case EfisNdMode.ARC:
          this.needlePaths.set(this.ARC_MODE_PATHS);
          break;
        case EfisNdMode.ROSE_ILS:
        case EfisNdMode.ROSE_VOR:
        case EfisNdMode.ROSE_NAV:
          this.needlePaths.set(this.ROSE_MODE_PATHS);
          break;
        default:
      }
    }, true);
  }

  render(): VNode | null {
    return (
      <g visibility={this.availableSub.map((v) => (v ? 'inherit' : 'hidden'))} transform={this.rotationSub}>
        <path d={this.needlePaths.map((arr) => arr[this.props.index - 1])} stroke-width={3.7} class="rounded shadow" />
        <path
          d={this.needlePaths.map((arr) => arr[this.props.index - 1])}
          stroke-width={3.2}
          class={this.stationCorrected.map((c) => (c ? 'Magenta rounded' : 'White rounded'))}
        />
      </g>
    );
  }
}

class AdfNeedle extends DisplayComponent<SingleNeedleProps> {
  private readonly ARC_MODE_PATHS = [
    'M384,251 L384,128 M370,179 L384,155 L398,179 M384,1112 L384,989 M370,1085 L384,1061 L398,1085',
    'M370,251 L370,219 L384,195 L398,219 L398,251 M384,195 L384,128 M384,1112 L384,1023 M370,989 L370,1040 L384,1023 L398,1040 L398,989',
  ];

  private readonly ROSE_MODE_PATHS = [
    'M384,257 L384,134 M370,185 L384,161 L398,185 M384,634 L384,511 M370,607 L384,583 L398,607',
    'M370,257 L370,225 L384,201 L398,225 L398,257 M384,201 L384,134 M384,634 L384,545 M370,511 L370,562 L384,545 L398,562 L398,511',
  ];

  private readonly relativeBearing = Subject.create(0);

  private readonly radioAvailable = Subject.create(false);

  // eslint-disable-next-line arrow-body-style
  private readonly availableSub = MappedSubject.create(
    ([shown, radioAvailable, mode]) => {
      // TODO in the future we will get the radio values via ARINC429 so this will no longer be needed
      return shown && radioAvailable && mode !== EfisNdMode.PLAN;
    },
    this.props.shown,
    this.radioAvailable,
    this.props.mode,
  );

  // eslint-disable-next-line arrow-body-style
  private readonly rotationSub = MappedSubject.create(
    ([relativeBearing, ndMode]) => {
      return `rotate(${relativeBearing} 384 ${ndMode === EfisNdMode.ARC ? 620 : 384})`;
    },
    this.relativeBearing,
    this.props.mode,
  );

  private readonly needlePaths = Subject.create(['', '']);

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<GenericVorEvents>();

    sub
      .on(`adf${this.props.index}Radial`)
      .whenChanged()
      .handle((value) => this.relativeBearing.set(value));
    sub
      .on(`adf${this.props.index}SignalStrength`)
      .whenChangedBy(1)
      .handle((value) => this.radioAvailable.set(value > 0));

    this.props.mode.sub((mode) => {
      switch (mode) {
        case EfisNdMode.ARC:
          this.needlePaths.set(this.ARC_MODE_PATHS);
          break;
        case EfisNdMode.ROSE_ILS:
        case EfisNdMode.ROSE_VOR:
        case EfisNdMode.ROSE_NAV:
          this.needlePaths.set(this.ROSE_MODE_PATHS);
          break;
        default:
      }
    }, true);
  }

  render(): VNode | null {
    return (
      <g visibility={this.availableSub.map((v) => (v ? 'inherit' : 'hidden'))} transform={this.rotationSub}>
        <path d={this.needlePaths.map((arr) => arr[this.props.index - 1])} stroke-width={3.7} class="rounded shadow" />
        <path d={this.needlePaths.map((arr) => arr[this.props.index - 1])} stroke-width={3.2} class="Green rounded" />
      </g>
    );
  }
}
