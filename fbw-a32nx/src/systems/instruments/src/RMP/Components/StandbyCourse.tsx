// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useCallback, useRef } from 'react';
import { RateMultiplierKnob, UpdateValueCallback, useInteractionEvent } from '@flybywiresim/fbw-sdk';
import { RadioPanelDisplay } from './RadioPanelDisplay';

interface Props {
  /**
   * The RMP side (e.g. 'L' or 'R').
   */
  side: string;

  /**
   * The current standby frequency value in Hz.
   */
  value: number;

  /**
   * A callback to set the current standby frequency value in Hz.
   */
  setValue: (x: any) => void;
}

/**
 * Standby frequency radio management panel React component.
 * Hooks to outer and inner rotary encoder knobs.
 * Renders standby frequency RadioPanelDisplay sub-component.
 */
export const StandbyCourse = (props: Props) => {
  // Handle inner knob turned.
  const innerKnobUpdateCallback: UpdateValueCallback = useCallback(
    (offset) => {
      const integer = Math.floor((props.value + offset) / 360);
      props.setValue(props.value - integer * 360 + offset);
    },
    [props.value],
  );

  // Used to change decimal value of freq.
  const innerKnob = useRef(new RateMultiplierKnob(200, 1));
  innerKnob.current.updateValue = innerKnobUpdateCallback;

  // Hook rotation events from simulator to custom knob class methods.
  useInteractionEvent(`A32NX_RMP_${props.side}_INNER_KNOB_TURNED_CLOCKWISE`, () => innerKnob.current.increase());
  useInteractionEvent(`A32NX_RMP_${props.side}_INNER_KNOB_TURNED_ANTICLOCKWISE`, () => innerKnob.current.decrease());

  return <RadioPanelDisplay value={`C-${Math.abs(props.value).toString().padStart(3, '0')}`} />;
};
