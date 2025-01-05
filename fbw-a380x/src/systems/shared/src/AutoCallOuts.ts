// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/** Bit flags for the radio auto call outs (for CONFIG_A380X_FWC_RADIO_AUTO_CALL_OUT_PINS). */
export enum A380XRadioAutoCallOutFlags {
  TwoThousandFiveHundred = 1 << 0,
  TwentyFiveHundred = 1 << 1,
  TwoThousand = 1 << 2,
  OneThousand = 1 << 3,
  FiveHundred = 1 << 4,
  FiveHundredGlide = 1 << 5,
  FourHundred = 1 << 6,
  ThreeHundred = 1 << 7,
  TwoHundred = 1 << 8,
  OneHundred = 1 << 9,

  Ninety = 1 << 10,
  Eighty = 1 << 11,
  Seventy = 1 << 12,
  Sixty = 1 << 13,
  Fifty = 1 << 14,
  Forty = 1 << 15,
  Thirty = 1 << 16,
  Twenty = 1 << 17,
  Ten = 1 << 18,
  Five = 1 << 19,
}

/** The default (Airbus basic configuration) radio altitude auto call outs. */
export const A380X_DEFAULT_RADIO_AUTO_CALL_OUTS =
  A380XRadioAutoCallOutFlags.TwoThousandFiveHundred |
  A380XRadioAutoCallOutFlags.OneThousand |
  A380XRadioAutoCallOutFlags.FourHundred |
  A380XRadioAutoCallOutFlags.Fifty |
  A380XRadioAutoCallOutFlags.Forty |
  A380XRadioAutoCallOutFlags.Thirty |
  A380XRadioAutoCallOutFlags.Twenty |
  A380XRadioAutoCallOutFlags.Ten |
  A380XRadioAutoCallOutFlags.Five;
