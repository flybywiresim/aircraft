// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export interface TcasComponent {
  init(): void;

  update(deltaTime: number): void;
}
