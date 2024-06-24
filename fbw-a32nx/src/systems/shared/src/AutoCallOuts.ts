// Note there is a copy of these flags in `fbw-a32nx\src\base\flybywire-aircraft-a320-neo\html_ui\Pages\A32NX_Core\A32NX_GPWS.js` for legacy JS.
// Please keep that up to date if making any changes here.

/** Bit flags for the radio auto call outs (for CONFIG_A32NX_FWC_RADIO_AUTO_CALL_OUT_PINS). */
export enum A32NXRadioAutoCallOutFlags {
  TwoThousandFiveHundred = 1 << 0,
  TwentyFiveHundred = 1 << 1,
  TwoThousand = 1 << 2,
  OneThousand = 1 << 3,
  FiveHundred = 1 << 4,
  FourHundred = 1 << 5,
  ThreeHundred = 1 << 6,
  TwoHundred = 1 << 7,
  OneHundred = 1 << 8,
  Fifty = 1 << 9,
  Forty = 1 << 10,
  Thirty = 1 << 11,
  Twenty = 1 << 12,
  Ten = 1 << 13,
  Five = 1 << 14,
  FiveHundredGlide = 1 << 15,
}

/** The default (Airbus basic configuration) radio altitude auto call outs. */
export const A32NX_DEFAULT_RADIO_AUTO_CALL_OUTS =
  A32NXRadioAutoCallOutFlags.TwoThousandFiveHundred |
  A32NXRadioAutoCallOutFlags.OneThousand |
  A32NXRadioAutoCallOutFlags.FourHundred |
  A32NXRadioAutoCallOutFlags.Fifty |
  A32NXRadioAutoCallOutFlags.Forty |
  A32NXRadioAutoCallOutFlags.Thirty |
  A32NXRadioAutoCallOutFlags.Twenty |
  A32NXRadioAutoCallOutFlags.Ten |
  A32NXRadioAutoCallOutFlags.Five;
