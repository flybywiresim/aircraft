// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  ComponentProps,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  MappedSubscribable,
  Subscribable,
  SubscribableMapFunctions,
  VNode,
} from '@microsoft/msfs-sdk';
import { FmcInterface } from '../../FMC/FmcInterface';
import { Button, ButtonMenuItem } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { FmgcFlightPhase } from '@shared/flightphase';

class CpnyWindRequestButtonLabel extends DisplayComponent<ComponentProps> {
  public render(): VNode {
    return (
      <div style="display: flex; flex-direction: row; justify-content: space-between;">
        <span style="text-align: center; vertical-align: center; margin-right: 5px;">
          CPNY WIND
          <br />
          REQUEST
        </span>
        <span style="display: flex; align-items: center; justify-content: center;">*</span>
      </div>
    );
  }
}

export interface CpnyWindRequestButtonProps extends ComponentProps {
  fmc: FmcInterface;
  flightPlanIndex: Subscribable<number>;
  tmpyExists: Subscribable<boolean>;
  uplinkAvailableForPlan: Subscribable<boolean>;
  buttonStyle?: string;
  isActiveOrCopiedFromActive: Subscribable<boolean>;
}

export class CpnyWindRequestButton extends DisplayComponent<CpnyWindRequestButtonProps> {
  private readonly disabledDueToFlightPhase = MappedSubject.create(
    ([isActiveOrCopiedFromActive, flightPhase]) => isActiveOrCopiedFromActive && flightPhase > FmgcFlightPhase.Cruise,
    this.props.isActiveOrCopiedFromActive,
    this.props.fmc.fmgc.data.flightPhase,
  );

  /* Disabled when, temporary exists, uplink in progress or flightplan is active or copy of active and request not allowe due to flight phase */
  private readonly disabled = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.props.fmc.fmgc.data.uplinkRequestInProgress,
    this.props.tmpyExists,
    this.disabledDueToFlightPhase,
  );

  private readonly label = MappedSubject.create(
    ([avail, uplinkInProgress]) => {
      if (uplinkInProgress) {
        return 'REQUEST\nPENDING...';
      } else if (!avail) {
        return <CpnyWindRequestButtonLabel />;
      } else {
        return 'RECEIVED\nCPNY WIND';
      }
    },
    this.props.uplinkAvailableForPlan,
    this.props.fmc.fmgc.data.cpnyWindUplinkInProgress,
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
    this.props.uplinkAvailableForPlan,
    this.props.tmpyExists,
  );

  public render(): VNode {
    return (
      <Button
        disabled={this.disabled}
        label={this.label}
        onClick={() => {
          if (!this.props.uplinkAvailableForPlan.get()) {
            this.props.fmc.requestCpnyWind(this.props.flightPlanIndex.get());
          }
        }}
        idPrefix="mfd-fms-wind-cpny-wind-request"
        menuItems={this.menuItems}
        buttonStyle={this.props.buttonStyle}
      />
    );
  }

  public destroy(): void {
    this.disabledDueToFlightPhase.destroy();
    this.disabled.destroy();
    this.label.destroy();
    this.menuItems.destroy();
    super.destroy();
  }
}
