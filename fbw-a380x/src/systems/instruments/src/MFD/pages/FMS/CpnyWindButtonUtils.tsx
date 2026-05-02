// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  MappedSubscribable,
  Subject,
  Subscribable,
  SubscribableMapFunctions,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { FmcInterface } from '../../FMC/FmcInterface';
import { Button, ButtonMenuItem } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { FmgcFlightPhase } from '@shared/flightphase';

export interface CpnyWindRequestButtonProps extends ComponentProps {
  fmc: FmcInterface;
  flightPlanIndex: Subscribable<number>;
  tmpyExists: Subscribable<boolean>;
  isActiveOrCopiedFromActive: Subscribable<boolean>;
}

export class CpnyWindRequestButton extends DisplayComponent<CpnyWindRequestButtonProps> {
  private readonly uplinkAvailable = Subject.create(false);

  private readonly uplinkAvailableForAnyPlan = Subject.create(false);

  private readonly subs: Subscription[] = [];

  private readonly disabledDueToFlightPhase = MappedSubject.create(
    ([isActiveOrCopiedFromActive, flightPhase]) => isActiveOrCopiedFromActive && flightPhase > FmgcFlightPhase.Cruise,
    this.props.isActiveOrCopiedFromActive,
    this.props.fmc.fmgc.data.flightPhase,
  );

  /* Disabled when: Temporary exists, uplink in progress, pending insertion in another plan or flight phase does not allow it */
  private readonly disabled = MappedSubject.create(
    ([disabledDueToFlightPhase, tmpy, uplinkInProgress, uplinkAvailableForPlan, uplinkAvailableForAnyPlan]) => {
      return (
        disabledDueToFlightPhase || tmpy || uplinkInProgress || (!uplinkAvailableForPlan && uplinkAvailableForAnyPlan)
      );
    },
    this.disabledDueToFlightPhase,
    this.props.tmpyExists,
    this.props.fmc.fmgc.data.uplinkRequestInProgress,
    this.uplinkAvailable,
    this.uplinkAvailableForAnyPlan,
  );

  private readonly topLabel = MappedSubject.create(
    ([avail, uplinkInProgress]) => {
      if (uplinkInProgress) {
        return 'REQUEST';
      }

      return avail ? 'RECEIVED' : 'CPNY WIND';
    },
    this.uplinkAvailable,
    this.props.fmc.fmgc.data.cpnyWindUplinkInProgress,
  );

  private readonly bottomLabel = MappedSubject.create(
    ([avail, uplinkInProgress]) => {
      if (uplinkInProgress) {
        return 'PENDING...';
      }

      return avail ? 'CPNY WIND' : 'REQUEST';
    },
    this.uplinkAvailable,
    this.props.fmc.fmgc.data.cpnyWindUplinkInProgress,
  );

  private readonly showAsterisk = MappedSubject.create(
    ([avail, uplinkInProgress]) => !avail && !uplinkInProgress,
    this.uplinkAvailable,
    this.props.fmc.fmgc.data.cpnyWindUplinkInProgress,
  );

  private readonly hideAsterisk = this.showAsterisk.map(SubscribableMapFunctions.not());

  private readonly label = (
    <div style="display: flex; flex-direction: row; justify-content: space-between;">
      <span style="text-align: center; vertical-align: center; margin-right: 10px;">
        {this.topLabel}
        <br />
        {this.bottomLabel}
      </span>
      <span class={{ hidden: this.hideAsterisk }} style="display: flex; align-items: center; justify-content: center;">
        *
      </span>
    </div>
  );

  private readonly menuItems: MappedSubscribable<ButtonMenuItem[]> = MappedSubject.create(
    ([avail, tmpy]) =>
      avail && !tmpy
        ? [
            {
              label: 'INSERT*',
              action: () => this.props.fmc.insertCpnyWind(this.props.flightPlanIndex.get()),
            },
            {
              label: 'CLEAR*',
              action: () => {
                this.props.fmc.deleteCpnyWind(this.props.flightPlanIndex.get());
              },
            },
          ]
        : [],
    this.uplinkAvailable,
    this.props.tmpyExists,
  );

  onAfterRender(_node: VNode): void {
    this.subs.push(
      this.props.flightPlanIndex.sub((v) => {
        this.subs.push(this.props.fmc.getWindUplinkAvailableForPlan(v).pipe(this.uplinkAvailable));
      }, true),
      this.props.fmc.getWindUplinkAvailableForPlan().pipe(this.uplinkAvailableForAnyPlan),
    );
  }

  public render(): VNode {
    return (
      <Button
        disabled={this.disabled}
        label={this.label}
        onClick={() => {
          if (!this.uplinkAvailable.get()) {
            this.props.fmc.requestCpnyWind(this.props.flightPlanIndex.get());
          }
        }}
        idPrefix="mfd-fms-wind-cpny-wind-request"
        menuItems={this.menuItems}
        buttonStyle="margin-right: 10px; justify-self: flex-end; width: 178px; height: 58px;"
        showArrow={false}
      />
    );
  }

  public destroy(): void {
    this.disabledDueToFlightPhase.destroy();
    this.disabled.destroy();
    this.topLabel.destroy();
    this.bottomLabel.destroy();
    this.showAsterisk.destroy();
    this.hideAsterisk.destroy();
    this.menuItems.destroy();
    this.subs.forEach((s) => s.destroy());
    super.destroy();
  }
}
