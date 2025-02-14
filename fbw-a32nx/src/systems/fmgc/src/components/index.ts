// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FcuSync } from '@fmgc/components/FcuSync';
import { ReadySignal } from '@fmgc/components/ReadySignal';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { FmgcComponent } from './FmgcComponent';
import { FmsMessages } from './fms-messages';
import { Navigation } from '../navigation/Navigation';
import { GuidanceController } from '../guidance/GuidanceController';

const fmsMessages = new FmsMessages();

const components: FmgcComponent[] = [fmsMessages, new ReadySignal(), new FcuSync()];

export function initComponents(
  navigation: Navigation,
  guidanceController: GuidanceController,
  flightPlanService: FlightPlanService,
): void {
  components.forEach((component) => component.init(navigation, guidanceController, flightPlanService));
}

export function updateComponents(deltaTime: number): void {
  components.forEach((component) => component.update(deltaTime));
}

export function recallMessageById(id: number) {
  fmsMessages.recallId(id);
}
