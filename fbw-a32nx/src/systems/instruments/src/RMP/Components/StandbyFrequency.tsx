// @ts-strict-ignore
// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useCallback, useRef } from 'react';
import {
  usePersistentProperty,
  RateMultiplierKnob,
  UpdateValueCallback,
  useInteractionEvent,
} from '@flybywiresim/fbw-sdk';
import { RadioPanelDisplay } from './RadioPanelDisplay';

declare const Utils; // this can also be replaced once /typings are available

export enum TransceiverType {
  RADIO_VHF,
  VOR,
  ILS,
  GLS,
  MLS,
  ADF,
}

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
   * Type of transceiver (e.g VHF, HF, VOR, ILS, MLS, ADF)
   */
  transceiver: TransceiverType;

  /**
   * A callback to set the current standby frequency value in Hz.
   */
  setValue: (x: any) => void;
}

/**
 * Find the nearest item in array to a given value.
 * @param value The value for which we want to find the nearest item.
 * @param array The array to find the nearest item from.
 * @returns The item of the array that is nearest to the given value.
 */
const findNearestInArray = (value: number, array: number[]): number =>
  array.reduce((previous, current) => (Math.abs(current - value) < Math.abs(previous - value) ? current : previous));

/**
 * The currently support channel spacings, in kHz.
 * Normal VHF communications use 8.33 kHz spacing.
 * High Frequency communications use 10 kHz spacing.
 * Vatsim VHF communications use 25 kHz spacing.
 * VOR / ILS frequencies use 50 kHz spacing.
 * ADF frequencies use 1kHz spacing.
 */
type ChannelSpacing = 8.33 | 10 | 25 | 50;

/**
 * Calculate the offset of a given frequency channel given a variable spacing.
 * For example, the offset of +2 in 8.33 spacing for the xxx.810 channel is xxx.825
 * @param spacing The spacing to be used to calculate the channels (e.g. 8.33).
 * @param channel The current channel e.g. for 122.305 MHz, the channel would be 305 kHz.
 * @param offset The integer offset to apply to this channel, e.g. +1, -1, +2, -2, etc.
 * @returns The new channel, e.g. 825 for initial channel of 810, offset of +2 and 8.33 spacing.
 */
const offsetFrequencyChannel = (spacing: ChannelSpacing, channel: number, offset: number): number => {
  // Determine endings from channel spacing.
  let endings: number[] | null = null;

  // 8.33 kHz Frequency Endings.
  if (spacing === 8.33) endings = [0, 5, 10, 15, 25, 30, 35, 40, 50, 55, 60, 65, 75, 80, 85, 90];
  // 25 kHz Frequency Endings.
  if (spacing === 25) endings = [0, 25, 50, 75];
  // High Frequency (HF) Endings.
  if (spacing === 10) endings = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
  // VOR/ILS Frequency Endings.
  if (spacing === 50) endings = [0, 50];

  // Special cases, such as ADF, do not use the ending algorithm to find frequencies.
  if (endings === null) {
    return Math.floor(channel % 100) + spacing * offset;
  }

  // Reverse the channel order if we're going backwards.
  if (offset < 0) {
    endings.reverse();
  }

  // For channel 456, front is 4.
  const front = Math.floor(channel / 100);

  // For channel 456, back is 56. Find the nearest valid channel.
  const back = findNearestInArray(Math.round(channel % 100), endings);

  // Find the index of the channel;
  const index = endings.indexOf(back);

  // Find the offset channel's index.
  const newIndex = index + Math.abs(offset);

  // Figure out how the front needs to change.
  // I.e. how many times did we go off the end of the endings array.
  const newFront = front + Math.floor(newIndex / endings.length) * Math.sign(offset);

  // Combine the calculated front and back to form the new channel.
  const newChannel = newFront * 100 + endings[newIndex % endings.length];

  // Modulo 1000 (i.e. -10 will become 990 for 8.33 spacing).
  return ((newChannel % 1000) + 1000) % 1000;
};

