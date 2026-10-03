// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { PopupUuid } from './PopupTypes';

export interface PopupEvents {
  /** The visible popup changed, or undefined if not popup is visible anymore. */
  popup_visible_uuid_changed: PopupUuid | string | undefined;
}
