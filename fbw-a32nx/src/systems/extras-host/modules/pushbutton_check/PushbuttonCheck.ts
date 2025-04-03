// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, DebounceTimer, EventBus, MappedSubject } from '@microsoft/msfs-sdk';
import {
  NotificationManager,
  NotificationTheme,
  ExtrasSimVarEvents,
  Arinc429LocalVarConsumerSubject,
} from '@flybywiresim/fbw-sdk';
import { A32NXEcpBusEvents } from '../../../shared/src/publishers/A32NXEcpBusPublisher';

/**
 * Monitors cockpit pushbuttons that may be written externally to ensure they are not "stuck" because
 * the external writer failed to set them back to 0.
 */
export class PushbuttonCheck {
  /** Maximum time in ms that TO CONF can be pressed before it is considered "stuck" */
  private static readonly TO_CONFIG_MAX_PRESS_TIME = 30000;

  private readonly sub = this.bus.getSubscriber<A32NXEcpBusEvents & ExtrasSimVarEvents>();

  private readonly fwcFlightPhase = ConsumerSubject.create(null, 1);

  private readonly ecpWarningButtonStatus = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_ecp_warning_switch_word'),
  );
  private readonly toConfButton = this.ecpWarningButtonStatus.map((w) => w.bitValue(18));

  private readonly toConfTimer = new DebounceTimer();

  private readonly toConfButtonInCruise = MappedSubject.create(
    ([toConf, phase]) => toConf && phase === 6,
    this.toConfButton,
    this.fwcFlightPhase,
  );

  private toConfMessageShown = false;

  constructor(
    private readonly bus: EventBus,
    private readonly notification: NotificationManager,
  ) {}

  public connectedCallback(): void {
    this.toConfButtonInCruise.sub(this.onToConfigPushbutton.bind(this));

    this.fwcFlightPhase.setConsumer(this.sub.on('fwc_flight_phase'));
  }

  private onToConfigPushbutton(pressed: boolean): void {
    if (pressed && !this.toConfTimer.isPending() && !this.toConfMessageShown) {
      this.toConfTimer.schedule(() => {
        this.toConfMessageShown = true;
        this.notification.showNotification({
          title: 'ECP Pushbutton Held',
          // eslint-disable-next-line max-len
          message:
            'The TO CONF pushbutton has been held for a long time!\n\nIf you have external hardware or software controlling this button, please check that it is setup to write the variable to 0 when the button is released.',
          theme: NotificationTheme.Tips,
        });
      }, PushbuttonCheck.TO_CONFIG_MAX_PRESS_TIME);
    } else if (!pressed) {
      this.toConfTimer.clear();
    }
  }
}
