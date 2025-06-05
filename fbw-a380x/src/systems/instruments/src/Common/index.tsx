/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import * as Defaults from './defaults';

/**
 * Use the given React element to render the instrument using React.
 */
export const render = (Slot: React.ReactElement) => {
  ReactDOM.render(Slot, Defaults.getRenderTarget());
};

/**
 * Computes time delta out of absolute env time and previous
 * time debounced on time shift.
 */
export const debouncedTimeDelta = (absTimeSeconds: number, prevTimeSeconds: number): number => {
  const diff = Math.max(absTimeSeconds - prevTimeSeconds, 0);
  // 60s detects forward time-shift
  return diff < 60 ? diff : 0;
};
