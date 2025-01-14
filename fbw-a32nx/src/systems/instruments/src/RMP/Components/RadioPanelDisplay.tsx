// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { useSimVar } from '@flybywiresim/fbw-sdk';

interface Props {
  /**
   * The value to display.
   */
  value: number | string;
}

const TEXT_DATA_MODE_VHF3 = 'DATA';
const TEXT_DATA_MODE_VHF3_UNPOWERED = '------';

/**
 * Format the given frequency to be displayed.
 * @param frequency The given frequency number in Hz.
 * @returns The formated frequency string in 123.456
 */
const formatFrequency = (frequency: number): string => {
  // VHF, VOR, ILS
  if (frequency >= 108000000) {
    return (frequency / 1000000).toFixed(3).padEnd(7, '0');
  }

  // HF
  if (frequency >= 2000000) {
    return (frequency / 1000000).toFixed(3).padEnd(5, '0');
  }

  // ADF
  return (frequency / 1000).toFixed(1);
};

/**
 * Radio management panel seven-segment frequency/course display.
 * Hooks into lightsTest SimVar to show 888.888 when test is ON.
 * Renders the seven-segment display with the appropriate value.
 */
export function RadioPanelDisplay(props: Props) {
  const [lightsTest] = useSimVar('L:A32NX_OVHD_INTLT_ANN', 'Boolean', 1000);
  const [dc2IsPowered] = useSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Bool', 1000);
  const [DCBus1] = useSimVar('L:A32NX_ELEC_DC_1_BUS_IS_POWERED', 'boolean');

  let content: JSX.Element;

  if (lightsTest === 0 && dc2IsPowered) {
    content = (
      <text x="100%" y="52%">
        8.8.8.8.8.8
      </text>
    );
  } else if (typeof props.value === 'string') {
    content = (
      <text x="100%" y="52%">
        {props.value}
      </text>
    );
  } else if (props.value > 0) {
    content = (
      <text x="100%" y="52%">
        {formatFrequency(props.value)}
      </text>
    );
  } else if (DCBus1) {
    content = (
      <text x="85%" y="52%">
        {TEXT_DATA_MODE_VHF3}
      </text>
    );
  } else {
    content = (
      <text x="100%" y="52%">
        {TEXT_DATA_MODE_VHF3_UNPOWERED}
      </text>
    );
  }

  return <svg className="rmp-svg">{content}</svg>;
}
