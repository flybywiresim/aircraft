// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { LegacyAtsuPageInterface } from '../../legacy/LegacyAtsuPageInterface';
import { NXSystemMessages } from '../../messages/NXSystemMessages';

/**
 * Iterates through all 6 LSK actions and adds "KEY NOT ACTIVE" scratchpad message on click on the ones which do not have an action assigned.
 * @param mcdu page to add the actions to
 */
export function setKeyNotActiveLskActions(page: LegacyAtsuPageInterface): void {
  for (let i = 0; i < 6; i++) {
    if (page.onLeftInput[i] === undefined) {
      page.onLeftInput[i] = () => page.setScratchpadMessage(NXSystemMessages.keyNotActive);
    }
  }
  for (let i = 0; i < 6; i++) {
    if (page.onRightInput[i] === undefined) {
      page.onRightInput[i] = () => page.setScratchpadMessage(NXSystemMessages.keyNotActive);
    }
  }
}