/**
 * Standby frequency radio management panel React component.
 * Hooks to outer and inner rotary encoder knobs.
 * Renders standby frequency RadioPanelDisplay sub-component.
 */
export const StandbyFrequency = (props: Props) => {
  let spacing: ChannelSpacing;
  let toMhz = 1000;

  switch (props.transceiver) {
    case TransceiverType.ILS:
      spacing = 25;
      break;
    case TransceiverType.VOR:
      spacing = 50;
      break;
    case TransceiverType.ADF:
      toMhz = 1;
      break;
    default:
      spacing = usePersistentProperty('RMP_VHF_SPACING_25KHZ', '0')[0] === '0' ? 8.33 : 25;
  }

  // Handle outer knob turned.
  const outerKnobUpdateCallback: UpdateValueCallback = useCallback(
    (offset) => {
      if (props.value !== 0) {
        let frequency = props.value;

        if (props.transceiver !== TransceiverType.ADF) {
          frequency = Math.round(frequency / 1000); // To kHz
        }

        const integer = Math.floor(frequency / 1000) + offset;

        // @todo determine min/max depending on mode.
        let newInteger = 0;
        if (props.transceiver === TransceiverType.RADIO_VHF) {
          newInteger = Utils.Clamp(integer, 118, 136);
        } else if (props.transceiver === TransceiverType.ILS) {
          newInteger = Utils.Clamp(integer, 108, 111);
        } else if (props.transceiver === TransceiverType.VOR) {
          newInteger = Utils.Clamp(integer, 108, 117);
        } else if (props.transceiver === TransceiverType.ADF) {
          newInteger = Utils.Clamp(integer, 190, 1750);
        }

        props.setValue((newInteger * 1000 + (frequency % 1000)) * toMhz);
      } else {
        props.setValue(0);
      }
    },
    [props.value],
  );

  // Handle inner knob turned.
  const innerKnobUpdateCallback: UpdateValueCallback = useCallback(
    (offset) => {
      if (props.value !== 0) {
        let frequency = props.value;

        if (props.transceiver !== TransceiverType.ADF) {
          frequency = Math.round(frequency / 1000); // To kHz
        }

        // Tested in real life:
        // Integer cannot return to 118 from 136 to the right
        // Decimal can return to 0 from 975 to the right
        const integer = Math.floor(frequency / 1000);
        let decimal = 0;

        if (props.transceiver !== TransceiverType.ADF) {
          decimal = offsetFrequencyChannel(spacing, frequency % 1000, offset);
        } else {
          // offsetFrequencyChannel does not fit ADF needs
          decimal = frequency % 1000 === 0 ? 500 : 0;
        }
        props.setValue((integer * 1000 + (decimal % 1000)) * toMhz);
      } else {
        props.setValue(0);
      }
    },
    [props.value],
  );

  // Used to change integer value of freq.
  const outerKnob = useRef(new RateMultiplierKnob());
  outerKnob.current.updateValue = outerKnobUpdateCallback;

  // Used to change decimal value of freq.
  const innerKnob = useRef(new RateMultiplierKnob());
  innerKnob.current.updateValue = innerKnobUpdateCallback;

  // Hook rotation events from simulator to custom knob class methods.
  useInteractionEvent(`A32NX_RMP_${props.side}_OUTER_KNOB_TURNED_CLOCKWISE`, () => outerKnob.current.increase());
  useInteractionEvent(`A32NX_RMP_${props.side}_OUTER_KNOB_TURNED_ANTICLOCKWISE`, () => outerKnob.current.decrease());
  useInteractionEvent(`A32NX_RMP_${props.side}_INNER_KNOB_TURNED_CLOCKWISE`, () => innerKnob.current.increase());
  useInteractionEvent(`A32NX_RMP_${props.side}_INNER_KNOB_TURNED_ANTICLOCKWISE`, () => innerKnob.current.decrease());

  return <RadioPanelDisplay value={props.value} />;
};
