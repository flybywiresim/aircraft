// If the consent is not set, show telex page

// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { NXDataStore, PopUpDialog } from '@flybywiresim/fbw-sdk';

export class TelexCheck {
  public showPopup(): void {
    const telexPopupState = NXDataStore.get('TELEX_POPUP_SHOWN', 'false');
    const popup = new PopUpDialog();

    if (telexPopupState === 'false') {
      popup.showPopUp(
        'TELEX CONFIGURATION',
        'You have not yet configured the telex option. Telex enables free text and live map. If enabled, aircraft position data is published for the duration of the flight. Messages are public and not moderated. USE AT YOUR OWN RISK. To learn more about telex and the features it enables, please go to https://docs.flybywiresim.com/telex. Would you like to enable telex?',
        'small',
        () => NXDataStore.set('CONFIG_ONLINE_FEATURES_STATUS', 'ENABLED'),
        () => NXDataStore.set('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED'),
      );
      NXDataStore.set('TELEX_POPUP_SHOWN', 'true');
    }
  }
}
