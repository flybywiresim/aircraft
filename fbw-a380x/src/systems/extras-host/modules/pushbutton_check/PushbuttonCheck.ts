// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, DebounceTimer, EventBus, MappedSubject } from '@microsoft/msfs-sdk';
import { BaseExtrasSimVarEvents, NotificationManager, NotificationTheme } from '@flybywiresim/fbw-sdk';

/**
 * Monitors cockpit pushbuttons that may be written externally to ensure they are not "stuck" because
 * the external writer failed to set them back to 0.
 */
export class PushbuttonCheck {
  /** Maximum time in ms that TO CONF can be pressed before it is considered "stuck" */
  private static readonly TO_CONFIG_MAX_PRESS_TIME = 30000;

  private readonly sub = this.bus.getSubscriber<BaseExtrasSimVarEvents>();

  private readonly fwcFlightPhase = ConsumerSubject.create(null, 1);

  private readonly toConfButton = ConsumerSubject.create(null, false);

  private readonly toConfTimer = new DebounceTimer();

  private readonly toConfButtonInCruise = MappedSubject.create(
    ([toConf, phase]) => toConf && phase === 8,
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
    this.toConfButton.setConsumer(this.sub.on('ecp_to_config_pushbutton'));
  }

  private onToConfigPushbutton(pressed: boolean): void {
    if (pressed && !this.toConfTimer.isPending() && !this.toConfMessageShown) {
      this.toConfTimer.schedule(() => {
        this.toConfMessageShown = true;
        this.notification.showNotification({
          title: 'ECP Pushbutton Held',
          // eslint-disable-next-line max-len
          message:
            'The TO CONF pushbutton has been held for a long time!\n\nIf you have external hardware or software controlling this variable (L:A32NX_BTN_TOCONFIG), please check that it is setup to write the variable to 0 when the button is released.',
          theme: NotificationTheme.Tips,
        });
      }, PushbuttonCheck.TO_CONFIG_MAX_PRESS_TIME);
    } else if (!pressed) {
      this.toConfTimer.clear();
    }
  }
}
