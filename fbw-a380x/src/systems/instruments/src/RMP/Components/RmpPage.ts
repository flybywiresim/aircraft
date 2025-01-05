// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ComponentProps, DisplayComponent, EventBus } from '@microsoft/msfs-sdk';

import { PageKeys } from '../Systems/KeypadController';

export interface RmpPage extends DisplayComponent<RmpPageProps> {
  setActive: (isActive: boolean) => void;
  onKeyPressed?: (key: PageKeys) => void;
  onKeyReleased?: (key: PageKeys) => void;
}

export interface RmpPageProps extends ComponentProps {
  bus: EventBus;
}
