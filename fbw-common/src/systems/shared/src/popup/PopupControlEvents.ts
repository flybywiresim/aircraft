// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { PopupDefinition } from './PopupTypes';

export interface PopupControlEvents {
  /** Adds a popup to the queue. If a popup already exists in the queue with this UUID, it will be replaced. */
  popup_enqueue_popup: PopupDefinition;
  /** Removes a popup from the queue by UUID. */
  popup_dequeue_popup: string;
}
